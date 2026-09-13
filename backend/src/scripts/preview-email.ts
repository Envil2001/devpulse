import { writeFileSync } from 'node:fs';
import path from 'node:path';

import { VerificationCodeEmailTemplate } from '../email/templates/verification-code.template';

const template = new VerificationCodeEmailTemplate();

const html = template.render({
  code: '482913',
  displayName: 'Andrey',
  expiresInMinutes: 10,
});

const outPath = path.resolve(process.cwd(), 'preview-email.html');
writeFileSync(outPath, html);

console.log(`Subject: ${template.subject()}`);
console.log(`Written: ${outPath}`);
