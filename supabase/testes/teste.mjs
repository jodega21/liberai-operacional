import { novoBanco } from './load.mjs';
import fs from 'node:fs';
const db = await novoBanco();
const T = '00000000-0000-0000-0000-00000000000a', P = '00000000-0000-0000-0000-0000000000bb';
const q = async (sql, a = []) => (await db.query(sql, a)).rows;
const v = async (sql, a = []) => Object.values((await q(sql, a))[0] ?? {})[0];
let ok = 0, falhas = [];
const check = (nome, cond, info = '') => { if (cond) ok++; else falhas.push(nome + ' ' + info); };
const erro = async (nome, sql, a, trecho) => {
  try { await q(sql, a); falhas.push(nome + ' (nao deu erro)'); }
  catch (e) { check(nome, e.message.includes(trecho), '-> ' + e.message); }
};
await q(`insert into public.tenants values ($1)`, [T]);
await q(`insert into public.produtos (tenant_id, codigo) values ($1,'P45-CARGA')`, [T]);
await q(`insert into public._precos_stub values ('2020-01-01', 427.98)`);
const cli = async (n) => v(`insert into public.clientes (tenant_id, nome) values ($1,$2) returning id`, [T, n]);
const SALVAR = `select leitura.salvar_condominio(p_tenant=>$1, p_cliente=>$2, p_pacote=>'transicao_morador', p_base_rateio=>'preco_m3',
  p_quem_le=>$3, p_dia_leitura=>10::smallint, p_dia_vencimento=>15::smallint, p_sindico_nome=>null, p_sindico_telefone=>null,
  p_emails=>'{}', p_observacoes=>null, p_ativo=>true, p_por=>$4)`;
async function condominio(nome, quem, unidades) {
  const c = await cli(nome);
  const co = await v(SALVAR, [T, c, quem, P]);
  const ce = await v(`select leitura.salvar_central($1,null,$2,'Central',null,4::smallint,4::smallint,2.35,true,$3)`, [T, co, P]);
  const u = {};
  for (const [ap, ini] of Object.entries(unidades)) {
    const id = await v(`select leitura.salvar_unidade($1,null,$2,$3,true,$4)`, [T, ce, ap, P]);
    await q(`select leitura.definir_ocupante($1,$2,$3,'2025-12-10',$4)`, [T, id, await cli('Morador ' + ap), P]);
    const med = await v(`select leitura.instalar_medidor($1,$2,null,'2025-12-10',$3,null,$4)`, [T, id, ini, P]);
    u[ap] = { id, med };
  }
  return { co, ce, u };
}
const abrir = (co, ref) => v(`select leitura.abrir_ciclo($1,$2,$3::date,$4::date,$5)`, [T, co, ref + '-01', ref + '-10', P]);
const lancar = (ci, med, val, conf = false, foto = 'f/x.jpg', data = null) =>
  v(`select leitura.registrar_leitura($1,$2,$3,$4::date,$5,$6,null,$7,$8)`, [T, ci, med, data, val, foto, conf, P]);
const fechar = (ci, aceitar = true) => v(`select leitura.fechar_ciclo($1,$2,$3,$4)`, [T, ci, aceitar, P]);

