"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Html, PerspectiveCamera, RoundedBox, Sparkles, Text } from "@react-three/drei";
import { Bloom, DepthOfField, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import Link from "next/link";

type MarketEvent = { id: string; type: string; actor: string; message: string; label: string; tick: number; data?: { reason?: string } };
type FloatingIslandProps = { recordMode?: boolean };
type RendererState = "R3F / WEBGL" | "STATIC FALLBACK" | "LOADING";
type Point = [number, number, number];

const village = [
  { id: "bakery", name: "Bakery", position: [-2.6, 1.18, 0.1] as Point, color: "#E8654F", roof: "#D95546" },
  { id: "farm", name: "Farm", position: [0.1, 1.12, -1.1] as Point, color: "#7FA86B", roof: "#6C8F5C" },
  { id: "mill", name: "Mill", position: [2.45, 1.12, 0.4] as Point, color: "#C27F62", roof: "#A76655" },
  { id: "market", name: "Market Square", position: [0.4, 1.06, 1.45] as Point, color: "#D99365", roof: "#C2765E" },
];
const villagers = [
  { role: "baker", color: "#E8654F", position: [-1.7, 1.35, 1.05] as Point },
  { role: "farmer", color: "#7FA86B", position: [-0.6, 1.3, -0.3] as Point },
  { role: "farmerTwo", color: "#E8A154", position: [1.25, 1.3, 0.6] as Point },
  { role: "miller", color: "#839BB8", position: [2, 1.3, -0.4] as Point },
  { role: "merchant", color: "#B77DBD", position: [0.8, 1.3, 1.55] as Point },
];

function useMarketStream() {
  const [events, setEvents] = useState<MarketEvent[]>([]);
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    const stream = new EventSource("/api/events");
    stream.onopen = () => setConnected(true);
    stream.onmessage = message => { setConnected(true); const event = JSON.parse(message.data) as MarketEvent; setEvents(current => [...current.slice(-19), event]); };
    stream.onerror = () => setConnected(false);
    const tick = window.setInterval(() => { void fetch("/api/tick", { method: "POST" }); }, 10000);
    return () => { stream.close(); window.clearInterval(tick); };
  }, []);
  return { events, connected };
}

function playTone(context: AudioContext, frequency: number, duration: number, volume = 0.035) {
  const oscillator = context.createOscillator(); const gain = context.createGain(); oscillator.type = "sine"; oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(volume, context.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
  oscillator.connect(gain); gain.connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + duration);
}

function StaticFallback({ message = "WebGL unavailable. The village is still here." }: { message?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return; const context = canvas.getContext("2d"); if (!context) return;
    const ratio = Math.min(2, window.devicePixelRatio || 1); canvas.width = canvas.clientWidth * ratio; canvas.height = canvas.clientHeight * ratio; context.scale(ratio, ratio);
    const gradient = context.createLinearGradient(0, 0, 0, canvas.clientHeight); gradient.addColorStop(0, "#141631"); gradient.addColorStop(.45, "#4B3A7A"); gradient.addColorStop(.78, "#E8718D"); gradient.addColorStop(1, "#FFB38A");
    context.fillStyle = gradient; context.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight); const cx = canvas.clientWidth * .62; const cy = canvas.clientHeight * .65;
    context.fillStyle = "#7B554B"; context.beginPath(); context.ellipse(cx, cy + 44, canvas.clientWidth * .3, canvas.clientHeight * .12, 0, 0, Math.PI * 2); context.fill();
    context.fillStyle = "#7FA86B"; context.beginPath(); context.ellipse(cx, cy, canvas.clientWidth * .32, canvas.clientHeight * .1, 0, 0, Math.PI * 2); context.fill();
    context.fillStyle = "#FFF6EA"; context.font = "16px Geist, sans-serif"; context.textAlign = "center"; context.fillText(message, canvas.clientWidth * .5, canvas.clientHeight * .9);
  }, [message]);
  return <div className="scene-placeholder"><canvas ref={canvasRef} /><span>{message}</span></div>;
}

