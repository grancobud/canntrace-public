-- ============================================================
-- Migration: Crear tablas CUMCS faltantes G01, G02, G03, G06
-- Fecha: 2026-04-19
-- Autor: Gaston + Claude (P0.2)
-- GAMP5: tablas versionadas en migrations para IQ
-- Aplicado via mcp__supabase__apply_migration el 2026-04-19
-- ============================================================
-- Contexto: Hoy existen registros_agua (G04), registros_fitosanitarios (G05),
-- registros_mantenimiento (G07), registros_personal (G08), registros_calidad (G09),
-- registros_documentales (G10). Faltan los 4 grupos de esta migracion.
--
-- Patron: mismo que registros_agua (uuid PK, tipo, fecha, org, audit_trigger).
-- Se agrega `datos_extra jsonb` generico para via_ai, modelo_ia, prompt_original, etc.
-- Cada tabla tiene:
--   - RLS policies: lectura_X (auth.uid() IS NOT NULL), crear_X (operador/supervisor/admin)
--   - audit_trigger: genera hash-chain SHA-256 en audit_log en INSERT/UPDATE/DELETE
--   - UNIQUE (tipo, fecha, ...) para idempotencia de migracion bulk futura
--   - Indices por (camada, fecha) para queries de trazabilidad

-- ------------------------------------------------------------
-- G01 — Condiciones Ambientales (8 CUMCS: 0101-0108)
-- ------------------------------------------------------------
CREATE TABLE public.registros_condiciones_ambientales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo varchar(20) NOT NULL,             -- CM-RE-0101 .. CM-RE-0108
  fecha date NOT NULL,
  instalacion_id uuid REFERENCES public.instalaciones(id),
  lote_id uuid REFERENCES public.lotes(id),
  camada varchar(10),                     -- C7, C9, C11, C12, C15, C16
  sistema varchar(20),                    -- RDWC, COCO
  sala varchar(80),                       -- 'Floracion 1', 'Plantas Madres', etc
  etapa varchar(40),                      -- Vegetativa, Floracion, Clonacion, etc
  identificacion varchar(80),             -- ID planta madre o clonacion (25.PM4, CL11)
  variedad varchar(80),                   -- PETE HOPE default
  sustrato varchar(40),
  aeroclonador_n integer,                 -- Solo G01 CM-RE-0103
  humedad numeric,                        -- %
  temperatura numeric,                    -- °C ambiente
  temp_aa numeric,                        -- °C aire acondicionado
  temp_h2o numeric,                       -- °C agua
  ec numeric,                             -- conductividad
  ph_inicial numeric,
  ph_ml varchar(20),
  ph_corregido numeric,
  vpd_kpa numeric,
  co2_ppm numeric,
  orp numeric,                            -- Solo G01 CM-RE-0104
  ventilacion varchar(40),
  extraccion varchar(40),
  estado_cultivo varchar(40),             -- Solo G01 CM-RE-0105
  presencia_insectos varchar(10),         -- Solo G01 CM-RE-0106 (Si/No)
  presencia_hongos varchar(10),           -- Solo G01 CM-RE-0106 (Si/No)
  id_lote_texto varchar(80),              -- Para 0106/0107/0108 cuando no hay FK lote_id
  observaciones text,
  responsable varchar(80),
  datos_extra jsonb DEFAULT '{}'::jsonb,  -- via_ai, modelo_ia, prompt_original
  creado_en timestamptz NOT NULL DEFAULT now(),
  creado_por uuid NOT NULL,
  organizacion_id uuid DEFAULT '00000000-0000-0000-0000-000000000001'::uuid
);

COMMENT ON TABLE public.registros_condiciones_ambientales IS
  'CUMCS G01: Condiciones ambientales en todas las etapas (CM-RE-0101 a CM-RE-0108)';

CREATE UNIQUE INDEX uq_reg_cond_amb_tipo_fecha_camada
  ON public.registros_condiciones_ambientales (tipo, fecha, COALESCE(camada,''), COALESCE(identificacion,''));
CREATE INDEX idx_reg_cond_amb_camada_fecha ON public.registros_condiciones_ambientales (camada, fecha DESC);
CREATE INDEX idx_reg_cond_amb_tipo ON public.registros_condiciones_ambientales (tipo);

ALTER TABLE public.registros_condiciones_ambientales ENABLE ROW LEVEL SECURITY;

CREATE POLICY lectura_cond_amb ON public.registros_condiciones_ambientales
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY crear_cond_amb ON public.registros_condiciones_ambientales
  FOR INSERT WITH CHECK (
    obtener_rol_usuario() = ANY (ARRAY['operador'::rol_usuario, 'supervisor'::rol_usuario, 'administrador'::rol_usuario])
  );

CREATE TRIGGER audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.registros_condiciones_ambientales
  FOR EACH ROW EXECUTE FUNCTION trigger_audit_log();

