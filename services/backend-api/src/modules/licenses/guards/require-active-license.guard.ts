import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { GetLicenseByUserIdQuery } from '../queries/get-license-by-user-id.query';

@Injectable()
export class RequireActiveLicenseGuard implements CanActivate {
  constructor(private readonly queryBus: QueryBus) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      return false;
    }

    const license = await this.queryBus.execute(new GetLicenseByUserIdQuery(user.id));

    if (!license || !license.isActive) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Forbidden',
        message: 'LICENSE_EXPIRED',
        details: 'You do not have an active license. Please select a tariff plan to proceed.',
      });
    }

    if (license.isExpired || (license.expiresAt && new Date(license.expiresAt) < new Date())) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Forbidden',
        message: 'LICENSE_EXPIRED',
        details:
          'Your tariff plan has expired. Please select or renew your plan to continue using SmartFeed Studio.',
      });
    }

    // Attach verified license to request
    request.license = license;
    return true;
  }
}
