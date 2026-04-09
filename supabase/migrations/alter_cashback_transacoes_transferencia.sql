-- Expandir tipos de transacao para suportar transferencias
ALTER TABLE cashback_transacoes DROP CONSTRAINT IF EXISTS cashback_transacoes_tipo_check;
ALTER TABLE cashback_transacoes ADD CONSTRAINT cashback_transacoes_tipo_check
  CHECK (tipo IN ('gerado', 'utilizado', 'transferencia_enviada', 'transferencia_recebida'));

-- Permitir proposta_id nulo (transferencias nao tem proposta vinculada)
ALTER TABLE cashback_transacoes ALTER COLUMN proposta_id DROP NOT NULL;

-- Referencia para vincular as duas pontas de uma transferencia
ALTER TABLE cashback_transacoes
  ADD COLUMN IF NOT EXISTS transferencia_ref_id int REFERENCES cashback_transacoes(id) ON DELETE SET NULL;
