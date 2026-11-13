# Contexto do Projeto — CRM Bike Shop (Fortaleza)

> **Atualização em 13/11/2026:** o projeto passou a começar por um **protótipo de interface sem
> back-end**. A seção "Onde paramos" abaixo está desatualizada. Veja o [README](README.md),
> o [CLAUDE.md](CLAUDE.md) e as [decisões pendentes](docs/DECISOES-PENDENTES.md).
> Este documento fica como registro do plano original de stack e integrações.

> Documento de passagem gerado em 27/10/2026 para continuar o projeto em outro computador.
> Ao iniciar uma sessão com o Claude Code na máquina nova, coloque este arquivo na raiz da pasta do projeto e peça:
> **"Leia o CONTEXTO-PROJETO.md e continue a partir da seção 'Onde paramos'."**

---

## 1. Objetivo

MVP de um **CRM em nuvem** para um cliente: uma **bike shop em Fortaleza**.

Requisitos que guiam todas as decisões:

- **Arquitetura simples**, que possa ser **auditada por uma pessoa sem nível sênior**. Essa pessoa conhece pouco TypeScript.
- **Atendimento com IA** via WhatsApp.
- **Integração com o ERP Sankhya**, para o qual já existem credenciais OAuth2 de **produção e de sandbox**.

---

## 2. Decisões tomadas

| Tema | Decisão |
|---|---|
| Stack | Monorepo com Next.js, React, Drizzle e PostgreSQL, em TypeScript. Escolha do dono do projeto, não rediscutir. |
| Fonte da verdade | O **Sankhya** é a fonte da verdade para parceiros (clientes), produtos, preços, estoque, pedidos e notas. O CRM **não duplica** esses dados: consulta e sincroniza. |
| Ordem de Serviço | A loja **não usa** o módulo de OS do Sankhya, então **a OS fica no CRM** (Postgres). As peças usadas na OS vêm do cadastro de produtos do Sankhya (`CODPROD` e preço de tabela). |
| Faturamento | No MVP, o vendedor fatura manualmente no Sankhya. Na fase 2, ao fechar a OS, o CRM gera o pedido de venda no Sankhya. |
| Sankhya | **Começar somente com leitura** e sempre na **sandbox** durante o desenvolvimento. Gravar no ERP só depois de validar. |
| WhatsApp | Usar a **WhatsApp Business Cloud API oficial (Meta)**. Nada de bibliotecas não oficiais (Baileys, Evolution), pelo risco de banimento. Testes com um **número avulso**; o número da loja só migra no piloto. |
| Limites da IA | **Pode:** tirar dúvidas, mostrar opções e informar **preço de tabela** e estoque, sempre consultados no Sankhya na hora, além do status da OS. **Não pode:** dar desconto, negociar ou prometer condições. Quando o cliente quer negociar, transfere para o **vendedor** com um resumo da conversa. |
| Como garantir os limites | Os limites são impostos **no código**: a IA só tem as ferramentas permitidas e não existe ferramenta de desconto. Não dependem só do prompt. |
| Implantação da IA | Primeiro em **modo rascunho**: a IA sugere a resposta e o humano aprova. Depois passa a responder sozinha nos casos simples. |
| Inbox | Obrigatória no MVP. O atendente vê as conversas, assume qualquer uma e a IA pausa naquela conversa. |
| Idioma | **Código e nomes de domínio em inglês** (`customers`, `bikes`, `serviceOrders`, `opportunities`, `conversations`). **README e todos os `.md` em português.** |
| Hospedagem | **Railway** com web, worker e Postgres na mesma plataforma. Motivo: o webhook do WhatsApp, a IA e a sincronização com o Sankhya precisam de processos longos, que na Vercel exigiriam serviços extras de fila. |
| Filas | **pg-boss**, que usa o próprio Postgres, sem Redis. |

---

## 3. Stack

| Camada | Tecnologia |
|---|---|
| Monorepo | pnpm workspaces + Turborepo |
| Web | Next.js (App Router) + React + TypeScript `strict` |
| UI | Tailwind CSS + shadcn/ui |
| Banco | PostgreSQL + Drizzle ORM (schema e migrations versionados) |
| Validação | Zod em toda entrada: formulários, webhooks e respostas do Sankhya |
| Autenticação | Better Auth (adapter Drizzle). Papéis: `manager`, `seller`, `mechanic` |
| IA | Vercel AI SDK + Claude (Sonnet para conversar, Haiku para classificar e resumir) |
| Jobs | pg-boss |
| Testes | Vitest |
| Erros | Sentry |
| Hospedagem | Railway |

