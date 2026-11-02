import type { AgentProposal, AgentRole, EconomyEvent } from "./types";

const fallback: Record<AgentRole, AgentProposal> = {
  baker: { action: "post bid", item: "flour", amount: 2, price: 3, reason: "flour stores are low" },
  farmer: { action: "accept offer", item: "flour", amount: 2, price: 3, target: "baker", reason: "fair crop exchange" },
  farmerTwo: { action: "counter", item: "flour", amount: 2, price: 12, target: "baker", reason: "scarcity premium" },
  miller: { action: "produce", item: "flour", amount: 3, reason: "mill queue is clear" },
  merchant: { action: "rest", reason: "watching the square" },
};

export async function decide(role: AgentRole, context: string): Promise<{ proposal: AgentProposal; source: "ANTHROPIC API" | "RULE FALLBACK" }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { proposal: fallback[role], source: "RULE FALLBACK" };
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" }, body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL ?? "claude-3-5-haiku-latest", max_tokens: 250, temperature: 0, system: "Return only strict JSON with action, item, amount, price, target, and reason. Allowed actions: post bid, accept offer, counter, produce, rest. Never authorize spending beyond the supplied context.", messages: [{ role: "user", content: `${context}\nAgent role: ${role}` }] }) });
    if (!response.ok) throw new Error(`Anthropic request failed: ${response.status}`);
    const json = await response.json() as { content?: Array<{ text?: string }> };
    const text = json.content?.[0]?.text;
    if (!text) throw new Error("Anthropic returned no text");
    return { proposal: JSON.parse(text) as AgentProposal, source: "ANTHROPIC API" };
  } catch { return { proposal: fallback[role], source: "RULE FALLBACK" }; }
}

export function proposalEvent(tick: number, role: AgentRole, proposal: AgentProposal, source: "ANTHROPIC API" | "RULE FALLBACK"): EconomyEvent {
  return { id: crypto.randomUUID(), tick, at: new Date().toISOString(), type: proposal.action === "post bid" ? "bid" : proposal.action === "accept offer" ? "offer" : proposal.action === "counter" ? "counter" : proposal.action === "produce" ? "produced" : "need", actor: role, message: `${role} proposes ${proposal.action}: ${proposal.reason}`, label: source === "ANTHROPIC API" ? "LOCAL RULE" : "LOCAL RULE", data: { source } };
}
