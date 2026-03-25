"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useCatalogSearch } from "@/context/SearchContext";
import { enderecoRetiradaResumido, LOJA_RETIRADA } from "@/lib/loja";

/** Logo oficial JCA (favicon alta resolução — visível no header escuro) */
const LOGO =
  "https://jcaplasticos.com.br/wp-content/uploads/2024/04/Logo-JCA-fav-300x300.png";

function CartIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0016.5 0c.784 2.396 1.733 4.787 2.87 7.134H6.75z"
      />
    </svg>
  );
}

export function Header() {
  const { totalQuantity, viewOnly } = useCart();
  const { catalogQuery, setCatalogQuery, submitSearch } = useCatalogSearch();
  const checkoutHref = viewOnly ? "/#catalogo" : "/checkout";

  function onSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    submitSearch();
  }

  return (
    <header className="sticky top-0 z-50">
      {/* Faixa 1 — estilo Amazon (#131921) */}
      <div className="bg-[#131921] text-white">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-2 px-2 py-2 sm:px-3">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="flex shrink-0 items-center gap-2 rounded px-1 py-1 outline-none ring-white hover:ring-1 focus-visible:ring-2"
            >
              <Image
                src={LOGO}
                alt="JCA Plásticos"
                width={48}
                height={48}
                className="h-10 w-10 object-contain sm:h-11 sm:w-11"
                priority
              />
              <span className="hidden leading-none sm:block">
                <span className="block text-[15px] font-bold tracking-tight">
                  JCA
                </span>
                <span className="block text-[13px] font-semibold text-[#febd69]">
                  .com.br
                </span>
              </span>
            </Link>

            {/* Retirada — âncora para leitores de tela / URL #retirada */}
            <Link
              id="retirada"
              href="/#retirada"
              className="hidden min-w-0 flex-1 scroll-mt-28 flex-col px-2 text-left text-xs leading-tight text-[#ccc] hover:text-white md:flex md:max-w-[200px] lg:max-w-[280px]"
            >
              <span className="pl-6 text-[11px]">Retirada na filial</span>
              <span className="flex items-start gap-1 font-bold text-white">
                <span className="mt-0.5 text-base" aria-hidden>
                  📍
                </span>
                <span className="line-clamp-3 text-sm leading-snug">
                  {enderecoRetiradaResumido()}
                </span>
              </span>
              <span className="pl-6 pt-0.5 text-[10px] text-[#febd69]">
                CNPJ {LOJA_RETIRADA.cnpj}
              </span>
            </Link>

            {/* Busca — desktop inline */}
            <form
              onSubmit={onSearchSubmit}
              className="hidden min-w-0 flex-1 md:flex md:max-w-none"
            >
              <div className="flex w-full overflow-hidden rounded-md shadow-sm">
                <input
                  type="search"
                  placeholder="Buscar na JCA"
                  value={catalogQuery}
                  onChange={(e) => setCatalogQuery(e.target.value)}
                  className="h-10 min-w-0 flex-1 border-0 px-3 text-sm text-[#111] placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#febd69]"
                  aria-label="Buscar produtos"
                />
                <button
                  type="submit"
                  className="shrink-0 bg-[#febd69] px-4 text-sm font-semibold text-[#111] transition hover:bg-[#f3a847]"
                >
                  Buscar
                </button>
              </div>
            </form>

            {/* Conta / pedidos / carrinho — desktop */}
            <div className="ml-auto hidden items-stretch gap-1 md:flex">
              <Link
                href={checkoutHref}
                className="flex flex-col justify-center rounded px-3 py-1 text-left text-xs leading-tight hover:ring-1 hover:ring-white"
              >
                <span className="text-[#ccc]">Olá</span>
                <span className="font-bold">
                  {viewOnly ? "Vitrine" : "Conta e pedidos"}
                </span>
              </Link>
              <Link
                href={checkoutHref}
                className="flex items-end gap-1 rounded px-3 py-1 hover:ring-1 hover:ring-white"
              >
                <div className="relative">
                  <CartIcon className="h-9 w-9 text-white" />
                  {!viewOnly && (
                    <span className="absolute left-[22px] top-0 min-w-[18px] rounded-full bg-[#febd69] px-1 text-center text-xs font-bold leading-[18px] text-[#131921]">
                      {totalQuantity > 99 ? "99+" : totalQuantity}
                    </span>
                  )}
                </div>
                <span className="pb-1 text-sm font-bold leading-none">
                  {viewOnly ? "Catálogo" : "Carrinho"}
                </span>
              </Link>
            </div>

            {/* Mobile: carrinho */}
            <Link
              href={checkoutHref}
              className="relative ml-auto flex items-center rounded p-2 hover:bg-white/10 md:hidden"
              aria-label={viewOnly ? "Catálogo" : "Carrinho"}
            >
              <CartIcon className="h-8 w-8" />
              {!viewOnly && (
                <span className="absolute right-0 top-0 min-w-[18px] rounded-full bg-[#febd69] px-1 text-center text-[11px] font-bold leading-[18px] text-[#131921]">
                  {totalQuantity > 99 ? "99+" : totalQuantity}
                </span>
              )}
            </Link>
          </div>

          {/* Busca — mobile full width */}
          <form onSubmit={onSearchSubmit} className="flex md:hidden">
            <div className="flex w-full overflow-hidden rounded-md shadow-sm">
              <input
                type="search"
                placeholder="Buscar na JCA"
                value={catalogQuery}
                onChange={(e) => setCatalogQuery(e.target.value)}
                className="h-10 min-w-0 flex-1 border-0 px-3 text-sm text-[#111] placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#febd69]"
                aria-label="Buscar produtos"
              />
              <button
                type="submit"
                className="shrink-0 bg-[#febd69] px-4 text-sm font-semibold text-[#111] hover:bg-[#f3a847]"
              >
                Buscar
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Faixa 2 — menu (Amazon #232f3e) */}
      <nav className="flex items-center gap-3 overflow-x-auto whitespace-nowrap bg-[#232f3e] px-3 py-2 text-sm text-white [&::-webkit-scrollbar]:hidden">
        <Link
          href="/#catalogo"
          className="flex items-center gap-1 rounded px-2 py-1 font-bold hover:bg-white/10"
        >
          <span className="text-lg leading-none" aria-hidden>
            ☰
          </span>
          <span>Todos</span>
        </Link>
        <Link href="/#catalogo" className="rounded px-2 py-1 hover:bg-white/10">
          Ofertas do dia
        </Link>
        <Link href="/produtos" className="rounded px-2 py-1 hover:bg-white/10">
          Catálogo completo
        </Link>
        <Link href={checkoutHref} className="rounded px-2 py-1 hover:bg-white/10">
          {viewOnly ? "Catálogo" : "Carrinho"}
        </Link>
        <a
          href="tel:+557932514243"
          className="rounded px-2 py-1 hover:bg-white/10"
        >
          Atendimento
        </a>
        <Link href="/sobre" className="rounded px-2 py-1 hover:bg-white/10">
          Sobre a empresa
        </Link>
        <Link href="/convite" className="rounded px-2 py-1 hover:bg-white/10">
          Link vitrine
        </Link>
      </nav>
    </header>
  );
}
