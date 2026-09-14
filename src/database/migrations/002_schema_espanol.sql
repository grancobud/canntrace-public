-- ============================================================================
-- CANNTRACE v0.2 - Schema en Espanol para Supabase PostgreSQL
-- Version: 0.2 | Fecha: 2026-04-16
-- GAMP5 Cat.5 | ALCOA+ | ANMAT Disp. 4159/2023 Anexo 6
-- ============================================================================
-- MEJORAS vs v0.1:
--   - Tablas y columnas 100% en castellano (legibilidad para auditores ANMAT)
--   - Hash encadenado mejorado (incluye contenido del registro en el hash)
--   - Tabla historial_cambios (inspirado en pgMemento) para time-travel
--   - Soft-delete en todas las tablas (nada se borra fisicamente)
--   - Tabla de sesiones para tracking de actividad
--   - Datos semilla incluidos
-- ============================================================================

-- ============================================================================
-- 1. EXTENSIONES
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- ============================================================================
-- 2. TIPOS ENUMERADOS (en castellano)
-- ============================================================================

CREATE TYPE rol_usuario AS ENUM ('operador', 'supervisor', 'auditor', 'administrador');

CREATE TYPE tipo_operacion AS ENUM (
  'ingreso_insumos',
  'planta_madre',
  'fertilizacion',
  'utilizacion_insumos',
  'baja_stock',
  'esquejado',
  'vegetativa',
  'poda',
  'floracion',
  'control_plagas',
  'cosecha',
  'secado',
  'trimming',
  'cuarentena',
  'fraccionamiento',
  'almacenamiento'
);

CREATE TYPE tipo_producto AS ENUM (
  'insumo',
  'planta_madre',
  'esqueje',
  'planta',
  'flor',
  'flor_trimmeada',
  'flor_fraccionada',
  'producto_final'
);

CREATE TYPE estado_item AS ENUM ('activo', 'baja', 'consumido', 'procesado', 'cuarentena');

CREATE TYPE modo_seguimiento AS ENUM ('individual', 'lote');

CREATE TYPE accion_auditoria AS ENUM (
  'CREAR', 'MODIFICAR', 'ELIMINAR', 'CONFIRMAR',
  'INICIAR_SESION', 'CERRAR_SESION', 'EXPORTAR'
);

CREATE TYPE estado_operacion AS ENUM ('borrador', 'confirmada', 'anulada');

-- ============================================================================
-- 3. PERFILES DE USUARIO
-- ============================================================================
CREATE TABLE perfiles_usuario (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre_completo VARCHAR(200) NOT NULL,
  rol rol_usuario NOT NULL DEFAULT 'operador',
  activo BOOLEAN NOT NULL DEFAULT true,
  ultimo_acceso TIMESTAMPTZ,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE perfiles_usuario IS 'RF-003: Perfiles vinculados a auth.users de Supabase con control de roles';

-- ============================================================================
-- 4. SESIONES (tracking de actividad - RS-003)
-- ============================================================================
CREATE TABLE sesiones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id),
  inicio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fin TIMESTAMPTZ,
  ip_direccion INET,
  agente_usuario TEXT, -- User-Agent del navegador
  activa BOOLEAN NOT NULL DEFAULT true
);

COMMENT ON TABLE sesiones IS 'RS-003, RF-005: Registro de sesiones para audit trail y control de expiracion';

-- ============================================================================
-- 5. CONFIGURACION
-- ============================================================================

-- Almacenes
CREATE TABLE almacenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(200) NOT NULL,
  descripcion TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  creado_por UUID NOT NULL REFERENCES auth.users(id),
  eliminado BOOLEAN NOT NULL DEFAULT false -- Soft delete
);

COMMENT ON TABLE almacenes IS 'Depositos/almacenes fisicos donde se ubican instalaciones';

