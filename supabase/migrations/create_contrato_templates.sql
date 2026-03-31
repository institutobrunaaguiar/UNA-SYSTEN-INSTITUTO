-- Adicionar serviço ao contrato
ALTER TABLE contratos ADD COLUMN IF NOT EXISTS servico_nome text;

-- Templates de contrato (PDFs reutilizáveis)
CREATE TABLE IF NOT EXISTS contrato_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  descricao text,
  storage_path text NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL
);

ALTER TABLE contrato_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users can manage contrato_templates"
  ON contrato_templates FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Criar bucket para armazenar os PDFs dos templates
INSERT INTO storage.buckets (id, name, public) VALUES ('contrato-templates', 'contrato-templates', true)
ON CONFLICT (id) DO NOTHING;

-- Política de storage
CREATE POLICY "authenticated users can manage template files"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'contrato-templates')
  WITH CHECK (bucket_id = 'contrato-templates');
