import type { EconomyEvent } from "./types";

export const storyPlaybackStorageKey = "marketday:story-playback";

export type StoryPlaybackState = {
  runId: string;
  resetCursor: string;
  eventIds: string[];
  events: EconomyEvent[];
  revealedCount: number;
};

export function createRunId(now = Date.now()) { return `story-${now}-${Math.random().toString(36).slice(2, 10)}`; }
export function createResetState(resetCursor = new Date().toISOString()): StoryPlaybackState { return { runId: "", resetCursor, eventIds: [], events: [], revealedCount: 0 }; }
export function createRunState(runId: string, resetCursor: string, events: EconomyEvent[]): StoryPlaybackState { return { runId, resetCursor, eventIds: events.map((event) => event.id), events, revealedCount: 0 }; }
export function revealNext(state: StoryPlaybackState, event: EconomyEvent): StoryPlaybackState { if (!state.runId || !state.eventIds.includes(event.id) || state.events.slice(0, state.revealedCount).some((current) => current.id === event.id)) return state; return { ...state, revealedCount: Math.min(state.events.length, state.revealedCount + 1) }; }
export function visibleEvents(state: StoryPlaybackState): EconomyEvent[] { return state.runId ? state.events.slice(0, state.revealedCount) : []; }
export function eventsForRun(events: EconomyEvent[], state: StoryPlaybackState): EconomyEvent[] { if (!state.runId) return []; const allowed = new Set(state.eventIds); return events.filter((event) => allowed.has(event.id) && event.at >= state.resetCursor); }
export function readStoryPlayback(): StoryPlaybackState { if (typeof window === "undefined") return createResetState(); try { const raw = window.sessionStorage.getItem(storyPlaybackStorageKey); if (!raw) return createResetState(); const parsed = JSON.parse(raw) as StoryPlaybackState; if (!parsed || typeof parsed.resetCursor !== "string" || !Array.isArray(parsed.events) || !Array.isArray(parsed.eventIds)) return createResetState(); return { runId: typeof parsed.runId === "string" ? parsed.runId : "", resetCursor: parsed.resetCursor, eventIds: parsed.eventIds, events: parsed.events, revealedCount: Math.min(parsed.events.length, Math.max(0, parsed.revealedCount ?? 0)) }; } catch { return createResetState(); } }
export function writeStoryPlayback(state: StoryPlaybackState) { if (typeof window !== "undefined") window.sessionStorage.setItem(storyPlaybackStorageKey, JSON.stringify(state)); }