// ===== A. REPLAY MONTE CASTELO 2026 =====
const truth = JSON.parse(fs.readFileSync(new URL('./dados/truth.json', import.meta.url), 'utf8'));
const ia5 = JSON.parse(fs.readFileSync(new URL('./dados/res_gpt-5.4-mini.json', import.meta.url), 'utf8'));
const ia4 = JSON.parse(fs.readFileSync(new URL('./dados/res_gpt-4.1-mini.json', import.meta.url), 'utf8'));
const iaV = (arr, m, a) => { const o = arr.find(x => x.mes === m && x.ap === a); return o ? Number(o.res.leitura) : null; };
const meses = ['JANEIRO','FEVEREIRO','MARÇO','ABRIL','MAIO','JUNHO','JULHO','AGOSTO','SETEMBRO','OUTUBRO'];
const mc = await condominio('MONTE CASTELO', 'libergas', Object.fromEntries(Object.entries(truth.JANEIRO).map(([a, x]) => [a, x.ant])));
const relat = [], alertas = [], recusas = [];
for (let i = 0; i < meses.length; i++) {
  const m = meses[i], ref = `2026-${String(i + 1).padStart(2, '0')}`;
  const ci = await abrir(mc.co, ref);
  for (const [ap, t] of Object.entries(truth[m])) {
    let real = null, fonte = '';
    if (t.atual !== t.ant) { real = t.atual; fonte = 'planilha'; }
    else if (m !== 'JULHO') {
      const a = iaV(ia5, m, ap), b = iaV(ia4, m, ap);
      if (a != null && b != null && Math.abs(a - b) < 0.0015 && a >= t.ant) { real = a; fonte = 'foto'; }
    }
    if (real == null) continue;
    try { await lancar(ci, mc.u[ap].med, real); }
    catch (e) {
      if (e.message.startsWith('CONSUMO_ALTO')) { alertas.push(`${m} ${ap}: ${e.message}`); await lancar(ci, mc.u[ap].med, real, true); }
      else { recusas.push(`${m} ${ap} (${fonte} ${real}): ${e.message}`); }
    }
  }
  await fechar(ci);
  const cob = await q(`select u.identificacao ap, c.situacao, c.valor::float, c.consumo::float from leitura.cobrancas c join leitura.unidades u on u.id=c.unidade_id where c.ciclo_id=$1`, [ci]);
  for (const [ap, t] of Object.entries(truth[m])) {
    const c = cob.find(x => x.ap === ap);
    const planCobrou = t.atual !== t.ant;
    const esperado = Math.round((t.atual - t.ant) * 22.35 * 100) / 100;
    if (planCobrou) {
      const bate = c && c.situacao === 'cobrar' && Math.abs(c.valor - esperado) < 0.011;
      check(`replay ${m} ${ap}`, bate, `planilha cobrou ${esperado}, sistema ${c ? c.situacao + ' ' + c.valor : 'sem leitura'}`);
      if (!bate) relat.push(`${m} ${ap}: planilha cobrou ${esperado.toFixed(2)}; sistema ${c ? c.situacao + ' ' + c.valor.toFixed(2) : 'sem leitura'}`);
    } else {
      const bate = !c || c.situacao === 'acumula';
      check(`replay ${m} ${ap} acumula`, bate, c ? c.situacao + ' ' + c.valor : '');
      if (!bate) relat.push(`${m} ${ap}: planilha acumulou; sistema ${c.situacao} ${c.valor.toFixed(2)} (consumo ${c.consumo})`);
    }
  }
}
console.log('REPLAY - divergencias:', relat.length ? '\n  ' + relat.join('\n  ') : 'nenhuma');
console.log('REPLAY - alertas de consumo alto:', alertas.length ? '\n  ' + alertas.join('\n  ') : 'nenhum');
console.log('REPLAY - leituras recusadas:', recusas.length ? '\n  ' + recusas.join('\n  ') : 'nenhuma');

// ===== B. REGRAS =====
const x = await condominio('TESTE', 'libergas', { '1': 100, '2': 200, '3': 300 });
const c1 = await abrir(x.co, '2026-01');
await erro('R1 menor que a inicial', `select leitura.registrar_leitura($1,$2,$3,null,99.999,'f',null,false,$4)`, [T, c1, x.u['1'].med, P], 'menor que a anterior');
await erro('foto obrigatoria', `select leitura.registrar_leitura($1,$2,$3,null,101,null,null,false,$4)`, [T, c1, x.u['1'].med, P], 'Foto obrigatoria');
await erro('3 casas', `select leitura.registrar_leitura($1,$2,$3,null,101.0001,'f',null,false,$4)`, [T, c1, x.u['1'].med, P], '3 casas');
await erro('ciclo duplicado aberto', `select leitura.abrir_ciclo($1,$2,'2026-02-01','2026-02-10',$3)`, [T, x.co, P], 'ciclo aberto');
await lancar(c1, x.u['1'].med, 105);           // 5 m3 = 111,75 cobrar
await lancar(c1, x.u['2'].med, 201);           // 1 m3 = 22,35 acumula
const l3 = await lancar(c1, x.u['3'].med, 301);
const l3b = await lancar(c1, x.u['3'].med, 302); // correcao no mesmo ciclo = mesma linha
check('correcao reaproveita a linha', l3 === l3b);
await q(`select leitura.remover_leitura($1,$2,$3)`, [T, l3, P]);
await erro('R3 faltantes', `select leitura.fechar_ciclo($1,$2,false,$3)`, [T, c1, P], 'FALTAM_LEITURAS');
check('R3 fecha aceitando', (await fechar(c1, true)) === 1);
await erro('ciclo fechado', `select leitura.registrar_leitura($1,$2,$3,null,106,'f',null,false,$4)`, [T, c1, x.u['1'].med, P], 'Ciclo fechado');
const s1 = await q(`select u.identificacao ap, situacao, valor::float from leitura.cobrancas c join leitura.unidades u on u.id=c.unidade_id where ciclo_id=$1 order by 1`, [c1]);
check('cobrar e acumula', JSON.stringify(s1) === JSON.stringify([{ ap: '1', situacao: 'cobrar', valor: 111.75 }, { ap: '2', situacao: 'acumula', valor: 22.35 }]), JSON.stringify(s1));
check('minimo congelado', Number(await v(`select minimo_cobranca from leitura.ciclos where id=$1`, [c1])) === 65);

