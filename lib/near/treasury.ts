import { KeyPair } from "near-api-js";
import { FungibleToken } from "near-api-js/tokens";
import { agentAccountId } from "./runtime";
import type { AgentRole } from "./types";

const tipHits = new Map<string, number>();
export type TipResult = { mode: "TESTNET TRANSFER" | "DEMO LEDGER"; agent: AgentRole; amount: string; txHash?: string; reason?: string };

export async function sendTreasuryTip(agent: AgentRole, amount: string, visitorKey: string): Promise<TipResult> {
  const now = Date.now();
  const last = tipHits.get(visitorKey) ?? 0;
  if (now - last < 60_000) return { mode: "DEMO LEDGER", agent, amount, reason: "tip rate limit reached" };
  tipHits.set(visitorKey, now);
  const accountId = process.env.NEAR_TREASURY_ACCOUNT_ID;
  const privateKey = process.env.NEAR_TREASURY_PRIVATE_KEY;
  const tokenContract = process.env.NEAR_USDC_CONTRACT_ID;
  if (!accountId || !privateKey || !tokenContract) return { mode: "DEMO LEDGER", agent, amount, reason: "treasury credentials are not configured" };
  const { Account, JsonRpcProvider } = await import("near-api-js");
  const treasury = new Account(accountId, new JsonRpcProvider({ url: process.env.NEAR_NODE_URL ?? "https://rpc.testnet.near.org" }), KeyPair.fromString(privateKey as `ed25519:${string}`).toString() as `ed25519:${string}`);
  const token = new FungibleToken(tokenContract, { name: "USD Coin", symbol: "USDC", decimals: 6 });
  const result = await token.transfer({ from: treasury, receiverId: agentAccountId(agent), amount: BigInt(amount) });
  return { mode: "TESTNET TRANSFER", agent, amount, txHash: result.transaction.hash };
}
