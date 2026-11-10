import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { KeyPair } from "near-api-js";

function implicitAccountId(publicKey: Uint8Array) {
  if (publicKey.length !== 32) throw new Error("Unexpected ed25519 public key length");
  return Buffer.from(publicKey).toString("hex");
}

async function writeEnv(accountId: string, privateKey: string) {
  const filename = ".env.local";
  const previous = existsSync(filename) ? await readFile(filename, "utf8") : "";
  const lines = previous.split("\n").filter((line) => !line.startsWith("NEAR_PARENT_ACCOUNT_ID=") && !line.startsWith("NEAR_PARENT_PRIVATE_KEY="));
  while (lines.at(-1) === "") lines.pop();
  lines.push(`NEAR_PARENT_ACCOUNT_ID=${accountId}`, `NEAR_PARENT_PRIVATE_KEY=${privateKey}`, "");
  await writeFile(filename, lines.join("\n"), { mode: 0o600 });
}

const keyPair = KeyPair.fromRandom("ed25519");
const publicKey = keyPair.getPublicKey().toString();
const privateKey = keyPair.toString();
const accountId = implicitAccountId(keyPair.getPublicKey().data);
console.log(`NEAR implicit account: ${accountId}`);
console.log(`Public key: ${publicKey}`);
console.log(`Private key: ${privateKey}`);
if (process.argv.includes("--write-env")) {
  await writeEnv(accountId, privateKey);
  console.log("Wrote NEAR_PARENT_ACCOUNT_ID and NEAR_PARENT_PRIVATE_KEY to .env.local");
}
