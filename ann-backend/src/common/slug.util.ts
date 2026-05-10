import { randomBytes } from 'crypto';

export function slugify(input: string): string {
  const s = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
  return s.length > 0 ? s : 'item';
}

export function uniqueSlugFromTitle(title: string): string {
  return `${slugify(title)}-${randomBytes(4).toString('hex')}`;
}
