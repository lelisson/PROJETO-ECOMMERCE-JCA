"use client";

import { useState } from "react";

type Props = { url: string };

export function CopyPublicUrlButton({ url }: Props) {
  const [state, setState] = useState<"idle" | "ok" | "err">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setState("ok");
      setTimeout(() => setState("idle"), 2000);
    } catch {
      setState("err");
      setTimeout(() => setState("idle"), 2500);
    }
  }

  if (!url) return null;

  return (
    <button
      type="button"
      onClick={copy}
      className="mt-3 inline-flex items-center justify-center rounded-lg bg-[#131921] px-4 py-2 text-sm font-medium text-white hover:bg-[#232f3e]"
    >
      {state === "ok"
        ? "Copiado!"
        : state === "err"
          ? "Não foi possível copiar"
          : "Copiar link"}
    </button>
  );
}
