# Cinematic video assets

The interactive cinematic prototype looks for these files:

- `day1-ambient.mp4` — looping living-shop background.
- `day1-customer.mp4` — looping close customer-at-counter scene.

Both videos should be muted, mobile-friendly H.264 MP4s and are rendered with `object-fit: cover`.

If either video is absent, the interface falls back to the approved first-person shop artwork so the prototype still loads.

The Day 1 flow is controlled in `src/main.ts`: ambient shop → customer arrives → dialogue → till interaction → sale result → return to ambient shop.
