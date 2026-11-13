// Linha do tempo do cliente: contatos, mudanças de etapa, transferências da IA.

import { aguardar, gerarId, gravar, ler } from './armazenamento.js';

export async function listarInteracoesDoCliente(idCliente) {
  await aguardar();
  return ler('interacoes', [])
    .filter((interacao) => interacao.idCliente === idCliente)
    .sort((a, b) => new Date(b.em) - new Date(a.em));
}

/** tipo: 'contato' | 'etapa' | 'ia' | 'oficina' | 'fechamento' | 'distribuicao' */
export async function registrarInteracao({ idCliente, idVendedor = null, tipo, descricao }) {
  const interacao = { id: gerarId('int'), idCliente, idVendedor, tipo, descricao, em: new Date().toISOString() };
  gravar('interacoes', [...ler('interacoes', []), interacao]);
  return interacao;
}
