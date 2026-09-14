-- Habilitar Supabase Realtime (Postgres Changes) en las tablas de registros CUMCS
-- + operaciones + lotes. Asi cualquier INSERT/UPDATE/DELETE emite evento WebSocket
-- a los clientes suscritos y la UI se actualiza sin F5.
--
-- Aplicada via mcp__supabase__apply_migration el 2026-04-19.

ALTER PUBLICATION supabase_realtime ADD TABLE public.operaciones;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lotes;

-- Registros CUMCS existentes
ALTER PUBLICATION supabase_realtime ADD TABLE public.registros_agua;
ALTER PUBLICATION supabase_realtime ADD TABLE public.registros_fitosanitarios;
ALTER PUBLICATION supabase_realtime ADD TABLE public.registros_mantenimiento;
ALTER PUBLICATION supabase_realtime ADD TABLE public.registros_personal;
ALTER PUBLICATION supabase_realtime ADD TABLE public.registros_calidad;
ALTER PUBLICATION supabase_realtime ADD TABLE public.registros_documentales;

-- Registros CUMCS nuevos (creados en 20260419_create_cumcs_tables_g01_g02_g03_g06)
ALTER PUBLICATION supabase_realtime ADD TABLE public.registros_condiciones_ambientales;
ALTER PUBLICATION supabase_realtime ADD TABLE public.registros_trazabilidad;
ALTER PUBLICATION supabase_realtime ADD TABLE public.registros_fertilizantes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.registros_cosecha;
