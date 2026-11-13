import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
mkdirSync("../public/video", { recursive: true });
const run = (args) => execFileSync("npx", ["--yes", "hyperframes@0.9.7", ...args], { stdio: "inherit" });
run(["check"]);
run(["render", "--composition", "compositions/blueprint-demo.html", "-o", "../public/video/demo.mp4"]);
run(["render", "--composition", "compositions/blueprint-loop.html", "-o", "../public/video/hero-loop.mp4"]);
console.log("Rendered blueprint demo and hero loop.");
