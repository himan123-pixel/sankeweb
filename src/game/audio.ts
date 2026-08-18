// ── Tiny WebAudio synth for arcade blips. No assets, lazy-initialized. ──────

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;

type Win = Window & { webkitAudioContext?: typeof AudioContext };

function ensure(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as Win).webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.38;
      master.connect(ctx.destination);
    } catch {
      return null;
    }
  }
  if (ctx.state === "suspended") void ctx.resume().catch(() => {});
  return ctx;
}

function tone(
  freq: number,
  dur: number,
  type: OscillatorType,
  vol: number,
  slideTo?: number,
  delay = 0,
): void {
  const c = ensure();
  if (!c || !master || muted) return;
  const t0 = c.currentTime + delay;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), t0 + dur);
  }
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.linearRampToValueAtTime(vol, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain);
  gain.connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export const sfx = {
  get muted(): boolean {
    return muted;
  },
  unlock(): void {
    ensure();
  },
  toggle(): boolean {
    muted = !muted;
    return muted;
  },
  eat(): void {
    tone(540, 0.08, "square", 0.5);
    tone(810, 0.1, "square", 0.38, undefined, 0.055);
  },
  bonus(): void {
    [660, 880, 1320].forEach((f, i) => tone(f, 0.13, "triangle", 0.5, undefined, i * 0.07));
  },
  die(): void {
    tone(300, 0.45, "sawtooth", 0.42, 58);
    tone(150, 0.55, "square", 0.26, 42, 0.09);
  },
  start(): void {
    [440, 554, 659, 880].forEach((f, i) => tone(f, 0.09, "square", 0.3, undefined, i * 0.06));
  },
  pause(): void {
    tone(520, 0.07, "square", 0.28);
    tone(390, 0.1, "square", 0.28, undefined, 0.07);
  },
  resume(): void {
    tone(390, 0.07, "square", 0.28);
    tone(540, 0.1, "square", 0.28, undefined, 0.07);
  },
};
