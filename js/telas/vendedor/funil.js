// Quadro "Meu funil": uma coluna por etapa, cards arrastáveis entre colunas.

import { previaDaMensagem, resumirConversa } from '../../regras/conversas.js';
import { agruparPorEtapa, diasSemContato, ETAPAS, estaParada, foiTransferidaPelaIa, ORIGENS } from '../../regras/funil.js';
import { descreverDias, formatarMoeda, nomeCurto } from '../../regras/formatos.js';
import { criar, icone, numero, selo, substituirConteudo } from '../../tela/dom.js';

const ICONE_DA_ORIGEM = {
  whatsapp: 'brand-whatsapp',
  instagram: 'brand-instagram',
  loja: 'building-store',
  ia: 'sparkles',
};

function seloDeTempo(oportunidade, agora, diasParaAlerta) {
  const dias = diasSemContato(oportunidade, agora);
  if (estaParada(oportunidade, agora, diasParaAlerta)) {
    return selo(`${descreverDias(dias)} sem contato`, { tipo: 'alerta', nomeIcone: 'alert-triangle' });
  }
  return criar('span', { classe: 'texto-fraco', texto: dias === 0 ? 'hoje' : descreverDias(dias) });
}

/** Última mensagem da conversa, para o vendedor saber do que se trata sem abrir. */
function ultimaMensagem(resumo) {
  if (!resumo.ultima) return null;
  const doCliente = resumo.ultima.autor === 'cliente';
  return criar('span', { classe: `ultima-mensagem ${doCliente ? 'do-cliente' : ''}`.trim() }, [
    icone(doCliente ? 'message-circle' : 'arrow-back-up'),
    criar('span', { texto: previaDaMensagem(resumo.ultima, 54) }),
  ]);
}

function desenharCard(oportunidade, { cliente, mensagens, agora, diasParaAlerta, aoAbrir }) {
  const resumo = resumirConversa(mensagens);
  const classes = ['card'];
  if (foiTransferidaPelaIa(oportunidade)) classes.push('da-ia');
  if (estaParada(oportunidade, agora, diasParaAlerta)) classes.push('parado');
  if (resumo.semResposta > 0) classes.push('sem-resposta');

  const card = criar(
    'button',
    { classe: classes.join(' '), atributos: { type: 'button', draggable: 'true' }, dados: { id: oportunidade.id }, aoClicar: () => aoAbrir(oportunidade) },
    [
      criar('span', { classe: 'linha-do-nome' }, [
        criar('span', { classe: 'nome', texto: nomeCurto(cliente?.nome ?? 'Cliente') }),
        resumo.semResposta > 0
          ? criar('span', { classe: 'contador-sem-resposta', texto: String(resumo.semResposta), atributos: { title: `${resumo.semResposta} mensagem(ns) sem resposta` } })
          : null,
      ]),
      criar('span', { classe: 'interesse', texto: oportunidade.interesse }),
      ultimaMensagem(resumo),
      oportunidade.valor > 0 ? numero(formatarMoeda(oportunidade.valor), 'valor-do-card') : null,
      criar('div', { classe: 'rodape-do-card' }, [
        criar('span', { classe: 'origem', atributos: { title: `Origem: ${ORIGENS[oportunidade.origem]}` } }, [
          icone(ICONE_DA_ORIGEM[oportunidade.origem] ?? 'user'),
          foiTransferidaPelaIa(oportunidade) ? selo('IA', { tipo: 'tecnologia' }) : null,
        ]),
        seloDeTempo(oportunidade, agora, diasParaAlerta),
      ]),
    ],
  );

  card.addEventListener('dragstart', (evento) => {
    evento.dataTransfer.setData('text/plain', oportunidade.id);
    evento.dataTransfer.effectAllowed = 'move';
    card.classList.add('arrastando');
  });
  card.addEventListener('dragend', () => card.classList.remove('arrastando'));
  return card;
}

function permitirSoltar(coluna, idEtapa, aoMover) {
  coluna.addEventListener('dragover', (evento) => {
    evento.preventDefault();
    coluna.classList.add('recebendo');
  });
  coluna.addEventListener('dragleave', (evento) => {
    if (!coluna.contains(evento.relatedTarget)) coluna.classList.remove('recebendo');
  });
  coluna.addEventListener('drop', (evento) => {
    evento.preventDefault();
    coluna.classList.remove('recebendo');
    const idOportunidade = evento.dataTransfer.getData('text/plain');
    if (idOportunidade) aoMover(idOportunidade, idEtapa);
  });
}

export function desenharFunil(elemento, { oportunidades, clientes, mensagensPorCliente = {}, agora, diasParaAlerta, aoAbrir, aoMover }) {
  const porEtapa = agruparPorEtapa(oportunidades);

  const colunas = ETAPAS.map((etapa) => {
    const lista = porEtapa[etapa.id];
    const total = lista.reduce((soma, oportunidade) => soma + (Number(oportunidade.valor) || 0), 0);
    const cards = lista.length
      ? lista.map((oportunidade) =>
          desenharCard(oportunidade, {
            cliente: clientes.find((c) => c.id === oportunidade.idCliente),
            mensagens: mensagensPorCliente[oportunidade.idCliente] ?? [],
            agora, diasParaAlerta, aoAbrir,
          }),
        )
      : [criar('div', { classe: 'coluna-vazia', texto: 'Arraste um card para cá' })];

    const coluna = criar('div', { classe: 'coluna', dados: { etapa: etapa.id } }, [
      criar('div', { classe: 'cabecalho-da-coluna' }, [
        criar('h3', {}, [etapa.nome, criar('span', { classe: 'quantidade', texto: String(lista.length) })]),
        total > 0 ? numero(formatarMoeda(total), 'total') : null,
      ]),
      ...cards,
    ]);
    permitirSoltar(coluna, etapa.id, aoMover);
    return coluna;
  });

  substituirConteudo(elemento, [
    criar('div', { classe: 'cabecalho-do-funil' }, [
      criar('h2', { classe: 'titulo-secao' }, [icone('layout-kanban'), 'Meu funil']),
      criar('span', { classe: 'dica', texto: `Arraste os cards entre as colunas · alerta após ${diasParaAlerta} dias sem contato` }),
    ]),
    criar('div', { classe: 'colunas' }, colunas),
  ]);
}
