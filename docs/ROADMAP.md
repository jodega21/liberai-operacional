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
- 🔜 Demonstrativo por morador/condominio (PDF ou e-mail para os enderecos do cadastro do condominio).
- 🔜 Lembretes de troca do P45 pelo consumo (bateria da central x consumo medido).
- 🔜 Base de rateio 'proporcional' (hoje so preco por m3 e calculado).
- 🔜 Leitura dos e-mails dos sindicos (Gmail) deixando os numeros prontos para conferir.
- 🔜 Fotos de 2026 do Monte Castelo (80, pasta RELOGIOS 26) anexadas ao historico (opcional).
- Depois da leitura: vendas por pedido (Camada 2 do acerto completo), estoque por local.
