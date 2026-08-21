import { signIn, auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session) redirect("/dashboard");
  const { error } = await searchParams;

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "var(--bg)" }}
    >
      <div className="lk-card p-8 w-full max-w-sm text-center">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: "var(--blue)" }}
        >
          <span className="text-white text-2xl font-bold">B</span>
        </div>
        <h1 className="text-xl font-medium mb-1" style={{ color: "var(--ink)" }}>
          Boomerang · Ventas
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
          Pulso semanal
        </p>

        {error && (
          <div className="mb-4 px-4 py-2 rounded-lg text-sm" style={{ background: "#fce8e6", color: "var(--red)" }}>
            {error === "AccessDenied"
              ? "Acceso denegado. Tu cuenta no está autorizada."
              : "Error al iniciar sesión. Inténtalo de nuevo."}
          </div>
        )}

        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/dashboard" });
          }}
        >
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white rounded-xl text-sm font-medium hover:shadow-sm transition-all"
            style={{ border: "1px solid var(--line)", color: "var(--ink)" }}
          >
            <GoogleIcon />
            Continuar con Google
          </button>
        </form>

        <p className="text-xs mt-4" style={{ color: "var(--grey)" }}>
          Solo disponible para el equipo de Boomerang
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z" />
      <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z" />
      <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z" />
      <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z" />
    </svg>
  );
}
