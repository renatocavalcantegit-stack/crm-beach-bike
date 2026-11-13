// Formulários que abrem em modal na tela do vendedor.
// Cada um valida com as regras de js/regras/ e grava pela camada de dados.

import { receberContato } from '../../dados/atendimentos.js';
import { enviarFoto } from '../../dados/conversas.js';
import { agendarRetorno, marcarComoGanha, marcarComoPerdida, moverParaEtapa, registrarContato } from '../../dados/oportunidades.js';
import { buscarEtapa, MOTIVOS_DE_PERDA } from '../../regras/funil.js';
import { formatarMoeda } from '../../regras/formatos.js';
import { validarNovoAtendimento, validarRetorno, validarValor } from '../../regras/validacoes.js';
import { abrirModal, ErroDeFormulario } from '../../tela/camadas.js';
import { campoDeTexto, campoDeTextoLongo, grupoDeOpcoes } from '../../tela/campos.js';
import { criar } from '../../tela/dom.js';

const valorParaCampo = (valor) => (valor > 0 ? String(valor).replace('.', ',') : '');

/** Mover para Orçamento/Negociação sem valor: pergunta o valor antes. */
export function perguntarValorEMover(oportunidade, idEtapa) {
  return abrirModal({
    titulo: `Mover para ${buscarEtapa(idEtapa).nome}`,
    subtitulo: 'A partir desta etapa o valor é obrigatório: ele entra no "valor em jogo".',
    campos: [campoDeTexto({ nome: 'valor', rotulo: 'Valor da oportunidade (R$)', placeholder: '4.890,00', modoTeclado: 'decimal' })],
    textoConfirmar: 'Mover',
    aoConfirmar: async ({ valor }) => {
      const resultado = validarValor(valor);
      if (!resultado.valido) throw new ErroDeFormulario({ valor: resultado.erro });
      await moverParaEtapa(oportunidade.id, idEtapa, valor);
    },
  });
}

export function confirmarGanho(oportunidade) {
  return abrirModal({
    titulo: 'Registrar venda ganha',
    subtitulo: 'Confirme o valor final, que conta para a sua meta. O faturamento continua no Sankhya.',
    campos: [campoDeTexto({ nome: 'valor', rotulo: 'Valor vendido (R$)', valor: valorParaCampo(oportunidade.valor), modoTeclado: 'decimal' })],
    textoConfirmar: 'Registrar venda',
    aoConfirmar: async ({ valor }) => {
      const resultado = validarValor(valor);
      if (!resultado.valido) throw new ErroDeFormulario({ valor: resultado.erro });
      await marcarComoGanha(oportunidade.id, valor);
    },
  });
}

export function confirmarPerda(oportunidade) {
  return abrirModal({
    titulo: 'Marcar como perdida',
    subtitulo: `${oportunidade.interesse}${oportunidade.valor > 0 ? ' · ' + formatarMoeda(oportunidade.valor) : ''}`,
    campos: [grupoDeOpcoes({ nome: 'motivo', rotulo: 'Por que não fechou?', opcoes: MOTIVOS_DE_PERDA })],
    textoConfirmar: 'Marcar como perdida',
    classeConfirmar: 'botao-alerta',
    aoConfirmar: async ({ motivo }) => {
      if (!motivo) throw new ErroDeFormulario({ motivo: 'Escolha o motivo da perda' });
      await marcarComoPerdida(oportunidade.id, motivo);
    },
  });
}

export function abrirRegistroDeContato(oportunidade) {
  return abrirModal({
    titulo: 'Registrar contato',
    subtitulo: 'Zera o alerta de dias sem contato e conclui os retornos pendentes deste atendimento.',
    campos: [
      campoDeTextoLongo({ nome: 'anotacao', rotulo: 'O que foi conversado', placeholder: 'Cliente vai passar na loja sábado para testar a bike' }),
      campoDeTexto({ nome: 'dataHora', rotulo: 'Próximo retorno (opcional)', tipo: 'datetime-local' }),
      campoDeTexto({ nome: 'descricaoRetorno', rotulo: 'O que fazer no retorno', placeholder: 'Confirmar visita e separar a bike' }),
    ],
    textoConfirmar: 'Registrar',
    aoConfirmar: async ({ anotacao, dataHora, descricaoRetorno }) => {
      const retorno = { dataHora, descricao: descricaoRetorno };
      const validacao = validarRetorno(retorno, new Date());
      if (!validacao.valido) {
        const campo = String(validacao.erro).includes('fazer') ? 'descricaoRetorno' : 'dataHora';
        throw new ErroDeFormulario({ [campo]: validacao.erro });
      }
      await registrarContato(oportunidade.id, { anotacao, retorno: dataHora ? retorno : null });
    },
  });
}

