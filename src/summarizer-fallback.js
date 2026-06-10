"use strict";
// summarizer-fallback.js
// Resumidor extractivo 100% local en JS. Cero red, cero APIs externas.
// Algoritmo: ranking de frases por frecuencia de terminos (TextRank simplificado).
// Usado cuando Gemini Nano no esta disponible o el navegador es Firefox.

/**
 * Tokeniza texto en palabras significativas (minusculas, sin stopwords).
 * @param {string} text
 * @returns {string[]}
 */
function tokenize(text) {
  // Stopwords basicas multilingue (en/es/fr/de/pt/it)
  const STOP = new Set([
    // EN
    "the","a","an","and","or","but","in","on","at","to","for","of","with","by",
    "from","is","are","was","were","be","been","being","have","has","had","do",
    "does","did","will","would","could","should","may","might","shall","that",
    "this","these","those","it","its","as","if","not","no","so","up","out",
    "about","into","then","than","also","just","more","can","i","we","you","he",
    "she","they","my","our","your","his","her","their","which","who","what",
    "when","where","how","all","any","each","other","such","like","been","over",
    // ES
    "el","la","los","las","un","una","unos","unas","y","e","o","u","pero","si",
    "en","de","del","al","que","se","su","sus","con","por","para","como","una",
    "este","esta","estos","estas","hay","me","te","le","nos","les","lo","fue",
    // PT
    "o","a","os","as","um","uma","uns","umas","do","da","dos","das","ao","aos",
    "na","no","nas","nos","por","para","com","que","se","seu","sua","seus","suas",
    // FR
    "le","la","les","un","des","et","ou","mais","en","de","du","au","aux",
    "par","pour","sur","avec","ce","est","son","sa","ses","que","qui","ne","pas",
    // DE
    "der","die","das","den","dem","des","ein","eine","und","oder","aber","in",
    "an","auf","zu","mit","von","bei","nach","aus","ist","sind","hat","haben",
    // IT
    "il","lo","la","i","gli","le","un","uno","una","e","o","ma","in","di",
    "del","della","dei","degli","delle","al","alla","ai","agli","alle","per",
    "con","su","che","si","non","ha","è","ci"
  ]);

  return text
    .toLowerCase()
    .replace(/[^a-z0-9áéíóúàèìòùâêîôûäëïöüãõñçß\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w));
}

/**
 * Divide texto en frases.
 * @param {string} text
 * @returns {string[]}
 */
function splitSentences(text) {
  // Divide por punto, exclamacion, interrogacion seguidos de espacio y mayuscula
  return text
    .replace(/\n+/g, " ")
    .split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÄËÏÖÜÃÕÑÇ])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);
}

/**
 * Genera un resumen extractivo seleccionando las N frases con mayor puntuacion.
 * @param {string} text - Texto limpio extraido por content-extract.js.
 * @param {object} opts
 * @param {string} [opts.length] - 'short'|'medium'|'long'
 * @param {string} [opts.format] - 'paragraph'|'bullets'|'key-points'
 * @returns {{ok: true, summary: string, engine: 'fallback'}}
 */
function summarizeExtractive(text, opts = {}) {
  try {
    const lengthMap = { short: 3, medium: 5, long: 8 };
    const sentenceCount = lengthMap[opts.length] || 5;

    const sentences = splitSentences(text);
    if (sentences.length === 0) {
      // Fallback extremo: devolver los primeros 500 caracteres
      return {
        ok: true,
        summary: text.slice(0, 500) + (text.length > 500 ? "..." : ""),
        engine: "fallback"
      };
    }

    // Frecuencia de terminos en todo el texto
    const allTokens = tokenize(text);
    const freq = {};
    allTokens.forEach((w) => { freq[w] = (freq[w] || 0) + 1; });
    const maxFreq = Math.max(...Object.values(freq), 1);

    // Puntuar cada frase por suma de frecuencias normalizadas
    const scored = sentences.map((sent, idx) => {
      const words = tokenize(sent);
      if (words.length === 0) return { sent, score: 0, idx };
      const score = words.reduce((sum, w) => sum + (freq[w] || 0) / maxFreq, 0) / words.length;
      return { sent, score, idx };
    });

    // Seleccionar las mejores frases y reordenar por posicion original
    const top = scored
      .slice() // copia para no mutar
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.min(sentenceCount, sentences.length))
      .sort((a, b) => a.idx - b.idx);

    const format = opts.format || "paragraph";
    let summary;
    if (format === "bullets" || format === "key-points") {
      summary = top.map((s) => "• " + s.sent).join("\n");
    } else {
      summary = top.map((s) => s.sent).join(" ");
    }

    return { ok: true, summary, engine: "fallback" };
  } catch (err) {
    return {
      ok: true,
      summary: text.slice(0, 400) + "...",
      engine: "fallback"
    };
  }
}

window.summarizerFallback = { summarizeExtractive };
