import { getEvents } from "@/lib/economy/store";
import { actualAppMode } from "@/lib/near/runtime";

export const dynamic = "force-dynamic";
export async function GET() {
  return Response.json({ events: getEvents().slice(-20), mode: await actualAppMode() }, { headers: { "cache-control": "no-store" } });
}
