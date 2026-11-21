// Traffic and parked cars: spawn, cruise, despawn, and yield around the player.
import { CARS, ROAD_W } from './config.js';
import { clamp } from './random.js';
export function spawnTraffic(G, n) {
  while (G.traffic.length < n) {
    const ahead = G.z + 200 + G.rng() * 2200;
    G.traffic.push(makeCar(G, ahead, (G.rng() * 2 - 1) * 0.55));
  }
}
export function makeCar(G, z, x) {
  const c = CARS[Math.floor(G.rng() * CARS.length)];
  return { z, x, speed: 14 + G.rng() * 14, name: c.name, color: c.color, top: c.top, cond: 60 + G.rng() * 40, parked: false, brake: 0 };
}
export function updateVehicles(G, dt) {
  spawnTraffic(G, 14);
  const pz = G.z;
  for (let i = G.traffic.length - 1; i >= 0; i -= 1) {
    const c = G.traffic[i];
    c.z += c.speed * dt;
    if (c.z < pz - 300 || c.z > pz + 2600) { G.traffic.splice(i, 1); continue; }
    const dz = c.z - pz;
    if (dz > 0 && dz < 60 && Math.abs(c.x - G.x) < 0.22) {
      c.speed = Math.max(6, c.speed - 30 * dt);
      c.brake = 1;
    } else { c.brake = 0; c.speed += (16 + (c.top - 50) * 0.2 - c.speed) * 0.2 * dt; }
    if (!G.onFoot && dz > -4 && dz < 8 && Math.abs(c.x - G.x) < 0.16 && Math.abs(G.speed) > 12) {
      G.speed *= 0.55; c.speed *= 0.7; c.x += (c.x < G.x ? -0.3 : 0.3) * dt * 4;
      G.shake = Math.max(G.shake, 0.5); G.health -= 2; c.cond -= 18;
      if (c.cond <= 0) { burst(G, c.z, c.x, c.color); G.traffic.splice(i, 1); }
    }
  }
  if (G.car) G.car.cond = clamp(G.car.cond, 0, 100);
}
export function nearestCar(G, maxDz) {
  let best = null; let bd = maxDz;
  for (const c of G.traffic) {
    const dz = Math.abs(c.z - G.z);
    if (dz < bd && Math.abs(c.x - G.x) < 0.35) { best = c; bd = dz; }
  }
  return best;
}
export function burst(G, z, x, color) {
  for (let i = 0; i < 26; i += 1) {
    G.parts.push({ z, x: x + (G.rng() - 0.5) * 0.4, y: G.rng() * 2, vx: (G.rng() - 0.5) * 6, vy: 2 + G.rng() * 6, vz: (G.rng() - 0.5) * 30, life: 0.6 + G.rng() * 0.7, max: 1.3, color: i % 3 ? color : '#ffcf4d', size: 0.5 + G.rng() });
  }
  G.flashes.push({ z, x, t: 0.35 });
  G.shake = Math.max(G.shake, 0.9);
}
