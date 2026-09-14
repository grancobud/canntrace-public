-- Agregar datos_extra jsonb a las 6 tablas registros_* pre-existentes.
-- Las 4 nuevas (G01/G02/G03/G06) ya la tienen desde creacion.
-- Uniforma schema para que el bulk migration + agent funcionen en todas.
-- Aplicada via mcp 2026-04-19.

ALTER TABLE public.registros_agua ADD COLUMN IF NOT EXISTS datos_extra jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.registros_fitosanitarios ADD COLUMN IF NOT EXISTS datos_extra jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.registros_mantenimiento ADD COLUMN IF NOT EXISTS datos_extra jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.registros_personal ADD COLUMN IF NOT EXISTS datos_extra jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.registros_calidad ADD COLUMN IF NOT EXISTS datos_extra jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.registros_documentales ADD COLUMN IF NOT EXISTS datos_extra jsonb DEFAULT '{}'::jsonb;

