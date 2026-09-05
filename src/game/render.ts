// ── Canvas renderer: board, snake (interpolated), food, particles, popups ──

import { COLS, ROWS } from "./engine";
import type { GameState, Status } from "./engine";

const HEAD = "#8ff7b6";
const TAIL = "#2e9e67";
const FOOD = "#ffc24b";
const BONUS = "#ff6b5e";
const CREAM = "#f2ead8";
const CORAL = "#ff6b5e";

const rgbCache = new Map<string, [number, number, number]>();

function rgb(hex: string): [number, number, number] {
  let c = rgbCache.get(hex);
  if (!c) {
    c = [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16),
    ];
    rgbCache.set(hex, c);
  }
  return c;
}

function mix(a: string, b: string, t: number): string {
  const ca = rgb(a);
  const cb = rgb(b);
  const r = Math.round(ca[0] + (cb[0] - ca[0]) * t);
  const g = Math.round(ca[1] + (cb[1] - ca[1]) * t);
  const bl = Math.round(ca[2] + (cb[2] - ca[2]) * t);
  return `rgb(${r},${g},${bl})`;
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export function draw(
  ctx: CanvasRenderingContext2D,
  s: GameState,
  w: number,
  h: number,
  dpr: number,
  uiStatus: Status,
): void {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  const cell = w / COLS;

  ctx.save();
  if (s.shake > 0.1) {
    ctx.translate((Math.random() - 0.5) * s.shake, (Math.random() - 0.5) * s.shake);
  }

  // ── board base + checkerboard ──
  ctx.fillStyle = "#0c1811";
  ctx.fillRect(-8, -8, w + 16, h + 16);
  ctx.fillStyle = "#0e1c14";
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if ((x + y) % 2 === 0) ctx.fillRect(x * cell, y * cell, cell, cell);
    }
  }

  // faint grid lines
  ctx.strokeStyle = "rgba(126,240,176,0.035)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 1; i < COLS; i++) {
    ctx.moveTo(i * cell, 0);
    ctx.lineTo(i * cell, h);
  }
  for (let i = 1; i < ROWS; i++) {
    ctx.moveTo(0, i * cell);
    ctx.lineTo(w, i * cell);
  }
  ctx.stroke();

  // vignette
  const vg = ctx.createRadialGradient(w / 2, h / 2, w * 0.32, w / 2, h / 2, w * 0.78);
  vg.addColorStop(0, "rgba(4,10,7,0)");
  vg.addColorStop(1, "rgba(4,10,7,0.42)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, w, h);

  // inner frame glow
  ctx.strokeStyle = "rgba(126,240,176,0.09)";
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, w - 2, h - 2);

  // ── food (pulsing apple) ──
  if (s.food.x >= 0) {
    const pulse = 1 + 0.12 * Math.sin(s.time * 5);
    const fx = (s.food.x + 0.5) * cell;
    const fy = (s.food.y + 0.5) * cell;
    const r = cell * 0.3 * pulse;
    ctx.save();
    ctx.shadowColor = "rgba(255,194,75,0.8)";
    ctx.shadowBlur = cell * 0.7;
    ctx.fillStyle = FOOD;
    ctx.beginPath();
    ctx.arc(fx, fy + cell * 0.03, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // leaf + stem
    ctx.strokeStyle = "#7a5a22";
    ctx.lineWidth = Math.max(1.5, cell * 0.06);
    ctx.beginPath();
    ctx.moveTo(fx, fy - r * 0.85);
    ctx.lineTo(fx + r * 0.18, fy - r * 1.25);
    ctx.stroke();
    ctx.save();
    ctx.translate(fx + r * 0.55, fy - r * 1.15);
    ctx.rotate(-0.5);
    ctx.fillStyle = "#3fae76";
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.5, r * 0.24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // shine
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.beginPath();
    ctx.arc(fx - r * 0.32, fy - r * 0.25, r * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── bonus fruit (timed diamond) ──
  if (s.bonus) {
    const b = s.bonus;
    const bx = (b.pos.x + 0.5) * cell;
    const by = (b.pos.y + 0.5) * cell;
    const frac = clamp01(b.ttl / b.max);
    const urgent = b.ttl < 1600;
    const alpha = urgent ? 0.45 + 0.55 * Math.abs(Math.sin(s.time * 10)) : 1;
    const r = cell * 0.34 * (1 + 0.1 * Math.sin(s.time * 7));
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(bx, by);
    ctx.rotate(s.time * 2.2);
    ctx.shadowColor = "rgba(255,107,94,0.85)";
    ctx.shadowBlur = cell * 0.8;
    ctx.fillStyle = BONUS;
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(r * 0.78, 0);
    ctx.lineTo(0, r);
    ctx.lineTo(-r * 0.78, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.beginPath();
    ctx.arc(-r * 0.2, -r * 0.25, r * 0.16, 0, Math.PI * 2);
    ctx.fill();
    ctx.rotate(-s.time * 2.2);
    // countdown ring
    ctx.strokeStyle = BONUS;
    ctx.lineWidth = Math.max(2, cell * 0.09);
    ctx.beginPath();
    ctx.arc(0, 0, cell * 0.52, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac);
    ctx.stroke();
    ctx.restore();
  }

  // ── snake ──
  const t = clamp01(s.acc / s.tickMs);
  const pts: { x: number; y: number }[] = new Array(s.snake.length);
  for (let i = 0; i < s.snake.length; i++) {
    const cur = s.snake[i];
    const prev = s.prevSnake[i] ?? cur;
    pts[i] = {
      x: (prev.x + (cur.x - prev.x) * t + 0.5) * cell,
      y: (prev.y + (cur.y - prev.y) * t + 0.5) * cell,
    };
  }

  let tint = 0;
  if (s.status === "over" && !s.attract) {
    tint = 0.35 + 0.4 * (0.5 + 0.5 * Math.sin(s.time * 20));
  }
  const headCol = mix(HEAD, CORAL, tint);
  const tailCol = mix(TAIL, CORAL, tint * 0.85);

  ctx.save();
  if (s.attract && uiStatus === "idle") ctx.globalAlpha = 0.42;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const len = pts.length;
  for (let i = len - 1; i >= 1; i--) {
    const f = 1 - i / Math.max(1, len - 1); // 0 at tail → 1 at head
    ctx.strokeStyle = mix(tailCol, headCol, f);
    ctx.lineWidth = cell * (0.5 + 0.28 * f);
    ctx.beginPath();
    ctx.moveTo(pts[i].x, pts[i].y);
    ctx.lineTo(pts[i - 1].x, pts[i - 1].y);
    ctx.stroke();
  }

  // head
  const hp = pts[0];
  ctx.save();
  ctx.shadowColor = "rgba(143,247,182,0.75)";
  ctx.shadowBlur = cell * 0.65;
  ctx.fillStyle = headCol;
  ctx.beginPath();
  ctx.arc(hp.x, hp.y, cell * 0.46, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // eyes (look where the serpent is going)
  const d = s.dir;
  const px = -d.y;
  const py = d.x;
  for (const side of [-1, 1]) {
    const ex = hp.x + d.x * cell * 0.17 + px * side * cell * 0.17;
    const ey = hp.y + d.y * cell * 0.17 + py * side * cell * 0.17;
    ctx.fillStyle = "#f4fff7";
    ctx.beginPath();
    ctx.arc(ex, ey, cell * 0.115, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#122018";
    ctx.beginPath();
    ctx.arc(ex + d.x * cell * 0.045, ey + d.y * cell * 0.045, cell * 0.058, 0, Math.PI * 2);
    ctx.fill();
  }
  // tongue flick
  if (Math.sin(s.time * 3.1) > 0.55) {
    ctx.strokeStyle = "#ff6b5e";
    ctx.lineWidth = Math.max(1.2, cell * 0.05);
    ctx.beginPath();
    const tx = hp.x + d.x * cell * 0.46;
    const ty = hp.y + d.y * cell * 0.46;
    ctx.moveTo(tx, ty);
    ctx.lineTo(tx + d.x * cell * 0.22, ty + d.y * cell * 0.22);
    ctx.stroke();
  }
  ctx.restore();

  // ── particles (additive glow) ──
  if (s.particles.length > 0) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const p of s.particles) {
      const a = clamp01(p.life / p.max);
      ctx.globalAlpha = a * 0.9;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x * cell, p.y * cell, p.size * cell * (0.5 + a * 0.7), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // ── floating score popups ──
  for (const p of s.popups) {
    const a = clamp01(p.life / p.max);
    const rise = (1 - a) * cell * 1.3;
    const size = Math.max(10, Math.round(cell * p.size));
    ctx.font = `700 ${size}px "Silkscreen", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.globalAlpha = a;
    ctx.fillStyle = "rgba(6,13,9,0.85)";
    ctx.fillText(p.text, p.x * cell + 2, p.y * cell - rise + 2);
    ctx.fillStyle = p.color;
    ctx.fillText(p.text, p.x * cell, p.y * cell - rise);
    ctx.globalAlpha = 1;
  }

  // ── death flash ──
  if (s.flash > 0) {
    ctx.fillStyle = `rgba(255,107,94,${(s.flash * 0.24).toFixed(3)})`;
    ctx.fillRect(0, 0, w, h);
  }

  ctx.restore();
}
