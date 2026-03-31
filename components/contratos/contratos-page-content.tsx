"use client"

import { useState } from "react"
import { ContratosContent } from "./contratos-content"
import { TemplatesContent } from "./templates-content"

type Tab = "contratos" | "templates"

export function ContratosPageContent() {
  const [tab, setTab] = useState<Tab>("contratos")

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
        {([
          { key: "contratos" as Tab, label: "Contratos" },
          { key: "templates" as Tab, label: "Templates" },
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

      {tab === "contratos" && <ContratosContent />}
      {tab === "templates" && <TemplatesContent />}
    </div>
  )
}
