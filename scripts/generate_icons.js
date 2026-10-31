import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function calcCrc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcBody = Buffer.concat([typeBuf, data]);
  const crcVal = calcCrc32(crcBody);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);

  return Buffer.concat([lenBuf, crcBody, crcBuf]);
}

function createPng(width, height, getPixel) {
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y, width, height);
      const pixelOffset = rowOffset + 1 + x * 4;
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData, { level: 9 });
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;  // 8 bits per channel
  ihdrData[9] = 6;  // RGBA
  ihdrData[10] = 0; // Deflate
  ihdrData[11] = 0; // Standard filter
  ihdrData[12] = 0; // No interlace

  return Buffer.concat([
    signature,
    createChunk('IHDR', ihdrData),
    createChunk('IDAT', compressed),
    createChunk('IEND', Buffer.alloc(0))
  ]);
}

// Point in polygon test
function pointInPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1];
    const xj = poly[j][0], yj = poly[j][1];
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// Distance from point to line segment
function distToSegment(px, py, x1, y1, x2, y2) {
  const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
}

// Lightning bolt normalized coordinates (0 to 1)
const boltOuter = [
  [0.55, 0.16],
  [0.34, 0.52],
  [0.48, 0.52],
  [0.42, 0.84],
  [0.68, 0.46],
  [0.52, 0.46],
  [0.60, 0.16]
];

const boltInner = [
  [0.54, 0.22],
  [0.38, 0.50],
  [0.49, 0.50],
  [0.45, 0.78],
  [0.64, 0.48],
  [0.53, 0.48],
  [0.58, 0.22]
];

function renderLogoPixel(x, y, width, height, isTransparentBg = false) {
  const u = x / width;
  const v = y / height;

  const dx = u - 0.5;
  const dy = v - 0.5;
  const distFromCenter = Math.hypot(dx, dy);

  // Background
  let r = 8, g = 13, b = 26, a = 255; // #080D1A
  if (isTransparentBg) {
    if (distFromCenter > 0.48) return [0, 0, 0, 0];
  }

  // Circular circuit border
  const ringDist = Math.abs(distFromCenter - 0.43);
  if (ringDist < 0.015) {
    // Copper ring
    const factor = 1 - (ringDist / 0.015);
    return [
      Math.round(r * (1 - factor) + 245 * factor),
      Math.round(g * (1 - factor) + 158 * factor),
      Math.round(b * (1 - factor) + 11 * factor),
      255
    ];
  }

  // Outer glow aura
  if (distFromCenter < 0.43) {
    // Radial gradient towards center
    const glow = Math.max(0, 1 - distFromCenter / 0.45);
    r = Math.min(255, Math.round(11 + 35 * glow));
    g = Math.min(255, Math.round(19 + 50 * glow));
    b = Math.min(255, Math.round(43 + 80 * glow));
  }

  // Left Busbar line (Copper bar)
  if (v >= 0.48 && v <= 0.54 && u >= 0.12 && u <= 0.44) {
    return [249, 115, 22, 255]; // Copper orange #F97316
  }
  // Right Busbar line
  if (v >= 0.48 && v <= 0.54 && u >= 0.56 && u <= 0.88) {
    return [249, 115, 22, 255]; // Copper orange #F97316
  }

  // Joint bolted connection overlap
  if (v >= 0.44 && v <= 0.58 && u >= 0.44 && u <= 0.56) {
    // Bolted joint core
    r = 217; g = 119; b = 6;
  }

  // Electric arc / energy aura around lightning
  let minBoltDist = 1.0;
  for (let i = 0; i < boltOuter.length; i++) {
    const nextIdx = (i + 1) % boltOuter.length;
    const d = distToSegment(u, v, boltOuter[i][0], boltOuter[i][1], boltOuter[nextIdx][0], boltOuter[nextIdx][1]);
    if (d < minBoltDist) minBoltDist = d;
  }

  if (minBoltDist < 0.06 && !pointInPoly(u, v, boltOuter)) {
    const aura = 1 - (minBoltDist / 0.06);
    r = Math.min(255, Math.round(r + 56 * aura * 1.5));
    g = Math.min(255, Math.round(g + 189 * aura * 1.8));
    b = Math.min(255, Math.round(b + 248 * aura * 2.2));
  }

  // Lightning bolt outer body (Golden amber #FBBF24)
  if (pointInPoly(u, v, boltOuter)) {
    // Check if in inner core
    if (pointInPoly(u, v, boltInner)) {
      return [255, 255, 255, 255]; // Pure electric white core
    }
    return [251, 191, 36, 255]; // Bright golden electric yellow
  }

  return [r, g, b, a];
}

