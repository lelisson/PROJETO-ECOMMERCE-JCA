import Image from "next/image";

/** Transição entre páginas: reforça marca JCA enquanto o trecho carrega */
export default function Loading() {
  return (
    <div
      className="flex min-h-[45vh] flex-col items-center justify-center gap-4 bg-[#eaeded] px-4 py-16"
      role="status"
      aria-live="polite"
      aria-label="Carregando"
    >
      <div className="relative h-16 w-16 shrink-0 sm:h-20 sm:w-20">
        <Image
          src="/jca-favicon-192.png"
          alt=""
          fill
          className="object-contain"
          sizes="80px"
          priority
        />
      </div>
      <p className="text-center text-sm font-semibold tracking-tight text-[#131921]">
        JCA Plásticos
      </p>
      <p className="text-xs text-slate-500">Carregando…</p>
    </div>
  );
}
