/** Loja só para mostrar (sem carrinho/checkout) — ative com NEXT_PUBLIC_APENAS_VISUALIZACAO=true */
export function isViewOnlyMode(): boolean {
  return process.env.NEXT_PUBLIC_APENAS_VISUALIZACAO === "true";
}
