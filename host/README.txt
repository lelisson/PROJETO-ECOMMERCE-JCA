Host local (pasta do repositório)
================================

1. Abra um terminal na RAIZ do repositório (pasta PROJETO E-COMMERCE).

2. Crie o ambiente virtual e instale dependências:
   python -m venv .venv
   .venv\Scripts\activate
   pip install -r requirements.txt

3. Suba o servidor (acesse http://127.0.0.1:5000):
   python run.py

   Ou execute: iniciar-host.bat (Windows) nesta pasta host\

O app escuta em 0.0.0.0:5000 para acesso na rede local.