// reabrir e fechar de novo
await q(`select leitura.reabrir_ciclo($1,$2,$3)`, [T, c1, P]);
check('reabrir apaga cobrancas', Number(await v(`select count(*) from leitura.cobrancas where ciclo_id=$1`, [c1])) === 0);
await fechar(c1, true);

// mes 2: unidade 2 acumula ate passar; unidade 1 parte de 105
const c2 = await abrir(x.co, '2026-02');
await lancar(c2, x.u['1'].med, 108);   // 3 m3 = 67,05 cobrar
await lancar(c2, x.u['2'].med, 203);   // desde 200 = 3 m3 = 67,05 cobrar (acumulou)
await lancar(c2, x.u['3'].med, 301);   // 1 m3 acumula
await fechar(c2);
const s2 = await q(`select u.identificacao ap, situacao, consumo::float, valor::float, base_valor::float from leitura.cobrancas c join leitura.unidades u on u.id=c.unidade_id where ciclo_id=$1 order by 1`, [c2]);
check('acumulado cobra desde a ultima cobrada', s2[1].situacao === 'cobrar' && s2[1].base_valor === 200 && s2[1].valor === 67.05, JSON.stringify(s2));
check('base anda na cobrada', s2[0].base_valor === 105 && s2[0].valor === 67.05, JSON.stringify(s2[0]));
await erro('reabrir nao-ultimo', `select leitura.reabrir_ciclo($1,$2,$3)`, [T, c1, P], 'ultimo ciclo');

// R2 consumo alto: historico 100->105 (jan) ->108 (fev). Media ~0,16 m3/dia
const c3 = await abrir(x.co, '2026-03');
await erro('R2 consumo alto', `select leitura.registrar_leitura($1,$2,$3,null,140,'f',null,false,$4)`, [T, c3, x.u['1'].med, P], 'CONSUMO_ALTO');
await lancar(c3, x.u['1'].med, 140, true);
check('R2 conferido grava', (await v(`select consumo_conferido from leitura.leituras where ciclo_id=$1 and medidor_id=$2`, [c3, x.u['1'].med])) === true);

// saida com leitura em ciclo aberto = recusa
await erro('saida com ciclo aberto', `select leitura.registrar_saida($1,$2,'2026-03-20',141,'libergas','f',null,false,$3)`, [T, x.u['1'].id, P], 'ciclo aberto');
await fechar(c3, true);

// troca de medidor na unidade 3: base 300 (nunca cobrou). Antigo sai em 305, novo entra em 0
await q(`select leitura.instalar_medidor($1,$2,null,'2026-03-25',0,305,$3)`, [T, x.u['3'].id, P]);
const novoMed3 = await v(`select id from leitura.medidores where unidade_id=$1 and retirado_em is null`, [x.u['3'].id]);
// saida na unidade 3: 2 m3 no novo = 7 m3 no total desde 300 = 156,45; cobra mesmo se pouco
const cbS = await v(`select leitura.registrar_saida($1,$2,'2026-04-02',2,'sindico',null,null,false,$3)`, [T, x.u['3'].id, P]);
const s3 = (await q(`select consumo::float, valor::float, situacao, ciclo_id from leitura.cobrancas where id=$1`, [cbS]))[0];
check('troca + saida soma medidores', s3.consumo === 7 && s3.valor === 156.45 && s3.situacao === 'cobrar' && s3.ciclo_id === null, JSON.stringify(s3));
// saida abaixo do minimo na unidade 2 (base 203)
const cbS2 = await v(`select leitura.registrar_saida($1,$2,'2026-04-02',203.5,'libergas','f',null,false,$3)`, [T, x.u['2'].id, P]);
check('saida abaixo do minimo cobra', Number(await v(`select valor from leitura.cobrancas where id=$1`, [cbS2])) === 11.18);
await erro('reabrir depois de saida', `select leitura.reabrir_ciclo($1,$2,$3)`, [T, c3, P], 'saida de morador');
// proximo ciclo parte da saida
const c4 = await abrir(x.co, '2026-04');
await lancar(c4, x.u['2'].med, 207);
await lancar(c4, novoMed3, 5, false, 'f', '2026-04-10');
await erro('medidor retirado no ciclo', `select leitura.registrar_leitura($1,$2,$3,null,306,'f',null,false,$4)`, [T, c4, x.u['3'].med, P], 'atual');
await fechar(c4, true);
const s4 = await q(`select u.identificacao ap, base_valor::float, consumo::float from leitura.cobrancas c join leitura.unidades u on u.id=c.unidade_id where ciclo_id=$1 order by 1`, [c4]);
check('ciclo parte da saida', JSON.stringify(s4) === JSON.stringify([{ ap: '2', base_valor: 203.5, consumo: 3.5 }, { ap: '3', base_valor: 2, consumo: 3 }]), JSON.stringify(s4));

