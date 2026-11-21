// Screenshot scenes: each one plays the real sim forward from a fresh world
// with a deterministic autopilot, so the frame is a true render of the game.
import { STEP } from './config.js';
import { startMission } from './missions.js';
import { setDialog, setBanner, addMoney } from './state.js';
import { burst } from './vehicles.js';
import { spawnSmoke } from './effects.js';
export function stageShot(name, G, audio) {
  G.screen = 'play';
  if (name === 'stats') {
    G.screen = 'stats';
    G.missionDone = [true, true, true, false, false, false];
    G.mission = 3; G.stage = 0;
    G.objective = 'Find Marlo’s runner (V to mark it)';
    G.next = 'Wreck the runner';
    G.money = 8450; G.rp = 2400; G.rank = 'HUSTLER';
    G.packages = 5;
    G.stats = { kills: 4, stolen: 7, fares: 6, distance: 48200, busted: 1, wasted: 0, fired: 38, hits: 21, races: 2, earned: 8200 };
    return 'stats';
  }
  if (name === 'street') {
    G.onFoot = true; G.car = null; G.z = 1200; G.x = 0.4; G.wanted = 1;
    for (let i = 0; i < 22; i += 1) stepShot(G, audio, 0, 0);
    startMission(G, 0, audio);
    G.cops.push({ name: 'GULL-1', z: G.z + 45, x: 0.55, speed: 0, status: 'PURSUIT', hp: 60, ram: 0 });
    G.dialog = { name: 'MAMA ZOLA', role: 'Diner Owner', text: 'Rio, honey — the parcel is on the counter. Cops are thick tonight, so keep it smooth.', t: 9 };
    return 'play';
  }
  if (name === 'mission') {
    startMission(G, 5, audio);
    G.stage = 1; G.objective = 'Wreck the Regent'; G.next = 'Vanish before the air unit arrives';
    G.onFoot = false; G.car = { name: 'Sunset Stallion', color: '#d9b23a', top: 62, cond: 78 };
    G.z = 3000; G.x = 0.2; G.speed = 44; G.wanted = 4;
    G.money = 12400; G.rp = 3900; G.rank = 'FIXER'; G.health = 81; G.armor = 40;
    if (G.vig.target) { G.vig.target.z = G.z + 130; G.vig.target.x = 0.25; G.vig.target.hp = 60; }
    for (let i = 0; i < 60; i += 1) stepShot(G, audio, 1, 0.1);
    const t = G.vig.target;
    if (t) { burst(G, t.z + 10, t.x, '#c0392b'); spawnSmoke(G, t.z + 10, t.x, 10); }
    G.dialog = { name: 'RIO', role: 'Wheelman', text: 'He is making for the pier! Ram the Regent before it reaches the water!', t: 9 };
    setBanner(G, 'WRECK THE REGENT', 'Mission 6 · Stage 2/3');
    return 'play';
  }
  startMission(G, 5, audio);
  G.stage = 1; G.objective = 'Wreck the Regent'; G.next = 'Vanish before the air unit arrives';
  G.onFoot = false; G.car = { name: 'Sunset Stallion', color: '#d9b23a', top: 62, cond: 62 };
  G.z = 2600; G.x = -0.15; G.speed = 48; G.wanted = 4; G.money = 18450;
  G.health = 72; G.armor = 55; G.rp = 3900; G.rank = 'FIXER';
  if (G.vig.target) { G.vig.target.z = G.z + 110; G.vig.target.x = 0.3; }
  for (let i = 0; i < 90; i += 1) stepShot(G, audio, 1, i % 5 === 0 ? 0.3 : -0.2);
  G.cops.push({ name: 'REEF-7', z: G.z + 90, x: 0.1, speed: 0, status: 'ROADBLOCK', hp: 60, ram: 0 });
  G.dialog = { name: 'MAMA ZOLA', role: 'Diner Owner', text: 'Marlo is running for the pier, Rio. Wreck his Regent before it reaches the water!', t: 9 };
  setBanner(G, 'MISSION 6 — STORM THE PIER', 'Stage 2/3 · Wreck the Regent');
  return 'play';
}
export function stepShot(G, audio, gas, steer) {
  G.time += STEP;
  if (G.onFoot) { G.z += 7 * STEP; }
  else {
    G.speed = Math.min(52, G.speed + 20 * STEP);
    G.z += G.speed * STEP;
    G.x = Math.max(-0.6, Math.min(0.6, G.x + steer * STEP));
  }
  importVehicles(G);
  importPolice(G, audio);
}
export function importVehicles(G) {
  if (G.traffic.length < 14) {
    for (let i = 0; i < 14; i += 1) {
      const z = G.z + 25 + i * 38 + G.rng() * 14;
      G.traffic.push({ z, x: (G.rng() * 2 - 1) * 0.6, speed: 16 + G.rng() * 10, name: 'Coral Cruiser', color: ['#e8632c', '#2ca8a0', '#d9b23a', '#e84a7a'][i % 4], top: 55, cond: 80, parked: false, brake: 0 });
    }
  }
  for (const c of G.traffic) c.z += c.speed * STEP;
  G.traffic = G.traffic.filter((c) => c.z > G.z - 100 && c.z < G.z + 2600);
  if (G.peds.length < 26) {
    for (let i = 0; i < 26; i += 1) {
      G.peds.push({ z: G.z + 6 + i * 9, x: (i % 2 ? -1 : 1) * (0.25 + (i % 4) * 0.2), speed: 1, color: ['#e84a7a', '#2ca8a0', '#d9b23a', '#7a6ff0'][i % 4], panic: 0, taxi: i % 7 === 0, dir: 1, phase: i });
    }
  }
}
export function importPolice(G, audio) {
  const want = G.wanted >= 4 ? 5 : G.wanted >= 2 ? 3 : G.wanted >= 1 ? 1 : 0;
  if (G.wanted >= 1 && G.cops.length < want) {
    const names = ['GULL-1', 'REEF-3', 'PIER-4', 'CORAL-12', 'DUNE-9'];
    while (G.cops.length < want) {
      G.cops.push({ name: names[G.cops.length], z: G.z - 60 - G.cops.length * 40, x: (G.rng() * 2 - 1) * 0.4, speed: 46, status: ['PURSUIT', 'RAMMING', 'FLANKING', 'ROADBLOCK', 'PURSUIT'][G.cops.length], hp: 60, ram: 0 });
    }
  }
  G.heli.on = G.wanted >= 3;
  G.heli.z = G.z + 120; G.heli.x = 0; G.heli.spot = 1;
  for (const c of G.cops) { c.z += c.speed * STEP; if (c.z > G.z + 300) c.z = G.z - 100; }
}
