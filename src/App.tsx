import { useRef } from "react";
import { useSnakeGame } from "./game/useSnakeGame";
import GameBoard from "./components/GameBoard";
import SidePanel from "./components/SidePanel";
import {
  IconMark,
  IconPause,
  IconPlay,
  IconRestart,
  IconSoundOff,
  IconSoundOn,
  IconTrophy,
} from "./components/icons";

const LAMP: Record<string, { dot: string; text: string; label: string }> = {
  idle: { dot: "bg-fog/70 text-fog/70", text: "text-fog", label: "READY" },
  running: { dot: "bg-mint text-mint", text: "text-mint", label: "LIVE" },
  paused: { dot: "bg-amber text-amber", text: "text-amber", label: "PAUSED" },
  over: { dot: "bg-coral text-coral", text: "text-coral", label: "K.O." },
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const { ui, actions, bests } = useSnakeGame(canvasRef, boardRef);
  const lamp = LAMP[ui.status];

  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-clip">
      <Backdrop />

      {/* ── marquee header ── */}
      <header className="relative z-10 border-b border-line/70 bg-pit/85 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-line2 bg-panel text-mint shadow-[0_0_24px_-6px_rgba(126,240,176,0.5)]">
              <IconMark className="h-6 w-6" />
            </span>
            <div>
              <div
                className="font-display text-xl leading-none text-cream"
                style={{ textShadow: "2px 2px 0 #1d4630" }}
              >
                SNAKE
              </div>
              <div className="mt-1 text-[10px] font-semibold tracking-[0.32em] text-fog">
                SERPENT ARCADE
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-md border border-line bg-deep/70 px-2.5 py-2 sm:flex">
              <span className={`anim-lamp h-2 w-2 rounded-full ${lamp.dot}`} />
              <span className={`font-display text-[10px] tracking-[0.22em] ${lamp.text}`}>
                {lamp.label}
              </span>
            </div>
            <div
              className="flex items-center gap-1.5 rounded-md border border-line bg-deep/70 px-2.5 py-2"
              title={`Best score on ${ui.difficulty.toUpperCase()}`}
            >
              <IconTrophy className="h-3.5 w-3.5 text-amber" />
              <span className="font-display text-xs text-cream tabular-nums">{ui.best}</span>
            </div>
            {ui.status !== "idle" && (
              <>
                <button
                  onClick={actions.togglePause}
                  disabled={ui.status === "over"}
                  aria-label={ui.status === "paused" ? "Resume" : "Pause"}
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-line bg-deep/70 text-fog transition-colors hover:border-line2 hover:text-mint disabled:opacity-40"
                >
                  {ui.status === "paused" ? (
                    <IconPlay className="h-4 w-4" />
                  ) : (
                    <IconPause className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={actions.restart}
                  aria-label="Restart"
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-line bg-deep/70 text-fog transition-colors hover:border-line2 hover:text-coral"
                >
                  <IconRestart className="h-4 w-4" />
                </button>
              </>
            )}
            <button
              onClick={actions.toggleMute}
              aria-label={ui.muted ? "Unmute" : "Mute"}
              className={`flex h-9 w-9 items-center justify-center rounded-md border transition-colors ${
                ui.muted
                  ? "border-coral/40 bg-coral/10 text-coral"
                  : "border-line bg-deep/70 text-fog hover:border-line2 hover:text-mint"
              }`}
            >
              {ui.muted ? (
                <IconSoundOff className="h-4 w-4" />
              ) : (
                <IconSoundOn className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── cabinet floor ── */}
      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-4 py-5 lg:flex-row lg:items-start lg:gap-6">
        <div className="min-w-0 flex-1">
          <GameBoard canvasRef={canvasRef} boardRef={boardRef} ui={ui} actions={actions} />
        </div>
        <aside className="w-full shrink-0 lg:w-[320px]">
          <SidePanel ui={ui} actions={actions} bests={bests} />
        </aside>
      </main>

      {/* ── footer strip ── */}
      <footer className="relative z-10 border-t border-line/70 bg-pit/70">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 text-[11px] text-fog/85">
          <div className="hidden items-center gap-1.5 md:flex">
            <span className="kbd">SPACE</span>
            <span>pause</span>
            <span className="text-line2">·</span>
            <span className="kbd">R</span>
            <span>restart</span>
            <span className="text-line2">·</span>
            <span className="kbd">1–3</span>
            <span>difficulty</span>
            <span className="text-line2">·</span>
            <span className="kbd">M</span>
            <span>sound</span>
          </div>
          <div className="md:hidden">Swipe the board or use the arrow pad to steer.</div>
          <div>
            Golden apples <strong className="text-amber">+10</strong> · venom fruit{" "}
            <strong className="text-coral">+50</strong> — grab it before it rots
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ── ambient backdrop: layered glows, faint grid, drifting fireflies ──────── */

function Backdrop() {
  const flies = Array.from({ length: 14 }, (_, i) => ({
    left: `${(i * 61 + 7) % 100}%`,
    top: `${(i * 37 + 13) % 100}%`,
    delay: `${((i * 1.7) % 12).toFixed(1)}s`,
    dur: `${(11 + (i % 5) * 2.6).toFixed(1)}s`,
    color: i % 3 === 0 ? "rgba(255,194,75,0.7)" : "rgba(126,240,176,0.6)",
  }));

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(55% 42% at 14% 6%, rgba(126,240,176,0.075), transparent 70%)," +
            "radial-gradient(45% 36% at 88% 10%, rgba(255,194,75,0.055), transparent 70%)," +
            "radial-gradient(52% 46% at 76% 94%, rgba(255,107,94,0.05), transparent 70%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(126,240,176,0.03) 1px, transparent 1px)," +
            "linear-gradient(90deg, rgba(126,240,176,0.03) 1px, transparent 1px)",
          backgroundSize: "34px 34px",
          maskImage: "radial-gradient(75% 70% at 50% 38%, black, transparent)",
          WebkitMaskImage: "radial-gradient(75% 70% at 50% 38%, black, transparent)",
        }}
      />
      {flies.map((f, i) => (
        <span
          key={i}
          className="firefly"
          style={{
            left: f.left,
            top: f.top,
            background: f.color,
            animationDelay: f.delay,
            animationDuration: f.dur,
          }}
        />
      ))}
    </div>
  );
}
