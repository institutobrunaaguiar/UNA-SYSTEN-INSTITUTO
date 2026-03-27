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
  const { id, nome, role, ativo, modulos } = await request.json()

  if (!id) {
    return NextResponse.json({ error: "id é obrigatório." }, { status: 400 })
  }

  const supabase = getAdminClient()
  const updates: Record<string, unknown> = {}
  if (nome !== undefined) updates.nome = nome
  if (role !== undefined) updates.role = role
  if (ativo !== undefined) updates.ativo = ativo
  if (modulos !== undefined) updates.modulos = modulos

  const { error } = await supabase.from("user_profiles").update(updates).eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
