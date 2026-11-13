# Checklist de auditoria

Use a cada entrega. Cada item tem como conferir.

## Organização

- [ ] Nenhuma tela acessa o `localStorage` direto.
      Conferir: buscar `localStorage` no projeto — só pode aparecer em `js/dados/armazenamento.js`.
- [ ] Regras de negócio não acessam tela nem armazenamento.
      Conferir: arquivos de `js/regras/` não usam `document`, `window` nem importam de `js/dados/`.
- [ ] Regras recebem a data atual como parâmetro (`agora`), em vez de usar `new Date()` sozinhas.
- [ ] Funções de tela repetidas foram para `js/tela/`, sem cópia entre telas.
- [ ] Dados de demonstração estão só em `js/demo/dados-demo.js`.

## Testes

- [ ] `npm test` passa sem falhas.
- [ ] Toda regra nova em `js/regras/` tem teste em `testes/`, escrito em linguagem de negócio.

## Segurança

- [ ] Texto vindo dos dados entra na tela só por `textContent` (função `criar` de `js/tela/dom.js`).
      Conferir: buscar `innerHTML` — não deve aparecer no código das telas.
- [ ] Nenhuma senha, token ou chave de API no código (o protótipo não precisa de nenhuma).
- [ ] Os dados de demonstração são fictícios (nomes, telefones, números de série).

## Legibilidade

- [ ] Nomes de negócio em português.
- [ ] Comentários explicam o porquê das regras.
- [ ] Funções curtas, com um propósito cada.
- [ ] `docs/REGRAS-DE-NEGOCIO.md` foi atualizado se alguma regra mudou.

## Funcionamento (no navegador)

- [ ] Abre sem erros no console (F12 → Console).
- [ ] Tema escuro e claro legíveis; a escolha continua após recarregar.
- [ ] "Restaurar dados" volta a demonstração ao estado original.
