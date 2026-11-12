import "server-only";
import { NextResponse } from "next/server";

/** Logs the real error on the server and sends a short message to the browser. */
export function apiError(route: string, err: unknown, status = 500) {
  const message = err instanceof Error ? err.message : "Something went wrong";
  console.error(`[${route}]`, message);
  return NextResponse.json({ error: message }, { status });
}
