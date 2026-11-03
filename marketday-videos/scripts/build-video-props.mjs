import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const names = ["day-intro", "lower-third", "stat-card", "blocked-moment", "final-outro", "daily-ending"];
const theme = await readFile(join(root, "compositions/shared.css"), "utf8");
const audioProps = JSON.parse(await readFile(join(root, "compositions/audio.props.json"), "utf8"));
const indexTemplate = await readFile(join(root, "index.source"), "utf8");
const landscape = process.env.VIDEO_FORMAT === "landscape";
const width = landscape ? 1920 : 1080;
const height = landscape ? 1080 : 1350;
const dailyDuration = Number((audioProps.duration + audioProps.endingTail).toFixed(3));
const endingDuration = 3;
const lowerDuration = 2;
const statDuration = 2;
const blockedDuration = 2;
const introDuration = Math.max(6, Number((dailyDuration - lowerDuration - statDuration - blockedDuration - endingDuration + 2).toFixed(3)));
const lowerStart = Number((introDuration - 0.5).toFixed(3));
const statStart = Number((lowerStart + lowerDuration - 0.5).toFixed(3));
const blockedStart = Number((statStart + statDuration - 0.5).toFixed(3));
const endingStart = Number((blockedStart + blockedDuration - 0.5).toFixed(3));
const captions = `<div id="marketday-captions" data-track-kind="captions">${(audioProps.captions ?? []).map((caption, index) => `<div id="marketday-caption-${index}" class="caption clip" data-start="${caption.start}" data-duration="${Math.max(0.01, caption.end - caption.start)}">${caption.text}</div>`).join("")}</div>`;
const index = indexTemplate
  .replaceAll("__WIDTH__", String(width)).replaceAll("__HEIGHT__", String(height))
  .replaceAll("__CAPTIONS__", captions).replaceAll("__DAILY_DURATION__", String(dailyDuration))
  .replaceAll("__DAY_DURATION__", String(introDuration)).replaceAll("__LOWER_START__", String(lowerStart))
  .replaceAll("__LOWER_DURATION__", String(lowerDuration)).replaceAll("__STAT_START__", String(statStart))
  .replaceAll("__STAT_DURATION__", String(statDuration)).replaceAll("__BLOCKED_START__", String(blockedStart))
  .replaceAll("__BLOCKED_DURATION__", String(blockedDuration)).replaceAll("__ENDING_START__", String(endingStart));
await writeFile(join(root, "index.html"), index);

for (const name of names) {
  const dir = join(root, "compositions");
  const props = JSON.parse(await readFile(join(dir, `${name}.props.json`), "utf8"));
  const template = await readFile(join(dir, `${name}.source`), "utf8");
  const html = template.replace("__THEME__", theme).replace(/^\s*__CAPTIONS__ __AUDIO__\s*$/m, "").replace("__AUDIO__", "").replace("__CAPTIONS__", "").replace("__PROPS__", JSON.stringify(props));
  await writeFile(join(dir, `${name}.html`), html);
}

const files = [join(root, "index.html"), ...names.map(name => join(root, "compositions", `${name}.html`))];
for (const file of files) {
  const html = await readFile(file, "utf8");
  if (/<audio\b|<video\b/i.test(html)) throw new Error(`Media audio element found in ${file}`);
}
console.log(`Visual compositions built for ${dailyDuration.toFixed(3)} seconds with no media audio elements.`);
