# E-commerce JCA Plásticos

Loja virtual em **Python (Flask)** para a **JCA Indústria de Material Plástico Ltda** (CNPJ **26.295.687/0002-04**), com catálogo alinhado ao site institucional [jcaplasticos.com.br](https://jcaplasticos.com.br/), navegação no estilo marketplace (busca, categorias, carrinho lateral) e fluxo de checkout com distinção fiscal **Pessoa Física (NFC-e)** / **Pessoa Jurídica (NF-e)** — validação de documentos no próprio sistema, **sem integração com SEFAZ** (emissão real fica a cargo do ERP/contador).

**Repositório:** [github.com/lelisson/PROJETO-ECOMMERCE-JCA](https://github.com/lelisson/PROJETO-ECOMMERCE-JCA)

---

## Requisitos

- Python **3.10+** (recomendado 3.11 ou 3.12)
- `pip`

---

## Como rodar localmente

1. **Clone o repositório**

   ```bash
   git clone https://github.com/lelisson/PROJETO-ECOMMERCE-JCA.git
   cd PROJETO-ECOMMERCE-JCA
   ```

2. **Ambiente virtual (recomendado)**

   ```bash
   python -m venv .venv
   .venv\Scripts\activate
   ```

3. **Instale as dependências**

   ```bash
   pip install -r requirements.txt
   ```

4. **Inicie o servidor**

   ```bash
   python run.py
   ```

   Ou use o atalho na raiz do projeto: **`ABRIR_SITE_JCA.bat`** (abre o navegador após subir o servidor).

5. **Acesse**

   - Loja: [http://127.0.0.1:8080/](http://127.0.0.1:8080/)
   - Saúde da API: [http://127.0.0.1:8080/health](http://127.0.0.1:8080/health)

A porta padrão é **8080**. Para outra porta:

```powershell
$env:PORT="5000"; python run.py
```

---

## Variáveis de ambiente (opcional)

| Variável        | Descrição |
|-----------------|-----------|
| `SECRET_KEY`    | Chave secreta do Flask (obrigatória em produção). |
| `DATABASE_URL`  | URI SQLAlchemy; se omitida, usa SQLite em `instance/jca_store.db`. |
| `PORT`          | Porta HTTP (padrão `8080`). |

Dados da empresa (razão social, CNPJ) estão em `config.py` e podem ser ajustados conforme a filial de venda.

---

## Estrutura do projeto

| Caminho | Função |
|---------|--------|
| `jca_ecommerce/` | Pacote da aplicação: `app`, modelos, rotas, lógica fiscal (`br_fiscal.py`). |
| `jca_ecommerce/templates/` | HTML (Jinja2), layout estilo marketplace + rodapé alinhado ao site JCA. |
| `jca_ecommerce/static/` | CSS, JS (`static/js/app.js` — carrinho AJAX, toasts, totais), imagens em `static/img/produtos/`. |
| `seed.py` | Popular catálogo e imagens locais a partir dos slugs. |
| `run.py` | Ponto de entrada: ajusta `cwd`/`PYTHONPATH`, sobe o Flask. |
| `instance/` | Banco SQLite (criado na primeira execução / seed). |

---

## Catálogo e imagens

- Produtos e categorias podem ser carregados com **`python seed.py`** (mapeia slugs para `image_url` apontando para arquivos em `static/img/produtos/*.jpg`).
- Função **`sync_product_images_from_jca()`** no seed atualiza registros já existentes no banco com as URLs de imagem locais.

---

## API útil (desenvolvimento)

- `GET /api/carrinho/contagem` — retorna a quantidade de itens no carrinho (usada pelo header em JS).
- `POST /carrinho/adicionar/<id>` — adiciona produto; responde JSON quando a requisição pede JSON.

---

## Produção e deploy

Este repositório é pensado para **desenvolvimento e demonstração local**. Para colocar na internet é necessário um **hospedeiro** (VPS, Railway, Render, etc.) com:

- `SECRET_KEY` forte e segredo de sessão;
- banco persistente (PostgreSQL, por exemplo) via `DATABASE_URL`;
- HTTPS e política de cookies/sessão adequada.

A emissão de **NFC-e/NF-e** real não faz parte deste projeto; use seu ERP ou serviço fiscal homologado.

---

## Licença e uso

Projeto de uso interno / cliente **JCA**. Ajuste licença e termos conforme necessidade da empresa.
