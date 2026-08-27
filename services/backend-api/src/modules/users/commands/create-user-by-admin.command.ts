import { ICommand } from '@nestjs/cqrs';
import { AccountType, CreateUserByAdminDto, PlanType, Role } from '@smartfeed/shared';

export class CreateUserByAdminCommand implements ICommand {
  public readonly email: string;
  public readonly password: string;
  public readonly fullName: string;
  public readonly role: Role;
  public readonly accountType: AccountType;
  public readonly companyName?: string;
  public readonly organizationId?: string;
  public readonly planCode?: PlanType;

  constructor(dto: CreateUserByAdminDto) {
    this.email = dto.email;
    this.password = dto.password;
    this.fullName = dto.fullName;
    this.role = dto.role ?? Role.USER;
    this.accountType = dto.accountType ?? AccountType.OWNER;
    this.companyName = dto.companyName;
    this.organizationId = dto.organizationId;
    this.planCode = dto.planCode;
  }
}
