import 'reflect-metadata';
import * as bcrypt from 'bcrypt';
import dataSource from '../database/data-source';
import {
  BlogPost,
  BlogPostStatus,
  Client,
  Company,
  CompanyApprovalStatus,
  Job,
  JobEmploymentType,
  JobLevel,
  JobStatus,
  User,
  UserRole,
} from '../database/entities';

const CLIENT_NAME = process.env.SEED_CLIENT_NAME?.trim() || 'ann';
const EMPLOYER_EMAIL =
  process.env.SEED_EMPLOYER_EMAIL?.trim() || 'seed-employer@ann.local';
const EMPLOYER_PASSWORD =
  process.env.SEED_EMPLOYER_PASSWORD?.trim() || 'SeedEmployer1!';

const COMPANY_SLUG = 'metro-community-health';
const COMPANY_NAME = 'Metro Community Health';

const DEMO_JOBS: Array<{
  title: string;
  slug: string;
  description: string;
  requirements: string;
  location: string;
  featured: boolean;
  employmentType: JobEmploymentType;
  jobLevel: JobLevel;
  jobCategory: string;
}> = [
  {
    title: 'ICU Registered Nurse',
    slug: 'icu-registered-nurse-austin',
    description:
      'Join our 24-bed ICU serving a Level II trauma center. We use evidence-based protocols, dedicated intensivist coverage, and a strong preceptor program for new hires.\n\nShift options include 12-hour days/nights with self-scheduling after probation.',
    requirements:
      'Active RN license (TX or compact). BLS, ACLS. 1+ years ICU preferred; new grads considered with capstone ICU rotation.',
    location: 'Austin, TX',
    featured: true,
    employmentType: JobEmploymentType.FULL_TIME,
    jobLevel: JobLevel.MID,
    jobCategory: 'Critical care (ICU)',
  },
  {
    title: 'Medical–Surgical Staff Nurse',
    slug: 'med-surg-staff-nurse-chicago',
    description:
      'Full-time position on a 32-bed med-surg unit with telemetry. Collaborative team culture, union representation, and tuition reimbursement.',
    requirements:
      'Illinois RN license. BLS required. Med-surg experience preferred.',
    location: 'Chicago, IL',
    featured: false,
    employmentType: JobEmploymentType.FULL_TIME,
    jobLevel: JobLevel.ENTRY,
    jobCategory: 'Med-Surg',
  },
  {
    title: 'Travel RN — Emergency Department',
    slug: 'travel-rn-emergency-denver',
    description:
      '13-week contract with extension options. High-acuity ED; Epic EMR. Housing stipend or company housing available.',
    requirements:
      '2+ years recent ED experience. BLS, ACLS, PALS. Compact or CO license.',
    location: 'Denver, CO',
    featured: true,
    employmentType: JobEmploymentType.CONTRACT,
    jobLevel: JobLevel.SENIOR,
    jobCategory: 'Emergency (ED)',
  },
];

const DEMO_POSTS: Array<{
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  metaTitle: string;
  metaDescription: string;
  sponsored: boolean;
}> = [
  {
    title: 'NCLEX Strategies That Actually Work in 2026',
    slug: 'nclex-strategies-2026',
    excerpt:
      'How to structure your final weeks of study, manage test-day anxiety, and use practice exams without burning out.',
    body:
      'Passing the NCLEX is less about memorizing every fact and more about thinking like a safe, entry-level nurse.\n\n' +
      '1. **Focus on application questions.** Spend at least 60% of your time on SATA and priority questions—not pure recall.\n\n' +
      '2. **One full practice exam per week** in the last month, under timed conditions. Review every rationale, even for questions you got right.\n\n' +
      '3. **Sleep and hydration** affect performance as much as cramming. Protect your baseline the week before the exam.\n\n' +
      'You have already done the hard work of nursing school. Trust your clinical judgment and read each question twice.',
    metaTitle: 'NCLEX Study Tips 2026 | America Needs Nurses',
    metaDescription:
      'Practical NCLEX preparation tips: question strategy, practice exams, and test-day habits.',
    sponsored: false,
  },
  {
    title: 'Recognizing Burnout Early—And What to Do About It',
    slug: 'nurse-burnout-early-signs',
    excerpt:
      'Burnout is common but not inevitable. Here are warning signs and steps you can take while staying in bedside nursing.',
    body:
      'Burnout often starts as cynicism or emotional exhaustion before you notice physical symptoms.\n\n' +
      '**Early signs:** dreading shifts you used to tolerate, irritability with coworkers, or feeling detached from patients.\n\n' +
      '**Small interventions:** protect one full day off without charting or email, use your PTO, and talk to a mentor or EAP.\n\n' +
      'If you are safe at work but struggling, changing units or employers can help more than leaving the profession entirely.',
    metaTitle: 'Nurse Burnout: Early Signs and Coping | ANN',
    metaDescription:
      'Identify nurse burnout early and explore practical steps before leaving the profession.',
    sponsored: false,
  },
  {
    title: 'Specialties in Highest Demand This Year',
    slug: 'nursing-specialties-in-demand',
    excerpt:
      'From critical care to community health—where employers are hiring and what credentials help you stand out.',
    body:
      'Hiring remains strong in **ICU, ED, OR, and labor & delivery**, with growing need in **home health and ambulatory infusion**.\n\n' +
      'Certifications (CCRN, CEN, etc.) often move your application to the top of the pile, but willingness to work off-shifts still drives many offers.\n\n' +
      'Use your job search to ask about ratios, floating policies, and orientation length—those factors predict satisfaction more than salary alone.',
    metaTitle: 'In-Demand Nursing Specialties',
    metaDescription:
      'Overview of nursing specialties with strong hiring demand and useful certifications.',
    sponsored: true,
  },
];