function ScenePlaceholder() { return <div className="scene-placeholder"><div className="scene-placeholder-orbit" /><span>DESCENDING THROUGH CLOUDS</span></div>; }

function Clouds() {
  const positions = useMemo(() => Array.from({ length: 22 }, (_, index) => ({ position: [((index * 1.9) % 16) - 8, -2.2 - (index % 3) * .5, ((index * 2.7) % 12) - 6] as Point, scale: .35 + (index % 4) * .12 })), []);
  return <group>{positions.map((cloud, index) => <mesh key={index} position={cloud.position} scale={cloud.scale} receiveShadow><sphereGeometry args={[1, 12, 8]} /><meshStandardMaterial color="#FFF6EA" roughness={1} transparent opacity={.58} /></mesh>)}</group>;
}

function Island() {
  return <group position={[0, -.15, 0]}>
    <mesh receiveShadow castShadow><cylinderGeometry args={[4.45, 3.05, 1.35, 12]} /><meshStandardMaterial color="#765047" roughness={.94} /></mesh>
    <mesh position={[0, .7, 0]} receiveShadow castShadow><cylinderGeometry args={[4.5, 4.5, .24, 12]} /><meshStandardMaterial color="#7FA86B" roughness={.9} /></mesh>
    <mesh position={[0, .83, 0]} receiveShadow><cylinderGeometry args={[4.26, 4.26, .1, 12]} /><meshStandardMaterial color="#A7BB7D" roughness={.96} /></mesh>
    {[-2.7, -1.2, 1.8, 2.9].map((x, index) => <mesh key={index} position={[x, -1.2, .8 - index * .3]} rotation={[0, index, 0]} castShadow><coneGeometry args={[.08 + index * .025, 1.2 + index * .25, 5]} /><meshStandardMaterial color="#4D6E5F" roughness={1} /></mesh>)}
    {[-2.8, 2.4].map((x, index) => <mesh key={index} position={[x, .1, 0]} rotation={[0, 0, index ? -.2 : .2]}><cylinderGeometry args={[.05, .12, 1.6, 8]} /><meshStandardMaterial color="#8FD3D1" emissive="#8FD3D1" emissiveIntensity={.18} transparent opacity={.7} roughness={.2} /></mesh>)}
  </group>;
}

function Window({ position }: { position: Point }) {
  const material = useRef<THREE.MeshStandardMaterial>(null);
  const elapsed = useRef(0);
  useFrame((_, delta) => { elapsed.current += delta; if (material.current) material.current.emissiveIntensity = .25 + (Math.sin(elapsed.current * .08) + 1) * .2; });
  return <mesh position={position}><boxGeometry args={[.22, .28, .035]} /><meshStandardMaterial ref={material} color="#FFC857" emissive="#FFC857" emissiveIntensity={.35} roughness={.25} /></mesh>;
}

function Fence({ position, rotation = 0 }: { position: Point; rotation?: number }) {
  return <group position={position} rotation={[0, rotation, 0]}>{[-.35, 0, .35].map(x => <mesh key={x} position={[x, .2, 0]} castShadow><boxGeometry args={[.07, .4, .07]} /><meshStandardMaterial color="#855C4D" roughness={.95} /></mesh>)}<mesh position={[0, .28, 0]}><boxGeometry args={[.85, .08, .06]} /><meshStandardMaterial color="#A76655" roughness={.95} /></mesh></group>;
}

function CropRows() {
  return <group position={[0, .1, 0]}>{[-.42, -.14, .14, .42].map(x => <mesh key={x} position={[x, 0, 0]} rotation={[0, 0, -.1]}><boxGeometry args={[.12, .08, .7]} /><meshStandardMaterial color="#567C4C" roughness={1} /></mesh>)}</group>;
}

