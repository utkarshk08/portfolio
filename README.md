# Utkarsh Khandelwal — Portfolio

A responsive portfolio with a procedural Three.js sculpture, GSAP transitions, interactive project studies, and locally hosted fonts. Built as a static site for both existing domains.

Published at https://utkarshkhandelwal.me/. This repository hosts the custom-domain version; the separate github.io repository is maintained independently.

## Run locally

```sh
npm ci
npm run build
npm run dev
```

Open http://127.0.0.1:8767/. The checked-in generated assets can also be served directly without Node.

## Editing

- `src/page.html`: page content and structure. Edit this instead of generated `index.html`.
- `styles.css`: art direction, responsive layouts, and reduced-motion styles.
- `app.js`: transitions, motion controls, accessible dialogs, and navigation.
- `src/scene.js`: procedural 3D sculpture; no external model files.
- `content.js`: project case studies and verified source/live links.
- `exhibits.html`, `exhibits.css`, `exhibits.js`: self-contained interactive concept previews. Expense transactions are invented sample data.
- `personal.css`: portrait and About-section presentation, plus the short-viewport project-card fix.
- `assets/`: fonts, optimized activity images, portrait, résumé, and generated browser bundles.

Run `npm run build` after changes. It assembles `index.html`, bundles Three.js, copies local GSAP files, and fingerprints stylesheet/script URLs so previews pick up revisions.

## Motion and accessibility

Motion respects the system reduced-motion preference and can be paused with the header control. The sculpture pauses when offscreen or hidden and retains a CSS fallback when WebGL is unavailable. Project dialogs use native modal focus handling. CutRoom posters support arrow keys and R to rotate; the expense ledger is keyboard-scrollable.

## Personal-section revision

The About section includes a portrait, a monochrome/colour toggle, and a personal introduction. The portrait retains the original face and setting, is resized, and has metadata removed. The original hero, project presentation, and Beyond the Surface interaction are preserved.

This revision is approved for the custom-domain deployment at https://utkarshkhandelwal.me/.

## Preview validation

Checked in the in-app browser at 320, 390, 768, 1024, and 1440 pixels wide, including project controls, dialog opening/closing, keyboard poster controls, motion-off behavior, and horizontal overflow. Source checks also cover operation without GSAP. A separate Safari/Firefox and real-device pass has not been performed.

## Credits

Original coded visuals. Uses Three.js (MIT), GSAP (standard license), and Syne (SIL Open Font License). License notices for Three.js and Syne are in `assets/licenses/`; GSAP's notice is retained in its distributed scripts. Existing DM Sans and Instrument Serif font assets are preserved.
