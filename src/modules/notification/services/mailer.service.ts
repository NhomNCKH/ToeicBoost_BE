import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';

export interface SendMailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly config: ConfigService) {}

  private getTransporter(): Transporter {
    if (this.transporter) return this.transporter;

    // Support both legacy MAIL_* and MAIL_* (username/password) variants found in env.
    const host =
      this.config.get<string>('MAIL_HOST') ??
      this.config.get<string>('MAIL_MAIL_HOST') ??
      'localhost';
    const portRaw =
      this.config.get<string>('MAIL_PORT') ??
      this.config.get<string>('MAIL_MAIL_PORT') ??
      '587';
    const port = Number(portRaw);

    const user =
      this.config.get<string>('MAIL_USERNAME') ??
      this.config.get<string>('MAIL_USER') ??
      '';
    const pass =
      this.config.get<string>('MAIL_PASSWORD') ??
      this.config.get<string>('MAIL_MAIL_PASSWORD') ??
      '';

    const fromAddress =
      this.config.get<string>('MAIL_FROM_ADDRESS') ??
      this.config.get<string>('MAIL_FROM') ??
      '';
    const fromName =
      this.config.get<string>('MAIL_FROM_NAME') ??
      this.config.get<string>('APP_NAME') ??
      'ToeicBoost';

    const encryption =
      this.config.get<string>('MAIL_ENCRYPTION') ??
      this.config.get<string>('MAIL_MAIL_ENCRYPTION') ??
      '';

    const secure = port === 465 || encryption.toLowerCase() === 'ssl';

    if (!user || !pass) {
      this.logger.warn(
        'SMTP credentials are missing (MAIL_USERNAME/MAIL_PASSWORD). Emails will likely fail.',
      );
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
      tls: encryption.toLowerCase() === 'tls' ? { rejectUnauthorized: false } : undefined,
    });

    // Attach defaults
    (this.transporter as any).defaults = {
      from: fromAddress
        ? `"${fromName.replaceAll('"', '')}" <${fromAddress}>`
        : `"${fromName.replaceAll('"', '')}" <${user}>`,
    };

    return this.transporter;
  }

  async sendMail(input: SendMailInput) {
    const transporter = this.getTransporter();
    const defaults = (transporter as any).defaults ?? {};

    const to = (input.to ?? '').trim();
    if (!to) throw new Error('Missing recipient email');

    return transporter.sendMail({
      from: defaults.from,
      to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
  }
}

