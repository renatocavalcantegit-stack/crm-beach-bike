// Validações dos dados que o vendedor digita.
//
// Arquivo PURO. Cada função devolve um objeto { valido, erro } (ou { valido, erros }
// para formulários), com mensagens prontas para mostrar na tela. O servidor vai
// usar estas mesmas funções, para a regra ser igual nos dois lados.

import { converterTextoEmValor, somenteDigitos } from './formatos.js';

/** Valor de uma oportunidade: obrigatório, maior que zero. */
export function validarValor(texto) {
  if (texto === '' || texto === null || texto === undefined) {
    return { valido: false, erro: 'Informe o valor' };
  }
  const valor = converterTextoEmValor(texto);
  if (valor === null) return { valido: false, erro: 'Valor inválido. Use o formato 4.890,00' };
  if (valor <= 0) return { valido: false, erro: 'O valor precisa ser maior que zero' };
  return { valido: true, valor };
}

/**
 * Telefone brasileiro com DDD: 10 dígitos (fixo) ou 11 (celular).
 * É o telefone que vira link do WhatsApp, por isso o DDD é obrigatório.
 */
export function validarTelefone(texto) {
  const digitos = somenteDigitos(texto);
  if (digitos.length === 0) return { valido: false, erro: 'Informe o telefone' };
  if (digitos.length < 10 || digitos.length > 11) {
    return { valido: false, erro: 'Telefone com DDD: (85) 98812-4410' };
  }
  return { valido: true, telefone: digitos };
}

export function validarNome(texto) {
  const nome = String(texto ?? '').trim();
  if (nome.length < 2) return { valido: false, erro: 'Informe o nome do cliente' };
  return { valido: true, nome };
}

/** Formulário "Novo atendimento" (cliente que chegou na loja). */
export function validarNovoAtendimento({ nome, telefone, interesse }) {
  const erros = {};
  const resultadoNome = validarNome(nome);
  const resultadoTelefone = validarTelefone(telefone);

  if (!resultadoNome.valido) erros.nome = resultadoNome.erro;
  if (!resultadoTelefone.valido) erros.telefone = resultadoTelefone.erro;
  if (!String(interesse ?? '').trim()) erros.interesse = 'Diga o que o cliente procura';

  return { valido: Object.keys(erros).length === 0, erros };
}

/**
 * Retorno agendado: a data é opcional, mas se vier precisa estar no futuro —
 * agendar retorno no passado criaria um "atrasado" na mesma hora.
 */
export function validarRetorno({ dataHora, descricao }, agora) {
  if (!dataHora) return { valido: true };
  const data = new Date(dataHora);
  if (Number.isNaN(data.getTime())) return { valido: false, erro: 'Data do retorno inválida' };
  if (data <= new Date(agora)) return { valido: false, erro: 'O retorno precisa ser no futuro' };
  if (!String(descricao ?? '').trim()) return { valido: false, erro: 'Diga o que fazer no retorno' };
  return { valido: true };
}
