import { NextResponse } from "next/server";
import { runTick } from "@/lib/economy/store";

export const maxDuration = 30;
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");
  if (secret && authorization !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await runTick());
}
