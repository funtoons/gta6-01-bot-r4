// Free-roam activities: taxi fares, vigilante takedowns, package hunting
// and checkpoint races — the same machinery the story missions reuse.
import { addMoney, addRespect, setDialog, setBanner } from './state.js';
import { nearestPed } from './pedestrians.js';
import { burst } from './vehicles.js';
import { spawnSmoke } from './effects.js';
export function startTaxi(G, audio) {
  if (G.taxi.active || G.onFoot) return false;
  const p = nearestPed(G, 60);
  if (!p || !p.taxi) return false;
  G.peds.splice(G.peds.indexOf(p), 1);
  G.taxi.active = true; G.taxi.fare = 0; G.taxi.dest = G.z + 600 + G.rng() * 500;
  G.markers = [{ z: G.taxi.dest, x: 0, kind: 'flag', label: 'Drop-off' }];
  setDialog(G, 'RIDER', 'Tourist', 'Palm Row, please — and step on it, I tip for speed!', 4);
  return true;
}
export function updateTaxi(G, audio, dt) {
  if (!G.taxi.active) return;
  if (Math.abs(G.z - G.taxi.dest) < 30) {
    const tip = 60 + Math.floor(G.rng() * 80);
    addMoney(G, tip); G.stats.fares += 1; G.taxi.fare += 1;
    addRespect(G, 40);
    setBanner(G, 'FARE COMPLETE', '+' + tip + ' · Fares today: ' + G.stats.fares);
    if (audio) audio.playSfx('cash', G);
    G.taxi.active = false; G.markers = [];
  }
}
export function startVigilante(G, audio) {
  if (G.vig.active) return false;
  const t = { name: 'WANTED RUNNER', z: G.z + 200, x: (G.rng() - 0.5), speed: 30 + G.rng() * 8, hp: 100, color: '#8e44ad', cond: 100, top: 58 };
  G.vig.target = t; G.vig.active = true; G.vig.hits = 0;
  setDialog(G, 'SCPD DISPATCH', 'Radio', 'All units: purple runner fleeing the docks. Civilians, do not engage — reward $300.', 5);
  return true;
}
export function updateVigilante(G, audio, dt) {
  if (!G.vig.active || !G.vig.target) return;
  const t = G.vig.target;
  t.z += t.speed * dt;
  if (t.hp <= 0) {
    burst(G, t.z, t.x, t.color); spawnSmoke(G, t.z, t.x, 8);
    addMoney(G, 300); addRespect(G, 120); G.stats.kills += 1;
    setBanner(G, 'TAKEDOWN COMPLETE', '+$300 · SCPD thanks you, citizen');
    if (audio) audio.playSfx('cash', G);
    G.vig.active = false; G.vig.target = null;
    return;
  }
  if (t.z < G.z - 300) { G.vig.active = false; G.vig.target = null; setDialog(G, 'SCPD DISPATCH', 'Radio', 'Runner lost. Better luck next time.', 4); }
}
export function updatePackages(G, audio) {
  if (G.pickups.length < 3) {
    const z = G.z + 300 + G.rng() * 1200;
    G.pickups.push({ z, x: (G.rng() * 2 - 1) * 0.6, taken: false });
  }
  for (const p of G.pickups) {
    if (!p.taken && Math.abs(p.z - G.z) < 12 && Math.abs(p.x - G.x) < 0.4) {
      p.taken = true; G.packages += 1; addMoney(G, 50); addRespect(G, 25);
      setBanner(G, 'PACKAGE FOUND', G.packages + ' / ' + G.packagesTotal + ' hidden packages');
      if (audio) audio.playSfx('pickup', G);
    }
  }
  G.pickups = G.pickups.filter((p) => !p.taken && p.z > G.z - 100);
}
export function startRace(G, audio) {
  if (G.race.active) return false;
  G.race.active = true; G.race.cp = 0; G.race.t = 60; G.race.next = G.z + 600;
  G.markers = [{ z: G.race.next, x: 0, kind: 'gate', label: 'CHECKPOINT 1' }];
  setDialog(G, 'RIO', 'Wheelman', 'Clock’s running, champ. Three gates, sixty seconds.', 4);
  return true;
}
export function updateRace(G, audio, dt) {
  if (!G.race.active) return;
  G.race.t -= dt;
  if (G.z >= G.race.next) {
    G.race.cp += 1;
    if (G.race.cp >= 3) {
      G.race.active = false; G.stats.races += 1; G.markers = [];
      addMoney(G, 250); addRespect(G, 150);
      setBanner(G, 'RACE WON', '+$250 · Best time on the Strip');
      if (audio) audio.playSfx('cash', G);
      return;
    }
    G.race.next = G.z + 600;
    G.markers = [{ z: G.race.next, x: 0, kind: 'gate', label: 'CHECKPOINT ' + (G.race.cp + 1) }];
  }
  if (G.race.t <= 0) { G.race.active = false; G.markers = []; setDialog(G, 'RIO', 'Wheelman', 'Too slow. The Strip forgets fast — run it back.', 4); }
}
