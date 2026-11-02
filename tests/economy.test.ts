import { describe, expect, it } from "vitest";
import { runTick } from "../lib/economy/store";
describe("village economy", () => { it("runs a typed tick and settles through the adapter", async () => { const result = await runTick(); expect(result.tick).toBeGreaterThan(0); expect(result.events.some((entry) => entry.type === "settled")).toBe(true); expect(result.events.every((entry) => entry.label)).toBe(true); }); });
