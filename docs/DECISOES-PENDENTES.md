# Decisões pendentes

Em 13/11/2026 decidimos **começar pelo protótipo de interface**. Stack, servidor, banco e
hospedagem ficam **anotados, mas não decididos**. O assunto volta quando as telas estiverem aprovadas.

## O que já foi discutido (proposta, não decisão)

| Tema | Proposta discutida |
| --- | --- |
| Linguagem e estrutura | Monorepo TypeScript (pnpm + Turborepo), Next.js/React, Drizzle + PostgreSQL |
| Hospedagem | Railway (web, worker e Postgres na mesma plataforma) |
| Filas e tarefas em segundo plano | pg-boss (usa o próprio Postgres) |
| Autenticação | Better Auth, papéis gerente, vendedor e mecânico |
| IA | Claude via Vercel AI SDK; a IA só usa ferramentas permitidas e não tem ferramenta de desconto |
| WhatsApp | WhatsApp Business Cloud API oficial (Meta); testes com número avulso |
| Sankhya | OAuth2 (client_id, client_secret, X-Token), começar só leitura, sempre na sandbox no desenvolvimento |

O detalhamento está em [CONTEXTO-PROJETO.md](../CONTEXTO-PROJETO.md).

## O que já está decidido e vale para o back-end

- O Sankhya é a fonte da verdade de parceiros, produtos, preços, estoque e notas.
- A ordem de serviço da oficina fica no CRM (a loja não usa o módulo de OS do Sankhya).
- Nomes de negócio em português no código; documentação em português.
- As regras de `js/regras/` serão reaproveitadas pelo servidor.
- A camada `js/dados/` é o único ponto que muda quando a API existir.

## A decidir quando as telas forem aprovadas

- [ ] Stack final (manter a proposta acima ou simplificar)
- [ ] Onde hospedar e custo mensal aceitável
- [ ] Como o servidor vai importar as regras de `js/regras/` (mesmo repositório, pacote compartilhado)
- [ ] Formato da API que a camada `js/dados/` vai chamar
- [ ] Quantos usuários e se haverá filial (campo de loja desde o início)
- [ ] Se o CRM poderá ser revendido para outras lojas (multi-empresa)
