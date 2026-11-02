export type AgentRole = "baker" | "farmer" | "farmerTwo" | "miller" | "merchant";
export type AgentAccount = { role: AgentRole; accountId: string; publicKey: string; mode: "TESTNET TRANSFER" | "DEMO LEDGER" };
export type SettlementResult = { mode: "TESTNET TRANSFER" | "DEMO LEDGER" | "MAINNET SWAP"; txHash?: string; from: string; to: string; token: string; amount: string };
export type QuoteResult = { mode: "INTENTS QUOTE (mainnet data)" | "DEMO LEDGER"; amountIn: string; amountOut: string; originAsset: string; destinationAsset: string; source: "1Click dry quote" | "deterministic fallback" };
export interface SettlementAdapter { readonly mode: SettlementResult["mode"]; transferToken(from: AgentRole, to: AgentRole, amount: string): Promise<SettlementResult>; }
