import type { AgentRole, EconomyEvent } from "@/lib/economy/types";

export type TradeProposal = { buyer: AgentRole; seller: AgentRole; item: "flour" | "wheat" | "bread"; amount: number; unitPrice: number; spentToday: number };
export type SpendingPolicy = { dailySpendLimit: number; maxPricePerItem: Record<string, number>; allowedCounterparties: AgentRole[]; sanityMultiplier: number };
export type PolicyResult = { allowed: boolean; reason: string };

export const defaultPolicies: Record<AgentRole, SpendingPolicy> = {
  baker: { dailySpendLimit: 10, maxPricePerItem: { flour: 5, wheat: 3, bread: 8 }, allowedCounterparties: ["farmer", "farmerTwo", "miller", "merchant"], sanityMultiplier: 1.5 },
  farmer: { dailySpendLimit: 20, maxPricePerItem: { flour: 5, wheat: 3, bread: 8 }, allowedCounterparties: ["baker", "miller", "merchant"], sanityMultiplier: 1.5 },
  farmerTwo: { dailySpendLimit: 20, maxPricePerItem: { flour: 5, wheat: 3, bread: 8 }, allowedCounterparties: ["baker", "miller", "merchant"], sanityMultiplier: 1.5 },
  miller: { dailySpendLimit: 25, maxPricePerItem: { flour: 5, wheat: 3, bread: 8 }, allowedCounterparties: ["baker", "farmer", "farmerTwo", "merchant"], sanityMultiplier: 1.5 },
  merchant: { dailySpendLimit: 30, maxPricePerItem: { flour: 5, wheat: 3, bread: 8 }, allowedCounterparties: ["baker", "farmer", "farmerTwo", "miller"], sanityMultiplier: 1.5 },
};

export function checkSpendingPolicy(trade: TradeProposal, policy = defaultPolicies[trade.buyer], fairUnitPrice: number): PolicyResult {
  const total = trade.amount * trade.unitPrice;
  if (trade.spentToday + total > policy.dailySpendLimit) return { allowed: false, reason: `daily spend limit ${policy.dailySpendLimit} USDC would be exceeded` };
  if (trade.unitPrice > (policy.maxPricePerItem[trade.item] ?? 0)) return { allowed: false, reason: `max price for ${trade.item} is ${policy.maxPricePerItem[trade.item]} USDC` };
  if (!policy.allowedCounterparties.includes(trade.seller)) return { allowed: false, reason: `${trade.seller} is not an allowed counterparty` };
  if (trade.unitPrice > fairUnitPrice * policy.sanityMultiplier) return { allowed: false, reason: `quote ${trade.unitPrice} USDC is above fair price ${fairUnitPrice} USDC` };
  return { allowed: true, reason: "trade is inside the spending leash" };
}

export function blockedEvent(tick: number, actor: AgentRole, reason: string): EconomyEvent { return { id: crypto.randomUUID(), tick, at: new Date().toISOString(), type: "blocked", actor, message: `spending policy blocked trade: ${reason}`, label: "LOCAL RULE", data: { reason } }; }
