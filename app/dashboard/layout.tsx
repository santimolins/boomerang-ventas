import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TopNav } from "@/components/TopNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <TopNav user={session.user} />
      <main className="mx-auto px-6 py-6" style={{ maxWidth: 1120 }}>
        {children}
      </main>
    </div>
  );
}
