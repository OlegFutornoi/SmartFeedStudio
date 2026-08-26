export class SelectTariffPlanCommand {
  constructor(
    public readonly userId: string,
    public readonly planCode: string,
  ) {}
}
