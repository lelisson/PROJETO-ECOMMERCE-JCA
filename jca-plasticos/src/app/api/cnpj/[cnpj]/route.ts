import { NextResponse } from "next/server";
import { onlyDigits, validateCpfCnpj } from "@/lib/br-doc";

type BrasilCnpjJson = {
  razao_social?: string;
  nome_fantasia?: string;
  cep?: string;
  descricao_tipo_de_logradouro?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
};

function montarLogradouro(data: BrasilCnpjJson): string {
  const tipo = String(data.descricao_tipo_de_logradouro ?? "").trim();
  const log = String(data.logradouro ?? "").trim();
  if (tipo && log) return `${tipo} ${log}`;
  return log || tipo;
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ cnpj: string }> }
) {
  const { cnpj: raw } = await context.params;
  const digits = onlyDigits(raw ?? "");
  const v = validateCpfCnpj(digits);
  if (!v.ok || v.digits.length !== 14) {
    return NextResponse.json({ error: "CNPJ inválido" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://brasilapi.com.br/api/cnpj/v1/${v.digits}`,
      {
        next: { revalidate: 86_400 },
        headers: { Accept: "application/json" },
      }
    );
    if (res.status === 404) {
      return NextResponse.json({ error: "CNPJ não encontrado" }, { status: 404 });
    }
    if (!res.ok) {
      return NextResponse.json(
        { error: "Não foi possível consultar o CNPJ" },
        { status: 502 }
      );
    }
    const data = (await res.json()) as BrasilCnpjJson;
    const cepDigits = onlyDigits(String(data.cep ?? ""));
    return NextResponse.json({
      razao_social: String(data.razao_social ?? "").trim(),
      nome_fantasia: String(data.nome_fantasia ?? "").trim(),
      cep:
        cepDigits.length === 8
          ? `${cepDigits.slice(0, 5)}-${cepDigits.slice(5)}`
          : String(data.cep ?? "").trim(),
      logradouro: montarLogradouro(data),
      complemento: String(data.complemento ?? "").trim(),
      bairro: String(data.bairro ?? "").trim(),
      municipio: String(data.municipio ?? "").trim(),
      uf: String(data.uf ?? "").trim().toUpperCase().slice(0, 2),
    });
  } catch {
    return NextResponse.json(
      { error: "Falha ao consultar o CNPJ" },
      { status: 502 }
    );
  }
}
