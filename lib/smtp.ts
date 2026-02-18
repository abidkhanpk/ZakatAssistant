import nodemailer from 'nodemailer';
import { prisma } from './prisma';
import { decrypt } from './crypto';

export async function getSmtpSettings() {
  const setting = await prisma.appSetting.findUnique({ where: { key: 'smtp' } });
  if (!setting) return null;
  const value = setting.value as any;
  return {
    host: value.host,
    port: value.port,
    secure: value.secure,
    username: value.username,
    password: setting.encrypted ? decrypt(value.password) : value.password,
    fromName: value.fromName,
    fromEmail: value.fromEmail
  };
}

export async function sendEmail(to: string, subject: string, html: string) {
  const smtp = await getSmtpSettings();
  if (!smtp) throw new Error('SMTP not configured');
  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: { user: smtp.username, pass: smtp.password }
  });
  await transporter.sendMail({ from: `${smtp.fromName} <${smtp.fromEmail}>`, to, subject, html });
}
