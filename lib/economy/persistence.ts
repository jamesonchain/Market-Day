import type { AgentState, EconomyEvent } from "./types";

export type EconomySnapshot = { agents: AgentState[]; events: EconomyEvent[]; tick: number };
const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const tableUrl = supabaseUrl && process.env.SUPABASE_SERVICE_ROLE_KEY ? `${supabaseUrl}/rest/v1/marketday_state` : null;
const apiHeaders = () => ({ apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!, Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`, "content-type": "application/json" });
const localRuns = new Map<string, unknown>();
let localLock = false;

export function persistenceMode() { return tableUrl ? "SUPABASE" : "IN MEMORY"; }
export async function loadSnapshot(): Promise<EconomySnapshot | null> {
  if (!tableUrl) return null;
  try { const response = await fetch(`${tableUrl}?id=eq.village`, { headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!, Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` }, cache: "no-store" }); const rows = await response.json() as Array<{ snapshot: EconomySnapshot }>; return rows[0]?.snapshot ?? null; } catch { return null; }
}
export async function saveSnapshot(snapshot: EconomySnapshot) {
  if (!tableUrl) return;
  await fetch(tableUrl, { method: "POST", headers: { ...apiHeaders(), Prefer: "resolution=merge-duplicates" }, body: JSON.stringify({ id: "village", snapshot, updated_at: new Date().toISOString() }) }).catch(() => undefined);
  const base = supabaseUrl!; const headers = { ...apiHeaders(), Prefer: "resolution=merge-duplicates" };
  await Promise.all([
    fetch(`${base}/rest/v1/marketday_villagers`, { method: "POST", headers, body: JSON.stringify(snapshot.agents.map((state) => ({ role: state.role, state, updated_at: new Date().toISOString() }))) }),
    fetch(`${base}/rest/v1/marketday_events`, { method: "POST", headers, body: JSON.stringify(snapshot.events.map((event) => ({ id: event.id, tick: event.tick, event }))) }),
  ]).catch(() => undefined);
}

export async function beginTick(id: string) {
  if (!tableUrl) { if (localRuns.has(id)) return { accepted: false, result: localRuns.get(id) }; localRuns.set(id, null); return { accepted: true }; }
  const response = await fetch(`${supabaseUrl}/rest/v1/marketday_tick_runs`, { method: "POST", headers: { ...apiHeaders(), Prefer: "return=minimal" }, body: JSON.stringify({ id, status: "running" }) });
  if (response.ok) return { accepted: true };
  const existing = await fetch(`${supabaseUrl}/rest/v1/marketday_tick_runs?id=eq.${encodeURIComponent(id)}&select=result,status`, { headers: apiHeaders(), cache: "no-store" }).then((res) => res.json()).catch(() => [] as Array<{ result?: unknown }>);
  return { accepted: false, result: existing[0]?.result };
}
export async function finishTick(id: string, result: unknown) {
  if (!tableUrl) { localRuns.set(id, result); return; }
  await fetch(`${supabaseUrl}/rest/v1/marketday_tick_runs?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", headers: apiHeaders(), body: JSON.stringify({ status: "done", result }) }).catch(() => undefined);
}
export async function acquireTickLock() {
  if (!tableUrl) { if (localLock) return false; localLock = true; return true; }
  const response = await fetch(`${supabaseUrl}/rest/v1/marketday_tick_lock`, { method: "POST", headers: { ...apiHeaders(), Prefer: "return=minimal" }, body: JSON.stringify({ id: "active" }) });
  return response.ok;
}
export async function releaseTickLock() { if (!tableUrl) { localLock = false; return; } await fetch(`${supabaseUrl}/rest/v1/marketday_tick_lock?id=eq.active`, { method: "DELETE", headers: apiHeaders() }).catch(() => undefined); }
