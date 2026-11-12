import type { AgentRole } from "@/lib/economy/types";
import { defaultPolicies, type SpendingPolicy } from "./policy";

const policies = new Map<AgentRole, SpendingPolicy>();
const usage = new Map<AgentRole, number>();

function clone(policy: SpendingPolicy): SpendingPolicy {
  return { ...policy, maxPricePerItem: { ...policy.maxPricePerItem }, allowedCounterparties: [...policy.allowedCounterparties] };
}

export function getPolicy(role: AgentRole) {
  if (!policies.has(role)) policies.set(role, clone(defaultPolicies[role]));
  return clone(policies.get(role)!);
}

export function updatePolicy(role: AgentRole, input: Partial<SpendingPolicy>) {
  const next = { ...getPolicy(role), ...input, maxPricePerItem: { ...getPolicy(role).maxPricePerItem, ...(input.maxPricePerItem ?? {}) } };
  policies.set(role, { ...next, allowedCounterparties: [...next.allowedCounterparties] });
  return clone(next);
}

export function getPolicyUsage(role: AgentRole) { return usage.get(role) ?? 0; }
export function recordPolicySpend(role: AgentRole, amount: number) { usage.set(role, getPolicyUsage(role) + amount); }
export function resetPolicyUsage() { usage.clear(); }