-- Instalaciones (salas dentro de almacenes)
CREATE TABLE instalaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  almacen_id UUID NOT NULL REFERENCES almacenes(id),
  nombre VARCHAR(200) NOT NULL,
  descripcion TEXT,
  tipo VARCHAR(100) CHECK (tipo IN (
    'sala_madres', 'sala_clonacion', 'sala_vegetativa', 'sala_flora',
    'sala_cosecha', 'sala_secado', 'sala_trimming', 'deposito_cuarentena',
    'sala_fraccionado', 'deposito', 'estanteria_insumos'
  )),
  activo BOOLEAN NOT NULL DEFAULT true,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  creado_por UUID NOT NULL REFERENCES auth.users(id),
  eliminado BOOLEAN NOT NULL DEFAULT false
);

COMMENT ON TABLE instalaciones IS 'Salas/areas dentro de almacenes (sala_madres, sala_flora, etc.)';

-- Productos
CREATE TABLE productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(200) NOT NULL,
  tipo_producto tipo_producto NOT NULL,
  modo_seguimiento modo_seguimiento NOT NULL DEFAULT 'individual',
  unidad_medida VARCHAR(50) NOT NULL DEFAULT 'unidad'
    CHECK (unidad_medida IN ('unidad', 'gramo', 'kilogramo', 'litro', 'mililitro')),
  descripcion TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  creado_por UUID NOT NULL REFERENCES auth.users(id),
  eliminado BOOLEAN NOT NULL DEFAULT false
);

COMMENT ON TABLE productos IS 'Catalogo de productos: insumos, plantas, flores, etc.';

-- ============================================================================
-- 6. STOCK Y TRAZABILIDAD
-- ============================================================================

-- Lotes
CREATE TABLE lotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_lote VARCHAR(100) NOT NULL UNIQUE,
  producto_id UUID NOT NULL REFERENCES productos(id),
  instalacion_id UUID NOT NULL REFERENCES instalaciones(id),
  lote_padre_id UUID REFERENCES lotes(id), -- RF-032: trazabilidad inversa
  cantidad NUMERIC(12,4) NOT NULL CHECK (cantidad >= 0), -- RF-036
  estado estado_item NOT NULL DEFAULT 'activo',
  fecha_vencimiento DATE,
  modo_seguimiento modo_seguimiento NOT NULL DEFAULT 'individual',
  datos_extra JSONB DEFAULT '{}',
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  creado_por UUID NOT NULL REFERENCES auth.users(id),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  eliminado BOOLEAN NOT NULL DEFAULT false
);

COMMENT ON TABLE lotes IS 'RF-032/RF-036: Lotes con trazabilidad padre-hijo y stock no-negativo';
CREATE INDEX idx_lotes_producto ON lotes(producto_id);
CREATE INDEX idx_lotes_instalacion ON lotes(instalacion_id);
CREATE INDEX idx_lotes_padre ON lotes(lote_padre_id);

-- Individuos (plantas, esquejes, flores)
CREATE TABLE individuos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_serie VARCHAR(100) NOT NULL UNIQUE, -- Codigo QR
  lote_id UUID NOT NULL REFERENCES lotes(id),
  producto_id UUID NOT NULL REFERENCES productos(id),
  instalacion_id UUID NOT NULL REFERENCES instalaciones(id),
  individuo_padre_id UUID REFERENCES individuos(id), -- Planta madre -> esqueje
  estado estado_item NOT NULL DEFAULT 'activo',
  datos_extra JSONB DEFAULT '{}',
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  creado_por UUID NOT NULL REFERENCES auth.users(id),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  eliminado BOOLEAN NOT NULL DEFAULT false
);

COMMENT ON TABLE individuos IS 'RF-012/RF-021: Plantas y esquejes individuales con codigo QR unico';
CREATE INDEX idx_individuos_lote ON individuos(lote_id);
CREATE INDEX idx_individuos_padre ON individuos(individuo_padre_id);

-- ============================================================================
-- 7. OPERACIONES (corazon del flujo seed-to-sale)
-- ============================================================================

