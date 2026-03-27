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
  const { nome, email, password, role, modulos } = await request.json()

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
    modulos: modulos ?? ["painel", "proposta", "calendario", "relatorios", "pacientes"],
  })

  if (profileError) {
    await supabase.auth.admin.deleteUser(data.user.id)
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
