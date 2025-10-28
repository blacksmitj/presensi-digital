export function normalizeHeader(h: string) {
  return h.toLowerCase().trim().replace(/\s+/g, "");
}

// header yang dipetakan ke kolom inti
const CORE_MAP: Record<string, "name" | "email" | "phone" | "externalId"> = {
  // name / nama
  name: "name",
  nama: "name",
  // email
  email: "email",
  "e-mail": "email",
  // phone / telp
  phone: "phone",
  telepon: "phone",
  telp: "phone",
  hp: "phone",
  nohp: "phone",
  nohandphone: "phone",
  nomortelepon: "phone",
  // external id
  externalid: "externalId",
  id: "externalId",
  idpeserta: "externalId",
  id_peserta: "externalId",
  nopeserta: "externalId",
  nik: "externalId",
};

export function splitCoreAndMeta(row: Record<string, any>) {
  const core: any = {
    name: undefined,
    email: undefined,
    phone: undefined,
    externalId: undefined,
  };
  const meta: Record<string, any> = {};
  for (const [rawKey, val] of Object.entries(row)) {
    const key = normalizeHeader(rawKey);
    const mapped = CORE_MAP[key];
    if (mapped) {
      core[mapped] = (typeof val === "string" ? val.trim() : val) || undefined;
    } else {
      // masukkan ke metadata (pakai key asli agar tetap terbaca user)
      meta[rawKey] = val;
    }
  }
  return { core, metadata: Object.keys(meta).length ? meta : undefined };
}
