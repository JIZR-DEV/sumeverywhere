"use strict";
// options.js — SumEverywhere
// Carga/guarda preferencias en storage.local. Muestra estadisticas locales.
// Cero red. Todos los textos via data-i18n (i18n.js) o window.extI18n.t().

document.addEventListener("DOMContentLoaded", async () => {
  const engineSelect  = document.getElementById("engine-select");
  const lengthSelect  = document.getElementById("length-select");
  const formatSelect  = document.getElementById("format-select");
  const clearBtn      = document.getElementById("clear-btn");
  const clearedMsg    = document.getElementById("cleared-msg");
  const statNano      = document.getElementById("stat-nano");
  const statFallback  = document.getElementById("stat-fallback");

  // ── Cargar preferencias ───────────────────────────────────────────────────
  try {
    const prefs = await browser.storage.local.get([
      "preferredEngine", "defaultLength", "defaultFormat",
      "statNano", "statFallback"
    ]);

    if (engineSelect && prefs.preferredEngine) {
      engineSelect.value = prefs.preferredEngine;
    }
    if (lengthSelect && prefs.defaultLength) {
      lengthSelect.value = prefs.defaultLength;
    }
    if (formatSelect && prefs.defaultFormat) {
      formatSelect.value = prefs.defaultFormat;
    }
    if (statNano)    statNano.textContent    = String(prefs.statNano    || 0);
    if (statFallback) statFallback.textContent = String(prefs.statFallback || 0);
  } catch (_) {
    // storage no disponible
  }

  // ── Guardar al cambiar ────────────────────────────────────────────────────
  async function savePrefs() {
    try {
      await browser.storage.local.set({
        preferredEngine: engineSelect  ? engineSelect.value  : "auto",
        defaultLength:   lengthSelect  ? lengthSelect.value  : "medium",
        defaultFormat:   formatSelect  ? formatSelect.value  : "bullets"
      });
    } catch (_) {}
  }

  if (engineSelect)  engineSelect.addEventListener("change",  savePrefs);
  if (lengthSelect)  lengthSelect.addEventListener("change",  savePrefs);
  if (formatSelect)  formatSelect.addEventListener("change",  savePrefs);

  // ── Borrar datos locales ──────────────────────────────────────────────────
  if (clearBtn) {
    clearBtn.addEventListener("click", async () => {
      try {
        await browser.storage.local.clear();
        // Resetear los selects a defaults
        if (engineSelect)  engineSelect.value  = "auto";
        if (lengthSelect)  lengthSelect.value  = "medium";
        if (formatSelect)  formatSelect.value  = "bullets";
        if (statNano)      statNano.textContent    = "0";
        if (statFallback)  statFallback.textContent = "0";
        if (clearedMsg) {
          clearedMsg.classList.remove("hidden");
          setTimeout(() => clearedMsg.classList.add("hidden"), 2500);
        }
      } catch (_) {}
    });
  }
});
