// build/build.mjs — SumEverywhere
// Genera dos carpetas de distribución:
//   dist/chrome/  — con manifest de Chrome (manifest.json)
//   dist/firefox/ — con manifest de Firefox (manifest.json)
// Todo el código fuente viene de src/; los manifests vienen de manifests/.
// Node puro, sin dependencias. Usa forward slashes.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT  = path.resolve(__dirname, "..");
const SRC   = path.join(ROOT, "src");
const DIST  = path.join(ROOT, "dist");

// Archivos fuente que se copian igual para ambos navegadores
const SRC_FILES = [
  "background.js",
  "content-extract.js",
  "summarizer-nano.js",
  "summarizer-fallback.js",
  "popup.html",
  "popup.js",
  "popup.css",
  "options.html",
  "options.js",
  "welcome.html",
  "donate.html",
  "donate.css",
  "privacy.html",
  "browser-polyfill.js",
  "i18n.js",
];

const ICON_FILES = ["icons/16.png", "icons/48.png", "icons/128.png"];

const LOCALE_LANGS = ["en", "es", "pt", "fr", "de", "it"];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyFile(src, dest) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function buildTarget(browser) {
  const outDir = path.join(DIST, browser);
  ensureDir(outDir);

  // 1. Copiar archivos src
  for (const f of SRC_FILES) {
    copyFile(path.join(SRC, f), path.join(outDir, f));
  }

  // 2. Copiar iconos
  for (const f of ICON_FILES) {
    copyFile(path.join(SRC, f), path.join(outDir, f));
  }

  // 3. Copiar _locales
  for (const lang of LOCALE_LANGS) {
    const msgSrc  = path.join(SRC, "_locales", lang, "messages.json");
    const msgDest = path.join(outDir, "_locales", lang, "messages.json");
    copyFile(msgSrc, msgDest);
  }

  // 4. Copiar manifest del navegador como manifest.json
  const manifestSrc = path.join(ROOT, "manifests", `${browser}.json`);
  copyFile(manifestSrc, path.join(outDir, "manifest.json"));

  console.log(`[build] dist/${browser}/ OK`);
}

// Limpiar dist
if (fs.existsSync(DIST)) {
  fs.rmSync(DIST, { recursive: true, force: true });
}

buildTarget("chrome");
buildTarget("firefox");

console.log("[build] Done. Load unpacked from dist/chrome/ or dist/firefox/");
