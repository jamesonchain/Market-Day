import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());
const { AGENT_ROLES, getAgentKey, getParentReadiness, nearConfig, readUsdcRaw } = await import("../lib/near/runtime");
const { createAgentAccount, ensureAgentNear, registerStorage, transferUsdcFromParent, withRetries } = await import("../lib/near/accounts");

const explorer = (accountId: string) => `https://testnet.nearblocks.io/address/${accountId}`;
const usdcUnits = (amount: string) => BigInt(Math.round(Number(amount) * 1_000_000));
type LocalAgent = { accountId: string; publicKey: string; privateKey: string };

async function writeAgentFiles(agents: Record<string, LocalAgent>) {
  await writeFile(".near-agents.json", `${JSON.stringify({ network: "testnet", parentAccountId: nearConfig.parentAccountId, agents }, null, 2)}\n`, { mode: 0o600 });
  const filename = ".env.local"; const previous = existsSync(filename) ? await readFile(filename, "utf8") : "";
  const lines = previous.split("\n").filter((line) => !line.startsWith("NEAR_AGENT_PRIVATE_KEYS_JSON=")); while (lines.at(-1) === "") lines.pop();
  const keys = Object.fromEntries(Object.entries(agents).map(([role, agent]) => [role, agent.privateKey])); lines.push(`NEAR_AGENT_PRIVATE_KEYS_JSON=${JSON.stringify(keys)}`, ""); await writeFile(filename, lines.join("\n"), { mode: 0o600 });
}

async function main() {
  if (!nearConfig.parentAccountId) throw new Error("Set NEAR_PARENT_ACCOUNT_ID to the named testnet parent account first.");
  console.log(`Parent: ${nearConfig.parentAccountId}`);
  const parent = await getParentReadiness();
  if (!parent.accountExists) throw new Error(`Parent ${nearConfig.parentAccountId} was not found on testnet. Fund it, then retry.`);
  if (!parent.hasNear) throw new Error(`Parent ${nearConfig.parentAccountId} has no NEAR for subaccount creation and storage deposits.`);
  if (!nearConfig.usdcContractId) { console.warn("NEAR_USDC_CONTRACT_ID is missing. Open https://testnet.nearblocks.io, open marketday.testnet, select Tokens, and copy the testnet USDC contract ID into .env.local."); }
  const agents: Record<string, LocalAgent> = {};
  for (const role of AGENT_ROLES) {
    const account = await withRetries(`prepare ${role}`, () => createAgentAccount(role));
    const nearFunding = await withRetries(`verify ${account.accountId} NEAR balance`, () => ensureAgentNear(role, "0.3"));
    const privateKey = account.privateKey ?? getAgentKey(role)?.toString();
    if (!privateKey) throw new Error(`No local key available for ${account.accountId}. Restore .near-agents.json or NEAR_AGENT_PRIVATE_KEYS_JSON.`);
    agents[role] = { accountId: account.accountId, publicKey: account.publicKey, privateKey };
    console.log(`${role}: ${account.accountId} ${explorer(account.accountId)}${nearFunding.funded ? " top up sent" : " funded"}`);
  }
  await writeAgentFiles(agents);
  console.log("Saved agent keys to ignored .near-agents.json and NEAR_AGENT_PRIVATE_KEYS_JSON in .env.local. Private keys were not printed.");
  if (!nearConfig.usdcContractId) return;
  for (const role of AGENT_ROLES) { const storage = await registerStorage(role); console.log(`${role} USDC registration: ${storage.registered ? "ready" : "skipped"}`); }
  const parentUsdc = await readUsdcRaw(nearConfig.parentAccountId);
  const startingUsdc = process.env.NEAR_AGENT_STARTING_USDC ?? "3";
  const required = usdcUnits(startingUsdc) * BigInt(AGENT_ROLES.length);
  if (!parentUsdc || parentUsdc < required) { console.warn(`Parent USDC is ${parentUsdc === null ? "unavailable" : parentUsdc.toString()} raw units. Need ${required.toString()} raw units for ${startingUsdc} USDC per agent. Skipping USDC funding.`); return; }
  for (const role of AGENT_ROLES) { const result = await transferUsdcFromParent(role, startingUsdc); console.log(`${role} funded with ${startingUsdc} USDC. Transaction: ${result.txHash ? `${result.txHash} ${explorer(result.to)}` : "skipped"}`); }
}

void main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
