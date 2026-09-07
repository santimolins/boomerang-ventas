import { google, sheets_v4 } from "googleapis";

// ===========================================================================
// Cliente de Google Sheets (service account, solo servidor)
// ===========================================================================

function getAuth() {
  const key = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!); // JSON completo en 1 linea
  return new google.auth.GoogleAuth({
    credentials: key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
}

function getSheetsClient() {
  return google.sheets({ version: "v4", auth: getAuth() });
}

const SHEET_ID = () => process.env.GOOGLE_SHEET_ID!;

// ===========================================================================
// Parseo europeo (numeros y fechas)
// ===========================================================================

/** "142.490,00" (punto=miles, coma=decimal) -> 142490 ; "26.850€" -> 26850 */
export function n(v?: string | number | null): number {
  if (typeof v === "number") return v;
  const raw = String(v ?? "")
    .replace(/€/g, "")
    .replace(/\s/g, "")
    .trim();
  if (!raw) return 0;
  if (raw.includes(".") && raw.includes(","))
    return parseFloat(raw.replace(/\./g, "").replace(",", ".")) || 0;
  // Solo coma => decimal europeo (ej. "1,1"). Solo punto => ya es decimal o miles;
  // en este Sheet el punto en enteros grandes es separador de miles.
  if (raw.includes(",")) return parseFloat(raw.replace(",", ".")) || 0;
  // "44.210" (miles) vs "1.1" (decimal). Si el punto separa 3 digitos finales => miles.
  const m = raw.match(/^-?\d{1,3}(\.\d{3})+$/);
  if (m) return parseFloat(raw.replace(/\./g, "")) || 0;
  return parseFloat(raw) || 0;
}

/** "20/07/2026" -> "2026-07-20"; deja pasar ISO ya formado. */
export function parseEuroDate(v?: string | number | null): string {
  const s = String(v ?? "").trim();
  if (!s) return "";
  const dm = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dm) {
    const [, d, m, y] = dm;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  // Serial de Sheets (por si algun dia llega sin formatear)
  const num = Number(s);
  if (num && !isNaN(num) && num > 1000) {
    return new Date(Math.round((num - 25569) * 86400000)).toISOString().slice(0, 10);
  }
  return "";
}

// ===========================================================================
// Resolver pestana por firma de cabecera (NUNCA por titulo)
// ===========================================================================

const norm = (x: unknown) => String(x ?? "").trim().toLowerCase();

/**
 * Devuelve el titulo real de la pestana cuya cabecera (en las primeras `scanRows`
 * filas) contiene TODAS las columnas de `headerSignature`.
 */
async function resolveTabByHeader(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
  headerSignature: string[],
  scanRows = 12,
): Promise<string> {
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const titles = (meta.data.sheets ?? [])
    .map((sh) => sh.properties?.title ?? "")
    .filter(Boolean);
  const sig = headerSignature.map(norm);
  for (const title of titles) {
    try {
      const r = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `'${title}'!1:${scanRows}`,
      });
      const flat = (r.data.values ?? []).flat().map(norm);
      if (sig.every((h) => flat.includes(h))) return title;
    } catch {
      // pestana ilegible: siguiente
    }
  }
  throw new Error("No encuentro pestana con cabecera: " + headerSignature.join(", "));
}

async function getTabValues(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
  title: string,
): Promise<string[][]> {
  const r = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${title}'`,
  });
  return (r.data.values ?? []).map((row) => row.map((c) => String(c ?? "")));
}

/** Localiza la fila cabecera (que contiene todas las columnas dadas) y devuelve
 *  su indice + un mapa columna->indice. */
function findHeader(
  rows: string[][],
  cols: string[],
): { headerIdx: number; idx: Record<string, number> } | null {
  const want = cols.map(norm);
  for (let i = 0; i < rows.length; i++) {
    const cells = rows[i].map(norm);
    if (want.every((w) => cells.includes(w))) {
      const idx: Record<string, number> = {};
      for (const c of cols) idx[c] = cells.indexOf(norm(c));
      return { headerIdx: i, idx };
    }
  }
  return null;
}

