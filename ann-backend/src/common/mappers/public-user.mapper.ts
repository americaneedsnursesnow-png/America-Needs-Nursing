import { User, UserRole } from '../../database/entities';

/** Safe JSON shape for clients (no secrets). */
export type PublicUserDto = {
  id: string;
  clientName: string;
  email: string;
  role: UserRole;
  fullName: string | null;
  profilePhotoUrl: string | null;
  profileBannerUrl: string | null;
  description: string | null;
  cultureText: string | null;
  createdAt: Date;
  /** Present for nurses: ISO timestamp when community access was revoked, else null. */
  communityBannedAt: string | null;
};

export function toPublicUser(
  user: User,
  nurseProfile?: { communityBannedAt: Date | null } | null,
): PublicUserDto {
  const base = {
    id: user.id,
    clientName: user.clientName,
    email: user.email,
    role: user.role,
    fullName: user.fullName ?? null,
    profilePhotoUrl: user.profilePhotoUrl?.trim()
      ? user.profilePhotoUrl.trim()
      : null,
    profileBannerUrl: user.profileBannerUrl?.trim()
      ? user.profileBannerUrl.trim()
      : null,
    description: user.description ?? null,
    cultureText: user.cultureText ?? null,
    createdAt: user.createdAt,
  };
  if (user.role === UserRole.NURSE) {
    const at = nurseProfile?.communityBannedAt ?? null;
    return {
      ...base,
      communityBannedAt: at ? at.toISOString() : null,
    };
  }
  return { ...base, communityBannedAt: null };
}
