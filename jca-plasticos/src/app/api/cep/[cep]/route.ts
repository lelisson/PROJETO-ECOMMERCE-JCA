import { NextResponse } from "next/server";
import { onlyDigits } from "@/lib/br-doc";

type ViaCepJson = {
  erro?: boolean;
  cep?: string;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  ibge?: string;
};

export async function GET(
  _req: Request,
  context: { params: Promise<{ cep: string }> }
) {
  const { cep: raw } = await context.params;
  const cep = onlyDigits(raw ?? "");
  if (cep.length !== 8) {
    return NextResponse.json(
      { error: "CEP deve ter 8 dígitos" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
      next: { revalidate: 86_400 },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: "Não foi possível consultar o CEP" },
        { status: 502 }
      );
    }
    const data = (await res.json()) as ViaCepJson;
    if (data.erro) {
      return NextResponse.json({ error: "CEP não encontrado" }, { status: 404 });
    }
    return NextResponse.json({
      cep: data.cep ?? `${cep.slice(0, 5)}-${cep.slice(5)}`,
      logradouro: String(data.logradouro ?? "").trim(),
      complemento: String(data.complemento ?? "").trim(),
      bairro: String(data.bairro ?? "").trim(),
      localidade: String(data.localidade ?? "").trim(),
      uf: String(data.uf ?? "").trim().toUpperCase().slice(0, 2),
      ibge: data.ibge ?? "",
    });
  } catch {
    return NextResponse.json(
      { error: "Falha ao consultar o CEP" },
      { status: 502 }
    );
  }
}
