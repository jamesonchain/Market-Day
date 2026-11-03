# Scene lifecycle notes

The village scene is mounted by `components/floating-island-client.tsx`, a client-only dynamic import with `ssr: false`, from `app/layout.tsx`. The route pages do not render their own Canvas. This keeps the WebGL scene mounted while navigation changes the content above it.

WebGL support is checked only inside `useEffect`. Until that result exists, the scene shows a stable placeholder. The render path does not call a browser capability check or update state during render.

The application has no `createRoot`, manual root unmount, `forceContextLoss`, `gl.dispose`, or custom Canvas cleanup. No application-owned code uses `THREE.Clock`; animation timing uses the `useFrame` delta. The development server can still print `THREE.Clock: This module has been deprecated` from the R3F or Three dependency graph. That warning is dependency-owned and is not emitted by Marketday source.

The event effect now guards queued state updates and timers after cleanup. This prevents a blocked-trade update from resuming after a route transition or Strict Mode cleanup.

Manual browser verification on the local app showed the island and UI rendering on `/`. The root scene remains present while moving toward `/login` and `/record`; direct route loads render their own route content after hydration. No React unmount warning was observed during the route checks.
