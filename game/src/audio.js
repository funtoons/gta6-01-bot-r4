// WebAudio synth: engine hum, sirens, gunshots and three radio stations.
// No audio files: every sound is an oscillator shaped in code.
export function startAudio() {
  let ctx = null;
  let master = null;
  let radioNodes = null;
  let radioTimer = 0;
  let noiseSeed = 1234567;
  function noiseRand() {
    noiseSeed = (Math.imul(noiseSeed, 1103515245) + 12345) | 0;
    return ((noiseSeed >>> 0) / 4294967296) * 2 - 1;
  }
  function ensure() {
    if (ctx) return ctx;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
    } catch { ctx = null; }
    return ctx;
  }
  function tone(freq, dur, type, vol, slide) {
    if (!ensure() || !ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t + dur);
    g.gain.setValueAtTime(vol || 0.2, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, vol, low) {
    if (!ensure() || !ctx) return;
    const t = ctx.currentTime;
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i += 1) d[i] = noiseRand() * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = low || 900;
    const g = ctx.createGain();
    g.gain.value = vol || 0.3;
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t);
  }
  function playSfx(name, G) {
    if (!ensure() || !ctx || (G && G.muted)) return;
    if (ctx.state === 'suspended') ctx.resume();
    if (name === 'shot') { noise(0.14, 0.5, 2400); tone(180, 0.08, 'square', 0.25, 60); }
    else if (name === 'punch') { noise(0.08, 0.4, 500); }
    else if (name === 'crash') { noise(0.4, 0.6, 700); tone(90, 0.3, 'sawtooth', 0.3, 40); }
    else if (name === 'pickup') { tone(660, 0.09, 'sine', 0.25); tone(990, 0.14, 'sine', 0.25); }
    else if (name === 'cash') { tone(880, 0.1, 'triangle', 0.3); tone(1320, 0.18, 'triangle', 0.3); }
    else if (name === 'siren') { tone(720, 0.35, 'sine', 0.12, 980); }
    else if (name === 'horn') { tone(330, 0.25, 'square', 0.15); tone(415, 0.25, 'square', 0.12); }
    else if (name === 'busted') { tone(440, 0.5, 'sawtooth', 0.25, 110); }
    else if (name === 'mission') { tone(523, 0.12, 'triangle', 0.3); tone(659, 0.12, 'triangle', 0.3); tone(784, 0.3, 'triangle', 0.3); }
    else if (name === 'door') { tone(200, 0.12, 'square', 0.2, 120); }
  }
  function radioTick(G, dt) {
    if (!ensure() || !ctx || G.muted) { radioTimer = 0; return; }
    radioTimer -= dt;
    if (radioTimer > 0) return;
    radioTimer = 0.42;
    const scale = G.station === 0 ? [0, 3, 5, 7, 10] : G.station === 1 ? [0, 2, 4, 7, 9] : [0, 5, 7, 10, 12];
    const base = G.station === 0 ? 220 : G.station === 1 ? 196 : 165;
    const n = scale[Math.floor(G.time * 2.4) % scale.length];
    tone(base * Math.pow(2, n / 12), 0.36, G.station === 2 ? 'sawtooth' : 'triangle', 0.07);
    if (Math.floor(G.time * 2.4) % 4 === 0) tone(base / 2, 0.3, 'sine', 0.12);
  }
  function engineHum(G) {
    if (!ensure() || !ctx || G.muted || G.onFoot) return;
    if (Math.floor(G.time * 8) % 8 !== 0) return;
    tone(50 + Math.abs(G.speed) * 2.2, 0.12, 'sawtooth', 0.05);
  }
  return { ensure, playSfx, radioTick, engineHum };
}
