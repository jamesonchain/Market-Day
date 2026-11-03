# Marketday video notes

## Audio and media inventory

The daily root is `index.html`.

- `#daily-music-bed` is the only root audio element. It runs from frame 0 to the end and uses `assets/audio/ambient-bed.wav`.
- `#day-intro-narration` and `#day-intro-sfx` are in `compositions/day-intro.html`.
- `#lower-third-narration` is in `compositions/lower-third.html`.
- `#stat-card-narration` and `#stat-card-sfx` are in `compositions/stat-card.html`.
- `#blocked-moment-narration` and `#blocked-moment-sfx` are in `compositions/blocked-moment.html`.
- `daily-ending.html` has no audio. It is the three second visual end beat.
- `final-outro.html` is a separate standalone composition with `#final-outro-narration` and `#final-outro-bed`.
- There are no video or screen recording elements. No mute attribute is needed.

The nested daily scenes do not include the root music bed. The root owns one continuous bed. The standalone final outro owns its own bed because it is rendered independently.

## Echo check

The daily narration appears once per scene, with one unique local start time. The daily scene hosts use a 0.5 second visual overlap, but later narration starts after that overlap so speech does not overlap. `scripts/narrate.ts` processes each named props file once and writes one narration WAV per name. It does not process the root or generate a second narration pass.

The narration files are converted to mono with `-ac 1`, which centers the voice. The ambient bed is made by deterministic oscillator code in `scripts/narrate.ts`. It contains no voice recording or speech sample.

For the final render, the first two seconds were compared with copies delayed by 20 ms, 60 ms and 120 ms using an ffmpeg residual mix. Residual RMS levels were -45.77 dB, -44.65 dB and -27.26 dB respectively, with the 120 ms comparison crossing a speech boundary. No doubled voice pattern was found in the residual checks. The final file has exactly one audio stream, with duration 33.200 seconds.

## Mix and transitions

The dusk gradient and cloud layer live at the root and continue through every scene. Each scene fades in and out with a shared upward motion, with about 0.5 seconds of overlap and no blank frame.

The root bed has a 0.4 second fade in and 1.5 second fade out. Automation reduces it to about 9 dB below its base level during speech, with 0.2 second attack and 0.6 second release. Short effects are limited to the title reveal, stat number and blocked tag.

The rendered daily mix measured -14.3 LUFS integrated and -1.7 dBTP input true peak. A verification pass measured -14.1 LUFS output integrated and -1.5 dBTP output true peak. There is no clipping.

## Ending

The daily set ends with a three second visual beat on the dusk gradient. Its end line comes from props and currently reads `Day 2 tomorrow: the first trade.` The day intro narration ends with the same message. `final-outro` remains separate and keeps the repository and live demo URLs.
