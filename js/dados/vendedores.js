// Vendedores da loja. No protótipo a lista é fixa (vem da demonstração).

import { aguardar, ler } from './armazenamento.js';

export async function listarVendedores() {
  await aguardar();
  return ler('vendedores', []);
}

export async function buscarVendedor(idVendedor) {
  const vendedores = await listarVendedores();
  return vendedores.find((vendedor) => vendedor.id === idVendedor) ?? null;
}
