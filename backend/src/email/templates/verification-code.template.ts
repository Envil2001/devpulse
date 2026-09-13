import { type EmailTemplate } from './email-template.interface';

export interface VerificationCodeTemplateParams {
  code: string;
  displayName: string;
  expiresInMinutes: number;
}

const COLORS = {
  bgOuter: '#000000', // neutral-950
  bgCard: '#0f0f13', // neutral-900
  bgCodeBox: '#3d464d', // neutral-800
  textPrimary: '#ffffff', // neutral-100
  textMuted: '#96969d', // neutral-400
  textFaint: '#5b5b65', // neutral-600
  accent: '#15ffab', // green-spring
  border: '#3d464d', // neutral-800
} as const;

export class VerificationCodeEmailTemplate implements EmailTemplate<VerificationCodeTemplateParams> {
  public subject(): string {
    return 'Your DevPulse verification code';
  }

  public render({ code, displayName, expiresInMinutes }: VerificationCodeTemplateParams): string {
    // eslint-disable-next-line @typescript-eslint/no-misused-spread
    const codeDigits = [...code]
      .map(
        (digit) => `
          <td style="
            width: 40px;
            height: 52px;
            background-color: ${COLORS.bgCodeBox};
            border-radius: 8px;
            text-align: center;
            vertical-align: middle;
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
            font-size: 24px;
            font-weight: 700;
            color: ${COLORS.accent};
          ">${digit}</td>
        `,
      )
      .join('<td style="width: 8px;"></td>');

    return `
<!DOCTYPE html>
<html lang="en">
  <body style="margin:0; padding:0; background-color:${COLORS.bgOuter};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLORS.bgOuter}; padding: 40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="
            max-width: 480px;
            width: 100%;
            background-color: ${COLORS.bgCard};
            border: 1px solid ${COLORS.border};
            border-radius: 16px;
            padding: 40px 32px;
          ">
            <tr>
              <td style="padding-bottom: 24px;">
                <span style="
                  font-family: 'SFMono-Regular', Consolas, monospace;
                  font-size: 13px;
                  font-weight: 600;
                  letter-spacing: 0.08em;
                  text-transform: uppercase;
                  color: ${COLORS.accent};
                ">DevPulse</span>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom: 8px;">
                <span style="
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  font-size: 20px;
                  font-weight: 600;
                  color: ${COLORS.textPrimary};
                ">Hi ${displayName}, confirm your email</span>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom: 32px;">
                <span style="
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  font-size: 14px;
                  color: ${COLORS.textMuted};
                  line-height: 1.5;
                ">Enter this code to finish creating your account. It expires in ${String(expiresInMinutes)} minutes.</span>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom: 32px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>${codeDigits}</tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="border-top: 1px solid ${COLORS.border}; padding-top: 24px;">
                <span style="
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  font-size: 12px;
                  color: ${COLORS.textFaint};
                  line-height: 1.5;
                ">If you didn't request this, you can safely ignore this email.</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
    `.trim();
  }
}