// Generate files
const publicDir = path.join(rootDir, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Generate PWA 192x192 & 512x512
console.log('Generating pwa-192x192.png...');
const png192 = createPng(192, 192, (x, y, w, h) => renderLogoPixel(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), png192);

console.log('Generating pwa-512x512.png...');
const png512 = createPng(512, 512, (x, y, w, h) => renderLogoPixel(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), png512);

console.log('Generating apple-touch-icon.png...');
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), png192);

// 2. Generate crisp SVG vector logo
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <radialGradient id="bgGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#1E293B"/>
      <stop offset="60%" stop-color="#0F172A"/>
      <stop offset="100%" stop-color="#030712"/>
    </radialGradient>
    <linearGradient id="boltGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FEF08A"/>
      <stop offset="40%" stop-color="#FBBF24"/>
      <stop offset="100%" stop-color="#F59E0B"/>
    </linearGradient>
    <linearGradient id="copperGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#EA580C"/>
      <stop offset="50%" stop-color="#F97316"/>
      <stop offset="100%" stop-color="#FB923C"/>
    </linearGradient>
    <filter id="electricGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="10" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <!-- Background circular badge -->
  <rect width="512" height="512" rx="104" fill="url(#bgGrad)" />
  <circle cx="256" cy="256" r="224" fill="none" stroke="#F59E0B" stroke-width="6" stroke-dasharray="14 8" opacity="0.4"/>
  <circle cx="256" cy="256" r="210" fill="none" stroke="#38BDF8" stroke-width="2" opacity="0.3"/>

  <!-- Left Busbar Conductor -->
  <rect x="56" y="240" width="150" height="32" rx="6" fill="url(#copperGrad)" stroke="#B45309" stroke-width="3" />
  <circle cx="96" cy="256" r="6" fill="#030712" />
  <circle cx="156" cy="256" r="6" fill="#030712" />

  <!-- Right Busbar Conductor -->
  <rect x="306" y="240" width="150" height="32" rx="6" fill="url(#copperGrad)" stroke="#B45309" stroke-width="3" />
  <circle cx="356" cy="256" r="6" fill="#030712" />
  <circle cx="416" cy="256" r="6" fill="#030712" />

  <!-- Bolted Joint Plate -->
  <rect x="220" y="224" width="72" height="64" rx="8" fill="#D97706" stroke="#92400E" stroke-width="4" />
  <circle cx="256" cy="238" r="5" fill="#FEF08A" />
  <circle cx="256" cy="274" r="5" fill="#FEF08A" />

  <!-- Electric Lightning Energy Glow -->
  <path d="M 282 86 L 176 268 L 246 268 L 216 426 L 348 238 L 268 238 Z"
        fill="#38BDF8" opacity="0.4" filter="url(#electricGlow)"/>

  <!-- Primary Lightning Bolt -->
  <path d="M 282 86 L 176 268 L 246 268 L 216 426 L 348 238 L 268 238 Z"
        fill="url(#boltGrad)" stroke="#FFFFFF" stroke-width="4" stroke-linejoin="round" />

  <!-- Inner Spark Highlights -->
  <path d="M 276 112 L 196 256 L 248 256 L 230 380 L 324 246 L 268 246 Z"
        fill="#FFFFFF" opacity="0.85"/>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'logo.svg'), svgContent);
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent);
fs.writeFileSync(path.join(publicDir, 'vite.svg'), svgContent);

