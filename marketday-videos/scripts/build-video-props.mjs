import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const names = ["day-intro", "lower-third", "stat-card", "blocked-moment", "outro"];
const theme = await readFile(join(root, "compositions/shared.css"), "utf8");
const landscape = process.env.VIDEO_FORMAT === "landscape";
const width = landscape ? 1920 : 1080;
const height = landscape ? 1080 : 1350;
const indexTemplate = await readFile(join(root, "index.source"), "utf8");
await writeFile(join(root, "index.html"), indexTemplate.replaceAll("__WIDTH__", String(width)).replaceAll("__HEIGHT__", String(height)));

for (const name of names) {
  const dir = join(root, "compositions");
  const props = JSON.parse(await readFile(join(dir, `${name}.props.json`), "utf8"));
  const template = await readFile(join(dir, `${name}.source`), "utf8");
  const html = template.replace("__THEME__", theme).replace("__PROPS__", JSON.stringify(props));
  await writeFile(join(dir, `${name}.html`), html);
}
