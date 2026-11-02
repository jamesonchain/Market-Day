import { describe, expect, it } from "vitest";
import { createAgentAccount } from "../lib/near/accounts";
import { getSettlementAdapter } from "../lib/near/settlement";

describe("NEAR adapters", () => {
  it("falls back to a clearly labeled demo ledger without credentials", async () => {
    const account = await createAgentAccount("baker");
    const settlement = getSettlementAdapter();
    expect(account.mode).toBe("DEMO LEDGER");
    expect(settlement.mode).toBe("DEMO LEDGER");
  });
});
