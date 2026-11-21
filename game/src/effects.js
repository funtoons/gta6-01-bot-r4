// Screen-space and world-space effects: sparks, smoke, muzzle flashes,
// floating text and the explosion glow the renderer draws additively.
export function spawnSparks(G, z, x, color, n) {
  for (let i = 0; i < (n || 10); i += 1) {
    G.parts.push({ z, x: x + (G.rng() - 0.5) * 0.3, y: 0.5 + G.rng(), vx: (G.rng() - 0.5) * 8, vy: 1 + G.rng() * 5, vz: (G.rng() - 0.5) * 20, life: 0.4 + G.rng() * 0.5, max: 0.9, color: color || '#ffd34d', size: 0.3 + G.rng() * 0.5 });
  }
}
export function spawnSmoke(G, z, x, n) {
  for (let i = 0; i < (n || 8); i += 1) {
    G.parts.push({ z, x: x + (G.rng() - 0.5) * 0.5, y: 1 + G.rng() * 2, vx: (G.rng() - 0.5) * 1.5, vy: 1.5 + G.rng() * 2, vz: (G.rng() - 0.5) * 8, life: 1 + G.rng(), max: 2, color: '#8a8a92', size: 1 + G.rng() * 1.6 });
  }
}
export function updateEffects(G, dt) {
  for (let i = G.parts.length - 1; i >= 0; i -= 1) {
    const p = G.parts[i];
    p.life -= dt;
    if (p.life <= 0) { G.parts.splice(i, 1); continue; }
    p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
    p.vy -= 3 * dt;
    if (p.y < 0) p.y = 0;
  }
  for (let i = G.flashes.length - 1; i >= 0; i -= 1) {
    G.flashes[i].t -= dt;
    if (G.flashes[i].t <= 0) G.flashes.splice(i, 1);
  }
  for (let i = G.floats.length - 1; i >= 0; i -= 1) {
    G.floats[i].t -= dt;
    if (G.floats[i].t <= 0) G.floats.splice(i, 1);
  }
  if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 1.8);
  if (G.bannerT > 0) G.bannerT -= dt;
  if (G.dialog && G.dialog.t > 0) G.dialog.t -= dt;
  if (G.dialog && G.dialog.t <= 0) G.dialog = null;
}
export function addFloat(G, text, color) {
  G.floats.push({ text, color: color || '#7dff9a', t: 1.6 });
}
