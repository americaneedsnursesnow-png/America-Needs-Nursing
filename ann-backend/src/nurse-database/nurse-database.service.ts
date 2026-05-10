import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { JwtUserPayload } from '../auth/types/jwt-user-payload';
import { NurseDatabaseRecord } from '../database/entities';
import { BulkImportNurseRecordsDto } from './dto/bulk-import-nurse-records.dto';

@Injectable()
export class NurseDatabaseService {
  constructor(
    @InjectRepository(NurseDatabaseRecord)
    private readonly repo: Repository<NurseDatabaseRecord>,
  ) {}

  async bulkImport(
    user: JwtUserPayload,
    dto: BulkImportNurseRecordsDto,
  ): Promise<{ inserted: number }> {
    const rows = dto.records.map((r) =>
      this.repo.create({
        clientName: user.clientName,
        data: r.data,
      }),
    );
    await this.repo.save(rows);
    return { inserted: rows.length };
  }

  async list(
    user: JwtUserPayload,
    take = 100,
    skip = 0,
  ): Promise<NurseDatabaseRecord[]> {
    return this.repo.find({
      where: { clientName: user.clientName },
      order: { createdAt: 'DESC' },
      take: Math.min(take, 500),
      skip,
    });
  }
}
