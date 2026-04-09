-- Rastrear qual profissional gerou cada transacao de cashback
ALTER TABLE cashback_transacoes
  ADD COLUMN IF NOT EXISTS profissional_origem_id int REFERENCES profissionais(id) ON DELETE SET NULL;

-- Flag para profissionais cujo cashback gerado nao pode ser reutilizado com eles mesmos
-- Ex: Dra. Bruna = cashback_restrito = true (cashback dela nao volta para ela)
ALTER TABLE profissionais
  ADD COLUMN IF NOT EXISTS cashback_restrito boolean NOT NULL DEFAULT false;
