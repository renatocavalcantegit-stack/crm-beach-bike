// ÚNICO arquivo do projeto que lê e grava no armazenamento do navegador (localStorage).
//
// Por que isolar? Quando o back-end existir, os arquivos de js/dados/ passam a
// chamar a API em vez deste arquivo, e nenhuma tela precisa mudar.
//
// O localStorage pode falhar (aba anônima, armazenamento cheio ou bloqueado).
// Nesses casos guardamos em memória: a tela continua funcionando, só não
// lembra os dados ao recarregar.

const PREFIXO = 'crm-beach-bike:';
const memoriaReserva = new Map();

export function ler(chave, valorPadrao = null) {
  try {
    const texto = window.localStorage.getItem(PREFIXO + chave);
    return texto === null ? valorPadrao : JSON.parse(texto);
  } catch {
    return memoriaReserva.has(chave) ? structuredClone(memoriaReserva.get(chave)) : valorPadrao;
  }
}

export function gravar(chave, valor) {
  try {
    window.localStorage.setItem(PREFIXO + chave, JSON.stringify(valor));
  } catch {
    memoriaReserva.set(chave, structuredClone(valor));
  }
}

/** Apaga tudo do CRM (usado ao restaurar a demonstração). */
export function apagarTudo() {
  memoriaReserva.clear();
  try {
    Object.keys(window.localStorage)
      .filter((chave) => chave.startsWith(PREFIXO))
      .forEach((chave) => window.localStorage.removeItem(chave));
  } catch {
    // Sem acesso ao localStorage: a memória reserva já foi limpa.
  }
}

/** Identificador único simples, ex.: "op-lz4k2m-x8f1q". O servidor terá o seu próprio. */
export function gerarId(prefixo) {
  return `${prefixo}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Simula o tempo de resposta de um servidor. Assim a tela já nasce preparada
 * para esperar (mostrar "carregando"), como vai acontecer com a API de verdade.
 */
export function aguardar(milissegundos = 120) {
  return new Promise((resolver) => setTimeout(resolver, milissegundos));
}
