import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { getConfigNumber } from '../common/utils/env.util';
import { Client, NurseProfile, User, UserRole } from '../database/entities';
import { NewsletterService } from '../newsletter/newsletter.service';

const BCRYPT_ROUNDS = 10;
/** Default password for accounts created via admin CSV import. */
const BULK_NURSE_CSV_DEFAULT_PASSWORD = 'ann12345@';
const MAX_CSV_BYTES = 5 * 1024 * 1024;
/** See `NURSE_CSV_IMPORT_MAX_EMAILS` in `.env` (default 10,000). */
const DEFAULT_NURSE_CSV_MAX_EMAILS = 10_000;

const EMAIL_IN_TEXT =
  /[A-Za-z0-9](?:[A-Za-z0-9._%+-]*[A-Za-z0-9])?@[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?\.[A-Za-z]{2,}/g;

function normalizeAndDedupeEmails(raw: string, maxDistinct: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const m of raw.matchAll(EMAIL_IN_TEXT)) {
    const e = m[0].toLowerCase().trim();
    if (e.length > 320) continue;
    if (seen.has(e)) continue;
    seen.add(e);
    out.push(e);
  }
  if (out.length > maxDistinct) {
    throw new BadRequestException(
      `Too many distinct emails (${out.length}). The server limit is ${maxDistinct}. ` +
        'No accounts were created. Set NURSE_CSV_IMPORT_MAX_EMAILS=10000 (or higher) in the API .env, then restart the server.',
    );
  }
  return out;
}

export type NurseCsvImportItemResult = {
  email: string;
  status: 'created' | 'skipped' | 'failed';
  message?: string;
};

export type NurseCsvImportResult = {
  defaultPassword: string;
  totalEmailsFound: number;
  created: number;
  skipped: number;
  failed: number;
  results: NurseCsvImportItemResult[];
};

@Injectable()
export class NurseImportService {
  private readonly logger = new Logger(NurseImportService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly newsletterService: NewsletterService,
    private readonly config: ConfigService,
  ) {}

  async importNursesFromCsv(
    file: { buffer: Buffer; size: number; mimetype?: string } | undefined,
    clientName: string,
  ): Promise<NurseCsvImportResult> {
    if (!file?.buffer?.length) {
      throw new BadRequestException('CSV file is required');
    }
    if (file.size > MAX_CSV_BYTES) {
      throw new BadRequestException('File must be 5 MB or smaller');
    }

    const text = file.buffer.toString('utf-8');
    if (!text.trim()) {
      throw new BadRequestException('File is empty');
    }

    const maxDistinct = getConfigNumber(
      this.config,
      'NURSE_CSV_IMPORT_MAX_EMAILS',
      DEFAULT_NURSE_CSV_MAX_EMAILS,
      1,
    );
    const emails = normalizeAndDedupeEmails(text, maxDistinct);
    if (emails.length === 0) {
      throw new BadRequestException('No valid email addresses found in file');
    }

    const passwordHash = await bcrypt.hash(
      BULK_NURSE_CSV_DEFAULT_PASSWORD,
      BCRYPT_ROUNDS,
    );
    const tenant = clientName.trim();
    if (!tenant) {
      throw new BadRequestException('Client name is missing from session');
    }

    const results: NurseCsvImportItemResult[] = [];
    let created = 0;
    let skipped = 0;
    let failed = 0;

    for (const email of emails) {
      try {
        const action = await this.createOrSkipNurseInTransaction(
          tenant,
          email,
          passwordHash,
        );
        if (action === 'skipped') {
          results.push({ email, status: 'skipped' });
          skipped += 1;
        } else {
          try {
            await this.newsletterService.ensureSubscriber(tenant, email);
          } catch (err: unknown) {
            this.logger.warn(
              `ensureSubscriber failed for ${email}`,
              err instanceof Error ? err.stack : String(err),
            );
          }
          results.push({ email, status: 'created' });
          created += 1;
        }
      } catch (err: unknown) {
        failed += 1;
        const message =
          err instanceof Error
            ? err.message
            : 'Failed to create account for this address';
        results.push({ email, status: 'failed', message });
        this.logger.warn(
          `CSV import failed for ${email}: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }
    }

    return {
      defaultPassword: BULK_NURSE_CSV_DEFAULT_PASSWORD,
      totalEmailsFound: emails.length,
      created,
      skipped,
      failed,
      results,
    };
  }

  private async createOrSkipNurseInTransaction(
    clientName: string,
    email: string,
    passwordHash: string,
  ): Promise<'created' | 'skipped'> {
    return this.usersRepository.manager.transaction(async (manager) => {
      const clientRepo = manager.getRepository(Client);
      const userRepo = manager.getRepository(User);
      const profileRepo = manager.getRepository(NurseProfile);

      const matchingClients = await clientRepo.find({
        where: { name: clientName },
        take: 2,
      });
      if (matchingClients.length > 1) {
        throw new ConflictException(
          'Multiple clients share this name; assign a unique client name first',
        );
      }
      if (matchingClients.length === 0) {
        await clientRepo.save(clientRepo.create({ name: clientName }));
      }

      const exists = await userRepo.exist({ where: { clientName, email } });
      if (exists) {
        return 'skipped';
      }

      const createdUser = await userRepo.save(
        userRepo.create({
          clientName,
          email,
          role: UserRole.NURSE,
          passwordHash,
        }),
      );

      await profileRepo.save(
        profileRepo.create({
          userId: createdUser.id,
          clientName,
          specialization: null,
          licenseNumber: null,
          yearsExperience: null,
          resumeUrl: null,
          communityVerified: true,
        }),
      );

      return 'created';
    });
  }
}
