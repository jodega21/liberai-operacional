// E-mail do demonstrativo da leitura (LEI5 fatia 2, E4-A: HTML no corpo, sem PDF). Modulo PURO.
// Mesmo conteudo da folha impressa (LEI4, folha.tsx), em HTML de e-mail: tabelas e estilo inline (os
// programas de e-mail nao leem as classes do app). Cores da marca: azul #557dbe, laranja #e1a064.
// Modo escuro e celular (Daniel, 05/11): a logo JPG de fundo branco virava um retangulo solto no app
// de e-mail escurecido; agora e a marca original SEM FUNDO (PNG transparente,
// public/marca-libergas-transparente.png, do "Marca Principal nacionalgas"), legivel no claro e no
// escuro. No celular, os quatro campos viram dois por linha e as datas nao viram link.

import { WHATSAPP, type Demonstrativo, type PontoHistorico, type ResumoCondominio } from '@/lib/leitura/demonstrativo';
import { textoComunicado } from '@/lib/leitura/comunicado';
import { formatarData, formatarM3, formatarMoeda, ROTULO_DOCUMENTO, rotuloMes, type TipoDocumento } from '@/lib/leitura/modelo';

const AZUL = '#557dbe';
const LARANJA = '#e1a064';
const CINZA = '#6b7280';

export type Email = { assunto: string; html: string; texto: string };

