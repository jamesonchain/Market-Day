# HyperFrames Composition Project

This folder contains deterministic HTML, CSS and GSAP compositions rendered by HyperFrames.

Use the HyperFrames skill and CLI guidance before editing. Every timed element needs a stable id,
class clip, data-start and data-duration. Each composition registers one paused timeline in
window.__timelines. Keep all animation seekable and deterministic. Use local assets with paths
starting at assets/. Run npm run check or the root video:lint script after HTML changes.

The root index.html mounts the daily set. The final-outro composition is separate and is used only
for the submission video. Generated files come from scripts/build-video-props.mjs.
