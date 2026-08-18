import { useRef } from "react";
import type { PointerEvent as ReactPointerEvent, ReactNode, RefObject } from "react";
import type { Actions, UiState } from "../game/useSnakeGame";
import { DIFFICULTIES, DIFF_ORDER } from "../game/engine";
import {
  IconApple,
  IconArrowUp,
  IconBolt,
  IconPause,
  IconPlay,
  IconRestart,
  IconSwipe,
  IconTrophy,
} from "./icons";

interface Props {
  canvasRef: RefObject<HTMLCanvasElement>;
  boardRef: RefObject<HTMLDivElement>;
  ui: UiState;
  actions: Actions;
}

const CHIP =
  "flex min-w-[64px] flex-col items-center gap-0.5 rounded-md border border-line bg-deep px-2.5 py-1.5";
const CHIP_LABEL = "text-[9px] font-semibold tracking-[0.18em] text-fog";
const CHIP_VALUE = "font-display text-xs leading-none text-cream tabular-nums";

export default function GameBoard({ canvasRef, boardRef, ui, actions }: Props) {
  const swipeRef = useRef<{ x: number; y: number } | null>(null);

  const onPointerDown = (e: ReactPointerEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    swipeRef.current = { x: e.clientX, y: e.clientY };
    if (ui.status === "idle") actions.start();
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    const st = swipeRef.current;
    if (!st) return;
    const dx = e.clientX - st.x;
    const dy = e.clientY - st.y;
    const TH = 26;
    if (Math.abs(dx) < TH && Math.abs(dy) < TH) return;
    if (Math.abs(dx) > Math.abs(dy)) actions.setDirection({ x: dx > 0 ? 1 : -1, y: 0 });
    else actions.setDirection({ x: 0, y: dy > 0 ? 1 : -1 });
    swipeRef.current = { x: e.clientX, y: e.clientY };
  };

  const endSwipe = () => {
    swipeRef.current = null;
  };

  const centerAction = () => {
    if (ui.status === "running" || ui.status === "paused") actions.togglePause();
    else actions.start();
  };

  return (
    <div className="flex w-full flex-col gap-3">
      {/* ── scoreboard strip ── */}
      <div className="panel-card flex items-end justify-between gap-3 px-4 py-3">
        <div>
          <div className="text-[10px] font-semibold tracking-[0.24em] text-mint/80">SCORE</div>
          <div
            key={ui.score}
            className="anim-score-bump font-display text-3xl leading-tight text-cream tabular-nums sm:text-4xl"
          >
            {ui.score}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={CHIP}>
            <span className={`${CHIP_LABEL} flex items-center gap-1`}>
              <IconTrophy className="h-3 w-3 text-amber" /> BEST
            </span>
            <span className={`${CHIP_VALUE} text-amber`}>{ui.best}</span>
          </div>
          <div className={`${CHIP} hidden sm:flex`}>
            <span className={`${CHIP_LABEL} flex items-center gap-1`}>
              <IconApple className="h-3 w-3 text-mint" /> LEN
            </span>
            <span className={CHIP_VALUE}>{ui.length}</span>
          </div>
          <div className={CHIP}>
            <span className={`${CHIP_LABEL} flex items-center gap-1`}>
              <IconBolt className="h-3 w-3 text-coral" /> SPD
            </span>
            <span className={CHIP_VALUE}>{ui.speed.toFixed(2)}×</span>
          </div>
        </div>
      </div>

      {/* ── the pit ── */}
      <div className="relative mx-auto w-full max-w-[560px] lg:w-[min(100%,640px,calc(100dvh-260px))] lg:max-w-none">
        <div
          ref={boardRef}
          className="scanlines relative aspect-square w-full touch-none select-none overflow-hidden rounded-xl border border-line2 bg-deep shadow-[0_0_0_1px_rgba(6,13,9,0.9),0_20px_60px_-15px_rgba(0,0,0,0.75),0_0_70px_-25px_rgba(126,240,176,0.3)]"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endSwipe}
          onPointerCancel={endSwipe}
        >
          <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

          {/* corner brackets */}
          {[
            "left-2 top-2 border-l-2 border-t-2",
            "right-2 top-2 border-r-2 border-t-2",
            "bottom-2 left-2 border-b-2 border-l-2",
            "bottom-2 right-2 border-b-2 border-r-2",
          ].map((c) => (
            <div key={c} className={`pointer-events-none absolute h-4 w-4 border-mint/35 ${c}`} />
          ))}

          {ui.status === "idle" && <IdleOverlay ui={ui} actions={actions} />}
          {ui.status === "paused" && <PauseOverlay actions={actions} />}
          {ui.status === "over" && <OverOverlay ui={ui} actions={actions} />}
        </div>
      </div>

      {/* ── touch pad (phones & tablets) ── */}
      <div className="mx-auto grid w-full max-w-[250px] grid-cols-3 gap-2 lg:hidden">
        <div />
        <PadBtn label="Steer up" onPress={() => actions.setDirection({ x: 0, y: -1 })}>
          <IconArrowUp className="h-6 w-6" />
        </PadBtn>
        <div />
        <PadBtn label="Steer left" onPress={() => actions.setDirection({ x: -1, y: 0 })}>
          <IconArrowUp className="h-6 w-6 -rotate-90" />
        </PadBtn>
        <PadBtn label="Pause or start" onPress={centerAction} accent>
          {ui.status === "running" ? (
            <IconPause className="h-5 w-5" />
          ) : (
            <IconPlay className="h-5 w-5" />
          )}
        </PadBtn>
        <PadBtn label="Steer right" onPress={() => actions.setDirection({ x: 1, y: 0 })}>
          <IconArrowUp className="h-6 w-6 rotate-90" />
        </PadBtn>
        <div />
        <PadBtn label="Steer down" onPress={() => actions.setDirection({ x: 0, y: 1 })}>
          <IconArrowUp className="h-6 w-6 rotate-180" />
        </PadBtn>
        <div />
      </div>
    </div>
  );
}

