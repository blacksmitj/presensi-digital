// short, unique, URL-safe. contoh: PRS-9F2KXT7C
export function generateQrRef() {
  const a = Math.random().toString(36).slice(2, 6);
  const b = Math.random().toString(36).slice(2, 10);
  return `PRS-${(a + b).toUpperCase().replace(/[^A-Z0-9]/g, "")}`;
}
