"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import * as PIXI from "pixi.js";

type Phase = "day" | "night";
type RendererName = "PIXIJ / WEBGL" | "CANVAS 2D FALLBACK" | "STARTING";
type SceneBuilding = { label: string; x: number; y: number; color: number; icon: string };

const buildings: SceneBuilding[] = [
  { label: "01 / BAKERY", x: 0.18, y: 0.58, color: 0xb86443, icon: "▦" },
  { label: "02 / FARM", x: 0.39, y: 0.46, color: 0x80977a, icon: "✣" },
  { label: "03 / MILL", x: 0.64, y: 0.52, color: 0x806f58, icon: "◈" },
  { label: "04 / MARKET SQUARE", x: 0.79, y: 0.67, color: 0x2a5bb5, icon: "⌘" },
];

const canvasMounts = new WeakMap<HTMLCanvasElement, CanvasMount>();

type CanvasMount = {
  app: PIXI.Application;
  owners: number;
  initialized: boolean;
  ticker?: (ticker: PIXI.Ticker) => void;
  fallback?: () => void;
};

function makeTexture(renderer: PIXI.Renderer, color: number, width: number, height: number) {
  const graphics = new PIXI.Graphics().rect(2, 2, width - 4, height - 4).fill({ color, alpha: 0.95 });
  for (let y = 5; y < height - 3; y += 5) {
    for (let x = 5; x < width - 3; x += 5) graphics.rect(x, y, 2, 2).fill({ color: 0xe9e2d0, alpha: 0.35 });
  }
  return renderer.generateTexture(graphics);
}

function sprite(texture: PIXI.Texture, x: number, y: number, scale: number) {
  const item = new PIXI.Sprite(texture);
  item.anchor.set(0.5, 1);
  item.position.set(x, y);
  item.scale.set(scale);
  return item;
}

function drawCanvasScene(canvas: HTMLCanvasElement, phase: Phase, reducedMotion: boolean) {
  const parent = canvas.parentElement;
  const width = parent?.clientWidth || 1200;
  const height = parent?.clientHeight || 720;
  const ratio = window.devicePixelRatio || 1;
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  const context = canvas.getContext("2d");
  if (!context) return () => undefined;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  const sky = phase === "night" ? "#5b6f9a" : "#e9e2d0";
  const ground = phase === "night" ? "#768779" : "#c8b99a";
  const ink = phase === "night" ? "#f4efe3" : "#2b2a26";
  const grid = phase === "night" ? "rgba(244,239,227,.14)" : "rgba(43,42,38,.14)";
  context.fillStyle = sky;
  context.fillRect(0, 0, width, height);
  context.fillStyle = ground;
  context.fillRect(0, height * 0.34, width, height * 0.66);
  context.strokeStyle = grid;
  context.lineWidth = 1;
  for (let y = height * 0.38; y < height; y += 12) { context.beginPath(); context.moveTo(0, y); context.lineTo(width, y); context.stroke(); }
  for (let x = 0; x < width; x += 18) { context.beginPath(); context.moveTo(x, height * 0.34); context.lineTo(x, height); context.stroke(); }
  const dot = (x: number, y: number, color: string, size = 2) => { context.fillStyle = color; context.fillRect(Math.round(x), Math.round(y), size, size); };
  [0.08, 0.28, 0.52, 0.89, 0.96].forEach((x, i) => {
    const tx = width * x;
    const ty = height * (0.56 + (i % 2) * 0.12);
    for (let row = 0; row < 8; row++) for (let col = -4 + row; col < 5 - row; col++) dot(tx + col * 5, ty - row * 5, phase === "night" ? "#9fba9a" : "#496d57");
    dot(tx - 3, ty + 4, ink, 4); dot(tx + 2, ty + 4, ink, 4);
  });
  buildings.forEach((building) => {
    const bx = width * building.x;
    const by = height * building.y;
    const color = `#${building.color.toString(16).padStart(6, "0")}`;
    context.fillStyle = color;
    context.beginPath(); context.moveTo(bx - 78, by + 5); context.lineTo(bx, by - 66); context.lineTo(bx + 78, by + 5); context.closePath(); context.fill();
    context.fillRect(bx - 68, by + 5, 136, 66);
    for (let row = 0; row < 12; row++) for (let col = -11; col < 12; col++) dot(bx + col * 5, by + 15 + row * 5, "rgba(233,226,208,.55)");
    context.fillStyle = ink; context.font = "11px monospace"; context.textAlign = "center"; context.fillText(building.label, bx, by + 88);
    context.fillStyle = "#e9e2d0"; context.font = "30px monospace"; context.fillText(building.icon, bx, by + 46);
  });
  [0.28, 0.47, 0.72, 0.84].forEach((x, i) => {
    const vx = width * x; const vy = height * (0.82 - (i % 2) * 0.1);
    for (let row = 0; row < 8; row++) for (let col = -2; col < 3; col++) dot(vx + col * 4, vy - row * 4, "#2a5bb5");
  });
  if (reducedMotion) return () => undefined;
  let frame = 0;
  const animate = () => {
    frame = requestAnimationFrame(animate);
    const drift = Math.sin(performance.now() / 9000) * 5;
    context.save(); context.globalAlpha = 0.1; context.translate(drift, 0); context.restore();
  };
  animate();
  return () => cancelAnimationFrame(frame);
}