function MarketStalls() {
  return <group position={[0, .45, .7]}>{[-.58, .58].map((x, index) => <group key={x} position={[x, 0, 0]}><mesh position={[0, -.2, 0]} castShadow><boxGeometry args={[.72, .35, .42]} /><meshStandardMaterial color="#C27F62" roughness={.9} /></mesh><mesh position={[0, .14, 0]} rotation={[0, 0, index ? -.08 : .08]} castShadow><boxGeometry args={[.82, .06, .48]} /><meshStandardMaterial color={index ? "#F6B93B" : "#E8654F"} roughness={.85} /></mesh></group>)}</group>;
}

function StringLights() {
  return <group>{[-.7, -.2, .3, .8].map(x => <mesh key={x} position={[x, .78, .9]}><sphereGeometry args={[.055, 10, 8]} /><meshStandardMaterial color="#FFC857" emissive="#FFC857" emissiveIntensity={1.2} roughness={.2} /></mesh>)}<mesh position={[0, 1.02, .9]} rotation={[0, 0, .03]}><cylinderGeometry args={[.012, .012, 1.7, 5]} /><meshBasicMaterial color="#4D3E4F" /></mesh></group>;
}

function Building({ item }: { item: (typeof village)[number] }) {
  const wheelRef = useRef<THREE.Group>(null); const elapsed = useRef(0);
  useFrame((_, delta) => { elapsed.current += delta; if (item.id === "mill" && wheelRef.current) wheelRef.current.rotation.z -= delta * .55; });
  return <group position={item.position}>
    <RoundedBox args={[1.5, 1.1, 1.2]} radius={.2} smoothness={5} castShadow receiveShadow><meshStandardMaterial color={item.color} roughness={.9} /></RoundedBox>
    <RoundedBox args={[1.72, .22, 1.42]} radius={.08} smoothness={3} position={[0, .66, 0]} castShadow><meshStandardMaterial color={item.roof} roughness={.94} /></RoundedBox>
    <Window position={[-.38, .12, .62]} /><Window position={[.38, .12, .62]} />
    <mesh position={[0, -.2, .63]} castShadow><RoundedBox args={[.26, .5, .08]} radius={.05} smoothness={3}><meshStandardMaterial color="#855C4D" roughness={.95} /></RoundedBox></mesh>
    <Text position={[0, -.75, .68]} fontSize={.13} color="#14172B" anchorX="center" anchorY="middle">{item.name}</Text>
    {item.id === "bakery" && <group position={[.42, 1.15, 0]}><mesh castShadow><cylinderGeometry args={[.12, .16, .72, 8]} /><meshStandardMaterial color="#A76655" roughness={.95} /></mesh><Sparkles count={5} scale={[.4, .65, .4]} position={[0, .48, 0]} size={.45} speed={.15} color="#FFF6EA" /></group>}
    {item.id === "farm" && <><CropRows /><group position={[.82, .58, 0]}><mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[.08, .08, 1.15, 8]} /><meshStandardMaterial color="#855C4D" roughness={.95} /></mesh>{[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map(rotation => <mesh key={rotation} rotation={[0, 0, rotation]} position={[.42, .55, 0]}><boxGeometry args={[.08, .65, .05]} /><meshStandardMaterial color="#FFF6EA" roughness={.9} /></mesh>)}</group></>}
    {item.id === "mill" && <group ref={wheelRef} position={[0, .05, .68]}><mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[.38, .06, 8, 20]} /><meshStandardMaterial color="#855C4D" roughness={.95} /></mesh>{[0, Math.PI / 2, Math.PI / 4, -Math.PI / 4].map(rotation => <mesh key={rotation} rotation={[Math.PI / 2, 0, rotation]}><boxGeometry args={[.72, .06, .06]} /><meshStandardMaterial color="#A76655" roughness={.95} /></mesh>)}</group>}
    {item.id === "market" && <><MarketStalls /><StringLights /></>}
  </group>;
}

