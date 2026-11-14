import { existsSync } from "node:fs";
import { join } from "node:path";
import LandingPage from "@/components/landing-page";
import { getAgents } from "@/lib/economy/store";
import { actualAppMode, agentAccountId } from "@/lib/near/runtime";
import { getEvents } from "@/lib/economy/store";

export const dynamic = "force-dynamic";
export default async function Home() {
  const mode = await actualAppMode();
  const agents = getAgents().map((agent) => ({ ...agent, accountId: agentAccountId(agent.role), explorer: `https://testnet.nearblocks.io/address/${agentAccountId(agent.role)}` }));
  const hasDemoVideo = existsSync(join(process.cwd(), "public/video/demo.mp4"));
  return <LandingPage agents={agents} events={getEvents()} mode={mode} hasDemoVideo={hasDemoVideo} />;
}
