import { NextResponse } from "next/server";
import { runTick } from "@/lib/economy/store";
let activeTick: Promise<Awaited<ReturnType<typeof runTick>>> | null = null;
let lastBrowserTick = 0;
export async function POST(request: Request) { const secret = process.env.CRON_SECRET; const authorization = request.headers.get("authorization"); const isBrowser = Boolean(request.headers.get("origin") || request.headers.get("referer")); if (secret && !isBrowser && authorization !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); if (isBrowser && Date.now() - lastBrowserTick < 3500) return NextResponse.json({ ok: true, skipped: "rate limited" }); lastBrowserTick = Date.now(); if (!activeTick) activeTick = runTick().finally(() => { activeTick = null; }); return NextResponse.json(await activeTick); }
