// The player on foot and behind the wheel: driving, walking, entering and
// stealing cars, respray, and the BUSTED / WASTED endings.
import { MAX_SPEED, ROAD_W } from './config.js';
import { clamp } from './random.js';
import { nearestCar, burst } from './vehicles.js';
import { addMoney, addRespect, setBanner, setDialog } from './state.js';
import { spawnSparks } from './effects.js';
export function updatePlayer(G, input, audio, dt) {
  G.district = districtOf(G);
  if (G.onFoot) updateOnFoot(G, input, audio, dt);
  else updateDriving(G, input, audio, dt);
  G.stats.distance += Math.abs(G.speed) * dt;
  if (G.health <= 0) {
    if (G.wanted >= 3 && G.cops.length > 0) bustPlayer(G, audio);
    else wastePlayer(G, audio);
  }
  if (G.wanted > 0 && !G.onFoot) G.heat += dt * 0.02;
}
export function districtOf(G) {
  const list = ['Marina Bay', 'Old Town', 'Palm Row', 'Harbor Docks', 'Neon Strip', 'Coral Heights'];
  return list[Math.floor(G.z / 6000) % list.length];
}
export function updateOnFoot(G, input, audio, dt) {
  const w = input.walk();
  const sp = w.run ? 11 : 7;
  G.z += w.fwd * sp * dt;
  G.x = clamp(G.x + w.side * 1.4 * dt, -1.4, 1.4);
  G.speed = w.fwd * sp;
  if (Math.abs(G.z - Math.round(G.z / 3000) * 3000) < 30) setBanner(G, 'SPRAY SHOP', 'Respray clears your wanted level — $100');
}
export function updateDriving(G, input, audio, dt) {
  const d = input.drive();
  const top = G.car ? G.car.top : 50;
  if (d.gas > 0) G.speed += 34 * d.gas * dt * (1 - Math.abs(G.speed) / (top + 8));
  else if (d.gas < 0) G.speed += 40 * d.gas * dt;
  else G.speed -= Math.sign(G.speed) * Math.min(Math.abs(G.speed), 14 * dt);
  if (d.brake) G.speed -= Math.sign(G.speed) * Math.min(Math.abs(G.speed), 70 * dt);
  G.speed = clamp(G.speed, -14, MAX_SPEED + 10);
  const steer = d.steer * clamp(Math.abs(G.speed) / 20, 0, 1);
  G.steer = steer;
  G.x = clamp(G.x + steer * 1.5 * dt * Math.sign(G.speed || 1), -1.5, 1.5);
  G.z += G.speed * dt;
  if (Math.abs(G.x) > 1.05) { G.speed *= (1 - 0.35 * dt); if (G.car) G.car.cond -= 1.2 * dt; }
  const gz = Math.round(G.z / 3000) * 3000;
  if (Math.abs(G.z - gz) < 25 && G.wanted > 0 && G.money >= 100) {
    G.money -= 100; G.wanted = 0; G.heat = 0; G.cops = [];
    if (G.car) G.car.cond = 100;
    setBanner(G, 'RESPRAY DONE', 'Clean plates. The heat is off — for now.');
    audio.playSfx('cash', G); addRespect(G, 15);
  }
}
export function enterCar(G, audio) {
  if (!G.onFoot) { exitCar(G, audio); return false; }
  const c = nearestCar(G, 40);
  if (!c) return false;
  G.traffic.splice(G.traffic.indexOf(c), 1);
  G.car = c; G.onFoot = false; G.x = c.x;
  raiseWanted(G, 1);
  G.stats.stolen += 1;
  audio.playSfx('door', G);
  setDialog(G, 'RIO', 'Wheelman', 'Nice ride. SCPD clocked the jack — lose them or spray it.', 4);
  return true;
}
export function exitCar(G, audio) {
  if (G.onFoot || !G.car) return;
  G.traffic.push({ ...G.car, z: G.z + 2, x: G.x, speed: 0, parked: true });
  G.car = null; G.onFoot = true; G.speed = 0;
  audio.playSfx('door', G);
}
export function raiseWanted(G, n) {
  G.wanted = clamp(G.wanted + n, 0, 5);
  G.heat = 1;
}
export function bustPlayer(G, audio) {
  G.screen = 'busted'; G.stats.busted += 1;
  const fine = Math.min(G.money, 200);
  G.money -= fine;
  audio.playSfx('busted', G);
  G.health = 100; G.armor = 0; G.wanted = 0; G.cops = []; G.heli.on = false;
  G.z += 400; G.x = 0; G.onFoot = true; G.car = null; G.speed = 0;
}
export function wastePlayer(G, audio) {
  G.screen = 'wasted'; G.stats.wasted += 1;
  audio.playSfx('crash', G);
  G.health = 100; G.armor = 25; G.wanted = Math.max(0, G.wanted - 1);
  G.cops = []; G.heli.on = false;
  G.z += 400; G.x = 0; G.onFoot = true; G.car = null; G.speed = 0;
}
export function damagePlayer(G, n) {
  if (G.armor > 0) { const a = Math.min(G.armor, n); G.armor -= a; G.health -= (n - a); }
  else G.health -= n;
  G.shake = Math.max(G.shake, 0.4);
}
