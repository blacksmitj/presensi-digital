export const generateJoinCode = (name?: string) => {
  const MAX = 16;
  const RAND_LEN = 5;
  const SEP = "-";
  const reserve = SEP.length + RAND_LEN; // 6

  let prefix = (name ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "-")
    .replace(/(^-|-$)/g, "")
    .split("-")
    .slice(0, 2)
    .join("-");

  // pangkas prefix agar masih ada ruang utk "-RAND"
  prefix = (prefix || "WS").slice(0, MAX - reserve).replace(/(^-|-$)/g, "");

  // rand yang stabil (hindari kosong)
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(4)))
    .map((b) => (b % 36).toString(36).toUpperCase())
    .join("")
    .slice(0, RAND_LEN);

  const code = `${prefix}${SEP}${rand}`;
  return code; // panjang <= 16, rand selalu ada
};