/* ── overlays ─────────────────────────────────────────────────────────────── */

function IdleOverlay({ ui, actions }: { ui: UiState; actions: Actions }) {
  return (
    <div className="anim-pop-in absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-[rgba(6,13,9,0.78)] p-4 text-center">
      <div className="font-display text-[10px] tracking-[0.38em] text-mint/85">
        SERPENT ARCADE
      </div>
      <h1
        className="font-display text-5xl leading-none text-cream sm:text-6xl"
        style={{ textShadow: "4px 4px 0 #1d4630, 8px 8px 0 rgba(255,107,94,0.3)" }}
      >
        SNAKE
      </h1>
      <p className="max-w-[28ch] text-sm leading-snug text-fog">
        Eat apples. Grow long. Don't bite yourself — the walls don't forgive either.
      </p>

      <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
        {DIFF_ORDER.map((d) => {
          const active = ui.difficulty === d;
          return (
            <button
              key={d}
              onClick={() => actions.setDifficulty(d)}
              className={`btn-arcade border px-3.5 py-2 text-[11px] ${
                active
                  ? "border-mint/70 bg-mint/15 text-mint shadow-[0_3px_0_rgba(63,174,118,0.5)]"
                  : "border-line bg-deep/70 text-fog shadow-[0_3px_0_rgba(0,0,0,0.4)] hover:text-cream"
              }`}
            >
              {DIFFICULTIES[d].name}
            </button>
          );
        })}
      </div>

      <button
        onClick={actions.start}
        className="btn-arcade mt-1 flex items-center gap-2.5 bg-amber px-7 py-3.5 text-sm text-[#231a05] shadow-[0_5px_0_#9a6a15] hover:brightness-110"
      >
        <IconPlay className="h-4 w-4" />
        START GAME
      </button>

      <div className="anim-blink font-display text-[11px] tracking-[0.28em] text-amber">
        PRESS SPACE
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[11px] text-fog/85">
        <IconSwipe className="h-4 w-4 text-mint/70" />
        <span>swipe the board, or steer with</span>
        <span className="kbd">↑</span>
        <span className="kbd">←</span>
        <span className="kbd">↓</span>
        <span className="kbd">→</span>
        <span>/ WASD</span>
      </div>
    </div>
  );
}

