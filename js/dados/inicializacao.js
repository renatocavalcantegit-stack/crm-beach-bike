// Carga dos dados de demonstração.
//
// No primeiro acesso (ou ao clicar em "Restaurar demonstração") os dados
// fictícios são gravados no navegador. Depois disso, tudo que o usuário faz
// fica salvo e sobrevive ao recarregar a página.

import { criarDadosDeDemonstracao } from '../demo/dados-demo.js';
import { apagarTudo, gravar, ler } from './armazenamento.js';

// Mude este número quando o formato dos dados mudar: os navegadores que
// tinham a versão antiga recebem a demonstração nova automaticamente.
const VERSAO_DOS_DADOS = 1;

function gravarDemonstracao() {
  const dados = criarDadosDeDemonstracao(new Date());
  for (const [chave, valor] of Object.entries(dados)) gravar(chave, valor);
  gravar('versao', VERSAO_DOS_DADOS);
}

export async function garantirDadosIniciais() {
  if (ler('versao') !== VERSAO_DOS_DADOS) {
    apagarTudo();
    gravarDemonstracao();
  }
}

export async function restaurarDemonstracao() {
  // Preferências (tema, "ver como") são do usuário, não da demonstração: ficam.
  const preferencias = ler('preferencias');
  apagarTudo();
  gravarDemonstracao();
  if (preferencias) gravar('preferencias', preferencias);
}
