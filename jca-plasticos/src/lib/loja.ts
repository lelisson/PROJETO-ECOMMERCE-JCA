/**
 * Dados cadastrais para exibição no site e envio do pedido.
 * Filial de retirada: CNPJ 26.295.687/0002-04 (consulta Receita / Brasil API).
 */

export const LOJA_MATRIZ = {
  cnpj: "26.295.687/0001-23",
  enderecoLinha1: "Av. Perimetral A, Galpão 11 — Marcos Freire I",
  enderecoLinha2: "Nossa Sra. do Socorro — SE",
  cep: "49160-000",
} as const;

/** Ponto de retirada dos pedidos feitos neste e-commerce */
export const LOJA_RETIRADA = {
  cnpj: "26.295.687/0002-04",
  razaoSocial: "JCA Indústria de Material Plástico Ltda.",
  nomeFantasia: "JCA Plásticos",
  logradouro: "Rua Acre",
  numero: "715",
  complemento: "Loja C",
  bairro: "Siqueira Campos",
  cidade: "Aracaju",
  uf: "SE",
  cep: "49075-010",
  telefone: "(79) 3251-4243",
} as const;

export function enderecoRetiradaResumido(): string {
  const r = LOJA_RETIRADA;
  return `${r.logradouro}, ${r.numero} — ${r.bairro}, ${r.cidade} — ${r.uf}`;
}

export function enderecoRetiradaCompleto(): string {
  const r = LOJA_RETIRADA;
  return `${r.logradouro}, ${r.numero}, ${r.complemento} — ${r.bairro}, ${r.cidade} — ${r.uf}, CEP ${r.cep} — CNPJ ${r.cnpj}`;
}
