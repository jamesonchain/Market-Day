import { decide, proposalEvent } from "./agents";
import type { AgentRole, AgentState, EconomyEvent } from "./types";
import { getSettlementAdapter } from "../near/settlement";

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

function emit(event: EconomyEvent) { events = [...events.slice(-99), event]; listeners.forEach((listener) => listener(event)); return event; }
function event(tick: number, type: EconomyEvent["type"], actor: AgentRole, message: string, label: EconomyEvent["label"], data?: EconomyEvent["data"]): EconomyEvent { return { id: crypto.randomUUID(), tick, at: new Date().toISOString(), type, actor, message, label, data }; }

export function getAgents() { return roles.map((role) => agents.get(role)!); }
export function getEvents() { return events; }
export function subscribe(listener: (event: EconomyEvent) => void) { listeners.add(listener); return () => listeners.delete(listener); }

export async function runTick() {
  tickNumber += 1;
  const baker = agents.get("baker")!;
  baker.needs.hunger = Math.min(100, baker.needs.hunger + 3);
  baker.needs.supplies = Math.max(0, baker.needs.supplies - 8);
  emit(event(tickNumber, "need", "baker", `baker flour supply is ${baker.needs.supplies}%`, "LOCAL RULE", { item: "flour", supply: baker.needs.supplies }));
  const context = `Tick ${tickNumber}. Baker flour ${baker.inventory.flour ?? 0}. Baker balance ${baker.balance}.`;
  const bakerDecision = await decide("baker", context);
  emit(proposalEvent(tickNumber, "baker", bakerDecision.proposal, bakerDecision.source));
  if (tickNumber % 2 === 1) {
    for (const role of ["farmer", "farmerTwo"] as const) {
      const decision = await decide(role, `${context} A baker wants flour.`);
      emit(proposalEvent(tickNumber, role, decision.proposal, decision.source));
    }
    emit(event(tickNumber, "policy check", "baker", "candidate offers are ready for settlement policy", "LOCAL RULE"));
    const adapter = getSettlementAdapter();
    const settlement = await adapter.transferToken("farmer", "baker", "3000000");
    baker.inventory.flour = (baker.inventory.flour ?? 0) + 2;
    agents.get("farmer")!.inventory.wheat = Math.max(0, (agents.get("farmer")!.inventory.wheat ?? 0) - 2);
    emit(event(tickNumber, "settled", "baker", `fair flour offer settled via ${settlement.mode}`, settlement.mode, { amount: 3, token: "USDC" }));
  } else {
    const miller = agents.get("miller")!;
    miller.inventory.flour = (miller.inventory.flour ?? 0) + 1;
    emit(event(tickNumber, "produced", "miller", "miller produced flour", "LOCAL RULE", { item: "flour", amount: 1 }));
  }
  return { tick: tickNumber, agents: getAgents(), events: getEvents().slice(-12) };
}
