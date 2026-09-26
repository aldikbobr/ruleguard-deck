#!/usr/bin/env node
// Builds index.html: the RuleGuard pitch deck as one static page for GitHub Pages.
// The slides are the same HTML sections as the Claude Slides artifact (fixed 1920×1080 canvas, inline styles).
//
// Usage:  node build.mjs                 rebuild from src/
//         node build.mjs <project dir>   first copy deck.json + slides/*.html from an exported deck
//                                        (speaker notes are removed), then rebuild
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(here, "src");
const stripNotes = html => html.replace(/\s*<aside>[\s\S]*?<\/aside>/g, "").trim() + "\n";

const from = process.argv[2];
if (from) {
  const deck = JSON.parse(fs.readFileSync(path.join(from, "deck.json"), "utf8"));
  // replace the slides only; src/assets.json (the image map) is kept
  fs.rmSync(path.join(src, "slides"), { recursive: true, force: true });
  fs.mkdirSync(path.join(src, "slides"), { recursive: true });
  fs.writeFileSync(path.join(src, "deck.json"), JSON.stringify({ title: deck.title, order: deck.order, faces: deck.faces }, null, 2) + "\n");
  for (const id of deck.order) {
    fs.writeFileSync(path.join(src, "slides", `${id}.html`), stripNotes(fs.readFileSync(path.join(from, "slides", `${id}.html`), "utf8")));
  }
}

const deck = JSON.parse(fs.readFileSync(path.join(src, "deck.json"), "utf8"));
// Images uploaded to the Slides artifact are referenced as /_blob/<id>; src/assets.json maps them to files in this repo
const assetsFile = path.join(src, "assets.json");
const assets = fs.existsSync(assetsFile) ? JSON.parse(fs.readFileSync(assetsFile, "utf8")) : {};
const localAssets = html => html.replace(/\/_blob\/[0-9a-f]{32}/g, blob => {
  if (!assets[blob]) throw new Error(`No local file for ${blob}: add it to src/assets.json`);
  return assets[blob];
});
const slides = deck.order.map(id => localAssets(stripNotes(fs.readFileSync(path.join(src, "slides", `${id}.html`), "utf8"))));
const fonts = Object.values(deck.faces).map(f => `<link rel="stylesheet" href="${f.href}">`).join("\n");
const icon = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#0E1726"/><path d="M18 34l9 9 19-21" fill="none" stroke="#F08A3C" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>');

const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${deck.title}</title>
<meta name="description" content="RuleGuard: the rule-equivalence layer for prediction markets. Pitch deck for the Colosseum Crypto World's Fair 2026.">
<meta property="og:title" content="${deck.title}">
<meta property="og:description" content="Same title, different contract: RuleGuard checks whether “identical” prediction markets on Kalshi, Polymarket and Limitless settle under the same rules.">
<meta property="og:type" content="website">
<link rel="icon" href="${icon}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
${fonts}
<style>
  html, body { margin: 0; height: 100%; background: #070C16; overflow: hidden; }
  /* The bottom 56px are reserved for the controls, so they never cover a slide's footer */
  #viewport { position: fixed; inset: 0 0 56px 0; display: flex; align-items: center; justify-content: center; }
  #deck { position: relative; flex: none; width: 1920px; height: 1080px; transform-origin: center center; }
  #deck > section { position: absolute; inset: 0; width: 1920px; height: 1080px; box-sizing: border-box; overflow: hidden;
    opacity: 0; visibility: hidden; transition: opacity .25s ease, visibility .25s; }
  #deck > section.active { opacity: 1; visibility: visible; }
  /* Defaults of the slide format */
  #deck h1, #deck h2, #deck h3, #deck p, #deck ul, #deck ol, #deck table { margin: 0; }
  #deck h1 { font-size: 96px; line-height: 1.1; }
  #deck h2 { font-size: 64px; line-height: 1.15; }
  #deck h3 { font-size: 44px; line-height: 1.2; }
  #deck p { font-size: 32px; line-height: 1.4; }
  #deck section div { box-sizing: border-box; min-width: 0; }
  #deck section div:not([style*="display"]) { display: flex; flex-direction: column; }
  #deck ul { padding-left: 1.2em; }
  #deck table { border-collapse: collapse; width: 100%; }
  #deck th, #deck td { padding: .35em .6em; text-align: left; border-bottom: 1px solid rgba(0, 0, 0, .15); }
  #deck th { font-weight: 600; }
  #deck hr { border: none; margin: 0; width: 100%; }
  #deck x-shape { display: block; }
  #deck x-shape[kind="arrow-right"] { clip-path: polygon(0 30%, 60% 30%, 60% 0, 100% 50%, 60% 100%, 60% 70%, 0 70%); }
  /* Controls */
  #bar { position: fixed; left: 50%; bottom: 8px; transform: translateX(-50%); z-index: 10; display: flex; align-items: center; gap: 4px;
    padding: 4px 6px; border-radius: 999px; background: rgba(14, 23, 38, .88); border: 1px solid #2A3A55;
    font: 500 14px 'IBM Plex Mono', 'Courier New', monospace; color: #F4F1EA; }
  #bar button { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; padding: 8px 14px; border-radius: 999px; }
  #bar button:hover, #bar button:focus-visible { background: #2A3A55; outline: none; }
  #count { min-width: 64px; text-align: center; }
  @media print {
    html, body { height: auto; overflow: visible; background: none; }
    #viewport { position: static; display: block; }
    #deck { transform: none !important; width: 1920px; height: auto; }
    #deck > section { position: relative; opacity: 1; visibility: visible; break-after: page; }
    #bar { display: none; }
    @page { size: 1920px 1080px; margin: 0; }
  }
