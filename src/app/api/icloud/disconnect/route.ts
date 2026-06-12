import { NextResponse } from "next/server";
import { clearConnection } from "@/lib/caldav/connection-cookie";
import { createApiHandler } from "@/lib/api-handler";

export const dynamic = "force-dynamic";

export const POST = createApiHandler({}, async () => {
  await clearConnection();
  return NextResponse.json({ success: true });
});
