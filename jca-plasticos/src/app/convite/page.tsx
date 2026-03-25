import type { Metadata } from "next";
import Link from "next/link";
import { isViewOnlyMode } from "@/lib/view-only";

export const metadata: Metadata = {
  title: "Link para mostrar a loja",
  description:
    "Como publicar um endereço só para visualização da JCA Plásticos para amigos.",
};

export default function ConvitePage() {
  const jaEstaVisualizacao = isViewOnlyMode();

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900">
        Link só para visualização
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">
        Para mostrar a loja a amigos <strong>sem compra</strong>, publique o site
        com a variável de ambiente abaixo. O endereço que o serviço de hospedagem
        gerar (por exemplo <code className="rounded bg-slate-100 px-1">.vercel.app</code>)
        é o link que você envia.
      </p>

      {jaEstaVisualizacao ? (
        <div className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <p className="font-semibold">Esta instância já está em modo visualização.</p>
          <p className="mt-2">
            Compartilhe a <strong>URL atual</strong> da barra de endereços com quem
            quiser — catálogo e busca funcionam; carrinho e checkout ficam
            desligados.
          </p>
        </div>
      ) : (
        <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-semibold">Aqui a loja ainda aceita pedido de teste.</p>
          <p className="mt-2">
            No painel da hospedagem (ex.: Vercel → Settings → Environment
            Variables), defina{" "}
            <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs">
              NEXT_PUBLIC_APENAS_VISUALIZACAO=true
            </code>{" "}
            e faça um novo deploy. Use o link público desse deploy para os amigos.
          </p>
        </div>
      )}

      <section className="mt-10 space-y-3 text-sm text-slate-700">
        <h2 className="text-base font-semibold text-slate-900">O que muda</h2>
        <ul className="list-inside list-disc space-y-1">
          <li>Faixa no topo avisando modo visualização</li>
          <li>Botão do produto vira “Somente visualização”</li>
          <li>Página de checkout redireciona para a home</li>
          <li>API de pedido recusa envio (segurança)</li>
        </ul>
      </section>

      <p className="mt-10 text-sm">
        <Link href="/" className="font-medium text-[#007185] hover:underline">
          ← Voltar à loja
        </Link>
      </p>
    </div>
  );
}
