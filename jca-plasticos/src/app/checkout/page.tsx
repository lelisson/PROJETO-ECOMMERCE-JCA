"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  formatCep,
  formatCpfCnpj,
  onlyDigits,
  validateCpfCnpj,
} from "@/lib/br-doc";
import { useCart } from "@/context/CartContext";

type FormaPagamento =
  | "pix"
  | "cartao_credito"
  | "cartao_debito"
  | "dinheiro_retirada"
  | "boleto"
  | "transferencia";

const defaultState = {
  tipoPessoa: "PF" as "PF" | "PJ",
  cpfCnpj: "",
  nomeRazao: "",
  nomeFantasia: "",
  inscricaoEstadual: "",
  email: "",
  telefoneDdd: "",
  telefoneNumero: "",
  cep: "",
  endereco: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  uf: "",
  formaPagamento: "pix" as FormaPagamento,
  infoPagamento: "",
  janelaRetirada: "",
  obsRetirada: "",
  documentoFiscal: "nfe" as "nfe" | "nfce",
  aceiteTermos: false,
  autorizacaoWhatsApp: false,
};

const VIEW_ONLY =
  process.env.NEXT_PUBLIC_APENAS_VISUALIZACAO === "true";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, setQuantity, removeItem, subtotal, clear } = useCart();

  useEffect(() => {
    if (VIEW_ONLY) router.replace("/");
  }, [router]);
  const [f, setF] = useState(defaultState);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);

  type PurchaseDone = {
    demo?: boolean;
    codigoRetirada: string;
    valorTotal?: number;
    pix?: { copiaECola: string; valorFormatado?: string; txid?: string };
    mensagem?: string;
  };
  const [done, setDone] = useState<PurchaseDone | null>(null);
  const [pixConfirmado, setPixConfirmado] = useState(false);

  const [cepLookupBusy, setCepLookupBusy] = useState(false);
  const [cepLookupMsg, setCepLookupMsg] = useState<string | null>(null);
  const [cnpjLookupBusy, setCnpjLookupBusy] = useState(false);
  const [cnpjLookupMsg, setCnpjLookupMsg] = useState<string | null>(null);
  const lastCepAutofillDigits = useRef("");

  const omieReady = items.every(
    (i) => i.codigoProdutoOmie != null && i.price != null
  );

  const formCepRef = useRef(f.cep);
  formCepRef.current = f.cep;

  useEffect(() => {
    const d = onlyDigits(f.cep);
    if (d.length !== 8) {
      lastCepAutofillDigits.current = "";
      return;
    }
    if (d === lastCepAutofillDigits.current) return;

    const t = setTimeout(() => {
      const live = onlyDigits(formCepRef.current);
      if (live !== d) return;

      void (async () => {
        setCepLookupBusy(true);
        setCepLookupMsg(null);
        try {
          const res = await fetch(`/api/cep/${live}`);
          const data = (await res.json()) as {
            error?: string;
            logradouro?: string;
            complemento?: string;
            bairro?: string;
            localidade?: string;
            uf?: string;
          };
          if (!res.ok) {
            setCepLookupMsg(data.error ?? "CEP não encontrado");
            return;
          }
          lastCepAutofillDigits.current = live;
          setF((s) => ({
            ...s,
            cep: formatCep(live),
            endereco: data.logradouro ?? "",
            complemento: data.complemento ?? "",
            bairro: data.bairro ?? "",
            cidade: data.localidade ?? "",
            uf: data.uf ?? "",
            numero: "",
          }));
        } catch {
          setCepLookupMsg("Falha ao buscar o CEP");
        } finally {
          setCepLookupBusy(false);
        }
      })();
    }, 400);

    return () => clearTimeout(t);
  }, [f.cep]);

  async function handleDocBlur() {
    setCnpjLookupMsg(null);
    if (f.tipoPessoa !== "PJ") return;
    const v = validateCpfCnpj(f.cpfCnpj);
    if (!v.ok || v.digits.length !== 14) return;

    setCnpjLookupBusy(true);
    try {
      const res = await fetch(`/api/cnpj/${v.digits}`);
      const data = (await res.json()) as {
        error?: string;
        razao_social?: string;
        nome_fantasia?: string;
        cep?: string;
        logradouro?: string;
        complemento?: string;
        bairro?: string;
        municipio?: string;
        uf?: string;
      };
      if (!res.ok) {
        setCnpjLookupMsg(data.error ?? "Não foi possível carregar o CNPJ");
        return;
      }
      const cepD = onlyDigits(data.cep ?? "");
      lastCepAutofillDigits.current = cepD.length === 8 ? cepD : "";
      setF((s) => ({
        ...s,
        nomeRazao: data.razao_social || s.nomeRazao,
        nomeFantasia: data.nome_fantasia ?? s.nomeFantasia,
        cep: cepD.length === 8 ? formatCep(cepD) : s.cep,
        endereco: data.logradouro ?? "",
        complemento: data.complemento ?? "",
        bairro: data.bairro ?? "",
        cidade: data.municipio ?? "",
        uf: data.uf ?? "",
        numero: "",
      }));
    } catch {
      setCnpjLookupMsg("Falha ao buscar dados do CNPJ");
    } finally {
      setCnpjLookupBusy(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    if (!items.length) {
      setResult({ ok: false, text: "Adicione itens ao carrinho." });
      return;
    }
    if (!omieReady) {
      setResult({
        ok: false,
        text: "Inclua apenas produtos com preço exibido na loja para finalizar a compra.",
      });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            codigoProduto: i.codigoProdutoOmie,
            quantidade: i.quantity,
          })),
          cliente: {
            tipoPessoa: f.tipoPessoa,
            cpfCnpj: f.cpfCnpj,
            nomeRazao: f.nomeRazao,
            nomeFantasia: f.nomeFantasia,
            inscricaoEstadual: f.inscricaoEstadual,
            email: f.email,
            telefoneDdd: f.telefoneDdd,
            telefoneNumero: f.telefoneNumero,
            cep: f.cep,
            endereco: f.endereco,
            numero: f.numero,
            complemento: f.complemento,
            bairro: f.bairro,
            cidade: f.cidade,
            uf: f.uf,
            pagamento: {
              forma: f.formaPagamento,
              infoComplementar: f.infoPagamento,
            },
            retirada: {
              janelaPreferencial: f.janelaRetirada,
              observacoes: f.obsRetirada,
            },
            documentoFiscal: f.documentoFiscal,
            aceiteTermos: f.aceiteTermos,
            autorizacaoWhatsApp: f.autorizacaoWhatsApp,
          },
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        ok?: boolean;
        demo?: boolean;
        codigoRetirada?: string;
        valorTotal?: number;
        pix?: { copiaECola: string; valorFormatado?: string; txid?: string };
        numeroPedido?: string;
        codigoPedidoOmie?: number;
        codigoPedidoIntegracao?: string;
        mensagem?: string;
      };
      if (!res.ok) {
        setResult({ ok: false, text: data.error ?? "Erro ao enviar pedido." });
        return;
      }
      clear();
      setF(defaultState);
      setCepLookupMsg(null);
      setCnpjLookupMsg(null);
      lastCepAutofillDigits.current = "";
      setResult(null);
      setPixConfirmado(false);
      if (data.codigoRetirada) {
        setDone({
          demo: data.demo,
          codigoRetirada: data.codigoRetirada,
          valorTotal: data.valorTotal,
          pix: data.pix,
          mensagem: data.mensagem,
        });
      } else {
        setResult({
          ok: true,
          text:
            data.mensagem ??
            `Pedido ${data.numeroPedido ?? data.codigoPedidoIntegracao ?? ""} registrado.`,
        });
      }
    } catch {
      setResult({ ok: false, text: "Falha de rede. Tente novamente." });
    } finally {
      setBusy(false);
    }
  }

  if (VIEW_ONLY) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center text-slate-600">
        <p className="font-medium text-slate-800">Modo somente visualização</p>
        <p className="mt-2 text-sm">
          Checkout desligado neste endereço. Voltando à vitrine…
        </p>
        <Link
          href="/"
          className="mt-6 inline-block text-sm font-medium text-[#007185] hover:underline"
        >
          Ir para a loja agora
        </Link>
      </div>
    );
  }

  const field =
    "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#0c6b7a] focus:outline-none focus:ring-1 focus:ring-[#0c6b7a]";

  if (done) {
    const mostrarCodigo = !done.pix || pixConfirmado;
    return (
      <div className="mx-auto max-w-lg px-4 py-10 sm:px-6">
        {done.demo && (
          <p className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-center text-sm text-amber-950">
            Modo demonstração — sem cobrança real e sem integração de pagamento.
          </p>
        )}
        <h1 className="text-2xl font-bold text-slate-900">Pedido recebido</h1>
        {done.mensagem && (
          <p className="mt-2 text-slate-600">{done.mensagem}</p>
        )}
        {done.valorTotal != null && (
          <p className="mt-2 text-lg font-semibold text-slate-900">
            Total:{" "}
            {done.valorTotal.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </p>
        )}

        {done.pix && !pixConfirmado && (
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="font-semibold text-slate-900">PIX (simulação)</h2>
            <p className="mt-1 text-sm text-slate-600">
              Use o código abaixo só para teste. Clique em &quot;Simular PIX
              pago&quot; para liberar o código de retirada.
            </p>
            {done.pix.valorFormatado && (
              <p className="mt-2 text-sm font-medium text-slate-800">
                Valor: {done.pix.valorFormatado}
              </p>
            )}
            <textarea
              readOnly
              className="mt-3 w-full rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-800"
              rows={4}
              value={done.pix.copiaECola}
            />
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-300"
                onClick={() =>
                  void navigator.clipboard.writeText(done.pix!.copiaECola)
                }
              >
                Copiar código PIX
              </button>
              <button
                type="button"
                className="rounded-lg bg-[#0c6b7a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0a5a66]"
                onClick={() => setPixConfirmado(true)}
              >
                Simular PIX pago
              </button>
            </div>
          </div>
        )}

        {done.pix && pixConfirmado && (
          <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            Pagamento PIX confirmado (simulação). Guarde o código abaixo para a
            retirada.
          </p>
        )}

        {mostrarCodigo && (
          <div className="mt-6 rounded-xl border-2 border-dashed border-[#0c6b7a] bg-slate-50 p-6 text-center">
            <p className="text-sm font-medium text-slate-600">
              Código para retirada na filial
            </p>
            <p className="mt-3 break-all font-mono text-3xl font-bold tracking-wider text-slate-900 sm:text-4xl">
              {done.codigoRetirada}
            </p>
            <p className="mt-3 text-sm text-slate-600">
              Apresente este código na loja com documento com foto e o
              comprovante de pagamento, quando aplicável.
            </p>
            <button
              type="button"
              className="mt-4 text-sm font-medium text-[#007185] hover:underline"
              onClick={() =>
                void navigator.clipboard.writeText(done.codigoRetirada)
              }
            >
              Copiar código
            </button>
          </div>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            onClick={() => {
              setDone(null);
              setPixConfirmado(false);
            }}
          >
            Novo pedido
          </button>
          <Link
            href="/"
            className="rounded-xl bg-[#febd69] px-5 py-3 text-center text-sm font-semibold text-[#0f1111] hover:bg-[#f3a847]"
          >
            Voltar à loja
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
        Checkout — retirada na filial
      </h1>
      <p className="mt-2 text-slate-600">
        Preencha os dados para emissão de documento fiscal e liberação do pedido
        após confirmação do pagamento. O endereço de retirada está no topo do
        site.
      </p>

      <div className="mt-8 grid gap-10 lg:grid-cols-5">
        <section className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-slate-900">Carrinho</h2>
          {!items.length ? (
            <p className="mt-4 text-sm text-slate-500">Carrinho vazio.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {items.map((i) => (
                <li
                  key={i.id}
                  className="flex gap-3 rounded-xl border border-slate-200 bg-white p-3"
                >
                  {i.imageUrl && (
                    <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                      <Image
                        src={i.imageUrl}
                        alt={i.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900 line-clamp-2">
                      {i.name}
                    </p>
                    <p className="text-sm text-slate-500">
                      {i.price != null
                        ? i.price.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })
                        : "—"}{" "}
                      × {i.quantity}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        className="w-16 rounded border border-slate-300 px-2 py-1 text-sm"
                        value={i.quantity}
                        onChange={(e) =>
                          setQuantity(i.id, parseInt(e.target.value, 10) || 1)
                        }
                      />
                      <button
                        type="button"
                        className="text-sm text-red-600 hover:underline"
                        onClick={() => removeItem(i.id)}
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-6 text-lg font-semibold text-slate-900">
            Subtotal:{" "}
            {subtotal.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </p>
        </section>

        <form
          onSubmit={submit}
          className="space-y-8 lg:col-span-3"
        >
          <fieldset className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <legend className="px-1 text-sm font-semibold text-slate-900">
              Identificação (CPF ou CNPJ)
            </legend>
            <p className="mt-3 text-xs leading-relaxed text-slate-600">
              {f.tipoPessoa === "PF"
                ? "Não existe base pública que devolva endereço só pelo CPF. Na próxima seção, ao completar o CEP, preenchemos rua, bairro, cidade e UF; você informa apenas o número (e complemento, se houver)."
                : "Com CNPJ válido, ao sair do campo buscamos razão social e endereço cadastral (fonte pública). Ajuste o número se for diferente do cadastro."}
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="text-sm font-medium text-slate-700">
                  Tipo
                </span>
                <select
                  className={field}
                  value={f.tipoPessoa}
                  onChange={(e) => {
                    setCnpjLookupMsg(null);
                    setF((s) => ({
                      ...s,
                      tipoPessoa: e.target.value as "PF" | "PJ",
                    }));
                  }}
                >
                  <option value="PF">Pessoa física (CPF)</option>
                  <option value="PJ">Pessoa jurídica (CNPJ)</option>
                </select>
              </label>
              <label className="block sm:col-span-2">
                <span className="text-sm font-medium text-slate-700">
                  CPF ou CNPJ
                </span>
                <input
                  required
                  className={field}
                  value={f.cpfCnpj}
                  onChange={(e) =>
                    setF((s) => ({
                      ...s,
                      cpfCnpj: formatCpfCnpj(e.target.value),
                    }))
                  }
                  onBlur={() => void handleDocBlur()}
                  placeholder={
                    f.tipoPessoa === "PF"
                      ? "000.000.000-00"
                      : "00.000.000/0001-00"
                  }
                  autoComplete="off"
                />
                {f.tipoPessoa === "PJ" && cnpjLookupBusy && (
                  <span className="mt-1 block text-xs text-slate-500">
                    Buscando dados do CNPJ…
                  </span>
                )}
                {f.tipoPessoa === "PJ" && cnpjLookupMsg && (
                  <span className="mt-1 block text-xs text-red-600">
                    {cnpjLookupMsg}
                  </span>
                )}
              </label>
              <label className="block sm:col-span-2">
                <span className="text-sm font-medium text-slate-700">
                  {f.tipoPessoa === "PF" ? "Nome completo" : "Razão social"}
                </span>
                <input
                  required
                  className={field}
                  value={f.nomeRazao}
                  onChange={(e) =>
                    setF((s) => ({ ...s, nomeRazao: e.target.value }))
                  }
                />
              </label>
              {f.tipoPessoa === "PJ" && (
                <>
                  <label className="block sm:col-span-2">
                    <span className="text-sm font-medium text-slate-700">
                      Nome fantasia
                    </span>
                    <input
                      className={field}
                      value={f.nomeFantasia}
                      onChange={(e) =>
                        setF((s) => ({ ...s, nomeFantasia: e.target.value }))
                      }
                    />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="text-sm font-medium text-slate-700">
                      Inscrição estadual (se aplicável)
                    </span>
                    <input
                      className={field}
                      value={f.inscricaoEstadual}
                      onChange={(e) =>
                        setF((s) => ({
                          ...s,
                          inscricaoEstadual: e.target.value,
                        }))
                      }
                      placeholder="Isento, quando for o caso"
                    />
                  </label>
                </>
              )}
            </div>
          </fieldset>

          <fieldset className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <legend className="px-1 text-sm font-semibold text-slate-900">
              Endereço (cadastro cliente / NF)
            </legend>
            <p className="mt-3 text-xs leading-relaxed text-slate-600">
              Consulta de CEP via ViaCEP (base dos Correios). Ao digitar os 8 dígitos,
              logradouro, bairro, cidade e UF são preenchidos; deixamos o número em branco
              para você completar.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">CEP</span>
                <input
                  required
                  className={field}
                  value={f.cep}
                  onChange={(e) => {
                    setCepLookupMsg(null);
                    setF((s) => ({ ...s, cep: formatCep(e.target.value) }));
                  }}
                  placeholder="00000-000"
                  inputMode="numeric"
                  autoComplete="postal-code"
                />
                {cepLookupBusy && (
                  <span className="mt-1 block text-xs text-slate-500">
                    Consultando CEP…
                  </span>
                )}
                {cepLookupMsg && (
                  <span className="mt-1 block text-xs text-red-600">
                    {cepLookupMsg}
                  </span>
                )}
              </label>
              <div className="hidden sm:block" />
              <label className="block sm:col-span-2">
                <span className="text-sm font-medium text-slate-700">
                  Logradouro
                </span>
                <input
                  required
                  className={field}
                  value={f.endereco}
                  onChange={(e) =>
                    setF((s) => ({ ...s, endereco: e.target.value }))
                  }
                  autoComplete="street-address"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Número
                </span>
                <input
                  required
                  className={field}
                  value={f.numero}
                  onChange={(e) =>
                    setF((s) => ({ ...s, numero: e.target.value }))
                  }
                  autoComplete="address-line2"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Complemento
                </span>
                <input
                  className={field}
                  value={f.complemento}
                  onChange={(e) =>
                    setF((s) => ({ ...s, complemento: e.target.value }))
                  }
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-sm font-medium text-slate-700">
                  Bairro
                </span>
                <input
                  required
                  className={field}
                  value={f.bairro}
                  onChange={(e) =>
                    setF((s) => ({ ...s, bairro: e.target.value }))
                  }
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Cidade
                </span>
                <input
                  required
                  className={field}
                  value={f.cidade}
                  onChange={(e) =>
                    setF((s) => ({ ...s, cidade: e.target.value }))
                  }
                  autoComplete="address-level2"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">UF</span>
                <input
                  required
                  className={field}
                  maxLength={2}
                  value={f.uf}
                  onChange={(e) =>
                    setF((s) => ({
                      ...s,
                      uf: e.target.value.toUpperCase().slice(0, 2),
                    }))
                  }
                  autoComplete="address-level1"
                />
              </label>
            </div>
          </fieldset>

          <fieldset className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <legend className="px-1 text-sm font-semibold text-slate-900">
              Contato
            </legend>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="text-sm font-medium text-slate-700">
                  E-mail (NF-e / comunicação)
                </span>
                <input
                  required
                  type="email"
                  className={field}
                  value={f.email}
                  onChange={(e) =>
                    setF((s) => ({ ...s, email: e.target.value }))
                  }
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">DDD</span>
                <input
                  required
                  className={field}
                  inputMode="numeric"
                  maxLength={2}
                  value={f.telefoneDdd}
                  onChange={(e) =>
                    setF((s) => ({
                      ...s,
                      telefoneDdd: onlyDigits(e.target.value).slice(0, 2),
                    }))
                  }
                  placeholder="79"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Celular
                </span>
                <input
                  required
                  className={field}
                  inputMode="numeric"
                  value={f.telefoneNumero}
                  onChange={(e) =>
                    setF((s) => ({
                      ...s,
                      telefoneNumero: onlyDigits(e.target.value).slice(0, 9),
                    }))
                  }
                  placeholder="99999-9999"
                />
              </label>
            </div>
          </fieldset>

          <fieldset className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <legend className="px-1 text-sm font-semibold text-slate-900">
              Pagamento e liberação
            </legend>
            <div className="mt-4 grid gap-4">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Forma de pagamento
                </span>
                <select
                  className={field}
                  value={f.formaPagamento}
                  onChange={(e) =>
                    setF((s) => ({
                      ...s,
                      formaPagamento: e.target.value as FormaPagamento,
                    }))
                  }
                >
                  <option value="pix">PIX</option>
                  <option value="cartao_credito">Cartão de crédito</option>
                  <option value="cartao_debito">Cartão de débito</option>
                  <option value="dinheiro_retirada">
                    Dinheiro na retirada
                  </option>
                  <option value="transferencia">Transferência (TED/PIX)</option>
                  <option value="boleto">Boleto</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Referência / comprovante (opcional)
                </span>
                <input
                  className={field}
                  value={f.infoPagamento}
                  onChange={(e) =>
                    setF((s) => ({ ...s, infoPagamento: e.target.value }))
                  }
                  placeholder="Ex.: últimos dígitos do cartão, ID PIX, etc."
                />
              </label>
              <p className="text-xs text-slate-500">
                A liberação para retirada com nota ou cupom segue conferência de
                pagamento e faturamento na filial.
              </p>
            </div>
          </fieldset>

          <fieldset className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <legend className="px-1 text-sm font-semibold text-slate-900">
              Retirada e documento fiscal
            </legend>
            <div className="mt-4 grid gap-4">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Documento na retirada
                </span>
                <select
                  className={field}
                  value={f.documentoFiscal}
                  onChange={(e) =>
                    setF((s) => ({
                      ...s,
                      documentoFiscal: e.target.value as "nfe" | "nfce",
                    }))
                  }
                >
                  <option value="nfe">NF-e (nota fiscal eletrônica)</option>
                  <option value="nfce">NFC-e (cupom fiscal eletrônico)</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Janela sugerida para retirada
                </span>
                <input
                  className={field}
                  value={f.janelaRetirada}
                  onChange={(e) =>
                    setF((s) => ({ ...s, janelaRetirada: e.target.value }))
                  }
                  placeholder="Ex.: manhã 08h–12h, após 14h…"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Observações para a filial
                </span>
                <textarea
                  className={`${field} min-h-[88px]`}
                  value={f.obsRetirada}
                  onChange={(e) =>
                    setF((s) => ({ ...s, obsRetirada: e.target.value }))
                  }
                  placeholder="Placa do veículo, nome de quem retira, etc."
                />
              </label>
            </div>
          </fieldset>

          <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <label className="flex items-start gap-3 text-sm text-slate-700">
              <input
                type="checkbox"
                className="mt-1"
                checked={f.aceiteTermos}
                onChange={(e) =>
                  setF((s) => ({ ...s, aceiteTermos: e.target.checked }))
                }
              />
              <span>
                Declaro que os dados estão corretos para emissão de documento
                fiscal e que entendo que a retirada ocorre na filial (endereço
                no topo do site), após
                confirmação de pagamento e processo de faturamento.
              </span>
            </label>
            <label className="flex items-start gap-3 text-sm text-slate-700">
              <input
                type="checkbox"
                className="mt-1"
                checked={f.autorizacaoWhatsApp}
                onChange={(e) =>
                  setF((s) => ({
                    ...s,
                    autorizacaoWhatsApp: e.target.checked,
                  }))
                }
              />
              <span>Autorizo contato pelo WhatsApp para combinar retirada.</span>
            </label>
          </div>

          {result && (
            <div
              className={`rounded-xl px-4 py-3 text-sm ${
                result.ok
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-900"
                  : "border border-red-200 bg-red-50 text-red-800"
              }`}
            >
              {result.text}
            </div>
          )}

          <button
            type="submit"
            disabled={busy || !items.length}
            className="w-full rounded-xl bg-[#0c6b7a] py-3 text-center font-semibold text-white hover:bg-[#0a5a66] disabled:bg-slate-300"
          >
            {busy ? "Enviando pedido…" : "Confirmar pedido"}
          </button>
        </form>
      </div>
    </div>
  );
}
