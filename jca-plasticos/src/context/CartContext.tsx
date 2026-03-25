"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CartItem = {
  id: string;
  codigoProdutoOmie: number | null;
  name: string;
  price: number | null;
  unit: string;
  quantity: number;
  imageUrl?: string;
};

type CartContextValue = {
  items: CartItem[];
  /** Catálogo sem compra (env NEXT_PUBLIC_APENAS_VISUALIZACAO) */
  viewOnly: boolean;
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  setQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clear: () => void;
  totalQuantity: number;
  subtotal: number;
};

const CartContext = createContext<CartContextValue | null>(null);

const VIEW_ONLY =
  process.env.NEXT_PUBLIC_APENAS_VISUALIZACAO === "true";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback(
    (item: Omit<CartItem, "quantity"> & { quantity?: number }) => {
      if (VIEW_ONLY) return;
      const q = item.quantity ?? 1;
      setItems((prev) => {
        const i = prev.findIndex((x) => x.id === item.id);
        if (i >= 0) {
          const next = [...prev];
          next[i] = {
            ...next[i],
            quantity: next[i].quantity + q,
          };
          return next;
        }
        return [...prev, { ...item, quantity: q }];
      });
    },
    []
  );

  const setQuantity = useCallback((id: string, quantity: number) => {
    if (quantity < 1) {
      setItems((prev) => prev.filter((x) => x.id !== id));
      return;
    }
    setItems((prev) =>
      prev.map((x) => (x.id === id ? { ...x, quantity } : x))
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const totalQuantity = items.reduce((s, x) => s + x.quantity, 0);
    const subtotal = items.reduce(
      (s, x) => s + (x.price ?? 0) * x.quantity,
      0
    );
    return {
      items,
      viewOnly: VIEW_ONLY,
      addItem,
      setQuantity,
      removeItem,
      clear,
      totalQuantity,
      subtotal,
    };
  }, [items, addItem, setQuantity, removeItem, clear]);

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart deve estar dentro de CartProvider");
  return ctx;
}
