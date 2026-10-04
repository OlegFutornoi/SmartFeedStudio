import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { ConflictException, Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Role, UserProfile, MemberRole } from '@smartfeed/shared';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateUserCommand } from '@/modules/users/commands/create-user.command';
import { UserCreatedEvent } from '@/modules/users/events/user-created.event';

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

    // Persist user and default organization atomically in DB
    const { user, organization } = await this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          fullName: fullName?.trim() || null,
          role: role || Role.USER,
        },
      });

      const defaultOrgName =
        command.companyName?.trim() ||
        (createdUser.fullName
          ? `Компанія ${createdUser.fullName}`
          : `Компанія ${normalizedEmail.split('@')[0]}`);

      const createdOrg = await tx.organization.create({
        data: {
          name: defaultOrgName,
          ownerId: createdUser.id,
          members: {
            create: {
              userId: createdUser.id,
              role: 'OWNER',
            },
          },
        },
      });

      return { user: createdUser, organization: createdOrg };
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
      avatarUrl: user.avatarUrl,
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
