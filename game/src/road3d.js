// Pseudo-3D chase-cam renderer: a classic segment-projection road with a
// golden-hour sky, low-poly roadside towers, palms, traffic, cops and a heli.
import { SEG, DRAW, ROAD_W, CAM_DEPTH } from './config.js';
import { roadCurve, segmentInfo } from './world.js';
import { hash01, clamp } from './random.js';
export function renderWorld(ctx, G, W) {
  const Wpx = ctx.canvas.width, Hpx = ctx.canvas.height;
  const camH = G.onFoot ? 2.4 : 3.4;
  const playerZ = camH * CAM_DEPTH;
  const pos = G.z;
  const base = Math.floor(pos / SEG);
  const basePct = (pos % SEG) / SEG;
  const horizon = Hpx * 0.5;
  drawSky(ctx, G, W, Wpx, Hpx, horizon);
  ctx.fillStyle = '#b98a5e';
  ctx.fillRect(0, horizon, Wpx, Hpx - horizon);
  let x = 0;
  const CS = (SEG / 20) * (SEG / 20);
  let dx = -(roadCurve(base) * basePct) * CS;
  const segs = [];
  let maxY = Hpx;
  for (let n = 0; n < DRAW; n += 1) {
    const idx = base + n;
    const curve = roadCurve(idx);
    const z1 = idx * SEG, z2 = z1 + SEG;
    const camX1 = G.x * ROAD_W - x;
    const camX2 = G.x * ROAD_W - (x + dx);
    const p1 = project(Wpx, Hpx, 0, 0, z1, camX1, camH, pos);
    const p2 = project(Wpx, Hpx, 0, 0, z2, camX2, camH, pos);
    const vis = p1.cz > CAM_DEPTH && p2.y < p1.y && p2.y < maxY;
    segs.push({ idx, p1, p2, camX: camX1, clip: maxY, vis, info: segmentInfo(W, idx) });
    if (vis) maxY = p1.y;
    x += dx; dx += curve * CS;
  }
  for (let n = DRAW - 1; n >= 0; n -= 1) {
    const s = segs[n];
    if (!s.vis) continue;
    drawRoadSeg(ctx, s, Wpx, Hpx);
    drawRoadside(ctx, G, W, s, Wpx, Hpx);
    drawSegSprites(ctx, G, s, Wpx, Hpx);
  }
  drawParticles(ctx, G, segs, base, Wpx, Hpx, pos);
  drawFlashes(ctx, G, segs, base, Wpx, Hpx, pos);
  if (G.onFoot) drawWalker(ctx, G, Wpx, Hpx);
  else drawPlayerCar(ctx, G, Wpx, Hpx);
  if (G.heli.on) drawHeli(ctx, G, Wpx, Hpx);
  drawSpeedLines(ctx, G, Wpx, Hpx);
}
export function project(Wpx, Hpx, wx, wy, wz, camX, camY, camZ) {
  const cz = wz - camZ;
  const scale = CAM_DEPTH / Math.max(cz, 0.001);
  return {
    x: Wpx / 2 + scale * (wx - camX) * Wpx / 2,
    y: Hpx / 2 - scale * (wy - camY) * Hpx / 2,
    w: scale * ROAD_W * Wpx / 2,
    scale, cz,
  };
}
export function spriteXY(s, worldX, Wpx, Hpx) {
  const sc = s.p1.scale;
  return { x: Wpx / 2 + sc * (worldX - s.camX) * Wpx / 2, y: s.p1.y, sc };
}
export function drawSky(ctx, G, W, Wpx, Hpx, horizon) {
  const g = ctx.createLinearGradient(0, 0, 0, horizon + 40);
  g.addColorStop(0, '#241a4e'); g.addColorStop(0.45, '#7a2d6e');
  g.addColorStop(0.75, '#ff7a3c'); g.addColorStop(1, '#ffd34d');
  ctx.fillStyle = g; ctx.fillRect(0, 0, Wpx, horizon + 40);
  const sunX = Wpx * 0.62, sunY = horizon - 46;
  const sg = ctx.createRadialGradient(sunX, sunY, 4, sunX, sunY, 120);
  sg.addColorStop(0, 'rgba(255,236,160,0.95)'); sg.addColorStop(0.35, 'rgba(255,150,60,0.55)'); sg.addColorStop(1, 'rgba(255,120,60,0)');
  ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(sunX, sunY, 120, 0, 7); ctx.fill();
  ctx.fillStyle = '#ffe9a8'; ctx.beginPath(); ctx.arc(sunX, sunY, 30, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(255,170,190,0.5)';
  for (let i = 0; i < 5; i += 1) {
    const cx = hash01(i, 7) * Wpx, cy = 40 + hash01(i, 11) * 110, cw = 90 + hash01(i, 13) * 160;
    ctx.beginPath(); ctx.ellipse(cx, cy, cw, 12 + hash01(i, 17) * 10, 0, 0, 7); ctx.fill();
  }
  for (let i = 0; i < 26; i += 1) {
    const bx = (i / 26) * Wpx + hash01(i, 21) * 30;
    const bh = 24 + hash01(i, 23) * 90;
    const bw = 26 + hash01(i, 29) * 40;
    ctx.fillStyle = i % 3 ? 'rgba(46,22,64,0.85)' : 'rgba(70,32,74,0.85)';
    ctx.fillRect(bx, horizon - bh, bw, bh);
    ctx.fillStyle = 'rgba(255,190,90,0.7)';
    for (let k = 0; k < 3; k += 1) ctx.fillRect(bx + 5 + k * 9, horizon - bh + 8 + (k % 2) * 14, 4, 6);
  }
}
export function drawRoadSeg(ctx, s, Wpx, Hpx) {
  const { p1, p2 } = s;
  const alt = s.idx % 2 === 0;
  ctx.fillStyle = alt ? '#8a6a52' : '#84644e';
  poly(ctx, p1.x - p1.w * 1.45, p1.y, p1.x + p1.w * 1.45, p1.y, p2.x + p2.w * 1.45, p2.y, p2.x - p2.w * 1.45, p2.y);
  ctx.fillStyle = alt ? '#3a3a44' : '#383842';
  poly(ctx, p1.x - p1.w, p1.y, p1.x + p1.w, p1.y, p2.x + p2.w, p2.y, p2.x - p2.w, p2.y);
  if (s.idx % 3 === 0) {
    ctx.fillStyle = '#ffd34d';
    const cx1 = (p1.x - p1.w * 0.02), cx2 = (p2.x - p2.w * 0.02);
    poly(ctx, cx1 - p1.w * 0.02, p1.y, cx1 + p1.w * 0.02, p1.y, cx2 + p2.w * 0.02, p2.y, cx2 - p2.w * 0.02, p2.y);
  }
  ctx.fillStyle = '#f2ead8';
  poly(ctx, p1.x - p1.w * 0.98, p1.y, p1.x - p1.w * 0.92, p1.y, p2.x - p2.w * 0.92, p2.y, p2.x - p2.w * 0.98, p2.y);
  poly(ctx, p1.x + p1.w * 0.92, p1.y, p1.x + p1.w * 0.98, p1.y, p2.x + p2.w * 0.98, p2.y, p2.x + p2.w * 0.92, p2.y);
}
export function poly(ctx, x1, y1, x2, y2, x3, y3, x4, y4) {
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.lineTo(x4, y4); ctx.closePath(); ctx.fill();
}
export function drawRoadside(ctx, G, W, s, Wpx, Hpx) {
  drawSide(ctx, s, s.info.left, -1, Wpx, Hpx);
  drawSide(ctx, s, s.info.right, 1, Wpx, Hpx);
}
export function drawSide(ctx, s, side, dir, Wpx, Hpx) {
  if (hash01(s.idx, 91) > 0.36 && side.kind !== 'lamp') return;
  const wx = dir * side.gap * ROAD_W;
  const p = spriteXY(s, wx, Wpx, Hpx);
  if (p.x < -200 || p.x > Wpx + 200) return;
  const HUES = ['#c96a3a', '#3a7d8c', '#8c5a7a', '#d9a03a', '#5a6e8c', '#a04a3a'];
  if (side.kind === 'tower' || side.kind === 'shop' || side.kind === 'house') {
    const h = p.sc * side.tall * 42 * Hpx / 2;
    const w = p.sc * 9 * Wpx / 2;
    if (h < 3) return;
    ctx.fillStyle = HUES[side.hue];
    ctx.fillRect(p.x - w / 2, p.y - h, w, h);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(p.x - w / 2, p.y - h, w * 0.22, h);
    ctx.fillStyle = 'rgba(255,220,140,0.85)';
    const rows = Math.max(1, Math.floor(h / 26));
    for (let r = 0; r < rows; r += 1) {
      if (hash01(s.idx * 7 + r, side.hue) < 0.45) ctx.fillRect(p.x - w / 2 + 4 + (r % 3) * (w / 3.4), p.y - h + 8 + r * 24, 5, 7);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(p.x - w / 2, p.y - h, w, 4);
  } else if (side.kind === 'palm') {
    const h = p.sc * 8 * Hpx / 2;
    const w = p.sc * 1.2 * Wpx / 2;
    if (h < 4) return;
    ctx.strokeStyle = '#6e4a2a'; ctx.lineWidth = Math.max(1, w * 0.12);
    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.quadraticCurveTo(p.x + w * 0.2, p.y - h * 0.6, p.x + w * 0.3, p.y - h); ctx.stroke();
    ctx.strokeStyle = '#3f9e4d'; ctx.lineWidth = Math.max(1, w * 0.08);
    for (let f = 0; f < 5; f += 1) {
      const a = -0.4 - f * 0.45;
      ctx.beginPath(); ctx.moveTo(p.x + w * 0.3, p.y - h);
      ctx.quadraticCurveTo(p.x + w * 0.3 + Math.cos(a) * w * 1.1, p.y - h + Math.sin(a) * w * 0.5, p.x + w * 0.3 + Math.cos(a) * w * 1.8, p.y - h + Math.sin(a) * w * 1.1 + w * 0.5);
      ctx.stroke();
    }
  } else {
    const h = p.sc * 6 * Hpx / 2;
    const w = p.sc * 0.3 * Wpx / 2;
    if (h < 3) return;
    ctx.strokeStyle = '#2c2c34'; ctx.lineWidth = Math.max(1, w * 0.3);
    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x, p.y - h); ctx.stroke();
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = 'rgba(255,214,120,0.8)';
    ctx.beginPath(); ctx.arc(p.x, p.y - h, Math.max(2, w * 0.9), 0, 7); ctx.fill();
    ctx.restore();
  }
}
export function drawSegSprites(ctx, G, s, Wpx, Hpx) {
  const z0 = s.idx * SEG, z1 = z0 + SEG;
  for (const c of G.traffic) if (c.z >= z0 && c.z < z1) drawTrafficCar(ctx, G, s, c, Wpx, Hpx, false);
  for (const c of G.cops) if (c.z >= z0 && c.z < z1) drawTrafficCar(ctx, G, s, c, Wpx, Hpx, true);
  if (G.vig.target && G.vig.target.z >= z0 && G.vig.target.z < z1) drawTargetCar(ctx, G, s, G.vig.target, Wpx, Hpx);
  for (const p of G.peds) if (p.z >= z0 && p.z < z1) drawPed(ctx, s, p, Wpx, Hpx);
  for (const m of G.markers) if (m.z >= z0 && m.z < z1) drawMarker(ctx, s, m, Wpx, Hpx);
  for (const p of G.pickups) if (!p.taken && p.z >= z0 && p.z < z1) drawPickup(ctx, s, p, Wpx, Hpx);
}
export function drawTrafficCar(ctx, G, s, c, Wpx, Hpx, cop) {
  const p = spriteXY(s, c.x * ROAD_W, Wpx, Hpx);
  const w = p.sc * 2.1 * Wpx / 2;
  const h = p.sc * 1.5 * Hpx / 2;
  if (w < 2) return;
  drawCarRear(ctx, p.x, p.y, w, h, cop ? '#e8ecf2' : c.color, cop, G.time);
  if (c.brake) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = 'rgba(255,40,40,0.85)';
    ctx.fillRect(p.x - w * 0.42, p.y - h * 0.42, w * 0.14, h * 0.1);
    ctx.fillRect(p.x + w * 0.28, p.y - h * 0.42, w * 0.14, h * 0.1);
    ctx.restore();
  }
}
export function drawCarRear(ctx, x, y, w, h, color, cop, t) {
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath(); ctx.ellipse(x, y - h * 0.02, w * 0.52, h * 0.08, 0, 0, 7); ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x - w * 0.5, y); ctx.lineTo(x - w * 0.46, y - h * 0.62);
  ctx.lineTo(x - w * 0.34, y - h * 0.95); ctx.lineTo(x + w * 0.34, y - h * 0.95);
  ctx.lineTo(x + w * 0.46, y - h * 0.62); ctx.lineTo(x + w * 0.5, y); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#1b2436';
  ctx.beginPath();
  ctx.moveTo(x - w * 0.32, y - h * 0.6); ctx.lineTo(x - w * 0.28, y - h * 0.88);
  ctx.lineTo(x + w * 0.28, y - h * 0.88); ctx.lineTo(x + w * 0.32, y - h * 0.6); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(x - w * 0.46, y - h * 0.6, w * 0.06, h * 0.55);
  ctx.fillStyle = '#111';
  ctx.fillRect(x - w * 0.48, y - h * 0.16, w * 0.12, h * 0.18);
  ctx.fillRect(x + w * 0.36, y - h * 0.16, w * 0.12, h * 0.18);
  if (cop) {
    ctx.fillStyle = '#14181f'; ctx.fillRect(x - w * 0.3, y - h * 0.52, w * 0.6, h * 0.1);
    ctx.fillStyle = '#c8d2e0'; ctx.font = 'bold ' + Math.max(6, h * 0.16) + 'px sans-serif';
    ctx.textAlign = 'center'; ctx.fillText('SCPD', x, y - h * 0.24);
    const on = Math.floor(t * 4) % 2 === 0;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = on ? 'rgba(255,50,50,0.95)' : 'rgba(80,120,255,0.95)';
    ctx.beginPath(); ctx.arc(x - w * 0.14, y - h * 0.52, Math.max(2, w * 0.06), 0, 7); ctx.fill();
    ctx.fillStyle = on ? 'rgba(80,120,255,0.95)' : 'rgba(255,50,50,0.95)';
    ctx.beginPath(); ctx.arc(x + w * 0.14, y - h * 0.52, Math.max(2, w * 0.06), 0, 7); ctx.fill();
    ctx.restore();
  }
}
export function drawTargetCar(ctx, G, s, t, Wpx, Hpx) {
  const p = spriteXY(s, t.x * ROAD_W, Wpx, Hpx);
  const w = p.sc * 2.2 * Wpx / 2;
  const h = p.sc * 1.5 * Hpx / 2;
  if (w < 2) return;
  drawCarRear(ctx, p.x, p.y, w, h, t.color, false, G.time);
  ctx.fillStyle = '#ffdf3a';
  ctx.beginPath();
  ctx.moveTo(p.x, p.y - h * 1.5); ctx.lineTo(p.x - w * 0.16, p.y - h * 1.85); ctx.lineTo(p.x + w * 0.16, p.y - h * 1.85);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#111'; ctx.font = 'bold ' + Math.max(7, h * 0.2) + 'px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(t.name, p.x, p.y - h * 1.95);
}
export function drawPed(ctx, s, p, Wpx, Hpx) {
  const q = spriteXY(s, p.x * ROAD_W, Wpx, Hpx);
  const h = q.sc * 1.8 * Hpx / 2;
  if (h < 2) return;
  const bob = Math.sin(p.phase) * h * 0.06;
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(q.x, q.y, h * 0.16, h * 0.04, 0, 0, 7); ctx.fill();
  ctx.fillStyle = p.color;
  ctx.fillRect(q.x - h * 0.13, q.y - h * 0.62 + bob, h * 0.26, h * 0.62);
  ctx.fillStyle = '#e8b98a';
  ctx.beginPath(); ctx.arc(q.x, q.y - h * 0.74 + bob, h * 0.13, 0, 7); ctx.fill();
  if (p.taxi) {
    ctx.fillStyle = '#ffe14d'; ctx.font = 'bold ' + Math.max(8, h * 0.3) + 'px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('!', q.x, q.y - h * 1.05 + bob);
  }
  if (p.panic > 0) {
    ctx.fillStyle = '#fff'; ctx.font = 'bold ' + Math.max(8, h * 0.28) + 'px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('!', q.x, q.y - h * 1.05);
  }
}
export function drawMarker(ctx, s, m, Wpx, Hpx) {
  const p = spriteXY(s, m.x * ROAD_W, Wpx, Hpx);
  const h = p.sc * 6 * Hpx / 2;
  if (h < 4) return;
  const col = m.kind === 'parcel' ? '#ffd34d' : m.kind === 'gate' ? '#7dff9a' : '#ff5a7a';
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createLinearGradient(p.x, p.y - h, p.x, p.y);
  g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = 0.35; ctx.fillStyle = g;
  ctx.fillRect(p.x - 3, p.y - h, 6, h);
  ctx.restore();
  ctx.save();
  ctx.translate(p.x, p.y - h - 14);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = col; ctx.fillRect(-9, -9, 18, 18);
  ctx.fillStyle = '#111'; ctx.fillRect(-5, -5, 10, 10);
  ctx.restore();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(m.label, p.x, p.y - h - 34);
}
export function drawPickup(ctx, s, p, Wpx, Hpx) {
  const q = spriteXY(s, p.x * ROAD_W, Wpx, Hpx);
  const r = Math.max(3, q.sc * 0.8 * Wpx / 2);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = 'rgba(255,211,77,0.9)';
  ctx.beginPath(); ctx.arc(q.x, q.y - r * 2, r, 0, 7); ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#ffd34d'; ctx.fillRect(q.x - r * 0.7, q.y - r * 2.6, r * 1.4, r * 1.2);
  ctx.fillStyle = '#8a6a1a'; ctx.fillRect(q.x - r * 0.7, q.y - r * 2.1, r * 1.4, r * 0.25);
}
export function drawParticles(ctx, G, segs, base, Wpx, Hpx, pos) {
  for (const p of G.parts) {
    const n = Math.floor((p.z - base * SEG) / SEG);
    if (n < 0 || n >= DRAW) continue;
    const s = segs[n];
    if (!s || !s.vis) continue;
    const q = spriteXY(s, p.x * ROAD_W, Wpx, Hpx);
    const r = Math.max(1.5, q.sc * p.size * Wpx / 2);
    const y = q.y - p.y * q.sc * Hpx / 2;
    ctx.globalAlpha = clamp(p.life / p.max, 0, 1);
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(q.x, y, r, 0, 7); ctx.fill();
  }
  ctx.globalAlpha = 1;
}
export function drawFlashes(ctx, G, segs, base, Wpx, Hpx, pos) {
  for (const f of G.flashes) {
    const n = Math.floor((f.z - base * SEG) / SEG);
    if (n < 0 || n >= DRAW) continue;
    const s = segs[n];
    if (!s || !s.vis) continue;
    const q = spriteXY(s, f.x * ROAD_W, Wpx, Hpx);
    const r = Math.min(320, q.sc * 90 * Wpx / 2 * (0.5 + f.t));
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(q.x, q.y - 20, 2, q.x, q.y - 20, Math.max(4, r));
    g.addColorStop(0, 'rgba(255,220,120,0.8)'); g.addColorStop(0.5, 'rgba(255,110,40,0.45)'); g.addColorStop(1, 'rgba(255,80,20,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(q.x, q.y - 20, Math.max(4, r), 0, 7); ctx.fill();
    ctx.restore();
  }
}
export function drawPlayerCar(ctx, G, Wpx, Hpx) {
  const cx = Wpx / 2 + (G.shake ? (hash01(Math.floor(G.time * 60), 3) - 0.5) * G.shake * 14 : 0);
  const cy = Hpx * 0.985;
  const w = Wpx * 0.34, h = Hpx * 0.30;
  const tilt = clamp(G.steer || 0, -1, 1) * 0.03 + (G.x * 0.02);
  ctx.save();
  ctx.translate(cx, cy); ctx.rotate(tilt);
  const col = G.car ? G.car.color : '#e8632c';
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath(); ctx.ellipse(0, -h * 0.02, w * 0.52, h * 0.07, 0, 0, 7); ctx.fill();
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(-w * 0.5, 0); ctx.lineTo(-w * 0.46, -h * 0.6);
  ctx.lineTo(-w * 0.34, -h * 0.92); ctx.lineTo(w * 0.34, -h * 0.92);
  ctx.lineTo(w * 0.46, -h * 0.6); ctx.lineTo(w * 0.5, 0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#10151f';
  ctx.beginPath();
  ctx.moveTo(-w * 0.3, -h * 0.58); ctx.lineTo(-w * 0.26, -h * 0.86);
  ctx.lineTo(w * 0.26, -h * 0.86); ctx.lineTo(w * 0.3, -h * 0.58); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.fillRect(-w * 0.44, -h * 0.58, w * 0.05, h * 0.52);
  ctx.fillStyle = '#0c0c10';
  ctx.fillRect(-w * 0.47, -h * 0.14, w * 0.11, h * 0.16);
  ctx.fillRect(w * 0.36, -h * 0.14, w * 0.11, h * 0.16);
  ctx.fillStyle = 'rgba(255,60,60,0.9)';
  ctx.fillRect(-w * 0.42, -h * 0.44, w * 0.13, h * 0.07);
  ctx.fillRect(w * 0.29, -h * 0.44, w * 0.13, h * 0.07);
  ctx.fillStyle = '#ffd34d'; ctx.font = 'bold ' + Math.round(h * 0.13) + 'px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(G.car ? G.car.name.toUpperCase() : 'ON FOOT', 0, -h * 1.04);
  ctx.restore();
  if (Math.abs(G.speed) > 30) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 2;
    for (let i = 0; i < 6; i += 1) {
      const lx = hash01(i, Math.floor(G.time * 30)) * Wpx;
      ctx.beginPath(); ctx.moveTo(lx, Hpx * 0.55 + i * 20); ctx.lineTo(lx, Hpx * 0.62 + i * 20); ctx.stroke();
    }
    ctx.restore();
  }
}
export function drawWalker(ctx, G, Wpx, Hpx) {
  const cx = Wpx * 0.44;
  const cy = Hpx * 0.985;
  const h = Hpx * 0.21;
  const bob = Math.sin(G.time * 10) * (Math.abs(G.speed) > 0.5 ? 4 : 0);
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath(); ctx.ellipse(cx, cy, h * 0.22, h * 0.05, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#2ca8a0';
  ctx.fillRect(cx - h * 0.16, cy - h * 0.72 + bob, h * 0.32, h * 0.72);
  ctx.fillStyle = '#20242e';
  ctx.fillRect(cx - h * 0.14, cy - h * 0.06 + bob, h * 0.1, h * 0.08);
  ctx.fillRect(cx + h * 0.04, cy - h * 0.06 + bob, h * 0.1, h * 0.08);
  ctx.fillStyle = '#e8b98a';
  ctx.beginPath(); ctx.arc(cx, cy - h * 0.86 + bob, h * 0.15, 0, 7); ctx.fill();
  ctx.fillStyle = '#1c1c22';
  ctx.beginPath(); ctx.arc(cx, cy - h * 0.92 + bob, h * 0.15, Math.PI, 0); ctx.fill();
}
export function drawHeli(ctx, G, Wpx, Hpx) {
  const hx = Wpx * (0.5 + G.heli.x * 0.06);
  const hy = Hpx * 0.16 + Math.sin(G.time * 1.4) * 6;
  ctx.save();
  ctx.strokeStyle = 'rgba(20,20,28,0.9)'; ctx.lineWidth = 3;
  const rot = G.time * 9;
  ctx.beginPath(); ctx.moveTo(hx - 70, hy - 16); ctx.lineTo(hx + 70, hy - 16); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(hx - 60 + Math.sin(rot) * 8, hy - 20); ctx.lineTo(hx + 60 + Math.sin(rot) * 8, hy - 12); ctx.stroke();
  ctx.fillStyle = '#232a38';
  ctx.beginPath(); ctx.ellipse(hx, hy, 46, 18, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#9fd8e8';
  ctx.beginPath(); ctx.ellipse(hx + 22, hy - 2, 16, 9, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#c8d2e0'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('SCPD AIR-1', hx, hy - 26);
  ctx.restore();
  if (G.heli.spot > 0.2) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.5 * G.heli.spot;
    const g = ctx.createLinearGradient(hx, hy + 10, hx + (G.x * 40), Hpx * 0.72);
    g.addColorStop(0, 'rgba(255,244,180,0.85)'); g.addColorStop(1, 'rgba(255,244,180,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(hx - 8, hy + 10); ctx.lineTo(hx + 8, hy + 10);
    ctx.lineTo(Wpx / 2 + 130, Hpx * 0.72); ctx.lineTo(Wpx / 2 - 130, Hpx * 0.72);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
}
export function drawSpeedLines(ctx, G, Wpx, Hpx) {
  if (Math.abs(G.speed) < 34 || G.onFoot) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = 'rgba(255,255,255,0.20)'; ctx.lineWidth = 2;
  for (let i = 0; i < 8; i += 1) {
    const lx = hash01(i, Math.floor(G.time * 24)) * Wpx;
    const ly = Hpx * (0.3 + hash01(i + 40, 5) * 0.5);
    ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx, ly + 26 + Math.abs(G.speed)); ctx.stroke();
  }
  ctx.restore();
}
