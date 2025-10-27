export const generateJoinCode = (name?: string) => {
  const prefix = (name ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "-")
    .replace(/(^-|-$)/g, "")
    .split("-")
    .splice(0, 2)
    .join("-");

  const rand = Array.from(crypto.getRandomValues(new Uint8Array(4)))
    .map((b) => (b % 36).toString(36).toUpperCase())
    .join("")
    .slice(0, 5);

  return [prefix || "WS", rand].join("-").slice(0, 16);
};
