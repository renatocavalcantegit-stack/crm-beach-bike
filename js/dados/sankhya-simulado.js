// SIMULAÇÃO da integração com o ERP Sankhya.
//
// No sistema real, estas funções vão chamar o nosso servidor, que por sua vez
// consulta a API do Sankhya (OAuth2). A tela não sabe a diferença: ela só
// recebe uma Promise com os dados, depois de um pequeno atraso.

import { aguardar, ler } from './armazenamento.js';

/** Compras do cliente (notas fiscais) registradas no Sankhya. */
export async function buscarHistoricoDeCompras(codigoParceiro) {
  await aguardar(600); // a API externa costuma ser mais lenta que o resto
  if (!codigoParceiro) return [];
  const compras = ler('comprasSankhya', {});
  return (compras[codigoParceiro] ?? []).sort((a, b) => new Date(b.data) - new Date(a.data));
}

/** Quando foi a última sincronização (aparece no topo da tela). */
export async function obterUltimaSincronizacao() {
  return ler('sincronizacaoSankhya', null);
}
