import Link from "next/link";
import {
  LOJA_MATRIZ,
  LOJA_RETIRADA,
  enderecoRetiradaCompleto,
} from "@/lib/loja";

export function Footer() {
  return (
    <footer className="mt-auto">
      <a
        href="#top"
        className="block w-full bg-[#37475a] py-3 text-center text-sm font-medium text-white hover:bg-[#485769]"
      >
        Voltar ao topo
      </a>
      <div className="bg-[#232f3e] py-10 text-gray-300">
        <div className="mx-auto grid max-w-[1600px] gap-8 px-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="mb-3 text-base font-bold text-white">
              Conheça a JCA
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://jcaplasticos.com.br/"
                  className="hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Site institucional
                </a>
              </li>
              <li>
                <Link href="/produtos" className="hover:underline">
                  Catálogo completo
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-base font-bold text-white">
              Atendimento
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="tel:+557932514243" className="hover:underline">
                  (79) 3251-4243
                </a>
              </li>
              <li>
                <a
                  href="mailto:contato@jcaplasticos.com.br"
                  className="hover:underline"
                >
                  contato@jcaplasticos.com.br
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-base font-bold text-white">
              Retirada (e-commerce)
            </h3>
            <p className="text-sm leading-relaxed">
              {enderecoRetiradaCompleto()}
            </p>
            <p className="mt-2 text-xs text-gray-400">
              Filial CNPJ {LOJA_RETIRADA.cnpj} — pedidos desta loja online.
            </p>
          </div>
          <div>
            <h3 className="mb-3 text-base font-bold text-white">Matriz</h3>
            <p className="text-sm leading-relaxed">
              {LOJA_MATRIZ.enderecoLinha1}
              <br />
              {LOJA_MATRIZ.enderecoLinha2}, CEP {LOJA_MATRIZ.cep}
              <br />
              CNPJ {LOJA_MATRIZ.cnpj}
            </p>
            <p className="mt-2 text-xs text-gray-400">
              NF-e/NFC-e conforme processo de faturamento da empresa.
            </p>
          </div>
        </div>
      </div>
      <div className="bg-[#131a22] py-6">
        <div className="mx-auto max-w-[1600px] px-4 text-center">
          <p className="text-sm font-semibold text-white">JCA Plásticos</p>
          <p className="mt-1 text-xs text-gray-500">
            Loja inspirada em layout marketplace · Logo e marca JCA
          </p>
        </div>
      </div>
    </footer>
  );
}
