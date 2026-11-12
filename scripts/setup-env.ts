import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";

const example = await readFile(".env.example", "utf8");
const filename = ".env.local";
const current = existsSync(filename) ? await readFile(filename, "utf8") : "";
const keys = [...example.matchAll(/^([A-Z][A-Z0-9_]*)=/gm)].map((match) => match[1]);
const defaults = new Map([...example.matchAll(/^([A-Z][A-Z0-9_]*)=([^\n]*)$/gm)].map((match) => [match[1], match[2]]));
const values = new Map<string, string>();
for (const line of current.split("\n")) { const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/); if (match) values.set(match[1], match[2]); }
const addedDefaults: string[] = [];
for (const [key, value] of defaults) if (!values.get(key) && value) { values.set(key, value); addedDefaults.push(`${key}=${value}`); }
if (!values.get("CRON_SECRET")) values.set("CRON_SECRET", randomBytes(32).toString("base64url"));
if (!values.get("AUTH_SECRET")) values.set("AUTH_SECRET", randomBytes(32).toString("base64url"));
const lines = current ? current.split("\n") : [];
for (const key of ["CRON_SECRET", "AUTH_SECRET"]) { const index = lines.findIndex((line) => line.startsWith(`${key}=`)); if (index >= 0) lines[index] = `${key}=${values.get(key)}`; else lines.push(`${key}=${values.get(key)}`); }
lines.push(...addedDefaults.filter((line) => !lines.some((existing) => existing.startsWith(`${line.split("=")[0]}=`))));
while (lines.at(-1) === "") lines.pop();
await writeFile(filename, `${lines.join("\n")}\n`, { mode: 0o600 });

const optional = new Map([
  ["GEMINI_API_KEY", "free Gemini calls, with deterministic fallback when absent"], ["GROQ_API_KEY", "free Groq fallback calls"], ["NEAR_AGENT_PRIVATE_KEYS_JSON", "real testnet agent signing, after seed:agents"], ["NEAR_INTENTS_ORIGIN_ASSET", "optional Intents dry quote input asset"], ["NEAR_INTENTS_DESTINATION_ASSET", "optional Intents dry quote output asset"], ["NEAR_INTENTS_REFUND_ADDRESS", "optional Intents dry quote refund address"], ["NEAR_INTENTS_RECIPIENT", "optional Intents dry quote recipient"], ["AUTH_GITHUB_ID", "GitHub observer login"], ["AUTH_GITHUB_SECRET", "GitHub observer login"], ["AUTH_GOOGLE_ID", "Google observer login"], ["AUTH_GOOGLE_SECRET", "Google observer login"], ["SUPABASE_URL", "production persistence"], ["SUPABASE_SERVICE_ROLE_KEY", "production persistence"]
]);
const requiredReal = new Map([["NEAR_PARENT_PRIVATE_KEY", "parent signing for real testnet account creation and funding"], ["NEAR_USDC_CONTRACT_ID", "testnet USDC registration and transfers"]]);
const missing = keys.filter((key) => !values.get(key) && !["CRON_SECRET", "AUTH_SECRET"].includes(key));
console.log("Environment file ready. Generated secrets were written to ignored .env.local and were not printed.");
console.log("Still missing:");
for (const key of missing) console.log(`${optional.has(key) ? "OPTIONAL" : "FIX"} ${key}: ${requiredReal.get(key) ?? optional.get(key) ?? "required for real testnet transfers or the configured feature"}`);
if (!missing.length) console.log("Nothing is missing from the example contract.");
console.log("Optional behavior: guest watch works without OAuth, and local in-memory mode works without Supabase.");
