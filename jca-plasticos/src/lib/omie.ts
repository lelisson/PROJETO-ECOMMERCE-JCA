const OMIE_BASE = "https://app.omie.com.br";

export type OmieConfig = {
  appKey: string;
  appSecret: string;
  codigoCategoria: string;
  codigoContaCorrente: number;
  codigoParcela: string;
  etapaPedido: string;
  codigoLocalEstoque: number;
};

export function getOmieConfig(): OmieConfig | null {
  const appKey = process.env.OMIE_APP_KEY?.trim();
  const appSecret = process.env.OMIE_APP_SECRET?.trim();
  const codigoCategoria = process.env.OMIE_CODIGO_CATEGORIA?.trim();
  const cc = process.env.OMIE_CODIGO_CONTA_CORRENTE?.trim();
  if (!appKey || !appSecret || !codigoCategoria || !cc) return null;
  const codigoContaCorrente = parseInt(cc, 10);
  if (Number.isNaN(codigoContaCorrente)) return null;
  return {
    appKey,
    appSecret,
    codigoCategoria,
    codigoContaCorrente,
    codigoParcela: process.env.OMIE_CODIGO_PARCELA?.trim() || "999",
    etapaPedido: process.env.OMIE_ETAPA_PEDIDO?.trim() || "10",
    codigoLocalEstoque: parseInt(process.env.OMIE_CODIGO_LOCAL_ESTOQUE || "0", 10) || 0,
  };
}

type OmieEnvelope = {
  faultstring?: string;
  faultcode?: string;
};

export async function omieCall<T>(
  path: string,
  call: string,
  param: unknown[]
): Promise<T> {
  const cfg = getOmieConfig();
  if (!cfg) throw new Error("Omie não configurado");
  const body = {
    call,
    app_key: cfg.appKey,
    app_secret: cfg.appSecret,
    param,
  };
  const res = await fetch(`${OMIE_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const text = await res.text();
  let data: T & OmieEnvelope;
  try {
    data = JSON.parse(text) as T & OmieEnvelope;
  } catch {
    throw new Error(`Resposta inválida da Omie (${res.status})`);
  }
  if (data.faultstring) {
    throw new Error(data.faultstring);
  }
  return data;
}

/** Data dd/mm/aaaa no fuso local */
export function todayBr(): string {
  const n = new Date();
  const d = String(n.getDate()).padStart(2, "0");
  const m = String(n.getMonth() + 1).padStart(2, "0");
  const y = n.getFullYear();
  return `${d}/${m}/${y}`;
}

export function addDaysBr(days: number): string {
  const n = new Date();
  n.setDate(n.getDate() + days);
  const d = String(n.getDate()).padStart(2, "0");
  const m = String(n.getMonth() + 1).padStart(2, "0");
  const y = n.getFullYear();
  return `${d}/${m}/${y}`;
}
