import { NextResponse } from "next/server";
import { AGENT_ROLES, agentAccountId, appMode, isNearConfigured } from "@/lib/near/runtime";
import { getIntentsDryQuote } from "@/lib/near/intents";
import { getSettlementAdapter } from "@/lib/near/settlement";
export async function GET() { const adapter = getSettlementAdapter(); const quote = await getIntentsDryQuote("1000000"); return NextResponse.json({ network: "testnet", mode: appMode(), ledger: adapter.mode, nearConfigured: isNearConfigured(), agents: AGENT_ROLES.map((role) => ({ role, accountId: agentAccountId(role) })), quote }); }
