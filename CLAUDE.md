# Instruções para o Claude neste projeto

CRM da Beach Bike Store (bike shop em Fortaleza). Fase atual: **protótipo de interface sem back-end**.

## Forma de trabalhar (combinada com o dono do projeto)

- Antes de cada mudança grande: explicar o que entendeu do fluxo (com esboço se ajudar), listar
  dúvidas e **esperar o "pode implementar"**. O dono corrige as premissas com base na operação real.
- Depois de implementar: rodar `npm test`, testar no navegador (`npm start`) e publicar (push na `main`,
  que atualiza o GitHub Pages).
- Stack, servidor, banco e hospedagem estão em `docs/DECISOES-PENDENTES.md`: **não decidir agora**.

## Regras do código

- HTML, CSS e JavaScript puro, sem framework e sem build.
- `js/regras/`: regras puras (sem tela, sem armazenamento, recebem `agora`), cada uma com teste em `testes/`.
- `js/dados/`: única camada que lê/grava; só `armazenamento.js` toca o `localStorage`. Funções assíncronas.
- `js/demo/dados-demo.js`: dados fictícios. `js/tela/`: utilitários compartilhados, sem duplicar funções.
- Nomes de negócio em **português**; comentários explicam o porquê; funções pequenas.
- Texto dos dados entra na tela só por `textContent` (use `criar` de `js/tela/dom.js`).
- Cores só pelas variáveis de `css/tokens.css`: amarelo = ação principal/meta, azul = IA/Sankhya, vermelho = alerta.
- Toda a documentação (`README.md`, `docs/*.md`) em **português** e atualizada a cada entrega,
  principalmente `docs/REGRAS-DE-NEGOCIO.md`.
