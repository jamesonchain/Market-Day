import { describe, expect, it } from "vitest";
import { checkSpendingPolicy, defaultPolicies } from "../lib/policy/policy";

describe("spending leash", () => {
  const base = { buyer: "baker" as const, seller: "farmer" as const, item: "flour" as const, amount: 2, unitPrice: 3, spentToday: 0 };
  it("allows a fair offer", () => expect(checkSpendingPolicy(base, defaultPolicies.baker, 3).allowed).toBe(true));
  it("blocks the daily limit", () => expect(checkSpendingPolicy({ ...base, spentToday: 9 }, defaultPolicies.baker, 3).reason).toContain("daily spend"));
  it("blocks the max item price", () => expect(checkSpendingPolicy({ ...base, amount: 1, unitPrice: 6 }, defaultPolicies.baker, 3).reason).toContain("max price"));
  it("blocks an unknown counterparty", () => expect(checkSpendingPolicy({ ...base, seller: "merchant" }, { ...defaultPolicies.baker, allowedCounterparties: [] }, 3).reason).toContain("counterparty"));
  it("blocks a quote above the fair price sanity band", () => expect(checkSpendingPolicy({ ...base, unitPrice: 5 }, defaultPolicies.baker, 3).reason).toContain("above fair price"));
});