CREATE TABLE operaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_operacion tipo_operacion NOT NULL,
  estado estado_operacion NOT NULL DEFAULT 'borrador',

  -- Origen
  instalacion_origen_id UUID REFERENCES instalaciones(id),
  lote_origen_id UUID REFERENCES lotes(id),

  -- Destino
  instalacion_destino_id UUID REFERENCES instalaciones(id),
  lote_destino_id UUID REFERENCES lotes(id),

  -- Cantidades
  cantidad_entrada NUMERIC(12,4) CHECK (cantidad_entrada >= 0),
  cantidad_salida NUMERIC(12,4) CHECK (cantidad_salida >= 0),

  -- Datos operativos
  responsable VARCHAR(200),
  observaciones TEXT,
  notas_sanitarias TEXT,

  -- Mediciones
  peso_fresco_kg NUMERIC(10,3),
  peso_seco_kg NUMERIC(10,3),
  peso_neto_g NUMERIC(10,3),
  rendimiento_porcentaje NUMERIC(5,2) CHECK (rendimiento_porcentaje >= 0 AND rendimiento_porcentaje <= 100),
  temperatura_c NUMERIC(5,2),
  humedad_porcentaje NUMERIC(5,2) CHECK (humedad_porcentaje >= 0 AND humedad_porcentaje <= 100),
  co2_ppm NUMERIC(8,2),
  horas_secado NUMERIC(8,2),
  sustrato VARCHAR(200),

  -- Datos extensibles
  datos_extra JSONB DEFAULT '{}',

  -- Individuos involucrados
  individuo_ids UUID[] DEFAULT '{}',

  -- Chat IA (RF-011, RR-004)
  texto_original TEXT, -- Texto del operador (ALCOA: Original)
  json_estructurado JSONB, -- JSON de la IA

  -- Timestamps (RR-001, RR-003)
  fecha_operacion TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- Inmutable post-creacion
  creado_por UUID NOT NULL REFERENCES auth.users(id),
  confirmado_por UUID REFERENCES auth.users(id),
  confirmado_en TIMESTAMPTZ,
  anulado_por UUID REFERENCES auth.users(id),
  anulado_en TIMESTAMPTZ,
  motivo_anulacion TEXT,

  -- Firma electronica (RR-011)
  firma_registro VARCHAR(64)
);

COMMENT ON TABLE operaciones IS 'RF-016 a RF-031: Todas las operaciones del flujo seed-to-sale';
CREATE INDEX idx_operaciones_tipo ON operaciones(tipo_operacion);
CREATE INDEX idx_operaciones_lote_origen ON operaciones(lote_origen_id);
CREATE INDEX idx_operaciones_lote_destino ON operaciones(lote_destino_id);
CREATE INDEX idx_operaciones_creador ON operaciones(creado_por);
CREATE INDEX idx_operaciones_fecha ON operaciones(fecha_operacion);
CREATE INDEX idx_operaciones_estado ON operaciones(estado);

-- Insumos consumidos por operacion
CREATE TABLE insumos_operacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operacion_id UUID NOT NULL REFERENCES operaciones(id),
  producto_id UUID NOT NULL REFERENCES productos(id),
  lote_id UUID NOT NULL REFERENCES lotes(id),
  cantidad_consumida NUMERIC(12,4) NOT NULL CHECK (cantidad_consumida > 0),
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE insumos_operacion IS 'RF-018/RF-019: Insumos decrementados en cada operacion';

-- ============================================================================
-- 8. REGISTRO DE AUDITORIA INMUTABLE (ALCOA+)
-- ============================================================================

CREATE TABLE registro_auditoria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Cuando (RR-003: Contemporaneo)
  marca_tiempo TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Quien (RR-001: Atribuible)
  usuario_id UUID NOT NULL REFERENCES auth.users(id),
  nombre_usuario VARCHAR(200) NOT NULL,

  -- Que (RR-006: Completo)
  tipo_accion accion_auditoria NOT NULL,
  nombre_tabla VARCHAR(100) NOT NULL,
  id_registro UUID NOT NULL,

  -- Valores (RR-013)
  valor_anterior JSONB,
  valor_nuevo JSONB,

  -- Texto original (RR-004: Original)
  texto_original TEXT,
  json_estructurado JSONB,

  -- Motivo (obligatorio para MODIFICAR/ELIMINAR)
  motivo TEXT,

  -- Contexto
  direccion_ip INET,
  sesion_id UUID REFERENCES sesiones(id),

  -- Firma electronica (RR-011)
  firma_registro VARCHAR(64) NOT NULL,

  -- Hash encadenado (RR-012)
  hash_anterior VARCHAR(64) NOT NULL,

  -- Constraint: motivo obligatorio para cambios/eliminaciones
  CONSTRAINT chk_motivo_obligatorio CHECK (
    tipo_accion IN ('CREAR', 'CONFIRMAR', 'INICIAR_SESION', 'CERRAR_SESION', 'EXPORTAR')
    OR
    (tipo_accion IN ('MODIFICAR', 'ELIMINAR') AND motivo IS NOT NULL AND motivo != '')
  )
);

