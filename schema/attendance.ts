import { z } from "zod";

export const AttendanceScanSchema = z.object({
  activityId: z.string().min(1),
  participantRef: z.string().min(1), // ini isi QR -> participant.qrRef
  checkpointCode: z.string().min(1).optional(),
  scanType: z.enum(["IN", "OUT"]).optional(), // kalau tidak dikirim, kita auto
  requestId: z.string().min(6), // WAJIB krn di prisma wajib + @@unique
  scannedAt: z.coerce.date().optional(), // kalau device kirim waktu sendiri
  offline: z.boolean().optional(), // kalau scan offline lalu disync
});
