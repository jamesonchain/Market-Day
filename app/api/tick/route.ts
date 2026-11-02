import { NextResponse } from "next/server";
import { runTick } from "@/lib/economy/store";
export async function POST() { return NextResponse.json(await runTick()); }
