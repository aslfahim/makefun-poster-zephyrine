// ZEPHYRINE — a travel poster in the old lithograph manner for a skyport
// chained above a canyon, where the balloons come in to dock at dusk.
// One file paints it: flat cream sky, strata canyon walls, a docking
// mast with chained balloons and gondolas, a small airship on approach,
// and a printed border frame like a plate from an atlas.
import { writeFileSync, mkdirSync } from "node:fs";
import { deflateSync } from "node:zlib";

const ZW = 768;
const ZH = 1024;
const sheet = new Uint8Array(ZW * ZH * 3);

let zr = 555013;
function zrand() {
  zr = (Math.imul(zr, 1103515245) + 12345) & 0x7fffffff;
  return zr / 0x7fffffff;
}
function zc(h) {
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
}
function zmix(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}
function zput(x, y, c, a) {
  x = Math.round(x); y = Math.round(y);
  if (x < 0 || y < 0 || x >= ZW || y >= ZH) return;
  const i = (y * ZW + x) * 3;
  sheet[i] = sheet[i] * (1 - a) + c[0] * a;
  sheet[i + 1] = sheet[i + 1] * (1 - a) + c[1] * a;
  sheet[i + 2] = sheet[i + 2] * (1 - a) + c[2] * a;
}
function zsky(stops) {
  for (let y = 0; y < ZH; y++) {
    let s = 0;
    while (s < stops.length - 2 && y > stops[s + 1][0]) s++;
    const c = zmix(stops[s][1], stops[s + 1][1], Math.min(1, Math.max(0, (y - stops[s][0]) / (stops[s + 1][0] - stops[s][0]))));
    for (let x = 0; x < ZW; x++) {
      const i = (y * ZW + x) * 3;
      sheet[i] = c[0]; sheet[i + 1] = c[1]; sheet[i + 2] = c[2];
    }
  }
}
function zorb(cx, cy, r, c, a) {
  for (let y = Math.floor(cy - r); y <= cy + r; y++) {
    const half = Math.sqrt(Math.max(0, r * r - (y - cy) * (y - cy)));
    for (let x = Math.floor(cx - half); x <= cx + half; x++) zput(x, y, c, a);
  }
}
function zoval(cx, cy, rx, ry, c, a) {
  for (let y = Math.floor(cy - ry); y <= cy + ry; y++) {
    const t = (y - cy) / ry;
    const half = rx * Math.sqrt(Math.max(0, 1 - t * t));
    for (let x = Math.floor(cx - half); x <= cx + half; x++) zput(x, y, c, a);
  }
}
function zsoft(cx, cy, rx, ry, c, a) {
  for (let k = 5; k >= 1; k--) zoval(cx, cy, (rx * k) / 5, (ry * k) / 5, c, a / 3);
}
function zpoly(pts, c, a) {
  let lo = Infinity, hi = -Infinity;
  for (const p of pts) { lo = Math.min(lo, p[1]); hi = Math.max(hi, p[1]); }
  for (let y = Math.floor(lo); y <= hi; y++) {
    const xs = [];
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i], q = pts[(i + 1) % pts.length];
      if ((p[1] <= y && q[1] > y) || (q[1] <= y && p[1] > y)) xs.push(p[0] + ((y - p[1]) / (q[1] - p[1])) * (q[0] - p[0]));
    }
    xs.sort((m, n) => m - n);
    for (let i = 0; i + 1 < xs.length; i += 2)
      for (let x = Math.floor(xs[i]); x <= xs[i + 1]; x++) zput(x, y, c, a);
  }
}
function zline(x0, y0, x1, y1, w, c, a) {
  const d = Math.hypot(x1 - x0, y1 - y0);
  const n = Math.max(1, Math.ceil(d / (w * 0.3)));
  for (let i = 0; i <= n; i++) zorb(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, w / 2, c, a);
}
function zrect(x, y, w, h, c, a) {
  for (let j = Math.floor(y); j < y + h; j++)
    for (let i = Math.floor(x); i < x + w; i++) zput(i, j, c, a);
}

