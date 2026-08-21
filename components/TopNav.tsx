"use client";

import { signOut } from "next-auth/react";
import type { Session } from "next-auth";
import { useState } from "react";

type User = Session["user"];

export function TopNav({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  const initials =
    user?.name
      ?.split(" ")
      .slice(0, 2)
      .map((s) => s[0])
      .join("")
      .toUpperCase() ?? "B";

  return (
    <nav
      className="sticky top-0 z-50"
      style={{ background: "var(--card)", borderBottom: "1px solid var(--line)" }}
    >
      <div
        className="mx-auto flex items-center justify-between px-6"
        style={{ maxWidth: 1120, height: 52 }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center"
            style={{ background: "var(--blue)" }}
          >
            <span className="text-white text-sm font-bold">B</span>
          </div>
          <span className="font-medium" style={{ color: "var(--ink)", fontSize: 15 }}>
            Boomerang · Ventas
          </span>
        </div>

        <div className="relative">
          <button
            onClick={() => setOpen((o) => !o)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white"
            style={{ background: "var(--grey)" }}
            title={user?.email ?? ""}
          >
            {initials}
          </button>
          {open && (
            <div
              className="absolute right-0 mt-2 w-56 rounded-lg py-2 lk-card"
              style={{ boxShadow: "0 4px 12px rgba(0,0,0,.15)" }}
            >
              <div className="px-4 py-2 border-b" style={{ borderColor: "var(--line)" }}>
                <div className="text-sm font-medium truncate" style={{ color: "var(--ink)" }}>
                  {user?.name}
                </div>
                <div className="text-xs truncate" style={{ color: "var(--muted)" }}>
                  {user?.email}
                </div>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                style={{ color: "var(--ink)" }}
              >
                Salir
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