// minimo pela configuracao; chamada antiga (sem o parametro) mantem
await q(`select leitura.salvar_condominio(p_tenant=>$1, p_cliente=>(select cliente_id from leitura.condominios where id=$2), p_pacote=>'transicao_morador', p_base_rateio=>'preco_m3', p_quem_le=>'libergas', p_dia_leitura=>10::smallint, p_dia_vencimento=>15::smallint, p_sindico_nome=>null, p_sindico_telefone=>null, p_emails=>'{}', p_observacoes=>null, p_ativo=>true, p_por=>$3, p_minimo_cobranca=>20)`, [T, x.co, P]);
await q(SALVAR.replace('$3', "'libergas'").replace('$4', '$3'), [T, await v(`select cliente_id from leitura.condominios where id=$1`, [x.co]), P]);
check('chamada antiga mantem minimo', Number(await v(`select minimo_cobranca from leitura.condominios where id=$1`, [x.co])) === 20);
await erro('minimo invalido', SALVAR.replace("p_por=>$4", "p_por=>$4, p_minimo_cobranca=>-1"), [T, await v(`select cliente_id from leitura.condominios where id=$1`, [x.co]), 'libergas', P], 'Minimo');
// sindico sem foto
await q(SALVAR, [T, await v(`select cliente_id from leitura.condominios where id=$1`, [x.co]), 'sindico', P]);
const c5 = await abrir(x.co, '2026-05');
await lancar(c5, x.u['2'].med, 209, false, null);
check('sindico sem foto', true);
// seguranca
const priv = await q(`select has_table_privilege('anon','leitura.leituras','select') a, has_table_privilege('authenticated','leitura.cobrancas','select') b, has_function_privilege('anon','leitura.fechar_ciclo(uuid,uuid,boolean,uuid)','execute') c, has_function_privilege('service_role','leitura.fechar_ciclo(uuid,uuid,boolean,uuid)','execute') d`);
check('grants', !priv[0].a && !priv[0].b && !priv[0].c && priv[0].d, JSON.stringify(priv[0]));