function Tree({ position, scale = 1 }: { position: Point; scale?: number }) {
  return <group position={position} scale={scale}><mesh position={[0, .42, 0]} castShadow><cylinderGeometry args={[.08, .12, .8, 8]} /><meshStandardMaterial color="#855C4D" roughness={1} /></mesh><mesh position={[0, .9, 0]} castShadow><icosahedronGeometry args={[.5, 1]} /><meshStandardMaterial color="#6C975F" roughness={.94} /></mesh></group>;
}

function Villager({ role, color, position, focused, bubbleOffset }: { role: string; color: string; position: Point; focused: boolean; bubbleOffset: number }) {
  const group = useRef<THREE.Group>(null); const [hovered, setHovered] = useState(false); const elapsed = useRef(0);
  useFrame((_, delta) => { elapsed.current += delta; if (group.current) group.current.position.y = position[1] + Math.sin(elapsed.current * 2.3 + position[0]) * .035; });
  return <group ref={group} position={position} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)} scale={focused ? 1.12 : 1}><mesh position={[0, .24, 0]} castShadow><sphereGeometry args={[.25, 16, 12]} /><meshStandardMaterial color={color} roughness={.88} /></mesh><mesh position={[0, .62, 0]} castShadow><sphereGeometry args={[.2, 16, 12]} /><meshStandardMaterial color="#FFF6EA" roughness={.9} /></mesh><mesh position={[-.07, .66, .18]}><sphereGeometry args={[.025, 8, 8]} /><meshBasicMaterial color="#14172B" /></mesh><mesh position={[.07, .66, .18]}><sphereGeometry args={[.025, 8, 8]} /><meshBasicMaterial color="#14172B" /></mesh>{(hovered || focused) && <Html position={[0, 1.2 + bubbleOffset * .28, 0]} distanceFactor={8}><div className="villager-bubble">{role}</div></Html>}</group>;
}

function CoinArc({ index }: { index: number }) {
  const coin = useRef<THREE.Group>(null); const elapsed = useRef(0); const start = useMemo(() => new THREE.Vector3(-1.7, 1.65, 1), []); const end = useMemo(() => new THREE.Vector3(.9, 1.65, 1.25), []);
  useFrame((_, delta) => { elapsed.current += delta; if (!coin.current) return; const t = (elapsed.current * .65 + index * .23) % 1; coin.current.position.lerpVectors(start, end, t); coin.current.position.y += Math.sin(t * Math.PI) * 1.15; coin.current.rotation.y += .12; });
  return <group ref={coin}><mesh castShadow><cylinderGeometry args={[.13, .13, .045, 20]} /><meshStandardMaterial color="#F6B93B" emissive="#F6B93B" emissiveIntensity={.35} metalness={.7} roughness={.22} /></mesh><pointLight color="#F6B93B" intensity={.5} distance={1.2} /></group>;
}

function Leash({ event }: { event: MarketEvent }) {
  const ring = useRef<THREE.Mesh>(null); const material = useRef<THREE.MeshStandardMaterial>(null); const elapsed = useRef(0);
  useFrame((_, delta) => { elapsed.current += delta; const t = Math.min(1, elapsed.current / .7); const ease = t * t * (3 - 2 * t); if (ring.current) { ring.current.position.y = 2.5 * (1 - ease); ring.current.scale.setScalar(1.65 - ease * .65); } if (material.current) material.current.opacity = elapsed.current < 1.7 ? .9 : Math.max(0, 1 - (elapsed.current - 1.7) / .6); });
  return <group position={[-1.7, 1.35, 1.05]}><mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]}><torusGeometry args={[.56, .028, 8, 64]} /><meshStandardMaterial ref={material} color="#FF3D2E" emissive="#FF3D2E" emissiveIntensity={2.2} transparent opacity={.9} toneMapped={false} /></mesh><Html position={[0, 1.45, 0]} distanceFactor={8}><div className="leash-tag">{event.data?.reason ?? "Price above fair. Blocked."}</div></Html></group>;
}

