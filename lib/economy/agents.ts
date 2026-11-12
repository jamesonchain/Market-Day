import type { AgentProposal, AgentRole, EconomyEvent, Item } from "./types";

const fallback: Record<AgentRole, AgentProposal> = {
  baker: { action: "post bid", item: "flour", amount: 2, price: 3, reason: "flour stores are low" },
  farmer: { action: "accept offer", item: "flour", amount: 2, price: 3, target: "baker", reason: "fair crop exchange" },
  farmerTwo: { action: "counter", item: "flour", amount: 2, price: 12, target: "baker", reason: "scarcity premium" },
  miller: { action: "produce", item: "flour", amount: 3, reason: "mill queue is clear" },
  merchant: { action: "rest", reason: "watching the square" },
};

const actions = new Set<AgentProposal["action"]>(["post bid", "accept offer", "counter", "produce", "rest"]);
const items = new Set<Item>(["flour", "wheat", "grain", "bread", "wind"]);
const cache = new Map<string, { proposal: AgentProposal; source: DecisionSource; createdAt: number }>();
const calls: number[] = [];
type DecisionSource = "GEMINI API" | "GROQ API" | "RULE FALLBACK" | "CACHE";

function cleanWindow() { const cutoff = Date.now() - 60_000; while (calls[0] && calls[0] < cutoff) calls.shift(); }
export function getLlmUsage() { cleanWindow(); return { callsLastMinute: calls.length, capPerMinute: 10, cacheEntries: cache.size, providers: ["GEMINI_API_KEY", "GROQ_API_KEY"] }; }

function validate(value: unknown): AgentProposal | null {
  if (!value || typeof value !== "object") return null;
  const proposal = value as Partial<AgentProposal>;
  if (typeof proposal.action !== "string" || !actions.has(proposal.action as AgentProposal["action"])) return null;
  if (proposal.item !== undefined && (typeof proposal.item !== "string" || !items.has(proposal.item as Item))) return null;
  if (proposal.target !== undefined && !["baker", "farmer", "farmerTwo", "miller", "merchant"].includes(proposal.target)) return null;
  if (proposal.amount !== undefined && (typeof proposal.amount !== "number" || proposal.amount < 0 || proposal.amount > 100)) return null;
  if (proposal.price !== undefined && (typeof proposal.price !== "number" || proposal.price < 0 || proposal.price > 1000)) return null;
  if (typeof proposal.reason !== "string" || proposal.reason.length < 1 || proposal.reason.length > 240) return null;
  return { action: proposal.action as AgentProposal["action"], item: proposal.item as Item | undefined, amount: proposal.amount, price: proposal.price, target: proposal.target as AgentRole | undefined, reason: proposal.reason };
}

function parseJson(text: string) { return validate(JSON.parse(text.replace(/^```json\s*|\s*```$/g, "").trim())); }
async function askGemini(role: AgentRole, context: string) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const model = process.env.GEMINI_MODEL ?? "gemini-3.5-flash-lite";
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ generationConfig: { temperature: 0, responseMimeType: "application/json" }, systemInstruction: { parts: [{ text: "Return one JSON object only. Keys are action, item, amount, price, target, reason. Allowed actions: post bid, accept offer, counter, produce, rest." }] }, contents: [{ role: "user", parts: [{ text: `${context}\nAgent role: ${role}` }] }] }) });
  if (!response.ok) throw new Error(`Gemini request failed: ${response.status}`);
  const json = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  return parseJson(json.candidates?.[0]?.content?.parts?.[0]?.text ?? "");
}
async function askGroq(role: AgentRole, context: string) {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", { method: "POST", headers: { "content-type": "application/json", Authorization: `Bearer ${key}` }, body: JSON.stringify({ model: "llama-3.1-8b-instant", temperature: 0, response_format: { type: "json_object" }, messages: [{ role: "system", content: "Return one JSON object only. Keys are action, item, amount, price, target, reason. Allowed actions: post bid, accept offer, counter, produce, rest." }, { role: "user", content: `${context}\nAgent role: ${role}` }] }) });
  if (!response.ok) throw new Error(`Groq request failed: ${response.status}`);
  const json = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  return parseJson(json.choices?.[0]?.message?.content ?? "");
}

export async function decide(role: AgentRole, context: string): Promise<{ proposal: AgentProposal; source: DecisionSource }> {
  const cacheKey = `${role}:${context}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.createdAt < 60_000) return { proposal: cached.proposal, source: "CACHE" };
  cleanWindow();
  if (calls.length >= 10) return { proposal: fallback[role], source: "RULE FALLBACK" };
  for (const provider of [askGemini, askGroq]) {
    try {
      calls.push(Date.now());
      const proposal = await provider(role, context);
      if (!proposal) continue;
      const source = provider === askGemini ? "GEMINI API" as const : "GROQ API" as const;
      cache.set(cacheKey, { proposal, source, createdAt: Date.now() });
      return { proposal, source };
    } catch { continue; }
  }
  return { proposal: fallback[role], source: "RULE FALLBACK" };
}

export function proposalEvent(tick: number, role: AgentRole, proposal: AgentProposal, source: DecisionSource): EconomyEvent {
  return { id: crypto.randomUUID(), tick, at: new Date().toISOString(), type: proposal.action === "post bid" ? "bid" : proposal.action === "accept offer" ? "offer" : proposal.action === "counter" ? "counter" : proposal.action === "produce" ? "produced" : "need", actor: role, message: `${role} proposes ${proposal.action}: ${proposal.reason}`, label: "LOCAL RULE", data: { source } };
}
