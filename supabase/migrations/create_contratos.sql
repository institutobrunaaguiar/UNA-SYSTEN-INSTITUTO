-- Tabela de contratos vinculados à Assinafy
CREATE TABLE IF NOT EXISTS contratos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  paciente_id int NOT NULL,
  proposta_id uuid,
  titulo text NOT NULL,
  assinafy_document_id text,
  assinafy_signer_id text,
  status text NOT NULL DEFAULT 'rascunho'
    CHECK (status IN ('rascunho','pendente','assinado','recusado','expirado','cancelado')),
  url_assinatura text,
  url_certificado text,
  nome_paciente text,
  email_paciente text,
  mensagem text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  signed_at timestamptz,
  created_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_contratos_paciente_id ON contratos(paciente_id);
CREATE INDEX IF NOT EXISTS idx_contratos_status ON contratos(status);
CREATE INDEX IF NOT EXISTS idx_contratos_assinafy_doc ON contratos(assinafy_document_id);

ALTER TABLE contratos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users can manage contratos"
  ON contratos FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
