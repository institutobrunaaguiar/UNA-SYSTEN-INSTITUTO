"use client"

import { useState } from "react"
import { CashbackContent } from "./cashback-content"
import { CashbackClientes } from "./cashback-clientes"

type Tab = "campanhas" | "clientes"

export function CashbackPageContent() {
  const [tab, setTab] = useState<Tab>("campanhas")

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
        {([
          { key: "campanhas" as Tab, label: "Campanhas" },
          { key: "clientes" as Tab, label: "Clientes" },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={[
              "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
              tab === t.key
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "campanhas" && <CashbackContent />}
      {tab === "clientes" && <CashbackClientes />}
    </div>
  )
}