// ===== C. AJUSTES DA VALIDACAO DE 29/10 (20261029170000) =====
const y = await condominio('AJUSTES', 'libergas', { 'A': 127.478, 'B': 163.98, 'C': 10 });
// saida em 29/10 e depois um ciclo com data 20/10 -> recusa (era o erro da La Citta)
await q(`select leitura.registrar_saida($1,$2,'2026-10-29',164.98,'libergas','f',null,false,$3)`, [T, y.u['B'].id, P]);
const cy = await v(`select leitura.abrir_ciclo($1,$2,'2026-09-01','2026-10-20',$3)`, [T, y.co, P]);
await erro('data antes da ultima cobrada', `select leitura.registrar_leitura($1,$2,$3,null,165,'f',null,false,$4)`, [T, cy, y.u['B'].med, P], 'ultima leitura cobrada');
// sem historico: 136000 em vez de 136,000 -> pede conferir
await erro('sem historico > 30 m3', `select leitura.registrar_leitura($1,$2,$3,null,136000,'f',null,false,$4)`, [T, cy, y.u['A'].med, P], 'sem historico');
await lancar(cy, y.u['A'].med, 136);   // 8,5 m3: passa
// leitura invalida sem foto: a mensagem e da leitura, nao da foto
await erro('mensagem da leitura antes da foto', `select leitura.registrar_leitura($1,$2,$3,null,1,null,null,false,$4)`, [T, cy, y.u['C'].med, P], 'menor que a anterior');
// correcao sem foto nova mantem a foto salva
await q(`select leitura.registrar_leitura($1,$2,$3,null,136.5,null,null,false,$4)`, [T, cy, y.u['A'].med, P]);
check('correcao mantem a foto', (await v(`select foto_path from leitura.leituras where ciclo_id=$1 and medidor_id=$2`, [cy, y.u['A'].med])) === 'f/x.jpg');
// excluir ciclo: so aberto e vazio
await erro('excluir ciclo com leitura', `select leitura.excluir_ciclo($1,$2,$3)`, [T, cy, P], 'Ciclo com leituras');
await q(`select leitura.remover_leitura($1,(select id from leitura.leituras where ciclo_id=$2),$3)`, [T, cy, P]);
await q(`select leitura.excluir_ciclo($1,$2,$3)`, [T, cy, P]);
check('excluir ciclo vazio', Number(await v(`select count(*) from leitura.ciclos where id=$1`, [cy])) === 0);
await erro('excluir ciclo fechado', `select leitura.excluir_ciclo($1,$2,$3)`, [T, c1, P], 'fechado');

// ===== D. CONSUMO EM ABERTO E ORIGEM PLANILHA (20261029180000) =====
const w = await condominio('EM ABERTO', 'libergas', { 'L11': 22.82, 'L12': 42.267 });
// leitura historica sem foto: aceita so com origem 'planilha'
const cw = await abrir(w.co, '2026-03');
await erro('sem foto e origem app', `insert into leitura.leituras (tenant_id, medidor_id, ciclo_id, tipo, data, valor, quem_leu, registrado_por) values ($1,$2,$3,'mensal','2026-03-10',23.081,'libergas',$4)`, [T, w.u['L11'].med, cw, P], 'leituras_foto_check');
const lw = await v(`insert into leitura.leituras (tenant_id, medidor_id, ciclo_id, tipo, data, valor, quem_leu, registrado_por, origem) values ($1,$2,$3,'mensal','2026-03-10',23.081,'libergas',$4,'planilha') returning id`, [T, w.u['L11'].med, cw, P]);
await q(`update leitura.ciclos set status='fechado', minimo_cobranca=65, fechado_por=$2, fechado_em=now() where id=$1`, [cw, P]);
// marco do L11 ficou para tras: 0,261 m3 em aberto
await q(`insert into leitura.cobrancas (tenant_id, unidade_id, ciclo_id, leitura_id, base_medidor_id, base_valor, consumo, preco_m3, valor, situacao, consumo_em_aberto, criado_por)
         values ($1,$2,$3,$4,$5,22.82,0.261,22.35,5.83,'acumula',0.261,$6)`, [T, w.u['L11'].id, cw, lw, w.u['L11'].med, P]);
// planilha "andou" a base: uma cobranca de abril partindo de 23,081 (simula o que a planilha fez)
const cw2 = await abrir(w.co, '2026-04');
const lw2 = await v(`insert into leitura.leituras (tenant_id, medidor_id, ciclo_id, tipo, data, valor, quem_leu, registrado_por, origem) values ($1,$2,$3,'mensal','2026-04-10',27,'libergas',$4,'planilha') returning id`, [T, w.u['L11'].med, cw2, P]);
await q(`insert into leitura.cobrancas (tenant_id, unidade_id, ciclo_id, leitura_id, base_medidor_id, base_valor, consumo, preco_m3, valor, situacao, criado_por)
         values ($1,$2,$3,$4,$5,23.081,3.919,22.35,87.59,'cobrar',$6)`, [T, w.u['L11'].id, cw2, lw2, w.u['L11'].med, P]);
