# RuleGuard — Pitch Deck

**The rule-equivalence layer for prediction markets.** Pitch deck for the Colosseum Crypto World's Fair 2026.

**Open the deck:** https://aldikbobr.github.io/ruleguard-deck/

Keys: → / ← (or click the right or left half, or swipe) to move between slides, `#3` in the URL opens slide 3, and the **PDF** button saves every slide via the browser's print dialog.

## Updating

The slides live in `src/slides/*.html`, in the same format as the Claude Slides deck they come from (a fixed 1920×1080 canvas with inline styles). `src/deck.json` sets their order.

```bash
node build.mjs                 # rebuild index.html from src/
node build.mjs <project dir>   # import deck.json + slides/ from an exported deck (speaker notes are removed), then rebuild
```

Images uploaded to the Slides deck appear as `/_blob/<id>`. Map each one to a file in `assets/` in `src/assets.json`, and the build stops if a mapping is missing.

Commit and push `index.html`, `src/` and `assets/`. GitHub Pages serves the `main` branch root.
