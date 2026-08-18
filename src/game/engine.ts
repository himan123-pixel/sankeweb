// ── Serpent Arcade · core game engine (pure, no React) ──────────────────────

export type Vec = { x: number; y: number };
export type Difficulty = "easy" | "normal" | "hard";
export type Status = "idle" | "running" | "paused" | "over";

export const COLS = 21;
export const ROWS = 21;

export interface DiffSpec {
  name: string;
  tag: string;
  tickMs: number;
  minTickMs: number;
  accel: number; // ms shaved off the tick per apple eaten
  desc: string;
}

export const DIFFICULTIES: Record<Difficulty, DiffSpec> = {
  easy: {
    name: "GARDEN",
    tag: "EASY",
    tickMs: 152,
    minTickMs: 98,
    accel: 1.7,
    desc: "A lazy coil. Find your rhythm.",
  },
  normal: {
    name: "JUNGLE",
    tag: "NORMAL",
    tickMs: 114,
    minTickMs: 72,
    accel: 1.5,
    desc: "The classic hunt. Stay sharp.",
  },
  hard: {
    name: "VENOM",
    tag: "HARD",
    tickMs: 80,
    minTickMs: 52,
    accel: 1.1,
    desc: "Strike speed. Zero mercy.",
  },
};

export const DIFF_ORDER: Difficulty[] = ["easy", "normal", "hard"];

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
  grav: number;
}

export interface Popup {
  x: number;
  y: number;
  text: string;
  life: number;
  max: number;
  color: string;
  size: number;
}

export interface GameState {
  snake: Vec[];
  prevSnake: Vec[];
  dir: Vec;
  queue: Vec[];
  food: Vec;
  bonus: { pos: Vec; ttl: number; max: number } | null;
  tickMs: number;
  acc: number;
  time: number;
  score: number;
  foods: number;
  status: Status;
  attract: boolean;
  overAt: number;
  particles: Particle[];
  popups: Popup[];
  shake: number;
  flash: number;
}

const key = (x: number, y: number) => x + "," + y;

export function createGame(attract: boolean): GameState {
  const snake: Vec[] = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
    { x: 7, y: 10 },
  ];
  const s: GameState = {
    snake,
    prevSnake: snake.map((p) => ({ ...p })),
    dir: { x: 1, y: 0 },
    queue: [],
    food: { x: 15, y: 10 },
    bonus: null,
    tickMs: attract ? 128 : DIFFICULTIES.normal.tickMs,
    acc: 0,
    time: 0,
    score: 0,
    foods: 0,
    status: "running", // the engine runs; the UI decides what to show
    attract,
    overAt: 0,
    particles: [],
    popups: [],
    shake: 0,
    flash: 0,
  };
  s.food = randomFree(s) ?? s.food;
  return s;
}

export function resetRun(s: GameState, diff: Difficulty): void {
  const fresh = createGame(false);
  Object.assign(s, fresh);
  s.attract = false;
  s.tickMs = DIFFICULTIES[diff].tickMs;
  s.status = "running";
}

export function randomFree(s: GameState): Vec | null {
  const taken = new Set<string>();
  for (const p of s.snake) taken.add(key(p.x, p.y));
  taken.add(key(s.food.x, s.food.y));
  if (s.bonus) taken.add(key(s.bonus.pos.x, s.bonus.pos.y));
  const free: Vec[] = [];
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (!taken.has(key(x, y))) free.push({ x, y });
    }
  }
  if (free.length === 0) return null;
  return free[Math.floor(Math.random() * free.length)];
}

export function pushDir(s: GameState, v: Vec): void {
  const last = s.queue.length > 0 ? s.queue[s.queue.length - 1] : s.dir;
  if (v.x === -last.x && v.y === -last.y) return; // no 180° reversals
  if (v.x === last.x && v.y === last.y) return; // ignore duplicates
  if (s.queue.length < 3) s.queue.push({ ...v });
}

export function burst(
  s: GameState,
  gx: number,
  gy: number,
  colors: string[],
  n: number,
  power: number,
): void {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = (0.6 + Math.random() * 1.6) * power;
    s.particles.push({
      x: gx + 0.5,
      y: gy + 0.5,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - power * 0.4,
      life: 0.45 + Math.random() * 0.4,
      max: 0.85,
      size: 0.09 + Math.random() * 0.13,
      color: colors[i % colors.length],
      grav: 9,
    });
  }
  if (s.particles.length > 140) s.particles.splice(0, s.particles.length - 140);
}

function popup(s: GameState, x: number, y: number, text: string, color: string, size = 0.52): void {
  s.popups.push({ x: x + 0.5, y: y + 0.3, text, life: 0.95, max: 0.95, color, size });
}

function die(s: GameState): void {
  s.status = "over";
  s.overAt = s.time;
  s.flash = 1;
  s.shake = 10;
  const head = s.snake[0];
  burst(s, head.x, head.y, ["#ff6b5e", "#ffc24b", "#f2ead8"], 22, 5.2);
  for (let i = 0; i < s.snake.length; i += 3) {
    const p = s.snake[i];
    burst(s, p.x, p.y, ["#ff6b5e", "#3fae76"], 3, 2.4);
  }
}

