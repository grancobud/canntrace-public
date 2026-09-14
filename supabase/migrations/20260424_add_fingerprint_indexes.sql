-- Idempotencia para el ingest masivo de CM-RE-1010 v2 desde Storage.
-- Cada fila del xlsx genera un fingerprint sha256 (codigo|fila|fecha|responsable...)
-- guardado en datos_extra->>'fingerprint'. El indice unico parcial impide duplicados
-- y permite UPSERT con ON CONFLICT DO NOTHING.

BEGIN;

-- resultados_laboratorio NO tenia datos_extra (es legacy, anterior al cleanup del 19/04).
ALTER TABLE public.resultados_laboratorio
  ADD COLUMN IF NOT EXISTS datos_extra jsonb DEFAULT '{}'::jsonb;

-- Indices unicos parciales sobre fingerprint en cada tabla destino del ingest
CREATE UNIQUE INDEX IF NOT EXISTS ix_registros_cosecha_fingerprint
  ON public.registros_cosecha((datos_extra->>'fingerprint'))
  WHERE datos_extra ? 'fingerprint';

CREATE UNIQUE INDEX IF NOT EXISTS ix_registros_mantenimiento_fingerprint
  ON public.registros_mantenimiento((datos_extra->>'fingerprint'))
  WHERE datos_extra ? 'fingerprint';

CREATE UNIQUE INDEX IF NOT EXISTS ix_registros_personal_fingerprint
  ON public.registros_personal((datos_extra->>'fingerprint'))
  WHERE datos_extra ? 'fingerprint';

CREATE UNIQUE INDEX IF NOT EXISTS ix_registros_calidad_fingerprint
  ON public.registros_calidad((datos_extra->>'fingerprint'))
  WHERE datos_extra ? 'fingerprint';

CREATE UNIQUE INDEX IF NOT EXISTS ix_registros_documentales_fingerprint
  ON public.registros_documentales((datos_extra->>'fingerprint'))
  WHERE datos_extra ? 'fingerprint';

CREATE UNIQUE INDEX IF NOT EXISTS ix_registros_trazabilidad_fingerprint
  ON public.registros_trazabilidad((datos_extra->>'fingerprint'))
  WHERE datos_extra ? 'fingerprint';

CREATE UNIQUE INDEX IF NOT EXISTS ix_registros_condiciones_ambientales_fingerprint
  ON public.registros_condiciones_ambientales((datos_extra->>'fingerprint'))
  WHERE datos_extra ? 'fingerprint';

CREATE UNIQUE INDEX IF NOT EXISTS ix_registros_fertilizantes_fingerprint
  ON public.registros_fertilizantes((datos_extra->>'fingerprint'))
  WHERE datos_extra ? 'fingerprint';

CREATE UNIQUE INDEX IF NOT EXISTS ix_registros_fitosanitarios_fingerprint
  ON public.registros_fitosanitarios((datos_extra->>'fingerprint'))
  WHERE datos_extra ? 'fingerprint';

CREATE UNIQUE INDEX IF NOT EXISTS ix_registros_agua_fingerprint
  ON public.registros_agua((datos_extra->>'fingerprint'))
  WHERE datos_extra ? 'fingerprint';

CREATE UNIQUE INDEX IF NOT EXISTS ix_resultados_laboratorio_fingerprint
  ON public.resultados_laboratorio((datos_extra->>'fingerprint'))
  WHERE datos_extra ? 'fingerprint';

COMMIT;
