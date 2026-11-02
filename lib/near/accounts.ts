import { KeyPair, actions, parseNearAmount } from "near-api-js";
import { agentAccountId, getAgentAccount, getAgentKey, getParentAccount, isNearConfigured, nearConfig } from "./runtime";
import type { AgentAccount, AgentRole } from "./types";

export async function createAgentAccount(role: AgentRole): Promise<AgentAccount> {
  const accountId = agentAccountId(role); const existing = getAgentAccount(role);
  if (existing) return { role, accountId, publicKey: getAgentKey(role)?.getPublicKey().toString() ?? "configured", mode: "TESTNET TRANSFER" };
  const parent = getParentAccount();
  if (!parent || !isNearConfigured()) return { role, accountId, publicKey: "unconfigured", mode: "DEMO LEDGER" };
  const keyPair = KeyPair.fromRandom("ed25519");
  try { await parent.createSubAccount({ accountOrPrefix: accountId, publicKey: keyPair.getPublicKey(), nearToTransfer: BigInt(parseNearAmount(Number(process.env.NEAR_AGENT_STARTING_NEAR ?? "0.1")) ?? "0") }); } catch (error) { const message = error instanceof Error ? error.message : String(error); if (!message.toLowerCase().includes("already exists")) throw error; }
  return { role, accountId, publicKey: keyPair.getPublicKey().toString(), mode: "TESTNET TRANSFER" };
}
export async function getBalance(role: AgentRole) { const account = getAgentAccount(role); if (!account) return { role, accountId: agentAccountId(role), near: "0", usdc: "0", mode: "DEMO LEDGER" as const }; const state = await account.getBalance(); return { role, accountId: agentAccountId(role), near: state.toString(), usdc: "unknown", mode: "TESTNET TRANSFER" as const }; }
export async function transferNear(from: AgentRole, to: AgentRole, amountNear: string) { const sender = getAgentAccount(from); const receiverId = agentAccountId(to); if (!sender) return { mode: "DEMO LEDGER" as const, receiverId, amountNear }; const result = await sender.transfer({ receiverId, amount: BigInt(parseNearAmount(Number(amountNear)) ?? "0") }); return { mode: "TESTNET TRANSFER" as const, receiverId, amountNear, txHash: result.transaction.hash }; }
export async function registerStorage(role: AgentRole) { const account = getAgentAccount(role); if (!account || !nearConfig.usdcContractId) return { mode: "DEMO LEDGER" as const, accountId: agentAccountId(role) }; const result = await account.signAndSendTransaction({ receiverId: nearConfig.usdcContractId, actions: [actions.functionCall("storage_deposit", { account_id: agentAccountId(role), registration_only: true }, 30_000_000_000_000n, 1_250_000_000_000_000_000_000n)] }); return { mode: "TESTNET TRANSFER" as const, accountId: agentAccountId(role), txHash: result.transaction.hash }; }