function buildPixiScene(mount: CanvasMount, phase: Phase, reducedMotion: boolean) {
  const { app } = mount;
  const { width, height } = app.screen;
  const world = new PIXI.Container();
  const distant = new PIXI.Container();
  const foreground = new PIXI.Container();
  world.addChild(distant, foreground);
  app.stage.addChild(world);
  distant.addChild(new PIXI.Graphics().rect(0, height * 0.34, width, height * 0.66).fill({ color: phase === "night" ? 0x657565 : 0xc8b99a }));
  const grid = new PIXI.Graphics();
  for (let y = height * 0.38; y < height; y += 12) grid.moveTo(0, y).lineTo(width, y).stroke({ color: 0xb7a789, alpha: 0.3, width: 1 });
  for (let x = 0; x < width; x += 18) grid.moveTo(x, height * 0.34).lineTo(x, height).stroke({ color: 0xb7a789, alpha: 0.2, width: 1 });
  distant.addChild(grid);
  const buildingTexture = makeTexture(app.renderer, 0x806f58, 34, 34);
  const treeTexture = makeTexture(app.renderer, 0x496d57, 24, 46);
  const villagerTexture = makeTexture(app.renderer, 0x2a5bb5, 15, 29);
  buildings.forEach((building) => {
    const bx = width * building.x; const by = height * building.y;
    const body = sprite(buildingTexture, bx, by + 70, 2.2); body.tint = building.color; foreground.addChild(body);
    const roof = new PIXI.Graphics().poly([bx - 78, by + 5, bx, by - 66, bx + 78, by + 5]).fill({ color: building.color, alpha: 0.95 });
    for (let row = 0; row < 9; row++) roof.rect(bx - 30 + row * 3, by - 30 + row * 3, 3, 3).fill({ color: 0xe9e2d0, alpha: 0.4 });
    foreground.addChild(roof);
    const label = new PIXI.Text({ text: building.label, style: { fontFamily: "monospace", fontSize: 11, fill: phase === "night" ? 0xf4efe3 : 0x2b2a26, letterSpacing: 1 } }); label.anchor.set(0.5, 0); label.position.set(bx, by + 86); foreground.addChild(label);
    const sign = new PIXI.Text({ text: building.icon, style: { fontFamily: "monospace", fontSize: 30, fill: 0xe9e2d0 } }); sign.anchor.set(0.5); sign.position.set(bx, by + 26); foreground.addChild(sign);
  });
  [0.08, 0.28, 0.52, 0.89, 0.96].forEach((x, i) => distant.addChild(sprite(treeTexture, width * x, height * (0.56 + (i % 2) * 0.12), 1.4 + (i % 2) * 0.4)));
  [0.28, 0.47, 0.72, 0.84].forEach((x, i) => foreground.addChild(sprite(villagerTexture, width * x, height * (0.82 - (i % 2) * 0.1), 1)));
  mount.ticker = (ticker) => { if (reducedMotion) return; const t = ticker.lastTime / 1000; world.x = Math.sin(t * 0.11) * 7; distant.x = Math.sin(t * 0.06) * 3; foreground.y = Math.sin(t * 0.35) * 1.5; };
  app.ticker.add(mount.ticker);
}

