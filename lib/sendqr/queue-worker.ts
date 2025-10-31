import { db } from "@/lib/prisma";
import pLimit from "p-limit";
import { sendParticipantQrEmail } from "./send-participant-qr";

const CONCURRENCY = 5; // kirim 5 email sekaligus
const limit = pLimit(CONCURRENCY);

export async function processEmailQueue(batchSize = 20) {
  // 1. ambil email yang pending dan sudah waktunya dikirim
  const jobs = await db.emailQueue.findMany({
    where: {
      status: "PENDING",
      scheduledAt: { lte: new Date() },
    },
    orderBy: { createdAt: "asc" },
    take: batchSize,
  });

  if (jobs.length === 0) {
    return { processed: 0 };
  }

  // 2. tandai jadi SENDING supaya tidak diproses worker lain (kalau nanti multiple worker)
  const jobIds = jobs.map((j) => j.id);
  await db.emailQueue.updateMany({
    where: { id: { in: jobIds } },
    data: { status: "SENDING" },
  });

  // 3. proses paralel terbatas
  const results = await Promise.allSettled(
    jobs.map((job) =>
      limit(async () => {
        const payload = job.payloadJson as any;

        try {
          await sendParticipantQrEmail({
            toEmail: job.toEmail,
            participantName: payload.participantName,
            qrRef: payload.qrRef,
            workspaceName: payload.workspaceName,
          });

          await db.emailQueue.update({
            where: { id: job.id },
            data: {
              status: "SENT",
              sentAt: new Date(),
              attempts: { increment: 1 },
              error: null,
            },
          });
        } catch (err: any) {
          await db.emailQueue.update({
            where: { id: job.id },
            data: {
              status: job.attempts + 1 >= 3 ? "FAILED" : "PENDING", // retry max 3x
              attempts: { increment: 1 },
              error: err.message?.slice(0, 500),
            },
          });
        }
      })
    )
  );

  return {
    processed: jobs.length,
    ok: results.filter((r) => r.status === "fulfilled").length,
    failed: results.filter((r) => r.status === "rejected").length,
  };
}
