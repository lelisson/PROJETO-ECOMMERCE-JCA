import { headers } from "next/headers";

/**
 * URL pública desta instância (Vercel, local, domínio customizado).
 * Opcional: defina NEXT_PUBLIC_SITE_URL para forçar um link fixo (ex.: vitrine).
 */
export async function getPublicSiteUrl(): Promise<string> {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  const h = await headers();
  const rawHost =
    h.get("x-forwarded-host")?.split(",")[0]?.trim() ?? h.get("host") ?? "";
  const rawProto = h.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? "";
  if (rawHost) {
    const proto =
      rawProto ||
      (rawHost.startsWith("localhost") || rawHost.startsWith("127.")
        ? "http"
        : "https");
    return `${proto}://${rawHost}`;
  }

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "")}`;

  return "";
}