-- ------------------------------------------------------------
-- G02 — Trazabilidad Productiva (11 CUMCS: 0201-0211)
-- ------------------------------------------------------------
CREATE TABLE public.registros_trazabilidad (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo varchar(20) NOT NULL,              -- CM-RE-0201 .. CM-RE-0211
  fecha date NOT NULL,
  lote_id uuid REFERENCES public.lotes(id),
  camada varchar(10),
  sistema varchar(20),
  sala varchar(80),
  fila varchar(20),
  cod_traza_cosecha varchar(120),
  cod_traza_secado varchar(120),
  cod_traza_trimeo varchar(120),
  cod_traza_cuarentena varchar(120),
  cod_traza_almacenamiento varchar(120),
  cod_comercial varchar(120),
  cod_generico varchar(120),              -- Para 0210/0211 (Maestra/General)
  planta_madre_id varchar(80),            -- 25.PM10
  clonacion_origen varchar(40),           -- CL16
  madre_origen varchar(40),               -- 25.PM9
  bandeja integer,
  cuadro_n integer,                       -- CDS N° para 0208
  cliente varchar(120),
  destino text,
  peso_fresco_kg numeric,
  peso_seco_kg numeric,
  peso_trimeado_kg numeric,
  peso_total_kg numeric,
  merma_pct numeric,
  cantidad numeric,                       -- Para comercial 0209
  ubicacion varchar(120),
  etapa varchar(40),
  descripcion text,
  version varchar(20),
  vinculaciones text,
  observaciones text,
  responsable varchar(80),
  datos_extra jsonb DEFAULT '{}'::jsonb,
  creado_en timestamptz NOT NULL DEFAULT now(),
  creado_por uuid NOT NULL,
  organizacion_id uuid DEFAULT '00000000-0000-0000-0000-000000000001'::uuid
);

COMMENT ON TABLE public.registros_trazabilidad IS
  'CUMCS G02: Trazabilidad productiva desde PM hasta despacho (CM-RE-0201 a CM-RE-0211)';

CREATE UNIQUE INDEX uq_reg_traza_tipo_fecha_cod
  ON public.registros_trazabilidad (tipo, fecha, COALESCE(cod_traza_cosecha, cod_traza_secado, cod_traza_trimeo, cod_traza_cuarentena, cod_traza_almacenamiento, cod_comercial, cod_generico, planta_madre_id, ''));
CREATE INDEX idx_reg_traza_camada_fecha ON public.registros_trazabilidad (camada, fecha DESC);
CREATE INDEX idx_reg_traza_tipo ON public.registros_trazabilidad (tipo);
CREATE INDEX idx_reg_traza_lote ON public.registros_trazabilidad (lote_id) WHERE lote_id IS NOT NULL;

ALTER TABLE public.registros_trazabilidad ENABLE ROW LEVEL SECURITY;

CREATE POLICY lectura_traza ON public.registros_trazabilidad
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY crear_traza ON public.registros_trazabilidad
  FOR INSERT WITH CHECK (
    obtener_rol_usuario() = ANY (ARRAY['operador'::rol_usuario, 'supervisor'::rol_usuario, 'administrador'::rol_usuario])
  );

CREATE TRIGGER audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.registros_trazabilidad
  FOR EACH ROW EXECUTE FUNCTION trigger_audit_log();

-- ------------------------------------------------------------
-- G03 — Fertilizantes e Insumos (6 CUMCS: 0301-0306)
-- ------------------------------------------------------------
CREATE TABLE public.registros_fertilizantes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo varchar(20) NOT NULL,              -- CM-RE-0301 .. CM-RE-0306
  fecha date NOT NULL,
  tanque varchar(40),
  destino varchar(80),
  sala varchar(80),
  id_lote_texto varchar(80),
  etapa varchar(40),
  producto varchar(120),
  principio_activo varchar(120),
  tipo_gasto varchar(40),
  pro_core numeric,
  pro_grow numeric,
  pro_bloom numeric,
  litros numeric,
  cantidad_producto numeric,
  litros_agua numeric,
  dilucion varchar(40),
  cantidad numeric,
  unidad varchar(10),
  entrada numeric,
  salida numeric,
  saldo numeric,
  fecha_movimiento date,
  detalle text,
  observaciones text,
  responsable varchar(80),
  datos_extra jsonb DEFAULT '{}'::jsonb,
  creado_en timestamptz NOT NULL DEFAULT now(),
  creado_por uuid NOT NULL,
  organizacion_id uuid DEFAULT '00000000-0000-0000-0000-000000000001'::uuid
);

COMMENT ON TABLE public.registros_fertilizantes IS
  'CUMCS G03: Fertilizantes e insumos (CM-RE-0301 a CM-RE-0306) - diluciones, movimientos, gastos';

