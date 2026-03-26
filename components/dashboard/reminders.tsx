"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Video } from "lucide-react"

export function Reminders() {
  return (
    <Card
      className="p-6 transition-all duration-500 hover:shadow-xl animate-slide-in-up"
      style={{ animationDelay: "500ms" }}
    >
      <h2 className="text-xl font-semibold text-foreground mb-6">Lembretes</h2>
      <div className="space-y-4">
        <div className="bg-card border border-border rounded-xl p-4 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
          <h3 className="font-semibold text-foreground mb-1">Reunião com Empresa Arc</h3>
          <p className="text-sm text-muted-foreground mb-4">Horário: 14h00 - 16h00</p>
          <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 hover:shadow-lg hover:shadow-primary/30">
            <Video className="w-4 h-4 mr-2" />
            Iniciar Reunião
          </Button>
        </div>
      </div>
    </Card>
  )
}
