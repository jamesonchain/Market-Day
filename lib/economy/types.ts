import type { AgentRole, SettlementResult } from "@/lib/near/types";
export type { AgentRole } from "@/lib/near/types";

export type Item = "flour" | "wheat" | "grain" | "bread" | "wind";
export type ActionKind = "post bid" | "accept offer" | "counter" | "produce" | "rest";
export type EconomyEvent = {
  id: string;
  tick: number;
  at: string;
  type: "need" | "bid" | "offer" | "counter" | "policy check" | "blocked" | "settled" | "produced";
  actor: AgentRole;
  message: string;
  label: "TESTNET TRANSFER" | "INTENTS QUOTE (mainnet data)" | "DEMO LEDGER" | "MAINNET SWAP" | "LOCAL RULE";
  data?: Record<string, string | number | boolean>;
};

export type AgentState = {
  role: AgentRole;
  displayName: string;
  needs: { hunger: number; supplies: number };
  inventory: Partial<Record<Item, number>>;
  balance: number;
  personality: string;
  goal: string;
};

export type AgentProposal = { action: ActionKind; item?: Item; amount?: number; price?: number; target?: AgentRole; reason: string };
export type SettlementEvent = EconomyEvent & { settlement?: SettlementResult };