function DioramaScene({ events, reducedMotion, recordMode, mobile }: { events: MarketEvent[]; reducedMotion: boolean; recordMode: boolean; mobile: boolean }) {
  const camera = useRef<THREE.PerspectiveCamera>(null); const island = useRef<THREE.Group>(null); const elapsed = useRef(0); const initialised = useRef(false); const seenEvent = useRef<string | undefined>(undefined);
  const [blocked, setBlocked] = useState<MarketEvent | null>(null); const focused = events.at(-1)?.actor ?? null; const settled = events.filter(event => event.type === "settled").slice(-3);
  useEffect(() => { const latest = events.at(-1); if (!initialised.current) { initialised.current = true; if (latest) seenEvent.current = latest.id; return; } if (!latest || latest.id === seenEvent.current) return; seenEvent.current = latest.id; if (latest.type === "blocked") { queueMicrotask(() => setBlocked(latest)); const timeout = window.setTimeout(() => setBlocked(null), 3000); return () => window.clearTimeout(timeout); } return undefined; }, [events]);
  useFrame((_, delta) => { elapsed.current += delta; if (!camera.current || !island.current) return; const descent = reducedMotion ? 1 : Math.min(1, elapsed.current / (recordMode ? 6 : 3.5)); const ease = descent * descent * (3 - 2 * descent); camera.current.position.y = THREE.MathUtils.lerp(8.2, 4.7, ease); camera.current.position.z = THREE.MathUtils.lerp(21, 18, ease); camera.current.position.x = mobile ? 0 : THREE.MathUtils.lerp(-1.5, 0, ease); camera.current.lookAt(mobile ? 0 : 1.15, .25, 0); island.current.position.x = mobile ? 0 : 1.2; island.current.scale.setScalar(mobile ? .92 : 1); island.current.rotation.y = reducedMotion ? 0 : Math.sin(elapsed.current * .04) * .025; });
  return <><PerspectiveCamera ref={camera} makeDefault position={[0, 8.2, 20]} fov={33} near={.1} far={100} /><color attach="background" args={["#4B3A7A"]} /><fog attach="fog" args={["#4B3A7A", 14, 28]} /><hemisphereLight color="#FFF6EA" groundColor="#1D4E5A" intensity={1.15} /><directionalLight position={[-6, 10, 6]} intensity={3.2} color="#FFB38A" castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-.0001} /><directionalLight position={[5, 4, -8]} intensity={.75} color="#78A8C4" /><Environment preset="sunset" environmentIntensity={.18} /><group ref={island}><Island /><Clouds />{village.map(item => <Building key={item.id} item={item} />)}<Tree position={[-3.7, .9, -.4]} scale={1.15} /><Tree position={[3.6, .95, 1.1]} scale={.82} /><Tree position={[1.8, .9, -1.8]} scale={.72} /><Fence position={[-2.8, .9, 1.6]} rotation={.1} /><Fence position={[2.8, .9, -1.2]} rotation={-.4} />{villagers.map((villager, index) => <Villager key={villager.role} {...villager} focused={focused === villager.role} bubbleOffset={index} />)}<Text position={[0, 3.25, 0]} fontSize={.2} color="#FFF6EA" anchorX="center" anchorY="middle">MARKETDAY</Text>{settled.map((event, index) => <CoinArc key={`${event.id}-${index}`} index={index} />)}{blocked && <Leash event={blocked} />}</group><ContactShadows position={[1, .7, 0]} opacity={.5} scale={10} blur={2.8} far={5} /><Sparkles count={mobile ? 18 : 42} scale={[10, 4, 10]} size={mobile ? 1.2 : 1.8} speed={.18} color="#FFC857" />{!mobile && <EffectComposer multisampling={0}><Bloom luminanceThreshold={.9} intensity={.28} mipmapBlur /><DepthOfField focusDistance={.03} focalLength={.035} bokehScale={.8} /><Vignette eskil={false} offset={.22} darkness={.35} /><Noise opacity={.018} /></EffectComposer>}</>;
}

