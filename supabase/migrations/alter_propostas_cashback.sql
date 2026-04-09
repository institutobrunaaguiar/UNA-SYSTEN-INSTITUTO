ALTER TABLE propostas
  ADD COLUMN IF NOT EXISTS cashback_campanha_id int REFERENCES cashback_campanhas(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cashback_gerado numeric(12,2),
  ADD COLUMN IF NOT EXISTS cashback_utilizado numeric(12,2);
