Host local (pasta do repositório)
================================

IMPORTANTE: o ambiente virtual (.venv) fica na RAIZ do projeto, nao dentro de host\.
Nao rode Python de dentro de host\ sem apontar para o .venv da raiz.

Forma mais simples (Windows): na RAIZ do repositório, dê dois cliques em:
  ABRIR_SITE_JCA.bat
(Isso cria .venv se precisar, instala pacotes e sobe o site. Deixe a janela aberta.)

Alternativa: na pasta host\, use abrir-site-local.bat (ele ja sobe um nivel para a raiz).

---

Manual:

1. Terminal na RAIZ do repositório (pasta PROJETO E-COMMERCE).

2. Ambiente virtual e dependências:
   py -m venv .venv
   .venv\Scripts\activate
   pip install -r requirements.txt

3. Servidor: .\.venv\Scripts\python.exe run.py
   Porta padrao: 8080 → http://127.0.0.1:8080/
   (Outra porta: set PORT=9000 antes de rodar run.py)

Use sempre 127.0.0.1 no navegador. Em alguns PCs "localhost" vai para IPv6 e a pagina nao abre.

Teste automatico (PowerShell, na pasta host\):
  .\testar_porta.ps1

O app escuta em 0.0.0.0 + PORT (rede local).

---

Cópia estática (só visual, sem carrinho dinâmico):

  py host\exportar_copia_site.py

Gera a pasta copia-site\ na raiz. Abra copia-site\index.html ou, na pasta copia-site:

  py -m http.server 8765
  → http://127.0.0.1:8765/
