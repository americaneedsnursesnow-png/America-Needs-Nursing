import type { User } from '../database/entities';

/** Removes `passwordHash` in-place so admin list endpoints never return it. */
export function stripUserPasswordForResponse(u: User | null | undefined): void {
  if (!u) {
    return;
  }
  delete (u as { passwordHash?: string | null }).passwordHash;
}
