import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { JwtUserPayload } from '../auth/types/jwt-user-payload';
import { CompaniesService } from '../companies/companies.service';
import { CompanyFollow, Job, SavedJob, UserRole } from '../database/entities';

@Injectable()
export class EngagementService {
  constructor(
    @InjectRepository(SavedJob)
    private readonly savedJobsRepository: Repository<SavedJob>,
    @InjectRepository(CompanyFollow)
    private readonly followsRepository: Repository<CompanyFollow>,
    @InjectRepository(Job)
    private readonly jobsRepository: Repository<Job>,
    private readonly companiesService: CompaniesService,
  ) {}

  async saveJob(user: JwtUserPayload, jobId: string): Promise<SavedJob> {
    if (user.role !== UserRole.NURSE) {
      throw new ForbiddenException();
    }
    const job = await this.jobsRepository.findOne({
      where: { id: jobId, clientName: user.clientName },
    });
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    const exists = await this.savedJobsRepository.exist({
      where: { nurseUserId: user.sub, jobId: job.id },
    });
    if (exists) {
      throw new ConflictException('Already saved');
    }
    return this.savedJobsRepository.save(
      this.savedJobsRepository.create({
        nurseUserId: user.sub,
        jobId: job.id,
        clientName: user.clientName,
      }),
    );
  }

  async unsaveJob(user: JwtUserPayload, jobId: string): Promise<void> {
    if (user.role !== UserRole.NURSE) {
      throw new ForbiddenException();
    }
    await this.savedJobsRepository.delete({
      nurseUserId: user.sub,
      jobId,
    });
  }

  async listSavedJobs(user: JwtUserPayload): Promise<SavedJob[]> {
    if (user.role !== UserRole.NURSE) {
      throw new ForbiddenException();
    }
    return this.savedJobsRepository.find({
      where: { nurseUserId: user.sub, clientName: user.clientName },
      relations: ['job', 'job.company'],
      order: { createdAt: 'DESC' },
    });
  }

  async followCompany(
    user: JwtUserPayload,
    companyId: string,
  ): Promise<CompanyFollow> {
    if (user.role !== UserRole.NURSE) {
      throw new ForbiddenException();
    }
    await this.companiesService.findByIdOrThrow(companyId, user.clientName);
    const exists = await this.followsRepository.exist({
      where: { nurseUserId: user.sub, companyId },
    });
    if (exists) {
      throw new ConflictException('Already following');
    }
    return this.followsRepository.save(
      this.followsRepository.create({
        nurseUserId: user.sub,
        companyId,
        clientName: user.clientName,
      }),
    );
  }

  async unfollowCompany(
    user: JwtUserPayload,
    companyId: string,
  ): Promise<void> {
    if (user.role !== UserRole.NURSE) {
      throw new ForbiddenException();
    }
    await this.followsRepository.delete({
      nurseUserId: user.sub,
      companyId,
    });
  }

  async listFollows(user: JwtUserPayload): Promise<CompanyFollow[]> {
    if (user.role !== UserRole.NURSE) {
      throw new ForbiddenException();
    }
    return this.followsRepository.find({
      where: { nurseUserId: user.sub, clientName: user.clientName },
      relations: ['company'],
      order: { createdAt: 'DESC' },
    });
  }
}
