import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

/**
 * All email goes through here. Locally the SMTP target is MailHog
 * ( docker, localhost:1025 ) - open http://localhost:8025 to read
 * everything the app has sent.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter;
  private readonly from: string;
  private readonly frontendUrl: string;

  constructor(config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: config.get<string>("mail.host"),
      port: config.get<number>("mail.port"),
      secure: false,
    });
    this.from = config.get<string>("mail.from")!;
    this.frontendUrl = config.get<string>("frontendUrl")!;
  }

  async sendActivationEmail(to: string, firstName: string, token: string): Promise<void> {
    const link = `${this.frontendUrl}/activate?token=${token}`;
    await this.transporter.sendMail({
      from: this.from,
      to,
      subject: "Activate your blog account",
      text:
        `Hello ${firstName},\n\n` +
        `Welcome to the blog. Activate your account by opening this link:\n\n` +
        `${link}\n\n` +
        `If you did not register, ignore this email.\n`,
    });
    this.logger.log(`Activation email sent to ${to}`);
  }
}
