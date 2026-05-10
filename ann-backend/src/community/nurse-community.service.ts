import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { JwtUserPayload } from '../auth/types/jwt-user-payload';
import { NurseCommunity, NurseCommunityMember, User, UserRole } from '../database/entities';
import { CommunityService } from './community.service';
import { CreateNurseCommunityDto } from './dto/create-nurse-community.dto';
import { UpdateNurseCommunityDto } from './dto/update-nurse-community.dto';

export type NurseCommunityListItem = {
  id: string;
  clientName: string;
  creatorUserId: string;
  name: string;
  description: string;
  rules: string;
  imageUrl: string | null;
  createdAt: string;
  memberCount: number;
  isMember: boolean;
  isOwner: boolean;
};

export type NurseCommunityDetail = NurseCommunityListItem & {
  updatedAt: string;
  creatorEmail: string;
};

@Injectable()
export class NurseCommunityService {
  constructor(
    @InjectRepository(NurseCommunity)
    private readonly communityRepo: Repository<NurseCommunity>,
    @InjectRepository(NurseCommunityMember)
    private readonly memberRepo: Repository<NurseCommunityMember>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly communityService: CommunityService,
  ) {}

  private async assertNurseOrAdmin(user: JwtUserPayload): Promise<void> {
    if (user.role === UserRole.SUPER_ADMIN) {
      return;
    }
    await this.communityService.ensureCommunityParticipant(user);
  }

  private isOwner(community: NurseCommunity, userId: string): boolean {
    return community.creatorUserId === userId;
  }

  async listForNurse(
    user: JwtUserPayload,
  ): Promise<{ items: NurseCommunityListItem[]; myCommunity: NurseCommunityListItem | null }> {
    await this.assertNurseOrAdmin(user);
    const clientName = user.clientName;

    const raw = await this.communityRepo
      .createQueryBuilder('c')
      .where('c.clientName = :clientName', { clientName })
      .orderBy('c.createdAt', 'DESC')
      .getMany();

    const items: NurseCommunityListItem[] = [];
    for (const c of raw) {
      const memberCount = await this.memberRepo.count({
        where: { communityId: c.id },
      });
      const isMember = await this.isUserMember(c.id, user.sub);
      items.push(this.toListItem(c, memberCount, isMember, user.sub));
    }

    let myCommunity: NurseCommunityListItem | null = null;
    const owned = await this.communityRepo.findOne({
      where: { clientName, creatorUserId: user.sub },
    });
    if (owned) {
      const memberCount = await this.memberRepo.count({
        where: { communityId: owned.id },
      });
      myCommunity = this.toListItem(
        owned,
        memberCount,
        true,
        user.sub,
      );
    }

    return { items, myCommunity };
  }

  private toListItem(
    c: NurseCommunity,
    memberCount: number,
    isMember: boolean,
    viewerId: string,
  ): NurseCommunityListItem {
    return {
      id: c.id,
      clientName: c.clientName,
      creatorUserId: c.creatorUserId,
      name: c.name,
      description: c.description,
      rules: c.rules,
      imageUrl: c.imageUrl,
      createdAt: c.createdAt.toISOString(),
      memberCount,
      isMember,
      isOwner: c.creatorUserId === viewerId,
    };
  }

  private async isUserMember(
    communityId: string,
    userId: string,
  ): Promise<boolean> {
    const m = await this.memberRepo.findOne({ where: { communityId, userId } });
    return Boolean(m);
  }

  async getOne(user: JwtUserPayload, id: string): Promise<NurseCommunityDetail> {
    await this.assertNurseOrAdmin(user);
    const c = await this.communityRepo.findOne({
      where: { id, clientName: user.clientName },
    });
    if (!c) {
      throw new NotFoundException('Community not found');
    }
    const creator = await this.userRepo.findOne({ where: { id: c.creatorUserId } });
    const memberCount = await this.memberRepo.count({
      where: { communityId: c.id },
    });
    const isMember = await this.isUserMember(c.id, user.sub);
    return {
      ...this.toListItem(
        c,
        memberCount,
        isMember,
        user.sub,
      ),
      updatedAt: c.updatedAt.toISOString(),
      creatorEmail: creator?.email ?? '',
    };
  }

  async create(
    user: JwtUserPayload,
    dto: CreateNurseCommunityDto,
  ): Promise<NurseCommunityListItem> {
    if (user.role !== UserRole.NURSE && user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only nurses can create a community');
    }
    await this.assertNurseOrAdmin(user);

    const existing = await this.communityRepo.findOne({
      where: { clientName: user.clientName, creatorUserId: user.sub },
    });
    if (existing) {
      throw new ConflictException('You can only own one community at a time');
    }

    const row = await this.communityRepo.save(
      this.communityRepo.create({
        clientName: user.clientName,
        creatorUserId: user.sub,
        name: dto.name.trim(),
        description: dto.description.trim(),
        rules: dto.rules.trim(),
        imageUrl: null,
      }),
    );

    await this.memberRepo.save(
      this.memberRepo.create({ communityId: row.id, userId: user.sub }),
    );

    return this.toListItem(row, 1, true, user.sub);
  }

