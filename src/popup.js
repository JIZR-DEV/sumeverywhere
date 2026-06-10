"use strict";
// popup.js — orquestador principal de SumEverywhere
// Flujo: extraccion on-demand -> deteccion de motor -> resumen -> renderizado
// Usa browser.* (provisto por browser-polyfill.js). Nunca innerHTML con datos.

document.addEventListener("DOMContentLoaded", async () => {
  // ── Refs DOM ──────────────────────────────────────────────────────────────
  const summarizeBtn   = document.getElementById("summarize-btn");
  const engineStatus   = document.getElementById("engine-status");
  const downloadSec    = document.getElementById("download-section");
  const downloadLabel  = document.getElementById("download-label");
  const downloadProgress = document.getElementById("download-progress");
  const downloadBtn    = document.getElementById("download-btn");
  const resultSection  = document.getElementById("result-section");
  const resultText     = document.getElementById("result-text");
  const engineBadge    = document.getElementById("engine-badge");
  const copyBtn        = document.getElementById("copy-btn");
  const errorMsg       = document.getElementById("error-msg");
  const lengthSelect   = document.getElementById("length-select");
  const formatSelect   = document.getElementById("format-select");
  const optionsLink    = document.getElementById("options-link");
  const privacyLink    = document.getElementById("privacy-link");

  // ── i18n helper ───────────────────────────────────────────────────────────
  const t = (key, subs) => (window.extI18n ? window.extI18n.t(key, subs) : key);

  // ── Helpers UI ────────────────────────────────────────────────────────────
  function showError(msgKey) {
    const msg = t(msgKey) || msgKey;
    errorMsg.textContent = msg;
    errorMsg.classList.remove("hidden");
    resultSection.classList.add("hidden");
  }

  function clearError() {
    errorMsg.textContent = "";
    errorMsg.classList.add("hidden");
  }

  function setEngineStatus(msgKey, cssClass) {
    engineStatus.textContent = t(msgKey) || msgKey;
    engineStatus.className = "engine-status " + (cssClass || "");
    engineStatus.classList.remove("hidden");
  }

  function setBusy(busy) {
    summarizeBtn.disabled = busy;
    const label = summarizeBtn.querySelector("[data-i18n]");
    if (label) {
      label.textContent = busy ? t("popupSummarizing") : t("popupSummarizeBtn");
    }
  }

  function renderResult(summary, engine) {
    // Inserta texto con textContent (nunca innerHTML con datos)
    resultText.textContent = summary;

    // Badge del motor
    engineBadge.textContent = engine === "nano"
      ? t("popupEngineNanoLabel")
      : t("popupEngineFallbackLabel");
    engineBadge.className = "engine-badge " + (engine === "nano" ? "badge-nano" : "badge-fallback");

    resultSection.classList.remove("hidden");
    downloadSec.classList.add("hidden");
    clearError();
  }

  // ── Cargar preferencias guardadas ─────────────────────────────────────────
  try {
    const prefs = await browser.storage.local.get(["preferredEngine", "defaultLength", "defaultFormat"]);
    if (prefs.defaultLength && lengthSelect) {
      lengthSelect.value = prefs.defaultLength;
    }
    if (prefs.defaultFormat && formatSelect) {
      formatSelect.value = prefs.defaultFormat;
    }
  } catch (_) {
    // storage no disponible; continuar con defaults
  }

  // ── Detectar disponibilidad del motor al abrir ─────────────────────────────
  async function checkEngineStatus() {
    if (typeof window.summarizerNano === "undefined") {
      setEngineStatus("engineFallbackActive", "status-warn");
      return;
    }
    const avail = await window.summarizerNano.nanoAvailability();
    switch (avail) {
      case "available":
        setEngineStatus("engineStateAvailable", "status-ok");
        break;
      case "downloadable":
        setEngineStatus("engineStateDownloadable", "status-warn");
        showDownloadPrompt();
        break;
      case "downloading":
        setEngineStatus("engineStateDownloading", "status-warn");
        break;
      case "unavailable":
        setEngineStatus("engineStateUnavailable", "status-warn");
        break;
      default:
        setEngineStatus("engineFallbackActive", "");
    }
  }

  function showDownloadPrompt() {
    downloadSec.classList.remove("hidden");
    downloadBtn.classList.remove("hidden");
    downloadProgress.classList.add("hidden");
  }

  // Boton de descarga del modelo
  downloadBtn.addEventListener("click", async () => {
    downloadBtn.disabled = true;
    downloadLabel.textContent = t("engineStateDownloading");
    downloadProgress.classList.remove("hidden");
    downloadProgress.value = 0;

    try {
      const result = await window.summarizerNano.summarizeWithNano("test", {
        length: "short",
        format: "paragraph",
        onDownloadProgress: ({ loaded, total }) => {
          if (total > 0) {
            downloadProgress.value = Math.round((loaded / total) * 100);
          }
        }
      });
      if (result.ok) {
        setEngineStatus("engineStateAvailable", "status-ok");
        downloadSec.classList.add("hidden");
      } else {
        downloadLabel.textContent = t("downloadFailed");
        downloadBtn.disabled = false;
      }
    } catch {
      downloadLabel.textContent = t("downloadFailed");
      downloadBtn.disabled = false;
    }
  });

  // ── Boton principal: resumir ───────────────────────────────────────────────
  summarizeBtn.addEventListener("click", async () => {
    clearError();
    resultSection.classList.add("hidden");
    setBusy(true);

    const selectedLength = lengthSelect ? lengthSelect.value : "medium";
    const selectedFormat = formatSelect ? formatSelect.value : "bullets";

    try {
      // 1) Inyectar content-extract.js en la pestaña activa
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id) {
        showError("errorGeneric");
        setBusy(false);
        return;
      }

      let extractResult;
      try {
        const results = await browser.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["content-extract.js"]
        });
        extractResult = results && results[0] && results[0].result;
      } catch (injectErr) {
        showError("errorGeneric");
        setBusy(false);
        return;
      }

      if (!extractResult || !extractResult.ok) {
        showError(
          extractResult && extractResult.reason === "no-text"
            ? "errorNoText"
            : "errorGeneric"
        );
        setBusy(false);
        return;
      }

      const { text, title } = extractResult;

      // 2) Elegir motor
      let preferredEngine = "auto";
      try {
        const prefs = await browser.storage.local.get("preferredEngine");
        preferredEngine = prefs.preferredEngine || "auto";
      } catch (_) {}

      let summaryResult = null;

      const useNano = preferredEngine !== "fallback" &&
        typeof window.summarizerNano !== "undefined";

      if (useNano) {
        const avail = await window.summarizerNano.nanoAvailability();
        if (avail === "available" || avail === "downloadable" || avail === "downloading") {
          summaryResult = await window.summarizerNano.summarizeWithNano(text, {
            length: selectedLength,
            format: selectedFormat,
            onDownloadProgress: ({ loaded, total }) => {
              if (total > 0) {
                downloadProgress.value = Math.round((loaded / total) * 100);
                downloadSec.classList.remove("hidden");
                downloadProgress.classList.remove("hidden");
              }
            }
          });
        }
      }

      // 3) Fallback si nano fallo o no esta disponible
      if (!summaryResult || !summaryResult.ok) {
        summaryResult = window.summarizerFallback.summarizeExtractive(text, {
          length: selectedLength,
          format: selectedFormat
        });
      }

      if (!summaryResult || !summaryResult.ok || !summaryResult.summary) {
        showError("errorEmptySummary");
        setBusy(false);
        return;
      }

      // 4) Renderizar
      renderResult(summaryResult.summary, summaryResult.engine);

      // Guardar preferencias de longitud/formato
      try {
        await browser.storage.local.set({
          defaultLength: selectedLength,
          defaultFormat: selectedFormat
        });
      } catch (_) {}

    } catch (err) {
      showError("errorGeneric");
    } finally {
      setBusy(false);
    }
  });

  // ── Copiar resumen ─────────────────────────────────────────────────────────
  copyBtn.addEventListener("click", async () => {
    const text = resultText.textContent;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      const original = copyBtn.textContent;
      copyBtn.textContent = t("summaryCopied") || "Copied!";
      setTimeout(() => { copyBtn.textContent = original; }, 1500);
    } catch {
      // Clipboard no disponible en algunos contextos
    }
  });

  // ── Footer links ──────────────────────────────────────────────────────────
  if (optionsLink) {
    optionsLink.addEventListener("click", (e) => {
      e.preventDefault();
      browser.runtime.openOptionsPage();
    });
  }
  if (privacyLink) {
    privacyLink.addEventListener("click", (e) => {
      e.preventDefault();
      browser.tabs.create({ url: browser.runtime.getURL("privacy.html") });
    });
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  await checkEngineStatus();
});
