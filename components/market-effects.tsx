"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

type MarketEvent = { id: string; type: string; actor: string; message: string; label: string; tick: number; data?: { reason?: string } };

function playTone(context: AudioContext, frequency: number, duration: number) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.frequency.value = frequency; oscillator.type = "sine"; gain.gain.setValueAtTime(0.025, context.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
  oscillator.connect(gain); gain.connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + duration);
}

export default function MarketEffects() {
  const reducedMotion = useReducedMotion() ?? false;
  const [events, setEvents] = useState<MarketEvent[]>([]);
  const [soundReady, setSoundReady] = useState(false);
  const [blocked, setBlocked] = useState<MarketEvent | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const lastEventRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const stream = new EventSource("/api/events");
    stream.onmessage = (message) => {
      const event = JSON.parse(message.data) as MarketEvent;
      setEvents((current) => [...current.slice(-7), event]);
      if (event.id === lastEventRef.current) return;
      lastEventRef.current = event.id;
      const context = audioRef.current;
      if (context?.state === "running") playTone(context, event.type === "settled" ? 740 : event.type === "blocked" ? 150 : 420, event.type === "blocked" ? 0.24 : 0.08);
      if (event.type === "blocked") { setBlocked(event); window.setTimeout(() => setBlocked(null), 1500); }
    };
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

  return <>
    <div className="pointer-events-none absolute inset-0 z-20">
      {speech.map((event, index) => <motion.div key={event.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`absolute ${index === 0 ? "left-[23%] top-[44%]" : index === 1 ? "left-[48%] top-[34%]" : "left-[68%] top-[50%]"} bg-[var(--paper)]/90 px-2 py-1 text-[9px] text-[var(--ink)] shadow-sm`}>[{event.type.toUpperCase()} / {event.actor}]</motion.div>)}
      {settled.map((event) => <motion.div key={event.id} initial={{ opacity: 0, x: 0, y: 120 }} animate={{ opacity: [0, 1, 1, 0], x: 210, y: 15 }} transition={{ duration: reducedMotion ? 0.01 : 1.4 }} className="absolute left-[32%] top-[48%] text-lg text-[var(--blue)]">●</motion.div>)}
      {blocked && <motion.div initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0] }} transition={{ duration: reducedMotion ? 0.01 : 1.2 }} className="absolute inset-[20%] border-2 border-[var(--blue)] shadow-[0_0_25px_rgba(42,91,181,.7)]"><span className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[var(--blue)] px-2 py-1 text-[9px] text-white">[ BLOCKED ] {blocked.data?.reason ?? blocked.message}</span></motion.div>}
    </div>
    <div className="absolute bottom-3 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 text-[9px] text-[var(--muted)]"><button onClick={runDemo} className="border border-[var(--blue)] bg-[var(--paper)]/90 px-2 py-1 text-[var(--blue)] hover:bg-white">DEMO [ D ]</button><span>{latest ? `[ ${latest.tick.toString().padStart(2, "0")} / ${latest.type.toUpperCase()} ]` : "[ WAITING FOR MARKET ]"}</span><button onClick={enableSound} className="border border-[var(--ink)]/20 bg-[var(--paper)]/80 px-2 py-1 hover:bg-white">{soundReady ? "SOUND ON" : "ENABLE SOUND"}</button></div>
  </>;
}
