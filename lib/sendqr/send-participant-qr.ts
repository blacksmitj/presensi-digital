import { generateQrPng } from "./qr-image";
import { getTransporter } from "./mail";

type SendQrArgs = {
  toEmail: string;
  participantName: string;
  qrRef: string;
  workspaceName?: string;
};

export async function sendParticipantQrEmail({
  toEmail,
  participantName,
  qrRef,
  workspaceName,
}: SendQrArgs) {
  const png = await generateQrPng(qrRef);
  const transporter = getTransporter();

  const subject = workspaceName
    ? `QR Presensi ${workspaceName}`
    : "QR Presensi Anda";

  const html = `
    <p>Yth. ${participantName},</p>
    <p>Berikut QR presensi Anda. Tunjukkan QR ini saat registrasi / presensi.</p>
    <p><b>Kode:</b> ${qrRef}</p>
    <p>Jika QR tidak tampil, gunakan lampiran PNG di email ini.</p>
  `;

  await transporter.sendMail({
    from: process.env.MAIL_FROM ?? "noreply@example.com",
    to: toEmail,
    subject,
    html,
    attachments: [
      {
        filename: `qr-${qrRef}.png`,
        content: png,
        contentType: "image/png",
      },
    ],
  });
}
