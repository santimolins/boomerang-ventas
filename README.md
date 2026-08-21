# Boomerang · Ventas — Pulso semanal

Dashboard de **Ventas** de Boomerang Talent. Next.js 16 (App Router) en Vercel que lee el
Google Sheet **"Metricas Ventas"** vía service account y pinta el "Pulso semanal" estilo
Looker Studio: 4 scorecards con semáforo por ritmo del mes, 4 gráficas (Recharts) y 2 tablas
de oportunidades abiertas. Login con Google (NextAuth v5) restringido por lista blanca.

Misma arquitectura que el dashboard de facturación (`boomerang-dashboard`).

## Fuente de datos

Sheet `Metricas Ventas` (`GOOGLE_SHEET_ID`). La app resuelve **3 pestañas por su firma de
cabecera** (nunca por título):

- **Firma A** (datos crudos, tidy): `lunes | mes | funnel | dimension | dim_value | cerradas | ganadas | budget_eur`.
- **Firma B** (objetivos, ancho): `mes | nuevos_cerradas | nuevos_ganadas | … | budget_total | …`.
- **Firma C** (oportunidades abiertas): bloques `NUEVOS CLIENTES` / `REPETIDORES` con cabecera
  `KAM | origen | deal_id | empresa/deal | etapa | valor_eur | dias_en_etapa | comentarios (meeting)`.

La app **recalcula** los KPIs desde datos crudos; ignora las pestañas de cálculo manual
(`MOTOR DE CALCULO`, `PULSO DE VENTAS`, matrices de budget, runs, `Reporting_Antiguo`).

## Variables de entorno

Ver `.env.local.example`. Núcleo: `GOOGLE_SERVICE_ACCOUNT_KEY`, `GOOGLE_SHEET_ID`,
`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `ALLOWED_EMAILS`.

## Desarrollo

```bash
npm install
npm run dev
```

## Despliegue

Vercel auto-despliega cada push a `main`. Redirect URI de OAuth:
`https://<proyecto>.vercel.app/api/auth/callback/google` (+ `http://localhost:3000/...` en dev).
Comparte el Sheet con el `client_email` del service account como **Lector**.
