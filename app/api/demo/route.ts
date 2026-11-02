import { NextResponse } from "next/server";
import { runStoryBeat } from "@/lib/economy/store";
export async function POST() { return NextResponse.json(await runStoryBeat()); }
