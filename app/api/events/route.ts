import { getEvents, subscribe } from "@/lib/economy/store";
export const dynamic = "force-dynamic";
export async function GET() {
  const encoder = new TextEncoder();
  let close: () => void = () => undefined;
  const stream = new ReadableStream({ start(controller) { const send = (event: unknown) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`)); getEvents().forEach(send); close = subscribe(send); }, cancel() { close(); } });
  return new Response(stream, { headers: { "content-type": "text/event-stream", "cache-control": "no-cache", connection: "keep-alive" } });
}
