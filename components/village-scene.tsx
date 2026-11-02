"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import * as PIXI from "pixi.js";

type Phase = "day" | "night";
const buildings = [
  { label: "01 / BAKERY", x: 0.18, y: 0.58, color: 0xb86443, icon: "▦" },
  { label: "02 / FARM", x: 0.39, y: 0.46, color: 0x80977a, icon: "✣" },
  { label: "03 / MILL", x: 0.64, y: 0.52, color: 0x806f58, icon: "◈" },
  { label: "04 / MARKET SQUARE", x: 0.79, y: 0.67, color: 0x2a5bb5, icon: "⌘" },
];

function makeTexture(renderer: PIXI.Renderer, color: number, width: number, height: number) {
  const graphics = new PIXI.Graphics().rect(2, 2, width - 4, height - 4).fill({ color, alpha: .95 });
  for (let y = 5; y < height - 3; y += 5) for (let x = 5; x < width - 3; x += 5) graphics.rect(x, y, 2, 2).fill({ color: 0xe9e2d0, alpha: .35 });
  return renderer.generateTexture(graphics);
}

function sprite(texture: PIXI.Texture, x: number, y: number, scale: number) {
  const item = new PIXI.Sprite(texture); item.anchor.set(.5, 1); item.position.set(x, y); item.scale.set(scale); return item;
}

export default function VillageScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<Phase>("day");
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!canvasRef.current) return;
    const app = new PIXI.Application(); let disposed = false;
    void app.init({ canvas: canvasRef.current, resizeTo: canvasRef.current.parentElement ?? undefined, antialias: true, backgroundAlpha: 0 });
    const setup = async () => {
      await app.renderer.resize(canvasRef.current!.clientWidth || 1200, canvasRef.current!.clientHeight || 720);
      if (disposed) return;
      const { width, height } = app.screen;
      const world = new PIXI.Container(), distant = new PIXI.Container(), foreground = new PIXI.Container(); world.addChild(distant, foreground); app.stage.addChild(world);
      distant.addChild(new PIXI.Graphics().rect(0, height * .34, width, height * .66).fill({ color: 0xc8b99a }));
      const grid = new PIXI.Graphics();
      for (let y = height * .38; y < height; y += 12) grid.moveTo(0, y).lineTo(width, y).stroke({ color: 0xb7a789, alpha: .3, width: 1 });
      for (let x = 0; x < width; x += 18) grid.moveTo(x, height * .34).lineTo(x, height).stroke({ color: 0xb7a789, alpha: .2, width: 1 }); distant.addChild(grid);
      const buildingTexture = makeTexture(app.renderer, 0x806f58, 34, 34);
      for (const building of buildings) {
        const bx = width * building.x, by = height * building.y; const body = sprite(buildingTexture, bx, by + 70, 2.2); body.tint = building.color; foreground.addChild(body);
        const roof = new PIXI.Graphics().poly([bx - 78, by + 5, bx, by - 66, bx + 78, by + 5]).fill({ color: building.color, alpha: .95 });
        for (let row = 0; row < 9; row++) roof.rect(bx - 30 + row * 3, by - 30 + row * 3, 3, 3).fill({ color: 0xe9e2d0, alpha: .4 }); foreground.addChild(roof);
        const label = new PIXI.Text({ text: building.label, style: { fontFamily: "monospace", fontSize: 11, fill: 0x2b2a26, letterSpacing: 1 } }); label.anchor.set(.5, 0); label.position.set(bx, by + 86); foreground.addChild(label);
        const sign = new PIXI.Text({ text: building.icon, style: { fontFamily: "monospace", fontSize: 30, fill: 0xe9e2d0 } }); sign.anchor.set(.5); sign.position.set(bx, by + 26); foreground.addChild(sign);
      }
      const treeTexture = makeTexture(app.renderer, 0x496d57, 24, 46);
      [0.08, .28, .52, .89, .96].forEach((x, i) => distant.addChild(sprite(treeTexture, width * x, height * (.56 + (i % 2) * .12), 1.4 + (i % 2) * .4)));
      const villagerTexture = makeTexture(app.renderer, 0x2a5bb5, 15, 29);
      [.28, .47, .72, .84].forEach((x, i) => foreground.addChild(sprite(villagerTexture, width * x, height * (.82 - (i % 2) * .1), 1)));
      app.ticker.add((ticker) => { if (reducedMotion) return; const t = ticker.lastTime / 1000; world.x = Math.sin(t * .11) * 7; distant.x = Math.sin(t * .06) * 3; foreground.y = Math.sin(t * .35) * 1.5; });
    };
    void setup(); return () => { disposed = true; app.destroy(true, { children: true, texture: true }); };
  }, [reducedMotion]);

  return <section className={`scene-shell relative min-h-screen overflow-hidden ${phase === "night" ? "is-night" : ""}`}>
    <div className="grain absolute inset-0 z-10" />
    <header className="relative z-20 flex items-start justify-between p-5 sm:p-8"><div><p className="dot-text text-[10px] text-[var(--blue)]">[ 00 / MARKETDAY ]</p><h1 className="mt-2 text-3xl font-bold tracking-[-0.08em] sm:text-5xl">A village that settles itself.</h1><p className="mt-3 max-w-md text-xs leading-relaxed text-[var(--muted)]">Every villager is an agent. Every agent has a wallet. Watch the market breathe.</p></div><button onClick={() => setPhase((current) => current === "day" ? "night" : "day")} className="border border-[var(--ink)]/30 bg-[var(--paper)]/70 px-3 py-2 text-[10px] tracking-widest transition hover:bg-[var(--paper)]" aria-label="Toggle day and night cycle">{phase === "day" ? "☼ DAY" : "◐ NIGHT"}</button></header>
    <div className="relative z-0 mx-3 h-[min(68vh,720px)] overflow-hidden border border-[var(--ink)]/20 bg-[#c8b99a]/30 sm:mx-8"><canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-label="Animated dot matrix village scene" /><div className="pointer-events-none absolute bottom-4 left-4 text-[10px] text-[var(--ink)]/70">[ LIVE SIMULATION ]</div><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute right-4 top-4 flex items-center gap-2 text-[10px] text-[var(--blue)]"><span className="h-2 w-2 animate-pulse rounded-full bg-[var(--blue)]" /> 04 AGENTS ONLINE</motion.div></div>
    <footer className="relative z-20 flex flex-wrap items-center justify-between gap-4 p-5 text-[10px] sm:p-8"><div className="flex gap-5"><span className="dot-text">[ TESTNET ]</span><span className="text-[var(--muted)]">INTENTS / SIMULATED</span></div><div className="text-[var(--muted)]">WATCH MODE · NO WALLET POPUP</div></footer>
  </section>;
}
