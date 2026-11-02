import { NextResponse } from "next/server";
import { sendTreasuryTip } from "@/lib/near/treasury";
import type { AgentRole } from "@/lib/near/types";

const roles = new Set<AgentRole>(["baker", "farmer", "farmerTwo", "miller", "merchant"]);
export async function POST(request: Request) {
  const body = await request.json() as { agent?: AgentRole; amount?: number };
  if (!body.agent || !roles.has(body.agent) || !body.amount || body.amount <= 0 || body.amount > 1) return NextResponse.json({ error: "Tip must be between 0 and 1 USDC." }, { status: 400 });
  const visitorKey = request.headers.get("x-forwarded-for") ?? "guest";
  return NextResponse.json(await sendTreasuryTip(body.agent, Math.round(body.amount * 1_000_000).toString(), visitorKey));
}