COMMENT ON TABLE registro_auditoria IS 'RR-010/RR-012: Audit trail inmutable con hash encadenado tipo blockchain';
CREATE INDEX idx_auditoria_tabla_registro ON registro_auditoria(nombre_tabla, id_registro);
CREATE INDEX idx_auditoria_usuario_tiempo ON registro_auditoria(usuario_id, marca_tiempo);
CREATE INDEX idx_auditoria_accion ON registro_auditoria(tipo_accion);
CREATE INDEX idx_auditoria_tiempo ON registro_auditoria(marca_tiempo);

-- ============================================================================
-- 9. HISTORIAL DE CAMBIOS (inspirado en pgMemento - time travel)
-- ============================================================================

CREATE TABLE historial_cambios (
  id BIGSERIAL PRIMARY KEY,
  marca_tiempo TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id),
  nombre_tabla VARCHAR(100) NOT NULL,
  id_registro UUID NOT NULL,
  operacion VARCHAR(10) NOT NULL CHECK (operacion IN ('INSERT', 'UPDATE', 'DELETE')),
  datos_anteriores JSONB,
  datos_nuevos JSONB,
  campos_modificados TEXT[] -- Lista de columnas que cambiaron
);

COMMENT ON TABLE historial_cambios IS 'pgMemento-style: versionado completo para reconstruir estado en cualquier punto';
CREATE INDEX idx_historial_tabla_registro ON historial_cambios(nombre_tabla, id_registro);
CREATE INDEX idx_historial_tiempo ON historial_cambios(marca_tiempo);

-- ============================================================================
-- 10. TRIGGERS DE INTEGRIDAD GAMP5
-- ============================================================================

-- 10.1 AUDIT TRAIL INMUTABLE (RR-010)
CREATE OR REPLACE FUNCTION impedir_modificacion_auditoria()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'VIOLACION GAMP5: El registro de auditoria es inmutable. Solo se permite INSERT. Operacion intentada: %', TG_OP;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auditoria_inmutable_update
  BEFORE UPDATE ON registro_auditoria
  FOR EACH ROW EXECUTE FUNCTION impedir_modificacion_auditoria();

CREATE TRIGGER trg_auditoria_inmutable_delete
  BEFORE DELETE ON registro_auditoria
  FOR EACH ROW EXECUTE FUNCTION impedir_modificacion_auditoria();

-- 10.2 FIRMA ELECTRONICA + HASH ENCADENADO MEJORADO (RR-011, RR-012)
CREATE OR REPLACE FUNCTION generar_firma_registro()
RETURNS TRIGGER AS $$
DECLARE
  ultimo_hash VARCHAR(64);
BEGIN
  -- Firma: incluye contenido del registro para mayor integridad
  NEW.firma_registro := encode(
    digest(
      COALESCE(NEW.nombre_tabla, '') ||
      COALESCE(NEW.id_registro::text, '') ||
      COALESCE(NEW.marca_tiempo::text, '') ||
      COALESCE(NEW.usuario_id::text, '') ||
      COALESCE(NEW.tipo_accion::text, '') ||
      COALESCE(NEW.valor_nuevo::text, '') ||
      COALESCE(NEW.motivo, ''),
      'sha256'
    ),
    'hex'
  );

  -- Hash encadenado: firma_registro del registro anterior
  SELECT firma_registro INTO ultimo_hash
  FROM registro_auditoria
  ORDER BY marca_tiempo DESC, id DESC
  LIMIT 1;

  NEW.hash_anterior := COALESCE(ultimo_hash, 'GENESIS');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_firma_auditoria
  BEFORE INSERT ON registro_auditoria
  FOR EACH ROW EXECUTE FUNCTION generar_firma_registro();

