"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Html, Instance, Instances, PerspectiveCamera, RoundedBox, Sparkles, Text } from "@react-three/drei";
import { Bloom, DepthOfField, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import Link from "next/link";

type MarketEvent = { id: string; type: string; actor: string; message: string; label: string; tick: number; data?: { reason?: string } };
type FloatingIslandProps = { recordMode?: boolean };
type RendererState = "R3F / WEBGL" | "STATIC FALLBACK" | "LOADING";

const village = [
  { id: "bakery", name: "Bakery", position: [-2.6, 1.18, 0.1] as [number, number, number], color: "#E8654F", roof: "#D95546" },
  { id: "farm", name: "Farm", position: [0.1, 1.12, -1.1] as [number, number, number], color: "#7FA86B", roof: "#6C8F5C" },
  { id: "mill", name: "Mill", position: [2.45, 1.12, 0.4] as [number, number, number], color: "#C27F62", roof: "#A76655" },
  { id: "market", name: "Market Square", position: [0.4, 1.06, 1.45] as [number, number, number], color: "#D99365", roof: "#C2765E" },
];
const villagers = [
  { role: "baker", color: "#E8654F", position: [-1.7, 1.35, 1.05] as [number, number, number] },
  { role: "farmer", color: "#7FA86B", position: [-0.6, 1.3, -0.3] as [number, number, number] },
  { role: "farmerTwo", color: "#E8A154", position: [1.25, 1.3, 0.6] as [number, number, number] },
  { role: "miller", color: "#839BB8", position: [2, 1.3, -0.4] as [number, number, number] },
  { role: "merchant", color: "#B77DBD", position: [0.8, 1.3, 1.55] as [number, number, number] },
];

function useMarketStream() {
  const [events, setEvents] = useState<MarketEvent[]>([]);
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    const stream = new EventSource("/api/events");
    stream.onopen = () => setConnected(true);
    stream.onmessage = (message) => { setConnected(true); const event = JSON.parse(message.data) as MarketEvent; setEvents((current) => [...current.slice(-19), event]); };
    stream.onerror = () => setConnected(false);
    const tick = window.setInterval(() => { void fetch("/api/tick", { method: "POST" }); }, 10000);
    return () => { stream.close(); window.clearInterval(tick); };
  }, []);
  return { events, connected };
}

function playTone(context: AudioContext, frequency: number, duration: number, volume = 0.035) {
  const oscillator = context.createOscillator(); const gain = context.createGain(); oscillator.type = "sine"; oscillator.frequency.value = frequency; gain.gain.setValueAtTime(volume, context.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration); oscillator.connect(gain); gain.connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + duration);
}

function StaticFallback() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => { const canvas = canvasRef.current; if (!canvas) return; const context = canvas.getContext("2d"); if (!context) return; const ratio = window.devicePixelRatio || 1; canvas.width = canvas.clientWidth * ratio; canvas.height = canvas.clientHeight * ratio; context.scale(ratio, ratio); const gradient = context.createLinearGradient(0, 0, 0, canvas.clientHeight); gradient.addColorStop(0, "#141631"); gradient.addColorStop(0.45, "#4B3A7A"); gradient.addColorStop(0.78, "#E8718D"); gradient.addColorStop(1, "#FFB38A"); context.fillStyle = gradient; context.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight); context.fillStyle = "#E9D8C4"; context.beginPath(); context.ellipse(canvas.clientWidth * 0.5, canvas.clientHeight * 0.68, canvas.clientWidth * 0.35, canvas.clientHeight * 0.13, 0, 0, Math.PI * 2); context.fill(); context.fillStyle = "#7FA86B"; context.beginPath(); context.ellipse(canvas.clientWidth * 0.5, canvas.clientHeight * 0.63, canvas.clientWidth * 0.31, canvas.clientHeight * 0.09, 0, 0, Math.PI * 2); context.fill(); context.fillStyle = "#FFF6EA"; context.font = "16px Geist, sans-serif"; context.textAlign = "center"; context.fillText("Your browser is using the static island view", canvas.clientWidth * 0.5, canvas.clientHeight * 0.9); }, []);
  return <div className="absolute inset-0"><canvas ref={canvasRef} className="h-full w-full" /><div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#141631]/50 px-4 py-2 text-xs text-[#FFF6EA]">WebGL unavailable. The village is still here.</div></div>;
}

