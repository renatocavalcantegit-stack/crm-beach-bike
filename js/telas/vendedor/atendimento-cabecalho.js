// Cabeçalho do atendimento: quem é o cliente, em que etapa está, quanto vale
// e os botões de fechar a venda (Ganho / Perdido) ou registrar um contato
// feito fora do chat (ligação, visita na loja).

import { CANAIS } from '../../regras/conversas.js';
import { buscarEtapa, diasSemContato, ETAPAS, estaAberta, ORIGENS } from '../../regras/funil.js';
import { descreverDias, formatarData, formatarMoeda, formatarTelefone, obterIniciais } from '../../regras/formatos.js';
import { avatar, criar, icone, numero, selo } from '../../tela/dom.js';

function dadosDoCliente(cliente, canal) {
  return criar('div', { classe: 'dados-basicos' }, [
    criar('span', {}, [icone('phone'), ' ', formatarTelefone(cliente.telefone)]),
    cliente.bairro ? criar('span', {}, [icone('map-pin'), ' ', cliente.bairro]) : null,
    criar('span', { texto: cliente.clienteDesde ? `Cliente desde ${new Date(cliente.clienteDesde).getFullYear()}` : 'Primeiro atendimento' }),
    canal ? selo(CANAIS[canal].nome, { nomeIcone: CANAIS[canal].icone }) : selo('Balcão', { nomeIcone: 'building-store' }),
    cliente.codigoParceiroSankhya ? selo(`Sankhya · ${cliente.codigoParceiroSankhya}`, { tipo: 'tecnologia', nomeIcone: 'database' }) : null,
  ]);
}

/** Seletor de etapa: o mesmo efeito de arrastar o card no funil. */
function seletorDeEtapa(oportunidade, aoMudarEtapa) {
  const seletor = criar(
    'select',
    { classe: 'seletor-de-etapa', atributos: { 'aria-label': 'Etapa do atendimento' } },
    ETAPAS.map((etapa) => criar('option', { texto: etapa.nome, atributos: { value: etapa.id, selected: etapa.id === oportunidade.etapa } })),
  );
  seletor.addEventListener('change', () => aoMudarEtapa(seletor.value));
  return seletor;
}

function resumoDaOportunidade(oportunidade, { agora, podeAgir, aoMudarEtapa }) {
  const aberta = estaAberta(oportunidade);
  const dias = diasSemContato(oportunidade, agora);
  const etapa = aberta && podeAgir
    ? seletorDeEtapa(oportunidade, aoMudarEtapa)
    : criar('strong', { texto: aberta ? buscarEtapa(oportunidade.etapa).nome : oportunidade.etapa === 'ganho' ? 'Ganha' : 'Perdida' });

  return criar('div', { classe: 'resumo-do-atendimento' }, [
    criar('div', { classe: 'dado dado-largo' }, [criar('small', { texto: 'Interesse' }), criar('strong', { texto: oportunidade.interesse })]),
    criar('div', { classe: 'dado' }, [criar('small', { texto: 'Etapa' }), etapa]),
    criar('div', { classe: 'dado' }, [criar('small', { texto: 'Valor' }), numero(oportunidade.valor > 0 ? formatarMoeda(oportunidade.valor) : '—')]),
    criar('div', { classe: 'dado' }, [
      criar('small', { texto: aberta ? 'Último contato' : 'Fechada em' }),
      criar('strong', { texto: aberta ? (dias === 0 ? 'hoje' : `há ${descreverDias(dias)}`) : formatarData(oportunidade.fechadaEm) }),
    ]),
    criar('div', { classe: 'dado' }, [criar('small', { texto: 'Origem' }), criar('strong', { texto: ORIGENS[oportunidade.origem] })]),
  ]);
}

function botoesDeAcao({ aoRegistrarContato, aoGanhar, aoPerder }) {
  const botao = (classe, nomeIcone, texto, aoClicar) =>
    criar('button', { classe: `botao ${classe}`, atributos: { type: 'button' }, aoClicar }, [icone(nomeIcone), texto]);
  return criar('div', { classe: 'acoes-do-atendimento' }, [
    botao('botao-fantasma', 'phone-call', 'Registrar contato', aoRegistrarContato),
    botao('botao-sucesso', 'trophy', 'Ganho', aoGanhar),
    botao('botao-alerta', 'x', 'Perdido', aoPerder),
  ]);
}

export function desenharCabecalho({ cliente, oportunidade, canal, agora, podeAgir, aoMudarEtapa, aoRegistrarContato, aoGanhar, aoPerder, aoFechar }) {
  const fechar = criar('button', { classe: 'botao botao-fantasma botao-icone', atributos: { type: 'button', 'aria-label': 'Fechar atendimento', title: 'Fechar (Esc)' }, aoClicar: aoFechar }, [icone('x')]);

  return criar('header', { classe: 'cabecalho-do-atendimento' }, [
    criar('div', { classe: 'linha-do-cliente' }, [
      avatar(obterIniciais(cliente.nome), 'avatar-grande avatar-destaque'),
      criar('div', { classe: 'identificacao' }, [criar('h2', { texto: cliente.nome }), dadosDoCliente(cliente, canal)]),
      oportunidade && estaAberta(oportunidade) && podeAgir ? botoesDeAcao({ aoRegistrarContato, aoGanhar, aoPerder }) : null,
      fechar,
    ]),
    oportunidade
      ? resumoDaOportunidade(oportunidade, { agora, podeAgir, aoMudarEtapa })
      : criar('p', { classe: 'texto-fraco', texto: 'Este cliente não tem atendimento registrado.' }),
  ]);
}
