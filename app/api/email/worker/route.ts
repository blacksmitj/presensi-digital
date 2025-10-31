import { processEmailQueue } from "@/lib/sendqr/queue-worker";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // biar selalu jalan di server

export async function GET() {
  // opsional: kasih key sederhana
  // const auth = headers().get("x-cron-key");
  // if (auth !== process.env.CRON_SECRET) return new NextResponse("Unauthorized", { status: 401 });

  const result = await processEmailQueue(5);
  return NextResponse.json(result);
}