async function ensureClient(manager: typeof dataSource.manager): Promise<void> {
  const repo = manager.getRepository(Client);
  const found = await repo.findOne({ where: { name: CLIENT_NAME } });
  if (!found) {
    await repo.save(repo.create({ name: CLIENT_NAME }));
    console.log(`Created client "${CLIENT_NAME}"`);
  }
}

async function ensureEmployerAndCompany(
  manager: typeof dataSource.manager,
): Promise<Company> {
  const userRepo = manager.getRepository(User);
  const companyRepo = manager.getRepository(Company);

  let user = await userRepo.findOne({
    where: { clientName: CLIENT_NAME, email: EMPLOYER_EMAIL },
  });
  if (!user) {
    const passwordHash = await bcrypt.hash(EMPLOYER_PASSWORD, 10);
    user = await userRepo.save(
      userRepo.create({
        clientName: CLIENT_NAME,
        email: EMPLOYER_EMAIL,
        passwordHash,
        role: UserRole.COMPANY,
      }),
    );
    console.log(
      `Created employer user ${EMPLOYER_EMAIL} (password: ${EMPLOYER_PASSWORD})`,
    );
  }

  let company = await companyRepo.findOne({
    where: { employerUserId: user.id },
  });
  if (!company) {
    company = await companyRepo.save(
      companyRepo.create({
        clientName: CLIENT_NAME,
        employerUserId: user.id,
        name: COMPANY_NAME,
        slug: COMPANY_SLUG,
        description:
          'Regional nonprofit health system focused on accessible primary and specialty care.',
        contactEmail: 'careers@metro-community-health.example',
        contactPhone: '+1-555-0100',
        approvalStatus: CompanyApprovalStatus.APPROVED,
        subscriptionPlanName: 'Demo partner subscription',
        subscriptionExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      }),
    );
    console.log(`Created approved company "${COMPANY_NAME}" (${COMPANY_SLUG})`);
  } else if (company.approvalStatus !== CompanyApprovalStatus.APPROVED) {
    company.approvalStatus = CompanyApprovalStatus.APPROVED;
    await companyRepo.save(company);
    console.log(`Updated company approval to APPROVED`);
  }

  return company;
}

async function seedJobs(
  manager: typeof dataSource.manager,
  companyId: string,
): Promise<void> {
  const jobRepo = manager.getRepository(Job);
  const now = new Date();
  const farFuture = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);

  for (const row of DEMO_JOBS) {
    const exists = await jobRepo.exist({
      where: { clientName: CLIENT_NAME, slug: row.slug },
    });
    if (exists) {
      console.log(`Skip job (exists): ${row.slug}`);
      continue;
    }
    await jobRepo.save(
      jobRepo.create({
        clientName: CLIENT_NAME,
        companyId,
        title: row.title,
        slug: row.slug,
        description: row.description,
        requirements: row.requirements,
        location: row.location,
        employmentType: row.employmentType,
        jobLevel: row.jobLevel,
        jobCategory: row.jobCategory,
        status: JobStatus.PUBLISHED,
        featured: row.featured,
        adminReviewRequired: false,
        approvedForListing: true,
        expiresAt: farFuture,
        createdAt: now,
        updatedAt: now,
      }),
    );
    console.log(`Inserted job: ${row.slug}`);
  }
}

async function seedBlog(manager: typeof dataSource.manager): Promise<void> {
  const blogRepo = manager.getRepository(BlogPost);
  const now = new Date();

  for (const row of DEMO_POSTS) {
    const exists = await blogRepo.exist({
      where: { clientName: CLIENT_NAME, slug: row.slug },
    });
    if (exists) {
      console.log(`Skip blog (exists): ${row.slug}`);
      continue;
    }
    await blogRepo.save(
      blogRepo.create({
        clientName: CLIENT_NAME,
        title: row.title,
        slug: row.slug,
        body: row.body,
        excerpt: row.excerpt,
        metaTitle: row.metaTitle,
        metaDescription: row.metaDescription,
        sponsored: row.sponsored,
        status: BlogPostStatus.PUBLISHED,
        publishedAt: now,
        createdAt: now,
        updatedAt: now,
      }),
    );
    console.log(`Inserted blog post: ${row.slug}`);
  }
}

async function main(): Promise<void> {
  await dataSource.initialize();
  try {
    await dataSource.transaction(async (manager) => {
      await ensureClient(manager);
      const company = await ensureEmployerAndCompany(manager);
      await seedJobs(manager, company.id);
      await seedBlog(manager);
    });
    console.log('Seed completed.');
  } finally {
    await dataSource.destroy();
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
