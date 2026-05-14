import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import Stripe from 'stripe';
import { Repository } from 'typeorm';

type StripeClient = InstanceType<typeof Stripe>;
import type { JwtUserPayload } from '../auth/types/jwt-user-payload';
import { CompaniesService } from '../companies/companies.service';
import { Company, JobPackage } from '../database/entities';
import { JobPackagesService } from '../job-packages/job-packages.service';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { addOneCalendarMonthUtc } from './job-package-billing-period';
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
    private readonly companiesService: CompaniesService,
  ) {
    const key = this.config.get<string>('STRIPE_SECRET_KEY')?.trim();
    this.stripe = key ? new Stripe(key) : null;
  }

  async createCheckoutSession(
    user: JwtUserPayload,
    dto: CreateCheckoutSessionDto,
  ): Promise<
    | { url: string; clientSecret?: undefined; sessionId?: undefined }
    | { clientSecret: string; sessionId: string; url?: undefined }
  > {
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
    await this.companiesService.expireJobPackageIfNeeded(company);
    const pkg = await this.jobPackagesService.findActiveForCheckout(
      user.clientName,
      dto.packageId,
    );
    const samePlanStillActive =
      company.jobPackageId === pkg.id &&
      (!company.jobPackageExpiresAt ||
        company.jobPackageExpiresAt.getTime() > Date.now());
    if (samePlanStillActive) {
      throw new BadRequestException(
        'This plan is already active on your account. You can purchase it again after it expires.',
      );
    }
    const defaultBase =
      this.config.get<string>('FRONTEND_URL')?.trim() ??
      'http://localhost:3000';
    const successUrl =
      dto.successUrl ??
      `${defaultBase}/dashboard/employee/package/profile?checkout=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl =
      dto.cancelUrl ??
      `${defaultBase}/dashboard/employee/package/profile?checkout=cancel`;

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
        return { clientSecret, sessionId: session.id };
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

  /**
   * Checkout Session can lag `payment_status` behind a succeeded PaymentIntent.
   * If `expand` still leaves `payment_intent` as an id string, we retrieve the PI.
   */
  private async isCheckoutSessionPaymentCaptured(
    session: Awaited<
      ReturnType<StripeClient['checkout']['sessions']['retrieve']>
    >,
  ): Promise<boolean> {
    const ps = session.payment_status ?? '';
    if (ps === 'paid' || ps === 'no_payment_required') {
      return true;
    }
    let pi: unknown = session.payment_intent;
    if (typeof pi === 'string' && pi.length > 0 && this.stripe) {
      pi = await this.stripe.paymentIntents.retrieve(pi);
    }
    if (
      pi &&
      typeof pi === 'object' &&
      'status' in pi &&
      (pi as { status?: string }).status === 'succeeded'
    ) {
      return true;
    }
    return false;
  }

  private formatCheckoutSessionPaymentDebug(
    session: Awaited<
      ReturnType<StripeClient['checkout']['sessions']['retrieve']>
    >,
    paymentIntent?: { status?: string } | null,
  ): string {
    const piStatus =
      paymentIntent?.status ??
      (session.payment_intent &&
      typeof session.payment_intent === 'object' &&
      'status' in session.payment_intent
        ? String(
            (session.payment_intent as { status?: string }).status ?? 'unknown',
          )
        : typeof session.payment_intent === 'string'
          ? `id_only(${session.payment_intent.slice(0, 12)}…)`
          : 'none');
    return `session.status=${session.status ?? 'unknown'} payment_status=${session.payment_status ?? 'unknown'} payment_intent.status=${piStatus}`;
  }

  private async assertCheckoutSessionPaymentCaptured(
    session: Awaited<
      ReturnType<StripeClient['checkout']['sessions']['retrieve']>
    >,
  ): Promise<void> {
    if (await this.isCheckoutSessionPaymentCaptured(session)) {
      return;
    }
    let piForMsg: { status?: string } | null = null;
    let pi: unknown = session.payment_intent;
    if (typeof pi === 'string' && pi.length > 0 && this.stripe) {
      try {
        piForMsg = await this.stripe.paymentIntents.retrieve(pi);
      } catch {
        piForMsg = null;
      }
    } else if (pi && typeof pi === 'object') {
      piForMsg = pi as { status?: string };
    }
    const detail = this.formatCheckoutSessionPaymentDebug(session, piForMsg);
    throw new BadRequestException(
      `Checkout is not settled yet (${detail}). Wait a few seconds and use Refresh, or contact support if this persists.`,
    );
  }

  /**
   * Embedded Checkout can fire the client "complete" callback before Stripe's
   * session object shows `paid` / a succeeded PaymentIntent. Poll briefly.
   */
  private async retrieveCheckoutSessionWhenPaymentCaptured(
    sessionId: string,
  ): Promise<
    Awaited<ReturnType<StripeClient['checkout']['sessions']['retrieve']>>
  > {
    const stripe = this.stripe!;
    const maxAttempts = 22;
    const delayMs = 550;
    let session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent'],
    });
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (await this.isCheckoutSessionPaymentCaptured(session)) {
        return session;
      }
      if (attempt < maxAttempts - 1) {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, delayMs);
        });
        session = await stripe.checkout.sessions.retrieve(sessionId, {
          expand: ['payment_intent'],
        });
      }
    }
    await this.assertCheckoutSessionPaymentCaptured(session);
    throw new Error(
      'retrieveCheckoutSessionWhenPaymentCaptured: expected assert to throw',
    );
  }

  private async applyPaidJobPackageFromCheckoutMetadata(
    params: {
      clientName: string;
      companyId: string;
      packageId: string;
    },
    paidAt: Date,
  ): Promise<void> {
    const { clientName, companyId, packageId } = params;

    const company = await this.companiesRepository.findOne({
      where: { id: companyId, clientName },
    });
    if (!company) {
      this.logger.warn(`Company ${companyId} not found for Stripe checkout`);
      throw new NotFoundException(
        'Company for this checkout was not found. Check that you are on the correct account.',
      );
    }

    await this.companiesService.expireJobPackageIfNeeded(company);

    const pkg = await this.jobPackagesService.ensureBelongsToClient(
      packageId,
      clientName,
    );

    company.jobPackageId = packageId;
    company.lastPurchasedJobPackageId = packageId;
    const expiresAt = addOneCalendarMonthUtc(paidAt);
    company.jobPackageExpiresAt = expiresAt;
    company.partnershipFeatured = pkg.featuredCompanyListing;
    company.subscriptionPlanName = pkg.name;
    company.subscriptionExpiresAt = expiresAt;
    await this.companiesRepository.save(company);
    this.logger.log(
      `Stripe checkout applied job package ${packageId} to company ${companyId} (${clientName})`,
    );
  }

  /**
   * After the browser confirms Checkout succeeded, the client calls this with the
   * Checkout Session id (`cs_…`). We retrieve the session from Stripe, verify
   * payment, and persist the purchased job package on the company.
   */
  async syncCheckoutSessionForEmployer(
    user: JwtUserPayload,
    sessionId: string,
  ): Promise<{ ok: true }> {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }
    const sid = sessionId.trim();
    const session = await this.retrieveCheckoutSessionWhenPaymentCaptured(sid);
    const meta = session.metadata ?? {};
    const norm = (v: string | undefined | null) => (v ?? '').trim().toLowerCase();
    if (
      norm(meta.clientName) !== norm(user.clientName) ||
      norm(meta.employerUserId) !== norm(user.sub)
    ) {
      throw new ForbiddenException(
        'This checkout session does not belong to your account.',
      );
    }
    const companyId = meta.companyId?.trim();
    const packageId = meta.packageId?.trim();
    if (!companyId || !packageId) {
      throw new BadRequestException('Checkout session is missing package metadata.');
    }
    const created = session.created ?? Math.floor(Date.now() / 1000);
    const paidAt = new Date(created * 1000);
    await this.applyPaidJobPackageFromCheckoutMetadata(
      { clientName: user.clientName, companyId, packageId },
      paidAt,
    );
    return { ok: true };
  }

  isStripeConfigured(): boolean {
    return this.stripe !== null;
  }

  /**
   * Recent Checkout sessions for this tenant (metadata.clientName), newest first.
   * Used for admin payment history; not a full financial ledger.
   */
  async listRecentCheckoutSessionsForClient(
    clientName: string,
    limit: number,
  ): Promise<
    Array<{
      sessionId: string;
      createdAt: string;
      amountTotalCents: number | null;
      currency: string | null;
      paymentStatus: string;
      companyId: string | null;
      packageId: string | null;
    }>
  > {
    if (!this.stripe) {
      return [];
    }
    const want = Math.min(50, Math.max(1, limit));
    const matches: Array<{
      sessionId: string;
      createdAt: string;
      amountTotalCents: number | null;
      currency: string | null;
      paymentStatus: string;
      companyId: string | null;
      packageId: string | null;
    }> = [];
    let startingAfter: string | undefined;
    for (let page = 0; page < 8 && matches.length < want; page++) {
      const res = await this.stripe.checkout.sessions.list({
        limit: 100,
        starting_after: startingAfter,
      });
      for (const s of res.data) {
        if (s.metadata?.clientName === clientName) {
          matches.push({
            sessionId: s.id,
            createdAt: new Date(s.created * 1000).toISOString(),
            amountTotalCents: s.amount_total,
            currency: s.currency ?? null,
            paymentStatus: s.payment_status,
            companyId: s.metadata?.companyId ?? null,
            packageId: s.metadata?.packageId ?? null,
          });
          if (matches.length >= want) {
            break;
          }
        }
      }
      if (!res.has_more || res.data.length === 0) {
        break;
      }
      startingAfter = res.data[res.data.length - 1]!.id;
    }
    return matches;
  }
}
