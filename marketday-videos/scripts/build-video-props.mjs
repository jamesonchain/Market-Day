import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const names = ["day-intro", "lower-third", "stat-card", "blocked-moment", "final-outro"];
const theme = await readFile(join(root, "compositions/shared.css"), "utf8");
const landscape = process.env.VIDEO_FORMAT === "landscape";
const width = landscape ? 1920 : 1080;
const height = landscape ? 1080 : 1350;
const indexTemplate = await readFile(join(root, "index.source"), "utf8");
const propsByName = {};
for (const name of names) propsByName[name] = JSON.parse(await readFile(join(root, "compositions", `${name}.props.json`), "utf8"));
const dayDuration = propsByName["day-intro"].duration ?? 6;
const lowerDuration = propsByName["lower-third"].duration ?? 3;
const statDuration = propsByName["stat-card"].duration ?? 4;
const blockedDuration = propsByName["blocked-moment"].duration ?? 4;
const dailyDuration = dayDuration + lowerDuration + statDuration + blockedDuration;
const index = indexTemplate
  .replaceAll("__WIDTH__", String(width)).replaceAll("__HEIGHT__", String(height))
  .replaceAll("__DAY_DURATION__", String(dayDuration)).replaceAll("__LOWER_START__", String(dayDuration))
  .replaceAll("__LOWER_DURATION__", String(lowerDuration)).replaceAll("__STAT_START__", String(dayDuration + lowerDuration))
  .replaceAll("__STAT_DURATION__", String(statDuration)).replaceAll("__BLOCKED_START__", String(dayDuration + lowerDuration + statDuration))
  .replaceAll("__BLOCKED_DURATION__", String(blockedDuration)).replaceAll("__DAILY_DURATION__", String(dailyDuration));
await writeFile(join(root, "index.html"), index);

for (const name of names) {
  const dir = join(root, "compositions");
  const props = JSON.parse(await readFile(join(dir, `${name}.props.json`), "utf8"));
  const template = await readFile(join(dir, `${name}.source`), "utf8");
  const captionMarkup = `<div id="${name}-captions" data-track-kind="captions">${(props.captions ?? []).map((caption, index) => `<div id="${name}-caption-${index}" class="caption clip" data-start="${caption.start}" data-duration="${Math.max(0.01, caption.end - caption.start)}">${caption.text}</div>`).join("")}</div>`;
  const duration = props.duration ?? 4;
  const sfx = name === "day-intro" ? "title-reveal" : name === "stat-card" ? "stat-number" : name === "blocked-moment" ? "blocked-tag" : "";
  const sfxDuration = name === "day-intro" ? 0.65 : name === "stat-card" ? 0.32 : 0.55;
  const sfxMarkup = sfx ? `<audio id="${name}-sfx" class="clip" data-start="${name === "day-intro" ? 0.35 : name === "stat-card" ? 0.6 : 1.55}" data-hf-media-start-basis="local" data-duration="${sfxDuration}" data-track-index="12" src="assets/audio/${sfx}.wav" data-volume="0.26" data-fade-in="0.02" data-fade-out="0.18"></audio>` : "";
  const audioMarkup = `<audio id="${name}-narration" class="clip" data-start="0" data-duration="${duration}" data-track-index="10" src="assets/audio/${name}-narration.wav" data-volume="1" data-fade-in="0.08" data-fade-out="0.8"></audio><audio id="${name}-bed" class="clip" data-start="0" data-duration="${duration}" data-track-index="11" src="assets/audio/ambient-bed.wav" data-volume="0.1" data-fade-in="1.2" data-fade-out="0.9" data-automation=\'{"version":1,"lanes":[{"target":"volume","points":[{"t":0,"v":0},{"t":0.9,"v":0.2},{"t":1.5,"v":0.25},{"t":${Math.max(1.6, duration - 0.9)},"v":0.25},{"t":${duration},"v":0}]}]}\'></audio>${sfxMarkup}`;
  const html = template.replace("__THEME__", theme).replace("__AUDIO__", audioMarkup).replace("__CAPTIONS__", captionMarkup).replace("__PROPS__", JSON.stringify(props));
  await writeFile(join(dir, `${name}.html`), html);
}
