import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createReadStream } from 'fs';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import type { JwtUserPayload } from '../auth/types/jwt-user-payload';
import { CompaniesService } from '../companies/companies.service';
import {
  ApplicationStatus,
  JobApplication,
  NurseProfile,
  UserRole,
} from '../database/entities';
import { JobsService } from '../jobs/jobs.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NurseProfilesService } from '../nurse-profiles/nurse-profiles.service';
import { ApplyJobDto } from './dto/apply-job.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(JobApplication)
    private readonly applicationsRepository: Repository<JobApplication>,
    @InjectRepository(NurseProfile)
    private readonly nurseProfilesRepository: Repository<NurseProfile>,
    private readonly jobsService: JobsService,
    private readonly companiesService: CompaniesService,
    private readonly notificationsService: NotificationsService,
    private readonly nurseProfilesService: NurseProfilesService,
  ) {}

  async apply(
    user: JwtUserPayload,
    jobId: string,
    dto: ApplyJobDto,
  ): Promise<JobApplication> {
    if (user.role !== UserRole.NURSE) {
      throw new ForbiddenException('Only nurses can apply');
    }

    const job = await this.jobsService.findPublishedWithCompany(
      jobId,
      user.clientName,
    );

    const exists = await this.applicationsRepository.exist({
      where: { jobId: job.id, nurseUserId: user.sub },
    });
    if (exists) {
      throw new ConflictException('You already applied to this job');
    }

    const application = await this.applicationsRepository.save(
      this.applicationsRepository.create({
        clientName: user.clientName,
        jobId: job.id,
        nurseUserId: user.sub,
        coverLetter: dto.coverLetter?.trim() ?? null,
        status: ApplicationStatus.PENDING,
      }),
    );

    const company = await this.companiesService.findByIdOrThrow(
      job.companyId,
      user.clientName,
    );

    await this.notificationsService.create(
      company.employerUserId,
      user.clientName,
      'application_received',
      'New job application',
      `A nurse applied to "${job.title}".`,
      { applicationId: application.id, jobId: job.id },
    );

    return application;
  }

  async listMine(user: JwtUserPayload): Promise<JobApplication[]> {
    if (user.role !== UserRole.NURSE) {
      throw new ForbiddenException();
    }
    return this.applicationsRepository.find({
      where: { nurseUserId: user.sub, clientName: user.clientName },
      relations: ['job', 'job.company'],
      order: { createdAt: 'DESC' },
    });
  }

  async listForJobEmployer(
    user: JwtUserPayload,
    jobId: string,
  ): Promise<
    Array<{
      id: string;
      clientName: string;
      jobId: string;
      nurseUserId: string;
      status: ApplicationStatus;
      coverLetter: string | null;
      createdAt: Date;
      updatedAt: Date;
      nurse?: {
        id: string;
        email: string;
        fullName: string | null;
        resumeUrl: string | null;
      };
    }>
  > {
    if (user.role !== UserRole.COMPANY) {
      throw new ForbiddenException();
    }
    const job = await this.jobsService.getEmployerJob(user, jobId);
    const apps = await this.applicationsRepository.find({
      where: { jobId: job.id, clientName: user.clientName },
      relations: ['nurse'],
      order: { createdAt: 'DESC' },
    });
    const nurseIds = [...new Set(apps.map((a) => a.nurseUserId))];
    const profiles =
      nurseIds.length === 0
        ? []
        : await this.nurseProfilesRepository.find({
            where: {
              clientName: user.clientName,
              userId: In(nurseIds),
            },
          });
    const resumeByNurse = new Map(
      profiles.map((p) => [p.userId, p.resumeUrl] as const),
    );

    return apps.map((a) => ({
      id: a.id,
      clientName: a.clientName,
      jobId: a.jobId,
      nurseUserId: a.nurseUserId,
      status: a.status,
      coverLetter: a.coverLetter,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
      nurse: a.nurse
        ? {
            id: a.nurse.id,
            email: a.nurse.email,
            fullName: a.nurse.fullName,
            resumeUrl: resumeByNurse.get(a.nurseUserId) ?? null,
          }
        : undefined,
    }));
  }

  async getNurseResumePdfForEmployer(
    user: JwtUserPayload,
    applicationId: string,
  ): Promise<{
    stream: ReturnType<typeof createReadStream>;
    filename: string;
  }> {
    if (user.role !== UserRole.COMPANY) {
      throw new ForbiddenException();
    }
    const application = await this.applicationsRepository.findOne({
      where: { id: applicationId, clientName: user.clientName },
      relations: ['job', 'job.company'],
    });
    if (!application?.job?.company) {
      throw new NotFoundException('Application not found');
    }
    await this.jobsService.getEmployerJob(user, application.jobId);
    return this.nurseProfilesService.getResumeReadStreamForNurseUser(
      application.nurseUserId,
      user.clientName,
    );
  }

  async updateStatusEmployer(
    user: JwtUserPayload,
    applicationId: string,
    dto: UpdateApplicationStatusDto,
  ): Promise<JobApplication> {
    if (user.role !== UserRole.COMPANY) {
      throw new ForbiddenException();
    }
    const application = await this.applicationsRepository.findOne({
      where: { id: applicationId, clientName: user.clientName },
      relations: ['job'],
    });
    if (!application?.job) {
      throw new NotFoundException('Application not found');
    }
    await this.jobsService.getEmployerJob(user, application.jobId);

    application.status = dto.status;
    const saved = await this.applicationsRepository.save(application);

    await this.notificationsService.create(
      application.nurseUserId,
      user.clientName,
      'application_status',
      'Application update',
      `Your application status is now ${dto.status}.`,
      { applicationId: application.id },
    );

    return saved;
  }

  async getForParticipant(
    user: JwtUserPayload,
    applicationId: string,
  ): Promise<JobApplication> {
    const application = await this.applicationsRepository.findOne({
      where: { id: applicationId, clientName: user.clientName },
      relations: ['job', 'job.company'],
    });
    if (!application?.job?.company) {
      throw new NotFoundException('Application not found');
    }
    const isNurse =
      user.role === UserRole.NURSE && application.nurseUserId === user.sub;
    const isEmployer =
      user.role === UserRole.COMPANY &&
      application.job.company.employerUserId === user.sub;
    if (!isNurse && !isEmployer) {
      throw new ForbiddenException();
    }
    return application;
  }
}