export function escapar(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const rotuloPequeno = (s: string) =>
  `<div style="font-size:11px;letter-spacing:.04em;text-transform:uppercase;color:${CINZA}">${escapar(s)}</div>`;

function cabecalho(urlBase: string, titulo: string, subtitulo: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-bottom:3px solid ${AZUL}">
<tr><td valign="bottom" style="padding:0 8px 8px 0"><img src="${escapar(urlBase)}/marca-libergas-transparente.png" alt="Libergás" width="118" height="43" style="display:block;width:118px;height:43px;border:0"></td>
<td align="right" valign="bottom" style="padding:0 0 8px"><div style="font-size:15px;font-weight:bold">${escapar(titulo)}</div><div style="font-size:13px;color:${CINZA}">${escapar(subtitulo)}</div></td></tr></table>`;
}

// Data sem virar link: o app de e-mail transforma "20/10/2026" em link de agenda; o "word joiner"
// (invisivel) depois de cada barra quebra a deteccao sem mudar o que aparece.
function data(iso: string): string {
  return formatarData(iso).replace(/\//g, '/\u2060');
}

// Rodape em duas linhas (Daniel, 05/11): lado a lado, o app do Gmail no celular espremia a coluna do
// WhatsApp e quebrava o telefone em "3227-" / "2263" mesmo com white-space:nowrap.
function rodape(urlBase: string, observacao: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;border-top:1px solid #e5e7eb">
<tr><td style="padding-top:10px;font-size:14px">
<a href="${WHATSAPP.link}" style="color:#25a35a;font-weight:bold;text-decoration:none;white-space:nowrap">WhatsApp ${escapar(WHATSAPP.rotulo)}</a>
<span style="font-size:13px;color:${CINZA}"> · Dúvidas? Fale com a Libergás</span></td></tr>
<tr><td style="padding-top:8px;font-size:12px;color:${CINZA}">${escapar(observacao)}</td></tr></table>`;
}

// Campo de valor. Dois por linha (antes quatro): no celular quatro colunas quebravam "3,445 m³" e
// "Preço do m³" em varias linhas.
function campo(rotulo: string, valor: string, detalhe: string, direita = false): string {
  return `<td width="50%" valign="top" style="padding:8px 10px;${direita ? '' : 'border-right:1px solid #d1d5db;'}">${rotuloPequeno(rotulo)}
<div style="font-size:16px;font-weight:bold;white-space:nowrap">${escapar(valor)}</div><div style="font-size:12px;color:${CINZA}">${escapar(detalhe)}</div></td>`;
}

function documentoTexto(doc: { tipo: TipoDocumento | string; numero: string | null } | null): string | null {
  if (!doc || doc.tipo === 'planilha' || !doc.numero) return null;
  return `${ROTULO_DOCUMENTO[doc.tipo as TipoDocumento] ?? doc.tipo} nº ${doc.numero}`;
}

// Historico do ano em tabela (barras de largura fixa: altura proporcional por celula vazia).
function historico(pontos: PontoHistorico[], referencia: string): string {
  if (pontos.length === 0) return '';
  const ano = referencia.slice(0, 4);
  const meses = Array.from({ length: 12 }, (_, i) => `${ano}-${String(i + 1).padStart(2, '0')}-01`);
  const porMes = new Map(pontos.map((p) => [p.referencia, p]));
  const max = Math.max(...pontos.map((p) => p.m3), 0.001);
  const ALTURA = 60;
  // Celular (Daniel, 05/11): doze colunas nao comportam m³ com tres casas e o valor em R$; o grafico
  // mostra so o m³ com uma casa (o valor do mes esta no quadro do vencimento) e a marca + / =.
  const valores = meses.map((m) => {
    const p = porMes.get(m);
    if (!p) return '<td></td>';
    const atual = m === referencia;
    const m3 = p.m3.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    return `<td align="center" valign="bottom" style="font-size:10px;line-height:1.2;color:${atual ? '#111827' : CINZA};${atual ? 'font-weight:bold;' : ''}padding:0 0 2px">${escapar(m3)}${p.marca ? escapar(p.marca) : ''}</td>`;
  });
  const barras = meses.map((m) => {
    const p = porMes.get(m);
    if (!p) return `<td style="height:${ALTURA}px"></td>`;
    const h = Math.max(Math.round((p.m3 / max) * ALTURA), 2);
    return `<td valign="bottom" style="height:${ALTURA}px;padding:0 3px"><div style="height:${h}px;background:${m === referencia ? AZUL : '#c7d5ec'};border-radius:2px 2px 0 0"></div></td>`;
  });
  const nomes = meses.map((m) => `<td align="center" style="font-size:10px;color:${CINZA};border-top:1px solid #d1d5db">${rotuloMes(m).slice(0, 3)}</td>`);
  const marca = pontos.some((p) => p.marca)
    ? `<div style="font-size:11px;color:${CINZA};margin-top:4px">+ abaixo do mínimo, somou com o mês seguinte · = mês em que o acumulado foi cobrado</div>`
    : '';
  // Tabela mes a mes abaixo do grafico (Daniel, 05/11: "quanto mais informacao, menos confusao"): o
  // valor em R$ que nao cabe no grafico do celular. Tres colunas largas cabem em qualquer tela.
  const linhas = meses.filter((m) => porMes.has(m)).map((m) => {
    const p = porMes.get(m)!;
    const atual = m === referencia;
    const valor = p.marca === '=' && p.valor_cobrado !== null ? `${formatarMoeda(p.valor_cobrado)} =`
      : p.valor !== null ? `${formatarMoeda(p.valor)}${p.marca === '+' ? ' +' : ''}` : p.marca === '+' ? '+' : '—';
    const est = `padding:3px 8px;border-top:1px solid #e5e7eb;${atual ? 'font-weight:bold;' : ''}`;
    return `<tr><td style="${est}">${escapar(rotuloMes(m))}</td><td align="right" style="${est}white-space:nowrap">${escapar(formatarM3(p.m3))}</td><td align="right" style="${est}white-space:nowrap">${escapar(valor)}</td></tr>`;
  });
  const tabela = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px;font-size:13px;border:1px solid #d1d5db;border-radius:4px">
<tr><td style="padding:4px 8px;font-size:11px;color:${CINZA}">MÊS</td><td align="right" style="padding:4px 8px;font-size:11px;color:${CINZA}">M³</td><td align="right" style="padding:4px 8px;font-size:11px;color:${CINZA}">VALOR DO CONSUMO</td></tr>
${linhas.join('\n')}</table>`;
  return `<div style="margin-top:14px">${rotuloPequeno(`Consumo da unidade em ${ano} (m³)`)}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="table-layout:fixed;margin-top:4px">
<tr>${valores.join('')}</tr><tr>${barras.join('')}</tr><tr>${nomes.join('')}</tr></table>${tabela}${marca}</div>`;
}

// Comunicado do primeiro mes (E9-A): texto em lib/leitura/comunicado.ts (o mesmo da folha impressa).
function comunicado(minimo: number): { html: string; texto: string } {
  const t = textoComunicado(minimo);
  const html = `<div style="border:1px solid #d1d5db;border-radius:6px;padding:14px 16px;margin-bottom:18px;font-size:14px;line-height:1.5">
<div style="font-size:15px;font-weight:bold;margin-bottom:6px">${escapar(t.titulo)}</div>
<p style="margin:0 0 6px">${escapar(t.saudacao)}</p>
<p style="margin:0 0 4px">${escapar(t.abertura)}</p>
<ul style="margin:0 0 8px;padding-left:20px">${t.itens.map((i) => `<li>${escapar(i)}</li>`).join('')}</ul>
${t.depois.map((p) => `<p style="margin:0 0 8px">${escapar(p)}</p>`).join('')}
<p style="margin:0">Atenciosamente,<br>${escapar(t.assinatura)}</p></div>`;
  const texto = [t.titulo, '', t.saudacao, t.abertura, ...t.itens.map((i) => `- ${i}`), '', ...t.depois, '', 'Atenciosamente,', t.assinatura, '', '----', ''].join('\n');
  return { html, texto };
}

function envelope(conteudo: string): string {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light">
<style>:root{color-scheme:light;supported-color-schemes:light}</style></head>
<body style="margin:0;padding:0;background:#f3f4f6"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6">
<tr><td align="center" style="padding:16px 8px"><table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;background:#ffffff;border-radius:8px">
<tr><td style="padding:20px 22px;font-family:Arial,Helvetica,sans-serif;color:#111827">${conteudo}</td></tr></table></td></tr></table></body></html>`;
}

export type DadosDemonstrativoEmail = {
  d: Demonstrativo;
  condominio: string;
  referencia: string;
  vencimento: string | null;
  minimo: number;
  quemLe: string;
  comComunicado: boolean;
  urlBase: string;
};

export function emailDemonstrativo(x: DadosDemonstrativoEmail): Email {
  const { d } = x;
  const mes = rotuloMes(x.referencia);
  const acumula = d.situacao === 'acumula';
  const doc = documentoTexto(d.documento);
  const valorBloco = acumula
    ? `<div style="border-left:4px solid ${LARANJA};background:#fdf4ea;padding:10px 12px;font-size:14px"><b>Sem cobrança neste mês.</b> O consumo desde a última cobrança${d.valor ? ` (${escapar(formatarMoeda(d.valor))})` : ''} ficou abaixo do mínimo de ${escapar(formatarMoeda(x.minimo))} e entra na próxima cobrança.</div>`
    : `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-left:4px solid ${AZUL};background:#f3f6fb"><tr>
<td style="padding:10px 12px;font-size:14px">${x.vencimento ? `Vencimento <b>${escapar(data(x.vencimento))}</b>` : 'Valor do consumo'}</td>
<td align="right" style="padding:10px 12px"><div style="font-size:22px;font-weight:800">${escapar(formatarMoeda(d.valor))}</div>${doc ? `<div style="font-size:13px;color:#374151">${escapar(doc)}</div>` : ''}</td></tr></table>`;
  const consumoRotulo = acumula ? 'Consumo acumulado' : 'Consumo';
  const corpo = `${x.comComunicado ? comunicado(x.minimo).html : ''}
${cabecalho(x.urlBase, 'Demonstrativo de consumo de gás', `Referência ${mes}`)}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:12px 0;font-size:14px"><tr>
<td valign="top">${rotuloPequeno('Condomínio')}<div style="font-weight:bold">${escapar(x.condominio)}</div></td>
<td valign="top" align="right">${rotuloPequeno('Unidade')}<div style="font-size:18px;font-weight:bold">${escapar(d.identificacao)}</div></td></tr>
<tr><td valign="top" style="padding-top:6px">${rotuloPequeno('Morador')}<div>${escapar(d.morador ?? '—')}</div></td>
<td valign="top" align="right" style="padding-top:6px">${rotuloPequeno('Leitura feita por')}<div>${escapar(x.quemLe)}</div></td></tr></table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #d1d5db;border-radius:4px;margin-bottom:12px"><tr>
${campo('Leitura anterior', formatarM3(d.anterior.valor), `m³ · ${d.anterior.data ? data(d.anterior.data) : 'última cobrada'}`)}
${campo('Leitura atual', formatarM3(d.atual.valor), `m³ · ${data(d.atual.data)}`, true)}
</tr><tr>
${campo(consumoRotulo, `${formatarM3(d.consumo)} m³`, `≈ ${d.kg.toLocaleString('pt-BR')} kg de gás`).replace('padding:8px 10px;', 'padding:8px 10px;border-top:1px solid #d1d5db;')}
${campo('Preço do m³', d.preco_m3 !== null ? formatarMoeda(d.preco_m3) : '—', d.dias !== null ? `${d.dias} dias` : ' ', true).replace('padding:8px 10px;', 'padding:8px 10px;border-top:1px solid #d1d5db;')}
</tr></table>
${valorBloco}
${d.composicao.length > 0 ? `<p style="font-size:13px;color:#374151;margin:10px 0 0">Inclui: ${escapar(d.composicao.join('; '))}.</p>` : ''}
${historico(d.historico, x.referencia)}
${rodape(x.urlBase, `Documento informativo, sem valor fiscal. Mínimo de cobrança ${formatarMoeda(x.minimo)}: abaixo dele o consumo acumula para o mês seguinte.`)}`;

  const linhas = [
    x.comComunicado ? comunicado(x.minimo).texto : '',
    `Demonstrativo de consumo de gás - referência ${mes}`,
    `Condomínio: ${x.condominio} - Unidade ${d.identificacao}`,
    `Morador: ${d.morador ?? '-'}`,
    `Leitura anterior: ${formatarM3(d.anterior.valor)} m³${d.anterior.data ? ` (${formatarData(d.anterior.data)})` : ''}`,
    `Leitura atual: ${formatarM3(d.atual.valor)} m³ (${formatarData(d.atual.data)})`,
    `${consumoRotulo}: ${formatarM3(d.consumo)} m³ (≈ ${d.kg.toLocaleString('pt-BR')} kg)`,
    `Preço do m³: ${d.preco_m3 !== null ? formatarMoeda(d.preco_m3) : '-'}`,
    acumula
      ? `Sem cobrança neste mês: abaixo do mínimo de ${formatarMoeda(x.minimo)}, entra na próxima cobrança.`
      : `Valor: ${formatarMoeda(d.valor)}${x.vencimento ? ` - vencimento ${formatarData(x.vencimento)}` : ''}${doc ? ` - ${doc}` : ''}`,
    d.composicao.length > 0 ? `Inclui: ${d.composicao.join('; ')}.` : '',
    '',
    `Dúvidas: WhatsApp ${WHATSAPP.rotulo} - ${WHATSAPP.link}`,
    'Documento informativo, sem valor fiscal.',
  ].filter((l, i, a) => l !== '' || a[i - 1] !== '');

  return {
    assunto: `Demonstrativo de gás ${mes} - ${x.condominio} - unidade ${d.identificacao}`,
    html: envelope(corpo),
    texto: linhas.join('\n'),
  };
}

export type DadosResumoEmail = {
  resumo: ResumoCondominio;
  condominio: string;
  referencia: string;
  vencimento: string | null;
  documento: { tipo: string; numero: string | null } | null;
  urlBase: string;
};

// Resumo para o condominio que paga (G2): total, documento e as unidades.
export function emailResumoCondominio(x: DadosResumoEmail): Email {
  const mes = rotuloMes(x.referencia);
  const doc = documentoTexto(x.documento);
  const linhas = x.resumo.unidades.map((u) => `<tr>
<td style="padding:5px 6px;border-bottom:1px solid #e5e7eb">${escapar(u.identificacao)}</td>
<td style="padding:5px 6px;border-bottom:1px solid #e5e7eb">${escapar(u.morador ?? '—')}</td>
<td align="right" style="padding:5px 6px;border-bottom:1px solid #e5e7eb">${escapar(formatarM3(u.anterior.valor))}</td>
<td align="right" style="padding:5px 6px;border-bottom:1px solid #e5e7eb">${escapar(formatarM3(u.atual.valor))}</td>
<td align="right" style="padding:5px 6px;border-bottom:1px solid #e5e7eb">${escapar(formatarM3(u.consumo))}</td>
<td align="right" style="padding:5px 6px;border-bottom:1px solid #e5e7eb">${escapar(formatarMoeda(u.valor))}</td></tr>`).join('');
  const th = (s: string, alinhar = 'left') => `<th align="${alinhar}" style="padding:5px 6px;font-size:11px;text-transform:uppercase;color:${CINZA};border-bottom:2px solid ${AZUL}">${s}</th>`;
  const corpo = `${cabecalho(x.urlBase, 'Resumo do condomínio', `Leitura de ${mes}`)}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:12px 0"><tr>
<td>${rotuloPequeno('Condomínio')}<div style="font-weight:bold;font-size:15px">${escapar(x.condominio)}</div></td>
<td align="right">${rotuloPequeno('Total do consumo')}<div style="font-size:22px;font-weight:800">${escapar(formatarMoeda(x.resumo.total_valor))}</div>
${x.vencimento ? `<div style="font-size:13px">Vencimento <b>${escapar(data(x.vencimento))}</b></div>` : ''}${doc ? `<div style="font-size:13px;color:#374151">${escapar(doc)}</div>` : ''}</td></tr></table>
<p style="font-size:13px;color:#374151;margin:0 0 8px">Consumo do mês ${escapar(formatarM3(x.resumo.consumo_mes))} m³ (≈ ${escapar(x.resumo.kg_mes.toLocaleString('pt-BR'))} kg de gás)${x.resumo.preco_m3 !== null ? ` · preço do m³ ${escapar(formatarMoeda(x.resumo.preco_m3))}` : ''}.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:13px">
<tr>${th('Unidade')}${th('Morador')}${th('Anterior', 'right')}${th('Atual', 'right')}${th('m³', 'right')}${th('Valor', 'right')}</tr>${linhas}</table>
${rodape(x.urlBase, 'Documento informativo, sem valor fiscal. O demonstrativo de cada unidade está à disposição.')}`;
  const texto = [
    `Resumo do condomínio - leitura de ${mes}`,
    `Condomínio: ${x.condominio}`,
    `Total do consumo: ${formatarMoeda(x.resumo.total_valor)}${x.vencimento ? ` - vencimento ${formatarData(x.vencimento)}` : ''}${doc ? ` - ${doc}` : ''}`,
    '',
    ...x.resumo.unidades.map((u) => `${u.identificacao} - ${u.morador ?? '-'}: ${formatarM3(u.consumo)} m³ - ${formatarMoeda(u.valor)}`),
    '',
    `Dúvidas: WhatsApp ${WHATSAPP.rotulo} - ${WHATSAPP.link}`,
  ].join('\n');
  return { assunto: `Resumo da leitura de gás ${mes} - ${x.condominio}`, html: envelope(corpo), texto };
}
