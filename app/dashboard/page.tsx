"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { VentasData, Funnel } from "@/lib/sheets";
import { FilterChips } from "@/components/FilterChips";
import { Scorecards } from "@/components/Scorecards";
import { ChartsRow, OrigenesRow } from "@/components/Charts";
import { GanadosTables } from "@/components/GanadosTables";
import { OportunidadesTables } from "@/components/OportunidadesTables";
import { formatPct } from "@/lib/format";

const MESES_LARGO = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function mesLargo(mes: string): string {
  const m = mes.match(/^(\d{4})-(\d{2})$/);
  if (!m) return mes;
  const nombre = MESES_LARGO[Number(m[2]) - 1] ?? "";
  return `${nombre.charAt(0).toUpperCase()}${nombre.slice(1)} ${m[1]}`;
}

export default function DashboardPage() {
  const [data, setData] = useState<VentasData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Parametros de servidor
  const [reqMes, setReqMes] = useState("");
  const [reqCorte, setReqCorte] = useState("");
  // Filtros de cliente
  const [kam, setKam] = useState("Todos");
  const [funnel, setFunnel] = useState<"Todos" | Funnel>("Todos");

  useEffect(() => {
    const qs = new URLSearchParams();
    if (reqMes) qs.set("mes", reqMes);
    if (reqCorte) qs.set("corte", reqCorte);
    setLoading(true);
    setError(null);
    fetch("/api/ventas?" + qs)
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json())?.error ?? `HTTP ${r.status}`);
        return r.json();
      })
      .then((d: VentasData) => setData(d))
      .catch((e) => {
        setError(String(e.message ?? e));
        toast.error("No se pudieron cargar los datos de ventas");
      })
      .finally(() => setLoading(false));
  }, [reqMes, reqCorte]);

  const mes = data?.mes ?? reqMes;
  const corte = data?.corte ?? reqCorte;

  return (
    <div>
      {/* Cabecera */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="font-medium" style={{ fontSize: 19, color: "var(--ink)" }}>
            Ventas — Pulso semanal
          </h1>
          <p className="mt-0.5" style={{ fontSize: 12, color: "var(--muted)" }}>
            Acumulado del mes · datos reales{mes ? ` ${mesLargo(mes)}` : ""}
          </p>
        </div>
        <span
          className="rounded-full px-2.5 py-1"
          style={{ fontSize: 11, background: "var(--card)", border: "1px solid var(--line)", color: "var(--muted)" }}
        >
          Boomerang Talent
        </span>
      </div>

      {/* Filtros */}
      <div className="mt-4">
        {data && (
          <FilterChips
            mes={mes}
            corte={corte}
            kam={kam}
            funnel={funnel}
            meses={data.mesesDisponibles}
            cortes={data.cortesDisponibles}
            kams={data.kams}
            onMes={(v) => {
              setReqMes(v);
              setReqCorte(""); // nuevo mes -> ultimo corte automatico
            }}
            onCorte={(v) => setReqCorte(v)}
            onKam={setKam}
            onFunnel={(v) => setFunnel(v as "Todos" | Funnel)}
          />
        )}
      </div>

      {/* Linea de ritmo */}
      {data && (
        <p className="mt-3" style={{ fontSize: 12, color: "var(--muted)" }}>
          Ritmo del mes: {formatPct(data.pace.ratio)} transcurrido (día {data.pace.diaCorte} de{" "}
          {data.pace.diasMes}). El semáforo compara la consecución con este ritmo — la marca ▎ en
          cada barra señala el objetivo esperado a hoy.
        </p>
      )}

      {/* Estados */}
      {loading && !data && (
        <div className="py-20 text-center" style={{ color: "var(--muted)" }}>
          Cargando datos de ventas…
        </div>
      )}
      {error && !loading && (
        <div className="lk-card p-6 mt-4 text-center">
          <p style={{ color: "var(--red)" }}>Error al cargar: {error}</p>
          <button
            onClick={() => {
              setReqMes((m) => m);
              setReqCorte((c) => c);
            }}
            className="mt-3 px-4 py-2 rounded-lg text-sm text-white"
            style={{ background: "var(--blue)" }}
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Contenido */}
      {data && (
        <div className="mt-4" style={{ opacity: loading ? 0.6 : 1, transition: "opacity .15s" }}>
          <Scorecards data={data} />
          <ChartsRow data={data} funnel={funnel} kam={kam} />
          <OrigenesRow data={data} funnel={funnel} />
          <GanadosTables data={data} kam={kam} funnel={funnel} />
          <OportunidadesTables data={data} kam={kam} funnel={funnel} />

          <p className="mt-5 italic" style={{ fontSize: 11, color: "var(--grey)" }}>
            Fuente = Google Sheet &quot;Metricas Ventas&quot;.
          </p>
        </div>
      )}
    </div>
  );
}
