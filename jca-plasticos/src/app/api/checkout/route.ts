import { NextResponse } from "next/server";
import { splitPhoneParts, validateCpfCnpj, onlyDigits } from "@/lib/br-doc";
import { generateCodigoRetirada } from "@/lib/codigo-retirada";
import {
  buildDemoCheckoutResponse,
  isDemoStore,
  isVirtualStoreMode,
} from "@/lib/demo-store";
import { enderecoRetiradaCompleto } from "@/lib/loja";
import { isViewOnlyMode } from "@/lib/view-only";
import {
  addDaysBr,
  getOmieConfig,
  omieCall,
  todayBr,
} from "@/lib/omie";

type CartLine = { codigoProduto: number; quantidade: number };

type Body = {
  items: CartLine[];
  cliente: {
    tipoPessoa: "PF" | "PJ";
    cpfCnpj: string;
    nomeRazao: string;
    nomeFantasia?: string;
    inscricaoEstadual?: string;
    email: string;
    telefoneDdd: string;
    telefoneNumero: string;
    cep: string;
    endereco: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    uf: string;
    pagamento: {
      forma:
        | "pix"
        | "cartao_credito"
        | "cartao_debito"
        | "dinheiro_retirada"
        | "boleto"
        | "transferencia";
      infoComplementar?: string;
    };
    retirada: {
      janelaPreferencial?: string;
      observacoes?: string;
    };
    documentoFiscal: "nfe" | "nfce";
    aceiteTermos: boolean;
    autorizacaoWhatsApp?: boolean;
  };
};

type ConsultarProdutoRes = {
  produto_servico_cadastro?: {
    codigo_produto?: number;
    descricao?: string;
    valor_unitario?: number | string;
    unidade?: string;
  };
};

type ClienteStatus = {
  codigo_cliente_omie?: number;
  codigo_status?: string;
  descricao_status?: string;
};

type PedidoResponse = {
  codigo_pedido?: number;
  codigo_pedido_integracao?: string;
  codigo_status?: string | number;
  descricao_status?: string;
  numero_pedido?: string;
};

const MEIO_PAG: Record<Body["cliente"]["pagamento"]["forma"], string> = {
  dinheiro_retirada: "01",
  cartao_credito: "03",
  cartao_debito: "04",
  boleto: "15",
  transferencia: "18",
  pix: "17",
};

function num(v: unknown): number {
  if (v === undefined || v === null) return 0;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function formatDocForOmie(digits: string, tipo: "PF" | "PJ"): string {
  if (tipo === "PF" && digits.length === 11) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }
  if (tipo === "PJ" && digits.length === 14) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
  }
  return digits;
}

