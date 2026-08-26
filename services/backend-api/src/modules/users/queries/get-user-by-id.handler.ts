import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Role, UserProfile, MemberRole } from '@smartfeed/shared';
import { PrismaService } from '../../../prisma/prisma.service';
import { GetUserByIdQuery } from './get-user-by-id.query';

@Injectable()
@QueryHandler(GetUserByIdQuery)
export class GetUserByIdHandler implements IQueryHandler<GetUserByIdQuery, UserProfile> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetUserByIdQuery): Promise<UserProfile> {
    const { id } = query;
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        organizationMemberships: {
          include: {
            organization: true,
          },
          orderBy: { joinedAt: 'asc' },
          take: 1,
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    const activeMembership = user.organizationMemberships?.[0];
    const organization = activeMembership
      ? {
          id: activeMembership.organization.id,
          name: activeMembership.organization.name,
          role: activeMembership.role as MemberRole,
        }
      : null;

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role as Role,
      organization,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
