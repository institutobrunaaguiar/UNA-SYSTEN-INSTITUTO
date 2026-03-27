# Admin — Gestão de Usuários — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a login-protected admin area at `/settings` with full user management: list, create, edit role/status, and deactivate users — backed by Supabase Auth and a `user_profiles` table.

**Architecture:** `/settings` uses a client-side `AdminGuard` component that checks `supabase.auth.getSession()` and redirects to `/settings/login` if unauthenticated. User creation/updates go through Next.js Route Handlers using the service role key. Reads come directly from the `user_profiles` table (public policy = all reads allowed). The rest of the app is unaffected.

**Tech Stack:** Next.js App Router, Supabase JS v2 (auth + service role), React 19, shadcn/ui (Table, Sheet, Dialog, Badge, Tabs).

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| SQL migration | Run in Supabase SQL Editor | Create `user_profiles` table + RLS |
| Create | `app/settings/login/page.tsx` | Public login page |
| Create | `components/admin/admin-guard.tsx` | Client-side session check + redirect |
| Create | `components/admin/admin-content.tsx` | Tabs: Usuários / Cadastrar |
| Create | `components/admin/admin-lista-usuarios.tsx` | User table with actions |
| Create | `components/admin/admin-cadastrar-usuario.tsx` | Create user form |
| Create | `components/admin/admin-editar-usuario.tsx` | Edit user sheet |
| Create | `app/api/admin/create-user/route.ts` | POST — create auth user + profile |
| Create | `app/api/admin/update-user/route.ts` | PATCH — update role/ativo |
| Modify | `app/settings/page.tsx` | Use AdminGuard + AdminContent |

---

### Task 1: Create user_profiles table in Supabase

**Files:**
- Run SQL in Supabase SQL Editor

- [ ] **Step 1: Run this SQL in Supabase SQL Editor**

```sql
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'operador', 'visualizador')),
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_reads" ON user_profiles
  FOR SELECT USING (true);
```

- [ ] **Step 2: Create the first admin user in Supabase Dashboard**

1. Go to Supabase Dashboard → Authentication → Users → Add user
2. Fill email + password → click "Create user"
3. Copy the UUID from the user list
4. Run in SQL Editor (replace the UUID and email):

```sql
INSERT INTO user_profiles (id, nome, email, role)
VALUES ('<uuid-aqui>', 'Admin', '<email-aqui>', 'admin');
```

- [ ] **Step 3: Verify**

```sql
SELECT * FROM user_profiles;
```

Expected: 1 row with role = 'admin'.

---

### Task 2: Create Route Handlers (server-side user management)

**Files:**
- Create: `app/api/admin/create-user/route.ts`
- Create: `app/api/admin/update-user/route.ts`

- [ ] **Step 1: Create create-user route**

```typescript
// app/api/admin/create-user/route.ts
import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(request: Request) {
  const { nome, email, password, role } = await request.json()

  if (!nome || !email || !password || !role) {
    return NextResponse.json({ error: "Campos obrigatórios faltando." }, { status: 400 })
  }

  const supabase = getAdminClient()

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  const { error: profileError } = await supabase.from("user_profiles").insert({
    id: data.user.id,
    nome,
    email,
    role,
  })

  if (profileError) {
    // Rollback auth user if profile insert fails
    await supabase.auth.admin.deleteUser(data.user.id)
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
```

- [ ] **Step 2: Create update-user route**

```typescript
// app/api/admin/update-user/route.ts
import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function PATCH(request: Request) {
  const { id, nome, role, ativo } = await request.json()

  if (!id) {
    return NextResponse.json({ error: "id é obrigatório." }, { status: 400 })
  }

  const supabase = getAdminClient()
  const updates: Record<string, unknown> = {}
  if (nome !== undefined) updates.nome = nome
  if (role !== undefined) updates.role = role
  if (ativo !== undefined) updates.ativo = ativo

  const { error } = await supabase.from("user_profiles").update(updates).eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/admin/
git commit -m "feat: add admin Route Handlers for user create/update"
```

---

