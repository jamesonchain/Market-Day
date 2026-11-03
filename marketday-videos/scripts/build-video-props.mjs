import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const names = ["day-intro", "lower-third", "stat-card", "blocked-moment", "final-outro", "daily-ending"];
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
const daySlot = dayDuration + 0.5;
const lowerSlot = lowerDuration + 1;
const statSlot = statDuration + 1;
const blockedSlot = blockedDuration + 1;
const lowerStart = dayDuration - 0.5;
const statStart = lowerStart + lowerSlot - 0.5;
const blockedStart = statStart + statSlot - 0.5;
const endingStart = blockedStart + blockedSlot - 0.5;
const dailyDuration = endingStart + 3;
const voiceWindows = [[0, dayDuration], [lowerStart + 0.5, lowerStart + 0.5 + lowerDuration], [statStart + 0.5, statStart + 0.5 + statDuration], [blockedStart + 0.5, blockedStart + 0.5 + blockedDuration]]
  .sort((a, b) => a[0] - b[0])
  .reduce((merged, current) => {
    const previous = merged[merged.length - 1];
    if (previous && current[0] <= previous[1]) previous[1] = Math.max(previous[1], current[1]);
    else merged.push([...current]);
    return merged;
  }, []);
const duckPoints = [{ t: 0, v: 0 }];
for (const [start, end] of voiceWindows) {
  duckPoints.push({ t: Number(start.toFixed(3)), v: 0.9 });
  duckPoints.push({ t: Number((start + 0.2).toFixed(3)), v: 0.32 });
  duckPoints.push({ t: Number(Math.max(start + 0.2, end - 0.6).toFixed(3)), v: 0.32 });
  duckPoints.push({ t: Number(end.toFixed(3)), v: 0.9 });
}
duckPoints.push({ t: Number(dailyDuration.toFixed(3)), v: 0 });
const rootAudio = `<audio id="daily-music-bed" class="clip" data-start="0" data-duration="${dailyDuration}" data-track-index="20" src="assets/audio/ambient-bed.wav" data-volume="0.1" data-fade-in="0.4" data-fade-out="1.5" data-automation='${JSON.stringify({ version: 1, lanes: [{ target: "volume", points: duckPoints }] })}'></audio>`;
const index = indexTemplate
  .replaceAll("__WIDTH__", String(width)).replaceAll("__HEIGHT__", String(height))
  .replaceAll("__ROOT_AUDIO__", rootAudio).replaceAll("__DAY_DURATION__", String(daySlot)).replaceAll("__LOWER_START__", String(lowerStart))
  .replaceAll("__LOWER_DURATION__", String(lowerSlot)).replaceAll("__STAT_START__", String(statStart)).replaceAll("__STAT_DURATION__", String(statSlot))
  .replaceAll("__BLOCKED_START__", String(blockedStart)).replaceAll("__BLOCKED_DURATION__", String(blockedSlot)).replaceAll("__ENDING_START__", String(endingStart))
  .replaceAll("__DAILY_DURATION__", String(dailyDuration));
await writeFile(join(root, "index.html"), index);

for (const name of names) {
  const dir = join(root, "compositions");
  const props = JSON.parse(await readFile(join(dir, `${name}.props.json`), "utf8"));
  const template = await readFile(join(dir, `${name}.source`), "utf8");
  const audioStart = ["lower-third", "stat-card", "blocked-moment"].includes(name) ? 0.5 : 0;
  const captionMarkup = `<div id="${name}-captions" data-track-kind="captions">${(props.captions ?? []).map((caption, index) => `<div id="${name}-caption-${index}" class="caption clip" data-start="${Number((caption.start + audioStart).toFixed(3))}" data-duration="${Math.max(0.01, caption.end - caption.start)}">${caption.text}</div>`).join("")}</div>`;
  const duration = props.duration ?? (name === "daily-ending" ? 3 : 4);
  const sfx = name === "day-intro" ? "title-reveal" : name === "stat-card" ? "stat-number" : name === "blocked-moment" ? "blocked-tag" : "";
  const sfxDuration = name === "day-intro" ? 0.65 : name === "stat-card" ? 0.32 : 0.55;
  const sfxMarkup = sfx ? `<audio id="${name}-sfx" class="clip" data-start="${name === "day-intro" ? 0.35 : name === "stat-card" ? 0.6 : 1.55}" data-hf-media-start-basis="local" data-duration="${sfxDuration}" data-track-index="12" src="assets/audio/${sfx}.wav" data-volume="0.26" data-fade-in="0.02" data-fade-out="0.18"></audio>` : "";
  const narrationMarkup = props.narration ? `<audio id="${name}-narration" class="clip" data-start="${audioStart}" data-hf-media-start-basis="local" data-duration="${duration}" data-track-index="10" src="assets/audio/${name}-narration.wav" data-volume="1" data-fade-in="0.08" data-fade-out="0.8"></audio>` : "";
  const localBed = name === "final-outro" ? `<audio id="${name}-bed" class="clip" data-start="0" data-duration="${duration}" data-track-index="11" src="assets/audio/ambient-bed.wav" data-volume="0.1" data-fade-in="0.4" data-fade-out="1.5"></audio>` : "";
  const audioMarkup = `${narrationMarkup}${localBed}${sfxMarkup}`;
  const html = template.replace("__THEME__", theme).replace("__AUDIO__", audioMarkup).replace("__CAPTIONS__", captionMarkup).replace("__PROPS__", JSON.stringify(props));
  await writeFile(join(dir, `${name}.html`), html);
}
