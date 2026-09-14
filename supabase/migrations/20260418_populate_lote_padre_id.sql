-- Popula lote_padre_id desde datos_extra.viene_de
-- (viene_de es el codigo_lote del padre guardado como texto en jsonb)
--
-- Seguridad: solo actualiza lotes donde lote_padre_id ES NULL (no sobreescribe relaciones ya establecidas).
-- Tambien registra conteo al final para auditoria.

BEGIN;

-- Primera pasada: match exacto por codigo_lote
UPDATE lotes hijo
SET lote_padre_id = padre.id
FROM lotes padre
WHERE hijo.lote_padre_id IS NULL
  AND hijo.datos_extra ? 'viene_de'
  AND hijo.datos_extra->>'viene_de' IS NOT NULL
  AND hijo.datos_extra->>'viene_de' != ''
  AND padre.codigo_lote = hijo.datos_extra->>'viene_de'
  AND padre.id != hijo.id  -- evitar self-reference;

-- Segunda pasada: match parcial para codigos que incluyen el codigo padre como sufijo
-- (ej: "desde-CL7" → "CL7")
UPDATE lotes hijo
SET lote_padre_id = padre.id
FROM lotes padre
WHERE hijo.lote_padre_id IS NULL
  AND hijo.datos_extra ? 'viene_de'
  AND hijo.datos_extra->>'viene_de' IS NOT NULL
  AND hijo.datos_extra->>'viene_de' != ''
  AND padre.codigo_lote = regexp_replace(hijo.datos_extra->>'viene_de', '^(desde-|from-|padre-)', '', 'i')
  AND padre.id != hijo.id;

-- Reporte final
DO $$
DECLARE
  total_lotes INTEGER;
  con_padre INTEGER;
  sin_padre_con_hint INTEGER;
  sin_hint INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_lotes FROM lotes WHERE eliminado = false;
  SELECT COUNT(*) INTO con_padre FROM lotes WHERE eliminado = false AND lote_padre_id IS NOT NULL;
  SELECT COUNT(*) INTO sin_padre_con_hint FROM lotes
    WHERE eliminado = false AND lote_padre_id IS NULL
      AND datos_extra ? 'viene_de' AND datos_extra->>'viene_de' != '';
  SELECT COUNT(*) INTO sin_hint FROM lotes
    WHERE eliminado = false AND lote_padre_id IS NULL
      AND (NOT datos_extra ? 'viene_de' OR datos_extra->>'viene_de' IS NULL OR datos_extra->>'viene_de' = '');

  RAISE NOTICE '========= Populate lote_padre_id =========';
  RAISE NOTICE 'Total lotes activos: %', total_lotes;
  RAISE NOTICE 'Con padre asignado:   %', con_padre;
  RAISE NOTICE 'Sin padre, con hint (no matchea): %', sin_padre_con_hint;
  RAISE NOTICE 'Sin padre, sin hint (raiz o datos faltan): %', sin_hint;
END $$;

COMMIT;

-- Para rollback manual:
-- UPDATE lotes SET lote_padre_id = NULL WHERE lote_padre_id IS NOT NULL;
