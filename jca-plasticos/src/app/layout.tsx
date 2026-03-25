import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { MobileCartBar } from "@/components/MobileCartBar";
import { CartProvider } from "@/context/CartContext";
import { SearchProvider } from "@/context/SearchContext";
import "./globals.css";
import { isViewOnlyMode } from "@/lib/view-only";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/** Barra de endereço / guia no mobile com a cor do cabeçalho JCA */
export const viewport: Viewport = {
  themeColor: "#131921",
  colorScheme: "light",
};

/**
 * Favicons iguais ao site oficial (jcaplasticos.com.br/sobre-nos/):
 * 32×32 → Logo-JCA-fav-150x150, 192×192 + apple-touch → Logo-JCA-fav-300x300.
 */
export const metadata: Metadata = {
  applicationName: "JCA Plásticos",
  title: {
    default: "JCA Plásticos — Loja online",
    template: "%s | JCA Plásticos",
  },
  description:
    "Compre produtos JCA online com retirada na filial em Aracaju e documento fiscal.",
  icons: {
    icon: [
      { url: "/jca-favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/jca-favicon-192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/jca-favicon-32.png",
    apple: [{ url: "/jca-favicon-192.png", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "JCA Plásticos",
    statusBarStyle: "black-translucent",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#eaeded] pb-20 text-[#0f1111] sm:pb-0">
        <CartProvider>
          <SearchProvider>
            <Header />
            {isViewOnlyMode() && (
              <div className="bg-slate-700 py-1.5 text-center text-xs font-medium text-white">
                Modo visualização — catálogo para conhecer a loja; compra e checkout
                desligados neste endereço.
              </div>
            )}
            {process.env.NEXT_PUBLIC_DEMO_LOJA === "true" && (
              <div className="bg-amber-400 py-1.5 text-center text-xs font-semibold text-amber-950">
                Modo demonstração — estoque virtual e pagamento simulado
              </div>
            )}
            <main id="top" className="flex-1 scroll-mt-0">
              {children}
            </main>
            <Footer />
            <MobileCartBar />
          </SearchProvider>
        </CartProvider>
      </body>
    </html>
  );
}
