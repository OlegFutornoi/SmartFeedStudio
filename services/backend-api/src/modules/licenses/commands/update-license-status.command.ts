export class UpdateLicenseStatusCommand {
  constructor(
    public readonly licenseId: string,
    public readonly isActive: boolean,
  ) {}
}
