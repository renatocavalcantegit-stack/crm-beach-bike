// Os quatro números do topo: meta, oportunidades, retornos e transferências da IA.

import { formatarMoeda } from '../../regras/formatos.js';
import { criar, icone, numero, substituirConteudo } from '../../tela/dom.js';

function indicador({ nomeIcone, rotulo, valor, detalhe, classeDetalhe = '', classeExtra = '', extra = null }) {
  return criar('div', { classe: `cartao indicador ${classeExtra}`.trim() }, [
    criar('div', { classe: 'rotulo' }, [icone(nomeIcone), rotulo]),
    criar('div', { classe: 'valor' }, [numero(valor)]),
    extra,
    criar('div', { classe: `detalhe ${classeDetalhe}`.trim(), texto: detalhe }),
  ]);
}

function barraDaMeta(percentual) {
  // A barra para em 100%, mas o texto mostra o percentual real (ex.: 112%).
  const barra = criar('span');
  barra.style.width = `${Math.min(percentual, 100)}%`;
  return criar('div', { classe: 'barra-da-meta', atributos: { role: 'progressbar', 'aria-valuenow': percentual, 'aria-valuemin': 0, 'aria-valuemax': 100 } }, [barra]);
}

export function desenharIndicadores(elemento, dados) {
  const atrasados = dados.retornosAtrasados;
  substituirConteudo(elemento, [
    indicador({
      nomeIcone: 'target-arrow',
      rotulo: 'Vendido no mês',
      valor: formatarMoeda(dados.vendidoNoMes),
      extra: barraDaMeta(dados.percentualMeta),
      detalhe: `${dados.percentualMeta}% da meta de ${formatarMoeda(dados.meta)}`,
    }),
    indicador({
      nomeIcone: 'chart-funnel',
      rotulo: 'Oportunidades abertas',
      valor: String(dados.quantidadeAbertas),
      detalhe: `${formatarMoeda(dados.valorEmAberto)} em jogo`,
    }),
    indicador({
      nomeIcone: 'clock-hour-4',
      rotulo: 'Retornos para hoje',
      valor: String(dados.retornosHoje + atrasados),
      detalhe: atrasados ? `${atrasados} atrasado${atrasados > 1 ? 's' : ''}` : 'nenhum atrasado',
      classeDetalhe: atrasados ? 'alerta' : '',
    }),
    indicador({
      nomeIcone: 'sparkles',
      rotulo: 'Vindos da IA',
      valor: String(dados.vindosDaIa),
      detalhe: 'clientes querendo negociar',
      classeExtra: 'indicador-tecnologia',
    }),
  ]);
}
