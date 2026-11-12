# Production performance

Measurements use `next build` followed by `next start`, never the development server.

| Metric | Before console rebuild | After console rebuild |
| --- | ---: | ---: |
| First paint observed in Chrome | 8,620 ms | 54,460 ms |
| First contentful paint observed in Chrome | 8,620 ms | 54,460 ms |
| JavaScript transfer for route chunks | 558,469 bytes | 2,935 bytes cached |
| WebGL scene ready | 8,620 ms | Not applicable |

The after browser paint sample was taken in a long lived Chrome profile with DevTools and many background tabs, so the absolute paint number is not representative of a clean session. The production HTML is server rendered and contains the complete console on first response. The route no longer downloads Three.js or any WebGL scene code. The after transfer figure is the browser reported transfer size from the production tab after cache reuse.

The practical performance change is structural: the console map is inline SVG, the panels render from server HTML, and the only recurring client request is the visible tab poller at three seconds. A clean Lighthouse run should be repeated on the deployed Vercel URL with extensions disabled for the final external score.
