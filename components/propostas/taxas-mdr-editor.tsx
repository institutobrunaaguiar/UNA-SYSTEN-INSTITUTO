"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Minus, Plus } from "lucide-react"
import type { TaxasMDR } from "./types"

interface TaxasMDREditorProps {
  taxas: TaxasMDR
  onChange: (taxas: TaxasMDR) => void
}

const LABELS: Record<keyof TaxasMDR, string> = {
  debito: "Debito",
  rotativo: "Rotativo",
  parcelado_2_6: "Parcelado 2 a 6x",
  parcelado_7_12: "Parcelado 7 a 12x",
  crediario: "Crediario",
  pix: "Pix",
}

export function TaxasMDREditor({ taxas, onChange }: TaxasMDREditorProps) {
  function handleAdjust(key: keyof TaxasMDR, delta: number) {
    const newValue = Math.max(0, Math.round((taxas[key] + delta) * 100) / 100)
    onChange({ ...taxas, [key]: newValue })
  }

  function handleInputChange(key: keyof TaxasMDR, value: string) {
    const num = parseFloat(value.replace(",", "."))
    if (!isNaN(num) && num >= 0) {
      onChange({ ...taxas, [key]: Math.round(num * 100) / 100 })
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 items-center text-sm font-medium text-muted-foreground">
        <span>Produto</span>
        <span className="col-span-3 text-center">Edicao das taxas</span>
        <span className="text-right">Taxa</span>
      </div>
      {(Object.keys(LABELS) as (keyof TaxasMDR)[]).map((key) => (
        <div
          key={key}
          className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 items-center"
        >
          <span className="text-sm font-medium text-foreground">{LABELS[key]}</span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleAdjust(key, -0.01)}
          >
            <Minus className="w-3 h-3" />
          </Button>
          <Input
            type="text"
            className="w-16 h-8 text-center text-sm"
            value={taxas[key].toFixed(2).replace(".", ",")}
            onChange={(e) => handleInputChange(key, e.target.value)}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleAdjust(key, 0.01)}
          >
            <Plus className="w-3 h-3" />
          </Button>
          <span className="text-sm font-semibold text-foreground text-right min-w-[60px]">
            {taxas[key].toFixed(2).replace(".", ",")}%
          </span>
        </div>
      ))}
    </div>
  )
}