// ===========================================================================
// Tipos de salida
// ===========================================================================

export type Funnel = "Nuevos" | "Repetidores";

export type Scorecard = { actual: number; objetivo: number; wow: number };
export type Conversion = {
  nuevos: number;
  repetidores: number;
  wowNuevosPp: number;
  wowRepetPp: number;
};
export type ActividadRow = { funnel: Funnel; cerradas: number; objetivo: number };
export type BudgetKamRow = { kam: string; nuevos: number; repetidores: number };
export type OrigenRow = { origen: string; cerradas: number; ganadas: number };
export type CampanaRow = { campana: string; cerradas: number; ganadas: number };
export type Oportunidad = {
  empresa: string;
  kam: string;
  origen: string;
  etapa: string;
  valor: number;
  dias: number;
  comentarios: string;
};

export type Ganado = {
  empresa: string;
  kam: string;
  origen: string;
  valor: number;
  fecha: string; // ISO (fecha de ganado)
};

export type VentasData = {
  mes: string;
  corte: string;
  mesesDisponibles: string[];
  cortesDisponibles: string[];
  kams: string[];
  pace: { diaCorte: number; diasMes: number; ratio: number };
  scorecards: {
    budget: Scorecard;
    nuevosGan: Scorecard;
    repetGan: Scorecard;
    conversion: Conversion;
  };
  actividad: ActividadRow[];
  budgetKam: BudgetKamRow[];
  origenes: OrigenRow[];
  campanas: CampanaRow[];
  oportunidades: { nuevos: Oportunidad[]; repetidores: Oportunidad[] };
  ganados: { nuevos: Ganado[]; repetidores: Ganado[] };
};

// ===========================================================================
// Firma A: datos crudos semanales (tidy)
// ===========================================================================

type ARow = {
  lunes: string; // ISO
  mes: string;
  funnel: Funnel;
  dimension: string; // Total | KAM | Origen | Campana
  dimValue: string;
  cerradas: number;
  ganadas: number;
  budgetEur: number;
};

const SIG_A = ["lunes", "mes", "funnel", "dimension", "dim_value", "cerradas", "ganadas", "budget_eur"];
const SIG_B = ["mes", "nuevos_cerradas", "nuevos_ganadas", "repetidores_ganadas", "budget_total"];
const SIG_C = ["kam", "origen", "deal_id", "empresa/deal", "etapa", "valor_eur", "dias_en_etapa"];
const SIG_D = ["mes", "fecha_ganado", "funnel", "kam", "origen", "empresa", "valor_eur"];

export function parseA(rows: string[][]): ARow[] {
  const found = findHeader(rows, SIG_A);
  if (!found) return [];
  const { headerIdx, idx } = found;
  const out: ARow[] = [];
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const r = rows[i];
    const funnelRaw = (r[idx.funnel] ?? "").trim();
    const mes = (r[idx.mes] ?? "").trim();
    if (!funnelRaw || !mes) continue;
    const funnel = /repet/i.test(funnelRaw) ? "Repetidores" : "Nuevos";
    out.push({
      lunes: parseEuroDate(r[idx.lunes]),
      mes,
      funnel,
      dimension: (r[idx.dimension] ?? "").trim(),
      dimValue: (r[idx.dim_value] ?? "").trim(),
      cerradas: n(r[idx.cerradas]),
      ganadas: n(r[idx.ganadas]),
      budgetEur: n(r[idx.budget_eur]),
    });
  }
  return out;
}

// ===========================================================================
// Firma B: objetivos (formato ancho, 1 fila por mes)
// ===========================================================================

type Objetivos = {
  budget_total: number;
  nuevos_cerradas: number;
  nuevos_ganadas: number;
  repetidores_cerradas: number;
  repetidores_ganadas: number;
};

