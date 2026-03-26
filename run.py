"""Servidor de desenvolvimento — use também a pasta `host/` para subir localmente."""

from __future__ import annotations

import os
import socket
import sys
import threading
import time
import webbrowser

# Sempre tratar a pasta deste arquivo como raiz do projeto (evita erro se o cwd for outra).
_ROOT = os.path.dirname(os.path.abspath(__file__))
os.chdir(_ROOT)
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

from jca_ecommerce import create_app

app = create_app()


def _port_livre(port: int, host: str = "127.0.0.1") -> bool:
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        s.bind((host, port))
        return True
    except OSError:
        return False
    finally:
        s.close()


def _abrir_navegador(url: str, atraso: float = 1.8) -> None:
    def _go() -> None:
        time.sleep(atraso)
        webbrowser.open(url)

    threading.Thread(target=_go, daemon=True).start()


if __name__ == "__main__":
    preferida = int(os.environ.get("PORT", "8080"))
    host = os.environ.get("HOST", "0.0.0.0")
    abrir = os.environ.get("OPEN_BROWSER", "1").strip() not in ("0", "false", "no")

    port = preferida
    if not _port_livre(port, "127.0.0.1"):
        for p in range(preferida + 1, preferida + 20):
            if _port_livre(p, "127.0.0.1"):
                port = p
                print(f"  AVISO: porta {preferida} ocupada; usando {port}.")
                break
        else:
            print(f"  ERRO: nenhuma porta livre entre {preferida} e {preferida + 19}.")
            sys.exit(1)

    url = f"http://127.0.0.1:{port}/"
    print("\n  ========== JCA Store ==========")
    print(f"  Pasta do projeto: {_ROOT}")
    print(f"  Abra EXATAMENTE: {url}")
    print("  Teste minimo:     http://127.0.0.1:{0}/health".format(port))
    print("  Nao use 'localhost' se a pagina nao abrir — use 127.0.0.1")
    print(f"  Ouvindo em {host}:{port} (debug, sem reloader)\n")

    if abrir:
        _abrir_navegador(url)

    app.run(host=host, port=port, debug=True, use_reloader=False)
