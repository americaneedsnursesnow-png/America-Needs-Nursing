import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../database/entities';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly repo: Repository<Notification>,
  ) {}

  async create(
    userId: string,
    clientName: string,
    type: string,
    title: string,
    body?: string,
    metadata?: Record<string, unknown>,
  ): Promise<Notification> {
    return this.repo.save(
      this.repo.create({
        userId,
        clientName,
        type,
        title,
        body: body ?? null,
        read: false,
        metadata: metadata ?? null,
      }),
    );
  }

  async listForUser(
    userId: string,
    clientName: string,
  ): Promise<Notification[]> {
    return this.repo.find({
      where: { userId, clientName },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  async countUnreadForUser(
    userId: string,
    clientName: string,
  ): Promise<number> {
    return this.repo.count({
      where: { userId, clientName, read: false },
    });
  }

  async markRead(
    id: string,
    userId: string,
    clientName: string,
  ): Promise<void> {
    await this.repo.update({ id, userId, clientName }, { read: true });
  }
}
