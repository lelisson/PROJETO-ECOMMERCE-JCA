"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";

export function MobileCartBar() {
  const pathname = usePathname();
  const { totalQuantity, subtotal, viewOnly } = useCart();

  if (
    viewOnly ||
    pathname === "/checkout" ||
    totalQuantity === 0
  )
    return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-400 bg-[#232f3e] p-2 shadow-lg sm:hidden">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-1">
        <div className="text-white">
          <p className="text-[11px] text-gray-300">
            Subtotal ({totalQuantity}{" "}
            {totalQuantity === 1 ? "item" : "itens"})
          </p>
          <p className="text-base font-semibold tabular-nums">
            {subtotal.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </p>
        </div>
        <Link
          href="/checkout"
          className="min-w-[130px] rounded-md border border-[#fcd200] bg-[#ffd814] px-4 py-2.5 text-center text-sm font-medium text-[#0f1111] shadow-sm active:bg-[#f0b800]"
        >
          Finalizar compra
        </Link>
      </div>
    </div>
  );
}
