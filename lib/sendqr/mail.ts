import nodemailer from "nodemailer";

export function getTransporter() {
  // untuk dev pakai Mailhog / Mailtrap / SMTP lokal
  // sesuaikan env-mu
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 1025),
    secure: false,
    auth: process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        }
      : undefined,
  });
}
