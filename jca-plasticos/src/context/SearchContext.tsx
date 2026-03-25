"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type SearchContextValue = {
  catalogQuery: string;
  setCatalogQuery: (q: string) => void;
  submitSearch: () => void;
};

const SearchContext = createContext<SearchContextValue | null>(null);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [catalogQuery, setCatalogQuery] = useState("");

  const submitSearch = useCallback(() => {
    document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const value = useMemo(
    () => ({ catalogQuery, setCatalogQuery, submitSearch }),
    [catalogQuery, submitSearch]
  );

  return (
    <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
  );
}

export function useCatalogSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) {
    throw new Error("useCatalogSearch requer SearchProvider");
  }
  return ctx;
}
