"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface ValidacaoReprovarDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: (motivo: string) => void
  saving: boolean
  nomeCliente: string
}

export function ValidacaoReprovarDialog({
  open,
  onClose,
  onConfirm,
  saving,
  nomeCliente,
}: ValidacaoReprovarDialogProps) {
  const [motivo, setMotivo] = useState("")

  function handleConfirm() {
    if (!motivo.trim()) return
    onConfirm(motivo.trim())
    setMotivo("")
  }

  function handleClose() {
    setMotivo("")
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reprovar Proposta</DialogTitle>
          <DialogDescription>
            Informe o motivo da reprovação da proposta de {nomeCliente}. A consultora verá este motivo.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="motivo" className="text-sm font-medium">
            Motivo da reprovação *
          </Label>
          <Textarea
            id="motivo"
            placeholder="Ex: Desconto acima do permitido, procedimento incorreto..."
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={!motivo.trim() || saving}
          >
            {saving ? "Salvando..." : "Reprovar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
