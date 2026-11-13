// Campos de formulário padronizados: rótulo + controle + espaço para a mensagem de erro.

import { criar } from './dom.js';

function envolverCampo(rotulo, controle) {
  return criar('div', { classe: 'campo' }, [
    criar('label', { texto: rotulo, atributos: { for: controle.id } }),
    controle,
    criar('span', { classe: 'erro-do-campo', atributos: { 'aria-live': 'polite' } }),
  ]);
}

let contador = 0;
const novoId = (nome) => `campo-${nome}-${++contador}`;

/** tipo: 'text' | 'tel' | 'datetime-local' ... */
export function campoDeTexto({ nome, rotulo, tipo = 'text', valor = '', placeholder = '', modoTeclado = null }) {
  const entrada = criar('input', {
    atributos: { id: novoId(nome), name: nome, type: tipo, value: valor, placeholder, inputmode: modoTeclado, autocomplete: 'off' },
  });
  return envolverCampo(rotulo, entrada);
}

export function campoDeTextoLongo({ nome, rotulo, placeholder = '' }) {
  return envolverCampo(rotulo, criar('textarea', { atributos: { id: novoId(nome), name: nome, placeholder } }));
}

/** opcoes: [{ valor, texto }] */
export function campoDeSelecao({ nome, rotulo, opcoes, valor = '' }) {
  const selecao = criar(
    'select',
    { atributos: { id: novoId(nome), name: nome } },
    opcoes.map((opcao) => criar('option', { texto: opcao.texto, atributos: { value: opcao.valor, selected: opcao.valor === valor } })),
  );
  return envolverCampo(rotulo, selecao);
}

/** Lista de opções em que só uma pode ser escolhida (ex.: motivo da perda). */
export function grupoDeOpcoes({ nome, rotulo, opcoes }) {
  return criar('div', { classe: 'campo' }, [
    criar('label', { texto: rotulo }),
    criar(
      'div',
      { classe: 'lista-de-opcoes', atributos: { role: 'radiogroup' } },
      opcoes.map((opcao) =>
        criar('label', { classe: 'opcao' }, [criar('input', { atributos: { type: 'radio', name: nome, value: opcao } }), opcao]),
      ),
    ),
    criar('span', { classe: 'erro-do-campo' }),
  ]);
}
