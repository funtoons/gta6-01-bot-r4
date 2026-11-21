// Fresh game state: one object the whole game reads and writes.
import { createRandom } from './random.js';
import { SAVE_KEY } from './config.js';
export function newGameState(seed) {
  const rng = createRandom(seed);
  return {
    seed, rng, time: 0, clockMin: 17 * 60 + 42,
    z: 0, x: 0, speed: 0, steer: 0, onFoot: true, car: null,
    health: 100, armor: 50, money: 250, wanted: 0, heat: 0,
    weapon: 0, ammo: [Infinity, 60, 120, 24],
    respect: 0, rp: 0, rank: 'ROOKIE',
    screen: 'title', paused: false, mapOpen: false, statsOpen: false,
    mission: 0, stage: 0, missionDone: [false, false, false, false, false, false],
    objective: 'Walk to the diner marker', next: 'Pick up the parcel', objTimer: 0,
    dialog: null, banner: null, bannerT: 0, district: 'Marina Bay',
    traffic: [], peds: [], cops: [], heli: { on: false, x: 0, z: 0, spot: 0 },
    pickups: [], markers: [], parts: [], floats: [], shots: [], flashes: [],
    taxi: { active: false, fare: 0, dest: 0, rider: null },
    vig: { active: false, target: null, hits: 0 },
    race: { active: false, cp: 0, t: 0, next: 0 },
    garageZ: 2400, packages: 0, packagesTotal: 12,
    stats: { kills: 0, stolen: 0, fares: 0, distance: 0, busted: 0, wasted: 0, fired: 0, hits: 0, races: 0, earned: 0 },
    shake: 0, slowmo: 0, station: 0, muted: false, ending: false, endT: 0,
    saveSlot: null, shotMode: null, msg: '',
  };
}
export function resetRun(G) {
  const fresh = newGameState(G.seed);
  fresh.saveSlot = G.saveSlot;
  Object.keys(fresh).forEach((k) => { G[k] = fresh[k]; });
}
export function saveGame(G) {
  try {
    const s = { money: G.money, mission: G.mission, stage: G.stage, done: G.missionDone, respect: G.respect, rp: G.rp, stats: G.stats, packages: G.packages, z: G.z, day: 1 };
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(s));
    G.saveSlot = s;
    return true;
  } catch { return false; }
}
export function loadSave() {
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
export function applySave(G, s) {
  if (!s) return;
  G.money = s.money; G.mission = s.mission; G.stage = s.stage;
  G.missionDone = s.done; G.respect = s.respect; G.rp = s.rp;
  G.stats = s.stats; G.packages = s.packages; G.z = s.z || 0; G.saveSlot = s;
}
export function addMoney(G, n) { G.money += n; G.stats.earned += Math.max(0, n); }
export function addRespect(G, n) {
  G.rp += n; G.respect += n;
  G.rank = G.rp >= 5200 ? 'FIXER' : G.rp >= 2600 ? 'HUSTLER' : G.rp >= 900 ? 'RUNNER' : 'ROOKIE';
}
export function setDialog(G, name, role, text, t) {
  G.dialog = { name, role, text, t: t || 5 };
}
export function setBanner(G, text, sub) { G.banner = { text, sub: sub || '' }; G.bannerT = 3.2; }
export function fmtMoney(n) { return '$' + Math.floor(n).toLocaleString('en-US'); }
export function clockText(G) {
  const m = Math.floor(G.clockMin + G.time / 10) % 1440;
  const h = Math.floor(m / 60), mm = m % 60;
  return String(h).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
}