/** Advance one grid tick. Mutates state. */
export function stepGame(s: GameState, diff: Difficulty): void {
  s.prevSnake = s.snake.map((p) => ({ ...p }));

  if (s.attract) {
    s.dir = aiChoose(s);
  } else if (s.queue.length > 0) {
    const next = s.queue.shift()!;
    if (!(next.x === -s.dir.x && next.y === -s.dir.y)) s.dir = next;
  }

  const head = s.snake[0];
  const nx = head.x + s.dir.x;
  const ny = head.y + s.dir.y;

  const hitWall = nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS;
  const eatsFood = !hitWall && nx === s.food.x && ny === s.food.y;
  const eatsBonus =
    !hitWall && s.bonus !== null && nx === s.bonus.pos.x && ny === s.bonus.pos.y;

  // The tail cell vacates this tick unless the snake grows.
  const body = eatsFood ? s.snake : s.snake.slice(0, -1);
  const hitSelf = !hitWall && body.some((p) => p.x === nx && p.y === ny);

  if (hitWall || hitSelf) {
    die(s);
    return;
  }

  s.snake = [{ x: nx, y: ny }, ...body];

  if (eatsFood) {
    const spec = DIFFICULTIES[diff];
    s.score += 10;
    s.foods += 1;
    s.tickMs = Math.max(spec.minTickMs, s.tickMs - spec.accel);
    s.shake = Math.max(s.shake, 2.5);
    burst(s, nx, ny, ["#ffc24b", "#7ef0b0", "#f2ead8"], 13, 3.6);
    popup(s, nx, ny, "+10", "#ffc24b");
    const spot = randomFree(s);
    if (spot) {
      s.food = spot;
    } else {
      s.food = { x: -99, y: -99 }; // board is full — nothing left to eat
      popup(s, head.x, head.y - 1, "BOARD FULL!", "#7ef0b0", 0.4);
    }
    if (s.foods % 5 === 0 && s.bonus === null) {
      const b = randomFree(s);
      if (b) s.bonus = { pos: b, ttl: 6500, max: 6500 };
    }
  }

  if (eatsBonus && s.bonus) {
    s.score += 50;
    s.shake = Math.max(s.shake, 4);
    burst(s, nx, ny, ["#ff6b5e", "#ffc24b", "#f2ead8"], 20, 4.6);
    popup(s, nx, ny, "+50", "#ff6b5e", 0.6);
    s.bonus = null;
  }
}

/** Greedy attract-mode brain: chase the apple, avoid walls & itself. */
function aiChoose(s: GameState): Vec {
  const head = s.snake[0];
  const occ = new Set<string>();
  for (const p of s.snake) occ.add(key(p.x, p.y));
  const target = s.bonus && s.bonus.ttl > 1200 ? s.bonus.pos : s.food;

  const opts: Vec[] = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ].filter((v) => !(v.x === -s.dir.x && v.y === -s.dir.y));

  let best: Vec = s.dir;
  let bestScore = -Infinity;

  for (const v of opts) {
    const nx = head.x + v.x;
    const ny = head.y + v.y;
    if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue;
    if (occ.has(key(nx, ny))) continue;
    let sc = 20 - (Math.abs(nx - target.x) + Math.abs(ny - target.y));
    // prefer cells with breathing room
    const neighbors: Vec[] = [
      { x: nx + 1, y: ny },
      { x: nx - 1, y: ny },
      { x: nx, y: ny + 1 },
      { x: nx, y: ny - 1 },
    ];
    for (const n of neighbors) {
      const inBounds = n.x >= 0 && n.y >= 0 && n.x < COLS && n.y < ROWS;
      if (inBounds && !occ.has(key(n.x, n.y))) sc += 1.1;
    }
    sc += Math.random() * 0.6; // a little serpent whimsy
    if (sc > bestScore) {
      bestScore = sc;
      best = v;
    }
  }
  return best;
}

/** Per-frame juice: decay shakes/flashes, move particles, tick down the bonus. */
export function updateFx(s: GameState, dt: number): void {
  s.time += dt;
  s.shake = Math.max(0, s.shake - dt * 26);
  s.flash = Math.max(0, s.flash - dt * 1.7);

  if (s.bonus !== null) {
    s.bonus.ttl -= dt * 1000;
    if (s.bonus.ttl <= 0) {
      burst(s, s.bonus.pos.x, s.bonus.pos.y, ["#ff6b5e", "#8faf9c"], 8, 2);
      s.bonus = null;
    }
  }

  for (let i = s.particles.length - 1; i >= 0; i--) {
    const p = s.particles[i];
    p.life -= dt;
    if (p.life <= 0) {
      s.particles.splice(i, 1);
      continue;
    }
    p.vy += p.grav * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }

  for (let i = s.popups.length - 1; i >= 0; i--) {
    const p = s.popups[i];
    p.life -= dt;
    if (p.life <= 0) s.popups.splice(i, 1);
  }
}
