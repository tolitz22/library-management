import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const { key } = body;

  // TODO: Replace with real signed GET URL from Cloudflare R2.
  return NextResponse.json({
    key,
    downloadUrl: `https://example-r2-download-url/${key}`,
    expiresIn: 3600,
  });
}
