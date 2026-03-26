# E-commerce JCA Plásticos

Loja virtual em **Python (Flask)** para a **JCA Indústria de Material Plástico Ltda** (CNPJ **26.295.687/0002-04**), com catálogo alinhado ao site institucional [jcaplasticos.com.br](https://jcaplasticos.com.br/), navegação no estilo marketplace (busca, categorias, carrinho lateral) e fluxo de checkout com distinção fiscal **Pessoa Física (NFC-e)** / **Pessoa Jurídica (NF-e)** — validação de documentos no próprio sistema, **sem integração com SEFAZ** (emissão real fica a cargo do ERP/contador).

**Repositório:** [github.com/lelisson/PROJETO-ECOMMERCE-JCA](https://github.com/lelisson/PROJETO-ECOMMERCE-JCA)

---

## Visualizar o site de qualquer máquina (demo na internet)

O endereço público do ambiente de **pré-visualização** (acompanhar o desenvolvimento no navegador, celular ou outro PC) é:

| Demo (Render) | Link |
|----------------|------|
| **Loja ao vivo** | **[https://projeto-ecommerce-jca.onrender.com](https://projeto-ecommerce-jca.onrender.com)** |

**Primeira vez — ativar o link**

Com a conta Render aberta no navegador, use **um clique** (o GitHub precisa autorizar o app Render no repositório, se ainda não fez):

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/lelisson/PROJETO-ECOMMERCE-JCA)

Link direto (mesmo efeito): [render.com/deploy?repo=https://github.com/lelisson/PROJETO-ECOMMERCE-JCA](https://render.com/deploy?repo=https://github.com/lelisson/PROJETO-ECOMMERCE-JCA)

Na tela do Render, confira o serviço definido pelo [`render.yaml`](render.yaml) e clique para aplicar. O primeiro build leva alguns minutos; quando ficar **Live**, o link da tabela acima deve abrir o site. O blueprint inclui **`autoDeployTrigger: commit`**: cada **push** na branch ligada (ex.: `main`) dispara deploy automático. Se o serviço já existia com auto-deploy desligado, sincronize o blueprint no painel ou em **Settings → Auto-Deploy → On Commit**.

**Alternativa manual:** [Dashboard](https://dashboard.render.com) → **New → Blueprint** → repositório **PROJETO-ECOMMERCE-JCA**.

Se o Render avisar que o nome do serviço `projeto-ecommerce-jca` já existe em outra conta, escolha outro nome no painel; o endereço será `https://<nome-que-você-definir>.onrender.com` — atualize o link neste README para bater com o domínio mostrado no dashboard.

**Plano gratuito:** o serviço pode “dormir” após inatividade; a primeira visita após isso pode levar ~1 minuto para acordar.

**Compartilhar o que está rodando só no seu PC (sem deploy):** com o site em `python run.py`, instale o [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/) e rode `cloudflared tunnel --url http://127.0.0.1:8080` — será exibido um URL temporário `https://....trycloudflare.com` válido enquanto o comando estiver aberto.

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

Para **demo na internet**, use o **Blueprint** do Render descrito na seção [Visualizar o site de qualquer máquina](#visualizar-o-site-de-qualquer-máquina-demo-na-internet) (`render.yaml` + `wsgi.py` + Gunicorn).

Em ambiente **sério** (vendas reais), considere também:

- `SECRET_KEY` forte (no Render pode sobrescrever a variável gerada);
- banco persistente (**PostgreSQL** via `DATABASE_URL` — no plano gratuito o SQLite no disco efêmero pode ser apagado em reinícios);
- HTTPS e política de cookies/sessão adequada.

A emissão de **NFC-e/NF-e** real não faz parte deste projeto; use seu ERP ou serviço fiscal homologado.

---

## Licença e uso

Projeto de uso interno / cliente **JCA**. Ajuste licença e termos conforme necessidade da empresa.
