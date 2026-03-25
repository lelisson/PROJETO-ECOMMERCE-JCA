/** Catálogo de apresentação alinhado ao site JCA (exibição quando o catálogo integrado não está disponível). */
const BASE = "https://jcaplasticos.com.br/wp-content/uploads";

export type FallbackProduct = {
  slug: string;
  name: string;
  description: string;
  imageUrl: string;
};

export const FALLBACK_PRODUCTS: FallbackProduct[] = [
  {
    slug: "fita-de-arquear",
    name: "Fita de arquear (PET)",
    description:
      "Produzida com matéria prima virgem ou reciclada. Alta resistência à tração.",
    imageUrl: `${BASE}/2025/07/Fita-de-Arquear-768x432.jpg`,
  },
  {
    slug: "fita-adesiva",
    name: "Fita adesiva",
    description:
      "Ideal para uso manual ou em máquinas automáticas.",
    imageUrl: `${BASE}/2025/07/Fita-Adesiva-768x432.jpg`,
  },
  {
    slug: "filme-contratil",
    name: "Filme contrátil",
    description:
      "Termoencolhível, termo-retrátil e shrink.",
    imageUrl: `${BASE}/2025/07/Filme-Contratil-768x432.jpg`,
  },
  {
    slug: "filme-stretch",
    name: "Filme stretch",
    description:
      "Filme estirável para uso doméstico ou industrial.",
    imageUrl: `${BASE}/2025/07/Filme-Stretch-768x432.jpg`,
  },
  {
    slug: "filme-embala-tudo",
    name: "Filme embala tudo",
    description:
      "Filme de polietileno versátil para diversos segmentos.",
    imageUrl: `${BASE}/2025/07/Filme-Stretch-600x430.jpg`,
  },
];
