import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const tracked = execFileSync("git", ["ls-files"], { encoding: "utf8" });
const secretPattern = /(BEGIN (RSA|OPENSSH|EC) PRIVATE KEY|ed25519:[A-Za-z0-9+/=]{20,}|^(?:NEAR_PARENT_PRIVATE_KEY|NEAR_TREASURY_PRIVATE_KEY|PRIVATE_KEY)=[ \t]*[^\s#${}]+$)/im;
const matches = tracked.split("\n").filter(Boolean).flatMap((file) => {
  if (!existsSync(file)) return [];
  const content = readFileSync(file);
  if (content.includes(0)) return [];
  return secretPattern.test(content.toString("utf8")) ? [file] : [];
});
if (matches.length) {
  console.error(`Private key material found in tracked files: ${matches.join(", ")}`);
  process.exit(1);
}
console.log("Tracked file secret check passed");
