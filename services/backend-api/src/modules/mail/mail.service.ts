import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { generateInvitationEmailHtml, InvitationEmailData } from './templates/invitation-email';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private isMailEnabled: boolean = false;
  private defaultFrom: string = 'SmartFeed Studio <no-reply@smartfeed.studio>';

  constructor(private readonly configService: ConfigService) {
    this.initTransporter();
  }

  private initTransporter() {
    const mailEnabled = this.configService.get<string>('MAIL_ENABLED', 'true');
    this.isMailEnabled = mailEnabled === 'true' || mailEnabled === '1';

    const host = this.configService.get<string>('MAIL_HOST', 'localhost');
    const port = Number(this.configService.get<number>('MAIL_PORT', 1025));
    const user = this.configService.get<string>('MAIL_USER', '');
    const pass = this.configService.get<string>('MAIL_PASS', '');
    this.defaultFrom = this.configService.get<string>(
      'MAIL_FROM',
      'SmartFeed Studio <no-reply@smartfeed.studio>',
    );

    if (!this.isMailEnabled) {
      this.logger.log('Mail service is disabled (MAIL_ENABLED=false). Emails will only be logged.');
      return;
    }

    try {
      const transportOptions: nodemailer.TransportOptions = {
        host,
        port,
        secure: port === 465,
        auth: user && pass ? { user, pass } : undefined,
        tls: {
          rejectUnauthorized: false,
        },
      } as any;

      this.transporter = nodemailer.createTransport(transportOptions);
      this.logger.log(`Mail service initialized with transport host: ${host}:${port}`);
    } catch (err: any) {
      this.logger.warn(`Failed to initialize mail transport: ${err?.message}`);
      this.transporter = null;
    }
  }

  async sendInvitationEmail(
    data: InvitationEmailData,
  ): Promise<{ success: boolean; error?: string }> {
    const html = generateInvitationEmailHtml(data);
    const subject = `Запрошення до команди ${data.organizationName} — SmartFeed Studio`;

    this.logger.log(
      `[TEAM INVITATION] Recipient: ${data.to}, Org: ${data.organizationName}, Link: ${data.inviteUrl}`,
    );

    if (!this.isMailEnabled || !this.transporter) {
      this.logger.log(
        `[MAIL_MOCK] Mail sending skipped (disabled or no transporter). Invite URL: ${data.inviteUrl}`,
      );
      return { success: true };
    }

    try {
      await this.transporter.sendMail({
        from: this.defaultFrom,
        to: data.to,
        subject,
        html,
        text: `Вас запрошено до команди ${data.organizationName} на платформі SmartFeed Studio. Перейдіть за посиланням для активації: ${data.inviteUrl}`,
      });

      this.logger.log(`Invitation email successfully sent to ${data.to}`);
      return { success: true };
    } catch (err: any) {
      this.logger.warn(
        `Failed to send invitation email to ${data.to}: ${err?.message}. Direct link is: ${data.inviteUrl}`,
      );
      return { success: false, error: err?.message };
    }
  }
}
