-- Tabla trazabilidad_snapshot: persistencia de calculos derivados por camada.
-- Permite auditoria, edicion manual, y que reportes/planillas usen valores finales sin recalcular.

CREATE TABLE IF NOT EXISTS trazabilidad_snapshot (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  camada text NOT NULL UNIQUE,
  -- Codigos jerarquicos formateados (con año dinamico)
  codigo_pm text,                     -- ej "24.PM4"
  codigo_cl text,                     -- ej "24.PM4.CL7"
  codigo_vg_first text,               -- ej "24.PM4.CL7.Li1.VG001"
  codigo_vg_last text,                -- ej "24.PM4.CL7.Li1.VG192"
  codigo_fl_first text,               -- ej "24.PM4.CL7.Li1.VG001.SF2"
  codigo_fl_last text,                -- ej "24.PM4.CL7.Li1.VG192.SF2"
  codigo_cds_first text,              -- ej "24.PM4.CL7.Li1.SF2.CDS08"
  codigo_cds_last text,               -- ej "24.PM4.CL7.Li1.SF2.CDS22"
  codigo_alm text,                    -- ej "ALM-C7-RDWC"
  codigo_dep_first text,              -- ej "24.FIS.B01"
  codigo_dep_last text,               -- ej "24.FIS.B69"
  -- Componentes
  anio text,                          -- "24" / "25" / "26"
  pm_codigo text,                     -- "PM4"
  cl_codigo text,                     -- "CL7"
  linea text,                         -- "Li1"
  sistema text,                       -- "RDWC" / "COCO"
  sala text,                          -- "SF1" / "SF2"
  sub_grupo text,                     -- "PM4.1" / "PM8.1" / "PM9.1"
  -- Cantidades capadas (post-secado no crecen)
  yield_kg numeric(10,3),
  gramos_trim numeric(12,2),
  gramos_alm_capado numeric(12,2),
  bolsas_calculadas integer,
  cuadros_secado integer,
  plantas_madre integer,
  plantas_esqueje integer,
  plantas_vege integer,
  plantas_flora integer,
  plantas_cosechadas integer,
  -- Fechas clave
  fecha_pm_ingreso date,
  fecha_esqueje_inicio date,
  fecha_esqueje_fin date,
  fecha_vege_inicio date,
  fecha_vege_fin date,
  fecha_flora_inicio date,
  fecha_flora_fin date,
  fecha_cosecha date,
  fecha_secado_inicio date,
  fecha_secado_fin date,
  fecha_trim date,
  fecha_cuarentena date,
  fecha_frac date,
  fecha_dep date,
  -- Estado
  estado text NOT NULL DEFAULT 'en_proceso',  -- 'en_proceso' / 'completada'
  stage_actual text,                          -- 'planta_madre' / 'esquejado' / 'vegetativa' / ... / 'deposito'
  total_dias_efectivos integer,               -- suma de dias de stages done+active
  -- Auditoria
  fuente jsonb DEFAULT '{}'::jsonb,           -- {fechas_estimadas: [...], notas_correccion: [...]}
  notas text,
  editado_por uuid REFERENCES auth.users(id),
  ultima_recalculacion timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS trazabilidad_snapshot_camada_idx ON trazabilidad_snapshot (camada);
CREATE INDEX IF NOT EXISTS trazabilidad_snapshot_estado_idx ON trazabilidad_snapshot (estado);
CREATE INDEX IF NOT EXISTS trazabilidad_snapshot_anio_idx ON trazabilidad_snapshot (anio);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION trazabilidad_snapshot_set_updated_at() RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_trazabilidad_snapshot_updated_at ON trazabilidad_snapshot;
CREATE TRIGGER trg_trazabilidad_snapshot_updated_at
  BEFORE UPDATE ON trazabilidad_snapshot
  FOR EACH ROW EXECUTE FUNCTION trazabilidad_snapshot_set_updated_at();

-- RLS
ALTER TABLE trazabilidad_snapshot ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "snapshot_read_authenticated" ON trazabilidad_snapshot;
CREATE POLICY "snapshot_read_authenticated" ON trazabilidad_snapshot
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "snapshot_admin_write" ON trazabilidad_snapshot;
CREATE POLICY "snapshot_admin_write" ON trazabilidad_snapshot
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE trazabilidad_snapshot IS
  'Persistencia de calculos derivados de la cadena seed-to-sale por camada. '
  'Se popula desde el frontend (PaginaTrazabilidad) o via funcion SQL recalcular_snapshot_camada.';