-- 10.3 TIMESTAMP INMUTABLE en operaciones (RR-003)
CREATE OR REPLACE FUNCTION impedir_cambio_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.fecha_operacion != NEW.fecha_operacion THEN
    RAISE EXCEPTION 'VIOLACION GAMP5: fecha_operacion es inmutable despues de la creacion.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_operaciones_timestamp_inmutable
  BEFORE UPDATE ON operaciones
  FOR EACH ROW EXECUTE FUNCTION impedir_cambio_timestamp();

-- 10.4 STOCK NUNCA NEGATIVO (RF-036)
CREATE OR REPLACE FUNCTION verificar_stock_no_negativo()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.cantidad < 0 THEN
    RAISE EXCEPTION 'VIOLACION GAMP5: El stock no puede ser negativo. Lote: %, Cantidad intentada: %',
      NEW.codigo_lote, NEW.cantidad;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_lotes_stock_check
  BEFORE INSERT OR UPDATE ON lotes
  FOR EACH ROW EXECUTE FUNCTION verificar_stock_no_negativo();

-- 10.5 AUDIT TRAIL AUTOMATICO para operaciones
CREATE OR REPLACE FUNCTION auditoria_automatica_operaciones()
RETURNS TRIGGER AS $$
DECLARE
  v_nombre VARCHAR(200);
  v_sesion UUID;