### Task 3: Create admin-guard.tsx

**Files:**
- Create: `components/admin/admin-guard.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/admin/admin-guard.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@supabase/supabase-js"

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
  )
}

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState(false)
  const router = useRouter()

  useEffect(() => {
    getSupabase()
      .auth.getSession()
      .then(({ data }) => {
        if (!data.session) {
          router.replace("/settings/login")
        } else {
          setAuthed(true)
        }
      })
  }, [router])

  if (!authed) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return <>{children}</>
}
```

- [ ] **Step 2: Commit**

```bash
git add components/admin/admin-guard.tsx
git commit -m "feat: add AdminGuard client-side session check"
```

---

### Task 4: Create login page

**Files:**
- Create: `app/settings/login/page.tsx`

- [ ] **Step 1: Create the login page**

```tsx
// app/settings/login/page.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
  )
}

export default function AdminLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    const { error: authError } = await getSupabase().auth.signInWithPassword({ email, password })
    if (authError) {
      setError("E-mail ou senha incorretos.")
      setLoading(false)
    } else {
      router.replace("/settings")
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-sm p-8">
        <div className="text-center mb-8">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center mx-auto mb-4">
            <div className="w-2 h-2 rounded-full bg-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Área Administrativa</h1>
          <p className="text-muted-foreground text-sm mt-1">Instituto Bruna Aguiar</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">E-mail</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@institutobruna.com.br"
              required
              autoFocus
            />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Senha</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/settings/login/
git commit -m "feat: add admin login page"
```

---

### Task 5: Create admin-lista-usuarios.tsx

