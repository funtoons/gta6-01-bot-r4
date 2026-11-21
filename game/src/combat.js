// Combat: fists, pistol, SMG and shotgun. Shots fly forward down the road;
// the nearest cop, traffic car or ped in the cone takes the hit.
import { WEAPONS } from './config.js';
import { raiseWanted, damagePlayer } from './player.js';
import { spawnSparks, spawnSmoke } from './effects.js';
import { burst } from './vehicles.js';
export function shootAt(G, audio) {
  const w = WEAPONS[G.weapon];
  if (G.weapon > 0) {
    if (G.ammo[G.weapon] <= 0) { G.weapon = 0; return false; }
    G.ammo[G.weapon] -= 1;
  }
  G.stats.fired += 1;
  G.shots.push({ t: 0.12 });
  audio.playSfx(G.weapon === 0 ? 'punch' : 'shot', G);
  let hit = null; let bd = 320;
  for (const c of G.cops) {
    const dz = c.z - G.z;
    if (dz > 0 && dz < bd && Math.abs(c.x - G.x) < 0.4) { hit = { kind: 'cop', o: c }; bd = dz; }
  }
  for (const c of G.traffic) {
    const dz = c.z - G.z;
    if (dz > 0 && dz < bd && Math.abs(c.x - G.x) < 0.4) { hit = { kind: 'car', o: c }; bd = dz; }
  }
  if (!hit) {
    for (const p of G.peds) {
      const dz = p.z - G.z;
      if (dz > 0 && dz < bd && Math.abs(p.x - G.x) < 0.4) { hit = { kind: 'ped', o: p }; bd = dz; }
    }
  }
  if (G.vig.active && G.vig.target) {
    const dz = G.vig.target.z - G.z;
    if (dz > 0 && dz < 320 && Math.abs(G.vig.target.x - G.x) < 0.5) { hit = { kind: 'vig', o: G.vig.target }; bd = dz; }
  }
  if (!hit) return true;
  G.stats.hits += 1;
  const o = hit.o;
  spawnSparks(G, o.z, o.x, '#ffb84d', 8);
  if (hit.kind === 'cop') { o.hp -= w.dmg; raiseWanted(G, 1); }
  else if (hit.kind === 'car') { o.cond -= w.dmg; if (o.cond <= 0) { burst(G, o.z, o.x, o.color); G.traffic.splice(G.traffic.indexOf(o), 1); } raiseWanted(G, 1); }
  else if (hit.kind === 'ped') { G.peds.splice(G.peds.indexOf(o), 1); G.stats.kills += 1; raiseWanted(G, 1); }
  else if (hit.kind === 'vig') { o.hp -= w.dmg; G.vig.hits += 1; if (o.hp <= 0) { burst(G, o.z, o.x, '#c0392b'); } }
  return true;
}
export function cycleWeapon(G) {
  G.weapon = (G.weapon + 1) % WEAPONS.length;
}
export function giveAmmo(G, w, n) { G.ammo[w] = Math.min(999, G.ammo[w] + n); }
