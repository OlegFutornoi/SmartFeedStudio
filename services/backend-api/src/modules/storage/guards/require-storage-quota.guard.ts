import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { GetLicenseByUserIdQuery } from '@/modules/licenses/queries/get-license-by-user-id.query';

@Injectable()
export class RequireStorageQuotaGuard implements CanActivate {
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
        code: 'LICENSE_EXPIRED',
        message: 'LICENSE_EXPIRED: Active license is required to use cloud storage.',
      });
    }

    if (license.isExpired || (license.expiresAt && new Date(license.expiresAt) < new Date())) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Forbidden',
        code: 'LICENSE_EXPIRED',
        message: 'LICENSE_EXPIRED: Your tariff plan has expired. Please renew your subscription.',
      });
    }

    // Layer 2 Domain Quota Check: Storage enabled and quota available
    const rawLicenseStorage = license.maxStorageGb ? Number(license.maxStorageGb) : 0;
    const rawPlanStorage = license.tariffPlan?.maxStorageGb
      ? Number(license.tariffPlan.maxStorageGb)
      : 0;
    const maxStorageGb = rawLicenseStorage > 0 ? rawLicenseStorage : rawPlanStorage;

    const hasStorageAccess = Boolean(
      license.canCloudBackup || license.tariffPlan?.canCloudBackup || maxStorageGb > 0,
    );

    if (!hasStorageAccess) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Forbidden',
        code: 'STORAGE_ACCESS_REQUIRED',
        message:
          'STORAGE_ACCESS_REQUIRED: Cloud storage is not included in your current tariff plan. Please upgrade to Pro or Enterprise.',
      });
    }

    const maxStorageBytes = BigInt(Math.floor(maxStorageGb * 1024 * 1024 * 1024));
    const usedStorageBytes = BigInt(license.usedStorageBytes || 0);

    if (maxStorageGb > 0 && usedStorageBytes >= maxStorageBytes) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Forbidden',
        code: 'STORAGE_QUOTA_EXCEEDED',
        message:
          'STORAGE_QUOTA_EXCEEDED: You have exceeded your cloud storage quota limit. Please delete unused catalog images or upgrade your plan.',
      });
    }

    request.license = license;
    return true;
  }
}