</style>
<noscript><style>html, body { overflow: auto; } #viewport { position: static; display: block; } #deck { height: auto; }
  #deck > section { position: relative; opacity: 1; visibility: visible; } #bar { display: none; }</style></noscript>
</head>
<body>
<main id="viewport" aria-label="${deck.title}">
<div id="deck">
${slides.join("")}</div>
</main>
<nav id="bar" aria-label="Slide navigation">
  <button id="prev" aria-label="Previous slide">←</button>
  <span id="count" aria-live="polite"></span>
  <button id="next" aria-label="Next slide">→</button>
  <button id="print" title="Save all slides as PDF">PDF</button>
</nav>
<script>
  const deck = document.getElementById("deck");
  const slides = [...deck.children];
  const count = document.getElementById("count");
  let current = 0;
  const fit = () => {
    const scale = Math.min(innerWidth / 1920, (innerHeight - 56) / 1080);
    deck.style.transform = "scale(" + (scale > 0 ? scale : 1) + ")";
  };
  function go(n) {
    current = Math.max(0, Math.min(slides.length - 1, n));
    slides.forEach((s, k) => { s.classList.toggle("active", k === current); s.setAttribute("aria-hidden", k !== current); });
    count.textContent = (current + 1) + " / " + slides.length;
    history.replaceState(null, "", "#" + (current + 1));
  }
  const fromHash = () => (parseInt(location.hash.slice(1), 10) || 1) - 1;
  addEventListener("resize", fit);
  addEventListener("hashchange", () => go(fromHash()));
  addEventListener("keydown", e => {
    if (["ArrowRight", "PageDown", " "].includes(e.key)) { e.preventDefault(); go(current + 1); }
    if (["ArrowLeft", "PageUp"].includes(e.key)) { e.preventDefault(); go(current - 1); }
    if (e.key === "Home") go(0);
    if (e.key === "End") go(slides.length - 1);
  });
  deck.addEventListener("click", e => { if (!e.target.closest("a")) go(current + (e.clientX > innerWidth / 2 ? 1 : -1)); });
  let touchX = null;
  addEventListener("touchstart", e => { touchX = e.touches[0].clientX; }, { passive: true });
  addEventListener("touchend", e => { if (touchX === null) return; const dx = e.changedTouches[0].clientX - touchX; if (Math.abs(dx) > 40) go(current + (dx < 0 ? 1 : -1)); touchX = null; });
  document.getElementById("prev").onclick = () => go(current - 1);
  document.getElementById("next").onclick = () => go(current + 1);
  document.getElementById("print").onclick = () => print();
  fit();
  go(fromHash());
</script>
</body>
</html>
`;
fs.writeFileSync(path.join(here, "index.html"), page);
console.log(`index.html: ${slides.length} slides, ${(page.length / 1024).toFixed(0)} KB`);
