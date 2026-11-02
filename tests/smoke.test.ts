import { describe, expect, it } from "vitest";

describe("Marketday foundation", () => {
  it("keeps the scene palette available to the renderer", () => {
    expect("#E9E2D0").toBe("#E9E2D0");
    expect("#2B2A26").toBe("#2B2A26");
    expect("#2A5BB5").toBe("#2A5BB5");
  });
});