function Clouds() {
  const positions = useMemo(() => Array.from({ length: 18 }, (_, index) => ({ position: [((index * 1.9) % 14) - 7, -1.7 - (index % 3) * 0.5, ((index * 2.7) % 10) - 5] as [number, number, number], scale: 0.35 + (index % 4) * 0.12 })), []);
  return <Instances limit={30} castShadow><sphereGeometry args={[1, 12, 8]} /><meshStandardMaterial color="#FFF6EA" roughness={1} transparent opacity={0.72} />{positions.map((cloud, index) => <Instance key={index} position={cloud.position} scale={cloud.scale} />)}</Instances>;
}

function Island() {
  return <group position={[0, -0.15, 0]}><mesh receiveShadow castShadow><cylinderGeometry args={[4.3, 3.1, 1.25, 10]} /><meshStandardMaterial color="#7B554B" roughness={1} /></mesh><mesh position={[0, 0.67, 0]} receiveShadow castShadow><cylinderGeometry args={[4.35, 4.35, 0.25, 10]} /><meshStandardMaterial color="#7FA86B" roughness={0.92} /></mesh>{[-2.7, -1.2, 1.8, 2.9].map((x, index) => <mesh key={index} position={[x, -1.1, 0.8 - index * 0.3]} rotation={[0, index, 0]}><coneGeometry args={[0.05 + index * 0.02, 1.1 + index * 0.25, 5]} /><meshStandardMaterial color="#4D6E5F" roughness={1} /></mesh>)}{[-2.8, 2.4].map((x, index) => <mesh key={index} position={[x, 0.2, 0]} rotation={[0, 0, index ? -0.2 : 0.2]}><cylinderGeometry args={[0.05, 0.12, 1.4, 8]} /><meshStandardMaterial color="#8FD3D1" transparent opacity={0.65} roughness={0.2} /></mesh>)}</group>;
}

function Tree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return <group position={position} scale={scale}><mesh position={[0, 0.42, 0]} castShadow><cylinderGeometry args={[0.08, 0.12, 0.8, 8]} /><meshStandardMaterial color="#855C4D" roughness={1} /></mesh><mesh position={[0, 0.9, 0]} castShadow><icosahedronGeometry args={[0.47, 1]} /><meshStandardMaterial color="#6C975F" roughness={0.94} /></mesh></group>;
}

function Building({ item }: { item: (typeof village)[number] }) {
  const wheelRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => { if (item.id === "mill" && wheelRef.current) wheelRef.current.rotation.z -= delta * 0.55; });
  return <group position={item.position}><RoundedBox args={[1.45, 1.05, 1.15]} radius={0.18} smoothness={4} castShadow receiveShadow><meshStandardMaterial color={item.color} roughness={0.9} /></RoundedBox><mesh position={[0, 0.64, 0]} rotation={[0, Math.PI / 4, 0]} castShadow><coneGeometry args={[1.08, 0.65, 4]} /><meshStandardMaterial color={item.roof} roughness={0.96} /></mesh><Text position={[0, -0.72, 0.62]} fontSize={0.12} color="#14172B" anchorX="center" anchorY="middle">{item.name}</Text>{item.id === "bakery" && <group position={[0.42, 1.15, 0]}><mesh castShadow><cylinderGeometry args={[0.12, 0.16, 0.7, 8]} /><meshStandardMaterial color="#A76655" /></mesh><mesh position={[0, 0.38, 0]}><sphereGeometry args={[0.17, 10, 8]} /><meshStandardMaterial color="#FFF6EA" transparent opacity={0.5} /></mesh></group>}{item.id === "farm" && <group position={[0.82, 0.5, 0]}><mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.08, 0.08, 1.1, 8]} /><meshStandardMaterial color="#855C4D" /></mesh>{[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((rotation) => <mesh key={rotation} rotation={[0, 0, rotation]} position={[0.42, 0.5, 0]}><boxGeometry args={[0.08, 0.65, 0.04]} /><meshStandardMaterial color="#FFF6EA" /></mesh>)}</group>}{item.id === "mill" && <group ref={wheelRef} position={[0, 0.05, 0.63]}><mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.35, 0.06, 8, 16]} /><meshStandardMaterial color="#855C4D" /></mesh><mesh rotation={[Math.PI / 2, 0, 0]}><boxGeometry args={[0.62, 0.06, 0.06]} /><meshStandardMaterial color="#855C4D" /></mesh></group>}{item.id === "market" && <group position={[0, 0.45, 0.7]}><mesh><boxGeometry args={[1.5, 0.05, 0.05]} /><meshStandardMaterial color="#FFF6EA" /></mesh><mesh position={[-0.5, -0.25, 0]} rotation={[0, 0, 0.1]}><coneGeometry args={[0.42, 0.5, 4]} /><meshStandardMaterial color="#E8654F" /></mesh><mesh position={[0.5, -0.25, 0]} rotation={[0, 0, -0.1]}><coneGeometry args={[0.42, 0.5, 4]} /><meshStandardMaterial color="#F6B93B" /></mesh></group>}</group>;
}