  async update(
    user: JwtUserPayload,
    id: string,
    dto: UpdateNurseCommunityDto,
  ): Promise<NurseCommunityListItem> {
    await this.assertNurseOrAdmin(user);
    const c = await this.communityRepo.findOne({
      where: { id, clientName: user.clientName },
    });
    if (!c) {
      throw new NotFoundException('Community not found');
    }
    if (!this.isOwner(c, user.sub) && user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only the owner can update this community');
    }
    if (dto.name !== undefined) c.name = dto.name.trim();
    if (dto.description !== undefined) c.description = dto.description.trim();
    if (dto.rules !== undefined) c.rules = dto.rules.trim();
    if (dto.imageUrl !== undefined) c.imageUrl = dto.imageUrl?.trim() || null;
    const saved = await this.communityRepo.save(c);
    const memberCount = await this.memberRepo.count({
      where: { communityId: saved.id },
    });
    return this.toListItem(
      saved,
      memberCount,
      await this.isUserMember(saved.id, user.sub),
      user.sub,
    );
  }

  async join(user: JwtUserPayload, id: string): Promise<{ ok: true }> {
    if (user.role === UserRole.SUPER_ADMIN) {
      return { ok: true };
    }
    await this.assertNurseOrAdmin(user);
    const c = await this.communityRepo.findOne({
      where: { id, clientName: user.clientName },
    });
    if (!c) {
      throw new NotFoundException('Community not found');
    }
    if (c.creatorUserId === user.sub) {
      return { ok: true };
    }
    try {
      await this.memberRepo.save(
        this.memberRepo.create({ communityId: c.id, userId: user.sub }),
      );
    } catch {
      /* unique violation = already member */
    }
    return { ok: true };
  }

  async leave(user: JwtUserPayload, id: string): Promise<{ ok: true }> {
    await this.assertNurseOrAdmin(user);
    const c = await this.communityRepo.findOne({
      where: { id, clientName: user.clientName },
    });
    if (!c) {
      throw new NotFoundException('Community not found');
    }
    if (c.creatorUserId === user.sub) {
      throw new ConflictException('Owner cannot leave; delete the community instead');
    }
    await this.memberRepo.delete({ communityId: c.id, userId: user.sub });
    return { ok: true };
  }

  async removeMember(
    owner: JwtUserPayload,
    id: string,
    targetUserId: string,
  ): Promise<{ ok: true }> {
    if (owner.role === UserRole.SUPER_ADMIN) {
      // admin moderation: allow?
      const c = await this.communityRepo.findOne({
        where: { id, clientName: owner.clientName },
      });
      if (!c) {
        throw new NotFoundException('Community not found');
      }
    } else {
      await this.assertNurseOrAdmin(owner);
    }
    const c = await this.communityRepo.findOne({
      where: { id, clientName: owner.clientName },
    });
    if (!c) {
      throw new NotFoundException('Community not found');
    }
    if (owner.role !== UserRole.SUPER_ADMIN && !this.isOwner(c, owner.sub)) {
      throw new ForbiddenException('Only the owner can remove members');
    }
    if (targetUserId === c.creatorUserId) {
      throw new ForbiddenException('Cannot remove the community owner');
    }
    await this.memberRepo.delete({ communityId: c.id, userId: targetUserId });
    return { ok: true };
  }

  async listMemberIds(
    clientName: string,
    communityId: string,
  ): Promise<string[]> {
    const c = await this.communityRepo.findOne({
      where: { id: communityId, clientName },
    });
    if (!c) {
      return [];
    }
    const rows = await this.memberRepo.find({
      where: { communityId: c.id },
      select: ['userId'],
    });
    return rows.map((r) => r.userId);
  }

  async listMembers(
    user: JwtUserPayload,
    id: string,
  ): Promise<
    { userId: string; email: string; fullName: string | null; joinedAt: string }[]
  > {
    await this.assertNurseOrAdmin(user);
    const c = await this.communityRepo.findOne({
      where: { id, clientName: user.clientName },
    });
    if (!c) {
      throw new NotFoundException('Community not found');
    }
    if (user.role !== UserRole.SUPER_ADMIN) {
      const m = await this.isUserMember(c.id, user.sub);
      if (!m) {
        throw new ForbiddenException('Join the community to see members');
      }
    }
    const rows = await this.memberRepo.find({
      where: { communityId: c.id },
      relations: ['user'],
      order: { joinedAt: 'ASC' },
    });
    return rows
      .filter((r) => r.user)
      .map((r) => ({
        userId: r.userId,
        email: r.user!.email,
        fullName: r.user!.fullName,
        joinedAt: r.joinedAt.toISOString(),
      }));
  }

  async deleteByOwner(
    user: JwtUserPayload,
    id: string,
  ): Promise<{ ok: true }> {
    await this.assertNurseOrAdmin(user);
    const c = await this.communityRepo.findOne({
      where: { id, clientName: user.clientName },
    });
    if (!c) {
      throw new NotFoundException('Community not found');
    }
    if (!this.isOwner(c, user.sub) && user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only the owner can delete this community');
    }
    await this.communityRepo.remove(c);
    return { ok: true };
  }

  /**
   * Used by WebSocket/HTTP: nurse must be member of community (or super admin).
   */
  async assertCanAccessChat(
    user: JwtUserPayload,
    nurseCommunityId: string,
  ): Promise<void> {
    if (user.role === UserRole.SUPER_ADMIN) {
      const c = await this.communityRepo.findOne({
        where: { id: nurseCommunityId, clientName: user.clientName },
      });
      if (!c) {
        throw new ForbiddenException('Community not found');
      }
      return;
    }
    if (user.role !== UserRole.NURSE) {
      throw new ForbiddenException('Not allowed');
    }
    await this.communityService.ensureCommunityParticipant(user);
    const c = await this.communityRepo.findOne({
      where: { id: nurseCommunityId, clientName: user.clientName },
    });
    if (!c) {
      throw new ForbiddenException('Community not found');
    }
    const ok = await this.isUserMember(nurseCommunityId, user.sub);
    if (!ok) {
      throw new ForbiddenException('Join the community to chat');
    }
  }
}
