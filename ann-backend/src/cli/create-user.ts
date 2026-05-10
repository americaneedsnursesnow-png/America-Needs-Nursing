import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import validator from 'validator';
import { AppModule } from '../app.module';
import { UserRole } from '../database/entities';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UsersService } from '../users/users.service';

const USER_ROLE_VALUES = Object.values(UserRole) as string[];

function isUserRole(value: string): value is UserRole {
  return USER_ROLE_VALUES.includes(value);
}

/** Mirrors `CreateUserDto` rules without `class-validator` sync API (typed; ESLint-safe). */
function getCreateUserCliErrors(input: {
  clientName: string;
  email: string;
  role: string;
  password?: string;
}): string[] {
  const errs: string[] = [];
  if (input.clientName.length < 1) {
    errs.push('clientName must be longer than or equal to 1 characters');
  }
  if (input.clientName.length > 255) {
    errs.push('clientName must be shorter than or equal to 255 characters');
  }
  if (!validator.isEmail(input.email)) {
    errs.push('email must be an email');
  }
  if (!isUserRole(input.role)) {
    errs.push(
      'role must be one of the following values: ' +
        USER_ROLE_VALUES.join(', '),
    );
  }
  if (input.password !== undefined) {
    if (input.password.length < 8) {
      errs.push('password must be longer than or equal to 8 characters');
    }
    if (input.password.length > 128) {
      errs.push('password must be shorter than or equal to 128 characters');
    }
  }
  return errs;
}

function printUsage(): void {
  console.error(
    'Usage: npm run user:create -- "<clientName>" <email> <role> [password]',
  );
  console.error(`Roles: ${Object.values(UserRole).join(' | ')}`);
}

async function main(): Promise<void> {
  const [, , clientNameArg, emailArg, roleArg, passwordArg] = process.argv;
  if (!clientNameArg || !emailArg || !roleArg) {
    printUsage();
    process.exit(1);
  }

  const messages = getCreateUserCliErrors({
    clientName: clientNameArg,
    email: emailArg,
    role: roleArg,
    password: passwordArg,
  });
  if (messages.length > 0) {
    for (const msg of messages) {
      console.error(msg);
    }
    process.exit(1);
  }

  const dto = new CreateUserDto();
  dto.clientName = clientNameArg;
  dto.email = emailArg;
  dto.role = roleArg as UserRole;
  if (passwordArg) {
    dto.password = passwordArg;
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  try {
    const usersService = app.get(UsersService);
    const user = await usersService.create(null, dto);
    Logger.log(`Created user ${user.id} (${user.email})`);
    console.log(JSON.stringify(user, null, 2));
  } finally {
    await app.close();
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
