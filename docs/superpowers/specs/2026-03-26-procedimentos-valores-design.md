# Procedimentos com Valores por Profissional — Design Spec

**Data:** 2026-03-26
**Status:** Aprovado

## Contexto

A tabela `procedimentos` no Supabase sincroniza com a API Clinica nas Nuvens e nao tem valores. Cada profissional do Instituto Bruna Aguiar tem sua propria tabela de precos. Precisamos de uma tabela nova `procedimentos_clinica` com valores vinculados a profissionais, e atualizar o modulo Propostas para usar essa tabela.

## Decisoes

| Decisao | Escolha |
|---|---|
| Onde guardar | Nova tabela `procedimentos_clinica` (nao altera `procedimentos` da API) |
| Vinculo profissional | Por `profissional_id` (FK para tabela `profissionais`) |
| Fonte no modulo Propostas | So `procedimentos_clinica` |
| Paloma Abreu | Cadastrar como nova profissional + duplicar procedimentos da Manu |

## Tabela Supabase: procedimentos_clinica

| Coluna | Tipo | Descricao |
|---|---|---|
| id | serial (PK) | Auto-increment |
| categoria | text | "Faciais", "Corporais", "Capilar" |
| tipo | text | "CO2 Fracionado", "HYPRO", "Toxina Botulinica", etc. |
| nome | text | Nome do procedimento |
| descricao | text | Regiao, indicacao, detalhes |
| valor | numeric | Preco em R$ |
| profissional_id | integer | FK para tabela profissionais (id) |
| relevante | boolean | Destaque — aparece primeiro |
| ativo | boolean | Default true |
| created_at | timestamptz | Default now() |

## Dados a Inserir

### Bruna (profissional_id = 29447) — 30 procedimentos

| Categoria | Tipo | Nome | Descricao | Valor | Relevante |
|---|---|---|---|---|---|
| Faciais | Avaliacao | Avaliacao Facial | Obrigatoria para novos pacientes ou retorno apos 1 ano | 275.00 | false |
| Faciais | Toxina Botulinica | Botox Feminino | Terco superior | 1430.00 | false |
| Faciais | Toxina Botulinica | Botox Full Face Feminino | Superior e inferior | 1650.00 | false |
| Faciais | Toxina Botulinica | Botox Full Face + Face Contour Fem. | Inclui pescoco | 1817.00 | false |
| Faciais | Toxina Botulinica | Botox Masculino | Terco superior | 1539.00 | false |
| Faciais | Toxina Botulinica | Botox Full Face Masculino | Superior e inferior | 1759.00 | false |
| Faciais | Toxina Botulinica | Botox Full Face + Face Contour Masc. | Inclui pescoco | 1936.00 | false |
| Faciais | Toxina Botulinica | Botox Pontual | Por ponto | 88.00 | false |
| Faciais | Toxina Botulinica | Botox Pescoco | Quando associado a face | 1430.00 | false |
| Faciais | Toxina Botulinica | Botox Hiperidrose | Por regiao | 2343.00 | false |
| Faciais | Toxina Botulinica | Rinotox | Nariz completo com retorno | 495.00 | false |
| Faciais | Preenchimento | Preenchimento Facial | Por ml | 1397.00 | false |
| Faciais | Preenchimento | Preenchimento ou Skinbooster Labial | Por ml | 1485.00 | false |
| Faciais | Preenchimento | Skinbooster Facial | Por ml | 1397.00 | false |
| Faciais | Preenchimento | Rinomodelacao | Incluso retorno | 1650.00 | false |
| Faciais | Preenchimento | Hialuronidase | Sessao | 770.00 | false |
| Faciais | Bioestimulador | Duo Blend | Acido Hialuronico + Hidroxiapatita de Calcio | 2860.00 | false |
| Faciais | Bioestimulador | Acido Poli-L-latico | Sculptra ou Elleva | 2970.00 | false |
| Faciais | Bioestimulador | Hidroxiapatita de Calcio | Radiesse | 2020.00 | false |
| Faciais | Bioestimulador | Radiesse com Ativos Regenerativos | | 2500.00 | false |
| Faciais | Regenerativo | Microagulhamento + PDRN / Exossomos | Com ativos regenerativos | 825.00 | false |
| Faciais | Regenerativo | Intradermoterapia com PDRN / Exossomos | Sessao | 1650.00 | false |
| Faciais | Regenerativo | Peeling Quimico | Sessao | 750.00 | false |
| Faciais | Regenerativo | Protocolo Peeling Evolution | Ciclo com kit home care | 1700.00 | false |
| Faciais | Regenerativo | Jato de Plasma | Sessao | 1000.00 | false |
| Faciais | Regenerativo | Cauterizacao de Sinais | Por regiao | 750.00 | false |
| Faciais | Fios | Combo 10 fios | | 1430.00 | false |
| Faciais | Fios | Combo 20 fios | | 2200.00 | false |
| Faciais | Fios | Fio de Sustentacao | | 473.00 | false |

