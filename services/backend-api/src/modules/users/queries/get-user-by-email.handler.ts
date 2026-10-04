import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { Role, UserEntity } from '@smartfeed/shared';
import { PrismaService } from '@/prisma/prisma.service';
import { GetUserByEmailQuery } from '@/modules/users/queries/get-user-by-email.query';

@Injectable()
@QueryHandler(GetUserByEmailQuery)
export class GetUserByEmailHandler implements IQueryHandler<
  GetUserByEmailQuery,
  UserEntity | null
> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetUserByEmailQuery): Promise<UserEntity | null> {
    const { email } = query;
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      fullName: user.fullName,
      role: user.role as Role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
