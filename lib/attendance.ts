// lib/attendance-rules.ts

type AttendanceRule = {
  graceIn?: number; // menit toleransi datang
  minDuration?: number; // menit minimal sebelum OUT diterima
  requireOut?: boolean; // kalau true → mesti OUT
};

export function parseActivityRules(rules: any): AttendanceRule {
  if (!rules || typeof rules !== "object") return {};
  return {
    graceIn: typeof rules.graceIn === "number" ? rules.graceIn : undefined,
    minDuration:
      typeof rules.minDuration === "number" ? rules.minDuration : undefined,
    requireOut:
      typeof rules.requireOut === "boolean" ? rules.requireOut : undefined,
  };
}
