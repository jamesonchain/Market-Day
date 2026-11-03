# Marketday video notes

## Render contract

HyperFrames renders visual compositions only. The generated `index.html` and every generated file under `compositions/` contain zero audio elements and zero video elements. The build script scans those files and fails if either tag appears. There are no video layers. If a video layer is added later, it must be muted.

The silent render reported `videoCount: 0` and `audioCount: 0`. Visual scene overlap remains enabled, but scenes cannot carry audio.

## Single audio pipeline

`scripts/build-audio.ts` reads `compositions/audio.props.json` and makes one TTS call for the complete narration. It writes one mono narration file, one generated music bed, and one final mixed mono WAV. The music bed has no voice source. The final mix uses a 0.4 second fade in, a 1.5 second fade out, sidechain ducking under the narration, and loudness normalization near -14 LUFS.

The local render used one macOS voice call because Kokoro was not installed. The local HyperFrames Whisper pass supplied word timings for the captions. The captions are stored in the audio props file and mounted once by the root visual composition.

The ending uses the props value `Coming soon.` and keeps the dusk gradient visible for a three second tail. The project name is also stored in the audio props file.

## Verification

The silent HyperFrames render was muxed with `scripts/mux-audio.mjs`. ffprobe verified exactly one AAC audio stream, with video duration 13.050 seconds and audio duration 13.050 seconds. The final audio is mono.

Speech to text was run on the final MP4 audio. All three narration sentences were found exactly once. This is the doubled voice check for the new single-track design.

The old per-scene narration, scene music and scene effects are no longer referenced by any composition. No day labels or relative date words remain in compositions, props, generated HTML or the narration props.
