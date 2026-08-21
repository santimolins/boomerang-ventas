"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { VentasData, Funnel } from "@/lib/sheets";
import { formatEur, formatInt } from "@/lib/format";

const BLUE = "#4285f4";
const GREEN = "#34a853";
const GREY = "#9aa0a6";
const VIOLET = "#a142f4";

const axisStyle = { fontSize: 11, fill: "#5f6368" };

function ChartCard({
  title,
  children,
  empty,
}: {
  title: string;
  children: React.ReactNode;
  empty?: boolean;
}) {
  return (
    <div className="lk-card p-4">
      <h3 className="lk-card-title mb-3">{title}</h3>
      {empty ? (
        <div className="text-sm py-10 text-center" style={{ color: "var(--grey)" }}>
          Sin datos
        </div>
      ) : (
        children
      )}
    </div>
  );
}

export function ChartsRow({
  data,
  funnel,
  kam,
}: {
  data: VentasData;
  funnel: "Todos" | Funnel;
  kam: string; // "Todos" o nombre
}) {
  // ---- Actividad: cerradas vs objetivo por funnel ----
  const actividad = useMemo(
    () => data.actividad.filter((a) => funnel === "Todos" || a.funnel === funnel),
    [data.actividad, funnel],
  );

  // ---- Budget por comercial (apilado) ----
  const budgetKam = useMemo(() => {
    let rows = data.budgetKam;
    if (kam !== "Todos") rows = rows.filter((r) => r.kam === kam);
    return rows.map((r) => ({
      kam: r.kam,
      Nuevos: funnel === "Repetidores" ? 0 : r.nuevos,
      Repetidores: funnel === "Nuevos" ? 0 : r.repetidores,
    }));
  }, [data.budgetKam, kam, funnel]);

  const showNuevos = funnel !== "Repetidores";
  const showRepet = funnel !== "Nuevos";

  return (
    <div className="grid gap-3 grid-cols-1 lg:grid-cols-2 mt-3">
      <ChartCard title="Actividad — oportunidades cerradas vs objetivo" empty={actividad.length === 0}>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={actividad} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eceff1" vertical={false} />
            <XAxis dataKey="funnel" tick={axisStyle} axisLine={false} tickLine={false} />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip formatter={(v) => formatInt(Number(v))} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="cerradas" name="Cerradas" fill={BLUE} radius={[3, 3, 0, 0]} />
            <Bar dataKey="objetivo" name="Objetivo" fill={GREY} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Budget por comercial (€)" empty={budgetKam.length === 0}>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={budgetKam} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eceff1" vertical={false} />
            <XAxis dataKey="kam" tick={axisStyle} axisLine={false} tickLine={false} interval={0} angle={-20} textAnchor="end" height={50} />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
            <Tooltip formatter={(v) => formatEur(Number(v))} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {showNuevos && <Bar dataKey="Nuevos" stackId="b" fill={VIOLET} radius={[0, 0, 0, 0]} />}
            {showRepet && <Bar dataKey="Repetidores" stackId="b" fill={GREY} radius={[3, 3, 0, 0]} />}
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function HBars({
  title,
  rows,
}: {
  title: string;
  rows: { cerradas: number; ganadas: number; label: string }[];
}) {
  const height = Math.max(160, rows.length * 30 + 40);
  return (
    <ChartCard title={title} empty={rows.length === 0}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eceff1" horizontal={false} />
          <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="label"
            tick={axisStyle}
            axisLine={false}
            tickLine={false}
            width={140}
          />
          <Tooltip formatter={(v) => formatInt(Number(v))} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="cerradas" name="Cerradas" fill={BLUE} radius={[0, 3, 3, 0]} />
          <Bar dataKey="ganadas" name="Ganadas" fill={GREEN} radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function OrigenesRow({
  data,
  funnel,
}: {
  data: VentasData;
  funnel: "Todos" | Funnel;
}) {
  const origenes = data.origenes.map((o) => ({ label: o.origen, cerradas: o.cerradas, ganadas: o.ganadas }));
  const campanas = data.campanas.map((c) => ({ label: c.campana, cerradas: c.cerradas, ganadas: c.ganadas }));

  const showNuevos = funnel !== "Repetidores";
  const showRepet = funnel !== "Nuevos";

  return (
    <div className="grid gap-3 grid-cols-1 lg:grid-cols-2 mt-3">
      {showNuevos && <HBars title="Nuevos clientes por origen" rows={origenes} />}
      {showRepet && <HBars title="Clientes repetidores por origen (campañas)" rows={campanas} />}
    </div>
  );
}
