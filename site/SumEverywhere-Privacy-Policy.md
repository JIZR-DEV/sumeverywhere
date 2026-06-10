# SumEverywhere — Privacy Policy / Política de Privacidad

**Last updated / Última actualización: 2026-06-10**

---

## English

**SumEverywhere does not collect, transmit, sell, or share any personal data or page content. Ever.**

SumEverywhere is a browser extension that summarizes the page you are currently reading. It is built around a single principle: **nothing you read leaves your device.**

### What the extension does

- When you click the SumEverywhere button, it reads the text of the **active tab only**, at that moment, to produce a summary.
- Summarization runs **entirely on your device**:
  - If your browser provides Chrome's built-in on-device AI (Gemini Nano), the summary is generated locally by that model.
  - If the on-device model is not available, a built-in **extractive algorithm written in plain JavaScript** generates the summary locally instead.
- In both cases there are **no network requests**: the page content and the resulting summary are never uploaded anywhere.

### What data is stored

The only data SumEverywhere stores is **your own preferences** — preferred engine, default summary length, and default format. These are saved in `browser.storage.local`, which **stays on your device**. You can clear them at any time from the extension's Options page.

SumEverywhere does **not** store your browsing history, the pages you summarize, or the summaries it produces.

### What data is NOT collected

- ❌ No browsing history
- ❌ No page content or text
- ❌ No summaries
- ❌ No personal or identifying information
- ❌ No analytics, telemetry, or tracking
- ❌ No advertising identifiers

### Permissions

SumEverywhere requests the minimum permissions required:

- **activeTab** + **scripting** — to read the text of the current tab **only when you click the summarize button**. It has no standing access to your browsing.
- **storage** — to save your preferences locally.

There are no broad host permissions: the extension cannot read pages in the background or on sites you have not explicitly summarized.

### Donations

SumEverywhere is free. If you choose to support it, the donation links (PayPal, Ko-fi) open in your browser as external pages. No payment information is ever processed inside the extension.

### Third parties

SumEverywhere has **no backend server** and **integrates no third-party analytics or SDKs**. The on-device AI model is part of your browser, not a service operated by us.

### Contact

For any privacy question, open an issue on the project's public repository or contact the developer at the email associated with the store listing.

---

## Español

**SumEverywhere no recopila, transmite, vende ni comparte ningún dato personal ni contenido de páginas. Nunca.**

SumEverywhere es una extensión de navegador que resume la página que estás leyendo. Se basa en un único principio: **nada de lo que lees sale de tu dispositivo.**

### Qué hace la extensión

- Cuando pulsas el botón de SumEverywhere, lee el texto de la **pestaña activa únicamente**, en ese momento, para producir un resumen.
- El resumen se genera **íntegramente en tu dispositivo**:
  - Si tu navegador ofrece la IA on-device integrada de Chrome (Gemini Nano), el resumen lo genera ese modelo localmente.
  - Si el modelo on-device no está disponible, un **algoritmo extractivo escrito en JavaScript puro** genera el resumen en local.
- En ambos casos **no hay ninguna petición de red**: el contenido de la página y el resumen resultante nunca se suben a ningún sitio.

### Qué datos se almacenan

Lo único que SumEverywhere almacena son **tus propias preferencias**: motor preferido, longitud por defecto del resumen y formato por defecto. Se guardan en `browser.storage.local`, que **permanece en tu dispositivo**. Puedes borrarlas cuando quieras desde la página de Opciones de la extensión.

SumEverywhere **no** almacena tu historial de navegación, las páginas que resumes ni los resúmenes que produce.

### Qué datos NO se recopilan

- ❌ Sin historial de navegación
- ❌ Sin contenido ni texto de las páginas
- ❌ Sin resúmenes
- ❌ Sin información personal o identificativa
- ❌ Sin analítica, telemetría ni rastreo
- ❌ Sin identificadores publicitarios

### Permisos

SumEverywhere pide los permisos mínimos necesarios:

- **activeTab** + **scripting** — para leer el texto de la pestaña actual **solo cuando pulsas el botón de resumir**. No tiene acceso permanente a tu navegación.
- **storage** — para guardar tus preferencias en local.

No hay permisos de host amplios: la extensión no puede leer páginas en segundo plano ni en sitios que no hayas resumido explícitamente.

### Donaciones

SumEverywhere es gratis. Si decides apoyarla, los enlaces de donación (PayPal, Ko-fi) se abren en tu navegador como páginas externas. Ninguna información de pago se procesa dentro de la extensión.

### Terceros

SumEverywhere **no tiene servidor backend** y **no integra analítica ni SDKs de terceros**. El modelo de IA on-device forma parte de tu navegador, no es un servicio operado por nosotros.

### Contacto

Para cualquier duda de privacidad, abre una incidencia en el repositorio público del proyecto o contacta con el desarrollador en el correo asociado a la ficha de la tienda.
