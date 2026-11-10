import { NextResponse } from "next/server";
import { AGENT_ROLES, agentAccountId, appMode } from "@/lib/near/runtime";
import { getBalance } from "@/lib/near/accounts";
import { getLlmUsage } from "@/lib/economy/agents";
import { persistenceMode } from "@/lib/economy/persistence";

export const dynamic = "force-dynamic";
export async function GET() {
  const accounts = await Promise.all(AGENT_ROLES.map(async (role) => { try { const balance = await getBalance(role); return { ...balance, explorer: `https://testnet.nearblocks.io/address/${balance.accountId}` }; } catch { return { role, accountId: agentAccountId(role), near: "unavailable", usdc: "unavailable", mode: appMode() }; } }));
  return NextResponse.json({ mode: appMode(), network: "testnet", persistence: persistenceMode(), productionDatabaseReady: persistenceMode() === "SUPABASE", accounts, llm: getLlmUsage(), env: { parentAccount: Boolean(process.env.NEAR_PARENT_ACCOUNT_ID), parentPrivateKey: Boolean(process.env.NEAR_PARENT_PRIVATE_KEY), testnetUsdcContract: Boolean(process.env.NEAR_USDC_CONTRACT_ID), gemini: Boolean(process.env.GEMINI_API_KEY), groq: Boolean(process.env.GROQ_API_KEY), cronSecret: Boolean(process.env.CRON_SECRET), supabase: persistenceMode() === "SUPABASE" } });
}
