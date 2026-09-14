-- Trigger automático que invoca recalcular_snapshot_camada() cuando cambia data
-- relevante en `lotes` o `registros_trazabilidad`.
--
-- Se ejecuta AFTER (no impacta la transacción original) y SECURITY DEFINER
-- (corre con permisos del owner para escribir trazabilidad_snapshot incluso desde RLS).
-- Si la fila no tiene `camada` derivable, no hace nada (evita errores en data legacy).

CREATE OR REPLACE FUNCTION trg_recalcular_snapshot_lotes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_camada text;
BEGIN
  -- Camada viene en datos_extra->>'camada' tanto en INSERT/UPDATE como en DELETE (OLD)
  v_camada := COALESCE(
    NEW.datos_extra->>'camada',
    OLD.datos_extra->>'camada'
  );
  IF v_camada IS NOT NULL AND v_camada != '' THEN
    BEGIN
      PERFORM recalcular_snapshot_camada(v_camada);
    EXCEPTION WHEN OTHERS THEN
      -- No bloquear la transacción original si el recálculo falla; loguear NOTICE
      RAISE NOTICE 'recalcular_snapshot_camada falló para %: %', v_camada, SQLERRM;
    END;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION trg_recalcular_snapshot_registros()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_camada text;
  v_clon text;
BEGIN
  -- registros_trazabilidad tiene `clonacion_origen` ('CL7') y `camada` ('7' o '07')
  v_clon := COALESCE(NEW.clonacion_origen, OLD.clonacion_origen);
  IF v_clon IS NOT NULL AND v_clon LIKE 'CL%' THEN
    v_camada := REPLACE(v_clon, 'CL', 'C');
  ELSE
    v_camada := COALESCE(NEW.camada, OLD.camada);
    IF v_camada IS NOT NULL AND v_camada NOT LIKE 'C%' THEN
      v_camada := 'C' || v_camada;
    END IF;
  END IF;

  IF v_camada IS NOT NULL AND v_camada != '' AND v_camada != 'C' THEN
    BEGIN
      PERFORM recalcular_snapshot_camada(v_camada);
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'recalcular_snapshot_camada falló para %: %', v_camada, SQLERRM;
    END;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Triggers en `lotes`: AFTER INSERT/UPDATE/DELETE FOR EACH ROW
DROP TRIGGER IF EXISTS trg_lotes_recalc_snapshot ON lotes;
CREATE TRIGGER trg_lotes_recalc_snapshot
  AFTER INSERT OR UPDATE OR DELETE ON lotes
  FOR EACH ROW
  EXECUTE FUNCTION trg_recalcular_snapshot_lotes();

-- Triggers en `registros_trazabilidad`: AFTER INSERT/UPDATE/DELETE FOR EACH ROW
DROP TRIGGER IF EXISTS trg_registros_recalc_snapshot ON registros_trazabilidad;
CREATE TRIGGER trg_registros_recalc_snapshot
  AFTER INSERT OR UPDATE OR DELETE ON registros_trazabilidad
  FOR EACH ROW
  EXECUTE FUNCTION trg_recalcular_snapshot_registros();

GRANT EXECUTE ON FUNCTION trg_recalcular_snapshot_lotes() TO authenticated;
GRANT EXECUTE ON FUNCTION trg_recalcular_snapshot_registros() TO authenticated;

COMMENT ON FUNCTION trg_recalcular_snapshot_lotes IS
  'Trigger function: recalcula trazabilidad_snapshot al cambiar lotes';
COMMENT ON FUNCTION trg_recalcular_snapshot_registros IS
  'Trigger function: recalcula trazabilidad_snapshot al cambiar registros_trazabilidad';
