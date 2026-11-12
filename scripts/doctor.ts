import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());
const { AGENT_ROLES, agentAccountId, getParentReadiness, nearConfig, readAccount, readUsdcRaw } = await import("../lib/near/runtime");

const fixes: string[] = [];
console.log("Marketday testnet doctor");
if (!nearConfig.parentAccountId) fixes.push("Set NEAR_PARENT_ACCOUNT_ID to the named testnet account, for example marketday.testnet.");
if (!nearConfig.usdcContractId) fixes.push("Set NEAR_USDC_CONTRACT_ID. Open https://testnet.nearblocks.io, open marketday.testnet, select Tokens, and copy the testnet USDC contract ID.");
const parent = nearConfig.parentAccountId ? await getParentReadiness() : null;
if (parent) { console.log(`Parent ${nearConfig.parentAccountId}: ${parent.near} NEAR, ${parent.usdc} USDC`); if (!parent.accountExists) fixes.push(`Parent ${nearConfig.parentAccountId} does not exist on testnet.`); if (!parent.hasNear) fixes.push(`Fund ${nearConfig.parentAccountId} with testnet NEAR for account creation and storage deposits.`); if (nearConfig.usdcContractId && !parent.hasUsdc) fixes.push(`Fund ${nearConfig.parentAccountId} with testnet USDC before running seed.agents.`); }
for (const role of AGENT_ROLES) { const accountId = agentAccountId(role); const account = await readAccount(accountId); const usdc = await readUsdcRaw(accountId); console.log(`${role}: ${accountId} ${account ? "exists" : "missing"}, USDC ${usdc === null ? "unavailable" : usdc.toString()}`); if (!account) fixes.push(`Run npx tsx scripts/seed-agents.ts to create ${accountId}.`); }
if (fixes.length) { console.log("Fixes needed:"); fixes.forEach((fix) => console.log(`- ${fix}`)); process.exitCode = 1; } else console.log("Testnet setup looks ready. No private keys were printed.");
