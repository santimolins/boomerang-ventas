"use client";

import { useMemo } from "react";
import type { Ganado, VentasData, Funnel } from "@/lib/sheets";
import { formatEur } from "@/lib/format";

function fechaCorta(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso || "—";
}

function Table({ title, rows }: { title: string; rows: Ganado[] }) {
  return (
    <div className="lk-card p-4">
      <h3 className="lk-card-title mb-3">
        {title} <span style={{ color: "var(--ink)" }}>({rows.length})</span>
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full" style={{ fontSize: 12 }}>
          <thead>
            <tr style={{ color: "var(--muted)", textAlign: "left" }}>
              <th className="font-medium py-1 pr-2">Empresa</th>
              <th className="font-medium py-1 pr-2">KAM</th>
              <th className="font-medium py-1 pr-2">Origen</th>
              <th className="font-medium py-1 pl-2 text-right">Valor</th>
              <th className="font-medium py-1 pl-2 text-right">Fecha ganado</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-center" style={{ color: "var(--grey)" }}>
                  Sin ganados
                </td>
              </tr>
            )}
            {rows.map((g, i) => (
              <tr key={`${g.empresa}-${i}`} style={{ borderTop: "1px solid var(--line)" }}>
                <td className="py-1.5 pr-2" style={{ color: "var(--ink)" }}>
                  {g.empresa || "—"}
                </td>
                <td className="py-1.5 pr-2" style={{ color: "var(--muted)" }}>
                  {g.kam || "—"}
                </td>
                <td className="py-1.5 pr-2" style={{ color: "var(--muted)" }}>
                  {g.origen || "—"}
                </td>
                <td className="py-1.5 pl-2 text-right tabular" style={{ color: "var(--ink)" }}>
                  {g.valor > 0 ? formatEur(g.valor) : "—"}
                </td>
                <td className="py-1.5 pl-2 text-right tabular" style={{ color: "var(--muted)" }}>
                  {fechaCorta(g.fecha)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function GanadosTables({
  data,
  kam,
  funnel,
}: {
  data: VentasData;
  kam: string;
  funnel: "Todos" | Funnel;
}) {
  const filt = (rows: Ganado[]) =>
    kam === "Todos" ? rows : rows.filter((r) => r.kam === kam);

  const nuevos = useMemo(() => filt(data.ganados.nuevos), [data.ganados.nuevos, kam]);
  const repetidores = useMemo(() => filt(data.ganados.repetidores), [data.ganados.repetidores, kam]);

  const showNuevos = funnel !== "Repetidores";
  const showRepet = funnel !== "Nuevos";

  return (
    <div className="grid gap-3 grid-cols-1 lg:grid-cols-2 mt-3">
      {showNuevos && <Table title="Ganados — Nuevos clientes" rows={nuevos} />}
      {showRepet && <Table title="Ganados — Repetidores" rows={repetidores} />}
    </div>
  );
}
