// Boot and the one loop: fixed 1/60 s steps, screens, and the ?shot=
// staging that paints a real frame twice and sets window.__shotReady.
import { STEP, WEAPONS, STATIONS } from './config.js';
import { createRandom } from './random.js';
import { newGameState, resetRun, saveGame, loadSave, applySave, setDialog } from './state.js';
import { generateWorld } from './world.js';
import { bindInput } from './input.js';
import { startAudio } from './audio.js';
import { updateVehicles } from './vehicles.js';
import { updateEffects } from './effects.js';
import { updatePlayer, enterCar, raiseWanted, damagePlayer } from './player.js';
import { updatePedestrians } from './pedestrians.js';
import { updatePolice } from './police.js';
import { shootAt, cycleWeapon } from './combat.js';
import { startMission, updateMissions, MISSIONS } from './missions.js';
import { startTaxi, updateTaxi, startVigilante, updateVigilante, updatePackages, startRace, updateRace } from './activities.js';
import { renderWorld } from './road3d.js';
import { drawHud } from './hud.js';
import { stageShot } from './shots.js';
export function bootGame() {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
  const seed = Number.isInteger(seedParam) && seedParam >= 0 ? seedParam : 1;
  const canvas = document.getElementById('game');
  const status = document.getElementById('status');
  const ctx = canvas.getContext('2d');
  const G = newGameState(seed);
  const W = generateWorld(seed);
  const audio = startAudio();
  G.saveSlot = loadSave();
  window.SOLMARINA = G;
  function resize() { canvas.width = 1280; canvas.height = 720; }
  resize();
  function announce(m) { status.textContent = m; }
  if (shot) { runShotMode(shot, G, W, ctx, audio, announce); return; }
  const input = bindInput(canvas, G);
  let last = 0;
  let acc = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    if (!last) last = now;
    acc += Math.min((now - last) / 1000, 0.25);
    last = now;
    const acts = input.takeActions();
    handleActions(acts, G, audio, announce);
    if (G.screen === 'play' && !G.paused) {
      applyOneShots(G, acts, audio);
      while (acc >= STEP) { stepGame(G, input, audio, STEP); acc -= STEP; }
    } else acc = 0;
    drawFrame(ctx, G, W);
  }
  announce('Solmarina. Press Enter to start. WASD drive, E steal a car, F shoot.');
  requestAnimationFrame(frame);
}
export function runShotMode(shot, G, W, ctx, audio, announce) {
  const mode = stageShot(shot, G, audio);
  G.shotMode = mode;
  let painted = 0;
  function paint() {
    drawFrame(ctx, G, W);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}
export function applyOneShots(G, acts, audio) {
  if (acts.fire) shootAt(G, audio);
  if (acts.act) enterCar(G, audio);
  if (acts.weapon) cycleWeapon(G);
  if (acts.radio) { G.station = (G.station + 1) % STATIONS.length; }
  if (acts.save) { if (saveGame(G)) setDialog(G, 'SOLMARINA', 'Save', 'Progress saved. Come back any time — Continue is on the title screen.', 3); }
  if (acts.taxi) startTaxi(G, audio);
  if (acts.vig) startVigilante(G, audio);
  if (acts.race) startRace(G, audio);
  if (acts.horn) audio.playSfx('horn', G);
}
export function stepGame(G, input, audio, dt) {
  G.time += dt;
  updatePlayer(G, input, audio, dt);
  updateVehicles(G, dt);
  updatePedestrians(G, dt);
  updatePolice(G, audio, dt);
  updateMissions(G, audio, dt);
  updateTaxi(G, audio, dt);
  updateVigilante(G, audio, dt);
  updatePackages(G, audio);
  updateRace(G, audio, dt);
  updateEffects(G, dt);
  audio.radioTick(G, dt);
  audio.engineHum(G);
  if (G.screen === 'busted' || G.screen === 'wasted') { /* screens handled by drawFrame */ }
}
export function handleActions(acts, G, audio, announce) {
  if (G.screen === 'title') {
    if (acts.confirm) { resetRun(G); G.screen = 'play'; startMission(G, 0, audio); announce('Playing. Mission 1: First Job.'); }
    else if (acts.map && G.saveSlot) { applySave(G, G.saveSlot); G.screen = 'play'; startMission(G, G.mission, audio); announce('Continued from save.'); }
    return;
  }
  if (G.screen === 'busted' || G.screen === 'wasted' || G.screen === 'ending') {
    if (acts.confirm) { G.screen = 'title'; announce('Solmarina. Press Enter to start.'); }
    return;
  }
  if (acts.pause) { G.paused = !G.paused; announce(G.paused ? 'Paused.' : 'Playing.'); }
  if (acts.map) { G.mapOpen = !G.mapOpen; }
  if (acts.stats) { G.statsOpen = !G.statsOpen; }
}
export function drawFrame(ctx, G, W) {
  const Wpx = ctx.canvas.width, Hpx = ctx.canvas.height;
  ctx.clearRect(0, 0, Wpx, Hpx);
  if (G.screen === 'title') { drawTitle(ctx, G, Wpx, Hpx); return; }
  if (G.screen === 'stats' || G.statsOpen) { renderWorld(ctx, G, W); drawHud(ctx, G); drawStats(ctx, G, Wpx, Hpx); return; }
  if (G.screen === 'ending') { renderWorld(ctx, G, W); drawHud(ctx, G); drawEnding(ctx, G, Wpx, Hpx); return; }
  renderWorld(ctx, G, W);
  drawHud(ctx, G);
  if (G.screen === 'busted') drawEndCard(ctx, 'BUSTED', 'The SCPD has you. $200 fine — the streets will wait.', Wpx, Hpx);
  if (G.screen === 'wasted') drawEndCard(ctx, 'WASTED', 'Solmarina is unforgiving. You wake up at the clinic, lighter in pocket.', Wpx, Hpx);
  if (G.paused) drawEndCard(ctx, 'PAUSED', 'Enter resume · M map · C stats · S save', Wpx, Hpx);
  if (G.mapOpen) drawMap(ctx, G, Wpx, Hpx);
}
export function drawTitle(ctx, G, Wpx, Hpx) {
  const g = ctx.createLinearGradient(0, 0, 0, Hpx);
  g.addColorStop(0, '#241a4e'); g.addColorStop(0.55, '#c94a6e'); g.addColorStop(1, '#ff7a3c');
  ctx.fillStyle = g; ctx.fillRect(0, 0, Wpx, Hpx);
  ctx.fillStyle = '#ffd34d'; ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('A SOLMARINA STORY', 80, 120);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 96px sans-serif';
  ctx.fillText('SOLMARINA', 76, 220);
  ctx.fillStyle = '#ffe9a8'; ctx.font = 'bold 30px sans-serif';
  ctx.fillText('Six jobs. One city. No way back.', 80, 268);
  ctx.fillStyle = '#fff'; ctx.font = '16px sans-serif';
  ctx.fillText('Open-world crime in a sun-soaked coastal city — drive, steal, fight,', 80, 320);
  ctx.fillText('outrun the SCPD, and take the pier from Marlo.', 80, 344);
  ctx.fillStyle = '#ffd34d'; ctx.font = 'bold 20px sans-serif';
  ctx.fillText('▶  PRESS ENTER TO START', 80, 420);
  if (G.saveSlot) {
    ctx.fillStyle = '#7dff9a'; ctx.font = 'bold 18px sans-serif';
    ctx.fillText('▶  PRESS M TO CONTINUE  ·  Mission ' + (G.saveSlot.mission + 1) + ' · $' + G.saveSlot.money, 80, 452);
  }
  ctx.fillStyle = '#fff'; ctx.font = '15px sans-serif';
  ctx.fillText('WASD drive / walk · E enter & steal cars · F shoot · Q weapon · R radio · P pause · M map · C stats · G save · T taxi · V vigilante · Y race', 80, 520);
  ctx.fillText('6 story missions · taxi · vigilante · packages · races · respray · wanted 1–5 stars · heli pursuit', 80, 546);
  ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.font = '13px sans-serif';
  ctx.fillText('Original city, characters and story. Nothing from any commercial game.', 80, 690);
}
export function drawEndCard(ctx, title, sub, Wpx, Hpx) {
  ctx.fillStyle = 'rgba(10,10,16,0.72)'; ctx.fillRect(0, 0, Wpx, Hpx);
  ctx.textAlign = 'center';
  ctx.fillStyle = title === 'BUSTED' ? '#7dd8ff' : title === 'WASTED' ? '#ff4d4d' : '#ffd34d';
  ctx.font = 'bold 84px sans-serif';
  ctx.fillText(title, Wpx / 2, Hpx / 2 - 10);
  ctx.fillStyle = '#fff'; ctx.font = '18px sans-serif';
  ctx.fillText(sub, Wpx / 2, Hpx / 2 + 32);
  ctx.fillStyle = '#ffd34d'; ctx.font = 'bold 16px sans-serif';
  ctx.fillText('PRESS ENTER', Wpx / 2, Hpx / 2 + 72);
  ctx.textAlign = 'left';
}
export function drawMap(ctx, G, Wpx, Hpx) {
  ctx.fillStyle = 'rgba(10,14,20,0.88)'; ctx.fillRect(Wpx * 0.2, Hpx * 0.1, Wpx * 0.6, Hpx * 0.8);
  ctx.strokeStyle = '#ffd34d'; ctx.lineWidth = 2;
  ctx.strokeRect(Wpx * 0.2, Hpx * 0.1, Wpx * 0.6, Hpx * 0.8);
  ctx.fillStyle = '#ffd34d'; ctx.font = 'bold 26px sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('MAP OF SOLMARINA', Wpx * 0.2 + 24, Hpx * 0.1 + 44);
  ctx.fillStyle = '#fff'; ctx.font = '15px sans-serif';
  const districts = ['Marina Bay', 'Old Town', 'Palm Row', 'Harbor Docks', 'Neon Strip', 'Coral Heights'];
  districts.forEach((d, i) => {
    const y = Hpx * 0.1 + 84 + i * 40;
    ctx.fillStyle = d === G.district ? '#ffd34d' : '#fff';
    ctx.fillText((d === G.district ? '▶ ' : '·  ') + d, Wpx * 0.2 + 24, y);
    ctx.fillStyle = '#9fd8e8'; ctx.font = '12px sans-serif';
    ctx.fillText(['Pier & boardwalk', "Zola's Diner", 'Beachfront & hotels', 'Docks & warehouses', 'Clubs & spray shop', 'Hills & lookout'][i], Wpx * 0.2 + 260, y);
    ctx.font = '15px sans-serif';
  });
  ctx.fillStyle = '#7dff9a'; ctx.font = 'bold 15px sans-serif';
  ctx.fillText('You are here: ' + G.district + '  ·  ' + Math.round(G.z) + ' m along the Strip', Wpx * 0.2 + 24, Hpx * 0.1 + 84 + 6 * 40);
  ctx.fillStyle = '#fff'; ctx.font = '14px sans-serif';
  ctx.fillText('Missions done: ' + G.missionDone.filter(Boolean).length + ' / 6   ·   Packages: ' + G.packages + ' / ' + G.packagesTotal, Wpx * 0.2 + 24, Hpx * 0.1 + 84 + 6 * 40 + 28);
}
export function drawStats(ctx, G, Wpx, Hpx) {
  ctx.fillStyle = 'rgba(10,14,20,0.9)'; ctx.fillRect(Wpx * 0.16, Hpx * 0.08, Wpx * 0.68, Hpx * 0.84);
  ctx.strokeStyle = '#ffd34d'; ctx.lineWidth = 2;
  ctx.strokeRect(Wpx * 0.16, Hpx * 0.08, Wpx * 0.68, Hpx * 0.84);
  const x = Wpx * 0.16 + 28, y0 = Hpx * 0.08 + 40;
  ctx.fillStyle = '#ffd34d'; ctx.font = 'bold 26px sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('SOLMARINA — CAREER STATS', x, y0);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 16px sans-serif';
  ctx.fillText('STORY  ·  ' + G.missionDone.filter(Boolean).length + ' / 6 missions complete', x, y0 + 44);
  MISSIONS.forEach((m, i) => {
    ctx.fillStyle = G.missionDone[i] ? '#7dff9a' : '#aaa';
    ctx.font = '15px sans-serif';
    ctx.fillText((G.missionDone[i] ? '✓ ' : '·  ') + 'Mission ' + (i + 1) + ' — ' + m.name, x, y0 + 72 + i * 26);
  });
  const s = G.stats;
  const rows = [
    ['Money earned', '$' + s.earned.toLocaleString('en-US')],
    ['Cars stolen', String(s.stolen)],
    ['Taxi fares', String(s.fares)],
    ['Takedowns', String(s.kills)],
    ['Races won', String(s.races)],
    ['Packages found', G.packages + ' / ' + G.packagesTotal],
    ['Distance driven', (s.distance / 1000).toFixed(1) + ' km'],
    ['Shots fired / hits', s.fired + ' / ' + s.hits],
    ['Busted / Wasted', s.busted + ' / ' + s.wasted],
    ['Respect rank', G.rank + ' · ' + G.rp.toLocaleString('en-US') + ' RP'],
  ];
  ctx.fillStyle = '#ffd34d'; ctx.font = 'bold 16px sans-serif';
  ctx.fillText('CAREER', x, y0 + 72 + 6 * 26 + 18);
  rows.forEach((r, i) => {
    const y = y0 + 72 + 6 * 26 + 48 + i * 24;
    ctx.fillStyle = '#fff'; ctx.font = '15px sans-serif';
    ctx.fillText(r[0], x, y);
    ctx.textAlign = 'right'; ctx.fillText(r[1], Wpx * 0.84 - 28, y); ctx.textAlign = 'left';
  });
  ctx.fillStyle = '#9fd8e8'; ctx.font = '14px sans-serif';
  ctx.fillText('Save slot: ' + (G.saveSlot ? 'Mission ' + (G.saveSlot.mission + 1) + ' · $' + G.saveSlot.money : 'empty — press G in game to save'), x, Hpx * 0.08 + Hpx * 0.84 - 24);
}
export function drawEnding(ctx, G, Wpx, Hpx) {
  ctx.fillStyle = 'rgba(10,10,16,0.78)'; ctx.fillRect(0, 0, Wpx, Hpx);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd34d'; ctx.font = 'bold 54px sans-serif';
  ctx.fillText('SOLMARINA IS YOURS', Wpx / 2, Hpx * 0.32);
  ctx.fillStyle = '#fff'; ctx.font = '20px sans-serif';
  ctx.fillText('Marlo’s Regent burns at the pier. The Gulls salute you, Rio grins,', Wpx / 2, Hpx * 0.32 + 44);
  ctx.fillText('and Mama Zola puts your name on the diner wall. Six jobs. Done.', Wpx / 2, Hpx * 0.32 + 72);
  ctx.fillStyle = '#7dff9a'; ctx.font = 'bold 18px sans-serif';
  ctx.fillText('Final take: $' + G.money.toLocaleString('en-US') + '  ·  Rank ' + G.rank + '  ·  ' + G.stats.kills + ' takedowns', Wpx / 2, Hpx * 0.32 + 116);
  ctx.fillStyle = '#ffd34d'; ctx.font = 'bold 16px sans-serif';
  ctx.fillText('PRESS ENTER — free roam continues', Wpx / 2, Hpx * 0.32 + 156);
  ctx.textAlign = 'left';
}
bootGame();
