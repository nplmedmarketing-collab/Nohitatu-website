# Careers culture photos

Assets for the cinematic hero and the slim culture strip on `Careers.html`.

The hero is a **single photo**: the outdoor “Celebrating 16 Years NOHITATU”
banner shot (`anniversary-16`), filling the viewport with a slow Ken Burns
zoom. The other seven photos sit in a secondary row under “A Day in Nohitatu”,
below the existing day-timeline video — not in the hero.

## Files

| File | Purpose |
| --- | --- |
| `_src/*.png` | Original photos, unmodified. Not loaded by the page. |
| `anniversary-16-lg.webp` / `-sm.webp` | Hero still. `-lg` is the CSS background (first paint) and the live `<img>` on large screens. |
| `*-lg.webp` / `*-sm.webp` | Other culture shots. The strip uses `-sm` by default via `srcset`. |
| `hero-collage-poster.jpg` | Leftover mosaic still from an earlier hero. Not used by the page. |

## Adding a photo

1. Drop the original into `_src/` with a descriptive kebab-case name.
2. Add that name to `PHOTOS` in `_build-careers-collage.mjs` at the repo root.
3. `npm install --no-save sharp && node _build-careers-collage.mjs`
4. Either point the hero `<img>` / CSS background at the new file, or add a
   `<figure>` to `.careers-life-strip`.

## Motion contract

- The hero zoom is pure CSS (`cgKen`, 22s, `alternate` so it never jumps).
- It autoplays for everyone, including under `prefers-reduced-motion`.
- There is no pause control. The animation pauses only when the tab is hidden
  or the Day panel has scrolled over the sticky hero.
- The Day-panel strip is static.
