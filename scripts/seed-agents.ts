import { AGENT_ROLES } from "../lib/near/runtime";
import { createAgentAccount, registerStorage } from "../lib/near/accounts";
async function main() { for (const role of AGENT_ROLES) { const account = await createAgentAccount(role); console.log(`[ ${role} ] ${account.mode} ${account.accountId}`); if (account.mode === "TESTNET TRANSFER") await registerStorage(role); } }
void main().catch((error) => { console.error(error); process.exitCode = 1; });
