// app/api/assinafy/upload/route.ts
import { NextRequest, NextResponse } from "next/server"

const BASE = process.env.ASSINAFY_BASE_URL!
const API_KEY = process.env.ASSINAFY_API_KEY!
const ACCOUNT_ID = process.env.ASSINAFY_ACCOUNT_ID!

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get("file") as File | null

  if (!file) {
    return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 })
  }

  if (file.size > 25 * 1024 * 1024) {
    return NextResponse.json({ error: "Arquivo muito grande. Máximo 25MB." }, { status: 400 })
  }

  const body = new FormData()
  body.append("file", file, file.name)

  const res = await fetch(`${BASE}/accounts/${ACCOUNT_ID}/documents`, {
    method: "POST",
    headers: { "X-Api-Key": API_KEY },
    body,
  })

  const data = await res.json()

  if (!res.ok) {
    return NextResponse.json(
      { error: data?.message || "Erro ao fazer upload do documento." },
      { status: res.status }
    )
  }

  const doc = data?.data ?? data
  return NextResponse.json({ document_id: doc.id, name: doc.name, status: doc.status })
}