export function parseB(rows: string[][], mes: string): Objetivos {
  const empty: Objetivos = {
    budget_total: 0,
    nuevos_cerradas: 0,
    nuevos_ganadas: 0,
    repetidores_cerradas: 0,
    repetidores_ganadas: 0,
  };
  const found = findHeader(rows, SIG_B);
  if (!found) return empty;
  const { headerIdx, idx } = found;
  // Indices opcionales que quiza no esten en la firma minima
  const header = rows[headerIdx].map(norm);
  const col = (name: string) => {
    if (name in idx) return idx[name];
    return header.indexOf(norm(name));
  };
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const r = rows[i];
    if ((r[idx.mes] ?? "").trim() === mes) {
      const at = (name: string) => {
        const c = col(name);
        return c >= 0 ? n(r[c]) : 0;
      };
      return {
        budget_total: at("budget_total"),
        nuevos_cerradas: at("nuevos_cerradas"),
        nuevos_ganadas: at("nuevos_ganadas"),
        repetidores_cerradas: at("repetidores_cerradas"),
        repetidores_ganadas: at("repetidores_ganadas"),
      };
    }
  }
  return empty;
}

// ===========================================================================
// Firma C: oportunidades abiertas (dos bloques)
// ===========================================================================

export function parseC(rows: string[][]): { nuevos: Oportunidad[]; repetidores: Oportunidad[] } {
  const result = { nuevos: [] as Oportunidad[], repetidores: [] as Oportunidad[] };
  const isEmptyRow = (r: string[]) => r.every((c) => !String(c ?? "").trim());
  const rowText = (r: string[]) => r.map(norm).join(" | ");

  let i = 0;
  while (i < rows.length) {
    const txt = rowText(rows[i]);
    const isNuevos = /nuevos clientes/.test(txt);
    const isRepet = /repetidores/.test(txt) && !/nuevos/.test(txt);
    if (!isNuevos && !isRepet) {
      i++;
      continue;
    }
    const bucket = isNuevos ? result.nuevos : result.repetidores;
    // Buscar la fila cabecera del bloque
    let h = i + 1;
    while (h < rows.length && !(rowText(rows[h]).includes("deal_id") || (rowText(rows[h]).includes("empresa/deal") && rowText(rows[h]).includes("etapa")))) {
      // no cruzar al siguiente bloque
      if (/nuevos clientes/.test(rowText(rows[h]))) break;
      h++;
    }
    const hdr = findHeader(rows.slice(h, h + 1), SIG_C);
    if (!hdr) {
      i = h + 1;
      continue;
    }
    const idx = hdr.idx;
    const comentIdx = rows[h].findIndex((c) => norm(c).includes("comentarios"));
    let d = h + 1;
    for (; d < rows.length; d++) {
      if (isEmptyRow(rows[d])) break;
      const r = rows[d];
      const empresa = (r[idx["empresa/deal"]] ?? "").trim();
      const kam = (r[idx.kam] ?? "").trim();
      if (!empresa && !kam) continue;
      bucket.push({
        empresa,
        kam,
        origen: (r[idx.origen] ?? "").trim(),
        etapa: (r[idx.etapa] ?? "").trim(),
        valor: n(r[idx.valor_eur]),
        dias: n(r[idx.dias_en_etapa]),
        comentarios: (comentIdx >= 0 ? r[comentIdx] : "")?.trim() ?? "",
      });
    }
    i = d;
  }
  return result;
}

// ===========================================================================
// Firma D: negocios ganados (tidy, 1 fila por deal ganado)
// ===========================================================================

export function parseGanados(
  rows: string[][],
  mes: string,
): { nuevos: Ganado[]; repetidores: Ganado[] } {
  const res = { nuevos: [] as Ganado[], repetidores: [] as Ganado[] };
  const found = findHeader(rows, SIG_D);
  if (!found) return res;
  const { headerIdx, idx } = found;
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const r = rows[i];
    const fecha = parseEuroDate(r[idx.fecha_ganado]);
    // `mes` puede venir como "2026-09" o, si Sheets lo coaccionó, como fecha
    // formateada. Normalizamos: usamos el texto si es yyyy-MM, si no el mes de
    // la fecha de ganado.
    const rawMes = (r[idx.mes] ?? "").trim();
    const rowMes = /^\d{4}-\d{2}$/.test(rawMes) ? rawMes : fecha.slice(0, 7);
    if (rowMes !== mes) continue; // solo el mes filtrado
    const funnelRaw = (r[idx.funnel] ?? "").trim();
    if (!funnelRaw) continue;
    const g: Ganado = {
      empresa: (r[idx.empresa] ?? "").trim(),
      kam: (r[idx.kam] ?? "").trim(),
      origen: (r[idx.origen] ?? "").trim(),
      valor: n(r[idx.valor_eur]),
      fecha,
    };
    if (/repet/i.test(funnelRaw)) res.repetidores.push(g);
    else res.nuevos.push(g);
  }
  // Orden: KAM -> Cliente (empresa) -> Fecha de ganado.
  const cmp = (a: Ganado, b: Ganado) =>
    a.kam.localeCompare(b.kam, "es") ||
    a.empresa.localeCompare(b.empresa, "es") ||
    a.fecha.localeCompare(b.fecha);
  res.nuevos.sort(cmp);
  res.repetidores.sort(cmp);
  return res;
}

