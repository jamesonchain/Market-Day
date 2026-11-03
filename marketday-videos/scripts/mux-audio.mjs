import { execFileSync, spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const [, , silent, audio, output] = process.argv;
if (!silent || !audio || !output) throw new Error("Usage: node scripts/mux-audio.mjs silent.mp4 audio.wav output.mp4");
execFileSync("ffmpeg", ["-y", "-i", silent, "-i", audio, "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", output], { stdio: "inherit" });

const probe = JSON.parse(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration:stream=codec_type", "-of", "json", output], { encoding: "utf8" }));
const audioStreams = (probe.streams ?? []).filter(stream => stream.codec_type === "audio").length;
const videoDuration = Number(probe.format.duration);
const audioDuration = Number(execFileSync("ffprobe", ["-v", "error", "-select_streams", "a:0", "-show_entries", "stream=duration", "-of", "default=nw=1:nk=1", output], { encoding: "utf8" }).trim());
if (audioStreams !== 1) throw new Error(`Expected exactly one audio stream, found ${audioStreams}`);
if (Math.abs(videoDuration - audioDuration) > 0.1) throw new Error(`Video and audio durations differ: ${videoDuration} vs ${audioDuration}`);

const props = JSON.parse(await readFile(new URL("../compositions/audio.props.json", import.meta.url), "utf8"));
const transcribe = spawnSync("npx", ["--yes", "hyperframes@0.9.7", "transcribe", output, "--json"], { encoding: "utf8" });
if (transcribe.status !== 0) throw new Error("Speech to text verification failed to run.");
let transcript = `${transcribe.stdout}\n${transcribe.stderr ?? ""}`.toLowerCase();
try {
  const outputText = `${transcribe.stdout}\n${transcribe.stderr ?? ""}`;
  const records = outputText.trim().split("\n").filter(line => line.trim().startsWith("{" )).map(line => JSON.parse(line));
  const words = records.flatMap(record => Array.isArray(record.words) ? record.words : []);
  if (words.length) transcript = words.map(word => String(word.text ?? word.word)).join(" ").toLowerCase();
} catch {
  // Plain text output is still checked below.
}
const normalize = value => value.toLowerCase().replace(/market\s+day/g, "marketday").replace(/[^a-z0-9]+/g, "").trim();
const normalizedTranscript = normalize(transcript);
const sentences = props.narration.split(/(?<=[.!?])\s+/).map(sentence => normalize(sentence)).filter(Boolean);
for (const sentence of sentences) {
  const occurrence = normalizedTranscript.split(sentence).length - 1;
  if (occurrence !== 1) throw new Error(`Speech to text found ${occurrence} copies of sentence: ${sentence}`);
}
console.log(`Verified one audio stream, video ${videoDuration.toFixed(3)} seconds, audio ${audioDuration.toFixed(3)} seconds.`);
console.log(`Speech to text verification found each of ${sentences.length} narration sentences exactly once.`);
