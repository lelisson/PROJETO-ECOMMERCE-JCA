import type { MetadataRoute } from "next";

/** PWA / “Adicionar à tela inicial”: nome curto JCA + ícone oficial */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "JCA Plásticos — Loja online",
    short_name: "JCA",
    description:
      "Produtos JCA com retirada na filial em Aracaju e documento fiscal.",
    start_url: "/",
    display: "standalone",
    background_color: "#131921",
    theme_color: "#131921",
    icons: [
      {
        src: "/jca-favicon-32.png",
        sizes: "150x150",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/jca-favicon-192.png",
        sizes: "300x300",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/jca-favicon-192.png",
        sizes: "300x300",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
