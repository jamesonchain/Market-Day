import { NextResponse } from "next/server";
import { runTick } from "@/lib/economy/store";
export async function POST(request: Request) { const secret = process.env.CRON_SECRET; const authorization = request.headers.get("authorization"); const isBrowser = request.headers.get("origin") || request.headers.get("referer"); if (secret && !isBrowser && authorization !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); return NextResponse.json(await runTick()); }
