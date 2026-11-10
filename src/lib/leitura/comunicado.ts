// Comunicado do primeiro mes aos moradores (E9-A; texto aprovado, Daniel 04/11). Modulo PURO.
// Fonte unica do texto: o e-mail (lib/envio/email.ts) e a folha impressa (folha.tsx) usam este modulo,
// entao uma mudanca no texto vale para os dois.

import { formatarMoeda } from '@/lib/leitura/modelo';

export type TextoComunicado = {
  titulo: string;
  saudacao: string;
  abertura: string;
  itens: string[];
  depois: string[];
  assinatura: string;
};

export function textoComunicado(minimo: number): TextoComunicado {
  return {
    titulo: 'Novo demonstrativo de consumo de gás',
    saudacao: 'Prezado(a) morador(a),',
    abertura:
      'A partir deste mês, a Libergás passa a registrar as leituras do gás do seu condomínio em um sistema próprio. Junto com a cobrança, você vai receber este demonstrativo, que mostra:',
    itens: [
      'a leitura anterior e a atual do seu medidor, com as datas;',
      'o consumo do período, em m³ e em kg de gás;',
      'o preço do m³ e o valor do período;',
      'o seu consumo mês a mês ao longo do ano.',
    ],
    depois: [
      `O cálculo continua o mesmo: consumo em m³ × preço do m³. Quando o valor do mês fica abaixo do mínimo de ${formatarMoeda(minimo)}, ele não é cobrado naquele mês: acumula e entra na próxima cobrança. O demonstrativo indica quando isso acontece.`,
      'Sobre o gráfico: os meses anteriores a outubro/2026 vêm do nosso controle antigo, em planilha. Nos meses em que o consumo acumulava, o mês pode aparecer zerado, e o total aparece no mês em que foi cobrado.',
    ],
    assinatura: 'Libergás',
  };
}