// ===========================================================================
// Utilidades de agregacion sobre Firma A
// ===========================================================================

// KAM canonicos (blueprint §5.2). Orden por defecto para la grafica.
const KAM_CANON = ["Alejandro Ferrer", "Oriol", "Santi", "Quim", "Jandro", "Medio", "Helen", "Otros"];

function totalRow(rows: ARow[], funnel: Funnel) {
  return rows.find((r) => r.funnel === funnel && r.dimension === "Total");
}
function sumBudgetTotales(rows: ARow[]): number {
  return (["Nuevos", "Repetidores"] as Funnel[]).reduce(
    (acc, f) => acc + (totalRow(rows, f)?.budgetEur ?? 0),
    0,
  );
}
function conv(cerradas: number, ganadas: number): number {
  return cerradas > 0 ? ganadas / cerradas : 0;
}

function daysInMonth(mes: string): number {
  const m = mes.match(/^(\d{4})-(\d{2})$/);
  if (!m) return 30;
  return new Date(Number(m[1]), Number(m[2]), 0).getDate();
}

// ===========================================================================
// getVentasData — orquesta todo
// ===========================================================================

export async function getVentasData(mes?: string, corte?: string): Promise<VentasData> {
  const sheets = getSheetsClient();
  const spreadsheetId = SHEET_ID();

  // Resolver pestanas por firma (en paralelo)
  const [titleA, titleB, titleC, titleD] = await Promise.all([
    resolveTabByHeader(sheets, spreadsheetId, SIG_A),
    resolveTabByHeader(sheets, spreadsheetId, SIG_B).catch(() => ""),
    resolveTabByHeader(sheets, spreadsheetId, SIG_C).catch(() => ""),
    resolveTabByHeader(sheets, spreadsheetId, SIG_D).catch(() => ""),
  ]);

  const [rawA, rawB, rawC, rawD] = await Promise.all([
    getTabValues(sheets, spreadsheetId, titleA),
    titleB ? getTabValues(sheets, spreadsheetId, titleB) : Promise.resolve([] as string[][]),
    titleC ? getTabValues(sheets, spreadsheetId, titleC) : Promise.resolve([] as string[][]),
    titleD ? getTabValues(sheets, spreadsheetId, titleD) : Promise.resolve([] as string[][]),
  ]);

  const A = parseA(rawA);

  // Meses y cortes disponibles
  const mesesDisponibles = Array.from(new Set(A.map((r) => r.mes)))
    .filter(Boolean)
    .sort();
  const selMes = mes && mesesDisponibles.includes(mes) ? mes : mesesDisponibles[mesesDisponibles.length - 1] ?? "";

  const cortesDisponibles = Array.from(
    new Set(A.filter((r) => r.mes === selMes && r.lunes).map((r) => r.lunes)),
  ).sort();
  const selCorte =
    corte && cortesDisponibles.includes(corte)
      ? corte
      : cortesDisponibles[cortesDisponibles.length - 1] ?? "";

  const antIdx = cortesDisponibles.indexOf(selCorte) - 1;
  const antCorte = antIdx >= 0 ? cortesDisponibles[antIdx] : "";

  const actual = A.filter((r) => r.mes === selMes && r.lunes === selCorte);
  const anterior = antCorte ? A.filter((r) => r.mes === selMes && r.lunes === antCorte) : [];

  // Objetivos del mes
  const obj = parseB(rawB, selMes);

  // Totales por funnel
  const nT = totalRow(actual, "Nuevos");
  const rT = totalRow(actual, "Repetidores");
  const nTa = totalRow(anterior, "Nuevos");
  const rTa = totalRow(anterior, "Repetidores");

  // Scorecards
  const budgetActual = sumBudgetTotales(actual);
  const budgetAnterior = sumBudgetTotales(anterior);

  const convN = conv(nT?.cerradas ?? 0, nT?.ganadas ?? 0);
  const convR = conv(rT?.cerradas ?? 0, rT?.ganadas ?? 0);
  const convNa = conv(nTa?.cerradas ?? 0, nTa?.ganadas ?? 0);
  const convRa = conv(rTa?.cerradas ?? 0, rTa?.ganadas ?? 0);

  // budgetKam
  const kamSet = Array.from(
    new Set([
      ...KAM_CANON,
      ...actual.filter((r) => r.dimension === "KAM").map((r) => r.dimValue),
    ]),
  );
  const kamBudget = (funnel: Funnel, kam: string) =>
    actual.find((r) => r.funnel === funnel && r.dimension === "KAM" && r.dimValue === kam)?.budgetEur ?? 0;
  const budgetKam: BudgetKamRow[] = kamSet
    .map((kam) => ({ kam, nuevos: kamBudget("Nuevos", kam), repetidores: kamBudget("Repetidores", kam) }))
    .filter((k) => k.nuevos + k.repetidores > 0)
    .sort((a, b) => b.nuevos + b.repetidores - (a.nuevos + a.repetidores));

  // origenes / campanas
  const origenes: OrigenRow[] = actual
    .filter((r) => r.funnel === "Nuevos" && r.dimension === "Origen")
    .map((r) => ({ origen: r.dimValue, cerradas: r.cerradas, ganadas: r.ganadas }))
    .filter((o) => o.cerradas > 0 || o.ganadas > 0);
  const campanas: CampanaRow[] = actual
    .filter((r) => r.funnel === "Repetidores" && r.dimension === "Campana")
    .map((r) => ({ campana: r.dimValue, cerradas: r.cerradas, ganadas: r.ganadas }))
    .filter((c) => c.cerradas > 0 || c.ganadas > 0);

  // oportunidades
  const oportunidades = parseC(rawC);

  // ganados (deal a deal) del mes seleccionado
  const ganados = parseGanados(rawD, selMes);

  // pace
  const diasMes = daysInMonth(selMes);
  const diaCorte = selCorte ? Number(selCorte.slice(8, 10)) : 0;
  const ratio = diasMes > 0 ? diaCorte / diasMes : 0;

  return {
    mes: selMes,
    corte: selCorte,
    mesesDisponibles,
    cortesDisponibles,
    kams: budgetKam.map((k) => k.kam),
    pace: { diaCorte, diasMes, ratio },
    scorecards: {
      budget: { actual: budgetActual, objetivo: obj.budget_total, wow: budgetActual - budgetAnterior },
      nuevosGan: {
        actual: nT?.ganadas ?? 0,
        objetivo: obj.nuevos_ganadas,
        wow: (nT?.ganadas ?? 0) - (nTa?.ganadas ?? 0),
      },
      repetGan: {
        actual: rT?.ganadas ?? 0,
        objetivo: obj.repetidores_ganadas,
        wow: (rT?.ganadas ?? 0) - (rTa?.ganadas ?? 0),
      },
      conversion: {
        nuevos: convN,
        repetidores: convR,
        wowNuevosPp: convN - convNa,
        wowRepetPp: convR - convRa,
      },
    },
    actividad: [
      { funnel: "Nuevos", cerradas: nT?.cerradas ?? 0, objetivo: obj.nuevos_cerradas },
      { funnel: "Repetidores", cerradas: rT?.cerradas ?? 0, objetivo: obj.repetidores_cerradas },
    ],
    budgetKam,
    origenes,
    campanas,
    oportunidades,
    ganados,
  };
}
