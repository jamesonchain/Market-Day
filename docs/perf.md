# Production performance

All measurements below use `next build` followed by `next start`. No development server measurements are included.

## Build result

The production build completed successfully with Next.js 16.4.4 and webpack. The build generated static HTML for the landing, login, about, and record routes. The village route is server rendered and keeps the console map in the initial HTML.

## Production HTTP sample

Measured against a local production server on 2026-11-13. The values are server response timing, not a Lighthouse score.

| Route | Status | First byte | Total | HTML bytes |
| --- | ---: | ---: | ---: | ---: |
| `/` | 200 | 0.735 s | 0.735 s | 14,261 |
| `/village` | 200 | 0.433 s | 0.434 s | 13,678 |
| `/login` | 200 | 0.002 s | 0.002 s | 7,710 |
| `/about` | 200 | 0.002 s | 0.002 s | 9,422 |
| `/record` | 200 | 0.001 s | 0.001 s | 7,569 |

## Before and after structure

| Metric | Before console rebuild | After console rebuild |
| --- | --- | --- |
| Rendering model | Client scene and WebGL fallback | Server rendered HTML and inline SVG map |
| Scene dependency | Three.js scene | No 3D runtime |
| Recurring event transport | Long lived stream | Visible tab polling every 3 seconds with backoff |
| Initial village map | Client scene loading state | Present in the first server response |
| Mobile layout | Floating island layout | Stacked console panels with responsive map |

The old browser timing sample is not comparable because it was collected in a long lived Chrome profile with extensions and background tabs. A clean Lighthouse run against the deployed Vercel URL should be repeated with browser extensions disabled before publishing an external score. This repository does not claim a Lighthouse score without that clean run.

## Performance choices

- The landing hero and village map are server rendered.
- The map uses inline SVG instead of a 3D runtime.
- GSAP and Lenis load only after the landing page is interactive.
- The browser tick and event poller run only while the tab is visible.
- The polling cursor requests events after the last known event id.
- Video is optional and lazy loaded below the fold.
- Reduced motion disables the entrance and scroll animations.