function checkWebGL() { const canvas = document.createElement("canvas"); return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl")); }

export default function FloatingIslandDiorama({ recordMode = false }: FloatingIslandProps) {
  const { events, connected } = useMarketStream(); const [renderer, setRenderer] = useState<RendererState>("LOADING"); const [webglSupported, setWebglSupported] = useState<boolean | null>(null); const [reducedMotion, setReducedMotion] = useState(false); const [mobile, setMobile] = useState(false); const [soundOn, setSoundOn] = useState(false);
  const audioRef = useRef<AudioContext | null>(null); const windRef = useRef<OscillatorNode | null>(null); const lastSoundEvent = useRef<string | undefined>(undefined);
  useEffect(() => { const timer = window.setTimeout(() => setWebglSupported(checkWebGL()), 0); return () => window.clearTimeout(timer); }, []);
  useEffect(() => { const query = window.matchMedia("(prefers-reduced-motion: reduce)"); const update = () => { setReducedMotion(query.matches); setMobile(window.innerWidth < 700); }; update(); query.addEventListener("change", update); window.addEventListener("resize", update); return () => { query.removeEventListener("change", update); window.removeEventListener("resize", update); }; }, []);
  useEffect(() => { const event = events.at(-1); const context = audioRef.current; if (!soundOn || !event || event.id === lastSoundEvent.current || !context || context.state !== "running") return; lastSoundEvent.current = event.id; playTone(context, event.type === "settled" ? 620 : event.type === "blocked" ? 120 : 360, event.type === "blocked" ? .32 : .12, event.type === "blocked" ? .05 : .028); }, [events, soundOn]);
  const latest = events.at(-1); const ledger = process.env.NEXT_PUBLIC_NEAR_LEDGER_MODE ?? "DEMO LEDGER";
  const toggleSound = () => { if (soundOn) { windRef.current?.stop(); windRef.current = null; void audioRef.current?.close(); audioRef.current = null; setSoundOn(false); return; } const context = new AudioContext(); const wind = context.createOscillator(); const gain = context.createGain(); wind.type = "sine"; wind.frequency.value = 92; gain.gain.value = .008; wind.connect(gain); gain.connect(context.destination); wind.start(); audioRef.current = context; windRef.current = wind; setSoundOn(true); playTone(context, 440, .14); };
  const scene = webglSupported === null ? <ScenePlaceholder /> : webglSupported ? <Canvas dpr={[1, 2]} gl={{ antialias: true, powerPreference: "high-performance" }} onCreated={() => setRenderer("R3F / WEBGL")}><DioramaScene events={events} reducedMotion={reducedMotion} recordMode={recordMode} mobile={mobile} /></Canvas> : <StaticFallback />;
  return <main className="diorama-page"><div className="diorama-sky" /><div className="diorama-canvas-layer">{scene}</div>{!recordMode && <header className="diorama-header"><div className="diorama-header-copy"><p className="diorama-kicker">MARKETDAY / FLOATING ISLAND</p><h1 className="diorama-title">A village with a pulse.</h1><p className="diorama-subtitle">Autonomous agents make a living market above the clouds.</p></div><div className="diorama-nav"><span className="diorama-pill">{connected ? "LIVE" : "CONNECTING"}</span><Link href="/login" className="diorama-pill">OBSERVER LOGIN</Link></div></header>}{!recordMode && <><div className="diorama-status"><span className="diorama-dot" />{events.length ? `[ ${latest?.type.toUpperCase()} / ${latest?.label} ]` : "WAITING FOR THE MARKET"}<span className="diorama-renderer">{renderer}</span></div><div className="diorama-feed">{events.slice(-4).reverse().map(event => <div key={event.id}><span>{event.type.toUpperCase()}</span> {event.actor} <small>{event.label}</small></div>)}</div><footer className="diorama-footer"><span>05 VILLAGERS / {ledger}</span><button onClick={toggleSound} className="diorama-pill">{soundOn ? "SOUND ON" : "SOUND OFF"}</button></footer></>}</main>;
}
