// The six story jobs: start, stage, and complete each one, then the ending.
import { addMoney, addRespect, setBanner, setDialog } from './state.js';
import { burst } from './vehicles.js';
import { spawnSmoke } from './effects.js';
export function startMission(G, idx, audio) {
  G.mission = idx; G.stage = 0;
  const M = MISSIONS[idx];
  G.objective = M.stages[0].text;
  G.next = M.stages[1] ? M.stages[1].text : 'Finish the job';
  G.objTimer = M.stages[0].timer || 0;
  setDialog(G, M.giver, M.role, M.intro, 6);
  setBanner(G, 'MISSION ' + (idx + 1) + ' — ' + M.name.toUpperCase(), M.giver + ' · ' + M.place);
  if (audio) audio.playSfx('mission', G);
  setupStage(G);
}
export const MISSIONS = [
  { name: 'First Job', giver: 'MAMA ZOLA', role: 'Diner Owner', place: "Zola's Diner, Old Town", intro: 'Rio, honey — take this parcel to the pier. Cops are thick tonight, so keep it smooth.', stages: [
    { text: 'Walk to the diner marker', type: 'goto', dz: 150 },
    { text: 'Pick up the parcel', type: 'pickup' },
    { text: 'Deliver it to the pier', type: 'goto', dz: 900 },
  ] },
  { name: 'Joyride', giver: 'RIO', role: 'Wheelman', place: 'Neon Strip', intro: 'We need wheels, fast. Jack a car, then spray it before SCPD boxes you in.', stages: [
    { text: 'Steal a car (E near traffic)', type: 'steal' },
    { text: 'Outrun the heat', type: 'survive', timer: 20 },
    { text: 'Respray at the spray shop', type: 'spray' },
  ] },
  { name: 'Taxi Nights', giver: 'MAMA ZOLA', role: 'Diner Owner', place: 'Palm Row', intro: 'Tourists pay double after dark. Two fares, no complaints, no cops.', stages: [
    { text: 'Pick up a rider (T near a flagging ped)', type: 'fare', count: 1 },
    { text: 'Drop the rider at the marker', type: 'dropoff' },
    { text: 'One more fare, same deal', type: 'fare', count: 2 },
  ] },
  { name: 'The Gulls', giver: 'VEX', role: 'The Gulls', place: 'Harbor Docks', intro: 'Marlo’s crew runs the docks. Wreck his runner — ram it or shoot it, I don’t care.', stages: [
    { text: 'Find Marlo’s runner (V to mark it)', type: 'mark' },
    { text: 'Wreck the runner', type: 'wreck' },
    { text: 'Lose the heat', type: 'cool', timer: 15 },
  ] },
  { name: 'Harbor Run', giver: 'RIO', role: 'Wheelman', place: 'Harbor Docks', intro: 'Three checkpoints, one clock. Beat it and the whole Strip knows your name.', stages: [
    { text: 'Race: checkpoint 1 of 3', type: 'race', cp: 1 },
    { text: 'Race: checkpoint 2 of 3', type: 'race', cp: 2 },
    { text: 'Race: final checkpoint', type: 'race', cp: 3 },
  ] },
  { name: 'Storm the Pier', giver: 'MAMA ZOLA', role: 'Diner Owner', place: 'Marina Bay', intro: 'Marlo himself is running for the pier. Wreck his Regent before it reaches the water.', stages: [
    { text: 'Chase Marlo’s Regent', type: 'chase' },
    { text: 'Wreck the Regent', type: 'wreck' },
    { text: 'Vanish before the air unit arrives', type: 'cool', timer: 12 },
  ] },
];
export function setupStage(G) {
  const st = MISSIONS[G.mission].stages[G.stage];
  if (!st) return;
  if (st.type === 'goto' || st.type === 'pickup') {
    const dz = st.dz || 400;
    G.markers = [{ z: G.z + dz, x: 0, kind: st.type === 'pickup' ? 'parcel' : 'flag', label: st.text }];
  } else if (st.type === 'dropoff') {
    G.markers = [{ z: G.z + 500, x: 0, kind: 'flag', label: 'Drop-off' }];
  } else if (st.type === 'race') {
    G.race.next = G.z + 500 + st.cp * 300;
    G.markers = [{ z: G.race.next, x: 0, kind: 'gate', label: 'CHECKPOINT ' + st.cp }];
  } else G.markers = [];
  if (st.type === 'wreck' || st.type === 'chase') ensureTarget(G);
  if (st.type === 'survive' || st.type === 'cool') G.objTimer = st.timer || 15;
}
export function ensureTarget(G) {
  if (G.vig.target && G.vig.active) return;
  const t = { name: G.mission === 5 ? "MARLO'S REGENT" : "MARLO'S RUNNER", z: G.z + 180, x: 0.3, speed: 34, hp: 120, color: '#c0392b', cond: 100, top: 60 };
  G.vig.target = t; G.vig.active = true; G.vig.hits = 0;
}
export function updateMissions(G, audio, dt) {
  if (G.ending || G.mission > 5) return;
  const M = MISSIONS[G.mission];
  const st = M.stages[G.stage];
  if (!st) return;
  if (st.timer && (st.type === 'survive' || st.type === 'cool')) {
    G.objTimer -= dt;
    if (st.type === 'survive' && G.objTimer <= 0) return advanceStage(G, audio);
    if (st.type === 'cool' && G.objTimer <= 0 && G.wanted === 0) return advanceStage(G, audio);
    if (st.type === 'cool' && G.objTimer <= 0 && G.wanted > 0) G.objTimer = 5;
  }
  if (st.type === 'goto' || st.type === 'pickup' || st.type === 'dropoff') {
    const mk = G.markers[0];
    if (mk && Math.abs(G.z - mk.z) < 30 && Math.abs(G.x - mk.x) < 0.8) {
      if (st.type === 'pickup') { G.packages += 1; }
      G.markers = [];
      return advanceStage(G, audio);
    }
  }
  if (st.type === 'steal' && !G.onFoot) return advanceStage(G, audio);
  if (st.type === 'spray' && G.wanted === 0) return advanceStage(G, audio);
  if (st.type === 'fare' && G.taxi.fare >= st.count) return advanceStage(G, audio);
  if (st.type === 'mark' && G.vig.active) return advanceStage(G, audio);
  if ((st.type === 'wreck' || st.type === 'chase') && G.vig.target) {
    const t = G.vig.target;
    t.z += t.speed * dt;
    t.x += (G.x - t.x) * 0.2 * dt;
    if (st.type === 'chase' && Math.abs(t.z - G.z) < 120) return advanceStage(G, audio);
    if (st.type === 'wreck' && t.hp <= 0) {
      burst(G, t.z, t.x, '#c0392b');
      spawnSmoke(G, t.z, t.x, 10);
      G.vig.active = false; G.vig.target = null;
      return advanceStage(G, audio);
    }
    if (!G.onFoot && Math.abs(t.z - G.z) < 8 && Math.abs(t.x - G.x) < 0.2 && Math.abs(G.speed) > 12) {
      t.hp -= 40 * dt; G.speed *= (1 - 0.4 * dt); G.shake = Math.max(G.shake, 0.4);
      if (t.hp <= 0) {
        burst(G, t.z, t.x, '#c0392b');
        spawnSmoke(G, t.z, t.x, 10);
        G.vig.active = false; G.vig.target = null;
        return advanceStage(G, audio);
      }
    }
    if (t.z < G.z - 200) { t.z = G.z + 150; }
  }
  if (st.type === 'race') {
    if (G.z >= G.race.next) {
      G.race.cp += 1;
      if (G.race.cp >= st.cp) return advanceStage(G, audio);
      G.race.next = G.z + 500;
      G.markers = [{ z: G.race.next, x: 0, kind: 'gate', label: 'CHECKPOINT ' + (st.cp + 1) }];
    }
  }
}
export function advanceStage(G, audio) {
  const M = MISSIONS[G.mission];
  G.stage += 1;
  if (audio) audio.playSfx('mission', G);
  if (G.stage >= M.stages.length) return completeMission(G, audio);
  const st = M.stages[G.stage];
  G.objective = st.text;
  G.next = M.stages[G.stage + 1] ? M.stages[G.stage + 1].text : 'Finish the job';
  setupStage(G);
}
export function completeMission(G, audio) {
  const M = MISSIONS[G.mission];
  G.missionDone[G.mission] = true;
  const pay = [400, 600, 500, 900, 800, 1500][G.mission];
  addMoney(G, pay);
  addRespect(G, [300, 450, 350, 700, 600, 1200][G.mission]);
  setBanner(G, 'MISSION COMPLETE — ' + M.name.toUpperCase(), '+' + pay + ' · Respect up');
  setDialog(G, M.giver, M.role, M.name + ' done. ' + (G.mission === 5 ? 'Solmarina is ours now.' : 'Come see me for the next one.'), 5);
  if (audio) audio.playSfx('cash', G);
  if (G.mission >= 5) { G.ending = true; G.endT = 0; G.screen = 'ending'; return; }
  startMission(G, G.mission + 1, audio);
}
