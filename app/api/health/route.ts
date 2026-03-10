import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(): Promise<NextResponse<{ status: "ok" }>> {
  return NextResponse.json(
    { status: "ok" },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