### Manu / Emanuelle (profissional_id = 30217) — 52 procedimentos
### Paloma (profissional_id = novo) — mesmos 52 procedimentos da Manu

| Categoria | Tipo | Nome | Descricao | Valor | Relevante |
|---|---|---|---|---|---|
| Faciais | CO2 Fracionado | CO2 Face Completa | Rejuvenescimento e cicatrizes | 1800.00 | false |
| Faciais | CO2 Fracionado | CO2 Palpebras | Rejuvenescimento | 1200.00 | false |
| Faciais | CO2 Fracionado | CO2 Maos ou Orelhas | Rejuvenescimento | 750.00 | false |
| Faciais | LASER | BB Glow | Poros e manchas | 750.00 | false |
| Faciais | LASER | BB Glow 3 Sessoes | Uma regiao | 2000.00 | false |
| Faciais | HYPRO | HYPRO Terco Superior | | 1650.00 | true |
| Faciais | HYPRO | HYPRO Papada | | 1760.00 | true |
| Faciais | HYPRO | HYPRO Pescoco | | 1760.00 | true |
| Faciais | HYPRO | HYPRO Papada + Pescoco | | 2915.00 | true |
| Faciais | HYPRO | HYPRO Terco Medio e Inferior | | 2915.00 | true |
| Faciais | HYPRO | HYPRO Full Face | | 4488.00 | true |
| Faciais | HYPRO | HYPRO Full Face + Pescoco | | 5500.00 | true |
| Corporais | HYPRO | HYPRO Colo | | 2200.00 | false |
| Corporais | HYPRO | HYPRO Braco | | 3080.00 | false |
| Corporais | HYPRO | HYPRO Abdomen | | 3300.00 | false |
| Corporais | HYPRO | HYPRO Costas | Flancos/gordurinha das costas | 3300.00 | false |
| Corporais | HYPRO | HYPRO Prega Glutea | Bananinha | 1760.00 | false |
| Corporais | HYPRO | HYPRO Culote | | 2750.00 | false |
| Corporais | HYPRO | HYPRO Prega Axilar | Gordurinha do sutia | 1650.00 | false |
| Corporais | HYPRO | HYPRO Interno de Coxa | | 4950.00 | false |
| Corporais | HYPRO | HYPRO Virilha | | 2750.00 | false |
| Corporais | HYPRO | HYPRO Posterior de Coxa | | 5500.00 | false |
| Corporais | HYPRO | HYPRO Faixa Pequena | | 1650.00 | false |
| Corporais | LIP | LIP Sessao Individual | | 350.00 | false |
| Corporais | LIP | LIP Pacote 10 Sessoes | | 2800.00 | false |
| Corporais | CO2 Fracionado | CO2 Regiao Grande | Estrias, Cicatrizes, Flacidez | 1800.00 | false |
| Corporais | CO2 Fracionado | CO2 Regiao Media | Estrias, Cicatrizes, Flacidez | 1300.00 | false |
| Corporais | CO2 Fracionado | CO2 Maos ou Orelhas Corporal | Sessao | 750.00 | false |
| Corporais | LASER | BB Laser Manchas 3 Sessoes | Por regiao | 2000.00 | false |
| Capilar | Avaliacao | Avaliacao Capilar Detalhada | | 370.00 | false |
| Capilar | Sessao | Mesoterapia + Alta Frequencia + LED + Ozonio | | 365.00 | false |
| Capilar | Sessao | Mesoterapia Regenerativa + Alta Frequencia + LED + Ozonio | Com ativos regenerativos | 730.00 | false |
| Capilar | Sessao | Terapia de Acalmia | Alta Frequencia + LED + Ozonio | 250.00 | false |
| Corporais | Injetavel | Intradermoterapia Corporal | | 400.00 | false |
| Corporais | Injetavel | Otimizador Metabolico | | 300.00 | false |
| Corporais | Injetavel | Radiesse Corporal | | 2100.00 | false |
| Corporais | Injetavel | Radiesse + Ativos Regenerativos | | 2500.00 | false |
| Corporais | Injetavel | Sculptra / Elleva Tradicional | Frasco | 2970.00 | false |
| Corporais | Injetavel | Elleva 40ml | Frasco | 5800.00 | false |
| Corporais | Injetavel | Jato de Plasma Corporal | | 1000.00 | false |
| Corporais | Injetavel | Peeling Quimico Corporal | | 750.00 | false |
| Corporais | Injetavel | Peeling Injetavel | | 750.00 | false |
| Corporais | Injetavel | PEIM (Microvasos) | | 600.00 | false |
| Corporais | Preenchimento Corporal | 10 ml a 49 ml | Por ml | 480.00 | false |
| Corporais | Preenchimento Corporal | 50 ml a 99 ml | Por ml | 400.00 | false |
| Corporais | Preenchimento Corporal | 100 ml a mais | Por ml | 300.00 | false |
| Corporais | Botox Hiperidrose | Por regiao (com retorno) | | 2700.00 | false |
| Corporais | Endolaser | Endolaser por regiao | | 4500.00 | false |
| Corporais | Avaliacao | Avaliacao Corporal | | 250.00 | false |