Versões publicadas no npm em 27/10/2026 (conferir de novo na hora de instalar):

```
next 16.4.3        react 19.3.1        drizzle-orm 0.45.4   drizzle-kit 0.31.11
postgres 3.4.9     zod 4.6.7           turbo 2.11.10        vitest 5.0.5
tsx 4.23.15        pg-boss 12.38.0     ai 7.0.155           @ai-sdk/anthropic 4.0.90
tailwindcss 4.3.3  better-auth 1.7.14  @types/node 26.6.5
```

> ⚠️ **TypeScript:** a versão mais recente é a 7.0.x, que usa o novo compilador nativo. Para evitar incompatibilidades com o Next.js e outras ferramentas, a recomendação é fixar **TypeScript 5.9.3** (ou 6.0.x, se tudo for compatível) até haver um motivo para subir.

---

## 4. Estrutura do monorepo (planejada)

```
crm-loja/
├── apps/
│   ├── web/          # Next.js: telas do CRM, login, webhook do WhatsApp
│   └── worker/       # Node: sincronização Sankhya + processamento da IA (pg-boss)
├── packages/
│   ├── db/           # schema Drizzle, migrations, queries (ÚNICO que acessa o banco)
│   ├── sankhya/      # cliente da API Sankhya (ÚNICO que fala com o ERP)
│   ├── ai/           # prompts, ferramentas da IA, regras de transbordo
│   └── whatsapp/     # envio/recebimento via Cloud API
├── docs/
│   ├── ARQUITETURA.md
│   ├── AUDITORIA.md
│   ├── GLOSSARIO.md
│   ├── INTEGRACOES.md
│   └── decisoes/     # 0001-....md, 0002-....md (ADRs)
├── .env.example
├── README.md
└── turbo.json
```

**Regras para o código continuar auditável:**

- Só o pacote `packages/db` acessa o banco.
- Só o pacote `packages/sankhya` chama o ERP.
- Componentes React não contêm regra de negócio.
- Zod valida toda entrada externa.
- TypeScript simples: sem tipos genéricos complexos e sem abstrações "espertas". Funções curtas, cada uma com um propósito.
- Credenciais ficam **apenas** em variáveis de ambiente e são usadas só no servidor. Nunca vão para o código, commit ou chat.
- Os testes são escritos em linguagem de negócio, por exemplo: *"IA não deve informar preço sem consultar o Sankhya"*.

---

## 5. Documentos de apoio (todos em português)

O dono do projeto valoriza muito estes documentos. Eles devem nascer com o esqueleto e ser atualizados a cada entrega.

| Arquivo | Conteúdo |
|---|---|
| `README.md` | O que é o projeto e como rodar localmente, passo a passo |
| `docs/ARQUITETURA.md` | Visão geral, diagrama, onde fica cada coisa e o caminho de uma requisição |
| `docs/decisoes/NNNN-*.md` | Um arquivo curto por decisão: contexto, decisão, alternativas e consequências |
| `docs/AUDITORIA.md` | Checklist do auditor para cada entrega: segredos fora do código, validação com Zod, testes passando, permissões por papel |
| `docs/GLOSSARIO.md` | Termo do código (inglês) ↔ termo do negócio ↔ termo do Sankhya. Por exemplo, `customer` = cliente = parceiro (`CODPARC`/TGFPAR) e `product` = produto (`CODPROD`/TGFPRO) |
| `docs/INTEGRACOES.md` | Como funcionam o Sankhya e o WhatsApp, quais variáveis de ambiente usam e o que fazer quando falham |

ADRs iniciais sugeridos:

1. Escolha da stack (monorepo Next.js + Drizzle)
2. Hospedagem no Railway
3. OS mora no CRM
4. Sankhya somente leitura no início
5. Limites da IA e transbordo para o vendedor
6. pg-boss como fila
7. Código em inglês e documentação em português

---

## 6. Módulos do MVP

