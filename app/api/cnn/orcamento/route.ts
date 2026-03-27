// app/api/cnn/orcamento/route.ts
import { NextRequest, NextResponse } from "next/server"

const CNN_BASE = process.env.CNN_BASE_URL!
const CNN_TOKEN = process.env.CNN_TOKEN!
const CNN_CLIENT_ID = process.env.CNN_CLIENT_ID!
const CNN_CLIENT_SECRET = process.env.CNN_CLIENT_SECRET!

function basicAuth() {
  return "Basic " + Buffer.from(`${CNN_CLIENT_ID}:${CNN_CLIENT_SECRET}`).toString("base64")
}

export async function GET(request: NextRequest) {
  const incoming = request.nextUrl.searchParams
  const sp = new URLSearchParams()

  if (incoming.get("idPaciente")) sp.set("idPaciente", incoming.get("idPaciente")!)

  // dataInicial, dataFinal e tipoData são obrigatórios
  sp.set("dataInicial", incoming.get("dataInicial") ?? "2000-01-01")
  sp.set("dataFinal",   incoming.get("dataFinal")   ?? "2030-12-31")
  sp.set("tipoData",    incoming.get("tipoData")    ?? "CRIACAO")
  sp.set("pagina",             incoming.get("pagina")             ?? "0")
  sp.set("registrosPorPagina", incoming.get("registrosPorPagina") ?? "20")

  try {
    const url = `${CNN_BASE}/orcamento/lista?${sp.toString()}`
    const res = await fetch(url, {
      headers: {
        "clinicaNasNuvens-cid": CNN_TOKEN,
        "Authorization": basicAuth(),
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })

    if (!res.ok) {
      const body = await res.text().catch(() => "")
      console.error(`[cnn/orcamento] ${res.status}:`, body)
      return NextResponse.json({ lista: [], error: `CNN ${res.status}`, detail: body }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (e) {
    console.error("[cnn/orcamento] erro:", e)
    return NextResponse.json({ lista: [], error: "Falha na conexão com Clínica nas Nuvens" }, { status: 500 })
  }
}
