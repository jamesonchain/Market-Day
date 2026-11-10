import { getEvents } from "@/lib/economy/store";
import { appMode } from "@/lib/near/runtime";

export const dynamic = "force-dynamic";
export async function GET() {
  return Response.json({ events: getEvents().slice(-20), mode: appMode() }, { headers: { "cache-control": "no-store" } });
}