1. Login e papéis (manager, seller, mechanic)
2. Clientes sincronizados com os parceiros do Sankhya, mais bicicletas do cliente (marca, modelo, aro, quadro, cor, ano, **número de série**, foto)
3. Ordens de serviço. Status: recebida → diagnóstico → aguardando aprovação → aguardando peça → em execução → pronta → entregue. Inclui mecânico, prazo, serviços, peças do Sankhya e aviso no WhatsApp
4. Inbox de atendimento com IA e transbordo para humano
5. Funil de oportunidades
6. Lembretes: revisão vencendo, aniversariantes, clientes inativos há 90 dias
7. Painel inicial

**Fora do MVP:** estoque próprio, emissão fiscal (continua no Sankhya), fidelidade, portal do cliente e gravação de pedidos no Sankhya (fase 2).

### Ferramentas da IA (as únicas ações que ela pode executar)

- `searchProducts` / `getProductPrice` / `getProductStock`: consultam o Sankhya
- `getServiceOrderStatus`
- `scheduleMaintenance`
- `registerInterest`: cria uma oportunidade no funil
- `handoffToSeller`: transfere para o vendedor com resumo; usada em negociação, desconto, reclamação ou dúvida

**Outras proteções:** aviso ao cliente de que fala com um assistente virtual, limite de mensagens por conversa, custo registrado por atendimento e consentimento LGPD.

---

## 7. Sankhya: o que já foi pesquisado

Fonte oficial: https://developer.sankhya.com.br (índice completo para consulta em https://developer.sankhya.com.br/llms.txt)

### Autenticação OAuth 2.0 (Client Credentials)

- **Produção:** `POST https://api.sankhya.com.br/authenticate`
- **Sandbox:** `POST https://api.sandbox.sankhya.com.br/authenticate`
- **Headers:**
  - `Content-Type: application/x-www-form-urlencoded`
  - `X-Token: <token da tela "Configurações Gateway" do Sankhya Om>`
- **Body (form-urlencoded):** `client_id`, `client_secret`, `grant_type=client_credentials`
  - A documentação oficial manda as credenciais no body. Um guia da comunidade as manda na query string. Começar pelo body e, se der erro, testar a query string.
- **Resposta:** `access_token` (JWT), `expires_in` (segundos; a doc oficial exemplifica 300 e a comunidade cita 3600), `token_type: Bearer`, `scope`. A doc diz que a resposta é form-urlencoded, então o código deve aceitar tanto JSON quanto form.
- **Chamadas seguintes:** header `Authorization: Bearer <access_token>`.
- **Cache do token:** guardar e renovar um pouco antes de `expires_in`.
- **Erros conhecidos:** 400, 401 (`invalid_client`) e 500. Relatos da comunidade apontam que o 401 costuma vir de `X-Token`, `client_id` e `client_secret` que não pertencem ao **mesmo ambiente** (sandbox × produção) ou de componente não vinculado no Gateway.

### APIs de dados

- **API REST v1:** a paginação é **obrigatória** (`?page=1`); fazer um loop até acabar os dados. O parâmetro `disableRowsLimit` do modelo legado não existe mais.
  - Produtos: `GET /v1/produtos` e `GET /v1/produtos/{codigoProduto}`
  - Estoque: `GET /v1/estoque/locais`, mais as rotas de estoque por produto e de vários produtos
  - Preços: preço por produto e tabela, por produto, por tabela inteira e contextualizado
  - Clientes: listar, incluir e atualizar
  - Vendas: `GET /v1/vendas/nfe` e `POST /v1/vendas/pedidos` (exemplo de body: `codigoEmpresa`, `data` DD/MM/AAAA, `hora`, `codigoVendedor`, `codigoCliente`, `valorTotal`, `itens[]`)
- **Gateway de serviços (legado):** `service.sbr` com `CRUDServiceProvider.loadRecords` e critérios. Usar só se a v1 não cobrir algo.
- As referências detalhadas de cada endpoint estão em `developer.sankhya.com.br/reference/*`: `get_v1-produtos`, `getestoqueporproduto`, `getestoqueprodutos`, `getprecoproduto`, `getprecoprodutotabela`, `getprecotabela`, `getprecocontexto`, `getcliente`, `postcliente`, `putcliente`, `get_loadrecords`.
- ⚠️ **Ainda não confirmado:** se as rotas v1 ficam na raiz (`https://api.sandbox.sankhya.com.br/v1/...`) ou sob `/gateway/...`. O artigo da comunidade usa a raiz. Confirmar no primeiro teste.

