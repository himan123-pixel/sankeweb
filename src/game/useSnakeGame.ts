// ── React glue: rAF loop, fixed-tick stepping, input, UI snapshot sync ──────

import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import {
  createGame,
  resetRun,
  stepGame,
  updateFx,
  pushDir,
  DIFFICULTIES,
} from "./engine";
import type { Difficulty, GameState, Status, Vec } from "./engine";
import { draw } from "./render";
import { sfx } from "./audio";

export interface UiState {
  status: Status;
  score: number;
  best: number;
  newBest: boolean;
  foods: number;
  length: number;
  speed: number;
  difficulty: Difficulty;
  muted: boolean;
}

export interface Actions {
  start: () => void;
  restart: () => void;
  togglePause: () => void;
  setDirection: (v: Vec) => void;
  setDifficulty: (d: Difficulty) => void;
  toggleMute: () => void;
}

const BEST_KEY = "serpent-arcade.best.";
const DIFF_KEY = "serpent-arcade.difficulty";
const MUTE_KEY = "serpent-arcade.muted";

function loadBest(d: Difficulty): number {
  try {
    return Math.max(0, Number(localStorage.getItem(BEST_KEY + d)) || 0);
  } catch {
    return 0;
  }
}

function saveBest(d: Difficulty, v: number): void {
  try {
    localStorage.setItem(BEST_KEY + d, String(v));
  } catch {
    /* private mode — scores just won't persist */
  }
}

function loadDifficulty(): Difficulty {
  try {
    const v = localStorage.getItem(DIFF_KEY);
    if (v === "easy" || v === "normal" || v === "hard") return v;
  } catch {
    /* ignore */
  }
  return "normal";
}

