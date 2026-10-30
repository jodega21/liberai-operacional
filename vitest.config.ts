import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // `server-only` e um marcador: sob a condicao `react-server` (Next, no
      // servidor) ele resolve para um empty.js; em qualquer outra resolucao o
      // index.js JOGA erro de proposito, para pegar import de modulo servidor
      // no bundle do cliente. O Vitest cai nesse "qualquer outra", entao toda
      // suite que encostasse — mesmo indiretamente, via tipo ou helper — num
      // modulo com service-role client morria no import. Apontar o marcador
      // para o proprio empty.js do pacote e o mesmo no-op que o Next faz no
      // servidor: nao afrouxa nada em producao, so tira o marcador do caminho
      // do runner de teste.
      'server-only': path.resolve(__dirname, './node_modules/server-only/empty.js'),
    },
  },
});
