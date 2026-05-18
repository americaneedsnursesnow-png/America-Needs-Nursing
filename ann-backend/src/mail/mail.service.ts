import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SESClient, SendRawEmailCommand } from '@aws-sdk/client-ses';
import type { SendMailOptions } from 'nodemailer';
import * as nodemailer from 'nodemailer';

import { uniqueEmailRecipients } from './email-recipients.util';
import { htmlToPlainText } from './html-to-plain-text';
import {
  buildListUnsubscribeHeader,
  extractEmailAddress,
} from './mail-envelope.util';

const BCC_CHUNK = 45;
type MailProvider = 'smtp' | 'ses';

export type MailSendOptions = {
  /** HTTPS unsubscribe URL for bulk/marketing (List-Unsubscribe header). */
  listUnsubscribeUrl?: string;
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter | null;
  private readonly sesClient: SESClient | null;
  private readonly provider: MailProvider | null;
  private readonly sesConfigurationSet: string | undefined;

  constructor(private readonly config: ConfigService) {
    this.transporter = null;
    this.sesClient = null;
    this.provider = null;
    this.sesConfigurationSet =
      this.config.get<string>('MAIL_SES_CONFIGURATION_SET')?.trim() ||
      undefined;

    const configuredProvider = (
      this.config.get<string>('MAIL_PROVIDER')?.trim().toLowerCase() ?? 'smtp'
    ) as MailProvider;

    if (configuredProvider === 'ses') {
      const region = this.config.get<string>('AWS_SES_REGION')?.trim();
      if (!region) {
        this.logger.warn(
          'MAIL_PROVIDER=ses but AWS_SES_REGION not set — outbound email is disabled',
        );
        return;
      }

      const accessKeyId = this.config.get<string>('AWS_ACCESS_KEY_ID')?.trim();
      const secretAccessKey = this.config
        .get<string>('AWS_SECRET_ACCESS_KEY')
        ?.trim();

      this.sesClient = new SESClient({
        region,
        credentials:
          accessKeyId && secretAccessKey
            ? {
                accessKeyId,
                secretAccessKey,
              }
            : undefined,
      });
      this.provider = 'ses';
      return;
    }

    const host = this.config.get<string>('SMTP_HOST')?.trim();
    if (!host) {
      this.logger.warn('SMTP_HOST not set — outbound email is disabled');
      return;
    }

    const port = parseInt(
      this.config.get<string>('SMTP_PORT')?.trim() ?? '587',
      10,
    );
    const user = this.config.get<string>('SMTP_USER')?.trim();
    const pass = this.config.get<string>('SMTP_PASS')?.trim();
    const secure =
      this.config.get<string>('SMTP_SECURE')?.trim().toLowerCase() === 'true';

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth:
        user && pass
          ? {
              user,
              pass,
            }
          : undefined,
    });
    this.provider = 'smtp';
  }

  isEnabled(): boolean {
    return this.provider !== null;
  }

  private getFromAddress(): string {
    return (
      this.config.get<string>('MAIL_FROM')?.trim() ??
      this.config.get<string>('SMTP_USER')?.trim() ??
      'noreply@localhost'
    );
  }

  private getReplyTo(): string | undefined {
    return this.config.get<string>('MAIL_REPLY_TO')?.trim() || undefined;
  }

  private buildHeaders(options?: MailSendOptions): Record<string, string> | undefined {
    const listUnsub = buildListUnsubscribeHeader(
      options?.listUnsubscribeUrl,
      this.config.get<string>('MAIL_LIST_UNSUBSCRIBE_MAILTO')?.trim(),
    );
    if (!listUnsub) return undefined;
    return { 'List-Unsubscribe': listUnsub };
  }

  private async deliver(
    mail: SendMailOptions,
    destinations: string[],
  ): Promise<void> {
    const html = typeof mail.html === 'string' ? mail.html : '';
    const text =
      typeof mail.text === 'string' && mail.text.length > 0
        ? mail.text
        : htmlToPlainText(html);

    const payload: SendMailOptions = {
      ...mail,
      text,
      replyTo: mail.replyTo ?? this.getReplyTo(),
    };

    if (this.provider === 'smtp' && this.transporter) {
      await this.transporter.sendMail(payload);
      return;
    }

    if (this.provider === 'ses' && this.sesClient) {
      const compileTransport = nodemailer.createTransport({
        streamTransport: true,
        buffer: true,
        newline: 'unix',
      });
      const info = await compileTransport.sendMail(payload);
      const raw = info.message as Buffer;
      const cmd = new SendRawEmailCommand({
        Source: extractEmailAddress(String(payload.from)),
        Destinations: destinations,
        RawMessage: { Data: raw },
        ...(this.sesConfigurationSet
          ? { ConfigurationSetName: this.sesConfigurationSet }
          : {}),
      });
      await this.sesClient.send(cmd);
    }
  }

  /** Single-recipient transactional mail (e.g. password reset). */
  async sendHtmlTo(
    to: string,
    subject: string,
    html: string,
    options?: MailSendOptions,
  ): Promise<void> {
    if (!this.provider) {
      this.logger.warn(`Email not configured; skipping email to ${to}`);
      return;
    }
    const from = this.getFromAddress();
    const recipient = to.trim();
    try {
      await this.deliver(
        {
          from,
          to: recipient,
          subject,
          html,
          headers: this.buildHeaders(options),
        },
        [recipient],
      );
    } catch (err) {
      this.logger.error(
        `Failed to send mail to ${to}`,
        err instanceof Error ? err.stack : String(err),
      );
      throw err;
    }
  }

  /**
   * Sends one message per BCC chunk (same subject/body) to avoid provider limits.
   * Recipients are de-duplicated (case-insensitive) so each address gets at most one email.
   */
  async sendBulkBcc(
    recipients: string[],
    subject: string,
    html: string,
    options?: MailSendOptions,
  ): Promise<void> {
    const unique = uniqueEmailRecipients(recipients);
    if (!this.provider || unique.length === 0) {
      return;
    }

    const from = this.getFromAddress();
    const envelopeFrom = extractEmailAddress(from);

    for (let i = 0; i < unique.length; i += BCC_CHUNK) {
      const bcc = unique.slice(i, i + BCC_CHUNK);
      const destinations = [envelopeFrom, ...bcc];
      try {
        await this.deliver(
          {
            from,
            to: from,
            bcc,
            subject,
            html,
            headers: this.buildHeaders(options),
          },
          destinations,
        );
      } catch (err) {
        this.logger.error(
          `Failed to send mail batch ${i / BCC_CHUNK + 1}`,
          err instanceof Error ? err.stack : String(err),
        );
      }
    }
  }
}
