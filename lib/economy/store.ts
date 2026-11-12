import { decide, proposalEvent } from "./agents";
import type { AgentRole, AgentState, EconomyEvent } from "./types";
import { getSettlementAdapter } from "../near/settlement";
import { blockedEvent, checkSpendingPolicy } from "../policy/policy";
import { loadSnapshot, persistenceMode, saveSnapshot } from "./persistence";

const roles: AgentRole[] = ["baker", "farmer", "farmerTwo", "miller", "merchant"];
const agents = new Map<AgentRole, AgentState>([
  ["baker", { role: "baker", displayName: "Baker", needs: { hunger: 22, supplies: 78 }, inventory: { flour: 0, bread: 1 }, balance: 18, personality: "careful and warm", goal: "keep the ovens running" }],
  ["farmer", { role: "farmer", displayName: "Farmer", needs: { hunger: 38, supplies: 86 }, inventory: { wheat: 18 }, balance: 12, personality: "patient and fair", goal: "trade a fair harvest" }],
  ["farmerTwo", { role: "farmerTwo", displayName: "Farmer Two", needs: { hunger: 42, supplies: 68 }, inventory: { wheat: 15 }, balance: 12, personality: "bold and opportunistic", goal: "test the square" }],
  ["miller", { role: "miller", displayName: "Miller", needs: { hunger: 31, supplies: 74 }, inventory: { grain: 8, flour: 3 }, balance: 20, personality: "precise and quiet", goal: "turn grain into flour" }],
  ["merchant", { role: "merchant", displayName: "Merchant", needs: { hunger: 25, supplies: 65 }, inventory: { bread: 2 }, balance: 30, personality: "curious and social", goal: "keep the market moving" }],
]);
let tickNumber = 0;
let events: EconomyEvent[] = [];
const listeners = new Set<(event: EconomyEvent) => void>();
let hydrated: Promise<void> | null = null;

function emit(event: EconomyEvent) { events = [...events.slice(-99), event]; listeners.forEach((listener) => listener(event)); return event; }
function event(tick: number, type: EconomyEvent["type"], actor: AgentRole, message: string, label: EconomyEvent["label"], data?: EconomyEvent["data"]): EconomyEvent { return { id: crypto.randomUUID(), tick, at: new Date().toISOString(), type, actor, message, label, data }; }
function settlementDetails(settlement: { txHash?: string; explorerUrl?: string }) { return settlement.txHash ? ` transaction ${settlement.txHash} ${settlement.explorerUrl ?? ""}` : ""; }

export function getAgents() { return roles.map((role) => agents.get(role)!); }
export function getEvents() { return events; }
export function subscribe(listener: (event: EconomyEvent) => void) { listeners.add(listener); return () => listeners.delete(listener); }
async function hydrate() { if (!hydrated) hydrated = loadSnapshot().then((snapshot) => { if (!snapshot) return; tickNumber = snapshot.tick; events = snapshot.events; snapshot.agents.forEach((agent) => agents.set(agent.role, agent)); }); await hydrated; }
async function persist() { await saveSnapshot({ agents: getAgents(), events: getEvents(), tick: tickNumber }); }

export async function runTick() {
  await hydrate();
  tickNumber += 1;
  const baker = agents.get("baker")!;
  baker.needs.hunger = Math.min(100, baker.needs.hunger + 3);
  baker.needs.supplies = Math.max(0, baker.needs.supplies - 8);
  emit(event(tickNumber, "need", "baker", `baker flour supply is ${baker.needs.supplies}%`, "LOCAL RULE", { item: "flour", supply: baker.needs.supplies }));
  const context = `Tick ${tickNumber}. Baker flour ${baker.inventory.flour ?? 0}. Baker balance ${baker.balance}.`;
  const bakerDecision = await decide("baker", context);
  emit(proposalEvent(tickNumber, "baker", bakerDecision.proposal, bakerDecision.source));
  if (tickNumber % 2 === 1) {
    const overcharge = checkSpendingPolicy({ buyer: "baker", seller: "farmerTwo", item: "flour", amount: 2, unitPrice: 12, spentToday: 0 }, undefined, 3);
    emit(event(tickNumber, "policy check", "baker", "farmer-two offer checked against the leash", "LOCAL RULE", { allowed: overcharge.allowed }));
    if (!overcharge.allowed) emit(blockedEvent(tickNumber, "baker", overcharge.reason));
    const fair = checkSpendingPolicy({ buyer: "baker", seller: "farmer", item: "flour", amount: 2, unitPrice: 3, spentToday: 0 }, undefined, 3);
    emit(event(tickNumber, "policy check", "baker", fair.reason, "LOCAL RULE", { allowed: fair.allowed }));
    if (!fair.allowed) return { tick: tickNumber, agents: getAgents(), events: getEvents().slice(-12) };
    const adapter = getSettlementAdapter();
    const settlement = await adapter.transferToken("farmer", "baker", "3000000");
    baker.inventory.flour = (baker.inventory.flour ?? 0) + 2;
    agents.get("farmer")!.inventory.wheat = Math.max(0, (agents.get("farmer")!.inventory.wheat ?? 0) - 2);
    baker.balance -= 3;
    agents.get("farmer")!.balance += 3;
    emit(event(tickNumber, "settled", "baker", `fair flour offer settled via ${settlement.mode}${settlementDetails(settlement)}`, settlement.mode, { amount: 3, token: "USDC", txHash: settlement.txHash ?? "", explorer: settlement.explorerUrl ?? "" }));
  } else {
    const miller = agents.get("miller")!;
    miller.inventory.flour = (miller.inventory.flour ?? 0) + 1;
    emit(event(tickNumber, "produced", "miller", "miller produced flour", "LOCAL RULE", { item: "flour", amount: 1 }));
  }
  await persist();
  return { tick: tickNumber, agents: getAgents(), events: getEvents().slice(-12), persistence: persistenceMode() };
}

