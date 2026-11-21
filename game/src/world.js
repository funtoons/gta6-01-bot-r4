// The city of Solmarina as pure functions of distance: road curve, districts,
// roadside buildings, palms and lamps are all derived from the segment index,
// so the world is infinite, deterministic and needs no stored map.
import { hash01 } from './random.js';
import { DISTRICTS, SEG } from './config.js';
export function generateWorld(seed) {
  return { seed, segCount: 0 };
}
export function roadCurve(i) {
  const z = i * SEG;
  return Math.sin(z * 0.00225) * 0.9 + Math.sin(z * 0.00065 + 1.7) * 1.7 + Math.sin(z * 0.000155 + 4.0) * 2.2;
}
export function districtAt(z) {
  return DISTRICTS[Math.floor(z / (SEG * 300)) % DISTRICTS.length];
}
export function segmentInfo(W, i) {
  const seed = W.seed;
  const curve = roadCurve(i);
  const district = DISTRICTS[Math.floor(i / 300) % DISTRICTS.length];
  const left = roadside(W, i, -1);
  const right = roadside(W, i, 1);
  return { i, curve, district, left, right };
}
export function roadside(W, i, side) {
  const h = hash01(i * 2 + (side < 0 ? 0 : 1), W.seed);
  const h2 = hash01(i * 3 + (side < 0 ? 5 : 9), W.seed);
  const kind = h < 0.42 ? 'tower' : h < 0.62 ? 'shop' : h < 0.8 ? 'palm' : h < 0.9 ? 'lamp' : 'house';
  const tall = kind === 'tower' ? 0.55 + h2 * 0.9 : kind === 'shop' ? 0.28 + h2 * 0.22 : 0.16 + h2 * 0.2;
  const hue = Math.floor(h2 * 6);
  return { kind, tall, hue, gap: 1.35 + h2 * 0.9 };
}
export function segIndex(z) { return Math.floor(z / SEG); }
export function segStart(i) { return i * SEG; }
