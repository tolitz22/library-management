import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const { filename, contentType } = body;

  // TODO: Replace with real Cloudflare R2 presign logic using S3-compatible SDK.
  const fakeKey = `uploads/${Date.now()}-${filename}`;

  return NextResponse.json({
    key: fakeKey,
    method: "PUT",
    uploadUrl: `https://example-r2-upload-url/${fakeKey}`,
    contentType: contentType ?? "application/octet-stream",
    requiredEnv: [
      "R2_ACCOUNT_ID",
      "R2_ACCESS_KEY_ID",
      "R2_SECRET_ACCESS_KEY",
      "R2_BUCKET",
    ],
  });
}
