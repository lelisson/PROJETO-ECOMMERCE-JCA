"use client";

import { useEffect, useMemo, useState } from "react";
import { ProductCard, type CatalogProduct } from "@/components/ProductCard";
import { useCatalogSearch } from "@/context/SearchContext";

function CatalogSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-md border border-gray-200 bg-white p-3 shadow-sm"
        >
          <div className="aspect-square animate-pulse bg-gray-200" />
          <div className="mt-3 space-y-2">
            <div className="h-3 w-full animate-pulse rounded bg-gray-200" />
            <div className="h-3 w-[80%] animate-pulse rounded bg-gray-200" />
            <div className="h-6 w-24 animate-pulse rounded bg-gray-200" />
            <div className="h-8 w-full animate-pulse rounded-md bg-gray-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

type Props = {
  pageMode?: boolean;
  id?: string;
};

export function ProductCatalog({ pageMode = false, id = "catalogo" }: Props) {
  const { catalogQuery } = useCatalogSearch();
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/catalog");
        const data = (await res.json()) as {
          products?: CatalogProduct[];
          source?: string;
          error?: string;
        };
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error ?? "Falha ao carregar catálogo");
          setProducts([]);
        } else {
          setProducts(data.products ?? []);
          setSource(data.source ?? "");
          setError(data.error ?? null);
        }
      } catch {
        if (!cancelled) setError("Não foi possível conectar ao servidor");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = catalogQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q)
    );
  }, [products, catalogQuery]);

  return (
    <section
      id={id}
      className="mx-auto max-w-[1600px] scroll-mt-28 px-3 pb-12 pt-4 sm:px-4 sm:pb-16"
      aria-labelledby={pageMode ? "titulo-produtos" : "titulo-catalogo"}
    >
      <div className="mb-4 border-b border-gray-300 pb-3">
        {pageMode ? (
          <h1
            id="titulo-produtos"
            className="text-lg font-semibold text-[#0f1111] sm:text-xl"
          >
            Produtos
          </h1>
        ) : (
          <h2
            id="titulo-catalogo"
            className="text-lg font-semibold text-[#0f1111] sm:text-xl"
          >
            Destaques da loja
          </h2>
        )}
      </div>

      {error && source === "error" && (
        <p className="mb-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-900">
          {error}
        </p>
      )}

      {loading ? (
        <CatalogSkeleton />
      ) : filtered.length === 0 ? (
        <div className="rounded-md border border-gray-200 bg-white py-16 text-center text-gray-600 shadow-sm">
          {catalogQuery.trim()
            ? "Nenhum resultado. Tente outros termos na busca do topo."
            : "Nenhum item no catálogo no momento."}
        </div>
      ) : (
        <ul className="grid gap-3 overflow-visible p-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {filtered.map((p) => (
            <li key={p.id} className="flex min-h-0">
              <ProductCard product={p} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
