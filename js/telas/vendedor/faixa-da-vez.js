// Faixa "lista da vez": em que posição o vendedor está e a fila completa do dia.
// Todos veem a fila inteira — é o que mostra que a distribuição é justa.

import { posicaoNaVez, proximoDaVez, SITUACOES } from '../../regras/distribuicao.js';
import { obterIniciais } from '../../regras/formatos.js';
import { avatar, criar, icone, numero, substituirConteudo } from '../../tela/dom.js';

function textoDaMinhaSituacao(fila, idVendedor) {
  const situacao = fila.situacao[idVendedor] ?? 'ausente';
  if (situacao === 'ausente') return ['Fora da fila hoje'];
  if (situacao === 'pausa') return ['Em pausa'];
  const posicao = posicaoNaVez(fila, idVendedor);
  if (posicao === 1) return ['É a ', numero('sua vez')];
  return ['Você é o ', numero(`${posicao}º`), ' da vez'];
}

function botaoDeSituacao(situacao, aoAlterar) {
  if (situacao === 'ausente') {
    return criar('button', { classe: 'botao botao-principal', atributos: { type: 'button' }, aoClicar: () => aoAlterar('presenca') }, [
      icone('login-2'), 'Marcar presença',
    ]);
  }
  if (situacao === 'pausa') {
    return criar('button', { classe: 'botao', atributos: { type: 'button' }, aoClicar: () => aoAlterar('voltar') }, [
      icone('player-play'), 'Voltar para a fila',
    ]);
  }
  return criar('button', { classe: 'botao', atributos: { type: 'button' }, aoClicar: () => aoAlterar('pausa') }, [
    icone('player-pause'), 'Pausar',
  ]);
}

function pessoaNaFila(vendedor, situacao, { posicao, eAVez, souEu }) {
  const classes = ['pessoa-na-fila', situacao, eAVez ? 'e-a-vez' : '', souEu ? 'sou-eu' : ''].filter(Boolean).join(' ');
  return criar('div', { classe: classes, atributos: { title: SITUACOES[situacao] } }, [
    avatar(obterIniciais(vendedor.nome)),
    criar('span', { classe: 'nome', texto: souEu ? 'Você' : vendedor.nome.split(' ')[0] }),
    criar('span', { classe: 'posicao', texto: posicao ? `${posicao}º` : SITUACOES[situacao].toLowerCase() }),
  ]);
}

export function desenharFaixaDaVez(elemento, { fila, vendedores, idVendedorAtual, aoAlterarSituacao }) {
  const proximo = proximoDaVez(fila);
  const pessoas = fila.ordem
    .map((id) => vendedores.find((vendedor) => vendedor.id === id))
    .filter(Boolean)
    .flatMap((vendedor, indice) => {
      const pessoa = pessoaNaFila(vendedor, fila.situacao[vendedor.id] ?? 'ausente', {
        posicao: posicaoNaVez(fila, vendedor.id),
        eAVez: vendedor.id === proximo,
        souEu: vendedor.id === idVendedorAtual,
      });
      return indice === 0 ? [pessoa] : [icone('chevron-right', 'seta-da-fila'), pessoa];
    });

  substituirConteudo(elemento, [
    criar('div', { classe: 'minha-vez' }, [
      criar('div', { classe: 'rotulo', texto: 'Lista da vez' }),
      criar('div', { classe: 'situacao' }, textoDaMinhaSituacao(fila, idVendedorAtual)),
    ]),
    criar('div', { classe: 'fila', atributos: { 'aria-label': 'Ordem da fila de hoje' } }, pessoas),
    botaoDeSituacao(fila.situacao[idVendedorAtual] ?? 'ausente', aoAlterarSituacao),
  ]);
}
