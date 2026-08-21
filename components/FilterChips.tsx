"use client";

function Chip({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <label
      className="inline-flex items-center gap-1.5 rounded-full pl-3 pr-1.5 py-1"
      style={{
        background: "var(--chip-bg)",
        border: "1px solid var(--chip-line)",
        fontSize: 12,
      }}
    >
      <span style={{ color: "var(--chip-ink)" }}>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent font-medium outline-none cursor-pointer"
        style={{ color: "var(--ink)" }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function mesLabel(mes: string): string {
  const m = mes.match(/^(\d{4})-(\d{2})$/);
  if (!m) return mes;
  const meses = [
    "ene", "feb", "mar", "abr", "may", "jun",
    "jul", "ago", "sep", "oct", "nov", "dic",
  ];
  return `${meses[Number(m[2]) - 1]} ${m[1]}`;
}

function corteLabel(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}/${m[2]}` : iso;
}

export function FilterChips({
  mes,
  corte,
  kam,
  funnel,
  meses,
  cortes,
  kams,
  onMes,
  onCorte,
  onKam,
  onFunnel,
}: {
  mes: string;
  corte: string;
  kam: string;
  funnel: string;
  meses: string[];
  cortes: string[];
  kams: string[];
  onMes: (v: string) => void;
  onCorte: (v: string) => void;
  onKam: (v: string) => void;
  onFunnel: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Chip
        label="Mes"
        value={mes}
        options={meses.map((m) => ({ value: m, label: mesLabel(m) }))}
        onChange={onMes}
      />
      <Chip
        label="Corte"
        value={corte}
        options={cortes.map((c) => ({ value: c, label: corteLabel(c) }))}
        onChange={onCorte}
      />
      <Chip
        label="KAM"
        value={kam}
        options={[{ value: "Todos", label: "Todos" }, ...kams.map((k) => ({ value: k, label: k }))]}
        onChange={onKam}
      />
      <Chip
        label="Funnel"
        value={funnel}
        options={[
          { value: "Todos", label: "Todos" },
          { value: "Nuevos", label: "Nuevos" },
          { value: "Repetidores", label: "Repetidores" },
        ]}
        onChange={onFunnel}
      />
    </div>
  );
}