function Villager({ role, color, position, focused }: { role: string; color: string; position: [number, number, number]; focused: boolean }) {
  const group = useRef<THREE.Group>(null); const [hovered, setHovered] = useState(false);
  useFrame((state) => { if (group.current) group.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2.3 + position[0]) * 0.035; });
  return <group ref={group} position={position} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)} scale={focused ? 1.12 : 1}><mesh position={[0, 0.24, 0]} castShadow><sphereGeometry args={[0.25, 16, 12]} /><meshStandardMaterial color={color} roughness={0.85} /></mesh><mesh position={[0, 0.62, 0]} castShadow><sphereGeometry args={[0.2, 16, 12]} /><meshStandardMaterial color="#FFF6EA" roughness={0.9} /></mesh><mesh position={[-0.07, 0.66, 0.18]}><sphereGeometry args={[0.025, 8, 8]} /><meshBasicMaterial color="#14172B" /></mesh><mesh position={[0.07, 0.66, 0.18]}><sphereGeometry args={[0.025, 8, 8]} /><meshBasicMaterial color="#14172B" /></mesh>{(hovered || focused) && <Html distanceFactor={8}><div className="rounded-full bg-[#FFF6EA] px-2 py-1 text-[10px] text-[#14172B] shadow-lg">{role}</div></Html>}</group>;
}

function CoinArc({ index }: { index: number }) {
  const coin = useRef<THREE.Group>(null); const start = useMemo(() => new THREE.Vector3(-1.7, 1.65, 1), []); const end = useMemo(() => new THREE.Vector3(0.9, 1.65, 1.25), []);
  useFrame((state) => { if (!coin.current) return; const t = (state.clock.elapsedTime * 0.65 + index * 0.23) % 1; coin.current.position.lerpVectors(start, end, t); coin.current.position.y += Math.sin(t * Math.PI) * 1.15; coin.current.rotation.y += 0.12; });
  return <group ref={coin}><mesh castShadow><cylinderGeometry args={[0.13, 0.13, 0.045, 20]} /><meshStandardMaterial color="#F6B93B" emissive="#F6B93B" emissiveIntensity={0.35} metalness={0.7} roughness={0.22} /></mesh><pointLight color="#F6B93B" intensity={0.5} distance={1.2} /></group>;
}

function Leash({ event }: { event: MarketEvent }) { const ring = useRef<THREE.Mesh>(null); useFrame((state) => { if (ring.current) { const pulse = (Math.sin(state.clock.elapsedTime * 7) + 1) / 2; ring.current.scale.setScalar(1.05 + pulse * 0.16); } }); return <group position={[-1.7, 1.35, 1.05]}><mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.5, 0.58, 48]} /><meshBasicMaterial color="#FF3D2E" transparent opacity={0.75} /></mesh><Html distanceFactor={8}><div className="rounded-full bg-[#FF3D2E] px-3 py-1 text-[10px] text-[#FFF6EA] shadow-xl">{event.data?.reason ?? "Price above fair. Blocked."}</div></Html></group>; }

