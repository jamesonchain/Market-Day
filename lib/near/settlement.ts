import { FungibleToken } from "near-api-js/tokens";
import { agentAccountId, getAgentAccount, isNearConfigured, nearConfig } from "./runtime";
import { registerStorage } from "./accounts";
import type { AgentRole, SettlementAdapter, SettlementResult } from "./types";

const registered = new Set<AgentRole>();
async function ensureStorage(role: AgentRole) { if (registered.has(role)) return; const result = await registerStorage(role); if (result.mode === "TESTNET TRANSFER" && result.registered) registered.add(role); }
export class TestnetTokenSettlement implements SettlementAdapter {
  readonly mode = "TESTNET TRANSFER" as const;
  async transferToken(from: AgentRole, to: AgentRole, amount: string): Promise<SettlementResult> {
    const sender = getAgentAccount(from); const receiverId = agentAccountId(to);
    if (!sender || !nearConfig.usdcContractId) return { mode: "DEMO LEDGER", from: agentAccountId(from), to: receiverId, token: "USDC.testnet", amount };
    await ensureStorage(from); await ensureStorage(to);
    const token = new FungibleToken(nearConfig.usdcContractId, { name: "USD Coin", symbol: "USDC", decimals: 6 });
    const result = await token.transfer({ from: sender, receiverId, amount: BigInt(amount) });
    const txHash = result.transaction.hash;
    return { mode: this.mode, from: agentAccountId(from), to: receiverId, token: nearConfig.usdcContractId, amount, txHash, explorerUrl: `https://testnet.nearblocks.io/txns/${txHash}` };
  }
}
export class DemoLedgerSettlement implements SettlementAdapter { readonly mode = "DEMO LEDGER" as const; async transferToken(from: AgentRole, to: AgentRole, amount: string): Promise<SettlementResult> { return { mode: this.mode, from: agentAccountId(from), to: agentAccountId(to), token: "USDC.testnet", amount }; } }
export function getSettlementAdapter(): SettlementAdapter { return isNearConfigured() ? new TestnetTokenSettlement() : new DemoLedgerSettlement(); }
