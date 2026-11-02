"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

type MarketEvent = { id: string; type: string; actor: string; message: string; label: string; tick: number; data?: { reason?: string } };
type MarketEffectsProps = { recordMode?: boolean };

function playTone(context: AudioContext, frequency: number, duration: number) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.frequency.value = frequency; oscillator.type = "sine"; gain.gain.setValueAtTime(0.025, context.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
  oscillator.connect(gain); gain.connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + duration);
}

export default function MarketEffects({ recordMode = false }: MarketEffectsProps) {
  const reducedMotion = useReducedMotion() ?? false;
  const [events, setEvents] = useState<MarketEvent[]>([]);
  const [soundReady, setSoundReady] = useState(false);
  const [blocked, setBlocked] = useState<MarketEvent | null>(null);
  const [streamError, setStreamError] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const audioRef = useRef<AudioContext | null>(null);
  const lastEventRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const stream = new EventSource("/api/events");
    stream.onmessage = (message) => {
      setStreamError(false);
      const event = JSON.parse(message.data) as MarketEvent;
      setEvents((current) => [...current.slice(-7), event]);
      if (event.id === lastEventRef.current) return;
      lastEventRef.current = event.id;
      const context = audioRef.current;
      if (context?.state === "running") playTone(context, event.type === "settled" ? 740 : event.type === "blocked" ? 150 : 420, event.type === "blocked" ? 0.24 : 0.08);
      if (event.type === "blocked") { setBlocked(event); window.setTimeout(() => setBlocked(null), 1500); }
    };
    stream.onerror = () => setStreamError(true);
    const tick = window.setInterval(() => { void fetch("/api/tick", { method: "POST" }); }, 9000);
    const replay = (event: KeyboardEvent) => { if (event.key.toLowerCase() === "d") void fetch("/api/demo", { method: "POST" }); };
    window.addEventListener("keydown", replay);
    return () => { stream.close(); window.clearInterval(tick); window.removeEventListener("keydown", replay); };
  }, []);

  const enableSound = () => {
    const context = audioRef.current ?? new AudioContext();
    audioRef.current = context;
    if (context.state === "suspended") void context.resume();
    setSoundReady(true);
    playTone(context, 520, 0.08);
  };
  const latest = events.at(-1);
  const speech = events.filter((event) => ["bid", "offer", "counter"].includes(event.type)).slice(-3);
  const settled = events.filter((event) => event.type === "settled");
  const runDemo = () => { void fetch("/api/demo", { method: "POST" }); };
  const tour = ["Agents make the bid", "The leash checks the price", "A real adapter can settle the transfer"];

  return <>
    <div className="pointer-events-none absolute inset-0 z-20">
      {speech.map((event, index) => <motion.div key={event.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`absolute ${index === 0 ? "left-[23%] top-[44%]" : index === 1 ? "left-[48%] top-[34%]" : "left-[68%] top-[50%]"} bg-[var(--paper)]/90 px-2 py-1 text-[9px] text-[var(--ink)] shadow-sm`}>[{event.type.toUpperCase()} / {event.actor}]</motion.div>)}
      {settled.map((event) => <motion.div key={event.id} initial={{ opacity: 0, x: 0, y: 120 }} animate={{ opacity: [0, 1, 1, 0], x: 210, y: 15 }} transition={{ duration: reducedMotion ? 0.01 : 1.4 }} className="absolute left-[32%] top-[48%] text-lg text-[var(--blue)]">●</motion.div>)}
      {blocked && <motion.div initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0] }} transition={{ duration: reducedMotion ? 0.01 : 1.2 }} className="absolute inset-[20%] border-2 border-[var(--blue)] shadow-[0_0_25px_rgba(42,91,181,.7)]"><span className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[var(--blue)] px-2 py-1 text-[9px] text-white">[ BLOCKED ] {blocked.data?.reason ?? blocked.message}</span></motion.div>}
    </div>
    {!recordMode && <aside className="absolute bottom-12 left-3 z-30 hidden w-64 border border-[var(--ink)]/20 bg-[var(--paper)]/85 p-3 text-[9px] text-[var(--ink)] backdrop-blur-sm sm:block"><div className="mb-2 flex justify-between text-[var(--blue)]"><span>[ LIVE FEED ]</span><span>{streamError ? "ERROR" : "CONNECTED"}</span></div>{events.slice(-4).reverse().map((event) => <div key={event.id} className="border-t border-[var(--ink)]/10 py-1"><span className="text-[var(--blue)]">{event.type.toUpperCase()}</span> {event.actor}: {event.message}</div>)}</aside>}
    {!recordMode && <div className="absolute right-3 top-20 z-30 w-56 border border-[var(--ink)]/20 bg-[var(--paper)]/85 p-3 text-[9px] text-[var(--ink)] backdrop-blur-sm"><div className="text-[var(--blue)]">[ TOUR {tourStep + 1} / 3 ]</div><p className="mt-2 leading-relaxed">{tour[tourStep]}</p><button onClick={() => setTourStep((step) => (step + 1) % 3)} className="mt-2 border border-[var(--ink)]/20 px-2 py-1 hover:bg-white">NEXT</button></div>}
    <div className="absolute bottom-3 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 text-[9px] text-[var(--muted)]"><span>{streamError ? "[ STREAM ERROR ]" : latest ? `[ ${latest.tick.toString().padStart(2, "0")} / ${latest.type.toUpperCase()} ]` : "[ WAITING FOR MARKET ]"}</span>{!recordMode && <><button onClick={runDemo} className="border border-[var(--blue)] bg-[var(--paper)]/90 px-2 py-1 text-[var(--blue)] hover:bg-white">DEMO [ D ]</button><button onClick={enableSound} className="border border-[var(--ink)]/20 bg-[var(--paper)]/80 px-2 py-1 hover:bg-white">{soundReady ? "SOUND ON" : "ENABLE SOUND"}</button></>}</div>
  </>;
}
