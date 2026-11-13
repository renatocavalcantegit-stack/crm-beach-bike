// Servidor local mínimo para abrir o protótipo no navegador.
//
// Por que precisa de servidor? O protótipo usa módulos JavaScript (import/export),
// e o navegador bloqueia módulos abertos direto do disco (file://) por segurança.
// Este arquivo só entrega os arquivos da pasta; não tem regra de negócio nem banco.
// Não usa nenhuma dependência externa: só o que já vem com o Node.

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';

const PASTA_RAIZ = resolve(import.meta.dirname, '..');
const PORTA = Number(process.env.PORTA) || 5173;

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

createServer(async (pedido, resposta) => {
  const caminhoPedido = decodeURIComponent(new URL(pedido.url, 'http://local').pathname);
  const caminhoRelativo = caminhoPedido.endsWith('/') ? caminhoPedido + 'index.html' : caminhoPedido;

  // Impede acessar arquivos fora da pasta do projeto (ex.: /../../segredo.txt).
  const caminhoArquivo = normalize(join(PASTA_RAIZ, caminhoRelativo));
  if (!caminhoArquivo.startsWith(PASTA_RAIZ)) {
    resposta.writeHead(403).end('Acesso negado');
    return;
  }

  try {
    const conteudo = await readFile(caminhoArquivo);
    resposta.writeHead(200, {
      'Content-Type': TIPOS[extname(caminhoArquivo)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    resposta.end(conteudo);
  } catch {
    resposta.writeHead(404).end('Arquivo não encontrado');
  }
}).listen(PORTA, () => {
  console.log(`Protótipo rodando em http://localhost:${PORTA}`);
});
