// ---------------------------------------------------------------------------
// Formato europeo de salida + semaforo por ritmo
// ---------------------------------------------------------------------------

const eur0 = new Intl.NumberFormat("es-ES", {
  style: "decimal",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** 142490 -> "142.490 €" */
export function formatEur(v: number): string {
  return `${eur0.format(Math.round(v || 0))} €`;
}

/** entero sin decimales */
export function formatInt(v: number): string {
  return eur0.format(Math.round(v || 0));
}

/** 0.645 -> "65%" (0 decimales) */
export function formatPct(ratio: number): string {
  if (!isFinite(ratio)) return "0%";
  return `${Math.round(ratio * 100)}%`;
}

/** puntos porcentuales: 0.03 -> "3 pp" */
export function formatPp(deltaRatio: number): string {
  const pp = Math.round((deltaRatio || 0) * 100);
  return `${pp} pp`;
}

export type Semaforo = "verde" | "ambar" | "rojo";

// Umbrales configurables en un solo sitio (blueprint §6).
const AMBER_THRESHOLD = 1.0;
const RED_THRESHOLD = 0.85;

/**
 * Color del semaforo comparando la consecucion con el ritmo del mes.
 * r = consecucion / pace.
 *   r >= 1.00        -> verde  (al ritmo o por encima)
 *   0.85 <= r < 1.00 -> ambar  (algo por debajo del ritmo)
 *   r < 0.85         -> rojo   (por debajo del ritmo)
 */
export function semaforo(consecucion: number, pace: number): Semaforo {
  if (pace <= 0) return "verde";
  const r = consecucion / pace;
  if (r >= AMBER_THRESHOLD) return "verde";
  if (r >= RED_THRESHOLD) return "ambar";
  return "rojo";
}

export const SEMAFORO_COLOR: Record<Semaforo, string> = {
  verde: "var(--green)",
  ambar: "var(--amber)",
  rojo: "var(--red)",
};

export const SEMAFORO_TEXTO: Record<Semaforo, string> = {
  verde: "al ritmo",
  ambar: "algo por debajo del ritmo",
  rojo: "por debajo del ritmo",
};
