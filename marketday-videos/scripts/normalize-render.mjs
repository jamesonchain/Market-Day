import { spawnSync } from "node:child_process";

const [, , input, output] = process.argv;
if (!input || !output) {
  throw new Error("Usage: node scripts/normalize-render.mjs input.mp4 output.mp4");
}

const result = spawnSync("ffmpeg", [
  "-y", "-i", input,
  "-af", "loudnorm=I=-14:TP=-1.0:LRA=7:linear=true",
  "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
  output
], { stdio: "inherit" });

if (result.status !== 0) {
  throw new Error(`ffmpeg normalization failed with status ${result.status}`);
}
