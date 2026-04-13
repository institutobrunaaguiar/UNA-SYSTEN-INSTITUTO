import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function DELETE(request: Request) {
  const { id } = await request.json()

  if (!id) {
    return NextResponse.json({ error: "ID do usuário é obrigatório." }, { status: 400 })
  }

  const supabase = getAdminClient()

  // 1. Excluir perfil do banco (user_profiles)
  const { error: profileError } = await supabase
    .from("user_profiles")
    .delete()
    .eq("id", id)

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  // 2. Excluir usuário do auth (auth.users)
  const { error: authError } = await supabase.auth.admin.deleteUser(id)

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
