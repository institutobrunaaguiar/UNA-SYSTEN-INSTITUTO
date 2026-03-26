"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTheme } from "@/components/theme-provider"

export function SettingsContent() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-6">Informações do Perfil</h3>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src="/profile.jpg" alt="UNA Admin" />
              <AvatarFallback>UA</AvatarFallback>
            </Avatar>
            <div>
              <Button variant="outline">Alterar Foto</Button>
              <p className="text-xs text-muted-foreground mt-2">JPG, PNG ou GIF. Tamanho máximo 2MB</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input id="name" defaultValue="UNA Admin" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue="admin@una.com" />
            </div>
          </div>

          <Button className="bg-primary hover:bg-primary/90">Salvar Alterações</Button>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-6">Notificações</h3>
        <div className="space-y-4">
          {[
            { label: "Notificações por Email", description: "Receber email sobre atividades da sua conta" },
            { label: "Notificações Push", description: "Receber notificações push no seu navegador" },
            { label: "Lembretes de Tarefas", description: "Ser lembrado sobre prazos das tarefas" },
            { label: "Atualizações do Time", description: "Notificações sobre atividades dos membros do time" },
          ].map((item, index) => (
            <div
              key={item.label}
              className="flex items-center justify-between py-3 border-b border-border last:border-0"
            >
              <div>
                <p className="font-medium">{item.label}</p>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
              <Switch defaultChecked={index < 2} />
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-6">Aparência</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Modo Escuro</p>
              <p className="text-sm text-muted-foreground">Ativar tema escuro</p>
            </div>
            <Switch checked={theme === "dark"} onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")} />
          </div>
        </div>
      </Card>
    </div>
  )
}
