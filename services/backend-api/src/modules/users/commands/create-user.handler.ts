import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { ConflictException, Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Role, UserProfile, MemberRole } from '@smartfeed/shared';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateUserCommand } from './create-user.command';
import { UserCreatedEvent } from '../events/user-created.event';

@Injectable()
@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand, UserProfile> {
  private readonly logger = new Logger(CreateUserHandler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateUserCommand): Promise<UserProfile> {
    const { email, password, fullName, role } = command;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new ConflictException(`User with email "${normalizedEmail}" already exists`);
    }

    // Hash password with bcrypt
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Persist user in DB
    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        fullName: fullName?.trim() || null,
        role: role || Role.USER,
      },
    });

    // Auto-create default Organization for the user
    const defaultOrgName =
      command.companyName?.trim() ||
      (user.fullName ? `Компанія ${user.fullName}` : `Компанія ${normalizedEmail.split('@')[0]}`);

    const organization = await this.prisma.organization.create({
      data: {
        name: defaultOrgName,
        ownerId: user.id,
        members: {
          create: {
            userId: user.id,
            role: 'OWNER',
          },
        },
      },
    });

    this.logger.log(
      `User created: id=${user.id}, email=${user.email}, role=${user.role}, orgId=${organization.id}`,
    );

    // Publish UserCreatedEvent to EventBus
    this.eventBus.publish(
      new UserCreatedEvent(user.id, user.email, user.fullName, user.role as Role, organization.id),
    );

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role as Role,
      organization: {
        id: organization.id,
        name: organization.name,
        role: MemberRole.OWNER,
      },
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
