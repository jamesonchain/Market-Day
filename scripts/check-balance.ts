import { JsonRpcProvider } from "near-api-js";
import { nearConfig } from "../lib/near/runtime";

const accountId = process.env.NEAR_PARENT_ACCOUNT_ID;
const tokenContract = process.env.NEAR_USDC_CONTRACT_ID;
if (!accountId) throw new Error("NEAR_PARENT_ACCOUNT_ID is required");
if (!tokenContract) throw new Error("NEAR_USDC_CONTRACT_ID is required");
if (nearConfig.networkId !== "testnet") throw new Error("Balance checks are testnet only");
const provider = new JsonRpcProvider({ url: nearConfig.nodeUrl });
const native = await provider.query({ request_type: "view_account", finality: "final", account_id: accountId }) as { amount: string };
const args = Buffer.from(JSON.stringify({ account_id: accountId })).toString("base64");
const token = await provider.query({ request_type: "call_function", finality: "final", account_id: tokenContract, method_name: "ft_balance_of", args_base64: args }) as { result: number[] };
const usdcRaw = Buffer.from(token.result).toString("utf8").replaceAll('"', "");
console.log(JSON.stringify({ network: "testnet", accountId, nearYocto: native.amount, usdcRaw, tokenContract }, null, 2));
