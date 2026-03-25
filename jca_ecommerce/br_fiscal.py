"""Regras de documento fiscal (Brasil): PF x PJ.

Integração real com SEFAZ (NFC-e / NF-e) exige certificado A1, webservices e
ERP fiscal; aqui definimos o tipo e validamos documento para o fluxo de venda.
"""

from __future__ import annotations

import re
from enum import Enum


class TipoCliente(str, Enum):
    FISICA = "pf"
    JURIDICA = "pj"


class TipoDocumentoFiscal(str, Enum):
    """Cupom fiscal eletrônico (consumidor) vs nota fiscal eletrônica (B2B)."""

    NFCE = "nfce"  # NFC-e — cupom fiscal eletrônico
    NFE = "nfe"  # NF-e — nota fiscal eletrônica


def tipo_fiscal_para_cliente(tipo: TipoCliente) -> TipoDocumentoFiscal:
    if tipo == TipoCliente.FISICA:
        return TipoDocumentoFiscal.NFCE
    return TipoDocumentoFiscal.NFE


def _only_digits(s: str) -> str:
    return re.sub(r"\D", "", s or "")


def _cpf_valido(d: str) -> bool:
    if len(d) != 11 or d == d[0] * 11:
        return False

    def dv(nums):
        s = sum(int(nums[i]) * (len(nums) + 1 - i) for i in range(len(nums)))
        r = (s * 10) % 11
        return 0 if r == 10 else r

    d1 = dv(d[:9])
    d2 = dv(d[:9] + str(d1))
    return d[-2:] == f"{d1}{d2}"


def _cnpj_valido(d: str) -> bool:
    if len(d) != 14 or d == d[0] * 14:
        return False

    def calc(base):
        w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        w2 = [6] + w1
        s1 = sum(int(base[i]) * w1[i] for i in range(12))
        r1 = 11 - (s1 % 11)
        d1 = 0 if r1 >= 10 else r1
        s2 = sum(int(base[i]) * w2[i] for i in range(12)) + d1 * w2[12]
        r2 = 11 - (s2 % 11)
        d2 = 0 if r2 >= 10 else r2
        return d1, d2

    d1, d2 = calc(d[:12])
    return d[-2:] == f"{d1}{d2}"


def validar_documento(tipo: TipoCliente, documento: str) -> tuple[bool, str]:
    d = _only_digits(documento)
    if tipo == TipoCliente.FISICA:
        if len(d) != 11:
            return False, "CPF deve ter 11 dígitos."
        if not _cpf_valido(d):
            return False, "CPF inválido."
        return True, d
    if len(d) != 14:
        return False, "CNPJ deve ter 14 dígitos."
    if not _cnpj_valido(d):
        return False, "CNPJ inválido."
    return True, d


def formatar_documento_exibicao(tipo: TipoCliente, digits: str) -> str:
    d = _only_digits(digits)
    if tipo == TipoCliente.FISICA and len(d) == 11:
        return f"{d[:3]}.{d[3:6]}.{d[6:9]}-{d[9:]}"
    if tipo == TipoCliente.JURIDICA and len(d) == 14:
        return f"{d[:2]}.{d[2:5]}.{d[5:8]}/{d[8:12]}-{d[12:]}"
    return digits


def label_documento_fiscal(tipo_doc: TipoDocumentoFiscal) -> str:
    if tipo_doc == TipoDocumentoFiscal.NFCE:
        return "NFC-e (cupom fiscal eletrônico)"
    return "NF-e (nota fiscal eletrônica)"
