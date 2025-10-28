// lib/errors.ts
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

export class HttpError extends Error {
  status: number;
  code?: string;
  details?: unknown;
  constructor(
    status: number,
    message: string,
    code?: string,
    details?: unknown
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

export function fail(
  status: number,
  message: string,
  code?: string,
  details?: unknown
) {
  return NextResponse.json(
    { ok: false, error: { code, message, details } },
    { status }
  );
}

export function mapError(e: unknown) {
  // Guard: kalau kamu melempar Response/NextResponse dari guard, hormati saja
  if (e instanceof Response) return e;

  // Zod
  if (e instanceof ZodError) {
    return fail(400, "Validation failed", "ZOD_VALIDATION", e.flatten());
  }

  // Prisma Known
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    // P2002 unique constraint
    if (e.code === "P2002") {
      // e.meta?.target biasanya array field unik
      return fail(409, "Unique constraint violated", e.code, e.meta);
    }
    // P2003 FK, P2025 not found, dsb.
    if (e.code === "P2003")
      return fail(400, "Invalid relation (foreign key)", e.code, e.meta);
    if (e.code === "P2025")
      return fail(404, "Record not found", e.code, e.meta);
    return fail(400, "Database error", e.code, e.meta);
  }

  // Prisma Validation
  if (e instanceof Prisma.PrismaClientValidationError) {
    return fail(
      422,
      "Invalid input for database operation",
      "PRISMA_VALIDATION"
    );
  }

  // HttpError kustom
  if (e instanceof HttpError) {
    return fail(e.status, e.message, e.code, e.details);
  }

  // Fallback 500
  return fail(500, "Internal Server Error");
}
