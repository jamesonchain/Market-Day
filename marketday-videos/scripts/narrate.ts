import { execFileSync, spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

type Props = { narration: string; duration?: number; captions?: Caption[]; [key: string]: unknown };
type Caption = { text: string; start: number; end: number };

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const compositions = join(root, "compositions");
const audio = join(root, "assets", "audio");
const names = ["day-intro", "lower-third", "stat-card", "blocked-moment", "final-outro"];

function durationOf(file: string) {
  return Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", file], { encoding: "utf8" }).trim());
}

function polishVoice(file: string) {
  const rawDuration = durationOf(file);
  const trimStart = 0.06;
  const tail = 0.9;
  const speechDuration = Math.max(0.2, rawDuration - trimStart);
  const finalDuration = speechDuration + tail;
  const temp = `${file}.polished.wav`;
  const filter = `atrim=start=${trimStart},asetpts=PTS-STARTPTS,highpass=f=85,lowpass=f=11500,acompressor=threshold=-24dB:ratio=2:attack=20:release=160:makeup=1,afade=t=in:st=0:d=0.08,apad=pad_dur=${tail},afade=t=out:st=${Math.max(0, speechDuration - 0.12)}:d=${tail}`;
  execFileSync("ffmpeg", ["-y", "-i", file, "-af", filter, "-t", finalDuration.toFixed(3), "-ar", "44100", "-ac", "1", temp], { stdio: "ignore" });
  execFileSync("mv", [temp, file]);
  return { speechDuration: Number(speechDuration.toFixed(3)), finalDuration: Number(finalDuration.toFixed(3)) };
}

function wav(file: string, seconds: number, tone: (t: number) => number, volume = 0.2) {
  const rate = 44100;
  const count = Math.max(1, Math.floor(seconds * rate));
  const data = Buffer.alloc(count * 2);
  for (let i = 0; i < count; i += 1) {
    const t = i / rate;
    const fade = Math.min(1, t * 14, (seconds - t) * 18);
    data.writeInt16LE(Math.max(-1, Math.min(1, tone(t) * volume * Math.max(0, fade))) * 32767, i * 2);
  }
  const header = Buffer.alloc(44);
  header.write("RIFF", 0); header.writeUInt32LE(36 + data.length, 4); header.write("WAVE", 8);
  header.write("fmt ", 12); header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(1, 22);
  header.writeUInt32LE(rate, 24); header.writeUInt32LE(rate * 2, 28); header.writeUInt16LE(2, 32); header.writeUInt16LE(16, 34);
  header.write("data", 36); header.writeUInt32LE(data.length, 40);
  return writeFile(file, Buffer.concat([header, data]));
}

async function elevenLabs(text: string, out: string) {
  const mp3 = `${out}.mp3`;
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}`, {
    method: "POST",
    headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY!, "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify({ text, model_id: "eleven_multilingual_v2", voice_settings: { stability: 0.5, similarity_boost: 0.75 } }),
  });
  if (!response.ok) throw new Error(`ElevenLabs returned ${response.status}`);
  await writeFile(mp3, Buffer.from(await response.arrayBuffer()));
  execFileSync("ffmpeg", ["-y", "-i", mp3, "-ar", "44100", "-ac", "1", out], { stdio: "inherit" });
  execFileSync("rm", [mp3]);
}

function captions(text: string, duration: number): Caption[] {
  const words = text.match(/[^\s]+/g) ?? [];
  const groups: string[] = [];
  for (let i = 0; i < words.length; i += 4) groups.push(words.slice(i, i + 4).join(" "));
  return groups.map((value, index) => ({ text: value, start: Number((index * duration / groups.length).toFixed(3)), end: Number(((index + 1) * duration / groups.length).toFixed(3)) }));
}

async function runKokoro(text: string, out: string) {
  await new Promise<void>((resolve, reject) => {
    const child = spawn("npx", ["--yes", "hyperframes@0.9.7", "tts", text, "--voice", "af_heart", "--output", out], { cwd: root, stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", code => code === 0 ? resolve() : reject(new Error(`Kokoro exited with code ${code}`)));
  });
}

function runSystemPreviewVoice(text: string, out: string) {
  const aiff = `${out}.aiff`;
  console.log("Kokoro is not installed. Setup: python3 -m pip install kokoro-onnx soundfile, then rerun npm run video:narrate.");
  console.log("Using the macOS system voice as a local preview fallback for this render.");
  execFileSync("say", ["-v", "Samantha", "-o", aiff, text], { stdio: "inherit" });
  execFileSync("ffmpeg", ["-y", "-i", aiff, "-ar", "44100", "-ac", "1", out], { stdio: "inherit" });
  execFileSync("rm", [aiff]);
}

await mkdir(audio, { recursive: true });
for (const name of names) {
  const propsFile = join(compositions, `${name}.props.json`);
  const props = JSON.parse(await readFile(propsFile, "utf8")) as Props;
  const voiceFile = join(audio, `${name}-narration.wav`);
  if (process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_VOICE_ID) {
    await elevenLabs(props.narration, voiceFile);
    console.log(`${name}: generated with ElevenLabs`);
  } else {
    console.log(`${name}: ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID not set, using HyperFrames Kokoro`);
    try {
      await runKokoro(props.narration, voiceFile);
    } catch {
      runSystemPreviewVoice(props.narration, voiceFile);
    }
  }
  const polished = polishVoice(voiceFile);
  props.duration = polished.finalDuration;
  props.captions = captions(props.narration, polished.speechDuration);
  await writeFile(propsFile, `${JSON.stringify(props, null, 2)}\n`);
}

await wav(join(audio, "ambient-bed.wav"), 60, t => Math.sin(t * 2 * Math.PI * 110) * 0.35 + Math.sin(t * 2 * Math.PI * 164.8) * 0.18 + Math.sin(t * 2 * Math.PI * 0.17) * 0.12, 0.28);
await wav(join(audio, "title-reveal.wav"), 0.65, t => Math.sin(t * 2 * Math.PI * (520 + t * 500)) * Math.exp(-4 * t), 0.5);
await wav(join(audio, "stat-number.wav"), 0.32, t => Math.sin(t * 2 * Math.PI * 260) * Math.exp(-7 * t), 0.5);
await wav(join(audio, "blocked-tag.wav"), 0.55, t => Math.sin(t * 2 * Math.PI * 95) * Math.exp(-5 * t), 0.42);
console.log("Narration, ambient bed and deterministic sound effects are ready in assets/audio/.");
