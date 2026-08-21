"use client";

import type { VentasData } from "@/lib/sheets";
import {
  formatEur,
  formatInt,
  formatPct,
  formatPp,
  semaforo,
  SEMAFORO_COLOR,
  SEMAFORO_TEXTO,
} from "@/lib/format";

function Trend({ value, isEur }: { value: number; isEur?: boolean }) {
  if (!value) return <span style={{ color: "var(--muted)" }}>· sin cambio</span>;
  const up = value > 0;
  const color = up ? "var(--green)" : "var(--red)";
  const txt = isEur ? formatEur(Math.abs(value)) : formatInt(Math.abs(value));
  return (
    <span style={{ color }}>
      · {up ? "▲" : "▼"} {txt}
    </span>
  );
}

function ProgressBar({ consecucion, pace }: { consecucion: number; pace: number }) {
  const color = SEMAFORO_COLOR[semaforo(consecucion, pace)];
  const fill = Math.max(0, Math.min(consecucion * 100, 100));
  const mark = Math.max(0, Math.min(pace * 100, 100));
  return (
    <div
      className="relative w-full my-2"
      style={{ height: 6, background: "#eceff1", borderRadius: 999 }}
    >
      <div
        style={{ width: `${fill}%`, height: "100%", background: color, borderRadius: 999 }}
      />
      {/* marca ▎ del objetivo esperado a hoy (pace) */}
      <div
        title="Objetivo esperado a hoy"
        style={{
          position: "absolute",
          left: `${mark}%`,
          top: -2,
          height: 10,
          width: 2,
          background: "var(--ink)",
          borderRadius: 1,
        }}
      />
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="lk-card p-4 flex flex-col">{children}</div>;
}

function Title({ children }: { children: React.ReactNode }) {
  return <h3 className="lk-card-title mb-2">{children}</h3>;
}

export function Scorecards({ data }: { data: VentasData }) {
  const { budget, nuevosGan, repetGan, conversion } = data.scorecards;
  const pace = data.pace.ratio;

  const budgetCons = budget.objetivo > 0 ? budget.actual / budget.objetivo : 0;
  const nuevosCons = nuevosGan.objetivo > 0 ? nuevosGan.actual / nuevosGan.objetivo : 0;
  const repetCons = repetGan.objetivo > 0 ? repetGan.actual / repetGan.objetivo : 0;

  const ritmoTxt = (cons: number) => SEMAFORO_TEXTO[semaforo(cons, pace)];

  return (
    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {/* Budget del mes */}
      <Card>
        <Title>Budget del mes</Title>
        <div className="text-2xl font-medium tabular" style={{ color: "var(--ink)" }}>
          {formatEur(budget.actual)}
        </div>
        <ProgressBar consecucion={budgetCons} pace={pace} />
        <div className="text-xs" style={{ color: "var(--muted)" }}>
          {formatPct(budgetCons)} de {formatEur(budget.objetivo)} · {ritmoTxt(budgetCons)}{" "}
          <Trend value={budget.wow} isEur />
        </div>
      </Card>

      {/* Nuevos clientes ganados */}
      <Card>
        <Title>Nuevos clientes ganados</Title>
        <div className="text-2xl font-medium tabular" style={{ color: "var(--ink)" }}>
          {formatInt(nuevosGan.actual)}
          <span className="text-base" style={{ color: "var(--muted)" }}>
            {" "}
            / {formatInt(nuevosGan.objetivo)}
          </span>
        </div>
        <ProgressBar consecucion={nuevosCons} pace={pace} />
        <div className="text-xs" style={{ color: "var(--muted)" }}>
          {formatPct(nuevosCons)} · {ritmoTxt(nuevosCons)} <Trend value={nuevosGan.wow} />
        </div>
      </Card>

      {/* Clientes repetidores ganados */}
      <Card>
        <Title>Clientes repetidores ganados</Title>
        <div className="text-2xl font-medium tabular" style={{ color: "var(--ink)" }}>
          {formatInt(repetGan.actual)}
          <span className="text-base" style={{ color: "var(--muted)" }}>
            {" "}
            / {formatInt(repetGan.objetivo)}
          </span>
        </div>
        <ProgressBar consecucion={repetCons} pace={pace} />
        <div className="text-xs" style={{ color: "var(--muted)" }}>
          {formatPct(repetCons)} · {ritmoTxt(repetCons)} <Trend value={repetGan.wow} />
        </div>
      </Card>

      {/* Conversion cerr -> gan */}
      <Card>
        <Title>Conversión cerr → gan</Title>
        <div className="text-2xl font-medium tabular" style={{ color: "var(--ink)" }}>
          {formatPct(conversion.nuevos)} <span className="text-sm" style={{ color: "var(--muted)" }}>N</span>
          <span style={{ color: "var(--line)" }}> · </span>
          {formatPct(conversion.repetidores)} <span className="text-sm" style={{ color: "var(--muted)" }}>R</span>
        </div>
        <div className="text-xs mt-3" style={{ color: "var(--muted)" }}>
          <PpDelta value={conversion.wowNuevosPp} label="N" />
          {"  "}
          <PpDelta value={conversion.wowRepetPp} label="R" />
        </div>
      </Card>
    </div>
  );
}

function PpDelta({ value, label }: { value: number; label: string }) {
  const up = value > 0;
  const flat = Math.abs(value) < 0.005;
  const color = flat ? "var(--muted)" : up ? "var(--green)" : "var(--red)";
  const arrow = flat ? "" : up ? "▲ " : "▼ ";
  return (
    <span style={{ color }}>
      {arrow}
      {formatPp(Math.abs(value))} {label}
    </span>
  );
}
