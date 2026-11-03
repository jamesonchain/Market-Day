import { execFileSync, spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

type Caption = { text: string; start: number; end: number };
type AudioProps = { projectName: string; narration: string; endLine: string; endingTail: number; duration?: number; captions?: Caption[] };

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const audioDir = join(root, "assets", "audio");
const propsFile = join(root, "compositions", "audio.props.json");
const props = JSON.parse(await readFile(propsFile, "utf8")) as AudioProps;
await mkdir(audioDir, { recursive: true });

function durationOf(file: string) {
  return Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", file], { encoding: "utf8" }).trim());
}

async function elevenLabs(out: string) {
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}/with-timestamps`, {
    method: "POST",
    headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY!, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ text: props.narration, model_id: "eleven_multilingual_v2", output_format: "pcm_44100", voice_settings: { stability: 0.5, similarity_boost: 0.75 } })
  });
  if (!response.ok) throw new Error(`ElevenLabs returned ${response.status}`);
  const result = await response.json() as { audio_base64: string; alignment?: { characters: string[]; character_start_times_seconds: number[]; character_end_times_seconds: number[] } };
  await writeFile(out, Buffer.from(result.audio_base64, "base64"));
  if (result.alignment) return captionsFromAlignment(result.alignment);
  return [];
}

function captionsFromAlignment(alignment: { characters: string[]; character_start_times_seconds: number[]; character_end_times_seconds: number[] }) {
  const captions: Caption[] = [];
  let word = "";
  let start = 0;
  let end = 0;
  for (let i = 0; i < alignment.characters.length; i += 1) {
    const character = alignment.characters[i];
    if (!word && /\S/.test(character)) start = alignment.character_start_times_seconds[i];
    if (/\S/.test(character)) word += character;
    end = alignment.character_end_times_seconds[i];
    if (word && (/[.!?]$/.test(character) || /\s/.test(character) && word.split(/\s+/).length >= 5)) {
      captions.push({ text: word.trim(), start: Number(start.toFixed(3)), end: Number(end.toFixed(3)) });
      word = "";
    }
  }
  if (word) captions.push({ text: word.trim(), start: Number(start.toFixed(3)), end: Number(end.toFixed(3)) });
  return captions;
}

function runLocalVoice(out: string) {
  const kokoro = spawnSync("python3", ["-c", "import kokoro_onnx"], { stdio: "ignore" });
  if (kokoro.status === 0) {
    const result = spawnSync("npx", ["--yes", "hyperframes@0.9.7", "tts", props.narration, "--voice", "af_heart", "--output", out], { cwd: root, stdio: "inherit" });
    if (result.status === 0) return;
  }
  const aiff = `${out}.aiff`;
  console.log("Kokoro is unavailable. Using one macOS system voice call for the local render.");
  execFileSync("say", ["-v", "Samantha", "-o", aiff, props.narration], { stdio: "inherit" });
  execFileSync("ffmpeg", ["-y", "-i", aiff, "-ar", "44100", "-ac", "1", out], { stdio: "inherit" });
  execFileSync("rm", [aiff]);
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

function fallbackCaptions(text: string, duration: number): Caption[] {
  const words = text.match(/[^\s]+/g) ?? [];
  const groups: string[] = [];
  for (let i = 0; i < words.length; i += 5) groups.push(words.slice(i, i + 5).join(" "));
  return groups.map((value, index) => ({ text: value, start: Number((index * duration / groups.length).toFixed(3)), end: Number(((index + 1) * duration / groups.length).toFixed(3)) }));
}

function transcribeCaptions(file: string): Caption[] {
  const result = spawnSync("npx", ["--yes", "hyperframes@0.9.7", "transcribe", file, "--json"], { cwd: root, encoding: "utf8" });
  if (result.status === 0) {
    try {
      const output = `${result.stdout}\n${result.stderr ?? ""}`;
      const records = output.trim().split("\n").filter(line => line.trim().startsWith("{" )).map(line => JSON.parse(line));
      const timed = records.flatMap(record => Array.isArray(record.words) ? record.words : []).filter((item: any) => item && typeof item.start === "number" && typeof item.end === "number");
      if (timed.length) {
        const captions: Caption[] = [];
        for (let i = 0; i < timed.length; i += 5) {
          const group = timed.slice(i, i + 5);
          captions.push({ text: group.map((item: any) => String(item.text ?? item.word).trim()).join(" "), start: group[0].start, end: group[group.length - 1].end });
        }
        return captions;
      }
    } catch {
      console.log("Local transcription returned no JSON timings. Using deterministic phrase timing.");
    }
  }
  console.log("Local transcription was unavailable. Using deterministic phrase timing for captions.");
  return fallbackCaptions(props.narration, durationOf(file));
}

const narrationFile = join(audioDir, "marketday-narration.wav");
let timedCaptions: Caption[] = [];
if (process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_VOICE_ID) {
  timedCaptions = await elevenLabs(narrationFile);
  console.log("Generated one continuous narration file with ElevenLabs timestamps.");
} else {
  runLocalVoice(narrationFile);
  console.log("Generated one continuous narration file with one local TTS call.");
}
execFileSync("ffmpeg", ["-y", "-i", narrationFile, "-ar", "44100", "-ac", "1", `${narrationFile}.mono.wav`], { stdio: "ignore" });
execFileSync("mv", [`${narrationFile}.mono.wav`, narrationFile]);
const narrationDuration = durationOf(narrationFile);
if (!timedCaptions.length) timedCaptions = transcribeCaptions(narrationFile);
props.duration = Number(narrationDuration.toFixed(3));
props.captions = timedCaptions;
await writeFile(propsFile, `${JSON.stringify(props, null, 2)}\n`);

const finalDuration = narrationDuration + props.endingTail;
const musicFile = join(audioDir, "marketday-music.wav");
await wav(musicFile, finalDuration, t => {
  const tailStart = Math.max(0, finalDuration - props.endingTail);
  const base = Math.sin(t * 2 * Math.PI * 110) * 0.3 + Math.sin(t * 2 * Math.PI * 164.8) * 0.16;
  const chord = t >= tailStart ? Math.sin(t * 2 * Math.PI * 261.63) * 0.22 + Math.sin(t * 2 * Math.PI * 329.63) * 0.16 : 0;
  return base + chord;
}, 0.22);

const finalAudio = join(audioDir, "marketday-final-audio.wav");
const filter = `[1:a]volume=0.126,afade=t=in:st=0:d=0.4,afade=t=out:st=${Math.max(0, finalDuration - 1.5).toFixed(3)}:d=1.5[music];[music][0:a]sidechaincompress=threshold=0.02:ratio=5:attack=0.2:release=0.6:makeup=1[ducked];[0:a]apad=pad_dur=${props.endingTail},atrim=duration=${finalDuration.toFixed(3)}[voice];[voice][ducked]amix=inputs=2:duration=longest:dropout_transition=0,loudnorm=I=-14:TP=-1.0:LRA=7`;
execFileSync("ffmpeg", ["-y", "-i", narrationFile, "-i", musicFile, "-filter_complex", filter, "-ar", "48000", "-ac", "1", finalAudio], { stdio: "inherit" });
console.log(`Built one final mono audio track at ${durationOf(finalAudio).toFixed(3)} seconds.`);
