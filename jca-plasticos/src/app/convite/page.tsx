import type { Metadata } from "next";
import Link from "next/link";
import { CopyPublicUrlButton } from "@/components/CopyPublicUrlButton";
import { getPublicSiteUrl } from "@/lib/public-site-url";
import { isViewOnlyMode } from "@/lib/view-only";

export const metadata: Metadata = {
  title: "Link para mostrar a loja",
  description:
    "Como publicar um endereço só para visualização da JCA Plásticos para amigos.",
};

export default async function ConvitePage() {
  const jaEstaVisualizacao = isViewOnlyMode();
  const publicUrl = await getPublicSiteUrl();

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900">
        Link só para visualização
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">
        Para mostrar a loja a amigos <strong>sem compra</strong>, publique o site
        com a variável de ambiente abaixo. O link abaixo é o endereço{" "}
        <strong>desta instância</strong> (o mesmo da barra do navegador na Vercel
        ou no seu domínio).
      </p>

      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Link gerado deste ambiente
        </p>
        {publicUrl ? (
          <>
            <p className="mt-2 break-all font-mono text-sm text-slate-900">
              {publicUrl}
            </p>
            <CopyPublicUrlButton url={publicUrl} />
          </>
        ) : (
          <p className="mt-2 text-sm text-slate-600">
            Não foi possível detectar a URL. Abra esta página pelo endereço
            público (não pelo preview interno) ou defina{" "}
            <code className="rounded bg-slate-100 px-1 text-xs">
              NEXT_PUBLIC_SITE_URL
            </code>{" "}
            na hospedagem.
          </p>
        )}
      </div>

      {jaEstaVisualizacao ? (
        <div className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <p className="font-semibold">Esta instância já está em modo visualização.</p>
          <p className="mt-2">
            Envie o link acima para quem quiser — catálogo e busca funcionam;
            carrinho e checkout ficam desligados.
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
            e faça um novo deploy. Depois use o mesmo tipo de link (domínio
            público) para os amigos.
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
