// Pedestrians: crowds on the sidewalks, crossers, fleeing witnesses,
// and the taxi riders who flag the player down.
import { clamp } from './random.js';
export function spawnPedestrians(G, n) {
  while (G.peds.length < n) {
    const ahead = G.z + 60 + G.rng() * 1400;
    G.peds.push(makePed(G, ahead));
  }
}
export function makePed(G, z) {
  const colors = ['#e84a7a', '#2ca8a0', '#d9b23a', '#7a6ff0', '#e8632c', '#8fce3a', '#f2ead8'];
  return {
    z, x: (G.rng() < 0.5 ? -1 : 1) * (1.08 + G.rng() * 0.25),
    speed: 0.8 + G.rng() * 1.6, color: colors[Math.floor(G.rng() * colors.length)],
    panic: 0, taxi: G.rng() < 0.12, dir: G.rng() < 0.5 ? -1 : 1, phase: G.rng() * 6,
  };
}
export function updatePedestrians(G, dt) {
  spawnPedestrians(G, 22);
  for (let i = G.peds.length - 1; i >= 0; i -= 1) {
    const p = G.peds[i];
    if (p.z < G.z - 120 || p.z > G.z + 1600) { G.peds.splice(i, 1); continue; }
    p.phase += dt * 6;
    p.x += p.dir * 0.12 * dt * (p.panic > 0 ? 6 : 1);
    p.x = clamp(p.x, -2.2, 2.2);
    if (p.panic > 0) p.panic -= dt;
    if (Math.abs(p.x) < 1.1 && p.dir !== 0 && Math.abs(p.z - G.z) < 40) p.dir *= -1;
    if (!G.onFoot && Math.abs(p.z - G.z) < 4 && Math.abs(p.x - G.x) < 0.16 && Math.abs(G.speed) > 8) {
      G.peds.splice(i, 1);
      G.health -= 4; G.shake = 0.6;
      if (G.wanted < 5) G.wanted += 1;
      for (const q of G.peds) if (Math.abs(q.z - G.z) < 80) q.panic = 3;
    }
  }
}
export function nearestPed(G, maxDz) {
  let best = null; let bd = maxDz;
  for (const p of G.peds) {
    const dz = Math.abs(p.z - G.z);
    if (dz < bd) { best = p; bd = dz; }
  }
  return best;
}
