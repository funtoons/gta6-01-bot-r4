// Solmarina config: every tuning number of the game in one place.
export function gameConfig() {
  return {
    step: 1 / 60,
    segLen: 2,
    roadWidth: 7,
    drawSegs: 320,
    camDepth: 0.84,
    camHeightCar: 1150,
    camHeightFoot: 820,
    maxSpeed: 62,
    accel: 34,
    brake: 70,
    offroad: 16,
    walkSpeed: 7,
    runSpeed: 11,
    turnRate: 2.4,
    gravity: 1,
    saveKey: 'solmarina-save-v1',
    width: 1280,
    height: 720,
  };
}
export const STEP = 1 / 60;
export const SEG = 2;
export const ROAD_W = 7;
export const DRAW = 320;
export const CAM_DEPTH = 0.84;
export const MAX_SPEED = 62;
export const WALK = 7;
export const SAVE_KEY = 'solmarina-save-v1';
export const DISTRICTS = ['Marina Bay', 'Old Town', 'Palm Row', 'Harbor Docks', 'Neon Strip', 'Coral Heights'];
export const CARS = [
  { name: 'Solmarina Comet', color: '#e8632c', top: 58 },
  { name: 'Coral Cruiser', color: '#2ca8a0', top: 50 },
  { name: 'Sunset Stallion', color: '#d9b23a', top: 62 },
  { name: 'Harbor Hauler', color: '#7a6ff0', top: 46 },
  { name: 'Palm Runner', color: '#e84a7a', top: 55 },
  { name: 'Dune Buggy', color: '#8fce3a', top: 52 },
];
export const WEAPONS = [
  { name: 'FISTS', ammo: Infinity, dmg: 12, rate: 0.35 },
  { name: 'PISTOL', ammo: 60, dmg: 26, rate: 0.28 },
  { name: 'SMG', ammo: 120, dmg: 16, rate: 0.09 },
  { name: 'SHOTGUN', ammo: 24, dmg: 55, rate: 0.8 },
];
export const STATIONS = ['SOLMARINA FM 98.1', 'PALM WAVE 104.4', 'HARBOUR ROCK 91.7'];
