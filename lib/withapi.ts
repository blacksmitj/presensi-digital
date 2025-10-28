// lib/withApi.ts
import { mapError } from "@/lib/errors";

export function withApi(
  handler: (
    req: Request,
    ctx?: { params?: Record<string, string> }
  ) => Promise<Response>
) {
  return async (req: Request, ctx?: { params?: Record<string, string> }) => {
    try {
      return await handler(req, ctx);
    } catch (e) {
      console.error("[API ERROR]", e);
      return mapError(e);
    }
  };
}
