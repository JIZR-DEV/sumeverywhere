# SumEverywhere — Guia de envio a stores (v0.2.0)

Fecha de preparacion: 2026-06-10
El envio final es MANUAL y requiere tus credenciales (y posiblemente 2FA).

---

## Artefactos generados

| Archivo | Uso |
|---------|-----|
| dist/sumeverywhere-chrome.zip | Subir a Chrome Web Store |
| dist/sumeverywhere-firefox.zip | Subir a Mozilla AMO |
| dist/source.zip | Codigo fuente para el revisor de AMO (obligatorio) |

---

## 1. Chrome Web Store

### URL del panel
https://chrome.google.com/webstore/devconsole

### Pasos

1. Inicia sesion con tu cuenta Google de desarrollador.
2. Paga la cuota de registro unica ($5 USD) si no lo has hecho.
3. Haz clic en "New item" (boton azul, esquina superior derecha).
4. Arrastra o selecciona dist/sumeverywhere-chrome.zip.
5. Chrome WebStore leeera el manifest; verifica que detecte version 0.2.0.

### Campos a rellenar

| Campo | Valor sugerido |
|-------|---------------|
| Name | SumEverywhere — Page Summarizer |
| Short description (max 132 chars) | Summarize any page locally with Gemini Nano AI or extractive fallback. Zero network. Works in Chrome 138+. |
| Detailed description | Ver bloque "Descripcion larga" mas abajo |
| Category | Productivity |
| Language | English (principal) |
| Screenshots (minimo 1, 1280x800 o 640x400) | Captura del popup con un resumen activo; captura de Options |
| Small promo tile (440x280) | Opcional pero recomendado |
| Privacy practices | Completar el formulario indicando: no se recopilan datos del usuario; no se transmite contenido de paginas a servidores externos |
| Privacy Policy URL | https://gist.github.com/JIZR-DEV/a33ab844a99ff005087e515dc3e09eb4 |

### Justificacion de permisos (para el formulario "Permissions justification")

- **activeTab**: Necesario para acceder al contenido de la pestana activa solo cuando el usuario hace clic en el icono de la extension. Sin este permiso no se puede extraer texto para resumir.
- **scripting**: Inyecta content-extract.js on-demand en la pestana activa para extraer el texto legible del DOM. No se inyecta en todas las paginas; solo bajo gesto explicito del usuario.
- **storage**: Persiste las preferencias del usuario (idioma, longitud del resumen, historial) en storage.local. Los datos nunca salen del dispositivo.

### Descripcion larga (pegar en el campo Description)

```
SumEverywhere summarizes any web page directly on your device — no server, no API key, no data leaving your browser.

HOW IT WORKS
- On Chrome 138+ with Gemini Nano downloaded: uses the built-in Summarizer API for high-quality AI summaries.
- On all browsers: falls back to a local extractive TextRank algorithm (pure JavaScript, zero network).
The popup shows a colored badge indicating which engine was used (purple = Nano, blue = extractive).

PRIVACY
Zero network requests. Page content and summaries never leave your device. No tracking, no analytics, no telemetry.
Only activeTab permission is used — and only when you click the extension icon.

LANGUAGES
Interface available in English, Spanish, Portuguese, French, German, and Italian.

DONATIONS
This extension is free and open source. If you find it useful, a small donation via Ko-fi or PayPal is appreciated (link in the Options page). No payment processing happens inside the extension.
```

### Notas adicionales para el revisor de Chrome

- No hay código minificado u ofuscado; todos los archivos son JS legible.
- browser-polyfill.js es la version sin minificar de webextension-polyfill 0.12.x.
- No hay host_permissions; el acceso se limita a activeTab bajo gesto del usuario.

---

## 2. Mozilla AMO (addons.mozilla.org)

### URL del panel
https://addons.mozilla.org/developers/

### Pasos

1. Inicia sesion (o crea cuenta) en AMO.
2. Haz clic en "Submit a New Add-on".
3. Selecciona "On this site" (distribucion a traves de AMO) o "On your own" segun tu preferencia.
4. Sube dist/sumeverywhere-firefox.zip.
   AMO validara automaticamente el manifest (versión 0.2.0, gecko.id presente).
5. **OBLIGATORIO — Codigo fuente**: En la siguiente pantalla AMO preguntara
   "Does your add-on use any build tools?". Responde **Yes** y sube dist/source.zip.
   En el campo "Instructions for reviewers" pega el bloque de instrucciones de build
   reproducible que figura mas abajo.

### Campos a rellenar

