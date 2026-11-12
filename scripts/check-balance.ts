import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());
const { AGENT_ROLES, getParentReadiness, nearConfig } = await import("../lib/near/runtime");
const { getBalance } = await import("../lib/near/accounts");

if (!nearConfig.parentAccountId) throw new Error("NEAR_PARENT_ACCOUNT_ID is required");
if (nearConfig.networkId !== "testnet") throw new Error("Balance checks are testnet only");
const parent = await getParentReadiness();
console.log(JSON.stringify({ network: "testnet", accountId: nearConfig.parentAccountId, near: parent.near, usdc: parent.usdc, accountExists: parent.accountExists }, null, 2));
if (!nearConfig.usdcContractId) console.log("Set NEAR_USDC_CONTRACT_ID: open https://testnet.nearblocks.io, open marketday.testnet, select Tokens, and copy the testnet USDC contract ID.");
for (const role of AGENT_ROLES) { const balance = await getBalance(role); console.log(JSON.stringify({ role, accountId: balance.accountId, near: balance.near, usdc: balance.usdc, explorer: `https://testnet.nearblocks.io/address/${balance.accountId}` })); }