### Variáveis de ambiente previstas (`.env.example`)

```
# Ambiente do Sankhya: sandbox | production
SANKHYA_ENV=sandbox

SANKHYA_SANDBOX_BASE_URL=https://api.sandbox.sankhya.com.br
SANKHYA_SANDBOX_CLIENT_ID=
SANKHYA_SANDBOX_CLIENT_SECRET=
SANKHYA_SANDBOX_X_TOKEN=

SANKHYA_PRODUCTION_BASE_URL=https://api.sankhya.com.br
SANKHYA_PRODUCTION_CLIENT_ID=
SANKHYA_PRODUCTION_CLIENT_SECRET=
SANKHYA_PRODUCTION_X_TOKEN=

DATABASE_URL=postgres://...
ANTHROPIC_API_KEY=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_VERIFY_TOKEN=
```

O `.env` real **nunca** vai para o git. O dono do projeto preenche na própria máquina.

---

## 8. Roteiro

| Fase | Entrega |
|---|---|
| 0 | Validar a API Sankhya na sandbox (autenticação + consultas) e iniciar a verificação da conta Meta Business, que pode levar dias |
| 1 | Monorepo, banco, login, clientes e bikes, sincronização somente leitura com o Sankhya, deploy no Railway |
| 2 | Ordens de serviço |
| 3 | WhatsApp + IA em modo rascunho |
| 4 | IA respondendo sozinha nos casos simples + funil + lembretes |
| 5 | Piloto com a equipe da loja e ajustes |

---

## 9. Onde paramos

O plano foi aprovado e **nenhum código foi criado ainda**. O próximo passo, que já estava aprovado:

1. **Montar o esqueleto do monorepo:**
   - Raiz: `package.json` com `packageManager`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`, `.gitignore` (incluindo `.env`), `.env.example` e `.editorconfig`.
   - `packages/db`: Drizzle, `drizzle.config.ts`, schema inicial (`customers` com `sankhyaPartnerId`, e `bikes`) e o client.
   - `packages/sankhya`:
     - `config.ts`: lê o env com Zod e escolhe sandbox ou produção.
     - `auth.ts`: busca e guarda o token em cache, renovando antes de `expires_in`.
     - `client.ts`: GET com paginação.
     - Testes Vitest com `fetch` simulado (cache do token, renovação e erro 401).
   - `packages/ai` e `packages/whatsapp`: apenas o esqueleto, implementados na fase 3.
   - `apps/web`: Next.js mínimo com Tailwind, página inicial e rota `/api/health`.
   - `apps/worker`: ponto de entrada mínimo, com o pg-boss entrando depois.
2. **Criar o script `pnpm sankhya:test`**, que autentica na sandbox e lista algumas páginas de produtos e clientes. Ele mostra quantos registros vieram e alguns campos, **sem imprimir o token**.
3. **Escrever os documentos de apoio** da seção 5, mais os ADRs iniciais.
4. Rodar `pnpm install`, typecheck e testes.
5. Iniciar o git e fazer o primeiro commit (só quando o dono do projeto pedir).

### Observações de ambiente

- Na máquina anterior o `pnpm` não estava instalado. Funcionou via `corepack pnpm@10.18.3`. Na máquina nova, rode `corepack enable` ou `npm i -g pnpm` e defina `"packageManager": "pnpm@10.x"` no `package.json`.
- Node 24 LTS foi usado e serve.

---

## 10. Perguntas ainda em aberto

- Quantas pessoas vão usar o CRM e existe previsão de filial? Se houver, incluir um campo `storeId` desde o início.
- Existe intenção de revender o CRM para outras lojas (SaaS / multi-tenant)? Precisa ser decidido antes do schema definitivo.
- Qual é o orçamento mensal para hospedagem e para o consumo da IA?
- A loja usa mais de uma tabela de preço no Sankhya? Qual é a tabela de "preço de tabela" que a IA deve informar?
- Quais são as condições de pagamento padrão (parcelamento, Pix) que a IA pode informar sem negociar?