// 3. Update Android Icons
const resDir = path.join(rootDir, 'android', 'app', 'src', 'main', 'res');
const mipmaps = [
  { dir: 'mipmap-mdpi', size: 48 },
  { dir: 'mipmap-hdpi', size: 72 },
  { dir: 'mipmap-xhdpi', size: 96 },
  { dir: 'mipmap-xxhdpi', size: 144 },
  { dir: 'mipmap-xxxhdpi', size: 192 }
];

console.log('Generating Android mipmap launcher icons...');
for (const m of mipmaps) {
  const targetDir = path.join(resDir, m.dir);
  if (fs.existsSync(targetDir)) {
    const png = createPng(m.size, m.size, (x, y, w, h) => renderLogoPixel(x, y, w, h, false));
    const pngRound = createPng(m.size, m.size, (x, y, w, h) => renderLogoPixel(x, y, w, h, true));
    fs.writeFileSync(path.join(targetDir, 'ic_launcher.png'), png);
    fs.writeFileSync(path.join(targetDir, 'ic_launcher_round.png'), pngRound);
    fs.writeFileSync(path.join(targetDir, 'ic_launcher_foreground.png'), png);
  }
}

// 4. Update Android Splash Screen
console.log('Updating Android splash screen...');
const splashDirs = [
  'drawable',
  'drawable-land-mdpi', 'drawable-land-hdpi', 'drawable-land-xhdpi', 'drawable-land-xxhdpi', 'drawable-land-xxxhdpi',
  'drawable-port-mdpi', 'drawable-port-hdpi', 'drawable-port-xhdpi', 'drawable-port-xxhdpi', 'drawable-port-xxxhdpi'
];

const splashPng = createPng(512, 512, (x, y, w, h) => renderLogoPixel(x, y, w, h, false));
for (const s of splashDirs) {
  const targetDir = path.join(resDir, s);
  if (fs.existsSync(targetDir)) {
    fs.writeFileSync(path.join(targetDir, 'splash.png'), splashPng);
  }
}

// 5. Update Android Vector Adaptive Icon
const androidForegroundVector = `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <!-- Left Busbar Line -->
    <path
        android:fillColor="#F97316"
        android:strokeColor="#EA580C"
        android:strokeWidth="1"
        android:pathData="M 12,50 L 44,50 L 44,58 L 12,58 Z" />
    <!-- Right Busbar Line -->
    <path
        android:fillColor="#F97316"
        android:strokeColor="#EA580C"
        android:strokeWidth="1"
        android:pathData="M 64,50 L 96,50 L 96,58 L 64,58 Z" />
    <!-- Bolted Overlap Joint Core -->
    <path
        android:fillColor="#D97706"
        android:strokeColor="#92400E"
        android:strokeWidth="1.5"
        android:pathData="M 44,46 L 64,46 L 64,62 L 44,62 Z" />
    <!-- Electric Energy Glow -->
    <path
        android:fillColor="#38BDF8"
        android:pathData="M 59,18 L 36,56 L 51,56 L 45,90 L 73,50 L 56,50 Z" />
    <!-- High-Voltage Lightning Bolt -->
    <path
        android:fillColor="#FBBF24"
        android:strokeColor="#FFFFFF"
        android:strokeWidth="1.5"
        android:strokeLineJoin="round"
        android:pathData="M 58,20 L 37,55 L 50,55 L 45,88 L 71,51 L 56,51 Z" />
    <!-- Inner Spark Highlight -->
    <path
        android:fillColor="#FFFFFF"
        android:pathData="M 57,25 L 42,53 L 49,53 L 46,78 L 66,52 L 56,52 Z" />
</vector>`;

fs.writeFileSync(
  path.join(resDir, 'drawable-v24', 'ic_launcher_foreground.xml'),
  androidForegroundVector
);

// 6. Update Android Background Color
const androidBgColorXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#080D1A</color>
</resources>`;

fs.writeFileSync(
  path.join(resDir, 'values', 'ic_launcher_background.xml'),
  androidBgColorXml
);

console.log('✅ All web and Android electric lightning logos generated successfully!');
