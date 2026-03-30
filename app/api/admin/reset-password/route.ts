// app/api/admin/reset-password/route.ts
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
  const { id, password } = await request.json()

  if (!id || !password) {
    return NextResponse.json({ error: "ID e nova senha são obrigatórios." }, { status: 400 })
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "A senha deve ter no mínimo 8 caracteres." }, { status: 400 })
  }

  const supabase = getAdminClient()

  const { error } = await supabase.auth.admin.updateUserById(id, { password })

  if (error) {
    return NextResponse.json({ error: "Erro ao redefinir senha. Tente novamente." }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
