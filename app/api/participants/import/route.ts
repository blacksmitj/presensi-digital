import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { splitCoreAndMeta } from "@/lib/participant-import";
import * as XLSX from "xlsx";
import { requireSession } from "@/lib/guard/auth";
import { withApi } from "@/lib/withapi";
import { ParticipantImportSchema } from "@/schema/participant";
import { ensureWorkspaceAccess } from "@/lib/guard/membership";
import { generateQrRef } from "@/lib/qr";

export const runtime = "nodejs"; // butuh Node untuk xlsx
export const dynamic = "force-dynamic"; // biar tidak cache
export const maxDuration = 60; // beri waktu proses

export const POST = withApi(async (req) => {
  const session = await requireSession();
  const userId = session.user?.id as string;

  const form = await req.formData().catch(() => null);
  if (!form)
    return NextResponse.json({ error: "Invalid form-data" }, { status: 400 });

  const bodyParse = ParticipantImportSchema.safeParse({
    workspaceId: form.get("workspaceId"),
    dryRun: form.get("dryRun") ?? undefined,
  });
  if (!bodyParse.success) {
    return NextResponse.json(
      { error: bodyParse.error.flatten() },
      { status: 400 }
    );
  }
  const { workspaceId, dryRun } = bodyParse.data;

  // hanya OWNER/ADMIN yang boleh import
  await ensureWorkspaceAccess(userId, workspaceId, [Role.OWNER, Role.ADMIN]);

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  // Baca buffer → parse sheet pertama
  const buf = Buffer.from(await file.arrayBuffer());
  const wb = XLSX.read(buf, { type: "buffer" });
  const sheetName = wb.SheetNames[0];
  if (!sheetName)
    return NextResponse.json({ error: "No sheet found" }, { status: 400 });
  const sheet = wb.Sheets[sheetName];

  // sheet_to_json: tiap row menjadi object { header: value }
  const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, {
    defval: "", // jangan undefined supaya bisa dideteksi kosong
    raw: false,
  });

  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  const errors: Array<{ row: number; message: string }> = [];

  // deteksi duplikasi externalId dalam file yang sama (untuk workspace sama)
  const seenExternal: Set<string> = new Set();

  // siapkan operasi per row
  type Work = () => Promise<void>;
  const works: Work[] = [];

  rows.forEach((row, idx) => {
    const rowNumber = idx + 2; // +2: baris data pertama umumnya baris 2
    const { core, metadata } = splitCoreAndMeta(row);
    const name = core.name?.toString().trim();
    const email = core.email?.toString().trim() || undefined;
    const phone = core.phone?.toString().trim() || undefined;
    const externalId = core.externalId?.toString().trim() || undefined;

    // aturan minimal: butuh "name" untuk create. Untuk update by externalId tanpa name masih boleh.
    if (!name && !externalId) {
      skipped++;
      errors.push({
        row: rowNumber,
        message: "Missing both name and externalId",
      });
      return;
    }

    // duplikasi externalId dalam file
    if (externalId) {
      const key = `${workspaceId}:${externalId.toLowerCase()}`;
      if (seenExternal.has(key)) {
        skipped++;
        errors.push({
          row: rowNumber,
          message: `Duplicate externalId in file: ${externalId}`,
        });
        return;
      }
      seenExternal.add(key);
    }

    // DRY-RUN: hanya hitung plan, jangan ke DB
    if (dryRun) {
      if (externalId) {
        // kita tidak tahu apakah existing atau tidak tanpa query;
        // untuk estimasi, tandai sebagai "upsert"
        updated++; // treat as upsert plan
      } else {
        inserted++;
      }
      return;
    }

    // Kerjakan DB per baris
    works.push(async () => {
      try {
        if (externalId) {
          // cari existing by [workspaceId, externalId]
          const existing = await db.participant.findFirst({
            where: { workspaceId, externalId },
            select: { id: true },
          });

          if (existing) {
            // update fields yang ada nilainya; kosong/"" tidak overwrite
            const data: any = {};
            if (name) data.name = name;
            if (email !== undefined && email !== "") data.email = email;
            if (phone !== undefined && phone !== "") data.phone = phone;
            if (metadata) data.metadata = metadata;

            if (Object.keys(data).length === 0) {
              skipped++;
              return;
            }

            await db.participant.update({
              where: { id: existing.id },
              data,
            });
            updated++;
          } else {
            await db.participant.create({
              data: {
                workspaceId,
                externalId,
                name: name || "(Unnamed)",
                email: email ?? null,
                phone: phone ?? null,
                qrRef: generateQrRef(),
                metadata: metadata ?? undefined,
              },
            });
            inserted++;
          }
        } else {
          // Tanpa externalId → selalu create baru
          await db.participant.create({
            data: {
              workspaceId,
              name: name!, // sudah dijaga di atas
              email: email ?? null,
              phone: phone ?? null,
              qrRef: generateQrRef(),
              metadata: metadata ?? undefined,
            },
          });
          inserted++;
        }
      } catch (e: any) {
        skipped++;
        errors.push({ row: rowNumber, message: e?.message ?? "DB error" });
      }
    });
  });

  // Eksekusi dalam batch agar stabil
  const chunkSize = 200;
  for (let i = 0; i < works.length; i += chunkSize) {
    const slice = works.slice(i, i + chunkSize);
    // transaksi per batch itu opsional—di sini paralel per batch
    await Promise.all(slice.map((fn) => fn()));
  }

  return NextResponse.json({
    summary: {
      totalRows: rows.length,
      inserted,
      updated,
      skipped,
      errors: errors.length,
    },
    errors,
    dryRun,
  });
});
