import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from '../database/entities';
import { DEFAULT_FREE_TIER_JOB_POSTS_PER_MONTH } from '../common/free-tier-jobs';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly clientsRepository: Repository<Client>,
  ) {}

  async getFreeTierJobPostsPerMonthByClientName(
    clientName: string,
  ): Promise<number> {
    const row = await this.clientsRepository.findOne({
      where: { name: clientName },
    });
    if (!row) {
      return DEFAULT_FREE_TIER_JOB_POSTS_PER_MONTH;
    }
    const n = row.freeTierJobPostsPerMonth;
    return Number.isFinite(n) && n >= 0
      ? n
      : DEFAULT_FREE_TIER_JOB_POSTS_PER_MONTH;
  }

  /**
   * Staff: read current tenant (JWT `clientName`) free-tier cap.
   */
  async getPlatformSettingsForClientName(clientName: string): Promise<{
    freeTierJobPostsPerMonth: number;
  }> {
    return {
      freeTierJobPostsPerMonth:
        await this.getFreeTierJobPostsPerMonthByClientName(clientName),
    };
  }

  /**
   * Staff: update the monthly free publish cap. Ensures a `clients` row exists
   * (same pattern as user registration `Client` upsert).
   */
  async setFreeTierJobPostsPerMonthForClientName(
    clientName: string,
    value: number,
  ): Promise<{ freeTierJobPostsPerMonth: number }> {
    const matches = await this.clientsRepository.find({
      where: { name: clientName },
      take: 2,
    });
    if (matches.length > 1) {
      throw new ConflictException(
        'Multiple clients share this name; assign a unique client name first',
      );
    }
    if (matches.length === 0) {
      const created = await this.clientsRepository.save(
        this.clientsRepository.create({
          name: clientName,
          freeTierJobPostsPerMonth: value,
        } as Client),
      );
      return { freeTierJobPostsPerMonth: created.freeTierJobPostsPerMonth };
    }
    const client = matches[0]!;
    client.freeTierJobPostsPerMonth = value;
    const saved = await this.clientsRepository.save(client);
    return { freeTierJobPostsPerMonth: saved.freeTierJobPostsPerMonth };
  }
}
