import { NextResponse } from "next/server";
import { FALLBACK_PRODUCTS } from "@/lib/catalog-fallback";
import { buildDemoCatalogPayload, isVirtualStoreMode, isDemoStore } from "@/lib/demo-store";
import { getOmieConfig, omieCall, todayBr } from "@/lib/omie";

type OmieProduto = {
  codigo_produto?: number;
  codigo?: string;
  descricao?: string;
  valor_unitario?: number | string;
  unidade?: string;
  inativo?: string;
};

type ListarProdutosRes = {
  pagina?: number;
  total_de_paginas?: number;
  nTotPaginas?: number;
  produto_servico_cadastro?: OmieProduto[];
};

type EstoqueItem = {
  nCodProd?: number;
  nSaldo?: number | string;
  fisico?: number | string;
};

type ListarPosEstoqueRes = {
  nPagina?: number;
  nTotPaginas?: number;
  produtos?: EstoqueItem[];
};

function num(v: unknown): number {
  if (v === undefined || v === null) return 0;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function pickImageForDescription(desc: string): string | undefined {
  const d = desc.toLowerCase();
  for (const p of FALLBACK_PRODUCTS) {
    const keys = p.slug.split("-");
    if (keys.some((k) => d.includes(k))) return p.imageUrl;
  }
  return FALLBACK_PRODUCTS[0]?.imageUrl;
}

async function fetchStockMap(): Promise<Map<number, number>> {
  const map = new Map<number, number>();
  const cfg = getOmieConfig();
  if (!cfg) return map;
  let page = 1;
  let totalPages = 1;
  const hoje = todayBr();
  while (page <= totalPages) {
    const res = await omieCall<ListarPosEstoqueRes>(
      "/api/v1/estoque/consulta/",
      "ListarPosEstoque",
      [
        {
          nPagina: page,
          nRegPorPagina: 500,
          dDataPosicao: hoje,
          cExibeTodos: "N",
          codigo_local_estoque: cfg.codigoLocalEstoque,
        },
      ]
    );
    totalPages = res.nTotPaginas ?? 1;
    for (const row of res.produtos ?? []) {
      const id = row.nCodProd;
      if (id === undefined) continue;
      const saldo = Math.max(num(row.fisico), num(row.nSaldo));
      map.set(id, saldo);
    }
    page++;
  }
  return map;
}

async function fetchAllProdutos(): Promise<OmieProduto[]> {
  const out: OmieProduto[] = [];
  let pagina = 1;
  let total = 1;
  while (pagina <= total) {
    const res = await omieCall<ListarProdutosRes>(
      "/api/v1/geral/produtos/",
      "ListarProdutos",
      [
        {
          pagina,
          registros_por_pagina: 50,
          apenas_importado_api: "N",
          filtrar_apenas_omiepdv: "N",
        },
      ]
    );
    total = res.total_de_paginas ?? res.nTotPaginas ?? 1;
    out.push(...(res.produto_servico_cadastro ?? []));
    pagina++;
  }
  return out;
}

export async function GET() {
  if (isVirtualStoreMode()) {
    return NextResponse.json(
      buildDemoCatalogPayload({ explicitDemo: isDemoStore() })
    );
  }

  try {
    const [produtos, stockMap] = await Promise.all([
      fetchAllProdutos(),
      fetchStockMap(),
    ]);
    const products = produtos
      .filter((p) => p.inativo !== "S" && p.codigo_produto != null)
      .map((p) => {
        const id = p.codigo_produto as number;
        const desc = String(p.descricao ?? "");
        return {
          id: String(id),
          codigoProdutoOmie: id,
          sku: String(p.codigo ?? ""),
          name: desc,
          description: desc,
          price: num(p.valor_unitario),
          unit: String(p.unidade ?? "UN"),
          stock: stockMap.has(id) ? stockMap.get(id)! : 0,
          imageUrl: pickImageForDescription(desc),
          source: "omie" as const,
        };
      });
    return NextResponse.json({ source: "omie", products });
  } catch {
    return NextResponse.json(
      {
        error:
          "Não foi possível carregar o catálogo no momento. Tente novamente em instantes.",
        source: "error",
        products: [],
      },
      { status: 502 }
    );
  }
}
