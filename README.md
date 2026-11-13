# CRM Beach Bike Store — protótipo de interface

Protótipo **funcional, sem back-end**, do CRM da Beach Bike Store (bike shop em Fortaleza).
Roda inteiro no navegador, com dados de demonstração **fictícios** salvos no próprio navegador.
Serve para clicar, testar o fluxo completo e validar as regras com quem vai usar,
**antes** de construir servidor, banco e integrações.

> Primeira tela: **Minha mesa**, a tela de trabalho do vendedor.

## O que dá para fazer

- Ver a **lista da vez** (quem recebe o próximo contato) e entrar/sair de pausa.
- Acompanhar a **meta do mês**, oportunidades abertas, retornos e transferências da IA.
- Trabalhar o **Meu dia**: transferências da IA, clientes sem resposta, retornos atrasados, retornos de hoje e aniversariantes.
- Arrastar os cards do **funil** (Novo → Atendendo → Orçamento → Negociação).
- **Atender pelo próprio CRM** (WhatsApp e Instagram na mesma caixa, sem sair da tela): conversar,
  usar respostas rápidas, enviar fotos do catálogo e, com a janela de 24 h fechada, modelos aprovados.
  O cliente simulado responde alguns segundos depois.
- Na mesma tela de atendimento: trocar a etapa, marcar ganho ou perdido, registrar contato por
  ligação ou na loja, agendar retorno e ver resumo da IA, bicicletas, compras no Sankhya e linha do tempo.
- Registrar um **novo atendimento** de cliente que chegou na loja.
- Alternar entre **tema escuro e claro** (a escolha fica salva).
- No **modo demonstração**: trocar de vendedor ("ver como"), simular contatos chegando e restaurar os dados.

## Como rodar no computador

Precisa do [Node.js](https://nodejs.org) 20 ou mais novo. Não há nada para instalar (`npm install` não é necessário).

```bash
npm start
```

Depois abra <http://localhost:5173>.

> Por que não dá para abrir o `index.html` com dois cliques? O protótipo usa módulos JavaScript
> (`import`/`export`), e o navegador bloqueia módulos abertos direto do disco. O `npm start`
> sobe um servidor mínimo (`scripts/servidor.js`, sem dependências) só para entregar os arquivos.

## Como rodar os testes

```bash
npm test
```

Testa as regras de negócio de `js/regras/` (formatos, validações, funil, metas, "meu dia" e lista da vez).

## Publicação

O protótipo é publicado no **GitHub Pages** a partir da branch `main`. Todo `git push` na `main`
atualiza o site em cerca de um minuto. Os dados ficam no navegador de cada pessoa: o que um
usuário faz na demonstração não aparece para outro.

## Trabalhando em dois computadores

```bash
git pull     # antes de começar
git push     # ao terminar
```

## Estrutura

```
index.html                 tela do vendedor
css/                       tokens.css (cores da marca e temas), base.css, componentes.css, vendedor.css, atendimento.css
js/regras/                 regras de negócio PURAS, com teste (o servidor vai reaproveitar)
js/dados/                  camada de dados: única que lê/grava o armazenamento (vira chamada de API)
js/demo/dados-demo.js      dados de demonstração fictícios
js/tela/                   utilitários de tela compartilhados (montar elementos, modal, avisos, tema)
js/telas/vendedor.js       coordena a tela do vendedor
js/telas/vendedor/         cada parte da tela (faixa da vez, indicadores, meu dia, funil, atendimento)
assets/catalogo/           fotos ilustrativas do catálogo simulado
testes/                    testes automatizados (node --test)
scripts/servidor.js        servidor local mínimo
docs/                      documentação de apoio
```

## Documentação

| Documento | Conteúdo |
| --- | --- |
| [docs/ARQUITETURA.md](docs/ARQUITETURA.md) | Como o código está organizado e o caminho de uma ação |
| [docs/REGRAS-DE-NEGOCIO.md](docs/REGRAS-DE-NEGOCIO.md) | Regras aprovadas com a loja e premissas a confirmar |
| [docs/AUDITORIA.md](docs/AUDITORIA.md) | Checklist para quem audita cada entrega |
| [docs/DECISOES-PENDENTES.md](docs/DECISOES-PENDENTES.md) | Stack, servidor, banco e hospedagem: anotados, ainda não decididos |
| [CONTEXTO-PROJETO.md](CONTEXTO-PROJETO.md) | Plano original do projeto (antes da decisão de começar pelo protótipo) |