// Stroke letters on a 4x6 grid, set here in a deep red-brown ink.
const ZFONT = {
  A: [[[0, 6], [2, 0], [4, 6]], [[1.1, 4.1], [2.9, 4.1]]],
  B: [[[0, 0], [0, 6]], [[0, 0], [2.6, 0], [3.7, 1], [2.6, 2.1], [0, 2.1]], [[0, 2.1], [2.9, 2.1], [3.9, 3.6], [2.9, 6], [0, 6]]],
  C: [[[4, 1.4], [2.7, 0.1], [0.9, 0.7], [0, 3], [0.9, 5.3], [2.7, 5.9], [4, 4.6]]],
  D: [[[0, 0], [0, 6]], [[0, 0], [2.4, 0], [4, 1.9], [4, 4.1], [2.4, 6], [0, 6]]],
  E: [[[4, 0], [0, 0], [0, 6], [4, 6]], [[0, 3], [3.1, 3]]],
  F: [[[4, 0], [0, 0], [0, 6]], [[0, 3], [3.1, 3]]],
  G: [[[4, 1.4], [2.7, 0.1], [0.9, 0.7], [0, 3], [0.9, 5.3], [2.7, 5.9], [4, 5.9], [4, 3.7], [2.5, 3.7]]],
  H: [[[0, 0], [0, 6]], [[4, 0], [4, 6]], [[0, 3], [4, 3]]],
  I: [[[2, 0], [2, 6]], [[0.6, 0], [3.4, 0]], [[0.6, 6], [3.4, 6]]],
  J: [[[4, 0], [4, 4.5], [3.1, 5.8], [1.3, 6], [0.3, 4.9]]],
  K: [[[0, 0], [0, 6]], [[4, 0], [0.7, 3.1]], [[1.3, 2.5], [4, 6]]],
  L: [[[0, 0], [0, 6], [4, 6]]],
  M: [[[0, 6], [0, 0], [2, 3.4], [4, 0], [4, 6]]],
  N: [[[0, 6], [0, 0], [4, 6], [4, 0]]],
  O: [[[2, 0], [3.6, 0.7], [4, 3], [3.6, 5.3], [2, 6], [0.4, 5.3], [0, 3], [0.4, 0.7], [2, 0]]],
  P: [[[0, 6], [0, 0], [3, 0], [4, 1.1], [3, 2.5], [0, 2.5]]],
  Q: [[[2, 0], [3.6, 0.7], [4, 3], [3.6, 5.3], [2, 6], [0.4, 5.3], [0, 3], [0.4, 0.7], [2, 0]], [[2.7, 4.3], [4.3, 6.3]]],
  R: [[[0, 6], [0, 0], [3, 0], [4, 1.1], [3, 2.5], [0, 2.5]], [[2.1, 2.5], [4, 6]]],
  S: [[[4, 0.9], [2.7, 0], [0.9, 0.6], [0.5, 1.9], [2, 2.9], [3.4, 3.7], [3.6, 5], [2.4, 6], [0.3, 5.3]]],
  T: [[[0, 0], [4, 0]], [[2, 0], [2, 6]]],
  U: [[[0, 0], [0, 4.3], [0.8, 5.6], [2, 6], [3.2, 5.6], [4, 4.3], [4, 0]]],
  V: [[[0, 0], [2, 6], [4, 0]]],
  W: [[[0, 0], [0.8, 6], [2, 2.7], [3.2, 6], [4, 0]]],
  X: [[[0, 0], [4, 6]], [[4, 0], [0, 6]]],
  Y: [[[0, 0], [2, 2.8], [4, 0]], [[2, 2.8], [2, 6]]],
  Z: [[[0, 0], [4, 0], [0, 6], [4, 6]]],
  " ": [],
};
function zname(text, cx, y, size, c, a, track) {
  const s = size / 6;
  const w = Math.max(2.4, size * 0.17);
  let x = cx - (text.length * 5 * s + (text.length - 1) * track * s) / 2;
  for (const ch of text.toUpperCase()) {
    for (const st of ZFONT[ch] || [])
      for (let i = 0; i + 1 < st.length; i++)
        zline(x + st[i][0] * s, y + st[i][1] * s, x + st[i + 1][0] * s, y + st[i + 1][1] * s, w, c, a);
    x += 5 * s + track * s;
  }
}

// ---- The scene: evening at the skyport, above the canyon ----
zsky([
  [0, zc("#f7e7c3")],
  [280, zc("#f3d9a4")],
  [520, zc("#eec08a")],
  [760, zc("#e8a56b")],
  [1024, zc("#d98a52")],
]);

