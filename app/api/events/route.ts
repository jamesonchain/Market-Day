import { getEvents } from "@/lib/economy/store";
import { actualAppMode } from "@/lib/near/runtime";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const since = new URL(request.url).searchParams.get("since") ?? "";
  const all = getEvents(); const index = since ? all.findIndex((event) => event.id === since) : -1;
  return Response.json({ events: (index >= 0 ? all.slice(index + 1) : all).slice(-20), mode: await actualAppMode() }, { headers: { "cache-control": "no-store" } });
}
