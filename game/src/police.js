// SCPD pursuit: patrol cars, ramming, roadblocks and the air unit.
// Unit names, distances and statuses feed the dispatch panel on the HUD.
import { clamp } from './random.js';
import { damagePlayer } from './player.js';
import { burst } from './vehicles.js';
import { spawnSparks } from './effects.js';
const NAMES = ['GULL-1', 'GULL-2', 'REEF-3', 'REEF-7', 'PIER-4', 'DUNE-9', 'CORAL-12', 'SURF-5'];
const STATUS = ['PURSUIT', 'RAMMING', 'FLANKING', 'ROADBLOCK', 'SPOTLIGHT', 'FIRING'];
export function updatePolice(G, audio, dt) {
  const want = G.wanted;
  const target = want === 0 ? 0 : want === 1 ? 2 : want === 2 ? 3 : want === 3 ? 4 : want === 4 ? 5 : 6;
  while (G.cops.length < target) {
    const n = NAMES[G.cops.length % NAMES.length];
    G.cops.push({ name: n, z: G.z - 80 - G.rng() * 200, x: (G.rng() * 2 - 1) * 0.5, speed: 30, status: 'PURSUIT', hp: 60, ram: 0 });
  }
  while (G.cops.length > target) G.cops.pop();
  G.heli.on = want >= 3;
  if (G.heli.on) {
    G.heli.z = G.z + 120; G.heli.x = G.x * 0.4;
    G.heli.spot = Math.min(1, G.heli.spot + dt);
    if (Math.floor(G.time * 2) % 5 === 0) audio.playSfx('siren', G);
  } else G.heli.spot = Math.max(0, G.heli.spot - dt);
  for (let i = G.cops.length - 1; i >= 0; i -= 1) {
    const c = G.cops[i];
    const dz = c.z - G.z;
    const closing = G.speed > 0 ? G.speed : 0;
    c.speed = clamp(closing + 10 + want * 3 + (dz < -40 ? 14 : 0), 18, 68);
    c.z += c.speed * dt;
    c.x += clamp(G.x - c.x, -1, 1) * 0.9 * dt;
    c.status = dz < -6 ? 'PURSUIT' : dz < 30 ? (Math.abs(c.x - G.x) < 0.2 ? 'RAMMING' : 'FLANKING') : 'ROADBLOCK';
    if (c.status === 'RAMMING') c.ram += dt;
    if (Math.abs(dz) < 6 && Math.abs(c.x - G.x) < 0.18) {
      damagePlayer(G, 6 * dt * 10);
      G.speed *= (1 - 0.5 * dt);
      spawnSparks(G, G.z + 4, G.x, '#ffd34d', 3);
      if (c.ram > 1.2) { c.hp -= 20; c.ram = 0; }
    }
    if (c.hp <= 0) {
      burst(G, c.z, c.x, '#2b6cb0');
      G.cops.splice(i, 1);
      G.stats.kills += 1;
      if (G.vig.active && G.vig.target === c) { G.vig.hits += 1; }
    }
  }
  if (want > 0) { G.heat = Math.max(0, G.heat - dt * 0.01); }
  if (want > 0 && G.speed < 2 && G.onFoot) G.heat += dt * 0.05;
  if (G.heat <= 0 && want > 0 && G.time > 5) { /* heat decays only at spray shop */ }
}
export function copDistance(G, c) { return Math.max(1, Math.round(Math.abs(c.z - G.z))); }
export function dispatchUnits(G) {
  const units = G.cops.map((c) => ({ name: c.name, dist: copDistance(G, c), status: c.status }));
  if (G.heli.on) units.push({ name: 'AIR-1', dist: 42, status: 'SPOTLIGHT' });
  return units;
}