// A pale sun disc, printed flat like an old plate.
zorb(618, 300, 54, zc("#fdf3d0"), 1);
zorb(618, 300, 66, zc("#fdf3d0"), 0.3);

// Canyon strata: stacked bands of red rock stepping down and inward,
// each band with its own ledge line and shadow.
const strata = [
  [560, "#b85c38"], [618, "#a34e30"], [676, "#c06a3e"], [734, "#96452c"],
  [792, "#b85c38"], [850, "#8f3f28"], [908, "#a34e30"], [966, "#7c3823"],
];
for (let i = 0; i < strata.length; i++) {
  const [y, cHex] = strata[i];
  const inset = i * 18;
  zpoly([[0, y], [ZW, y - 14], [ZW, ZH], [0, ZH]], zc(cHex), 1);
  zrect(0, y, ZW, 5, zc("#5d2c1c"), 0.35);
  // ledge shadows and rock ticks
  for (let k = 0; k < 22; k++) {
    const x = zrand() * ZW;
    const yy = y + 12 + zrand() * 34;
    zline(x, yy, x + 14 + zrand() * 30, yy, 2.4, zc("#5d2c1c"), 0.28);
  }
  void inset;
}
// The canyon gap: a darker V where the river of air runs through.
zpoly([[268, 1024], [384, 700], [430, 700], [540, 1024]], zc("#6e2f1e"), 0.55);
zpoly([[330, 1024], [392, 760], [420, 760], [472, 1024]], zc("#f3d9a4"), 0.30);

// The docking mast: a timber tower on the canyon rim, its platform
// ringed with lanterns, balloons chained above it.
const MX = 384, MY = 566;
// tower legs and cross braces
zline(MX - 44, MY + 190, MX - 16, MY, 9, zc("#5d3a24"), 1);
zline(MX + 44, MY + 190, MX + 16, MY, 9, zc("#5d3a24"), 1);
zline(MX - 38, MY + 120, MX + 38, MY + 60, 5, zc("#5d3a24"), 0.9);
zline(MX + 38, MY + 120, MX - 38, MY + 60, 5, zc("#5d3a24"), 0.9);
zline(MX, MY + 196, MX, MY - 6, 6, zc("#4c2f1e"), 1);
// platform
zrect(MX - 108, MY - 12, 216, 13, zc("#6e4630"), 1);
zrect(MX - 108, MY - 12, 216, 4, zc("#8a5a38"), 1);
// tiny dock houses on the platform
zrect(MX - 92, MY - 40, 40, 28, zc("#e8d3ac"), 1);
zpoly([[MX - 96, MY - 40], [MX - 48, MY - 40], [MX - 72, MY - 58]], zc("#96452c"), 1);
zrect(MX - 78, MY - 30, 9, 10, zc("#ffca66"), 1);
zrect(MX + 52, MY - 36, 34, 24, zc("#e0c69c"), 1);
zpoly([[MX + 48, MY - 36], [MX + 90, MY - 36], [MX + 69, MY - 52]], zc("#96452c"), 1);
zrect(MX + 63, MY - 27, 8, 9, zc("#ffca66"), 1);
// lanterns along the platform edge
for (const dx of [-100, -60, -20, 24, 64, 100]) {
  zline(MX + dx, MY - 12, MX + dx, MY - 30, 2.6, zc("#4c2f1e"), 1);
  zsoft(MX + dx, MY - 36, 11, 11, zc("#ffca66"), 0.75);
  zorb(MX + dx, MY - 36, 3.8, zc("#fff3d0"), 1);
}

