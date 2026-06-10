"use strict";
// content-extract.js
// Inyectado on-demand via scripting.executeScript desde popup.js.
// NO declarado en manifest content_scripts (se inyecta por archivo o funcion).
// Extrae texto limpio del articulo principal de la pagina activa.
// Devuelve: {ok: true, text, charCount, title, lang} | {ok: false, reason}
(function () {
  /**
   * Elimina nodos que no aportan contenido editorial.
   */
  function removeNoise(root) {
    const selectors = [
      "nav", "aside", "footer", "header", "form",
      "script", "style", "noscript", "iframe",
      "[role='banner']", "[role='navigation']", "[role='complementary']",
      "[aria-hidden='true']", ".cookie-banner", ".ad", ".advertisement",
      ".sidebar", ".widget", ".comments", "#comments"
    ];
    selectors.forEach((sel) => {
      root.querySelectorAll(sel).forEach((el) => el.remove());
    });
    // Eliminar elementos ocultos por CSS inline
    root.querySelectorAll("[style]").forEach((el) => {
      const s = el.getAttribute("style") || "";
      if (/display\s*:\s*none|visibility\s*:\s*hidden/.test(s)) {
        el.remove();
      }
    });
  }

  /**
   * Heuristica de densidad: devuelve el contenedor con mas texto.
   * Prefiere <article>, luego el elemento con mayor densidad texto/markup.
   */
  function findMainContainer(doc) {
    // Preferencia 1: <article>
    const article = doc.querySelector("article");
    if (article) return article;

    // Preferencia 2: <main>
    const main = doc.querySelector("main");
    if (main) return main;

    // Preferencia 3: elemento con mas texto normalizado entre candidatos comunes
    const candidates = doc.querySelectorAll(
      "div, section, .content, .post, .entry, .article-body, #content, #main"
    );
    let best = doc.body;
    let bestLen = 0;
    candidates.forEach((el) => {
      const len = (el.textContent || "").trim().length;
      if (len > bestLen) {
        bestLen = len;
        best = el;
      }
    });
    return best;
  }

  /**
   * Normaliza whitespace: colapsa espacios multiples y lineas vacias excesivas.
   */
  function normalizeWhitespace(text) {
    return text
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  try {
    // Clonar para no mutar el DOM real
    const clone = document.cloneNode(true);
    removeNoise(clone);

    const container = findMainContainer(clone);
    const rawText = container ? (container.textContent || "") : (clone.body ? clone.body.textContent : "");
    const text = normalizeWhitespace(rawText);

    if (!text || text.length < 100) {
      return { ok: false, reason: "no-text" };
    }

    return {
      ok: true,
      text: text,
      charCount: text.length,
      title: document.title || "",
      lang: document.documentElement.lang || navigator.language || "en"
    };
  } catch (err) {
    return { ok: false, reason: "extraction-error", detail: String(err) };
  }
})();
