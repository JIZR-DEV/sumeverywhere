// build/source-zip.mjs — genera dist/source.zip
// Incluye todo el proyecto excepto: node_modules, .git, dist
// Requerido por AMO cuando hay un paso de build.

import fs from "fs";
import path from "path";
import zlib from "zlib";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");

const EXCLUDE = new Set(["node_modules", ".git", "dist"]);

function writeUInt16LE(buf, v, o) { buf[o] = v & 0xff; buf[o+1] = (v >>> 8) & 0xff; }
function writeUInt32LE(buf, v, o) {
  buf[o] = v & 0xff; buf[o+1] = (v >>> 8) & 0xff;
  buf[o+2] = (v >>> 16) & 0xff; buf[o+3] = (v >>> 24) & 0xff;
}
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

function collectFiles(dir, base = "") {
  const entries = [];
  for (const entry of fs.readdirSync(dir)) {
    if (EXCLUDE.has(entry)) continue;
    const abs = path.join(dir, entry);
    const rel = base ? `${base}/${entry}` : entry;
    if (fs.statSync(abs).isDirectory()) {
      entries.push(...collectFiles(abs, rel));
    } else {
      entries.push({ absPath: abs, zipPath: rel.replace(/\\/g, "/") });
    }
  }
  return entries;
}

function createZip(srcDir, destFile) {
  const files = collectFiles(srcDir);
  const parts = [], centralDir = [];
  let offset = 0;

  for (const { absPath, zipPath } of files) {
    const raw = fs.readFileSync(absPath);
    const isBinary = /\.(png|jpg|jpeg|gif|woff2?|eot|ttf)$/i.test(zipPath);
    let compressed, method;
    if (isBinary || raw.length < 64) { compressed = raw; method = 0; }
    else { compressed = zlib.deflateRawSync(raw, { level: 9 }); method = 8; }

    const crc = crc32(raw);
    const nameBuf = Buffer.from(zipPath, "utf8");

    const lfh = Buffer.alloc(30 + nameBuf.length);
    writeUInt32LE(lfh, 0x04034b50, 0);
    writeUInt16LE(lfh, 20, 4);
    writeUInt16LE(lfh, 0x0800, 6);
    writeUInt16LE(lfh, method, 8);
    writeUInt16LE(lfh, 0, 10);
    writeUInt16LE(lfh, 0, 12);
    writeUInt32LE(lfh, crc, 14);
    writeUInt32LE(lfh, compressed.length, 18);
    writeUInt32LE(lfh, raw.length, 22);
    writeUInt16LE(lfh, nameBuf.length, 26);
    writeUInt16LE(lfh, 0, 28);
    nameBuf.copy(lfh, 30);
    parts.push(lfh, compressed);

    const cde = Buffer.alloc(46 + nameBuf.length);
    writeUInt32LE(cde, 0x02014b50, 0);
    writeUInt16LE(cde, 20, 4);
    writeUInt16LE(cde, 20, 6);
    writeUInt16LE(cde, 0x0800, 8);
    writeUInt16LE(cde, method, 10);
    writeUInt16LE(cde, 0, 12);
    writeUInt16LE(cde, 0, 14);
    writeUInt32LE(cde, crc, 16);
    writeUInt32LE(cde, compressed.length, 20);
    writeUInt32LE(cde, raw.length, 24);
    writeUInt16LE(cde, nameBuf.length, 28);
    writeUInt16LE(cde, 0, 30);
    writeUInt16LE(cde, 0, 32);
    writeUInt16LE(cde, 0, 34);
    writeUInt16LE(cde, 0, 36);
    writeUInt32LE(cde, 0, 38);
    writeUInt32LE(cde, offset, 42);
    nameBuf.copy(cde, 46);
    centralDir.push(cde);
    offset += lfh.length + compressed.length;
  }

  const cdBuf = Buffer.concat(centralDir);
  const eocd = Buffer.alloc(22);
  writeUInt32LE(eocd, 0x06054b50, 0);
  writeUInt16LE(eocd, 0, 4);
  writeUInt16LE(eocd, 0, 6);
  writeUInt16LE(eocd, centralDir.length, 8);
  writeUInt16LE(eocd, centralDir.length, 10);
  writeUInt32LE(eocd, cdBuf.length, 12);
  writeUInt32LE(eocd, offset, 16);
  writeUInt16LE(eocd, 0, 20);

  fs.writeFileSync(destFile, Buffer.concat([...parts, cdBuf, eocd]));
  console.log(`[zip] source.zip (${files.length} files, excluye node_modules/.git/dist)`);
}

fs.mkdirSync(DIST, { recursive: true });
createZip(ROOT, path.join(DIST, "source.zip"));
console.log("[zip] Done.");
