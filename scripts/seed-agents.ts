import { AGENT_ROLES } from "../lib/near/runtime";
import { createAgentAccount, registerStorage } from "../lib/near/accounts";
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
async function main() { const keys: Record<string, string> = {}; for (const role of AGENT_ROLES) { const account = await createAgentAccount(role); console.log(`[ ${role} ] ${account.mode} ${account.accountId}`); if (account.privateKey) keys[role] = account.privateKey; if (account.mode === "TESTNET TRANSFER") await registerStorage(role); } if (Object.keys(keys).length) { const filename = ".env.local"; const previous = existsSync(filename) ? await readFile(filename, "utf8") : ""; const lines = previous.split("\n").filter((line) => !line.startsWith("NEAR_AGENT_PRIVATE_KEYS_JSON=")); while (lines.at(-1) === "") lines.pop(); lines.push(`NEAR_AGENT_PRIVATE_KEYS_JSON=${JSON.stringify(keys)}`, ""); await writeFile(filename, lines.join("\n"), { mode: 0o600 }); console.log("Saved agent keys to ignored .env.local"); } }
void main().catch((error) => { console.error(error); process.exitCode = 1; });
