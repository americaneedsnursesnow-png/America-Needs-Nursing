/**
 * On-disk / S3 object key layout under `UPLOADS_DIR` (default `./uploads`).
 * Public URLs use prefix `/files/` locally, or `S3_PUBLIC_BASE_URL/<key>` on S3.
 */
export const UPLOADS_FOLDER_LAYOUT = `
uploads/                          ← UPLOADS_DIR (local) or S3 bucket root keys
├── nurse-resumes/                ← PDF resumes (private; API streams downloads)
│   └── {name-slug}-{userId8}/    ← e.g. jane-doe-a1b2c3d4/
│       └── resume-{hash16}.pdf
├── profile-photos/               ← Nurse profile photo + banner
│   └── {userId}/                 ← UUID
│       ├── photo-{hash12}.{ext}
│       └── banner-{hash12}.{ext}
├── blog-images/                  ← Blog editor uploads + cover images
│   └── {clientFolder}/           ← tenant slug, e.g. ann/
│       └── img-{hash12}.{ext}
├── company-images/
│   ├── logos/{clientFolder}/
│   │   └── img-{hash12}.{ext}
│   └── heroes/{clientFolder}/
│       └── img-{hash12}.{ext}
└── nurse-communities/            ← Community cover images
    └── {communityIdNoDashes}-{timestamp}.{ext}
`.trim();

export const UPLOADS_DB_COLUMNS: ReadonlyArray<{
  table: string;
  column: string;
  description: string;
}> = [
  { table: 'nurse_profiles', column: 'resume_url', description: 'Nurse resume PDF' },
  {
    table: 'users',
    column: 'profile_photo_url',
    description: 'Account profile photo',
  },
  {
    table: 'users',
    column: 'profile_banner_url',
    description: 'Nurse profile banner',
  },
  { table: 'companies', column: 'logo_url', description: 'Company logo' },
  { table: 'companies', column: 'hero_image_url', description: 'Company hero' },
  { table: 'blog_posts', column: 'cover_image_url', description: 'Blog cover' },
  {
    table: 'nurse_communities',
    column: 'image_url',
    description: 'Community image',
  },
];
