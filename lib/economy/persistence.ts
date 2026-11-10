import type { AgentState, EconomyEvent } from "./types";

export type EconomySnapshot = { agents: AgentState[]; events: EconomyEvent[]; tick: number };
const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const tableUrl = supabaseUrl && process.env.SUPABASE_SERVICE_ROLE_KEY ? `${supabaseUrl}/rest/v1/marketday_state` : null;

export function persistenceMode() { return tableUrl ? "SUPABASE" : "IN MEMORY"; }
export async function loadSnapshot(): Promise<EconomySnapshot | null> {
  if (!tableUrl) return null;
  try { const response = await fetch(`${tableUrl}?id=eq.village`, { headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!, Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` }, cache: "no-store" }); const rows = await response.json() as Array<{ snapshot: EconomySnapshot }>; return rows[0]?.snapshot ?? null; } catch { return null; }
}
export async function saveSnapshot(snapshot: EconomySnapshot) {
  if (!tableUrl) return;
  await fetch(tableUrl, { method: "POST", headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!, Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`, "content-type": "application/json", Prefer: "resolution=merge-duplicates" }, body: JSON.stringify({ id: "village", snapshot, updated_at: new Date().toISOString() }) }).catch(() => undefined);
}
