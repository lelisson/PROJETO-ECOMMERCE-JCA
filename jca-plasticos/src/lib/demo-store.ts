import { randomBytes } from "crypto";
import { FALLBACK_PRODUCTS } from "@/lib/catalog-fallback";
import { generateCodigoRetirada } from "@/lib/codigo-retirada";
import { getOmieConfig } from "@/lib/omie";

/** IDs fixos de produto no modo demonstração (estoque virtual). */
export const DEMO_PRODUCT_ID_BASE = 880_000;

export function isDemoStore(): boolean {
  return process.env.DEMO_LOJA === "true";
}

/**
 * Catálogo e checkout virtuais: quando DEMO_LOJA está ativo ou o Omie não está configurado.
 * Assim a loja funciona localmente sem variáveis de ambiente.
 */
export function isVirtualStoreMode(): boolean {
  return isDemoStore() || getOmieConfig() === null;
}

export function demoProductPrice(index: number): number {
  return Math.round((39.9 + index * 12.5) * 100) / 100;
}

export function buildDemoCatalogPayload(options?: {
  /** true só com DEMO_LOJA — exibe aviso “modo demonstração” no cliente */
  explicitDemo?: boolean;
}) {
  const explicitDemo = options?.explicitDemo ?? false;
  const products = FALLBACK_PRODUCTS.map((p, i) => {
    const codigoProdutoOmie = DEMO_PRODUCT_ID_BASE + i;
    return {
      id: `vdemo-${i}`,
      codigoProdutoOmie,
      sku: p.slug,
      name: p.name,
      description: p.description,
      price: demoProductPrice(i),
      unit: "UN",
      stock: 999,
      imageUrl: p.imageUrl,
      source: "demo" as const,
    };
  });
  return { source: "demo" as const, demo: explicitDemo, products };
}

type CartLine = { codigoProduto: number; quantidade: number };

type PagamentoForma =
  | "pix"
  | "cartao_credito"
  | "cartao_debito"
  | "dinheiro_retirada"
  | "boleto"
  | "transferencia";

export function buildDemoCheckoutResponse(
  input: {
    items: CartLine[];
    pagamentoForma: PagamentoForma;
  },
  options?: { explicitDemo?: boolean }
):
  | { ok: true; body: Record<string, unknown> }
  | { ok: false; error: string; status: number } {
  const explicitDemo = options?.explicitDemo ?? false;
  const n = FALLBACK_PRODUCTS.length;
  let total = 0;

  for (const line of input.items) {
    if (line.quantidade < 1 || !Number.isInteger(line.quantidade)) {
      return {
        ok: false,
        error: "Quantidade inválida nos itens",
        status: 400,
      };
    }
    const idx = line.codigoProduto - DEMO_PRODUCT_ID_BASE;
    if (idx < 0 || idx >= n) {
      return {
        ok: false,
        error:
          "Carrinho desatualizado. Volte à loja, esvazie o carrinho e adicione os produtos novamente.",
        status: 400,
      };
    }
    total += demoProductPrice(idx) * line.quantidade;
  }

  total = Math.round(total * 100) / 100;
  const codigoRetirada = generateCodigoRetirada();
  const txid = randomBytes(10).toString("hex").toUpperCase();

  const copiaECola =
    `00020126820014br.gov.bcb.pix0136${txid}5204000053039865802BR5925JCA PLASTICOS SIMULACAO6009ARACAJU62070503***6304` +
    `${String(Math.floor(Math.random() * 9000) + 1000)}` +
    `|VALOR:${total.toFixed(2)}|MODO_TESTE_NAO_PAGAR`;

  const body: Record<string, unknown> = {
    ok: true,
    demo: explicitDemo,
    codigoRetirada,
    valorTotal: total,
    mensagem: explicitDemo
      ? "Pedido de demonstração registrado. Siga as instruções de pagamento e retirada abaixo."
      : "Pedido registrado. Siga as instruções abaixo para pagamento e retirada na filial.",
  };

  if (input.pagamentoForma === "pix") {
    body.pix = {
      copiaECola,
      txid,
      valorFormatado: total.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      }),
    };
  }

  return { ok: true, body };
}
