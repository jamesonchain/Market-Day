import { NextResponse } from "next/server";
import { AGENT_ROLES, actualAppMode, agentAccountId, getParentReadiness, readBlockHeight } from "@/lib/near/runtime";
import { getBalance } from "@/lib/near/accounts";
import { getLlmUsage } from "@/lib/economy/agents";
import { persistenceMode } from "@/lib/economy/persistence";

export const dynamic = "force-dynamic";
export async function GET() {
  const parent = await getParentReadiness(); const mode = await actualAppMode();
  const accounts = await Promise.all(AGENT_ROLES.map(async (role) => { try { const balance = await getBalance(role); return { ...balance, explorer: `https://testnet.nearblocks.io/address/${balance.accountId}` }; } catch { return { role, accountId: agentAccountId(role), near: "unavailable", usdc: "unavailable", mode }; } }));
  return NextResponse.json({ mode, network: "testnet", blockHeight: await readBlockHeight(), parent, persistence: persistenceMode(), productionDatabaseReady: persistenceMode() === "SUPABASE", accounts, llm: getLlmUsage(), env: { parentAccount: Boolean(process.env.NEAR_PARENT_ACCOUNT_ID), parentPrivateKey: Boolean(process.env.NEAR_PARENT_PRIVATE_KEY), testnetUsdcContract: Boolean(process.env.NEAR_USDC_CONTRACT_ID), parentOnTestnet: parent.accountExists, parentHasNear: parent.hasNear, gemini: Boolean(process.env.GEMINI_API_KEY), groq: Boolean(process.env.GROQ_API_KEY), cronSecret: Boolean(process.env.CRON_SECRET), supabase: persistenceMode() === "SUPABASE" } });
}
