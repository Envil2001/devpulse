import { Inject, Injectable } from '@nestjs/common';

import { EMAIL_SENDER, type EmailSender } from '../interfaces/email-sender.interface';
import {
  VerificationCodeEmailTemplate,
  VerificationCodeTemplateParams,
} from '../templates/verification-code.template';

export const VERIFICATION_MAILER = Symbol('VERIFICATION_MAILER');

export interface VerificationMailer {
  sendVerificationCode(to: string, params: VerificationCodeTemplateParams): Promise<void>;
}

@Injectable()
export class ResendVerificationMailerService implements VerificationMailer {
  private readonly template = new VerificationCodeEmailTemplate();

  constructor(@Inject(EMAIL_SENDER) private readonly emailSender: EmailSender) {}

  public async sendVerificationCode(
    to: string,
    params: VerificationCodeTemplateParams,
  ): Promise<void> {
    await this.emailSender.send({
      to,
      subject: this.template.subject(),
      html: this.template.render(params),
    });
  }
}
