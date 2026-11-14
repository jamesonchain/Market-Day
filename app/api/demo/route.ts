import { NextResponse } from "next/server";
import { makeBakerHungry, resetEconomy, runStoryBeat } from "@/lib/economy/store";
export async function POST(request: Request) { const body = await request.json().catch(() => ({})) as { scenario?: string; fresh?: boolean }; if (body.scenario === "reset") return NextResponse.json(await resetEconomy()); if (body.scenario === "hungry") return NextResponse.json(await makeBakerHungry()); return NextResponse.json(await runStoryBeat({ fresh: body.fresh ?? true })); }
