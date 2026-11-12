import { NextResponse } from "next/server";
import { AGENT_ROLES } from "@/lib/near/runtime";
import { getPolicy, updatePolicy } from "@/lib/policy/store";
import type { AgentRole } from "@/lib/economy/types";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const role = (new URL(request.url).searchParams.get("role") ?? "baker") as AgentRole;
  return NextResponse.json({ role, policy: getPolicy(AGENT_ROLES.includes(role) ? role : "baker") });
}
export async function POST(request: Request) {
  const body = await request.json() as { role?: AgentRole; dailySpendLimit?: number; maxPrice?: number; allowedCounterparties?: AgentRole[] };
  const role = AGENT_ROLES.includes(body.role as AgentRole) ? body.role as AgentRole : "baker";
  const policy = updatePolicy(role, { dailySpendLimit: Number(body.dailySpendLimit), maxPricePerItem: { flour: Number(body.maxPrice) }, allowedCounterparties: body.allowedCounterparties ?? [] });
  return NextResponse.json({ role, policy });
}