function DioramaScene({ events, reducedMotion, recordMode, mobile }: { events: MarketEvent[]; reducedMotion: boolean; recordMode: boolean; mobile: boolean }) {
  const camera = useRef<THREE.PerspectiveCamera>(null); const island = useRef<THREE.Group>(null); const focused = events.at(-1)?.actor ?? null; const settled = events.filter((event) => event.type === "settled").slice(-3); const blocked = events.findLast((event) => event.type === "blocked");
  useFrame((state) => { if (!camera.current || !island.current) return; const elapsed = state.clock.elapsedTime; const descent = reducedMotion ? 1 : Math.min(1, elapsed / (recordMode ? 6 : 4)); const ease = descent * descent * (3 - 2 * descent); camera.current.position.y = THREE.MathUtils.lerp(5.7, 3.2, ease); camera.current.position.z = THREE.MathUtils.lerp(11, 7.2, ease); if (!reducedMotion && descent >= 1) { camera.current.position.x = Math.sin(elapsed * 0.08) * 0.8; camera.current.lookAt(0, 0.8, 0); } island.current.rotation.y = reducedMotion ? 0 : Math.sin(elapsed * 0.04) * 0.035; });
  return <><PerspectiveCamera ref={camera} makeDefault position={[0, 5.7, 11]} fov={34} /><color attach="background" args={["#4B3A7A"]} /><fog attach="fog" args={["#4B3A7A", 9, 18]} /><ambientLight intensity={0.8} color="#FFF6EA" /><directionalLight position={[-4, 8, 5]} intensity={2.4} color="#FFB38A" castShadow shadow-mapSize={[1024, 1024]} /><directionalLight position={[4, 3, -4]} intensity={0.55} color="#7795B4" /><Environment preset="sunset" environmentIntensity={0.22} /><group ref={island}><Island /><Clouds />{village.map((item) => <Building key={item.id} item={item} />)}<Tree position={[-3.7, 0.9, -0.4]} scale={1.15} /><Tree position={[3.6, 0.95, 1.1]} scale={0.82} /><Tree position={[1.8, 0.9, -1.8]} scale={0.72} />{villagers.map((villager) => <Villager key={villager.role} {...villager} focused={focused === villager.role} />)}<Text position={[0, 3.15, 0]} fontSize={0.18} color="#FFF6EA" anchorX="center" anchorY="middle">MARKETDAY</Text>{settled.map((event, index) => <CoinArc key={`${event.id}-${index}`} index={index} />)}{blocked && <Leash event={blocked} />}</group><ContactShadows position={[0, 0.8, 0]} opacity={0.4} scale={8} blur={2.5} far={4} /><Sparkles count={mobile ? 18 : 42} scale={[8, 3, 8]} size={mobile ? 1.2 : 1.8} speed={0.18} color="#FFC857" />{!mobile && <EffectComposer multisampling={0}><Bloom luminanceThreshold={0.8} intensity={0.45} mipmapBlur /><DepthOfField focusDistance={0.015} focalLength={0.04} bokehScale={2.5} /><Vignette eskil={false} offset={0.2} darkness={0.42} /><Noise opacity={0.025} /></EffectComposer>}</>;
}

class ErrorBoundaryBase extends React.Component<React.PropsWithChildren> { state: { hasError: boolean } = { hasError: false }; }
class WebGLErrorBoundary extends ErrorBoundaryBase { state = { hasError: false }; static getDerivedStateFromError() { return { hasError: true }; } render() { return this.state.hasError ? <StaticFallback /> : this.props.children; } }