await q(`update leitura.ciclos set status='fechado', minimo_cobranca=65, fechado_por=$2, fechado_em=now() where id=$1`, [cw2, P]);
// novembro: 27 -> 30 = 3 m3 + 0,261 em aberto
const cn = await abrir(w.co, '2026-11');
await lancar(cn, w.u['L11'].med, 30);
const pv = (await q(`select consumo::float, em_aberto::float, valor::float from leitura.previa_ciclo($1,$2) where identificacao='L11'`, [T, cn]))[0];
check('previa soma o em aberto', pv.consumo === 3.261 && pv.em_aberto === 0.261 && pv.valor === 72.88, JSON.stringify(pv));
await fechar(cn, true);
const quit = await v(`select quitada_por from leitura.cobrancas where consumo_em_aberto is not null and unidade_id=$1`, [w.u['L11'].id]);
check('em aberto quitado pela cobranca de novembro', !!quit && quit === await v(`select id from leitura.cobrancas where ciclo_id=$1 and unidade_id=$2`, [cn, w.u['L11'].id]));
await q(`select leitura.reabrir_ciclo($1,$2,$3)`, [T, cn, P]);
check('reabrir devolve o em aberto', (await v(`select leitura._em_aberto($1)`, [w.u['L11'].id])) == 0.261);
await erro('em aberto so em acumula', `insert into leitura.cobrancas (tenant_id, unidade_id, leitura_id, base_medidor_id, base_valor, consumo, preco_m3, valor, situacao, consumo_em_aberto, criado_por) values ($1,$2,$3,$4,0,1,1,1,'cobrar',1,$5)`, [T, w.u['L12'].id, lw2, w.u['L12'].med, P], 'cobrancas_em_aberto_check');

// ===== E. FATURAMENTO (20261030120000) =====
const cobN = await v(`select id from leitura.cobrancas where ciclo_id=$1 and situacao='cobrar' limit 1`, [c2]);
await erro('documento sem numero', `select leitura.faturar_cobranca($1,$2,'boleto','  ',$3)`, [T, cobN, P], 'Numero do documento');
await erro('tipo invalido', `select leitura.faturar_cobranca($1,$2,'pix','1',$3)`, [T, cobN, P], 'Tipo de documento');
await q(`select leitura.faturar_cobranca($1,$2,'boleto','000123',$3)`, [T, cobN, P]);
check('documento lancado', (await v(`select documento_numero from leitura.cobrancas where id=$1`, [cobN])) === '000123');
const acuN = await v(`select id from leitura.cobrancas where situacao='acumula' limit 1`);
await erro('acumula nao recebe documento', `select leitura.faturar_cobranca($1,$2,'boleto','1',$3)`, [T, acuN, P], 'So cobranca a cobrar');
await erro('faturar ciclo de morador', `select leitura.faturar_ciclo($1,$2,'boleto','1',$3)`, [T, c2, P], 'cobra por morador');
// ciclo faturado nao reabre (D5): usa o ultimo ciclo fechado do condominio x
const ultX = await v(`select id from leitura.ciclos where condominio_id=$1 and status='fechado' order by referencia desc limit 1`, [x.co]);
const cobU = await v(`select id from leitura.cobrancas where ciclo_id=$1 and situacao='cobrar' limit 1`, [ultX]);
if (cobU) {
  await q(`select leitura.faturar_cobranca($1,$2,'nfe','NF 55',$3)`, [T, cobU, P]);
  await erro('ciclo faturado nao reabre', `select leitura.reabrir_ciclo($1,$2,$3)`, [T, ultX, P], 'Ciclo faturado');
  await q(`select leitura.faturar_cobranca($1,$2,null,null,$3)`, [T, cobU, P]);
  check('desfazer documento', (await v(`select documento_tipo from leitura.cobrancas where id=$1`, [cobU])) === null);
}
// condominio que paga num documento so
const cz = await condominio('CONDOMINIO PAGA', 'sindico', { 'A1': 10 });
await q(`update leitura.condominios set pacote='intermediario', minimo_cobranca=0 where id=$1`, [cz.co]);
const czc = await abrir(cz.co, '2026-01');
await lancar(czc, cz.u['A1'].med, 11, false, null);
await fechar(czc);
const czCob = await v(`select id from leitura.cobrancas where ciclo_id=$1`, [czc]);
await erro('cobranca de condominio vai no ciclo', `select leitura.faturar_cobranca($1,$2,'boleto','1',$3)`, [T, czCob, P], 'documento so');
await q(`select leitura.faturar_ciclo($1,$2,'boleto','777',$3)`, [T, czc, P]);
check('documento no ciclo', (await v(`select documento_numero from leitura.ciclos where id=$1`, [czc])) === '777');
await erro('ciclo de condominio faturado nao reabre', `select leitura.reabrir_ciclo($1,$2,$3)`, [T, czc, P], 'Ciclo faturado');

console.log(`\n${ok} verificacoes OK, ${falhas.length} falhas`);
falhas.forEach(f => console.log('  FALHA', f));