export default function VillageScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<Phase>("day");
  const [renderer, setRenderer] = useState<RendererName>("STARTING");
  const reducedMotion = useReducedMotion() ?? false;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const localApp = new PIXI.Application();
    let disposed = false;
    let initialized = false;
    let mount = canvasMounts.get(canvas);
    if (mount) mount.owners += 1;
    else { mount = { app: localApp, owners: 1, initialized: false }; canvasMounts.set(canvas, mount); }
    const activeMount = mount;
    const setup = async () => {
      if (activeMount.app !== localApp) return;
      if (disposed && activeMount.owners === 0) return;
      try {
        await localApp.init({ canvas, resizeTo: canvas.parentElement ?? undefined, antialias: true, backgroundAlpha: 0, preference: "webgl" });
        initialized = true;
        activeMount.initialized = true;
        if (activeMount.owners === 0) { localApp.destroy(true, { children: true, texture: true }); canvasMounts.delete(canvas); return; }
        buildPixiScene(activeMount, phase, reducedMotion);
        setRenderer("PIXIJ / WEBGL");
      } catch {
        if (activeMount.owners === 0) return;
        activeMount.fallback = drawCanvasScene(canvas, phase, reducedMotion);
        setRenderer("CANVAS 2D FALLBACK");
      }
    };
    if (activeMount.app === localApp) void setup();
    return () => {
      disposed = true;
      activeMount.owners -= 1;
      if (activeMount.owners > 0) return;
      if (activeMount.fallback) activeMount.fallback();
      if (activeMount.ticker) activeMount.app.ticker.remove(activeMount.ticker);
      if (initialized || activeMount.initialized) activeMount.app.destroy(true, { children: true, texture: true });
      canvasMounts.delete(canvas);
    };
  }, [phase, reducedMotion]);

  return <section className={`scene-shell relative min-h-screen overflow-hidden ${phase === "night" ? "is-night" : ""}`}>
    <div className="grain absolute inset-0 z-10" />
    <header className="relative z-20 flex items-start justify-between p-5 sm:p-8"><div><p className="dot-text text-[10px] text-[var(--blue)]">[ 00 / MARKETDAY ]</p><h1 className="mt-2 text-3xl font-bold tracking-[-0.08em] sm:text-5xl">A village that settles itself.</h1><p className="mt-3 max-w-md text-xs leading-relaxed text-[var(--muted)]">Every villager is an agent. Every agent has a wallet. Watch the market breathe.</p></div><button onClick={() => setPhase((current) => current === "day" ? "night" : "day")} className="border border-[var(--ink)]/30 bg-[var(--paper)]/70 px-3 py-2 text-[10px] tracking-widest transition hover:bg-[var(--paper)]" aria-label="Toggle day and night cycle">{phase === "day" ? "☼ DAY" : "◐ NIGHT"}</button></header>
    <div className="relative z-0 mx-3 h-[min(68vh,720px)] overflow-hidden border border-[var(--ink)]/20 bg-[#c8b99a]/30 sm:mx-8"><canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-label="Animated dot matrix village scene" /><div className="pointer-events-none absolute bottom-4 left-4 text-[10px] text-[var(--ink)]/70">[ LIVE SIMULATION ]</div><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute right-4 top-4 flex flex-col items-end gap-1 text-[10px] text-[var(--blue)]"><span className="flex items-center gap-2"><span className="h-2 w-2 animate-pulse rounded-full bg-[var(--blue)]" /> 04 AGENTS ONLINE</span><span className="text-[var(--muted)]">RENDERER / {renderer}</span></motion.div></div>
    <footer className="relative z-20 flex flex-wrap items-center justify-between gap-4 p-5 text-[10px] sm:p-8"><div className="flex gap-5"><span className="dot-text">[ TESTNET ]</span><span className="text-[var(--muted)]">INTENTS / SIMULATED</span></div><div className="text-[var(--muted)]">WATCH MODE · NO WALLET POPUP</div></footer>
  </section>;
}
