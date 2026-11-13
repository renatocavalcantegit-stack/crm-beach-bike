// Lista da vez do dia. As regras (quem é o próximo, pausa, presença) estão em
// js/regras/distribuicao.js; aqui só lemos e gravamos o resultado.

import * as regras from '../regras/distribuicao.js';
import { aguardar, gravar, ler } from './armazenamento.js';

/** A fila de hoje (reinicia se a gravada for de outro dia). */
export async function obterFilaDoDia() {
  await aguardar();
  const gravada = ler('fila', { data: null, ordem: [], situacao: {} });
  const doDia = regras.prepararFilaDoDia(gravada, new Date());
  if (doDia !== gravada) gravar('fila', doDia);
  return doDia;
}

async function alterarFila(funcaoDaRegra, idVendedor) {
  const fila = funcaoDaRegra(await obterFilaDoDia(), idVendedor);
  gravar('fila', fila);
  return fila;
}

export const marcarPresenca = (idVendedor) => alterarFila(regras.marcarPresenca, idVendedor);
export const pausar = (idVendedor) => alterarFila(regras.pausar, idVendedor);
export const voltarDaPausa = (idVendedor) => alterarFila(regras.voltarDaPausa, idVendedor);
export const passarAVez = (idVendedor) => alterarFila(regras.passarAVez, idVendedor);

/** Regras de distribuição que o gerente poderá mudar depois (tela própria). */
export async function obterConfiguracaoDaDistribuicao() {
  return { ...regras.CONFIGURACAO_PADRAO, ...ler('configuracaoDistribuicao', {}) };
}
