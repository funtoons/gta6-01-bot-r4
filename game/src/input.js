// Keyboard + mouse input: one object of held keys and one-shot actions.
export function bindInput(canvas, G) {
  const keys = {};
  const acts = {};
  function down(e) {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    keys[k] = true;
    if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();
    if (e.key === 'Enter' || e.key === ' ') acts.confirm = true;
    if (e.key === 'Escape' || e.key.toLowerCase() === 'p') acts.pause = true;
    if (e.key.toLowerCase() === 'm') acts.map = true;
    if (e.key.toLowerCase() === 'e') acts.act = true;
    if (e.key.toLowerCase() === 'f') acts.fire = true;
    if (e.key.toLowerCase() === 'r') acts.radio = true;
    if (e.key.toLowerCase() === 'g') acts.save = true;
    if (e.key.toLowerCase() === 't') acts.taxi = true;
    if (e.key.toLowerCase() === 'v') acts.vig = true;
    if (e.key.toLowerCase() === 'c') acts.stats = true;
    if (e.key.toLowerCase() === 'q') acts.weapon = true;
    if (e.key.toLowerCase() === 'y') acts.race = true;
    if (e.key.toLowerCase() === 'h') acts.horn = true;
  }
  function up(e) {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    keys[k] = false;
  }
  window.addEventListener('keydown', down);
  window.addEventListener('keyup', up);
  canvas.addEventListener('mousedown', (e) => { acts.fire = true; acts.mx = e.clientX; acts.my = e.clientY; });
  return {
    keys, acts,
    drive() {
      const upK = keys.w || keys.ArrowUp;
      const dnK = keys.s || keys.ArrowDown;
      const lf = keys.a || keys.ArrowLeft;
      const rt = keys.d || keys.ArrowRight;
      return { gas: upK ? 1 : dnK ? -0.6 : 0, steer: (lf ? -1 : 0) + (rt ? 1 : 0), brake: keys[' '] ? 1 : 0 };
    },
    walk() {
      const upK = keys.w || keys.ArrowUp;
      const dnK = keys.s || keys.ArrowDown;
      const lf = keys.a || keys.ArrowLeft;
      const rt = keys.d || keys.ArrowRight;
      return { fwd: (upK ? 1 : 0) - (dnK ? 1 : 0), side: (rt ? 1 : 0) - (lf ? 1 : 0), run: !!keys.Shift };
    },
    takeActions() { const a = { ...acts }; for (const k in acts) delete acts[k]; return a; },
  };
}