### Adriana (profissional_id = 29708) — 13 procedimentos

| Categoria | Tipo | Nome | Descricao | Valor | Relevante |
|---|---|---|---|---|---|
| Faciais | Limpeza | Limpeza de Pele Profunda | | 204.00 | false |
| Faciais | Limpeza | Limpeza + Mascara Albumina | | 241.00 | false |
| Faciais | Limpeza | Limpeza + Peeling Diamante | | 252.00 | false |
| Faciais | Limpeza | Limpeza + Dermaplaning | | 266.00 | false |
| Faciais | Estetica | Revitalizacao Facial | | 292.00 | false |
| Faciais | Estetica | Hydra Gloss Lips | | 319.00 | false |
| Faciais | Estetica | Nano Lips | | 990.00 | false |
| Faciais | Design | Design de Sobrancelha | | 96.00 | false |
| Faciais | Design | Design + Laminacao + Coloracao | | 198.00 | false |
| Faciais | Design | Design + Laminacao | | 165.00 | false |
| Faciais | Design | Design + Coloracao | | 132.00 | false |
| Corporais | Drenagem | Drenagem 5 sessoes | | 750.00 | false |
| Corporais | Drenagem | Drenagem 10 sessoes | | 1400.00 | false |

## Mudancas no Modulo Propostas

### step-procedimentos.tsx

- Trocar busca de `procedimentos` para `procedimentos_clinica`
- Ao selecionar profissional -> filtrar procedimentos disponiveis daquele profissional
- Ao selecionar procedimento -> preencher valor automaticamente (campo editavel)
- Agrupar procedimentos por tipo no Select (usando SelectGroup com label)
- Procedimentos com `relevante = true` aparecem primeiro no select

### Profissional Paloma

- Inserir na tabela `profissionais`: nome = "Paloma Abreu", ativo = true, tipo_executor = "PROFISSIONAL"
- Duplicar os 52 procedimentos da Manu com profissional_id da Paloma