export async function POST(req: Request) {
  if (isViewOnlyMode()) {
    return NextResponse.json(
      { error: "Loja em modo somente visualização. Pedidos desativados." },
      { status: 403 }
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { items, cliente } = body;
  if (!items?.length) {
    return NextResponse.json({ error: "Carrinho vazio" }, { status: 400 });
  }
  if (!cliente?.aceiteTermos) {
    return NextResponse.json(
      { error: "É necessário aceitar os termos para continuar" },
      { status: 400 }
    );
  }

  const doc = validateCpfCnpj(cliente.cpfCnpj);
  if (!doc.ok) {
    return NextResponse.json({ error: doc.error }, { status: 400 });
  }
  if (cliente.tipoPessoa === "PF" && doc.digits.length !== 11) {
    return NextResponse.json(
      { error: "Pessoa física deve informar CPF" },
      { status: 400 }
    );
  }
  if (cliente.tipoPessoa === "PJ" && doc.digits.length !== 14) {
    return NextResponse.json(
      { error: "Pessoa jurídica deve informar CNPJ" },
      { status: 400 }
    );
  }

  const { ddd, numero } = splitPhoneParts(
    cliente.telefoneDdd,
    cliente.telefoneNumero
  );
  if (ddd.length < 2 || numero.length < 8) {
    return NextResponse.json(
      { error: "Telefone celular inválido (DDD + número)" },
      { status: 400 }
    );
  }

  const cep = onlyDigits(cliente.cep);
  if (cep.length !== 8) {
    return NextResponse.json({ error: "CEP inválido" }, { status: 400 });
  }

  const meio = MEIO_PAG[cliente.pagamento?.forma];
  if (!meio) {
    return NextResponse.json({ error: "Forma de pagamento inválida" }, { status: 400 });
  }

  if (isVirtualStoreMode()) {
    const demo = buildDemoCheckoutResponse(
      {
        items,
        pagamentoForma: cliente.pagamento.forma,
      },
      { explicitDemo: isDemoStore() }
    );
    if (!demo.ok) {
      return NextResponse.json({ error: demo.error }, { status: demo.status });
    }
    return NextResponse.json(demo.body);
  }

  const cfg = getOmieConfig();
  if (!cfg) {
    return NextResponse.json(
      {
        error:
          "Não foi possível finalizar o pedido no momento. Tente novamente mais tarde ou fale com o atendimento.",
      },
      { status: 503 }
    );
  }

  const docFmt = formatDocForOmie(doc.digits, cliente.tipoPessoa);
  const pedidoIntegracao = `ecomm-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  try {
    const lines: {
      codigo_produto: number;
      quantidade: number;
      valor_unitario: number;
      unidade: string;
      descricao: string;
    }[] = [];

    for (const line of items) {
      if (line.quantidade < 1 || !Number.isInteger(line.quantidade)) {
        return NextResponse.json(
          { error: "Quantidade inválida nos itens" },
          { status: 400 }
        );
      }
      const pr = await omieCall<ConsultarProdutoRes>(
        "/api/v1/geral/produtos/",
        "ConsultarProduto",
        [{ codigo_produto: line.codigoProduto }]
      );
      const p = pr.produto_servico_cadastro;
      if (!p?.codigo_produto) {
        return NextResponse.json(
          {
            error:
              "Um dos produtos não está mais disponível. Atualize o carrinho e tente de novo.",
          },
          { status: 400 }
        );
      }
      const vu = num(p.valor_unitario);
      lines.push({
        codigo_produto: p.codigo_produto,
        quantidade: line.quantidade,
        valor_unitario: vu,
        unidade: String(p.unidade ?? "UN"),
        descricao: String(p.descricao ?? ""),
      });
    }

    const total = lines.reduce(
      (s, l) => s + l.valor_unitario * l.quantidade,
      0
    );
    if (total <= 0) {
      return NextResponse.json(
        { error: "Valor total do pedido inválido" },
        { status: 400 }
      );
    }

    const upsert = await omieCall<ClienteStatus>(
      "/api/v1/geral/clientes/",
      "UpsertClienteCpfCnpj",
      [
        {
          cnpj_cpf: docFmt,
          razao_social: cliente.nomeRazao.trim().slice(0, 60),
          nome_fantasia: (cliente.nomeFantasia ?? cliente.nomeRazao)
            .trim()
            .slice(0, 100),
          email: cliente.email.trim().slice(0, 500),
          telefone1_ddd: ddd,
          telefone1_numero: numero,
          endereco: cliente.endereco.trim().slice(0, 60),
          endereco_numero: cliente.numero.trim().slice(0, 60),
          complemento: (cliente.complemento ?? "").trim().slice(0, 60),
          bairro: cliente.bairro.trim().slice(0, 60),
          cidade: cliente.cidade.trim().slice(0, 40),
          estado: cliente.uf.trim().toUpperCase().slice(0, 2),
          cep: `${cep.slice(0, 5)}-${cep.slice(5)}`,
          pessoa_fisica: cliente.tipoPessoa === "PF" ? "S" : "N",
          inscricao_estadual: (cliente.inscricaoEstadual ?? "")
            .trim()
            .slice(0, 20),
        },
      ]
    );

    const codigoCliente = upsert.codigo_cliente_omie;
    if (!codigoCliente) {
      return NextResponse.json(
        {
          error:
            "Não foi possível salvar seu cadastro. Verifique os dados ou tente mais tarde.",
        },
        { status: 502 }
      );
    }

    const dadosNf = [
      `Retirada (filial): ${enderecoRetiradaCompleto()}`,
      `Documento fiscal desejado: ${cliente.documentoFiscal === "nfce" ? "NFC-e (cupom)" : "NF-e"}`,
      `Retirada na filial — pagamento: ${cliente.pagamento.forma.replace(/_/g, " ")}`,
      cliente.pagamento.infoComplementar
        ? `Ref. pagamento: ${cliente.pagamento.infoComplementar}`
        : "",
      cliente.retirada.janelaPreferencial
        ? `Janela sugerida: ${cliente.retirada.janelaPreferencial}`
        : "",
      cliente.retirada.observacoes
        ? `Obs. retirada: ${cliente.retirada.observacoes}`
        : "",
    ]
      .filter(Boolean)
      .join(" | ");

    const obsVenda = [
      `Pedido e-commerce — retirada na filial ${enderecoRetiradaCompleto()}`,
      `Liberação mediante confirmação de pagamento e conferência fiscal (${cliente.documentoFiscal === "nfce" ? "NFC-e" : "NF-e"}).`,
      cliente.autorizacaoWhatsApp ? "Cliente autorizou contato por WhatsApp." : "",
    ]
      .filter(Boolean)
      .join(" ");

    const det = lines.map((l, idx) => ({
      ide: { codigo_item_integracao: `${pedidoIntegracao}-${idx + 1}` },
      produto: {
        codigo_produto: l.codigo_produto,
        descricao: l.descricao,
        quantidade: l.quantidade,
        valor_unitario: l.valor_unitario,
        unidade: l.unidade,
        valor_desconto: 0,
        tipo_desconto: "V",
      },
    }));

    const dataPrev = todayBr();
    const venc = addDaysBr(1);

    const pedidoBody: Record<string, unknown> = {
      cabecalho: {
        codigo_pedido_integracao: pedidoIntegracao,
        codigo_cliente: codigoCliente,
        data_previsao: dataPrev,
        etapa: cfg.etapaPedido,
        codigo_parcela: cfg.codigoParcela,
        origem_pedido: "API",
      },
      frete: { modalidade: "9" },
      informacoes_adicionais: {
        codigo_categoria: cfg.codigoCategoria,
        codigo_conta_corrente: cfg.codigoContaCorrente,
        consumidor_final: cliente.tipoPessoa === "PF" ? "S" : "N",
        utilizar_emails: cliente.email.trim(),
        enviar_email: "N",
        dados_adicionais_nf: dadosNf,
        meio_pagamento: meio,
        descr_meio_pagamento:
          cliente.pagamento.forma === "pix"
            ? "PIX"
            : cliente.pagamento.forma === "dinheiro_retirada"
              ? "Dinheiro na retirada"
              : cliente.pagamento.forma.replace(/_/g, " "),
      },
      observacoes: { obs_venda: obsVenda },
      det,
    };

    if (cfg.codigoParcela === "999") {
      (pedidoBody.cabecalho as Record<string, unknown>).qtde_parcelas = 1;
      pedidoBody.lista_parcelas = {
        parcela: [
          {
            data_vencimento: venc,
            numero_parcela: 1,
            percentual: 100,
            valor: Math.round(total * 100) / 100,
          },
        ],
      };
    }

    const pedido = await omieCall<PedidoResponse>(
      "/api/v1/produtos/pedido/",
      "IncluirPedido",
      [pedidoBody]
    );

    const st = pedido.codigo_status;
    const okStatus =
      st === undefined ||
      st === null ||
      st === "" ||
      st === "0" ||
      st === 0;
    if (!okStatus) {
      return NextResponse.json(
        {
          error:
            "Não foi possível registrar o pedido. Tente novamente ou entre em contato com a loja.",
        },
        { status: 502 }
      );
    }

    const codigoRetirada = generateCodigoRetirada();

    return NextResponse.json({
      ok: true,
      codigoPedidoOmie: pedido.codigo_pedido,
      codigoPedidoIntegracao: pedido.codigo_pedido_integracao ?? pedidoIntegracao,
      numeroPedido: pedido.numero_pedido,
      codigoRetirada,
      valorTotal: Math.round(total * 100) / 100,
      mensagem:
        "Pedido registrado. Após confirmação do pagamento, retire na filial indicada com documento, comprovante e o código de retirada. A emissão de NF-e ou NFC-e segue o processo de faturamento.",
    });
  } catch {
    return NextResponse.json(
      {
        error:
          "Não foi possível concluir o pedido. Tente novamente em instantes ou fale com o atendimento.",
      },
      { status: 502 }
    );
  }
}
