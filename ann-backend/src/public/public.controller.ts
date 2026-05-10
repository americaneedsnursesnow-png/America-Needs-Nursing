import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import {
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { DEFAULT_CLIENT_NAME } from '../common/constants';
import { BlogService } from '../blog/blog.service';
import { CompaniesService } from '../companies/companies.service';
import { JobsService } from '../jobs/jobs.service';
import { parsePublicPagination } from './parse-public-pagination';

@Controller('public')
@UseInterceptors(CacheInterceptor)
export class PublicController {
  constructor(
    private readonly companiesService: CompaniesService,
    private readonly jobsService: JobsService,
    private readonly blogService: BlogService,
  ) {}

  @Get('companies')
  @CacheTTL(45_000)
  listCompanies(
    @Query('clientName', new DefaultValuePipe(DEFAULT_CLIENT_NAME))
    clientName: string,
    @Query('page', new DefaultValuePipe('1')) pageRaw: string,
    @Query('limit', new DefaultValuePipe('20')) limitRaw: string,
  ) {
    const { page, limit } = parsePublicPagination(pageRaw, limitRaw, {
      defaultLimit: 20,
    });
    return this.companiesService.listPublicApproved(
      clientName.trim(),
      page,
      limit,
    );
  }

  @Get('companies/featured')
  @CacheTTL(45_000)
  listFeaturedCompanies(
    @Query('clientName', new DefaultValuePipe(DEFAULT_CLIENT_NAME))
    clientName: string,
    @Query('page', new DefaultValuePipe('1')) pageRaw: string,
    @Query('limit', new DefaultValuePipe('10')) limitRaw: string,
  ) {
    const { page, limit } = parsePublicPagination(pageRaw, limitRaw, {
      defaultLimit: 10,
      maxLimit: 50,
    });
    return this.companiesService.listPublicPackageFeaturedCompanies(
      clientName.trim(),
      page,
      limit,
    );
  }

  @Get('companies/:slug')
  @CacheTTL(45_000)
  async getCompany(
    @Param('slug') slug: string,
    @Query('clientName', new DefaultValuePipe(DEFAULT_CLIENT_NAME))
    clientName: string,
    @Query('jobPage', new DefaultValuePipe('1')) jobPageRaw: string,
    @Query('jobLimit', new DefaultValuePipe('20')) jobLimitRaw: string,
  ) {
    const c = clientName.trim();
    const company = await this.companiesService.getPublicApprovedBySlug(
      c,
      slug,
    );
    const { page, limit } = parsePublicPagination(jobPageRaw, jobLimitRaw, {
      defaultLimit: 20,
    });
    const jobsPage = await this.jobsService.listPublishedJobsForCompany(
      c,
      company.id,
      page,
      limit,
    );
    return { company, jobs: jobsPage.items, jobsMeta: jobsPage.meta };
  }

  @Get('jobs')
  @CacheTTL(30_000)
  listJobs(
    @Query('clientName', new DefaultValuePipe(DEFAULT_CLIENT_NAME))
    clientName: string,
    @Query('page', new DefaultValuePipe('1')) pageRaw: string,
    @Query('limit', new DefaultValuePipe('20')) limitRaw: string,
  ) {
    const { page, limit } = parsePublicPagination(pageRaw, limitRaw, {
      defaultLimit: 20,
      maxLimit: 100,
    });
    return this.jobsService.listPublicPublished(clientName.trim(), page, limit);
  }

  @Get('jobs/map-markers')
  @CacheTTL(60_000)
  listJobMapMarkers(
    @Query('clientName', new DefaultValuePipe(DEFAULT_CLIENT_NAME))
    clientName: string,
    @Query('limit', new DefaultValuePipe('400')) limitRaw: string,
  ) {
    const parsed = Number.parseInt(String(limitRaw ?? ''), 10);
    const take = Number.isFinite(parsed) ? parsed : 400;
    return this.jobsService.listPublicMapMarkers(clientName.trim(), take);
  }

  @Get('jobs/:slug')
  @CacheTTL(60_000)
  getJob(
    @Param('slug') slug: string,
    @Query('clientName', new DefaultValuePipe(DEFAULT_CLIENT_NAME))
    clientName: string,
  ) {
    return this.jobsService.getPublicPublishedBySlug(clientName.trim(), slug);
  }

  @Get('blog/posts')
  @CacheTTL(60_000)
  listBlog(
    @Query('clientName', new DefaultValuePipe(DEFAULT_CLIENT_NAME))
    clientName: string,
    @Query('page', new DefaultValuePipe('1')) pageRaw: string,
    @Query('limit', new DefaultValuePipe('20')) limitRaw: string,
  ) {
    const { page, limit } = parsePublicPagination(pageRaw, limitRaw, {
      defaultLimit: 20,
    });
    return this.blogService.listPublishedPublic(clientName.trim(), page, limit);
  }

  @Get('blog/posts/:slug')
  @CacheTTL(120_000)
  getBlogPost(
    @Param('slug') slug: string,
    @Query('clientName', new DefaultValuePipe(DEFAULT_CLIENT_NAME))
    clientName: string,
  ) {
    return this.blogService.getPublishedBySlugPublic(clientName.trim(), slug);
  }
}
