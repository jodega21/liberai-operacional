# Roadmap — LiberAi Operacional

Ultima atualizacao: 2026-10-30 (LEI3)

## LEI2 — Leitura de medidores — CONCLUIDA (29-30/10)

- ✅ Base do app (login, RBAC, apontamentos, menu lateral direito, cores da marca) - f6afabe
- ✅ Lancamento mensal com foto, ciclo, minimo, saida de morador, checagens - bf82331/2a8e535
- ✅ Historico 2026 das planilhas (127 ciclos) e consumo em aberto - 8ba8b24
- ✅ Faturamento com documento por cobranca/ciclo e impressao - bf82331/2a8e535
- ✅ Push e projeto na Vercel (Daniel, 30/10). 🔜 Conferir o deploy (variaveis de ambiente) e o login em producao.

## Leitura — proximos passos

- ✅ Consultas sem o limite de 1.000 linhas da API (LEI3, 30/10): leituras, cobrancas, ciclos e medidores paginados.
- ✅ Trava do medidor no cadastros (LEI3, 30/10; migration 20261030130000 do liberai-cadastros aplicada e registrada 30/10, teste no bloco F de supabase/testes).
- 🔜 La Citta out/2026: a planilha nao tem a leitura; lancar pelo app.
- ✅ Demonstrativo por morador e resumo do condominio, impressos (LEI4, 30/10): ciclo fechado > Demonstrativos / Resumo do condominio / Demonstrativo por unidade.
- 🔜 Envio do demonstrativo (Daniel, 30/10): botao "Enviar" no ciclo depois de lancar os boletos; canal de correspondencia por pessoa (e-mail, WhatsApp, carta, outro) no cadastro; WhatsApp e obrigatorio ("o mais promissor"), numero (54) 3227-2263 ja e WhatsApp Business. Futuro: envio automatico quando conferido e com boleto lancado.
- 🔜 Comunicado no sistema (caixa "Incluir comunicado": comunicado + demonstrativo na mesma A4), se aprovado pelos envolvidos (modelo entregue 30/10).
- Futuro (Daniel, 30/10): NF e boleto saem do BS (e-mail nfe@libergas.com.br; NF numa pasta do servidor, boleto numa pasta do PC que emitiu). Por ora o demonstrativo vai separado; "tudo junto" quando a emissao de NF estiver no LiberAI.
- Futuro (Daniel, 30/10): pedidos integrados com atendente IA no WhatsApp e no telefone.
- 🔜 Dado: 13 moradores com e-mail generico da Libergas (libergas@, adm@, adm1@) - Daniel confirma se sao "sem e-mail". Monte Castelo 402 set/2026 cobrado a R$ 38,18/m3 na planilha (os demais 22,35) - conferir.
- 🔜 Lembretes de troca do P45 pelo consumo (bateria da central x consumo medido).
- 🔜 Base de rateio 'proporcional' (hoje so preco por m3 e calculado).
- 🔜 Leitura dos e-mails dos sindicos (Gmail) deixando os numeros prontos para conferir.
- 🔜 Fotos de 2026 do Monte Castelo (80, pasta RELOGIOS 26) anexadas ao historico (opcional).
- Depois da leitura: vendas por pedido (Camada 2 do acerto completo), estoque por local.
