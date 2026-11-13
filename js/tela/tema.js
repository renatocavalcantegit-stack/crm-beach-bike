// Tema escuro/claro. A escolha fica salva pela camada de dados (preferencias.js).

import { obterTema, salvarTema } from '../dados/preferencias.js';
import { icone, substituirConteudo } from './dom.js';

function aplicar(tema) {
  if (tema === 'claro') document.documentElement.dataset.tema = 'claro';
  else delete document.documentElement.dataset.tema;
}

/** Aplica o tema salvo e liga o botão de alternar. */
export function iniciarTema(botao) {
  let tema = obterTema();
  aplicar(tema);
  atualizarBotao(botao, tema);

  botao.addEventListener('click', () => {
    tema = tema === 'claro' ? 'escuro' : 'claro';
    aplicar(tema);
    salvarTema(tema);
    atualizarBotao(botao, tema);
  });
}

function atualizarBotao(botao, tema) {
  // O ícone mostra para onde o clique leva: no escuro, o sol (ir para o claro).
  const proximo = tema === 'claro' ? 'escuro' : 'claro';
  substituirConteudo(botao, [icone(proximo === 'claro' ? 'sun' : 'moon')]);
  botao.setAttribute('aria-label', `Mudar para o tema ${proximo}`);
  botao.title = `Tema ${proximo}`;
}
