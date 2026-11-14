import { describe, expect, it } from "vitest";
import { createResetState, createRunState, eventsForRun, revealNext, visibleEvents } from "../lib/economy/story-playback";
import type { EconomyEvent } from "../lib/economy/types";

const event = (id: string, at: string, message = id): EconomyEvent => ({ id, tick: 1, at, type: "need", actor: "baker", message, label: "LOCAL RULE" });

describe("story playback safety", () => {
  it("reset clears the visible feed", () => {
    const run = createRunState("run-1", "2026-01-01T00:00:00.000Z", [event("one", "2026-01-01T00:00:01.000Z")]);
    const revealed = revealNext(run, run.events[0]);
    expect(visibleEvents(revealed)).toHaveLength(1);
    expect(visibleEvents(createResetState("2026-01-01T00:00:02.000Z"))).toEqual([]);
  });

  it("ignores stale polling events after reset", () => {
    const reset = createResetState("2026-01-01T00:00:02.000Z");
    expect(eventsForRun([event("old", "2026-01-01T00:00:01.000Z")], reset)).toEqual([]);
  });

  it("renders revealed events in story order", () => {
    const run = createRunState("run-1", "2026-01-01T00:00:00.000Z", [event("one", "2026-01-01T00:00:01.000Z"), event("two", "2026-01-01T00:00:02.000Z")]);
    const first = revealNext(run, run.events[0]);
    const second = revealNext(first, run.events[1]);
    expect(visibleEvents(second).map((item) => item.id)).toEqual(["one", "two"]);
  });

  it("keeps two consecutive runs separate", () => {
    const runOne = createRunState("run-1", "2026-01-01T00:00:00.000Z", [event("one", "2026-01-01T00:00:01.000Z")]);
    const runTwo = createRunState("run-2", "2026-01-01T00:00:02.000Z", [event("two", "2026-01-01T00:00:03.000Z")]);
    expect(eventsForRun([...runOne.events, ...runTwo.events], runTwo).map((item) => item.id)).toEqual(["two"]);
  });
});
