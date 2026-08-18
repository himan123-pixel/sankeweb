import type { Actions, UiState } from "../game/useSnakeGame";
import { DIFFICULTIES, DIFF_ORDER } from "../game/engine";
import type { Difficulty } from "../game/engine";
import { IconSwipe, IconTrophy } from "./icons";

interface Props {
  ui: UiState;
  actions: Actions;
  bests: Record<Difficulty, number>;
}

const TAG_TONE: Record<Difficulty, string> = {
  easy: "border-mint/50 text-mint",
  normal: "border-amber/50 text-amber",
  hard: "border-coral/55 text-coral",
};

export default function SidePanel({ ui, actions, bests }: Props) {
  return (
    <section className="flex flex-col gap-4">
      {/* ── difficulty ── */}
      <div className="panel-card p-4">
        <h2 className="mb-3 font-display text-[11px] tracking-[0.28em] text-mint/85">
          DIFFICULTY
        </h2>
        <div className="flex flex-col gap-2">
          {DIFF_ORDER.map((d) => {
            const spec = DIFFICULTIES[d];
            const active = ui.difficulty === d;
            return (
              <button
                key={d}
                onClick={() => actions.setDifficulty(d)}
                aria-pressed={active}
                className={`relative rounded-lg border p-3 text-left transition-colors ${
                  active
                    ? "border-mint/60 bg-mint/[0.08]"
                    : "border-line bg-deep/60 hover:border-line2 hover:bg-panel2"
                }`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className={`font-display text-sm ${active ? "text-cream" : "text-fog"}`}>
                    {spec.name}
                  </span>
                  <span
                    className={`rounded border px-1.5 py-0.5 font-display text-[9px] tracking-[0.12em] ${TAG_TONE[d]}`}
                  >
                    {spec.tag}
                  </span>
                </span>
                <span className="mt-1 block text-xs leading-snug text-fog">{spec.desc}</span>
                {active && (
                  <span className="absolute bottom-3 left-0 top-3 w-1 rounded-r bg-mint" />
                )}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-fog/75">
          Keys <span className="kbd">1</span> <span className="kbd">2</span>{" "}
          <span className="kbd">3</span> switch mode
          {ui.status === "running" && (
            <>
              {" "}
              — applies next run, press <span className="kbd">R</span> to restart now
            </>
          )}
          .
        </p>
      </div>

      {/* ── high scores ── */}
      <div className="panel-card p-4">
        <h2 className="mb-3 flex items-center gap-2 font-display text-[11px] tracking-[0.28em] text-mint/85">
          <IconTrophy className="h-3.5 w-3.5 text-amber" />
          HIGH SCORES
        </h2>
        <ul className="flex flex-col gap-1.5">
          {DIFF_ORDER.map((d) => {
            const current = ui.difficulty === d;
            return (
              <li
                key={d}
                className={`flex items-center justify-between rounded-md px-2.5 py-2 ${
                  current ? "border border-line bg-panel2" : "bg-deep/50"
                }`}
              >
                <span
                  className={`font-display text-[11px] ${current ? "text-mint" : "text-fog"}`}
                >
                  {DIFFICULTIES[d].name}
                </span>
                <span className="font-display text-sm text-amber tabular-nums">{bests[d]}</span>
              </li>
            );
          })}
        </ul>
        <p className="mt-2.5 text-[11px] text-fog/70">Saved locally in this browser.</p>
      </div>

      {/* ── controls ── */}
      <div className="panel-card p-4">
        <h2 className="mb-3 font-display text-[11px] tracking-[0.28em] text-mint/85">CONTROLS</h2>
        <ul className="flex flex-col gap-2.5">
          <ControlRow label="STEER">
            <span className="kbd">↑</span>
            <span className="kbd">←</span>
            <span className="kbd">↓</span>
            <span className="kbd">→</span>
            <span className="text-[10px] text-fog/70">or WASD</span>
          </ControlRow>
          <ControlRow label="PAUSE">
            <span className="kbd">SPACE</span>
          </ControlRow>
          <ControlRow label="RESTART">
            <span className="kbd">R</span>
          </ControlRow>
          <ControlRow label="SOUND">
            <span className="kbd">M</span>
          </ControlRow>
        </ul>
        <div className="mt-3.5 flex items-start gap-2 rounded-md border border-line bg-deep/60 p-2.5 text-[11px] leading-snug text-fog">
          <IconSwipe className="mt-0.5 h-4 w-4 shrink-0 text-mint/75" />
          <span>
            On touch screens: <strong className="text-cream">swipe</strong> anywhere on the board,
            or tap the arrow pad under it.
          </span>
        </div>
      </div>

      {/* ── field notes ── */}
      <div className="panel-card p-4 text-[12px] leading-relaxed text-fog">
        <h2 className="mb-2 font-display text-[11px] tracking-[0.28em] text-mint/85">
          FIELD NOTES
        </h2>
        <p>
          Golden apples are worth <strong className="text-amber">+10</strong> and every bite makes
          the serpent a touch faster. Every 5th apple lures out{" "}
          <strong className="text-coral">venom fruit</strong> worth{" "}
          <strong className="text-coral">+50</strong> — but it rots in seconds.
        </p>
      </div>
    </section>
  );
}

function ControlRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <li className="flex items-center justify-between gap-3">
      <span className="text-[11px] font-semibold tracking-[0.14em] text-fog">{label}</span>
      <span className="flex items-center gap-1">{children}</span>
    </li>
  );
}