function PauseOverlay({ actions }: { actions: Actions }) {
  return (
    <div className="anim-pop-in absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 bg-[rgba(6,13,9,0.72)] p-4 text-center">
      <IconPause className="h-9 w-9 text-amber" />
      <div
        className="font-display text-3xl text-amber"
        style={{ textShadow: "3px 3px 0 rgba(0,0,0,0.55)" }}
      >
        PAUSED
      </div>
      <div className="flex gap-2.5">
        <button
          onClick={actions.togglePause}
          className="btn-arcade flex items-center gap-2 bg-mint px-5 py-2.5 text-xs text-[#0c2417] shadow-[0_4px_0_#2b7a52] hover:brightness-110"
        >
          <IconPlay className="h-3.5 w-3.5" />
          RESUME
        </button>
        <button
          onClick={actions.restart}
          className="btn-arcade flex items-center gap-2 border border-line2 bg-deep px-5 py-2.5 text-xs text-cream shadow-[0_4px_0_rgba(0,0,0,0.45)] hover:bg-panel2"
        >
          <IconRestart className="h-3.5 w-3.5" />
          RESTART
        </button>
      </div>
      <div className="anim-blink font-display text-[10px] tracking-[0.28em] text-fog">
        SPACE TO RESUME
      </div>
    </div>
  );
}

function OverOverlay({ ui, actions }: { ui: UiState; actions: Actions }) {
  return (
    <div className="anim-pop-in-late absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[rgba(6,13,9,0.8)] p-4 text-center">
      <div
        className="font-display text-3xl text-coral sm:text-4xl"
        style={{ textShadow: "4px 4px 0 rgba(0,0,0,0.55)" }}
      >
        GAME OVER
      </div>

      {ui.newBest && (
        <div className="anim-badge-pop rounded-md border-2 border-amber bg-amber/15 px-3 py-1 font-display text-[11px] tracking-[0.2em] text-amber">
          ★ NEW BEST ★
        </div>
      )}

      <div>
        <div className="text-[10px] font-semibold tracking-[0.28em] text-fog">FINAL SCORE</div>
        <div className="font-display text-5xl text-cream tabular-nums">{ui.score}</div>
      </div>

      <div className="flex items-center gap-2 text-amber">
        <IconTrophy className="h-4 w-4" />
        <span className="font-display text-base tabular-nums">{ui.best}</span>
        <span className="text-xs text-fog">best · {DIFFICULTIES[ui.difficulty].name}</span>
      </div>

      <button
        onClick={actions.start}
        className="btn-arcade mt-1 flex items-center gap-2 bg-amber px-6 py-3 text-xs text-[#231a05] shadow-[0_5px_0_#9a6a15] hover:brightness-110"
      >
        <IconPlay className="h-3.5 w-3.5" />
        PLAY AGAIN
      </button>
      <div className="text-[11px] text-fog/85">
        <span className="kbd">SPACE</span> or <span className="kbd">R</span> to slither again
      </div>
    </div>
  );
}

/* ── touch pad button ─────────────────────────────────────────────────────── */

function PadBtn({
  children,
  onPress,
  label,
  accent,
}: {
  children: ReactNode;
  onPress: () => void;
  label: string;
  accent?: boolean;
}) {
  return (
    <button
      aria-label={label}
      onPointerDown={(e) => {
        e.preventDefault();
        onPress();
      }}
      className={`flex h-14 items-center justify-center rounded-lg border transition-[transform,background-color] duration-75 active:translate-y-0.5 ${
        accent
          ? "border-amber/50 bg-amber/10 text-amber active:bg-amber/25"
          : "border-line2 bg-panel2 text-mint active:bg-mint/15"
      }`}
    >
      {children}
    </button>
  );
}
