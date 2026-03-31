// app/api/assinafy/contratos/route.ts
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  const pacienteId = sp.get("paciente_id")

  const supabase = getSupabaseAdmin()
  let query = supabase
    .from("contratos")
    .select("*")
    .order("created_at", { ascending: false })

  if (pacienteId) query = query.eq("paciente_id", parseInt(pacienteId))

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ lista: data ?? [] })
}
