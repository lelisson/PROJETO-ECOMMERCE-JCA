"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";

export type CatalogProduct = {
  id: string;
  codigoProdutoOmie: number | null;
  sku: string;
  name: string;
  description: string;
  price: number | null;
  unit: string;
  stock: number | null;
  imageUrl?: string | null;
};

/** Exibição de preço estilo marketplace (R$ + inteiro + centavos) */
function PriceAmazon({ value }: { value: number | null }) {
  if (value === null) {
    return (
      <span className="text-base font-medium text-gray-700">Sob consulta</span>
    );
  }
  const [ints, cents] = value.toFixed(2).split(".");
  return (
    <span className="text-[#0f1111]">
      <span className="align-top text-xs font-medium">R$</span>
      <span className="text-2xl font-medium tabular-nums">{ints}</span>
      <span className="align-top text-sm font-medium">{cents}</span>
    </span>
  );
}

export function ProductCard({ product }: { product: CatalogProduct }) {
  const { addItem, viewOnly } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  const canBuy =
    !viewOnly &&
    product.codigoProdutoOmie != null &&
    product.price != null &&
    (product.stock === null || product.stock > 0);

  useEffect(() => {
    if (!justAdded) return;
    const t = setTimeout(() => setJustAdded(false), 2000);
    return () => clearTimeout(t);
  }, [justAdded]);

  function handleAdd() {
    addItem({
      id: product.id,
      codigoProdutoOmie: product.codigoProdutoOmie,
      name: product.name,
      price: product.price,
      unit: product.unit,
      imageUrl: product.imageUrl ?? undefined,
    });
    setJustAdded(true);
  }

  return (
    <article className="relative flex h-full w-full origin-center flex-col rounded-md border border-gray-200 bg-white p-3 shadow-sm transition-[transform,box-shadow] duration-300 ease-out motion-safe:hover:z-20 motion-safe:hover:scale-[1.05] motion-safe:hover:shadow-xl">
      <div className="relative aspect-square overflow-hidden rounded-md bg-white p-2">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="pointer-events-none object-contain mix-blend-multiply select-none"
            sizes="(max-width:640px) 50vw, (max-width:1280px) 33vw, 20vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-gray-400">
            Sem imagem
          </div>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col pt-1">
        <h2 className="line-clamp-2 min-h-[2.5rem] text-sm leading-snug text-[#007185] hover:text-[#c7511f] hover:underline">
          {product.name}
        </h2>
        <p className="mt-1 line-clamp-2 text-xs text-gray-600">
          {product.description}
        </p>

        {product.stock !== null && (
          <div className="mt-2 text-xs">
            <span
              className={
                product.stock > 0
                  ? "font-medium text-[#007600]"
                  : "font-medium text-gray-500"
              }
            >
              {product.stock} un.
            </span>
          </div>
        )}

        <div className="mt-2">
          <PriceAmazon value={product.price} />
        </div>

        <button
          type="button"
          disabled={!canBuy}
          onClick={handleAdd}
          className="relative z-10 mt-3 w-full rounded-lg border border-[#fcd200] bg-[#ffd814] py-2 text-xs font-semibold text-[#0f1111] shadow-sm transition hover:bg-[#f7ca00] active:bg-[#f0b800] disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-200 disabled:text-gray-500 disabled:shadow-none"
        >
          {viewOnly
            ? "Somente visualização"
            : justAdded
              ? "Adicionado ✓"
              : "Adicionar ao carrinho"}
        </button>
      </div>
    </article>
  );
}
