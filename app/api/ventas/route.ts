import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getVentasData } from "@/lib/sheets";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { searchParams } = new URL(req.url);
    const mes = searchParams.get("mes") ?? undefined; // "2026-07" | undefined = ultimo
    const corte = searchParams.get("corte") ?? undefined; // "2026-07-20" | undefined = ultimo del mes
    return NextResponse.json(await getVentasData(mes, corte));
  } catch (err) {
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    console.error("GET /api/ventas error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
