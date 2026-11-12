import { KeyPair, actions, parseNearAmount } from "near-api-js";
import { FungibleToken } from "near-api-js/tokens";
import { agentAccountId, formatNear, formatUsdc, getAgentAccount, getAgentKey, getParentAccount, isNearConfigured, nearConfig, readAccount, readUsdcRaw } from "./runtime";
import type { AgentAccount, AgentRole } from "./types";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
export async function withRetries<T>(label: string, task: () => Promise<T>, attempts = 3): Promise<T> { let lastError: unknown; for (let attempt = 1; attempt <= attempts; attempt += 1) { try { return await task(); } catch (error) { lastError = error; if (attempt < attempts) { console.warn(`${label} failed, retrying ${attempt}/${attempts - 1}`); await sleep(attempt * 1000); } } } throw lastError instanceof Error ? lastError : new Error(`${label} failed`); }

export async function createAgentAccount(role: AgentRole): Promise<AgentAccount> {
  const accountId = agentAccountId(role);
  const existing = await readAccount(accountId);
  const knownKey = getAgentKey(role);
  if (existing) {
    if (!knownKey) throw new Error(`${accountId} exists but its local key is missing. Restore .near-agents.json or NEAR_AGENT_PRIVATE_KEYS_JSON.`);
    return { role, accountId, publicKey: knownKey.getPublicKey().toString(), mode: "TESTNET TRANSFER" };
  }
  const parent = getParentAccount();
  if (!parent || !isNearConfigured()) return { role, accountId, publicKey: "unconfigured", mode: "DEMO LEDGER" };
  const keyPair = KeyPair.fromRandom("ed25519");
  await withRetries(`create ${accountId}`, () => parent.createSubAccount({ accountOrPrefix: accountId, publicKey: keyPair.getPublicKey(), nearToTransfer: BigInt(parseNearAmount(Number(process.env.NEAR_AGENT_STARTING_NEAR ?? "0.3")) ?? "0") }));
  return { role, accountId, publicKey: keyPair.getPublicKey().toString(), privateKey: keyPair.toString(), mode: "TESTNET TRANSFER" };
}

export async function ensureAgentNear(role: AgentRole, minimumNear = process.env.NEAR_AGENT_STARTING_NEAR ?? "0.3") {
  const accountId = agentAccountId(role); const state = await readAccount(accountId); const target = BigInt(parseNearAmount(Number(minimumNear)) ?? "0");
  if (!state || BigInt(state.amount) >= target) return { accountId, funded: false, amountNear: minimumNear };
  const parent = getParentAccount(); if (!parent) throw new Error(`Parent credentials are missing while topping up ${accountId}`);
  const result = await withRetries(`top up ${accountId}`, () => parent.transfer({ receiverId: accountId, amount: target - BigInt(state.amount) }));
  return { accountId, funded: true, amountNear: minimumNear, txHash: result.transaction.hash };
}

export async function getBalance(role: AgentRole) {
  const accountId = agentAccountId(role); const state = await readAccount(accountId); const usdc = await readUsdcRaw(accountId);
  return { role, accountId, near: formatNear(state?.amount ?? null), usdc: formatUsdc(usdc), mode: state ? "TESTNET TRANSFER" as const : "DEMO LEDGER" as const };
}

export async function transferNear(from: AgentRole, to: AgentRole, amountNear: string) { const sender = getAgentAccount(from); const receiverId = agentAccountId(to); if (!sender) return { mode: "DEMO LEDGER" as const, receiverId, amountNear }; const result = await withRetries(`transfer ${amountNear} NEAR`, () => sender.transfer({ receiverId, amount: BigInt(parseNearAmount(Number(amountNear)) ?? "0") })); return { mode: "TESTNET TRANSFER" as const, receiverId, amountNear, txHash: result.transaction.hash }; }

export async function registerStorage(role: AgentRole) {
  const account = getAgentAccount(role); if (!account || !nearConfig.usdcContractId) return { mode: "DEMO LEDGER" as const, accountId: agentAccountId(role), registered: false };
  try { const result = await withRetries(`register ${agentAccountId(role)} on USDC`, () => account.signAndSendTransaction({ receiverId: nearConfig.usdcContractId, actions: [actions.functionCall("storage_deposit", { account_id: agentAccountId(role), registration_only: true }, 30_000_000_000_000n, 1_250_000_000_000_000_000_000n)] })); return { mode: "TESTNET TRANSFER" as const, accountId: agentAccountId(role), registered: true, txHash: result.transaction.hash }; } catch (error) { const message = error instanceof Error ? error.message : String(error); if (message.toLowerCase().includes("already registered")) return { mode: "TESTNET TRANSFER" as const, accountId: agentAccountId(role), registered: true }; throw error; }
}

export async function transferUsdcFromParent(to: AgentRole, amountUsdc = process.env.NEAR_AGENT_STARTING_USDC ?? "3") {
  const parent = getParentAccount(); if (!parent || !nearConfig.usdcContractId) return { mode: "DEMO LEDGER" as const, to: agentAccountId(to), amountUsdc, skipped: true };
  const token = new FungibleToken(nearConfig.usdcContractId, { name: "USD Coin", symbol: "USDC", decimals: 6 });
  const result = await withRetries(`fund ${agentAccountId(to)} with USDC`, () => token.transfer({ from: parent, receiverId: agentAccountId(to), amount: BigInt(Math.round(Number(amountUsdc) * 1_000_000)) }));
  return { mode: "TESTNET TRANSFER" as const, to: agentAccountId(to), amountUsdc, txHash: result.transaction.hash };
}
