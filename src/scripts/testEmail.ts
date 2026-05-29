import 'dotenv/config';
import { sendEmail, otpTemplate } from '../services/emailService';

async function run() {
  console.log('SMTP config:', {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
    from: process.env.SMTP_FROM,
  });
  const result = await sendEmail(
    'angievanesasanchez10i3@gmail.com',
    otpTemplate('Angie Sanchez', '123456', 5)
  );
  console.log('Result:', JSON.stringify(result));
}
run().catch(e => console.error('ERROR:', e.message));
