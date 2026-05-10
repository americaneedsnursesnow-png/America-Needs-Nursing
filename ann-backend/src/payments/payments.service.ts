import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import Stripe from 'stripe';
import { Repository } from 'typeorm';

type StripeClient = InstanceType<typeof Stripe>;
type StripeWebhookEvent = ReturnType<
  StripeClient['webhooks']['constructEvent']
>;
import type { JwtUserPayload } from '../auth/types/jwt-user-payload';
import { Company, JobPackage } from '../database/entities';
import { JobPackagesService } from '../job-packages/job-packages.service';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import {
  describeBelowStripeMinimum,
  stripeMinimumChargeUnits,
} from './stripe-min-charge-units';

@Injectable()
export class PaymentsService {
  private readonly stripe: StripeClient | null;
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(Company)
    private readonly companiesRepository: Repository<Company>,
    private readonly jobPackagesService: JobPackagesService,
  ) {
    const key = this.config.get<string>('STRIPE_SECRET_KEY')?.trim();
    this.stripe = key ? new Stripe(key) : null;
  }

  async createCheckoutSession(
    user: JwtUserPayload,
    dto: CreateCheckoutSessionDto,
  ): Promise<{ url: string } | { clientSecret: string }> {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }
    const company = await this.companiesRepository.findOne({
      where: { employerUserId: user.sub, clientName: user.clientName },
    });
    if (!company) {
      throw new NotFoundException(
        'Create a company profile before purchasing a package',
      );
    }
    const pkg = await this.jobPackagesService.findActiveForCheckout(
      user.clientName,
      dto.packageId,
    );
    const defaultBase =
      this.config.get<string>('FRONTEND_URL')?.trim() ??
      'http://localhost:3000';
    const successUrl =
      dto.successUrl ?? `${defaultBase}/dashboard?checkout=success`;
    const cancelUrl =
      dto.cancelUrl ?? `${defaultBase}/dashboard?checkout=cancel`;

    const lineItems = this.buildCheckoutLineItems(pkg);
    const metadata = {
      clientName: user.clientName,
      companyId: company.id,
      packageId: pkg.id,
      employerUserId: user.sub,
    };
    const branding_settings = this.checkoutBranding();

    let session: Awaited<
      ReturnType<StripeClient['checkout']['sessions']['create']>
    >;
    try {
      if (dto.embedded) {
        const return_url =
          dto.successUrl ??
          `${defaultBase}/dashboard/employee/package/profile?checkout=success&session_id={CHECKOUT_SESSION_ID}`;
        session = await this.stripe.checkout.sessions.create({
          ui_mode: 'embedded_page',
          mode: 'payment',
          line_items: lineItems,
          return_url,
          metadata,
          branding_settings,
        });
        const clientSecret = session.client_secret;
        if (!clientSecret) {
          throw new BadRequestException(
            'Stripe did not return a client secret for embedded checkout',
          );
        }
        return { clientSecret };
      }

      session = await this.stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: lineItems,
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata,
        branding_settings,
      });
    } catch (err: unknown) {
      if (err instanceof Stripe.errors.StripeInvalidRequestError) {
        throw new BadRequestException(err.message);
      }
      throw err;
    }
    if (!session.url) {
      throw new BadRequestException('Stripe did not return a checkout URL');
    }
    return { url: session.url };
  }

  /** Aligns embedded/hosted Checkout with site palette (--color-button red, white shell). */
  private checkoutBranding() {
    const displayName =
      this.config.get<string>('STRIPE_CHECKOUT_DISPLAY_NAME')?.trim() ??
      'America Needs Nurses';
    return {
      background_color: '#ffffff',
      button_color: '#dc2626',
      border_style: 'rounded' as const,
      font_family: 'inter' as const,
      display_name: displayName,
    };
  }

  /**
   * Stripe `line_items[].price` must be a Price id (`price_…`).
   * Digits-only values or an empty field mean “use catalog”: `price_data` + `unit_amount`.
   */
  private buildCheckoutLineItems(pkg: JobPackage) {
    const ref = pkg.stripePriceId?.trim() ?? '';
    const currency = (pkg.currency ?? 'usd').trim().toLowerCase();

    if (/^price_[A-Za-z0-9]+$/.test(ref)) {
      return [{ price: ref, quantity: 1 }];
    }

    if (/^prod_[A-Za-z0-9]+$/.test(ref)) {
      throw new BadRequestException(
        'stripePriceId must be a Price id (price_…), not a Product id (prod_…). Create a price in Stripe Dashboard, paste price_… here, or leave the field empty to charge using priceCents (price_data).',
      );
    }

    if (
      ref !== '' &&
      !/^\d+$/.test(ref)
    ) {
      throw new BadRequestException(
        `stripePriceId "${ref}" is not valid. Use a Stripe Price id (price_…), whole-number cents only (e.g. 3500 for $35.00 USD), or leave empty to use the package priceCents.`,
      );
    }

    const unitAmount = /^\d+$/.test(ref) ? parseInt(ref, 10) : pkg.priceCents;
    const minUnits = stripeMinimumChargeUnits(currency);
    if (minUnits !== undefined && unitAmount < minUnits) {
      throw new BadRequestException(
        describeBelowStripeMinimum({
          currency,
          unitAmount,
          minUnits,
          packageName: pkg.name,
          amountReference: ref || String(pkg.priceCents),
        }),
      );
    }

    return [
      {
        quantity: 1,
        price_data: {
          currency,
          unit_amount: unitAmount,
          product_data: {
            name: pkg.name,
            ...(pkg.description
              ? { description: pkg.description.slice(0, 450) }
              : {}),
          },
        },
      },
    ];
  }

  async handleStripeWebhook(
    signature: string | undefined,
    rawBody: Buffer,
  ): Promise<{ received: true }> {
    const secret = this.config.get<string>('STRIPE_WEBHOOK_SECRET')?.trim();
    if (!this.stripe || !secret) {
      this.logger.warn('Stripe webhook called but Stripe is not configured');
      throw new BadRequestException();
    }
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }
    let event: StripeWebhookEvent;
    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, secret);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'invalid payload';
      this.logger.warn(`Stripe webhook signature failed: ${msg}`);
      throw new BadRequestException('Invalid Stripe signature');
    }

    if (event.type === 'checkout.session.completed') {
      await this.onCheckoutSessionCompleted(event.data.object);
    }

    return { received: true };
  }

  private async onCheckoutSessionCompleted(session: {
    metadata?: Record<string, string> | null;
  }): Promise<void> {
    const meta = session.metadata ?? {};
    const clientName = meta.clientName;
    const companyId = meta.companyId;
    const packageId = meta.packageId;
    if (!clientName || !companyId || !packageId) {
      this.logger.warn('checkout.session.completed missing metadata');
      return;
    }

    const company = await this.companiesRepository.findOne({
      where: { id: companyId, clientName },
    });
    if (!company) {
      this.logger.warn(`Company ${companyId} not found for Stripe webhook`);
      return;
    }

    let pkg;
    try {
      pkg = await this.jobPackagesService.ensureBelongsToClient(
        packageId,
        clientName,
      );
    } catch {
      this.logger.warn(`Package ${packageId} invalid for webhook`);
      return;
    }

    company.jobPackageId = packageId;
    company.jobPackageExpiresAt = null;
    company.partnershipFeatured = pkg.featuredCompanyListing;
    await this.companiesRepository.save(company);
  }
}
