// build/zip.mjs — SumEverywhere
// Empaqueta dist/chrome/ -> dist/sumeverywhere-chrome.zip
//          dist/firefox/ -> dist/sumeverywhere-firefox.zip
// Node puro sin dependencias externas. NO usa Compress-Archive de PowerShell.
// Implementa ZIP format (local file headers + central directory + end of central directory).

import fs from "fs";
import path from "path";
import zlib from "zlib";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");

/**
 * Escribe un entero de 16 bits little-endian en un buffer en offset.
 */
function writeUInt16LE(buf, value, offset) {
  buf[offset]   = value & 0xff;
  buf[offset+1] = (value >>> 8) & 0xff;
}

/**
 * Escribe un entero de 32 bits little-endian en un buffer en offset.
 */
function writeUInt32LE(buf, value, offset) {
  buf[offset]   = value & 0xff;
  buf[offset+1] = (value >>> 8) & 0xff;
  buf[offset+2] = (value >>> 16) & 0xff;
  buf[offset+3] = (value >>> 24) & 0xff;
}

/**
 * CRC-32 segun tabla estandar (polinomio 0xEDB88320).
 */
function crc32(buf) {
  const table = crc32.table || (crc32.table = (() => {
    const t = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) c = c & 1 ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[i] = c;
    }
    return t;
  })());
  let crc = 0xffffffff;
  for (const byte of buf) crc = (crc >>> 8) ^ table[(crc ^ byte) & 0xff];
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Recopila todos los archivos en un directorio recursivamente.
 * @param {string} dir - directorio raiz
 * @param {string} [base] - prefijo de ruta dentro del zip
 * @returns {{absPath: string, zipPath: string}[]}
 */
function collectFiles(dir, base = "") {
  const entries = [];
  for (const entry of fs.readdirSync(dir)) {
    const abs = path.join(dir, entry);
    const rel = base ? `${base}/${entry}` : entry;
    const stat = fs.statSync(abs);
    if (stat.isDirectory()) {
      entries.push(...collectFiles(abs, rel));
    } else {
      entries.push({ absPath: abs, zipPath: rel.replace(/\\/g, "/") });
    }
  }
  return entries;
}

/**
 * Crea un archivo ZIP desde un directorio de origen.
 * Usa deflate para archivos de texto; store para PNG/binarios pequenos.
 */
function createZip(srcDir, destFile) {
  const files = collectFiles(srcDir);
  const parts = [];
  const centralDir = [];
  let offset = 0;

  for (const { absPath, zipPath } of files) {
    const raw = fs.readFileSync(absPath);
    const isBinary = /\.(png|jpg|jpeg|gif|woff2?|eot|ttf)$/i.test(zipPath);

    let compressed, method;
    if (isBinary || raw.length < 64) {
      compressed = raw;
      method = 0; // store
    } else {
      compressed = zlib.deflateRawSync(raw, { level: 9 });
      method = 8; // deflate
    }

    const crc    = crc32(raw);
    const nameBuf = Buffer.from(zipPath, "utf8");

    // Local file header (30 bytes) + name + data
    const lfh = Buffer.alloc(30 + nameBuf.length);
    writeUInt32LE(lfh, 0x04034b50, 0);  // signature
    writeUInt16LE(lfh, 20, 4);           // version needed
    writeUInt16LE(lfh, 0x0800, 6);       // flags (UTF-8 name)
    writeUInt16LE(lfh, method, 8);
    writeUInt16LE(lfh, 0, 10);           // mod time
    writeUInt16LE(lfh, 0, 12);           // mod date
    writeUInt32LE(lfh, crc, 14);
    writeUInt32LE(lfh, compressed.length, 18);
    writeUInt32LE(lfh, raw.length, 22);
    writeUInt16LE(lfh, nameBuf.length, 26);
    writeUInt16LE(lfh, 0, 28);           // extra length
    nameBuf.copy(lfh, 30);

    parts.push(lfh, compressed);

    // Central directory entry (46 bytes) + name
    const cde = Buffer.alloc(46 + nameBuf.length);
    writeUInt32LE(cde, 0x02014b50, 0);   // signature
    writeUInt16LE(cde, 20, 4);            // version made by
    writeUInt16LE(cde, 20, 6);            // version needed
    writeUInt16LE(cde, 0x0800, 8);        // flags
    writeUInt16LE(cde, method, 10);
    writeUInt16LE(cde, 0, 12);
    writeUInt16LE(cde, 0, 14);
    writeUInt32LE(cde, crc, 16);
    writeUInt32LE(cde, compressed.length, 20);
    writeUInt32LE(cde, raw.length, 24);
    writeUInt16LE(cde, nameBuf.length, 28);
    writeUInt16LE(cde, 0, 30);            // extra
    writeUInt16LE(cde, 0, 32);            // comment
    writeUInt16LE(cde, 0, 34);            // disk start
    writeUInt16LE(cde, 0, 36);            // int attribs
    writeUInt32LE(cde, 0, 38);            // ext attribs
    writeUInt32LE(cde, offset, 42);       // local header offset
    nameBuf.copy(cde, 46);

    centralDir.push(cde);
    offset += lfh.length + compressed.length;
  }

  const cdBuf = Buffer.concat(centralDir);

  // End of central directory record (22 bytes)
  const eocd = Buffer.alloc(22);
  writeUInt32LE(eocd, 0x06054b50, 0);
  writeUInt16LE(eocd, 0, 4);              // disk number
  writeUInt16LE(eocd, 0, 6);              // start disk
  writeUInt16LE(eocd, centralDir.length, 8);
  writeUInt16LE(eocd, centralDir.length, 10);
  writeUInt32LE(eocd, cdBuf.length, 12);
  writeUInt32LE(eocd, offset, 16);
  writeUInt16LE(eocd, 0, 20);             // comment length

  fs.writeFileSync(destFile, Buffer.concat([...parts, cdBuf, eocd]));
  console.log(`[zip] ${path.basename(destFile)} (${files.length} files)`);
}

for (const browser of ["chrome", "firefox"]) {
  const srcDir = path.join(DIST, browser);
  if (!fs.existsSync(srcDir)) {
    console.error(`[zip] dist/${browser}/ not found — run build.mjs first`);
    continue;
  }
  createZip(srcDir, path.join(DIST, `sumeverywhere-${browser}.zip`));
}

console.log("[zip] Done.");