**Files:**
- Create: `components/admin/admin-lista-usuarios.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/admin/admin-lista-usuarios.tsx
"use client"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { AdminEditarUsuario } from "./admin-editar-usuario"

export interface UserProfile {
  id: string
  nome: string
  email: string
  role: "admin" | "operador" | "visualizador"
  ativo: boolean
  created_at: string
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
  )
}

const ROLE_CONFIG: Record<string, { label: string; className: string }> = {
  admin:        { label: "Admin",       className: "bg-indigo-500/10 text-indigo-400" },
  operador:     { label: "Operador",    className: "bg-blue-500/10 text-blue-400" },
  visualizador: { label: "Visualizador",className: "bg-stone-500/10 text-stone-400" },
}

export function AdminListaUsuarios() {
  const [usuarios, setUsuarios] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState<UserProfile | null>(null)

  async function fetchUsuarios() {
    const { data } = await getSupabase()
      .from("user_profiles")
      .select("*")
      .order("created_at")
    if (data) setUsuarios(data as UserProfile[])
    setLoading(false)
  }

  useEffect(() => { fetchUsuarios() }, [])

  async function toggleAtivo(usuario: UserProfile) {
    await fetch("/api/admin/update-user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: usuario.id, ativo: !usuario.ativo }),
    })
    fetchUsuarios()
  }

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin h-6 w-6 border-b-2 border-primary rounded-full" />
      </div>
    )
  }

  return (
    <>
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nome</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">E-mail</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nível</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {usuarios.map((u) => {
              const role = ROLE_CONFIG[u.role] ?? { label: u.role, className: "" }
              return (
                <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{u.nome}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${role.className}`}>
                      {role.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${u.ativo ? "bg-green-500/10 text-green-500" : "bg-destructive/10 text-destructive"}`}>
                      {u.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditando(u)}>Editar</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleAtivo(u)}>
                          {u.ativo ? "Desativar" : "Reativar"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {usuarios.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-8">Nenhum usuário cadastrado.</p>
        )}
      </div>

      <AdminEditarUsuario
        usuario={editando}
        onClose={() => setEditando(null)}
        onSaved={() => { setEditando(null); fetchUsuarios() }}
      />
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/admin/admin-lista-usuarios.tsx
git commit -m "feat: add AdminListaUsuarios table component"
```

---

### Task 6: Create admin-editar-usuario.tsx (Sheet)

**Files:**
- Create: `components/admin/admin-editar-usuario.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/admin/admin-editar-usuario.tsx
"use client"

import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { UserProfile } from "./admin-lista-usuarios"

interface Props {
  usuario: UserProfile | null
  onClose: () => void
  onSaved: () => void
}

export function AdminEditarUsuario({ usuario, onClose, onSaved }: Props) {
  const [nome, setNome] = useState("")
  const [role, setRole] = useState<"admin" | "operador" | "visualizador">("operador")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (usuario) {
      setNome(usuario.nome)
      setRole(usuario.role)
      setError("")
    }
  }, [usuario])

  async function handleSave() {
    if (!usuario) return
    setSaving(true)
    setError("")
    const res = await fetch("/api/admin/update-user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: usuario.id, nome, role }),
    })
    const data = await res.json()
    setSaving(false)
    if (data.error) {
      setError(data.error)
    } else {
      onSaved()
    }
  }

  return (
    <Sheet open={!!usuario} onOpenChange={(v) => { if (!v) onClose() }}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Editar Usuário</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Nome</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">E-mail</Label>
            <Input value={usuario?.email ?? ""} disabled className="opacity-50" />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Nível de Acesso</Label>
            <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="operador">Operador</SelectItem>
                <SelectItem value="visualizador">Visualizador</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/admin/admin-editar-usuario.tsx
git commit -m "feat: add AdminEditarUsuario sheet"
```

---

### Task 7: Create admin-cadastrar-usuario.tsx

**Files:**
- Create: `components/admin/admin-cadastrar-usuario.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/admin/admin-cadastrar-usuario.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"

export function AdminCadastrarUsuario() {
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"admin" | "operador" | "visualizador">("operador")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")
    setSuccess(false)

    const res = await fetch("/api/admin/create-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, email, password, role }),
    })
    const data = await res.json()
    setSaving(false)

    if (data.error) {
      setError(data.error)
    } else {
      setSuccess(true)
      setNome("")
      setEmail("")
      setPassword("")
      setRole("operador")
    }
  }

  return (
    <Card className="p-6 max-w-lg">
      <h3 className="text-sm font-semibold text-foreground mb-4">Novo Usuário</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Nome completo</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do usuário" required />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">E-mail</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@dominio.com" required />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Senha inicial</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" minLength={8} required />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Nível de acesso</Label>
            <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="operador">Operador</SelectItem>
                <SelectItem value="visualizador">Visualizador</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && (
          <div className="flex items-center gap-2 text-green-500 text-sm">
            <CheckCircle className="w-4 h-4" />
            Usuário criado com sucesso.
          </div>
        )}
        <Button type="submit" disabled={saving}>
          {saving ? "Criando..." : "Criar Usuário"}
        </Button>
      </form>
    </Card>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/admin/admin-cadastrar-usuario.tsx
git commit -m "feat: add AdminCadastrarUsuario form"
```

---

### Task 8: Create admin-content.tsx and wire settings page

**Files:**
- Create: `components/admin/admin-content.tsx`
- Modify: `app/settings/page.tsx`

- [ ] **Step 1: Create admin-content.tsx**

```tsx
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
              "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
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
```

- [ ] **Step 2: Update app/settings/page.tsx**

```tsx
// app/settings/page.tsx
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { AdminGuard } from "@/components/admin/admin-guard"
import { AdminContent } from "@/components/admin/admin-content"

export default function SettingsPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      <main className="flex-1 p-4 lg:p-6 lg:ml-64">
        <Header title="Admin" description="Gestão de usuários e configurações." />
        <div className="mt-6">
          <AdminGuard>
            <AdminContent />
          </AdminGuard>
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build 2>&1 | tail -20
```

Expected: no TypeScript errors.

- [ ] **Step 4: Verify login flow works**

```bash
npm run dev
```

1. Open http://localhost:3000/settings — should redirect to `/settings/login`
2. Enter the email/password of the admin user created in Task 1
3. Should redirect back to `/settings` and show the user table

- [ ] **Step 5: Final commit**

```bash
git add components/admin/ app/settings/
git commit -m "feat: complete Admin user management module with login protection"
```
