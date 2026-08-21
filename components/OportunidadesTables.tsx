"use client";

import { useMemo } from "react";
import type { Oportunidad, VentasData, Funnel } from "@/lib/sheets";
import { formatEur } from "@/lib/format";

function Table({ title, rows }: { title: string; rows: Oportunidad[] }) {
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
              <th className="font-medium py-1 pr-2">Etapa</th>
              <th className="font-medium py-1 pl-2 text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-center" style={{ color: "var(--grey)" }}>
                  Sin oportunidades
                </td>
              </tr>
            )}
            {rows.map((o, i) => (
              <tr key={`${o.empresa}-${i}`} style={{ borderTop: "1px solid var(--line)" }}>
                <td className="py-1.5 pr-2" style={{ color: "var(--ink)" }}>
                  {o.empresa || "—"}
                </td>
                <td className="py-1.5 pr-2" style={{ color: "var(--muted)" }}>
                  {o.kam || "—"}
                </td>
                <td className="py-1.5 pr-2" style={{ color: "var(--muted)" }}>
                  {o.origen || "—"}
                </td>
                <td className="py-1.5 pr-2" style={{ color: "var(--muted)" }}>
                  {o.etapa || "—"}
                </td>
                <td className="py-1.5 pl-2 text-right tabular" style={{ color: "var(--ink)" }}>
                  {o.valor > 0 ? formatEur(o.valor) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function OportunidadesTables({
  data,
  kam,
  funnel,
}: {
  data: VentasData;
  kam: string;
  funnel: "Todos" | Funnel;
}) {
  const filt = (rows: Oportunidad[]) =>
    (kam === "Todos" ? rows : rows.filter((r) => r.kam === kam))
      .slice()
      .sort((a, b) => a.kam.localeCompare(b.kam) || a.origen.localeCompare(b.origen));

  const nuevos = useMemo(() => filt(data.oportunidades.nuevos), [data.oportunidades.nuevos, kam]);
  const repetidores = useMemo(
    () => filt(data.oportunidades.repetidores),
    [data.oportunidades.repetidores, kam],
  );

  const showNuevos = funnel !== "Repetidores";
  const showRepet = funnel !== "Nuevos";

  return (
    <div className="grid gap-3 grid-cols-1 lg:grid-cols-2 mt-3">
      {showNuevos && <Table title="Oportunidades abiertas — Nuevos clientes" rows={nuevos} />}
      {showRepet && <Table title="Oportunidades abiertas — Repetidores" rows={repetidores} />}
    </div>
  );
}
