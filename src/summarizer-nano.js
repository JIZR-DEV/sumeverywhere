"use strict";
// summarizer-nano.js
// Wrapper para la Summarizer API on-device de Chrome (Gemini Nano).
// La API es feature de runtime: no requiere permiso en manifest.
// Solo se importa/llama desde popup.js si 'Summarizer' in self.

/**
 * Comprueba la disponibilidad del modelo.
 * @returns {Promise<'available'|'downloadable'|'downloading'|'unavailable'|'unsupported'>}
 */
async function nanoAvailability() {
  if (typeof Summarizer === "undefined" || !Summarizer.availability) {
    return "unsupported";
  }
  try {
    return await Summarizer.availability();
  } catch {
    return "unsupported";
  }
}

/**
 * Genera un resumen usando Gemini Nano con opcion de progreso de descarga.
 * @param {string} text - Texto limpio a resumir.
 * @param {object} opts
 * @param {string} opts.length - 'short'|'medium'|'long'
 * @param {string} opts.format - 'plain-text'|'markdown'
 * @param {function} [opts.onDownloadProgress] - callback({loaded, total})
 * @returns {Promise<{ok: true, summary: string, engine: 'nano'} | {ok: false, reason: string}>}
 */
async function summarizeWithNano(text, opts = {}) {
  const lengthMap = { short: "short", medium: "medium", long: "long" };
  const formatMap = { paragraph: "plain-text", bullets: "markdown", "key-points": "markdown" };

  const summarizerLength = lengthMap[opts.length] || "medium";
  const summarizerFormat = formatMap[opts.format] || "plain-text";

  try {
    const availability = await nanoAvailability();

    if (availability === "unsupported") {
      return { ok: false, reason: "unsupported" };
    }

    if (availability === "unavailable") {
      return { ok: false, reason: "unavailable" };
    }

    const summarizerOptions = {
      sharedContext: "Summarize the following web page content.",
      type: "key-points",
      length: summarizerLength,
      format: summarizerFormat
    };

    if (availability === "downloadable" || availability === "downloading") {
      // El monitor es una propiedad de las opciones (no un 2.o argumento de create()).
      summarizerOptions.monitor = (m) => {
        if (opts.onDownloadProgress && m) {
          m.addEventListener("downloadprogress", (e) => {
            opts.onDownloadProgress({ loaded: e.loaded, total: e.total });
          });
        }
      };
    }

    const instance = await Summarizer.create(summarizerOptions);
    const result = await instance.summarize(text);
    instance.destroy();
    return { ok: true, summary: result, engine: "nano" };

  } catch (err) {
    return { ok: false, reason: "nano-error", detail: String(err) };
  }
}

// Exportacion para uso desde popup.js (modulo no es necesario: popup.js carga este archivo antes)
window.summarizerNano = { nanoAvailability, summarizeWithNano };