export function useSnakeGame(
  canvasRef: RefObject<HTMLCanvasElement>,
  boardRef: RefObject<HTMLDivElement>,
) {
  const stateRef = useRef<GameState>(createGame(true));
  const diffRef = useRef<Difficulty>(loadDifficulty());
  const bestRef = useRef<Record<Difficulty, number>>({
    easy: loadBest("easy"),
    normal: loadBest("normal"),
    hard: loadBest("hard"),
  });
  const newBestRef = useRef(false);
  const lastKeyRef = useRef("");
  const prevSnapRef = useRef<UiState | null>(null);

  const buildSnapshot = useCallback((): UiState => {
    const s = stateRef.current;
    return {
      status: s.attract ? "idle" : s.status,
      score: s.score,
      best: bestRef.current[diffRef.current],
      newBest: newBestRef.current,
      foods: s.foods,
      length: s.attract ? 0 : s.snake.length,
      speed: s.attract
        ? 1
        : Math.round((DIFFICULTIES[diffRef.current].tickMs / s.tickMs) * 100) / 100,
      difficulty: diffRef.current,
      muted: sfx.muted,
    };
  }, []);

  const [ui, setUi] = useState<UiState>(() => buildSnapshot());

  // ── main loop ──
  useEffect(() => {
    let raf = 0;
    let last = performance.now();

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const s = stateRef.current;

      if (s.status === "running") {
        s.acc += dt * 1000;
        let guard = 0;
        while (s.acc >= s.tickMs && guard++ < 8) {
          s.acc -= s.tickMs;
          stepGame(s, diffRef.current);
          if (s.status !== "running") break;
        }
        if (s.status !== "running") s.acc = 0;
      }
      updateFx(s, dt);

      // attract mode: respawn the demo serpent shortly after it crashes
      if (s.attract && s.status === "over" && s.time - s.overAt > 0.7) {
        Object.assign(s, createGame(true));
      }

      const canvas = canvasRef.current;
      const ctx = canvas ? canvas.getContext("2d") : null;
      if (canvas && ctx) {
        const dpr = Number(canvas.dataset.dpr ?? 1);
        draw(ctx, s, canvas.width / dpr, canvas.height / dpr, dpr, s.attract ? "idle" : s.status);
      }

      const snap = buildSnapshot();
      const k = JSON.stringify(snap);
      if (k !== lastKeyRef.current) {
        const prev = prevSnapRef.current;
        if (prev) {
          if (snap.status === "over" && prev.status !== "over") {
            sfx.die();
            if (snap.score > bestRef.current[snap.difficulty]) {
              bestRef.current[snap.difficulty] = snap.score;
              newBestRef.current = snap.score > 0;
              saveBest(snap.difficulty, snap.score);
              snap.best = snap.score;
              snap.newBest = newBestRef.current;
            }
          }
          if (snap.foods > prev.foods) sfx.eat();
          if (snap.score - prev.score >= 50 && snap.foods === prev.foods) sfx.bonus();
          if (snap.status === "paused" && prev.status === "running") sfx.pause();
          if (snap.status === "running" && prev.status === "paused") sfx.resume();
        }
        prevSnapRef.current = snap;
        lastKeyRef.current = JSON.stringify(snap);
        setUi(snap);
      }
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [buildSnapshot, canvasRef]);

  // ── keep the canvas sized to its frame (crisp at any DPR) ──
  useEffect(() => {
    const el = boardRef.current;
    const canvas = canvasRef.current;
    if (!el || !canvas) return;
    const ro = new ResizeObserver(() => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const r = el.getBoundingClientRect();
      const w = Math.max(1, Math.round(r.width * dpr));
      const h = Math.max(1, Math.round(r.height * dpr));
      if (canvas.width !== w) canvas.width = w;
      if (canvas.height !== h) canvas.height = h;
      canvas.dataset.dpr = String(dpr);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [boardRef, canvasRef]);

  // ── restore mute preference ──
  useEffect(() => {
    try {
      if (localStorage.getItem(MUTE_KEY) === "1" && !sfx.muted) sfx.toggle();
    } catch {
      /* ignore */
    }
  }, []);

  // ── actions ──
  const start = useCallback(() => {
    sfx.unlock();
    const s = stateRef.current;
    if (!s.attract && s.status === "running") return;
    newBestRef.current = false;
    resetRun(s, diffRef.current);
    lastKeyRef.current = "";
    sfx.start();
  }, []);

  const restart = useCallback(() => {
    sfx.unlock();
    const s = stateRef.current;
    if (s.attract) return;
    newBestRef.current = false;
    resetRun(s, diffRef.current);
    lastKeyRef.current = "";
    sfx.start();
  }, []);

  const togglePause = useCallback(() => {
    const s = stateRef.current;
    if (s.attract) return;
    if (s.status === "running") s.status = "paused";
    else if (s.status === "paused") s.status = "running";
    else return;
    lastKeyRef.current = "";
  }, []);

  const setDirection = useCallback((v: Vec) => {
    const s = stateRef.current;
    if (s.attract) {
      newBestRef.current = false;
      resetRun(s, diffRef.current);
      sfx.unlock();
    }
    if (s.status === "running") pushDir(s, v);
    lastKeyRef.current = "";
  }, []);

  const setDifficulty = useCallback((d: Difficulty) => {
    diffRef.current = d;
    try {
      localStorage.setItem(DIFF_KEY, d);
    } catch {
      /* ignore */
    }
    const s = stateRef.current;
    if (s.attract) s.tickMs = DIFFICULTIES[d].tickMs;
    lastKeyRef.current = "";
  }, []);

  const toggleMute = useCallback(() => {
    sfx.toggle();
    try {
      localStorage.setItem(MUTE_KEY, sfx.muted ? "1" : "0");
    } catch {
      /* ignore */
    }
    lastKeyRef.current = "";
  }, []);

  // ── keyboard ──
  useEffect(() => {
    const dirMap: Record<string, Vec> = {
      ArrowUp: { x: 0, y: -1 },
      KeyW: { x: 0, y: -1 },
      ArrowDown: { x: 0, y: 1 },
      KeyS: { x: 0, y: 1 },
      ArrowLeft: { x: -1, y: 0 },
      KeyA: { x: -1, y: 0 },
      ArrowRight: { x: 1, y: 0 },
      KeyD: { x: 1, y: 0 },
    };
    const onKey = (e: KeyboardEvent) => {
      const code = e.code;
      const dir = dirMap[code];
      if (dir) {
        e.preventDefault();
        setDirection(dir);
        return;
      }
      if (code === "Space" || code === "Enter") {
        e.preventDefault();
        const s = stateRef.current;
        if (code === "Enter") {
          if (s.attract || s.status !== "running") start();
          return;
        }
        if (s.attract) {
          start();
        } else if (s.status === "running" || s.status === "paused") {
          togglePause();
        } else if (s.status === "over") {
          start();
        }
        return;
      }
      if (code === "KeyR") {
        restart();
        return;
      }
      if (code === "KeyM") {
        toggleMute();
        return;
      }
      if (code === "Digit1") setDifficulty("easy");
      if (code === "Digit2") setDifficulty("normal");
      if (code === "Digit3") setDifficulty("hard");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setDirection, start, togglePause, restart, toggleMute, setDifficulty]);

  // ── auto-pause when the tab hides ──
  useEffect(() => {
    const onVis = () => {
      const s = stateRef.current;
      if (document.hidden && !s.attract && s.status === "running") {
        s.status = "paused";
        lastKeyRef.current = "";
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  return {
    ui,
    actions: { start, restart, togglePause, setDirection, setDifficulty, toggleMute } as Actions,
    bests: bestRef.current,
  };
}