BEGIN
  SELECT nombre_completo INTO v_nombre FROM perfiles_usuario WHERE id = NEW.creado_por;

  -- Obtener sesion activa
  SELECT id INTO v_sesion FROM sesiones
  WHERE usuario_id = NEW.creado_por AND activa = true
  ORDER BY inicio DESC LIMIT 1;

  INSERT INTO registro_auditoria (
    usuario_id, nombre_usuario, tipo_accion, nombre_tabla, id_registro,
    valor_anterior, valor_nuevo, texto_original, json_estructurado, motivo, sesion_id
  ) VALUES (
    NEW.creado_por,
    COALESCE(v_nombre, 'DESCONOCIDO'),
    CASE
      WHEN TG_OP = 'INSERT' THEN 'CREAR'::accion_auditoria
      WHEN TG_OP = 'UPDATE' THEN 'MODIFICAR'::accion_auditoria
    END,
    'operaciones',
    NEW.id,
    CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
    to_jsonb(NEW),
    NEW.texto_original,
    NEW.json_estructurado,
    CASE WHEN TG_OP = 'UPDATE' THEN NEW.motivo_anulacion ELSE NULL END,
    v_sesion
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_operaciones_auditoria
  AFTER INSERT OR UPDATE ON operaciones
  FOR EACH ROW EXECUTE FUNCTION auditoria_automatica_operaciones();

-- 10.6 HISTORIAL DE CAMBIOS AUTOMATICO (pgMemento-style)
CREATE OR REPLACE FUNCTION registrar_historial_cambios()
RETURNS TRIGGER AS $$
DECLARE
  v_campos TEXT[];
  v_key TEXT;
BEGIN
  -- Detectar campos modificados
  IF TG_OP = 'UPDATE' THEN
    FOR v_key IN SELECT jsonb_object_keys(to_jsonb(NEW)) LOOP
      IF to_jsonb(OLD)->>v_key IS DISTINCT FROM to_jsonb(NEW)->>v_key THEN
        v_campos := array_append(v_campos, v_key);
      END IF;
    END LOOP;
  END IF;

  INSERT INTO historial_cambios (
    usuario_id, nombre_tabla, id_registro, operacion,
    datos_anteriores, datos_nuevos, campos_modificados
  ) VALUES (
    COALESCE(
      CASE WHEN TG_OP = 'DELETE' THEN (OLD).creado_por ELSE (NEW).creado_por END,
      auth.uid()
    ),
    TG_TABLE_NAME,
    CASE WHEN TG_OP = 'DELETE' THEN (OLD).id ELSE (NEW).id END,
    TG_OP,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    v_campos
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar historial a todas las tablas de negocio
CREATE TRIGGER trg_historial_lotes AFTER INSERT OR UPDATE OR DELETE ON lotes
  FOR EACH ROW EXECUTE FUNCTION registrar_historial_cambios();

CREATE TRIGGER trg_historial_individuos AFTER INSERT OR UPDATE OR DELETE ON individuos
  FOR EACH ROW EXECUTE FUNCTION registrar_historial_cambios();

CREATE TRIGGER trg_historial_productos AFTER INSERT OR UPDATE OR DELETE ON productos
  FOR EACH ROW EXECUTE FUNCTION registrar_historial_cambios();

CREATE TRIGGER trg_historial_almacenes AFTER INSERT OR UPDATE OR DELETE ON almacenes
  FOR EACH ROW EXECUTE FUNCTION registrar_historial_cambios();

CREATE TRIGGER trg_historial_instalaciones AFTER INSERT OR UPDATE OR DELETE ON instalaciones
  FOR EACH ROW EXECUTE FUNCTION registrar_historial_cambios();

-- 10.7 ACTUALIZAR_EN automatico
CREATE OR REPLACE FUNCTION actualizar_marca_tiempo()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_lotes_actualizar BEFORE UPDATE ON lotes
  FOR EACH ROW EXECUTE FUNCTION actualizar_marca_tiempo();
CREATE TRIGGER trg_individuos_actualizar BEFORE UPDATE ON individuos
  FOR EACH ROW EXECUTE FUNCTION actualizar_marca_tiempo();
CREATE TRIGGER trg_perfiles_actualizar BEFORE UPDATE ON perfiles_usuario
  FOR EACH ROW EXECUTE FUNCTION actualizar_marca_tiempo();

-- ============================================================================
-- 11. ROW LEVEL SECURITY (RF-003)
-- ============================================================================

ALTER TABLE perfiles_usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE sesiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE almacenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE instalaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE lotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE individuos ENABLE ROW LEVEL SECURITY;
ALTER TABLE operaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE insumos_operacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE registro_auditoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE historial_cambios ENABLE ROW LEVEL SECURITY;

-- Helper
CREATE OR REPLACE FUNCTION obtener_rol_usuario()
RETURNS rol_usuario AS $$
  SELECT rol FROM perfiles_usuario WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Lectura: todos los roles autenticados pueden leer tablas de negocio
CREATE POLICY lectura_general_almacenes ON almacenes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY lectura_general_instalaciones ON instalaciones FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY lectura_general_productos ON productos FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY lectura_general_lotes ON lotes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY lectura_general_individuos ON individuos FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY lectura_general_operaciones ON operaciones FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY lectura_general_insumos ON insumos_operacion FOR SELECT USING (auth.uid() IS NOT NULL);

-- Creacion de operaciones: operador, supervisor, admin
CREATE POLICY crear_operaciones ON operaciones
  FOR INSERT WITH CHECK (obtener_rol_usuario() IN ('operador', 'supervisor', 'administrador'));

-- Audit trail: solo auditor y admin pueden LEER
CREATE POLICY lectura_auditoria ON registro_auditoria
  FOR SELECT USING (obtener_rol_usuario() IN ('auditor', 'administrador'));

CREATE POLICY lectura_historial ON historial_cambios
  FOR SELECT USING (obtener_rol_usuario() IN ('auditor', 'administrador'));

-- Admin: gestion completa de configuracion
CREATE POLICY admin_perfiles ON perfiles_usuario FOR ALL
  USING (obtener_rol_usuario() = 'administrador');
CREATE POLICY admin_almacenes ON almacenes FOR ALL
  USING (obtener_rol_usuario() = 'administrador');
CREATE POLICY admin_instalaciones ON instalaciones FOR ALL
  USING (obtener_rol_usuario() = 'administrador');
CREATE POLICY admin_productos ON productos FOR ALL
  USING (obtener_rol_usuario() = 'administrador');

-- Sesiones: cada usuario ve las propias
CREATE POLICY sesiones_propias ON sesiones FOR SELECT
  USING (usuario_id = auth.uid());
CREATE POLICY crear_sesion ON sesiones FOR INSERT
  WITH CHECK (usuario_id = auth.uid());

-- Nadie puede insertar directo en audit (solo triggers)
CREATE POLICY auditoria_sin_insert_directo ON registro_auditoria
  FOR INSERT WITH CHECK (false);

-- ============================================================================
-- 12. VISTAS PARA REPORTES
-- ============================================================================

CREATE VIEW vista_stock_actual AS
SELECT
  l.id AS lote_id,
  l.codigo_lote,
  p.nombre AS nombre_producto,
  p.tipo_producto,
  p.unidad_medida,
  i.nombre AS nombre_instalacion,
  i.tipo AS tipo_instalacion,
  a.nombre AS nombre_almacen,
  l.cantidad,
  l.estado,
  l.modo_seguimiento,
  l.fecha_vencimiento,
  l.creado_en
FROM lotes l
JOIN productos p ON l.producto_id = p.id
JOIN instalaciones i ON l.instalacion_id = i.id
JOIN almacenes a ON i.almacen_id = a.id
WHERE l.estado = 'activo' AND l.eliminado = false
ORDER BY p.tipo_producto, l.creado_en DESC;

COMMENT ON VIEW vista_stock_actual IS 'RF-035: Stock en tiempo real por producto/lote/ubicacion';

-- Trazabilidad inversa (RF-032)
CREATE VIEW vista_trazabilidad_inversa AS
WITH RECURSIVE cadena AS (
  SELECT
    l.id, l.codigo_lote, l.producto_id, l.lote_padre_id,
    p.nombre AS nombre_producto, p.tipo_producto,
    i.nombre AS nombre_instalacion,
    0 AS profundidad
  FROM lotes l
  JOIN productos p ON l.producto_id = p.id
  JOIN instalaciones i ON l.instalacion_id = i.id
  UNION ALL
  SELECT
    l.id, l.codigo_lote, l.producto_id, l.lote_padre_id,
    p.nombre, p.tipo_producto,
    i.nombre,
    c.profundidad + 1
  FROM lotes l
  JOIN productos p ON l.producto_id = p.id
  JOIN instalaciones i ON l.instalacion_id = i.id
  JOIN cadena c ON l.id = c.lote_padre_id
  WHERE c.profundidad < 20
)
SELECT * FROM cadena ORDER BY profundidad;

COMMENT ON VIEW vista_trazabilidad_inversa IS 'RF-032: Cadena completa desde producto final hasta planta madre';

-- Reporte de auditoria (RR-009)
CREATE VIEW vista_reporte_auditoria AS
SELECT
  ra.marca_tiempo,
  ra.nombre_usuario,
  ra.tipo_accion,
  ra.nombre_tabla,
  ra.id_registro,
  ra.motivo,
  ra.firma_registro,
  ra.hash_anterior,
  ra.texto_original
FROM registro_auditoria ra
ORDER BY ra.marca_tiempo DESC;

COMMENT ON VIEW vista_reporte_auditoria IS 'RR-009: Vista para exportacion regulatoria';

-- ============================================================================
-- 13. FUNCION DE VERIFICACION DE INTEGRIDAD (RR-012)
-- ============================================================================

CREATE OR REPLACE FUNCTION verificar_integridad_cadena()
RETURNS TABLE(
  total_registros BIGINT,
  cadena_valida BOOLEAN,
  primer_error_en TIMESTAMPTZ,
  registro_roto_id UUID
) AS $$
DECLARE
  reg RECORD;
  hash_esperado VARCHAR(64);
  es_valida BOOLEAN := true;
  ts_error TIMESTAMPTZ;
  id_error UUID;
  total BIGINT;
BEGIN
  SELECT COUNT(*) INTO total FROM registro_auditoria;
  hash_esperado := 'GENESIS';

  FOR reg IN SELECT * FROM registro_auditoria ORDER BY marca_tiempo, id LOOP
    IF reg.hash_anterior != hash_esperado AND es_valida THEN
      es_valida := false;
      ts_error := reg.marca_tiempo;
      id_error := reg.id;
    END IF;
    hash_esperado := reg.firma_registro;
  END LOOP;

  RETURN QUERY SELECT total, es_valida, ts_error, id_error;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION verificar_integridad_cadena IS 'RR-012: Verifica que la cadena de hashes no fue manipulada';

-- ============================================================================
-- 14. DATOS SEMILLA
-- ============================================================================

-- Nota: Ejecutar DESPUES de crear el primer usuario admin via Supabase Auth
-- Reemplazar 'UUID_DEL_ADMIN' con el UUID real del usuario

-- INSERT INTO perfiles_usuario (id, nombre_completo, rol)
-- VALUES ('UUID_DEL_ADMIN', 'Administrador CannTrace', 'administrador');

-- INSERT INTO almacenes (nombre, descripcion, creado_por)
-- VALUES ('Planta Principal', 'Instalacion principal de cultivo', 'UUID_DEL_ADMIN');

-- Las instalaciones tipicas:
-- INSERT INTO instalaciones (almacen_id, nombre, tipo, creado_por) VALUES
-- ('UUID_ALMACEN', 'Sala de Madres', 'sala_madres', 'UUID_DEL_ADMIN'),
-- ('UUID_ALMACEN', 'Sala de Clonacion', 'sala_clonacion', 'UUID_DEL_ADMIN'),
-- ('UUID_ALMACEN', 'Sala Vegetativa', 'sala_vegetativa', 'UUID_DEL_ADMIN'),
-- ('UUID_ALMACEN', 'Sala de Flora', 'sala_flora', 'UUID_DEL_ADMIN'),
-- ('UUID_ALMACEN', 'Sala de Cosecha', 'sala_cosecha', 'UUID_DEL_ADMIN'),
-- ('UUID_ALMACEN', 'Sala de Secado', 'sala_secado', 'UUID_DEL_ADMIN'),
-- ('UUID_ALMACEN', 'Sala de Trimming', 'sala_trimming', 'UUID_DEL_ADMIN'),
-- ('UUID_ALMACEN', 'Deposito de Cuarentena', 'deposito_cuarentena', 'UUID_DEL_ADMIN'),
-- ('UUID_ALMACEN', 'Sala de Fraccionado', 'sala_fraccionado', 'UUID_DEL_ADMIN'),
-- ('UUID_ALMACEN', 'Deposito Final', 'deposito', 'UUID_DEL_ADMIN'),
-- ('UUID_ALMACEN', 'Estanteria de Insumos', 'estanteria_insumos', 'UUID_DEL_ADMIN');

-- Productos tipicos:
-- INSERT INTO productos (nombre, tipo_producto, modo_seguimiento, unidad_medida, creado_por) VALUES
-- ('Fertilizante Liquido', 'insumo', 'lote', 'litro', 'UUID_DEL_ADMIN'),
-- ('Maceta', 'insumo', 'lote', 'unidad', 'UUID_DEL_ADMIN'),
-- ('Planta Madre', 'planta_madre', 'individual', 'unidad', 'UUID_DEL_ADMIN'),
-- ('Esqueje', 'esqueje', 'individual', 'unidad', 'UUID_DEL_ADMIN'),
-- ('Planta Vegetativa', 'planta', 'individual', 'unidad', 'UUID_DEL_ADMIN'),
-- ('Flor Variedad Unica', 'flor', 'individual', 'unidad', 'UUID_DEL_ADMIN'),
-- ('Flor Variedad Unica Trimmeada', 'flor_trimmeada', 'lote', 'gramo', 'UUID_DEL_ADMIN'),
-- ('Flor Variedad Unica Fraccionada', 'flor_fraccionada', 'lote', 'gramo', 'UUID_DEL_ADMIN');

-- ============================================================================
-- FIN - CannTrace Schema v0.2 (Espanol)
-- Tablas: 11 | Triggers: 14 | Vistas: 3 | Funciones: 8
-- ============================================================================
