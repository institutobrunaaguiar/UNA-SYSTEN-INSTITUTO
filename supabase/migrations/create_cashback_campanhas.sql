CREATE TABLE IF NOT EXISTS cashback_campanhas (
  id serial PRIMARY KEY,
  nome text NOT NULL,
  percentual numeric(5,2) NOT NULL CHECK (percentual > 0 AND percentual <= 100),
  data_inicio date NOT NULL,
  data_fim date NOT NULL CHECK (data_fim >= data_inicio),
  ativa boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cashback_campanhas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users can manage cashback_campanhas"
  ON cashback_campanhas FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
