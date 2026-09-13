import { Module } from '@nestjs/common';

import { EMAIL_SENDER } from './interfaces/email-sender.interface';
import { ResendEmailSenderService } from './services/resend-email-sender.service';
import {
  ResendVerificationMailerService,
  VERIFICATION_MAILER,
} from './services/verification-mailer.service';

@Module({
  providers: [
    { provide: EMAIL_SENDER, useClass: ResendEmailSenderService },
    { provide: VERIFICATION_MAILER, useClass: ResendVerificationMailerService },
  ],
  exports: [VERIFICATION_MAILER],
})
export class EmailModule {}
