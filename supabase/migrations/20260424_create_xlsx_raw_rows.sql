-- Tabla de captura cruda 1:1 de cada fila del xlsx CM-RE-1010 v2.
-- Garantiza que NADA se pierde en el ingest, incluso filas de hojas no mapeadas
-- explicitamente o con columnas ambiguas (ej. CM-RE-0502 con 217 columnas).
-- Las tablas operativas registros_* son la version estructurada para la app;
-- esta tabla es la fuente de verdad cruda + auditoria del import.

BEGIN;

CREATE TABLE IF NOT EXISTS public.xlsx_raw_rows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_file text NOT NULL,
  sheet text NOT NULL,
  codigo_cumcs varchar(16),
  fila_origen integer NOT NULL,
  raw_data jsonb NOT NULL,
  fingerprint text NOT NULL,
  ingested_at timestamptz NOT NULL DEFAULT now(),
  ingested_by uuid REFERENCES auth.users(id),
  organizacion_id uuid,
  notes text
);

CREATE UNIQUE INDEX IF NOT EXISTS ix_xlsx_raw_rows_fingerprint
  ON public.xlsx_raw_rows(fingerprint);

CREATE INDEX IF NOT EXISTS ix_xlsx_raw_rows_codigo_cumcs
  ON public.xlsx_raw_rows(codigo_cumcs);

CREATE INDEX IF NOT EXISTS ix_xlsx_raw_rows_sheet
  ON public.xlsx_raw_rows(sheet);

-- RLS: lectura para authenticated, insert/update solo service_role.
ALTER TABLE public.xlsx_raw_rows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS xlsx_raw_rows_select ON public.xlsx_raw_rows;
CREATE POLICY xlsx_raw_rows_select ON public.xlsx_raw_rows
  FOR SELECT TO authenticated USING (true);

-- Sin policy de INSERT/UPDATE -> solo service_role pasa.

COMMENT ON TABLE public.xlsx_raw_rows IS
  'Captura cruda fila-por-fila del xlsx CM-RE-1010 v2 (Storage canntrace-archivos/gamp5/). '
  'Garantiza idempotencia y trazabilidad del import. Las tablas registros_* son la version '
  'estructurada para la app; esta tabla es la fuente cruda de auditoria.';

COMMIT;