export async function runStoryBeat() {
  await hydrate();
  tickNumber += 1;
  const baker = agents.get("baker")!; const farmer = agents.get("farmer")!; const merchant = agents.get("merchant")!;
  baker.inventory.flour = 0;
  emit(event(tickNumber, "need", "baker", "baker has run out of flour", "LOCAL RULE", { item: "flour", amount: 0 }));
  emit(event(tickNumber, "bid", "baker", "baker posts a flour bid in the square", "LOCAL RULE", { amount: 2, fairPrice: 3 }));
    emit(event(tickNumber, "offer", "farmer", "farmer offers 2 flour at 3.00 USDC each", "LOCAL RULE", { unitPrice: 3 }));
  emit(event(tickNumber, "offer", "farmerTwo", "farmer two offers 2 flour at 12.00 USDC each", "LOCAL RULE", { unitPrice: 12 }));
  emit(event(tickNumber, "offer", "miller", "miller offers 2 flour at 4.00 USDC each", "LOCAL RULE", { unitPrice: 4 }));
  const overcharge = checkSpendingPolicy({ buyer: "baker", seller: "farmerTwo", item: "flour", amount: 2, unitPrice: 12, spentToday: 0 }, undefined, 3);
  emit(event(tickNumber, "policy check", "baker", "leash checks farmer two quote", "LOCAL RULE", { allowed: overcharge.allowed }));
  if (!overcharge.allowed) emit(blockedEvent(tickNumber, "baker", overcharge.reason));
  const adapter = getSettlementAdapter();
  const flourSettlement = await adapter.transferToken("farmer", "baker", "3000000");
  farmer.inventory.wheat = Math.max(0, (farmer.inventory.wheat ?? 0) - 2); baker.inventory.flour = 2; farmer.balance += 3; baker.balance -= 3;
  emit(event(tickNumber, "settled", "baker", `fair flour offer settled via ${flourSettlement.mode}${settlementDetails(flourSettlement)}`, flourSettlement.mode, { amount: 2, unitPrice: 3, txHash: flourSettlement.txHash ?? "", explorer: flourSettlement.explorerUrl ?? "" }));
  baker.inventory.flour = 0; baker.inventory.bread = (baker.inventory.bread ?? 0) + 4;
  emit(event(tickNumber, "produced", "baker", "baker baked 4 bread", "LOCAL RULE", { item: "bread", amount: 4 }));
  const breadSettlement = await adapter.transferToken("merchant", "baker", "2000000");
  merchant.inventory.bread = (merchant.inventory.bread ?? 0) + 2; baker.inventory.bread -= 2; merchant.balance -= 2; baker.balance += 2;
  emit(event(tickNumber, "settled", "merchant", `merchant bought bread at 1.00 USDC each via ${breadSettlement.mode}${settlementDetails(breadSettlement)}`, breadSettlement.mode, { item: "bread", amount: 2, unitPrice: 1, txHash: breadSettlement.txHash ?? "", explorer: breadSettlement.explorerUrl ?? "" }));
  await persist();
  return { tick: tickNumber, agents: getAgents(), events: getEvents().slice(-16), persistence: persistenceMode() };
}

export async function makeBakerHungry() { await hydrate(); const baker = agents.get("baker")!; baker.needs.hunger = 99; baker.needs.supplies = 0; emit(event(tickNumber, "need", "baker", "baker is hungry and out of flour", "LOCAL RULE", { hunger: 99, supplies: 0 })); await persist(); return { tick: tickNumber, agents: getAgents(), events: getEvents().slice(-16), persistence: persistenceMode() }; }
export async function resetEconomy() { tickNumber = 0; events = []; hydrated = Promise.resolve(); agents.get("baker")!.needs = { hunger: 22, supplies: 78 }; agents.get("baker")!.inventory = { flour: 0, bread: 1 }; return { tick: tickNumber, agents: getAgents(), events, persistence: persistenceMode() }; }
