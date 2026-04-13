-- Tabela de configuração de cálculo de comissão por período
-- Permite configurar diferentes modalidades de cálculo para cada mês/ano

CREATE TABLE IF NOT EXISTS comissao_periodos (
  id          UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  mes         INT           NOT NULL CHECK (mes BETWEEN 1 AND 12),
  ano         INT           NOT NULL CHECK (ano >= 2024),

  -- Modalidade de cálculo
  -- 'por_regra': usa as regras cadastradas na aba Regras (comportamento padrão)
  -- 'por_percentual_total': aplica X% sobre a soma dos valores das propostas do período
  modalidade  TEXT          NOT NULL DEFAULT 'por_regra'
              CHECK (modalidade IN ('por_regra', 'por_percentual_total')),

  -- Percentual global (usado quando modalidade = 'por_percentual_total')
  -- Ex: 0.6 = 0,6%
  percentual_global  DECIMAL(8,4) DEFAULT 0.6,

  -- Qual status das propostas considerar no cálculo
  -- 'aprovada': propostas com validacao_status = 'aprovada'
  -- 'pago': propostas com status = 'pago'
  filtro_status  TEXT  NOT NULL DEFAULT 'aprovada'
                 CHECK (filtro_status IN ('pago', 'aprovada')),

  -- Descrição / observação do administrador para este período
  descricao   TEXT,

  created_at  TIMESTAMPTZ  DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  DEFAULT NOW(),

  UNIQUE (mes, ano)
);

-- RLS: todos os usuários autenticados podem ler e escrever
-- (já que o front-end usa a publishable key com RLS)
ALTER TABLE comissao_periodos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados podem ler periodos"
  ON comissao_periodos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Autenticados podem inserir periodos"
  ON comissao_periodos FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Autenticados podem atualizar periodos"
  ON comissao_periodos FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Autenticados podem excluir periodos"
  ON comissao_periodos FOR DELETE
  TO authenticated
  USING (true);
