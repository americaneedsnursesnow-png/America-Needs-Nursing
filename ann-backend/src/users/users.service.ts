import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import type { JwtUserPayload } from '../auth/types/jwt-user-payload';
import { Client, User, UserRole } from '../database/entities';
import { NewsletterService } from '../newsletter/newsletter.service';
import { CreateUserDto } from './dto/create-user.dto';

/** `POST /users` via super admin: only these roles may be created. */
const SUPER_PROVISIONED_ROLES: ReadonlySet<UserRole> = new Set([
  UserRole.SUPER_ADMIN,
  UserRole.CONTENT_ADMIN,
]);

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Client)
    private readonly clientsRepository: Repository<Client>,
    private readonly newsletterService: NewsletterService,
  ) {}

  /**
   * @param actor JWT caller for HTTP; `null` for CLI (`npm run user:create`) as super-user.
   */
  async create(actor: JwtUserPayload | null, dto: CreateUserDto): Promise<User> {
    if (actor) {
      if (actor.role !== UserRole.SUPER_ADMIN) {
        throw new ForbiddenException();
      }
      if (!SUPER_PROVISIONED_ROLES.has(dto.role)) {
        throw new BadRequestException(
          'Super admins may only create content admin or super admin accounts here.',
        );
      }
    }

    const email = dto.email.trim().toLowerCase();
    const clientName = dto.clientName.trim();

    const user = await this.usersRepository.manager.transaction(
      async (manager) => {
        const clientRepo = manager.getRepository(Client);
        const userRepo = manager.getRepository(User);

        const matchingClients = await clientRepo.find({
          where: { name: clientName },
          take: 2,
        });
        if (matchingClients.length > 1) {
          throw new ConflictException(
            'Multiple clients share this name; assign a unique client name first',
          );
        }
        if (matchingClients.length === 0) {
          await clientRepo.save(clientRepo.create({ name: clientName }));
        }

        const duplicate = await userRepo.exist({
          where: { clientName, email },
        });
        if (duplicate) {
          throw new ConflictException(
            'A user with this email already exists for this client',
          );
        }

        const passwordHash = dto.password
          ? await bcrypt.hash(dto.password, 10)
          : null;

        return userRepo.save(
          userRepo.create({
            clientName,
            email,
            role: dto.role,
            passwordHash,
          }),
        );
      },
    );

    try {
      await this.newsletterService.ensureSubscriber(clientName, email);
    } catch (err: unknown) {
      this.logger.warn(
        `ensureSubscriber after admin user create failed for ${email}`,
        err instanceof Error ? err.stack : String(err),
      );
    }

    return user;
  }
}
