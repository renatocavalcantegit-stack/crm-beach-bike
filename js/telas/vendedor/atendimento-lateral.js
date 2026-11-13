// Coluna da direita do atendimento: tudo que o vendedor precisa saber do
// cliente enquanto conversa. Resumo da IA, próximo retorno, bicicletas,
// compras no Sankhya e linha do tempo.

import { buscarHistoricoDeCompras } from '../../dados/sankhya-simulado.js';
import { descreverTempoDecorrido, formatarData, formatarHora, formatarMoeda } from '../../regras/formatos.js';
import { estaAberta } from '../../regras/funil.js';
import { criar, icone, numero, selo } from '../../tela/dom.js';

function secao(titulo, conteudo, extra = null) {
  return criar('section', { classe: 'painel-secao' }, [criar('h3', { classe: 'titulo-secao' }, [...titulo, extra]), ...conteudo]);
}

function secaoResumoIa(oportunidade) {
  if (!oportunidade?.resumoIa) return null;
  return criar('section', { classe: 'painel-secao' }, [
    criar('div', { classe: 'resumo-ia' }, [
      criar('h3', { classe: 'titulo-secao' }, [icone('sparkles'), 'Resumo do assistente IA']),
      criar('p', { texto: oportunidade.resumoIa }),
    ]),
  ]);
}

/** Próximo retorno pendente deste atendimento, com botão para agendar outro. */
function secaoProximoRetorno(oportunidade, tarefas, { agora, aoAgendar }) {
  if (!oportunidade || !estaAberta(oportunidade)) return null;
  const pendentes = tarefas
    .filter((tarefa) => tarefa.idOportunidade === oportunidade.id && !tarefa.concluida)
    .sort((a, b) => new Date(a.dataHora) - new Date(b.dataHora));
  const proximo = pendentes[0];

  const conteudo = proximo
    ? criar('div', { classe: `linha-simples ${new Date(proximo.dataHora) < agora ? 'atrasada' : ''}`.trim() }, [
        criar('span', {}, [proximo.descricao, criar('small', { texto: `${formatarData(proximo.dataHora)} às ${formatarHora(proximo.dataHora)}` })]),
        new Date(proximo.dataHora) < agora ? selo('Atrasado', { tipo: 'alerta' }) : null,
      ])
    : criar('p', { classe: 'texto-fraco', texto: 'Nenhum retorno agendado.' });

  return secao([icone('calendar-event'), 'Próximo retorno'], [
    conteudo,
    criar('button', { classe: 'botao botao-pequeno', atributos: { type: 'button' }, aoClicar: aoAgendar }, [icone('calendar-plus'), 'Agendar retorno']),
  ]);
}

function secaoBicicletas(bicicletas) {
  const linhas = bicicletas.length
    ? bicicletas.map((bike) =>
        criar('div', { classe: 'linha-simples' }, [
          criar('span', {}, [`${bike.marca} ${bike.modelo} ${bike.ano}`, criar('small', { texto: `Aro ${bike.aro} · quadro ${bike.quadro} · ${bike.cor}` })]),
          criar('span', { classe: 'numero texto-fraco', texto: bike.numeroSerie }),
        ]),
      )
    : [criar('p', { classe: 'texto-fraco', texto: 'Nenhuma bicicleta cadastrada.' })];
  return secao([icone('bike'), 'Bicicletas'], [criar('div', { classe: 'lista-simples' }, linhas)]);
}

/**
 * Compras vêm do Sankhya (simulado), que responde mais devagar: mostra "carregando".
 * Criada uma vez por atendimento aberto, para não consultar o Sankhya a cada mensagem.
 */
export function criarSecaoDeCompras(cliente) {
  const lista = criar('div', { classe: 'lista-simples' }, [criar('div', { classe: 'carregando', texto: 'Consultando o Sankhya…' })]);

  if (!cliente.codigoParceiroSankhya) {
    lista.replaceChildren(criar('p', { classe: 'texto-fraco', texto: 'Ainda não é parceiro no Sankhya (nenhuma compra).' }));
  } else {
    buscarHistoricoDeCompras(cliente.codigoParceiroSankhya).then((compras) => {
      lista.replaceChildren(
        ...(compras.length
          ? compras.map((compra) =>
              criar('div', { classe: 'linha-simples' }, [
                criar('span', {}, [compra.descricao, criar('small', { texto: `${formatarData(compra.data)} · ${compra.nota}` })]),
                numero(formatarMoeda(compra.valor)),
              ]),
            )
          : [criar('p', { classe: 'texto-fraco', texto: 'Nenhuma compra encontrada.' })]),
      );
    });
  }
  return secao([icone('receipt'), 'Compras'], [lista], selo('Sankhya', { tipo: 'tecnologia' }));
}

function secaoLinhaDoTempo(interacoes, agora) {
  const eventos = interacoes.map((interacao) =>
    criar('div', { classe: `evento ${interacao.tipo}` }, [
      interacao.descricao,
      criar('small', { texto: `${formatarData(interacao.em)} · ${formatarHora(interacao.em)} · ${descreverTempoDecorrido(interacao.em, agora)}` }),
    ]),
  );
  return secao([icone('timeline'), 'Linha do tempo'], [
    eventos.length ? criar('div', { classe: 'linha-do-tempo' }, eventos) : criar('p', { classe: 'texto-fraco', texto: 'Sem registros ainda.' }),
  ]);
}

export function desenharLateral({ oportunidade, bicicletas, interacoes, tarefas, secaoDeCompras, agora, aoAgendar }) {
  return criar('div', { classe: 'lateral-do-atendimento' }, [
    secaoResumoIa(oportunidade),
    secaoProximoRetorno(oportunidade, tarefas, { agora, aoAgendar }),
    secaoBicicletas(bicicletas),
    secaoDeCompras,
    secaoLinhaDoTempo(interacoes, agora),
  ]);
}
