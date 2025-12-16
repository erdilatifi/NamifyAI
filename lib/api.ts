import { NextResponse } from "next/server";

type ApiErrorCode =
  | "UNAUTHORIZED"
  | "INVALID_INPUT"
  | "RATE_LIMITED"
  | "USAGE_LIMIT_REACHED"
  | "NOT_CONFIGURED"
  | "INTERNAL_ERROR"
  | "BAD_GATEWAY";

export function okJson<T extends Record<string, unknown>>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, ...data }, init);
}

export function errorJson(params: {
  status: number;
  code: ApiErrorCode;
  message: string;
  details?: unknown;
  headers?: HeadersInit;
}) {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code: params.code,
        message: params.message,
        details: params.details,
      },
    },
    {
      status: params.status,
      headers: params.headers,
    }
  );
}

export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || "unknown";

  const xri = req.headers.get("x-real-ip");
  if (xri) return xri.trim();

  return "unknown";
}