| Campo | Valor sugerido |
|-------|---------------|
| Name | SumEverywhere — Page Summarizer |
| Summary (max 250 chars) | Summarize any page locally with Gemini Nano AI or extractive JS fallback. Zero network. No data leaves your device. |
| Description | Ver bloque "Descripcion larga" de Chrome (valida para AMO tambien) |
| Categories | Appearance > Other o Productivity |
| Tags | summarizer, ai, privacy, offline, gemini-nano |
| Homepage URL | https://github.com/JIZR-DEV/sumeverywhere |
| Support Email | joseignaciozavalarocha@gmail.com |
| Privacy Policy | https://gist.github.com/JIZR-DEV/a33ab844a99ff005087e515dc3e09eb4 |
| License | ISC |
| Screenshots (minimo 1) | Captura del popup con un resumen; captura de Options |

### Justificacion de permisos para AMO

**activeTab**: El usuario activa explicitamente la extension haciendo clic en el icono.
Solo se accede al DOM de la pestana activa en ese momento; no hay acceso persistente a ninguna URL.

**scripting**: Se usa exclusivamente para inyectar content-extract.js en la pestana activa
cuando el usuario solicita un resumen. El script extrae texto legible del DOM y lo devuelve
al background mediante messaging. No persiste; se inyecta una vez por solicitud.

**storage**: Almacena las preferencias locales del usuario (longitud del resumen, idioma preferido,
historial de resúmenes recientes). Todo en storage.local; nunca se sincroniza a servidores.

### Instrucciones de build reproducible (pegar en "Notes to Reviewer" en AMO)

```
Build environment:
  Node.js 22.x (tested with v22.11.0)
  npm 10.x
  No external bundler (webpack/rollup/vite). Pure Node.js copy + zip.

Steps to reproduce dist/firefox/:
  1. Unzip source.zip to a directory.
  2. npm install          (installs only webextension-polyfill)
  3. node build/build.mjs (copies src/ files + manifests/firefox.json -> dist/firefox/)
  4. The resulting dist/firefox/ is identical to the submitted sumeverywhere-firefox.zip.

Key files:
  build/build.mjs  — copies src/ and manifests/firefox.json into dist/firefox/
  build/zip.mjs    — creates the zip (same algorithm used in submission)
  manifests/firefox.json — Firefox-specific manifest (gecko.id, background.scripts, etc.)
  src/             — all human-readable source files; no transpilation or minification.

browser-polyfill.js is the unminified build of webextension-polyfill@0.12.x
(node_modules/webextension-polyfill/dist/browser-polyfill.js), copied verbatim.
```

### Checklist AMO antes de enviar

- [x] manifest version 0.2.0 en dist/firefox/manifest.json
- [x] browser_specific_settings.gecko.id presente: sumeverywhere@jizr-dev.github.io
- [x] data_collection_permissions.required: ["none"] declarado
- [x] browser-polyfill.js incluido sin minificar
- [x] source.zip preparado (excluye node_modules, .git, dist)
- [x] Instrucciones de build reproducible listas para el revisor
- [x] Privacy Policy URL hosteada: https://gist.github.com/JIZR-DEV/a33ab844a99ff005087e515dc3e09eb4
- [x] Capturas de pantalla preparadas (5 × 1280×800 en assets/screenshots/)
- [x] Iconos definitivos de marca (16/48/128 en src/icons/)
- [x] Repositorio publico: https://github.com/JIZR-DEV/sumeverywhere

---

## 3. Notas generales

### Iconos
Iconos definitivos de marca en src/icons/ (16/48/128): metafora de resumen
(lineas que se condensan) + chispa de IA sobre degradado azul->indigo->violeta.
Fuente vectorial en assets/icon-src.html. Para regenerarlos: servir el proyecto
con `node build/screenshot-server.mjs` y capturar a 16/48/128 con Playwright.

### Privacy Policy
Publicada como gist publico (markdown bilingue EN/ES):
  https://gist.github.com/JIZR-DEV/a33ab844a99ff005087e515dc3e09eb4
Usar esa URL en el campo "Privacy Policy URL" de ambas stores. privacy.html
tambien va empaquetada en la extension (enlace en el popup).

### Donaciones
Los enlaces de donacion (Ko-fi/PayPal) estan en donate.html y en Options.
Esto esta permitido por ambas stores siempre que no se procesen pagos dentro
de la extension (cumplido: los enlaces abren el navegador externo).

### Tiempos de revision estimados (2026)
- Chrome Web Store: 1-3 dias habiles (puede alargarse si hay revision manual).
- AMO: 1-7 dias para revision automatizada; revision humana adicional posible
  para la primera version o si hay cambios de permisos.

---

## 4. Flujo de actualizaciones futuras

1. Edita el codigo en src/.
2. Incrementa version en manifests/chrome.json, manifests/firefox.json y package.json.
3. Actualiza CHANGELOG.md.
4. node build/build.mjs && node build/zip.mjs
5. node build/source-zip.mjs  (nuevo script disponible en build/)
6. Sube los nuevos ZIPs a las respectivas consolas de desarrollador.
