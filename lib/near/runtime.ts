import { Account, KeyPair, JsonRpcProvider, type Provider } from "near-api-js";
import type { AgentRole } from "./types";

export const AGENT_ROLES: AgentRole[] = ["baker", "farmer", "farmerTwo", "miller", "merchant"];
export const nearConfig = { networkId: process.env.NEAR_NETWORK_ID ?? "testnet", nodeUrl: process.env.NEAR_NODE_URL ?? "https://rpc.testnet.near.org", parentAccountId: process.env.NEAR_PARENT_ACCOUNT_ID ?? "", parentPrivateKey: process.env.NEAR_PARENT_PRIVATE_KEY ?? "", usdcContractId: process.env.NEAR_USDC_CONTRACT_ID ?? "", agentAccountSuffix: process.env.NEAR_AGENT_ACCOUNT_SUFFIX ?? "" };
export function isNearConfigured() { return nearConfig.networkId === "testnet" && Boolean(nearConfig.parentAccountId && nearConfig.parentPrivateKey && nearConfig.usdcContractId); }
export function getProvider(): Provider { return new JsonRpcProvider({ url: nearConfig.nodeUrl }); }
export function getParentAccount() { return nearConfig.parentAccountId && nearConfig.parentPrivateKey ? new Account(nearConfig.parentAccountId, getProvider(), KeyPair.fromString(nearConfig.parentPrivateKey as `ed25519:${string}`).toString() as `ed25519:${string}`) : null; }
export function agentAccountId(role: AgentRole) { const prefix = role === "farmerTwo" ? "farmer-two" : role; const suffix = nearConfig.agentAccountSuffix || nearConfig.parentAccountId; return suffix ? `${prefix}.${suffix}` : `${prefix}.demo.testnet`; }
export function getAgentKey(role: AgentRole) { const keys = process.env.NEAR_AGENT_PRIVATE_KEYS_JSON; if (!keys) return null; try { const parsed = JSON.parse(keys) as Record<string, string>; return parsed[role] ? KeyPair.fromString(parsed[role] as `ed25519:${string}`) : null; } catch { return null; } }
export function getAgentAccount(role: AgentRole) { const key = getAgentKey(role); return key ? new Account(agentAccountId(role), getProvider(), key.toString() as `ed25519:${string}`) : null; }
