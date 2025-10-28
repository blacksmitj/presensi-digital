// lib/guards.ts
export function requireStartBeforeEnd(
  start?: Date | string | null,
  end?: Date | string | null,
  message = "Start date must be before end date"
) {
  // lewati jika salah satu kosong (biar optional tetap lolos)
  if (!start || !end) return;

  const s = start instanceof Date ? start : new Date(start);
  const e = end instanceof Date ? end : new Date(end);

  if (Number.isNaN(+s) || Number.isNaN(+e)) {
    throw new Response(JSON.stringify({ error: "Invalid date input" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (s >= e) {
    throw new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}
