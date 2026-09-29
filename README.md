# Form & Foundations — Built to Last

A scroll-controlled construction film that becomes the website. One pinned section. Scroll drives `video.currentTime` from empty land to the finished building. After that, the camera pushes into the building and the view settles into the hero. Every step is scroll-controlled and reverses when you scroll back up. The video never plays on its own.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

## How it works

- `CinematicConstruction.jsx` creates **one** master GSAP timeline, scrubbed by **one** ScrollTrigger that pins the viewport:

  ```
  | construction 0→1 | hold | original camera push-in | settle | hero reveal | → normal scrolling
  ```

  The video, the six text blocks, the indicators, the camera move, the hero content and the nav links all run on this one clock, so everything reverses together.
- **The intro is unchanged up to the end of the camera push-in (unit 1.85).** Everything after it is defined in `src/lib/heroTimeline.js` and added to the same master timeline, so there is still one pinned ScrollTrigger and everything reverses together: a short hold, then the first photograph dissolves in over the zoomed building while the camera keeps moving, then the hero content arrives, then photographs 02–05 cross-dissolve with the scroll. The hero (`Hero.jsx`) lives inside the pinned viewport, so when the pin releases the page is already on it and nothing jumps.
- The sections after the hero (`src/components/sections/`) use ordinary, un-pinned ScrollTriggers on their own elements (`src/lib/reveals.js`): clip-reveals for headings, soft fades, images that open from a slight inset and settle 1.05 → 1, and light parallax. These are switched off when the visitor's device asks for reduced motion.
- After the unpin, one more ScrollTrigger adds parallax as the hero scrolls away. It only animates wrapper elements that the master timeline never touches. The nav's solid and light states are handled in `App.jsx`.
- Video seeking runs on `gsap.ticker`. It seeks only once `loadedmetadata` has given a duration, keeps one seek in flight at a time (skips while `video.seeking`, catches up on `seeked`), and pauses on any `play` event.
- No React state changes during scroll. Text and indicator markup is static and memoised; GSAP and small DOM class toggles do all the updates.
- If `public/videos/construction.mp4` is missing or fails to decode, a canvas line-drawing of a building constructs itself from the same progress instead (`src/lib/blueprint.js`).

## Tuning

In `src/components/CinematicConstruction.jsx`:

| Constant          | Default | Effect                                              |
| ----------------- | ------- | --------------------------------------------------- |
| `VH_PER_UNIT`     | `6`     | Viewport heights of scroll per timeline unit         |
| `HOLD` / `CAMERA_DURATION` / `SETTLE` / `REVEAL` | `0.1` / `0.75` / `0.045` / `0.3` | Length of each ending phase, in units |
| `ZOOM_TARGET`     | `{x: .54, y: .5}` | Point the camera pushes toward, in video-frame coordinates |
| `zoomScale()`     | 1.5 / 1.85 / 2.25 | Push-in depth on phone / tablet / desktop     |
| `SCRUB`           | `1.6`   | Seconds of catch-up. Higher = heavier, slower        |
| `FADE`            | `0.035` | Share of the timeline used for each text fade        |
| `STAGES`          | —       | Copy and the progress ranges for each stage          |

To change the video's crop (for example to keep the building in frame on phones), set `--focus` in CSS: `.cinematic__video { --focus: 45% 50%; }`.

## Replacing the video — encode for scrubbing

Scrubbing is only smooth when the video has **frequent keyframes**. A normal export often has one keyframe every few seconds, and then every seek, especially backwards, decodes from the previous keyframe.

The supplied video had 1 keyframe in 240 frames, and each seek took ~215 ms in Chrome. The version in `public/videos/` has been re-encoded with a keyframe every 6 frames, which brings seeks to ~25 ms. The untouched original is in `source-video/`. It is not served.

```bash
ffmpeg -i input.mp4 -an -c:v libx264 -preset slow -crf 21 -g 6 -bf 0 \
  -pix_fmt yuv420p -movflags +faststart public/videos/construction.mp4
```

- `-g 6 -bf 0`: a keyframe every 6 frames, no B-frames. Use `-g 1` for the smoothest scrubbing at a larger file size.
- `-movflags +faststart`: metadata at the front, so `loadedmetadata` fires quickly.
- `-an`: removes audio, which is never played.

## Images and content

All imagery and copy for the site after the film live in one file, `src/data/site.js` (`architecturalImages.hero / about / projects / values / contact`, plus metrics, projects, process and values). Images are local, web-optimised files under `public/images/{hero,about,projects,values,contact}/`, from Unsplash (free for commercial use); each entry records its original `source`. To replace an image, add a new file to the same folder and update its entry.

- Hero photograph 01 loads with the page; 02–05 wait until the visitor is two screens into the film (or six seconds pass), so they never compete with the construction video.
- Images below the hero are lazy-loaded, with fixed dimensions so nothing shifts as they load.
- If an image fails to load, it is hidden and a stone-coloured surface shows instead: never a broken-image icon or stray alt text.

Set `VITE_CONTACT_EMAIL` to the company's enquiry address before deployment; "Start a project" and "Contact our team" then open an email with a suitable subject line.
