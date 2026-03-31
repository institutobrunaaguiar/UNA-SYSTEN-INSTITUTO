// app/api/assinafy/templates/route.ts
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Listar templates
export async function GET() {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from("contrato_templates")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ templates: data ?? [] })
}

// Criar template (upload PDF + registro)
export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get("file") as File | null
  const nome = formData.get("nome") as string | null
  const descricao = formData.get("descricao") as string | null
  const createdBy = formData.get("created_by") as string | null

  if (!file || !nome) {
    return NextResponse.json({ error: "Nome e arquivo são obrigatórios." }, { status: 400 })
  }

  if (file.size > 25 * 1024 * 1024) {
    return NextResponse.json({ error: "Arquivo muito grande. Máximo 25MB." }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`

  // Upload para Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from("contrato-templates")
    .upload(fileName, file, { contentType: "application/pdf" })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  // Salvar registro
  const { data: template, error: dbError } = await supabase
    .from("contrato_templates")
    .insert({
      nome,
      descricao: descricao || null,
      storage_path: fileName,
      created_by: createdBy || null,
    })
    .select()
    .single()

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({ template })
}

// Deletar template
export async function DELETE(request: NextRequest) {
  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 })

  const supabase = getSupabaseAdmin()

  // Buscar storage_path
  const { data: tmpl } = await supabase
    .from("contrato_templates")
    .select("storage_path")
    .eq("id", id)
    .single()

  if (tmpl?.storage_path) {
    await supabase.storage.from("contrato-templates").remove([tmpl.storage_path])
  }

  const { error } = await supabase.from("contrato_templates").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
