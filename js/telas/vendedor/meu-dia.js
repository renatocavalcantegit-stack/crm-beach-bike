// Coluna "Meu dia": lista de prioridades (a ordem vem de js/regras/meu-dia.js).

import { descreverTempoDecorrido, formatarHora, nomeCurto } from '../../regras/formatos.js';
import { criar, icone, selo, substituirConteudo } from '../../tela/dom.js';

function seloDoItem(item) {
  if (item.tipo === 'ia') return selo('IA transferiu', { tipo: 'tecnologia', nomeIcone: 'sparkles' });
  if (item.tipo === 'atrasado') return selo('Atrasado', { tipo: 'alerta', nomeIcone: 'alert-circle' });
  if (item.tipo === 'hoje') return selo(`Hoje ${formatarHora(item.momento)}`, { tipo: 'destaque', nomeIcone: 'clock' });
  return selo('Aniversário', { nomeIcone: 'cake' });
}

function detalheDoItem(item, agora) {
  if (item.tipo === 'ia') return descreverTempoDecorrido(item.momento, agora);
  if (item.tipo === 'atrasado') return `combinado ${descreverTempoDecorrido(item.momento, agora)}`;
  return '';
}

export function desenharMeuDia(elemento, { itens, clientes, agora, aoAbrirItem }) {
  const titulo = criar('h2', { classe: 'titulo-secao' }, [icone('list-check'), `Meu dia · ${itens.length}`]);

  if (itens.length === 0) {
    substituirConteudo(elemento, [
      titulo,
      criar('div', { classe: 'dia-vazio' }, [icone('circle-check'), 'Tudo em dia. Bom momento para revisar o funil.']),
    ]);
    return;
  }

  const lista = itens.map((item) => {
    const cliente = clientes.find((c) => c.id === item.idCliente);
    return criar('button', { classe: `item-do-dia ${item.tipo}`, atributos: { type: 'button' }, aoClicar: () => aoAbrirItem(item) }, [
      criar('div', { classe: 'cabecalho-do-item' }, [seloDoItem(item),criar('span', { classe: 'texto-fraco', texto: detalheDoItem(item, agora) })]),
      criar('span', { classe: 'cliente', texto: nomeCurto(cliente?.nome ?? 'Cliente') }),
      criar('span', { classe: 'texto', texto: item.texto }),
    ]);
  });

  substituirConteudo(elemento, [titulo, criar('div', { classe: 'lista-meu-dia' }, lista)]);
}