// A moored balloon: striped envelope, rigging, gondola with passengers'
// lantern, chained to the masthead.
function balloon(cx, cy, r, cA, cB, chainTo) {
  zoval(cx, cy, r, r * 1.12, cA, 1);
  // vertical stripes following the envelope
  for (const f of [-0.62, -0.3, 0.3, 0.62]) {
    zoval(cx + f * r, cy, r * 0.16, r * 1.1, cB, 0.55);
  }
  zoval(cx, cy - r * 0.4, r * 0.7, r * 0.5, zc("#ffffff"), 0.18);
  const gy = cy + r * 1.12;
  zline(cx - r * 0.4, gy - 6, cx - r * 0.2, gy + 16, 2.2, zc("#4c2f1e"), 0.9);
  zline(cx + r * 0.4, gy - 6, cx + r * 0.2, gy + 16, 2.2, zc("#4c2f1e"), 0.9);
  zrect(cx - r * 0.24, gy + 14, r * 0.48, r * 0.34, zc("#6e4630"), 1);
  zorb(cx, gy + 14 + r * 0.17, 3.4, zc("#ffca66"), 1);
  if (chainTo) {
    // the mooring chain, sagging in a catenary-ish curve to the masthead
    const [tx, ty] = chainTo;
    for (let i = 0; i <= 22; i++) {
      const t = i / 22;
      const x = cx + (tx - cx) * t;
      const y = gy + 20 + (ty - (gy + 20)) * t + Math.sin(t * Math.PI) * 22;
      zorb(x, y, 1.8, zc("#4c2f1e"), 0.8);
    }
  }
}
balloon(384, 300, 74, zc("#c1442e"), zc("#e8a33c"), [MX, MY - 44]);
balloon(168, 380, 46, zc("#2e6e6a"), zc("#e8d3ac"), null);
balloon(606, 402, 40, zc("#405a8a"), zc("#e8d3ac"), null);

// An airship on approach from the left, small and neat.
zoval(140, 196, 56, 17, zc("#8a4438"), 1);
zoval(140, 191, 56, 15, zc("#b85c46"), 0.85);
zpoly([[186, 186], [206, 174], [206, 198], [186, 200]], zc("#6e352a"), 1);
zrect(122, 208, 36, 10, zc("#5d4030"), 1);
zrect(132, 210, 6, 5, zc("#ffca66"), 1);
zrect(144, 210, 6, 5, zc("#ffca66"), 1);

// Birds in the warm distance.
for (let i = 0; i < 8; i++) {
  const bx = 60 + zrand() * 640, by = 120 + zrand() * 200, s = 5 + zrand() * 5;
  zline(bx - s, by, bx, by - s * 0.5, 2, zc("#5d3a24"), 0.8);
  zline(bx, by - s * 0.5, bx + s, by, 2, zc("#5d3a24"), 0.8);
}

// The name, top centre, in the poster's red-brown ink with a cream lift.
zname("ZEPHYRINE", ZW / 2 + 3, 68, 76, zc("#f7e7c3"), 0.9, 0.45);
zname("ZEPHYRINE", ZW / 2, 64, 76, zc("#7c2d1e"), 1, 0.45);

// The printed frame: double rule border, dark red-brown, like a plate mark.
function frameRule(inset, w, c) {
  zrect(inset, inset, ZW - inset * 2, w, c, 1);
  zrect(inset, ZH - inset - w, ZW - inset * 2, w, c, 1);
  zrect(inset, inset, w, ZH - inset * 2, c, 1);
  zrect(ZW - inset - w, inset, w, ZH - inset * 2, c, 1);
}
frameRule(18, 5, zc("#7c2d1e"));
frameRule(30, 2, zc("#7c2d1e"));

// ---- PNG: Up-filtered rows, this file's own packing ----
const ZTAB = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  ZTAB[n] = c >>> 0;
}
function zcrc(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = ZTAB[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function zchunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const sum = Buffer.alloc(4);
  sum.writeUInt32BE(zcrc(body));
  return Buffer.concat([len, body, sum]);
}
function zencode() {
  const stride = ZW * 3;
  const raw = Buffer.alloc((stride + 1) * ZH);
  for (let y = 0; y < ZH; y++) {
    const row = y * (stride + 1);
    raw[row] = 2; // Up
    for (let i = 0; i < stride; i++) {
      const up = y > 0 ? sheet[(y - 1) * stride + i] : 0;
      raw[row + 1 + i] = (sheet[y * stride + i] - up) & 0xff;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(ZW, 0);
  ihdr.writeUInt32BE(ZH, 4);
  ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    zchunk("IHDR", ihdr),
    zchunk("IDAT", deflateSync(raw, { level: 9 })),
    zchunk("IEND", Buffer.alloc(0)),
  ]);
}
const zdest = process.env.ENTRY_OUT || "/output/entry.png";
try { mkdirSync(zdest.slice(0, zdest.lastIndexOf("/")), { recursive: true }); } catch { /* provided */ }
writeFileSync(zdest, zencode());
console.log("ZEPHYRINE poster written to", zdest);
