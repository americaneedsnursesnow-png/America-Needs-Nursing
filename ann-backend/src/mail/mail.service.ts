import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import * as nodemailer from 'nodemailer';

import { uniqueEmailRecipients } from './email-recipients.util';

const BCC_CHUNK = 45;
type MailProvider = 'smtp' | 'ses';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter | null;
  private readonly sesClient: SESClient | null;
  private readonly provider: MailProvider | null;

  constructor(private readonly config: ConfigService) {
    this.transporter = null;
    this.sesClient = null;
    this.provider = null;

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

  /** Single-recipient transactional mail (e.g. password reset). */
  async sendHtmlTo(to: string, subject: string, html: string): Promise<void> {
    if (!this.provider) {
      this.logger.warn(`Email not configured; skipping email to ${to}`);
      return;
    }
    const from = this.getFromAddress();
    try {
      if (this.provider === 'smtp' && this.transporter) {
        await this.transporter.sendMail({
          from,
          to: to.trim(),
          subject,
          html,
        });
      } else if (this.provider === 'ses' && this.sesClient) {
        await this.sesClient.send(
          new SendEmailCommand({
            Source: from,
            Destination: {
              ToAddresses: [to.trim()],
            },
            Message: {
              Subject: {
                Data: subject,
                Charset: 'UTF-8',
              },
              Body: {
                Html: {
                  Data: html,
                  Charset: 'UTF-8',
                },
              },
            },
          }),
        );
      }
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
  ): Promise<void> {
    const unique = uniqueEmailRecipients(recipients);
    if (!this.provider || unique.length === 0) {
      return;
    }

    const from = this.getFromAddress();

    for (let i = 0; i < unique.length; i += BCC_CHUNK) {
      const bcc = unique.slice(i, i + BCC_CHUNK);
      try {
        if (this.provider === 'smtp' && this.transporter) {
          await this.transporter.sendMail({
            from,
            to: from,
            bcc,
            subject,
            html,
          });
        } else if (this.provider === 'ses' && this.sesClient) {
          await this.sesClient.send(
            new SendEmailCommand({
              Source: from,
              Destination: {
                ToAddresses: [from],
                BccAddresses: bcc,
              },
              Message: {
                Subject: {
                  Data: subject,
                  Charset: 'UTF-8',
                },
                Body: {
                  Html: {
                    Data: html,
                    Charset: 'UTF-8',
                  },
                },
              },
            }),
          );
        }
      } catch (err) {
        this.logger.error(
          `Failed to send mail batch ${i / BCC_CHUNK + 1}`,
          err instanceof Error ? err.stack : String(err),
        );
      }
    }
  }
}