export default function FloatingIslandDiorama({ recordMode = false }: FloatingIslandProps) {
  const { events, connected } = useMarketStream(); const [renderer, setRenderer] = useState<RendererState>("LOADING"); const [reducedMotion, setReducedMotion] = useState(false); const [mobile, setMobile] = useState(false); const [soundOn, setSoundOn] = useState(false); const audioRef = useRef<AudioContext | null>(null); const windRef = useRef<OscillatorNode | null>(null); const lastSoundEvent = useRef<string | undefined>(undefined);
  useEffect(() => { const query = window.matchMedia("(prefers-reduced-motion: reduce)"); const update = () => { setReducedMotion(query.matches); setMobile(window.innerWidth < 700); }; update(); query.addEventListener("change", update); window.addEventListener("resize", update); return () => { query.removeEventListener("change", update); window.removeEventListener("resize", update); }; }, []);
  useEffect(() => { const event = events.at(-1); const context = audioRef.current; if (!soundOn || !event || event.id === lastSoundEvent.current || !context || context.state !== "running") return; lastSoundEvent.current = event.id; playTone(context, event.type === "settled" ? 620 : event.type === "blocked" ? 120 : 360, event.type === "blocked" ? 0.32 : 0.12, event.type === "blocked" ? 0.05 : 0.028); }, [events, soundOn]);
  const latest = events.at(-1); const ledger = process.env.NEXT_PUBLIC_NEAR_LEDGER_MODE ?? "DEMO LEDGER";
  const toggleSound = () => { if (soundOn) { windRef.current?.stop(); windRef.current = null; void audioRef.current?.close(); audioRef.current = null; setSoundOn(false); return; } const context = new AudioContext(); const wind = context.createOscillator(); const gain = context.createGain(); wind.type = "sine"; wind.frequency.value = 92; gain.gain.value = 0.008; wind.connect(gain); gain.connect(context.destination); wind.start(); audioRef.current = context; windRef.current = wind; setSoundOn(true); playTone(context, 440, 0.14); };
  return <main className="diorama-page relative min-h-screen overflow-hidden bg-[#141631] text-[#FFF6EA]"><div className="diorama-sky absolute inset-0" /><div className="relative z-10 flex min-h-screen flex-col"><header className={`diorama-header flex items-start justify-between p-5 sm:p-9 ${recordMode ? "opacity-0" : ""}`}><div><p className="diorama-kicker">MARKETDAY / FLOATING ISLAND</p><h1 className="diorama-title mt-3">A village with a pulse.</h1><p className="diorama-subtitle mt-3">Autonomous agents make a living market above the clouds.</p></div><div className="flex items-center gap-2"><span className="diorama-pill">{recordMode ? "GOLDEN HOUR" : connected ? "LIVE" : "CONNECTING"}</span>{!recordMode && <Link href="/login" className="diorama-pill">OBSERVER LOGIN</Link>}</div></header><div className={`diorama-stage relative mx-3 flex-1 overflow-hidden sm:mx-9 ${recordMode ? "record-stage" : ""}`}><WebGLErrorBoundary><Canvas dpr={[1, 2]} gl={{ antialias: true, powerPreference: "high-performance" }} onCreated={() => setRenderer("R3F / WEBGL")} fallback={<StaticFallback />}><DioramaScene events={events} reducedMotion={reducedMotion} recordMode={recordMode} mobile={mobile} /></Canvas></WebGLErrorBoundary><div className="diorama-loading" data-hidden={renderer !== "LOADING"}>{renderer === "LOADING" ? "DESCENDING THROUGH CLOUDS" : ""}</div>{!recordMode && <div className="diorama-status"><span className="diorama-dot" />{events.length ? `[ ${latest?.type.toUpperCase()} / ${latest?.label} ]` : "WAITING FOR THE MARKET"}<span className="diorama-renderer">{renderer}</span></div>}{!recordMode && <div className="diorama-feed">{events.slice(-4).reverse().map((event) => <div key={event.id}><span>{event.type.toUpperCase()}</span> {event.actor} <small>{event.label}</small></div>)}</div>}</div>{!recordMode && <footer className="diorama-footer flex items-center justify-between p-5 sm:p-9"><span>05 VILLAGERS / {ledger}</span><button onClick={toggleSound} className="diorama-pill">{soundOn ? "SOUND ON" : "SOUND OFF"}</button></footer>}</div></main>;
}
