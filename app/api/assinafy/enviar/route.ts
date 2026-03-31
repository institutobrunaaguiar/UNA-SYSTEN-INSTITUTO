// app/api/assinafy/enviar/route.ts
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const BASE = process.env.ASSINAFY_BASE_URL!
const API_KEY = process.env.ASSINAFY_API_KEY!
const ACCOUNT_ID = process.env.ASSINAFY_ACCOUNT_ID!

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function assinafy(path: string, method: string, body?: object) {
  return fetch(`${BASE}${path}`, {
    method,
    headers: {
      "X-Api-Key": API_KEY,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const {
    paciente_id,
    proposta_id,
    titulo,
    nome_paciente,
    email_paciente,
    whatsapp,
    mensagem,
    assinafy_document_id,
    created_by,
  } = body

  if (!paciente_id || !titulo || !nome_paciente || !email_paciente || !assinafy_document_id) {
    return NextResponse.json({ error: "Campos obrigatórios ausentes." }, { status: 400 })
  }

  // 1. Criar ou buscar signatário na Assinafy
  let signer_id: string
  const searchRes = await assinafy(
    `/accounts/${ACCOUNT_ID}/signers?search=${encodeURIComponent(email_paciente)}`,
    "GET"
  )
  const searchData = await searchRes.json()
  const existing = searchData?.data?.find((s: { email: string }) => s.email === email_paciente)

  if (existing) {
    signer_id = existing.id
  } else {
    const createSigner = await assinafy(`/accounts/${ACCOUNT_ID}/signers`, "POST", {
      full_name: nome_paciente,
      email: email_paciente,
      ...(whatsapp ? { whatsapp_phone_number: whatsapp } : {}),
    })
    const signerData = await createSigner.json()
    if (!createSigner.ok) {
      return NextResponse.json(
        { error: signerData?.message || "Erro ao criar signatário na Assinafy." },
        { status: 400 }
      )
    }
    signer_id = signerData.data?.id ?? signerData.id
  }

  // 2. Criar assignment (enviar para assinatura)
  const assignRes = await assinafy(
    `/documents/${assinafy_document_id}/assignments`,
    "POST",
    {
      method: "virtual",
      signers: [
        {
          id: signer_id,
          verification_method: "Email",
          notification_methods: ["Email"],
        },
      ],
      ...(mensagem ? { message: mensagem } : {}),
    }
  )
  const assignData = await assignRes.json()
  if (!assignRes.ok) {
    return NextResponse.json(
      { error: assignData?.message || "Erro ao enviar documento para assinatura." },
      { status: 400 }
    )
  }

  const signing_url = assignData?.data?.signing_urls?.[0]?.url
    ?? assignData?.signing_urls?.[0]?.url

  // 3. Salvar no Supabase
  const supabase = getSupabaseAdmin()
  const { data: contrato, error: dbError } = await supabase
    .from("contratos")
    .insert({
      paciente_id,
      proposta_id: proposta_id || null,
      titulo,
      nome_paciente,
      email_paciente,
      mensagem: mensagem || null,
      assinafy_document_id,
      assinafy_signer_id: signer_id,
      status: "pendente",
      url_assinatura: signing_url ?? null,
      created_by: created_by || null,
    })
    .select()
    .single()

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({ contrato, signing_url })
}
