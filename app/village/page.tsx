import MarketdayConsole from "@/components/marketday-console";
import { getAgents } from "@/lib/economy/store";
import { actualAppMode, agentAccountId, readBlockHeight } from "@/lib/near/runtime";
import { getBalance } from "@/lib/near/accounts";
import { getPolicyUsage } from "@/lib/policy/store";

export const dynamic = "force-dynamic";

export default async function VillagePage({ searchParams }: { searchParams?: Promise<{ panel?: string }> }) {
  const mode = await actualAppMode();
  const blockHeight = await readBlockHeight();
  const agents = await Promise.all(getAgents().map(async (agent) => { const balance = mode === "REAL TESTNET" ? await getBalance(agent.role) : null; return { ...agent, accountId: agentAccountId(agent.role), explorer: `https://testnet.nearblocks.io/address/${agentAccountId(agent.role)}`, usdc: balance?.usdc, near: balance?.near, usage: getPolicyUsage(agent.role) }; }));
  const requested = (await searchParams)?.panel;
  const initialPanel = ["feed", "market", "leash", "status"].includes(requested ?? "") ? requested as "feed" | "market" | "leash" | "status" : "feed";
  return <MarketdayConsole snapshot={{ mode, blockHeight, agents }} initialPanel={initialPanel} />;
}
