import { Injectable, Logger } from '@nestjs/common';
import type { CreateEmailResponse } from 'resend';
import { Resend } from 'resend';

import { env } from '@devpulse/env/api';

import { EmailMessage, type EmailSender } from '../interfaces/email-sender.interface';

@Injectable()
export class ResendEmailSenderService implements EmailSender {
  private readonly logger = new Logger(ResendEmailSenderService.name);
  private readonly client: Resend = new Resend(env.RESEND_API_KEY);

  public async send(message: EmailMessage): Promise<void> {
    const { error }: CreateEmailResponse = await this.client.emails.send({
      from: env.EMAIL_FROM,
      to: message.to,
      subject: message.subject,
      html: message.html,
    });

    if (error) {
      const errorMessage: string = error.message;
      this.logger.error(`Failed to send email to ${message.to}: ${errorMessage}`);
      throw new Error(`EmailSendFailed: ${errorMessage}`);
    }

    this.logger.log(`Email sent to ${message.to}`);
  }
}
