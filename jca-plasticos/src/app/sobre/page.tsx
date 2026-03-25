import type { Metadata } from "next";
import Link from "next/link";
import { LOJA_MATRIZ, LOJA_RETIRADA } from "@/lib/loja";

export const metadata: Metadata = {
  title: "Sobre a empresa",
  description:
    "JCA Plásticos — indústria sergipana de embalagens plásticas desde 2008. Conheça nossa história, produtos e valores.",
};

const SITE_OFICIAL_SOBRE = "https://jcaplasticos.com.br/sobre-nos/";

export default function SobrePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="text-sm font-medium text-[#0c6b7a]">Institucional</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
        Sobre nós
      </h1>
      <p className="mt-4 text-sm text-slate-600">
        Conteúdo alinhado ao site oficial da{" "}
        <a
          href={SITE_OFICIAL_SOBRE}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-[#007185] underline-offset-2 hover:underline"
        >
          JCA Plásticos
        </a>
        .
      </p>

      <section className="mt-10 space-y-4 text-slate-700">
        <h2 className="text-xl font-semibold text-slate-900">Quem somos</h2>
        <p className="text-base leading-relaxed">
          A <strong>JCA Plásticos</strong> é uma empresa genuinamente{" "}
          <strong>sergipana</strong> que atua no mercado de{" "}
          <strong>embalagens plásticas</strong>, com atuação expressiva nos
          segmentos de bebidas e alimentos, logística e distribuição, cosméticos
          e construção civil.
        </p>
        <p className="text-base leading-relaxed">
          Fundada em <strong>2008</strong>, está localizada no maior polo
          industrial sergipano, em <strong>Nossa Senhora do Socorro</strong>.
          Nossa história reflete o que buscamos: gerar soluções e resultados
          consistentes para nossos clientes, com aperfeiçoamento contínuo dos
          produtos e da qualificação das equipes.
        </p>
        <blockquote className="border-l-4 border-[#0c6b7a] bg-slate-50 py-3 pl-4 pr-2 text-base italic text-slate-800">
          Oferecer aos clientes soluções e produtos com segurança, agilidade,
          economia e qualidade.
        </blockquote>
      </section>

      <section className="mt-12 space-y-4 text-slate-700">
        <h2 className="text-xl font-semibold text-slate-900">
          Fornecemos soluções
        </h2>
        <p className="text-base leading-relaxed">
          A sua empresa <strong>cresce conosco</strong>. Entre as linhas que
          atendemos estão fita de arquear (PET), fita adesiva, filme contrátil,
          filme stretch e filme embala tudo — sempre com foco em resistência,
          praticidade e adequação ao seu processo.
        </p>
      </section>

      <section className="mt-12 space-y-4 text-slate-700">
        <h2 className="text-xl font-semibold text-slate-900">Visão</h2>
        <p className="text-base leading-relaxed">
          Ser reconhecida no mercado nacional como empresa de excelência no
          segmento de embalagens plásticas pela qualidade dos produtos e pela
          plena satisfação dos parceiros.
        </p>
        <p className="text-base leading-relaxed">
          Buscamos sempre atingir e superar as expectativas dos clientes com
          responsabilidade e ética — compromisso ligado ao crescimento da JCA.
        </p>
      </section>

      <section className="mt-12 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Contato (matriz)</h2>
        <ul className="mt-4 space-y-2 text-sm text-slate-700">
          <li>
            <span className="font-medium text-slate-900">Endereço: </span>
            {LOJA_MATRIZ.enderecoLinha1}, {LOJA_MATRIZ.enderecoLinha2} — CEP{" "}
            {LOJA_MATRIZ.cep}
          </li>
          <li>
            <span className="font-medium text-slate-900">Telefone: </span>
            <a
              href="tel:+557932514243"
              className="text-[#007185] hover:underline"
            >
              {LOJA_RETIRADA.telefone}
            </a>
          </li>
          <li>
            <span className="font-medium text-slate-900">E-mail: </span>
            <a
              href="mailto:contato@jcaplasticos.com.br"
              className="text-[#007185] hover:underline"
            >
              contato@jcaplasticos.com.br
            </a>
          </li>
          <li className="pt-2 text-xs text-slate-500">
            CNPJ matriz {LOJA_MATRIZ.cnpj} — {LOJA_RETIRADA.razaoSocial}
          </li>
        </ul>
      </section>

      <section className="mt-10 rounded-xl border border-amber-200 bg-amber-50/80 p-5 text-sm text-amber-950">
        <p className="font-semibold">Retirada desta loja online</p>
        <p className="mt-2 leading-relaxed">
          Os pedidos feitos aqui são para retirada na filial de Aracaju. Veja o
          endereço no topo do site ou na página inicial.
        </p>
        <Link
          href="/"
          className="mt-3 inline-block font-medium text-[#0c6b7a] hover:underline"
        >
          Voltar à loja
        </Link>
      </section>
    </div>
  );
}
