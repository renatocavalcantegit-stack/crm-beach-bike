// Clientes e suas bicicletas.
//
// No sistema real, o cadastro do cliente vem do Sankhya (parceiros). Aqui ele
// fica no navegador; clientes novos ainda não têm código de parceiro.

import { somenteDigitos } from '../regras/formatos.js';
import { aguardar, gerarId, gravar, ler } from './armazenamento.js';

export async function listarClientes() {
  await aguardar();
  return ler('clientes', []);
}

export async function buscarCliente(idCliente) {
  const clientes = await listarClientes();
  return clientes.find((cliente) => cliente.id === idCliente) ?? null;
}

/** Busca por nome (sem diferenciar acentos e maiúsculas) ou por telefone. */
export async function pesquisarClientes(termo) {
  const texto = normalizar(termo);
  const digitos = somenteDigitos(termo);
  if (texto.length < 2) return [];

  const clientes = await listarClientes();
  return clientes
    .filter((cliente) => normalizar(cliente.nome).includes(texto) || (digitos.length >= 4 && cliente.telefone.includes(digitos)))
    .slice(0, 8);
}

export async function buscarClientePorTelefone(telefone) {
  const digitos = somenteDigitos(telefone);
  const clientes = await listarClientes();
  return clientes.find((cliente) => cliente.telefone === digitos) ?? null;
}

export async function criarCliente({ nome, telefone, bairro = '' }) {
  const clientes = await listarClientes();
  const cliente = {
    id: gerarId('cli'),
    nome: nome.trim(),
    telefone: somenteDigitos(telefone),
    bairro,
    dataNascimento: null,
    clienteDesde: null,
    codigoParceiroSankhya: null,
  };
  gravar('clientes', [...clientes, cliente]);
  return cliente;
}

export async function listarBicicletasDoCliente(idCliente) {
  await aguardar();
  return ler('bicicletas', []).filter((bicicleta) => bicicleta.idCliente === idCliente);
}

function normalizar(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}