/** Agenda o próximo retorno sem registrar contato. */
export function abrirAgendamentoDeRetorno(oportunidade) {
  return abrirModal({
    titulo: 'Agendar retorno',
    subtitulo: `${oportunidade.interesse}. O retorno aparece no seu "Meu dia" na data marcada.`,
    campos: [
      campoDeTexto({ nome: 'dataHora', rotulo: 'Quando', tipo: 'datetime-local' }),
      campoDeTexto({ nome: 'descricao', rotulo: 'O que fazer', placeholder: 'Ligar para confirmar o test ride' }),
    ],
    textoConfirmar: 'Agendar',
    aoConfirmar: async ({ dataHora, descricao }) => {
      if (!dataHora) throw new ErroDeFormulario({ dataHora: 'Informe a data e a hora' });
      const validacao = validarRetorno({ dataHora, descricao }, new Date());
      if (!validacao.valido) {
        const campo = String(validacao.erro).includes('fazer') ? 'descricao' : 'dataHora';
        throw new ErroDeFormulario({ [campo]: validacao.erro });
      }
      await agendarRetorno(oportunidade.id, { dataHora, descricao });
    },
  });
}

/** Escolher uma foto do catálogo para mandar no chat. */
export function escolherFotoDoCatalogo(oportunidade, catalogo) {
  const opcoes = catalogo.map((produto) =>
    criar('label', { classe: 'opcao-de-foto' }, [
      criar('input', { atributos: { type: 'radio', name: 'idProduto', value: produto.id } }),
      criar('img', { atributos: { src: produto.imagem, alt: '', loading: 'lazy' } }),
      criar('span', { texto: produto.legenda }),
    ]),
  );
  return abrirModal({
    titulo: 'Enviar foto do catálogo',
    subtitulo: 'A foto vai com a legenda do produto.',
    campos: [
      criar('div', { classe: 'campo' }, [
        criar('div', { classe: 'grade-de-fotos', atributos: { role: 'radiogroup', 'aria-label': 'Produtos' } }, opcoes),
        criar('span', { classe: 'erro-do-campo' }),
      ]),
    ],
    textoConfirmar: 'Enviar foto',
    aoConfirmar: async ({ idProduto }) => {
      if (!idProduto) throw new ErroDeFormulario({ idProduto: 'Escolha uma foto' });
      await enviarFoto(oportunidade.id, idProduto);
    },
  });
}

/**
 * Cliente chegou na loja. Pela regra atual, fica com quem o recebeu no balcão
 * (e conta como a vez dele). Devolve o resultado da distribuição, ou null se cancelou.
 */
export async function abrirNovoAtendimento(idVendedorAtual) {
  let resultado = null;
  const confirmou = await abrirModal({
    titulo: 'Novo atendimento na loja',
    subtitulo: 'O cliente fica com você e isso conta como a sua vez na fila.',
    campos: [
      campoDeTexto({ nome: 'nome', rotulo: 'Nome do cliente', placeholder: 'Carla Menezes' }),
      campoDeTexto({ nome: 'telefone', rotulo: 'WhatsApp com DDD', tipo: 'tel', placeholder: '(85) 98812-4410' }),
      campoDeTexto({ nome: 'interesse', rotulo: 'O que procura', placeholder: 'MTB aro 29 até R$ 5 mil' }),
    ],
    textoConfirmar: 'Criar atendimento',
    aoConfirmar: async (dados) => {
      const validacao = validarNovoAtendimento(dados);
      if (!validacao.valido) throw new ErroDeFormulario(validacao.erros);
      resultado = await receberContato({ origem: 'loja', ...dados }, idVendedorAtual);
    },
  });
  return confirmou ? resultado : null;
}
