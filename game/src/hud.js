// The dense HUD: mission panel, dispatch board, weapon slots, minimap,
// speed, money, wanted stars, dialog portraits and district name.
import { WEAPONS, STATIONS } from './config.js';
import { fmtMoney, clockText } from './state.js';
import { dispatchUnits } from './police.js';
import { MISSIONS } from './missions.js';
export function drawHud(ctx, G) {
  const W = ctx.canvas.width, H = ctx.canvas.height;
  drawMissionPanel(ctx, G, W, H);
  drawMoneyPanel(ctx, G, W, H);
  drawDispatch(ctx, G, W, H);
  drawWeaponSlots(ctx, G, W, H);
  drawMinimap(ctx, G, W, H);
  drawSpeedPanel(ctx, G, W, H);
  drawDialog(ctx, G, W, H);
  drawDistrict(ctx, G, W, H);
  drawFloats(ctx, G, W, H);
  if (G.bannerT > 0 && G.banner) drawBanner(ctx, G, W, H);
}
export function panel(ctx, x, y, w, h, alpha) {
  ctx.fillStyle = 'rgba(12,14,22,' + (alpha || 0.82) + ')';
  ctx.strokeStyle = 'rgba(255,255,255,0.16)';
  ctx.lineWidth = 1;
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill(); ctx.stroke();
}
export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}
export function drawMissionPanel(ctx, G, W, H) {
  const M = MISSIONS[Math.min(G.mission, 5)];
  panel(ctx, 16, 14, 330, 108, 0.85);
  ctx.fillStyle = '#ffd34d'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('MISSION ' + (Math.min(G.mission, 5) + 1) + ' · ' + M.name.toUpperCase(), 28, 36);
  ctx.fillStyle = '#ff5a7a'; ctx.font = 'bold 11px sans-serif';
  ctx.fillText('STAGE ' + (G.stage + 1) + '/' + M.stages.length, 28, 54);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 17px sans-serif';
  ctx.fillText(G.objective, 28, 76);
  ctx.fillStyle = '#9fd8e8'; ctx.font = '12px sans-serif';
  ctx.fillText('NEXT  ' + G.next, 28, 96);
  const pct = (G.stage + 1) / M.stages.length;
  ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(28, 104, 306, 5);
  ctx.fillStyle = '#7dff9a'; ctx.fillRect(28, 104, 306 * pct, 5);
  if (G.objTimer > 0) {
    ctx.fillStyle = '#fff'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'right';
    ctx.fillText(Math.ceil(G.objTimer) + 's', 334, 54);
    ctx.textAlign = 'left';
  }
}
export function drawMoneyPanel(ctx, G, W, H) {
  panel(ctx, W - 268, 14, 252, 92, 0.85);
  ctx.fillStyle = '#7dff9a'; ctx.font = 'bold 30px sans-serif'; ctx.textAlign = 'right';
  ctx.fillText(fmtMoney(G.money), W - 30, 48);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffb84d'; ctx.font = 'bold 12px sans-serif';
  ctx.fillText(clockText(G) + '  ·  DAY 1', W - 252, 68);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 12px sans-serif';
  ctx.fillText('RANK ' + G.rank + '  ·  ' + G.rp.toLocaleString('en-US') + ' RP', W - 252, 86);
  drawStars(ctx, G, W - 252, 16, 15);
  if (G.wanted > 0) {
    ctx.fillStyle = '#ff4d4d'; ctx.font = 'bold 13px sans-serif';
    ctx.fillText('WANTED', W - 120, 68);
  }
}
export function drawStars(ctx, G, x, y, size) {
  for (let i = 0; i < 5; i += 1) {
    ctx.fillStyle = i < G.wanted ? '#ffd34d' : 'rgba(255,255,255,0.25)';
    drawStar(ctx, x + i * (size + 4) + size / 2, y + size / 2, size / 2);
  }
}
export function drawStar(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : r * 0.45;
    const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath(); ctx.fill();
}
export function drawDispatch(ctx, G, W, H) {
  const units = dispatchUnits(G);
  if (units.length === 0) return;
  const h = 34 + units.length * 22;
  panel(ctx, 16, 134, 300, h, 0.85);
  ctx.fillStyle = '#ff6b6b'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('SCPD RESPONSE', 28, 154);
  ctx.fillStyle = '#fff'; ctx.textAlign = 'right';
  ctx.fillText(units.length + ' UNITS' + (G.wanted >= 4 ? ' · CODE 4' : ''), 304, 154);
  ctx.textAlign = 'left';
  units.slice(0, 6).forEach((u, i) => {
    const y = 176 + i * 22;
    ctx.fillStyle = u.status === 'RAMMING' ? '#ff5a5a' : u.status === 'SPOTLIGHT' ? '#7dd8ff' : '#fff';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(u.name, 28, y);
    ctx.fillStyle = '#9fd8e8'; ctx.font = '12px sans-serif';
    ctx.fillText(u.dist + ' m', 120, y);
    ctx.fillStyle = u.status === 'RAMMING' ? '#ff5a5a' : u.status === 'ROADBLOCK' ? '#ffb84d' : '#7dff9a';
    ctx.textAlign = 'right'; ctx.font = 'bold 11px sans-serif';
    ctx.fillText(u.status, 304, y);
    ctx.textAlign = 'left';
  });
  if (units.length > 6) {
    ctx.fillStyle = '#aaa'; ctx.font = '11px sans-serif';
    ctx.fillText('+' + (units.length - 6) + ' more units in the search zone', 28, 176 + 6 * 22);
  }
}
export function drawWeaponSlots(ctx, G, W, H) {
  const y = 14;
  WEAPONS.forEach((w, i) => {
    const x = W - 268 + i * 64;
    const active = i === G.weapon;
    ctx.fillStyle = active ? 'rgba(255,211,77,0.92)' : 'rgba(12,14,22,0.82)';
    ctx.strokeStyle = active ? '#ffd34d' : 'rgba(255,255,255,0.2)';
    roundRect(ctx, x, y + 104, 58, 46, 6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = active ? '#111' : '#fff'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText((i + 1) + '  ' + w.name, x + 29, y + 124);
    ctx.font = '11px sans-serif';
    ctx.fillText(w.ammo === Infinity ? '∞' : String(G.ammo[i]), x + 29, y + 141);
    ctx.textAlign = 'left';
  });
}
export function drawMinimap(ctx, G, W, H) {
  const cx = 86, cy = H - 108, r = 62;
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.clip();
  ctx.fillStyle = '#1c2b33'; ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.strokeStyle = '#3a4a55'; ctx.lineWidth = 1;
  for (let i = -2; i <= 2; i += 1) {
    ctx.beginPath(); ctx.moveTo(cx - r, cy + i * 22); ctx.lineTo(cx + r, cy + i * 22); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + i * 22, cy - r); ctx.lineTo(cx + i * 22, cy + r); ctx.stroke();
  }
  ctx.strokeStyle = '#ffd34d'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(cx, cy + r); ctx.quadraticCurveTo(cx - 14, cy, cx + 8, cy - r); ctx.stroke();
  const blip = (dz, dx, col, rr) => {
    const bx = cx + Math.max(-1, Math.min(1, dx)) * (r - 8);
    const by = cy - Math.max(-1, Math.min(1, dz / 400)) * (r - 8);
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(bx, by, rr, 0, 7); ctx.fill();
  };
  for (const c of G.cops) blip(c.z - G.z, c.x - G.x, '#ff4d4d', 4);
  if (G.vig.target) blip(G.vig.target.z - G.z, G.vig.target.x - G.x, '#ff5a7a', 5);
  for (const m of G.markers) blip(m.z - G.z, m.x - G.x, '#ffd34d', 5);
  for (const p of G.pickups) if (!p.taken) blip(p.z - G.z, p.x - G.x, '#7dff9a', 3);
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(cx, cy, 5, 0, 7); ctx.fill();
  ctx.strokeStyle = '#111'; ctx.lineWidth = 2; ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('N', cx, cy - r - 6);
  panel(ctx, 16, H - 40, 140, 26, 0.85);
  ctx.fillStyle = '#7dff9a'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('HEALTH ' + Math.max(0, Math.round(G.health)), 26, H - 31);
  ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(26, H - 26, 120, 4);
  ctx.fillStyle = '#7dff9a'; ctx.fillRect(26, H - 26, 120 * Math.max(0, G.health) / 100, 4);
  ctx.fillStyle = '#7dd8ff';
  ctx.fillText('ARMOR ' + Math.max(0, Math.round(G.armor)), 26, H - 13);
  ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(26, H - 10, 120, 3);
}
export function drawSpeedPanel(ctx, G, W, H) {
  ctx.textAlign = 'right';
  ctx.fillStyle = '#fff'; ctx.font = 'bold 58px sans-serif';
  const kmh = Math.round(Math.abs(G.speed) * 3.6);
  ctx.fillText(String(kmh), W - 24, H - 96);
  ctx.font = 'bold 14px sans-serif'; ctx.fillStyle = '#ffd34d';
  ctx.fillText('KM/H', W - 24, H - 74);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 15px sans-serif';
  ctx.fillText(G.onFoot ? 'ON FOOT' : (G.car ? G.car.name.toUpperCase() : 'ON FOOT'), W - 24, H - 52);
  ctx.fillStyle = '#9fd8e8'; ctx.font = '12px sans-serif';
  ctx.fillText(G.onFoot ? 'WASD walk · E steal car' : 'CONDITION ' + Math.round(G.car ? G.car.cond : 0) + '%', W - 24, H - 34);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ff8ad8'; ctx.font = 'bold 11px sans-serif';
  ctx.fillText('♪ ' + STATIONS[G.station] + '  ·  R to switch', W - 252, H - 12);
}
export function drawDialog(ctx, G, W, H) {
  if (!G.dialog) return;
  const d = G.dialog;
  const w = 560, x = (W - w) / 2, y = H - 118;
  panel(ctx, x, y, w, 74, 0.92);
  const initials = d.name.split(' ').map((s) => s[0]).join('').slice(0, 2);
  ctx.fillStyle = '#ff8ad8';
  roundRect(ctx, x + 12, y + 12, 50, 50, 8); ctx.fill();
  ctx.fillStyle = '#111'; ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(initials, x + 37, y + 44);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#7dd8ff'; ctx.font = 'bold 13px sans-serif';
  ctx.fillText(d.name + '  ·  ' + d.role, x + 74, y + 30);
  ctx.fillStyle = '#fff'; ctx.font = '15px sans-serif';
  wrapText(ctx, d.text, x + 74, y + 52, w - 90, 18);
}
export function wrapText(ctx, text, x, y, maxW, lh) {
  const words = text.split(' ');
  let line = '', yy = y;
  for (const w of words) {
    const t = line ? line + ' ' + w : w;
    if (ctx.measureText(t).width > maxW && line) { ctx.fillText(line, x, yy); line = w; yy += lh; }
    else line = t;
  }
  ctx.fillText(line, x, yy);
}
export function drawDistrict(ctx, G, W, H) {
  ctx.fillStyle = 'rgba(12,14,22,0.7)';
  roundRect(ctx, 16, H - 200, 210, 34, 6); ctx.fill();
  ctx.fillStyle = '#ffd34d'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'left';
  ctx.fillText(G.district.toUpperCase(), 28, H - 186);
  ctx.fillStyle = '#fff'; ctx.font = '11px sans-serif';
  ctx.fillText('Solmarina · Golden Hour', 28, H - 172);
}
export function drawFloats(ctx, G, W, H) {
  ctx.textAlign = 'center';
  G.floats.forEach((f, i) => {
    ctx.globalAlpha = Math.min(1, f.t);
    ctx.fillStyle = f.color; ctx.font = 'bold 18px sans-serif';
    ctx.fillText(f.text, W / 2, H * 0.3 - i * 24);
  });
  ctx.globalAlpha = 1; ctx.textAlign = 'left';
}
export function drawBanner(ctx, G, W, H) {
  ctx.save();
  ctx.globalAlpha = Math.min(1, G.bannerT);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd34d'; ctx.font = 'bold 30px sans-serif';
  ctx.fillText(G.banner.text, W / 2, H * 0.24);
  ctx.fillStyle = '#fff'; ctx.font = '16px sans-serif';
  ctx.fillText(G.banner.sub, W / 2, H * 0.24 + 26);
  ctx.restore(); ctx.textAlign = 'left';
}
