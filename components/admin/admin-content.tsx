// components/admin/admin-content.tsx
"use client"

import { useState } from "react"
import { AdminListaUsuarios } from "./admin-lista-usuarios"
import { AdminCadastrarUsuario } from "./admin-cadastrar-usuario"

type Tab = "usuarios" | "cadastrar"

export function AdminContent() {
  const [tab, setTab] = useState<Tab>("usuarios")

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
        {(["usuarios", "cadastrar"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={[
              "px-4 py-2 rounded-md text-sm font-medium transition-colors min-h-[36px]",
              tab === t
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            {t === "usuarios" ? "Usuários" : "Cadastrar"}
          </button>
        ))}
      </div>

      {tab === "usuarios" && <AdminListaUsuarios />}
      {tab === "cadastrar" && <AdminCadastrarUsuario />}
    </div>
  )
}
