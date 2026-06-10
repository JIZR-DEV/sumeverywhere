# SumEverywhere

Resume cualquier página en local. Usa Gemini Nano (IA on-device) si está disponible y cae a un resumidor extractivo en JS cuando no.

## Estructura

```
sumeverywhere/
  src/                    Código fuente compartido
    _locales/             i18n en 6 idiomas (en/es/pt/fr/de/it)
    icons/                Iconos de marca 16/48/128
    background.js
    content-extract.js    Inyectado on-demand (no en content_scripts)
    summarizer-nano.js    Wrapper Summarizer API (Gemini Nano)
    summarizer-fallback.js Algoritmo extractivo TextRank local
    popup.html / popup.js / popup.css
    options.html / options.js
    welcome.html
    privacy.html
    donate.html / donate.css
    browser-polyfill.js   webextension-polyfill (no minificado, para AMO)
    i18n.js               Motor DOM i18n
  manifests/
    chrome.json           Manifest para Chrome (MV3)
    firefox.json          Manifest para Firefox (MV3)
  build/
    build.mjs             Genera dist/chrome/ y dist/firefox/
    zip.mjs               Empaqueta dist/*.zip sin dependencias
```

## Convención de manifests

Los manifests viven en `manifests/chrome.json` y `manifests/firefox.json`. El script `build/build.mjs` los copia como `manifest.json` en `dist/chrome/` y `dist/firefox/` respectivamente. No existe un `manifest.json` en `src/` porque el código fuente es browser-agnostic.

## Build

```bash
npm run build    # genera dist/chrome/ y dist/firefox/
npm run zip      # genera dist/sumeverywhere-chrome.zip y dist/sumeverywhere-firefox.zip
npm run dist     # build + zip en un paso
```

## Carga sin empaquetar

**Chrome (versión 138+):**
1. `chrome://extensions` -> activar *Developer mode*
2. *Load unpacked* -> seleccionar `dist/chrome/`

**Firefox (versión 140+):**
1. `about:debugging#/runtime/this-firefox`
2. *Load Temporary Add-on* -> seleccionar `dist/firefox/manifest.json`

## Motores de resumen

| Motor | Disponibilidad | Descripcion |
|-------|---------------|-------------|
| Gemini Nano | Chrome 138+ con modelo descargado | IA on-device, calidad alta |
| Extractivo JS | Todos los navegadores | TextRank por frecuencia, cero red |

La detección es automática (`Summarizer.availability()`). El popup indica qué motor se usó mediante el badge coloreado (violeta = Nano, azul = extractivo).

## i18n

6 idiomas con paridad total de claves: en, es, pt, fr, de, it.
Las traducciones se cargan vía el sistema estándar `_locales/` de WebExtensions.
`i18n.js` traduce el DOM con atributos `data-i18n*`; los strings dinámicos usan `window.extI18n.t("clave")`.

## Privacidad

Cero red. Ni el contenido de la página ni los resúmenes salen del dispositivo. Sin `host_permissions` amplios (solo `activeTab` bajo gesto del usuario). Los datos de preferencias se guardan en `browser.storage.local` y se pueden borrar desde Options.

## Iconos

Los iconos de `src/icons/` (16/48/128) representan la metáfora de resumen — líneas que se condensan de larga a corta, con una chispa de IA on-device — sobre el degradado de marca azul→índigo→violeta. Fuente vectorial en `assets/icon-src.html`; para regenerarlos, sirve el proyecto con `node build/screenshot-server.mjs` y captura `assets/icon-src.html` a 16/48/128 con Playwright.

## Capturas de tienda

Las 5 capturas 1280×800 están en `assets/screenshots/` (mockups HTML en `assets/screenshot-src/`, datos `@example` sin marcas ni PII): resumen con IA on-device, fallback extractivo, barra de progreso de descarga, opciones y comparativa artículo→resumen.
