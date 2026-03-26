"""
Cálculo de frete por distância (demonstração).
Origem: endereço da filial de venda / e-commerce (CNPJ 26.295.687/0002-04), Nossa Sra. do Socorro — SE.
Usa OSRM público (OpenStreetMap) para rota rodoviária; se falhar, Haversine + fator de correção.
R$ 0,30 por km (30 centavos de real por quilômetro).
"""

from __future__ import annotations

import json
import math
import re
import urllib.error
import urllib.parse
import urllib.request

# Filial e-commerce (CNPJ 26.295.687/0002-04) — mesmo polo da loja no catálogo online
STORE_ORIGIN_ADDRESS_QUERY = (
    "Av. Perimetral A, Galpão 11, Marcos Freire I, "
    "Nossa Senhora do Socorro, Sergipe, Brasil"
)
STORE_ORIGIN_CEP_LOGRADOURO = "49160-970"  # referência ViaCEP na cidade (área industrial próxima)

# Fallback se geocoding da origem falhar (mapa JCA / região Perimetral)
STORE_LAT_FALLBACK = -10.8457191
STORE_LON_FALLBACK = -37.0700437

_cached_store_coords: tuple[float, float] | None = None

# R$ 0,30 / km → 30 centavos por km
FREIGHT_CENTS_PER_KM = 30

# Se OSRM não responder, estima rota como linha reta × fator
HAVERSINE_ROAD_FACTOR = 1.28

USER_AGENT = "JCA-Ecommerce/1.0 (simulacao-frete; contato@jcaplasticos.com.br)"


def geocode_freeform(query: str) -> tuple[float, float] | None:
    params = urllib.parse.urlencode({"q": query, "format": "json", "limit": "1"})
    url = f"https://nominatim.openstreetmap.org/search?{params}"
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            arr = json.loads(resp.read().decode("utf-8"))
    except (urllib.error.URLError, OSError, ValueError, json.JSONDecodeError):
        return None
    if not arr:
        return None
    try:
        return float(arr[0]["lat"]), float(arr[0]["lon"])
    except (KeyError, TypeError, ValueError):
        return None


def get_store_coordinates() -> tuple[float, float]:
    """Ponto de origem do frete = endereço da filial CNPJ 26.295.687/0002-04 (geocodificado)."""
    global _cached_store_coords
    if _cached_store_coords is not None:
        return _cached_store_coords
    coords = geocode_freeform(STORE_ORIGIN_ADDRESS_QUERY)
    if coords is None:
        alt = geocode_freeform(
            f"{STORE_ORIGIN_CEP_LOGRADOURO}, {STORE_ORIGIN_ADDRESS_QUERY}"
        )
        coords = alt
    if coords is None:
        _cached_store_coords = (STORE_LAT_FALLBACK, STORE_LON_FALLBACK)
    else:
        _cached_store_coords = coords
    return _cached_store_coords


def _only_digits_cep(s: str) -> str:
    d = re.sub(r"\D", "", s or "")
    return d[:8]


def fetch_viacep(cep_digits: str) -> dict | None:
    if len(cep_digits) != 8:
        return None
    url = f"https://viacep.com.br/ws/{cep_digits}/json/"
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=8) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except (urllib.error.URLError, OSError, ValueError, json.JSONDecodeError):
        return None
    if data.get("erro"):
        return None
    return data


def geocode_nominatim(city: str, state: str, cep: str) -> tuple[float, float] | None:
    q = f"{cep}, {city}, {state}, Brasil"
    params = urllib.parse.urlencode({"q": q, "format": "json", "limit": "1"})
    url = f"https://nominatim.openstreetmap.org/search?{params}"
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            arr = json.loads(resp.read().decode("utf-8"))
    except (urllib.error.URLError, OSError, ValueError, json.JSONDecodeError):
        return None
    if not arr:
        return None
    try:
        lat = float(arr[0]["lat"])
        lon = float(arr[0]["lon"])
    except (KeyError, TypeError, ValueError):
        return None
    return lat, lon


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlmb = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlmb / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return r * c


def osrm_driving_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float | None:
    # lon,lat;lon,lat
    path = f"{lon1},{lat1};{lon2},{lat2}"
    url = f"https://router.project-osrm.org/route/v1/driving/{path}?overview=false"
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except (urllib.error.URLError, OSError, ValueError, json.JSONDecodeError):
        return None
    try:
        if data.get("code") != "Ok" or not data.get("routes"):
            return None
        meters = float(data["routes"][0]["distance"])
        return max(0.0, meters / 1000.0)
    except (KeyError, TypeError, ValueError, IndexError):
        return None


def freight_cents_for_km(km: float) -> int:
    if km <= 0:
        return 0
    return int(math.ceil(km) * FREIGHT_CENTS_PER_KM)


def calculate_freight_for_cep(cep_raw: str) -> dict:
    """
    Retorna dict: ok, freight_cents, distance_km, mode ('osrm'|'haversine'),
    address_label, error (se ok False).
    """
    cep = _only_digits_cep(cep_raw)
    if len(cep) != 8:
        return {"ok": False, "error": "CEP deve ter 8 dígitos."}

    via = fetch_viacep(cep)
    if not via:
        return {"ok": False, "error": "CEP não encontrado. Verifique e tente novamente."}

    city = (via.get("localidade") or "").strip()
    state = (via.get("uf") or "").strip()
    if not city or not state:
        return {"ok": False, "error": "Não foi possível localizar cidade/UF para este CEP."}

    coords = geocode_nominatim(city, state, cep)
    if not coords:
        return {"ok": False, "error": "Não foi possível geolocalizar o endereço (tente outro CEP)."}

    lat2, lon2 = coords
    lat1, lon1 = get_store_coordinates()
    km = osrm_driving_km(lat1, lon1, lat2, lon2)
    mode = "osrm"
    if km is None or km <= 0:
        km = haversine_km(lat1, lon1, lat2, lon2) * HAVERSINE_ROAD_FACTOR
        mode = "haversine"

    label = f"{via.get('logradouro', '') or ''}, {city}/{state}".strip(", ")
    cents = freight_cents_for_km(km)

    return {
        "ok": True,
        "freight_cents": cents,
        "distance_km": round(km, 2),
        "mode": mode,
        "address_label": label,
        "origin_label": "Filial JCA (CNPJ 26.295.687/0002-04), Nossa Senhora do Socorro — SE",
    }
