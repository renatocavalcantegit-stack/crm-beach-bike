# Arquitetura do protótipo

O protótipo é HTML, CSS e JavaScript puro: sem framework, sem etapa de build.
Mesmo assim, ele já está dividido para o back-end entrar depois **sem refazer as telas**.

## As quatro camadas

```
 ┌──────────────────────────────┐
 │ TELAS  js/telas/             │  desenham e reagem a cliques
 │        js/tela/ (utilitários)│
 └──────┬──────────────┬────────┘
        │ chama        │ chama
        ▼              ▼
 ┌──────────────┐  ┌──────────────────────────┐
 │ REGRAS       │  │ DADOS  js/dados/          │  buscam e gravam
 │ js/regras/   │◄─┤ (usa as regras antes de   │
 │ puras, com   │  │  gravar)                  │
 │ teste        │  └──────┬───────────────────┘
 └──────────────┘         │ só armazenamento.js toca o localStorage
                          ▼
                 ┌────────────────────┐
                 │ localStorage        │  hoje
                 │ (API do servidor)   │  depois
                 └────────────────────┘
```

| Camada | Pode | Não pode |
| --- | --- | --- |
| `js/regras/` | calcular, validar, formatar, decidir | acessar a tela, o armazenamento ou a data atual por conta própria (recebe `agora` como parâmetro) |
| `js/dados/` | ler e gravar, chamar as regras antes de gravar | desenhar na tela |
| `js/telas/` | desenhar, ouvir cliques, chamar dados e regras | acessar o `localStorage` direto |
| `js/tela/` | utilitários de tela usados por todas as telas | conter regra de negócio |

## Por que assim

- **Regras puras** (`js/regras/`): são as mesmas no navegador e no servidor. Quando o back-end
  existir, ele importa estes arquivos sem mudança, e a regra nunca fica diferente nos dois lados.
  Cada arquivo tem teste em `testes/`.
- **Camada de dados** (`js/dados/`): todas as funções já devolvem `Promise` e simulam um pequeno
  atraso. A tela já espera respostas como se viessem de um servidor. Para ligar o back-end, troca-se
  o corpo destas funções por chamadas `fetch` à API; as telas não mudam.
- **Integrações simuladas**: `js/dados/sankhya-simulado.js` imita o ERP; `CONTATOS_SIMULADOS`
  (em `js/demo/dados-demo.js`) imita contatos chegando pelo WhatsApp, Instagram e IA;
  `js/dados/whatsapp-simulado.js` faz o papel do cliente no chat (a mensagem vira "entregue" e,
  alguns segundos depois, o cliente lê e responde).
- **Avisos de mensagem nova**: `js/dados/conversas.js` tem `acompanharConversas(callback)`. A tela se
  inscreve e é avisada quando chega mensagem ou muda o status. No sistema real, isso vira uma conexão
  com o servidor (WebSocket ou SSE), alimentada pelo webhook da WhatsApp Business API.
- **Dados de demonstração** (`js/demo/dados-demo.js`): ficam separados e usam datas relativas a
  "agora", para a demonstração parecer sempre atual.

## Caminho de uma ação (exemplo: arrastar um card para "Orçamento")

1. `js/telas/vendedor/funil.js` percebe que o card foi solto na coluna e chama `moverCard`.
2. `js/telas/vendedor.js` (`moverCard`) consulta a regra `verificarMudancaDeEtapa` (`js/regras/funil.js`).
3. A regra responde que a etapa exige valor → abre o modal de valor (`js/telas/vendedor/modais.js`).
4. O modal valida com `validarValor` (`js/regras/validacoes.js`) e chama `moverParaEtapa` (`js/dados/oportunidades.js`).
5. A camada de dados confere a regra de novo, grava e registra na linha do tempo.
6. A tela inteira é redesenhada com os dados novos (`atualizarTela`).

## Caminho de uma mensagem (vendedor responde no chat)

1. `js/telas/vendedor/atendimento-conversa.js` desenha a caixa de escrever; Enter chama `enviarRascunho`.
2. `js/telas/vendedor/atendimento.js` chama `enviarMensagem` (`js/dados/conversas.js`).
3. A camada de dados valida (`validarMensagem`), confere a janela de 24 h (`verificarEnvioLivre`,
   em `js/regras/conversas.js`), grava a mensagem e registra o contato na oportunidade
   (`registrarContatoPorMensagem`).
4. Quem está inscrito em `acompanharConversas` é avisado: o atendimento redesenha **só a conversa**
   (o rascunho fica) e a mesa atualiza o card e o "Meu dia".
5. A simulação do cliente marca a mensagem como entregue, depois lida, e grava a resposta.

## Segurança na tela

Todo texto vindo dos dados entra na página como **texto** (`textContent`), nunca como HTML.
Isso fica centralizado em `js/tela/dom.js` (função `criar`). Um nome de cliente com `<script>` aparece
escrito, não é executado.

## Convenções

- Nomes de negócio em **português** (`oportunidade`, `vendedor`, `filaDaVez`).
- Comentários explicam o **porquê** das regras, não o óbvio.
- Funções pequenas, um propósito cada.
- Datas gravadas como texto ISO (`2026-11-13T15:30:00.000Z`) e exibidas no fuso do computador.
