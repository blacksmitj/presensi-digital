import { requireSession } from "@/lib/guard/auth";
import { withApi } from "@/lib/withapi";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

// export const runtime = "nodejs";
// export const dynamic = "force-dynamic";

export const GET = withApi(async (req) => {
  const session = await requireSession();

  const headers = [
    "Nama",
    "Email",
    "No HP",
    "ID Peserta",
    "Kelas",
    "Instansi",
    "Catatan",
  ];

  // contoh 1 baris (boleh dikosongkan, tapi contoh lebih enak)
  const sample = [
    {
      Nama: "Contoh Peserta",
      Email: "peserta@example.com",
      "No HP": "08123456789",
      "ID Peserta": "TKML-001",
      Kelas: "Kelas A",
      Instansi: "BBPKK Bandung Barat",
      Catatan: "boleh dikosongkan",
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sample, { header: headers });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Peserta");

  // jadiin buffer xlsx
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  const filename = "template-peserta.xlsx";

  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
});
