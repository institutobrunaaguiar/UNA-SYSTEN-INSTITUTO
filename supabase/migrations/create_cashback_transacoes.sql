CREATE TABLE IF NOT EXISTS cashback_transacoes (
  id serial PRIMARY KEY,
  paciente_id int NOT NULL,
  proposta_id int NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('gerado', 'utilizado')),
  valor numeric(12,2) NOT NULL CHECK (valor > 0),
  campanha_id int REFERENCES cashback_campanhas(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cashback_transacoes_paciente ON cashback_transacoes(paciente_id);
CREATE INDEX IF NOT EXISTS idx_cashback_transacoes_proposta ON cashback_transacoes(proposta_id);

ALTER TABLE cashback_transacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users can manage cashback_transacoes"
  ON cashback_transacoes FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