CREATE UNIQUE INDEX uq_reg_fert_tipo_fecha_tanque_producto
  ON public.registros_fertilizantes (tipo, fecha, COALESCE(tanque,''), COALESCE(producto,''), COALESCE(id_lote_texto,''));
CREATE INDEX idx_reg_fert_destino_fecha ON public.registros_fertilizantes (destino, fecha DESC);
CREATE INDEX idx_reg_fert_tipo ON public.registros_fertilizantes (tipo);

ALTER TABLE public.registros_fertilizantes ENABLE ROW LEVEL SECURITY;

CREATE POLICY lectura_fert ON public.registros_fertilizantes
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY crear_fert ON public.registros_fertilizantes
  FOR INSERT WITH CHECK (
    obtener_rol_usuario() = ANY (ARRAY['operador'::rol_usuario, 'supervisor'::rol_usuario, 'administrador'::rol_usuario])
  );

CREATE TRIGGER audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.registros_fertilizantes
  FOR EACH ROW EXECUTE FUNCTION trigger_audit_log();

-- ------------------------------------------------------------
-- G06 — Cosecha y Postcosecha (11 CUMCS: 0601-0611)
-- ------------------------------------------------------------
CREATE TABLE public.registros_cosecha (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo varchar(20) NOT NULL,              -- CM-RE-0601 .. CM-RE-0611
  fecha date NOT NULL,
  lote_id uuid REFERENCES public.lotes(id),
  camada varchar(10),
  sistema varchar(20),
  sala varchar(80),
  fila varchar(20),
  ubicacion_cultivo varchar(40),
  genetica varchar(80),
  variedad varchar(80),
  fecha_transplante date,
  fecha_cosecha date,
  fecha_traslado date,
  fecha_recepcion date,
  fecha_inicio_cuarentena date,
  fecha_fin_cuarentena date,
  plantas_cosechadas integer,
  planta_n integer,
  cantidad_recibida numeric,
  cantidad_bolsas integer,
  total_plantas integer,
  cuadro_secado integer,
  estado_producto varchar(40),
  cond_recepcion varchar(40),
  cond_sanitaria varchar(40),
  cumple_bpa varchar(10),
  instrumental varchar(80),
  peso_fresco numeric,
  peso_seco numeric,
  peso_seco_estimado numeric,
  peso_individual numeric,
  peso_neto_g numeric,
  humedad_pct numeric,
  aw numeric,
  sanidad varchar(40),
  origen varchar(120),
  codigo_lote varchar(120),
  cod_traza_cosecha varchar(120),
  cod_traza_secado varchar(120),
  cod_traza_trimeo varchar(120),
  cod_traza_cuarentena varchar(120),
  cod_traza_almacenamiento varchar(120),
  cod_comercial varchar(120),
  cod_salida varchar(120),
  destino text,
  transporte_empresa varchar(120),
  patente varchar(20),
  conductor varchar(120),
  peso_total numeric,
  cantidad_bultos integer,
  croquis_ref varchar(120),
  obs_sanitarias text,
  responsable_sala varchar(80),
  responsable_calidad varchar(80),
  responsable_entrega varchar(80),
  responsable_recepcion varchar(80),
  observaciones text,
  responsable varchar(80),
  datos_extra jsonb DEFAULT '{}'::jsonb,
  creado_en timestamptz NOT NULL DEFAULT now(),
  creado_por uuid NOT NULL,
  organizacion_id uuid DEFAULT '00000000-0000-0000-0000-000000000001'::uuid
);

COMMENT ON TABLE public.registros_cosecha IS
  'CUMCS G06: Cosecha y postcosecha (CM-RE-0601 a CM-RE-0611)';

CREATE UNIQUE INDEX uq_reg_cosecha_tipo_fecha_camada_cod
  ON public.registros_cosecha (tipo, fecha, COALESCE(camada,''), COALESCE(cod_traza_cosecha, cod_traza_secado, cod_traza_trimeo, cod_traza_cuarentena, cod_traza_almacenamiento, cod_comercial, cod_salida, codigo_lote, ''));
CREATE INDEX idx_reg_cosecha_camada_fecha ON public.registros_cosecha (camada, fecha DESC);
CREATE INDEX idx_reg_cosecha_tipo ON public.registros_cosecha (tipo);
CREATE INDEX idx_reg_cosecha_lote ON public.registros_cosecha (lote_id) WHERE lote_id IS NOT NULL;

ALTER TABLE public.registros_cosecha ENABLE ROW LEVEL SECURITY;

CREATE POLICY lectura_cosecha ON public.registros_cosecha
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY crear_cosecha ON public.registros_cosecha
  FOR INSERT WITH CHECK (
    obtener_rol_usuario() = ANY (ARRAY['operador'::rol_usuario, 'supervisor'::rol_usuario, 'administrador'::rol_usuario])
  );

CREATE TRIGGER audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.registros_cosecha
  FOR EACH ROW EXECUTE FUNCTION trigger_audit_log();
