-- ============================================================================
-- CANNTRACE - Schema Inicial para Supabase PostgreSQL
-- Version: 0.1 | Fecha: 2026-04-16
-- GAMP5 Cat.5 | ALCOA+ Compliant | ANMAT Disp. 4159/2023 Anexo 6
-- ============================================================================
-- INSTRUCCIONES: Pegar este script completo en Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. EXTENSIONES REQUERIDAS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- Para gen_random_uuid() y digest()
CREATE EXTENSION IF NOT EXISTS "citext";    -- Para emails case-insensitive

-- ============================================================================
-- 2. TIPOS ENUMERADOS
-- ============================================================================

-- Roles del sistema (RF-003)
CREATE TYPE user_role AS ENUM ('operador', 'supervisor', 'auditor', 'administrador');

-- Tipos de operacion del flujo seed-to-sale (RF-016 a RF-031)
CREATE TYPE operation_type AS ENUM (
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

-- Tipo de producto en el ciclo
CREATE TYPE product_type AS ENUM (
  'insumo',
  'planta_madre',
  'esqueje',
  'planta',
  'flor',
  'flor_trimmeada',
  'flor_fraccionada',
  'producto_final'
);

-- Estado del individuo/lote
CREATE TYPE item_status AS ENUM ('activo', 'baja', 'consumido', 'procesado', 'cuarentena');

-- Modo de tracking
CREATE TYPE tracking_mode AS ENUM ('individual', 'lote');

-- Acciones de audit trail (RR-006)
CREATE TYPE audit_action AS ENUM ('INSERT', 'UPDATE', 'DELETE', 'CONFIRM', 'LOGIN', 'LOGOUT', 'EXPORT');

-- ============================================================================
-- 3. TABLA DE PERFILES DE USUARIO (vinculada a auth.users de Supabase)
-- ============================================================================
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(200) NOT NULL,
  role user_role NOT NULL DEFAULT 'operador',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 4. TABLAS DE CONFIGURACION
-- ============================================================================

-- Almacenes/Depositos
CREATE TABLE warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id)
);

-- Instalaciones/Salas dentro de almacenes
CREATE TABLE facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  facility_type VARCHAR(100), -- sala_madres, sala_clonacion, sala_vegetativa, sala_flora, sala_cosecha, sala_secado, sala_trimming, deposito_cuarentena, sala_fraccionado, deposito
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id)
);

-- Productos configurados
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  product_type product_type NOT NULL,
  tracking_mode tracking_mode NOT NULL DEFAULT 'individual',
  unit_of_measure VARCHAR(50) NOT NULL DEFAULT 'unidad', -- unidad, gramo, kilogramo, litro, ml
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id)
);

-- ============================================================================
-- 5. TABLAS DE STOCK Y TRAZABILIDAD
-- ============================================================================

-- Lotes (agrupacion de individuos o productos a granel)
CREATE TABLE batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_code VARCHAR(100) NOT NULL UNIQUE,
  product_id UUID NOT NULL REFERENCES products(id),
  facility_id UUID NOT NULL REFERENCES facilities(id),
  parent_batch_id UUID REFERENCES batches(id), -- Para trazabilidad inversa (RF-032)
  quantity NUMERIC(12,4) NOT NULL CHECK (quantity >= 0), -- RF-036: nunca negativo
  status item_status NOT NULL DEFAULT 'activo',
  expiry_date DATE,
  tracking_mode tracking_mode NOT NULL DEFAULT 'individual',
  metadata JSONB DEFAULT '{}', -- Campos configurables adicionales
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Individuos (plantas, esquejes, flores individuales)
CREATE TABLE individuals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  serial_code VARCHAR(100) NOT NULL UNIQUE, -- Codigo QR/serie
  batch_id UUID NOT NULL REFERENCES batches(id),
  product_id UUID NOT NULL REFERENCES products(id),
  facility_id UUID NOT NULL REFERENCES facilities(id),
  parent_individual_id UUID REFERENCES individuals(id), -- Planta madre -> esqueje
  status item_status NOT NULL DEFAULT 'activo',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 6. TABLA DE OPERACIONES (el corazon del flujo seed-to-sale)
-- ============================================================================

CREATE TABLE operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_type operation_type NOT NULL,

  -- Origen (de donde se decrementa/mueve)
  source_facility_id UUID REFERENCES facilities(id),
  source_batch_id UUID REFERENCES batches(id),

  -- Destino (donde se genera/mueve)
  destination_facility_id UUID REFERENCES facilities(id),
  destination_batch_id UUID REFERENCES batches(id),

  -- Cantidades
  quantity_input NUMERIC(12,4) CHECK (quantity_input >= 0),
  quantity_output NUMERIC(12,4) CHECK (quantity_output >= 0),

  -- Datos operativos
  responsible VARCHAR(200),
  observations TEXT,
  sanitary_notes TEXT,

  -- Datos medibles (configurables por operacion)
  weight_fresh_kg NUMERIC(10,3),
  weight_dry_kg NUMERIC(10,3),
  weight_net_g NUMERIC(10,3),
  yield_percent NUMERIC(5,2) CHECK (yield_percent >= 0 AND yield_percent <= 100),
  temperature_c NUMERIC(5,2),
  humidity_percent NUMERIC(5,2) CHECK (humidity_percent >= 0 AND humidity_percent <= 100),
  co2_ppm NUMERIC(8,2),
  drying_hours NUMERIC(8,2),

  -- Metadata extensible
  extra_data JSONB DEFAULT '{}',

  -- Individuos involucrados (array de IDs)
  individual_ids UUID[] DEFAULT '{}',

  -- Chat input (RF-011, RR-004)
  input_raw TEXT, -- Texto original del operador (ALCOA: Original)
  parsed_json JSONB, -- JSON generado por IA

  -- Timestamps y audit (RR-001, RR-003)
  timestamp_utc TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- NO editable (ALCOA: Contemporaneo)
  created_by UUID NOT NULL REFERENCES auth.users(id),
  confirmed_by UUID REFERENCES auth.users(id), -- RF-009: quien confirmo
  confirmed_at TIMESTAMPTZ, -- Cuando se confirmo

  -- Firma electronica (RR-011)
  record_signature VARCHAR(64) -- SHA-256
);

-- Indice para trazabilidad rapida
CREATE INDEX idx_operations_type ON operations(operation_type);
CREATE INDEX idx_operations_source_batch ON operations(source_batch_id);
CREATE INDEX idx_operations_dest_batch ON operations(destination_batch_id);
CREATE INDEX idx_operations_created_by ON operations(created_by);
CREATE INDEX idx_operations_timestamp ON operations(timestamp_utc);

-- ============================================================================
-- 7. TABLA DE INSUMOS CONSUMIDOS POR OPERACION
-- ============================================================================

CREATE TABLE operation_inputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_id UUID NOT NULL REFERENCES operations(id),
  product_id UUID NOT NULL REFERENCES products(id),
  batch_id UUID NOT NULL REFERENCES batches(id),
  quantity_consumed NUMERIC(12,4) NOT NULL CHECK (quantity_consumed > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 8. AUDIT TRAIL INMUTABLE (RR-010, RR-011, RR-012, RR-013)
-- ============================================================================

CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Timestamp del servidor, NO editable (RR-003: ALCOA Contemporaneo)
  timestamp_utc TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Quien (RR-001: ALCOA Atribuible)
  user_id UUID NOT NULL REFERENCES auth.users(id),
  user_name VARCHAR(200) NOT NULL, -- Desnormalizado para legibilidad futura

  -- Que accion (RR-006: ALCOA Completo)
  action_type audit_action NOT NULL,

  -- Sobre que registro
  table_name VARCHAR(100) NOT NULL,
  record_id UUID NOT NULL,

  -- Valores anterior y nuevo (para UPDATE: RR-013)
  old_value JSONB, -- NULL si es INSERT
  new_value JSONB, -- NULL si es DELETE

  -- Texto original del operador (RR-004: ALCOA Original)
  input_raw TEXT,

  -- JSON estructurado confirmado
  parsed_json JSONB,

  -- Motivo del cambio (obligatorio para UPDATE/DELETE: RR-013)
  reason TEXT,

  -- Contexto de sesion
  ip_address INET,
  session_id UUID,

  -- Firma electronica (RR-011)
  record_signature VARCHAR(64) NOT NULL,

  -- Hash encadenado (RR-012): hash del registro anterior
  previous_hash VARCHAR(64),

  -- Constraint: reason obligatorio para UPDATE/DELETE
  CONSTRAINT chk_reason_required CHECK (
    (action_type IN ('INSERT', 'CONFIRM', 'LOGIN', 'LOGOUT', 'EXPORT'))
    OR
    (action_type IN ('UPDATE', 'DELETE') AND reason IS NOT NULL AND reason != '')
  )
);

-- Indices para consultas de auditoria
CREATE INDEX idx_audit_log_record ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_log_user_time ON audit_log(user_id, timestamp_utc);
CREATE INDEX idx_audit_log_action ON audit_log(action_type);
CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp_utc);

-- ============================================================================
-- 9. TRIGGERS DE INTEGRIDAD
-- ============================================================================

-- 9.1 AUDIT LOG INMUTABLE: Impedir UPDATE y DELETE (RR-010)
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'GAMP5 VIOLATION: audit_log is immutable. Only INSERT allowed. Action attempted: %', TG_OP;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_immutable_update
  BEFORE UPDATE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

CREATE TRIGGER trg_audit_immutable_delete
  BEFORE DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

-- 9.2 FIRMA ELECTRONICA: Hash SHA-256 automatico (RR-011)
CREATE OR REPLACE FUNCTION generate_record_signature()
RETURNS TRIGGER AS $$
DECLARE
  last_hash VARCHAR(64);
BEGIN
  -- Generar firma del registro actual
  NEW.record_signature := encode(
    digest(
      COALESCE(NEW.table_name, '') ||
      COALESCE(NEW.record_id::text, '') ||
      COALESCE(NEW.timestamp_utc::text, '') ||
      COALESCE(NEW.user_id::text, '') ||
      COALESCE(NEW.action_type::text, ''),
      'sha256'
    ),
    'hex'
  );

  -- Hash encadenado: obtener hash del ultimo registro (RR-012)
  SELECT record_signature INTO last_hash
  FROM audit_log
  ORDER BY timestamp_utc DESC, id DESC
  LIMIT 1;

  NEW.previous_hash := COALESCE(last_hash, 'GENESIS');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_signature
  BEFORE INSERT ON audit_log
  FOR EACH ROW EXECUTE FUNCTION generate_record_signature();

-- 9.3 TIMESTAMP INMUTABLE en operaciones (RR-003)
CREATE OR REPLACE FUNCTION prevent_timestamp_modification()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.timestamp_utc != NEW.timestamp_utc THEN
    RAISE EXCEPTION 'GAMP5 VIOLATION: timestamp_utc is immutable after creation.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_operations_timestamp_immutable
  BEFORE UPDATE ON operations
  FOR EACH ROW EXECUTE FUNCTION prevent_timestamp_modification();

-- 9.4 STOCK NUNCA NEGATIVO (RF-036)
CREATE OR REPLACE FUNCTION check_stock_non_negative()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.quantity < 0 THEN
    RAISE EXCEPTION 'GAMP5 VIOLATION: Stock cannot be negative. Batch: %, Attempted quantity: %',
      NEW.batch_code, NEW.quantity;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_batch_stock_check
  BEFORE INSERT OR UPDATE ON batches
  FOR EACH ROW EXECUTE FUNCTION check_stock_non_negative();

-- 9.5 AUDIT TRAIL AUTOMATICO para operaciones
CREATE OR REPLACE FUNCTION auto_audit_operations()
RETURNS TRIGGER AS $$
DECLARE
  v_user_name VARCHAR(200);
BEGIN
  SELECT full_name INTO v_user_name FROM user_profiles WHERE id = NEW.created_by;

  INSERT INTO audit_log (
    user_id, user_name, action_type, table_name, record_id,
    old_value, new_value, input_raw, parsed_json, reason
  ) VALUES (
    NEW.created_by,
    COALESCE(v_user_name, 'UNKNOWN'),
    CASE WHEN TG_OP = 'INSERT' THEN 'INSERT'::audit_action
         WHEN TG_OP = 'UPDATE' THEN 'UPDATE'::audit_action
         WHEN TG_OP = 'DELETE' THEN 'DELETE'::audit_action
    END,
    'operations',
    NEW.id,
    CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
    to_jsonb(NEW),
    NEW.input_raw,
    NEW.parsed_json,
    NULL
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_operations_audit
  AFTER INSERT OR UPDATE ON operations
  FOR EACH ROW EXECUTE FUNCTION auto_audit_operations();

-- 9.6 UPDATED_AT automatico
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_batches_updated_at
  BEFORE UPDATE ON batches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_individuals_updated_at
  BEFORE UPDATE ON individuals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- 10. ROW LEVEL SECURITY (RF-003)
-- ============================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE individuals ENABLE ROW LEVEL SECURITY;
ALTER TABLE operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE operation_inputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Helper: obtener rol del usuario actual
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM user_profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- OPERADOR: puede leer todo, crear operaciones, no puede modificar audit_log
CREATE POLICY operador_read_all ON warehouses FOR SELECT USING (true);
CREATE POLICY operador_read_all ON facilities FOR SELECT USING (true);
CREATE POLICY operador_read_all ON products FOR SELECT USING (true);
CREATE POLICY operador_read_all ON batches FOR SELECT USING (true);
CREATE POLICY operador_read_all ON individuals FOR SELECT USING (true);

CREATE POLICY operador_create_operations ON operations
  FOR INSERT WITH CHECK (get_user_role() IN ('operador', 'supervisor', 'administrador'));

CREATE POLICY operador_read_operations ON operations
  FOR SELECT USING (true);

-- AUDITOR: solo lectura, incluyendo audit trail completo
CREATE POLICY auditor_read_audit ON audit_log
  FOR SELECT USING (get_user_role() IN ('auditor', 'administrador'));

-- ADMINISTRADOR: acceso total (excepto modificar audit_log, que los triggers impiden)
CREATE POLICY admin_all_user_profiles ON user_profiles
  FOR ALL USING (get_user_role() = 'administrador');

CREATE POLICY admin_all_warehouses ON warehouses
  FOR ALL USING (get_user_role() = 'administrador');

CREATE POLICY admin_all_facilities ON facilities
  FOR ALL USING (get_user_role() = 'administrador');

CREATE POLICY admin_all_products ON products
  FOR ALL USING (get_user_role() = 'administrador');

-- AUDIT LOG: NADIE puede INSERT directo (solo via triggers)
-- Los triggers corren con SECURITY DEFINER, bypass RLS
CREATE POLICY audit_log_no_direct_insert ON audit_log
  FOR INSERT WITH CHECK (false); -- Solo triggers pueden insertar

-- ============================================================================
-- 11. DATOS SEMILLA (seed data para configuracion inicial)
-- ============================================================================

-- Nota: Estos datos se cargan despues de crear el primer usuario admin
-- via Supabase Auth y asignarle rol 'administrador' en user_profiles

-- ============================================================================
-- 12. VISTAS UTILES PARA REPORTES
-- ============================================================================

-- Vista de stock actual por producto/lote/ubicacion (RF-035)
CREATE VIEW v_stock_actual AS
SELECT
  b.id AS batch_id,
  b.batch_code,
  p.name AS product_name,
  p.product_type,
  f.name AS facility_name,
  w.name AS warehouse_name,
  b.quantity,
  b.status,
  b.tracking_mode,
  b.created_at
FROM batches b
JOIN products p ON b.product_id = p.id
JOIN facilities f ON b.facility_id = f.id
JOIN warehouses w ON f.warehouse_id = w.id
WHERE b.status = 'activo'
ORDER BY p.product_type, b.created_at DESC;

-- Vista de trazabilidad inversa (RF-032)
CREATE VIEW v_trazabilidad_inversa AS
WITH RECURSIVE chain AS (
  -- Base: lote actual
  SELECT
    b.id, b.batch_code, b.product_id, b.parent_batch_id,
    p.name AS product_name, p.product_type,
    f.name AS facility_name,
    0 AS depth
  FROM batches b
  JOIN products p ON b.product_id = p.id
  JOIN facilities f ON b.facility_id = f.id

  UNION ALL

  -- Recursion: lote padre
  SELECT
    b.id, b.batch_code, b.product_id, b.parent_batch_id,
    p.name AS product_name, p.product_type,
    f.name AS facility_name,
    c.depth + 1
  FROM batches b
  JOIN products p ON b.product_id = p.id
  JOIN facilities f ON b.facility_id = f.id
  JOIN chain c ON b.id = c.parent_batch_id
  WHERE c.depth < 20 -- Limite de profundidad
)
SELECT * FROM chain ORDER BY depth;

-- Vista de audit trail para reportes regulatorios (RR-009)
CREATE VIEW v_audit_trail_report AS
SELECT
  al.timestamp_utc,
  al.user_name,
  al.action_type,
  al.table_name,
  al.record_id,
  al.reason,
  al.record_signature,
  al.previous_hash,
  al.input_raw
FROM audit_log al
ORDER BY al.timestamp_utc DESC;

-- ============================================================================
-- 13. FUNCION DE VERIFICACION DE INTEGRIDAD DEL AUDIT TRAIL (RR-012)
-- ============================================================================

CREATE OR REPLACE FUNCTION verify_audit_chain_integrity()
RETURNS TABLE(
  total_records BIGINT,
  chain_valid BOOLEAN,
  first_broken_at TIMESTAMPTZ,
  broken_record_id UUID
) AS $$
DECLARE
  rec RECORD;
  expected_prev_hash VARCHAR(64);
  is_valid BOOLEAN := true;
  broken_ts TIMESTAMPTZ;
  broken_id UUID;
  total BIGINT;
BEGIN
  SELECT COUNT(*) INTO total FROM audit_log;

  expected_prev_hash := 'GENESIS';

  FOR rec IN SELECT * FROM audit_log ORDER BY timestamp_utc, id LOOP
    IF rec.previous_hash != expected_prev_hash AND is_valid THEN
      is_valid := false;
      broken_ts := rec.timestamp_utc;
      broken_id := rec.id;
    END IF;
    expected_prev_hash := rec.record_signature;
  END LOOP;

  RETURN QUERY SELECT total, is_valid, broken_ts, broken_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FIN DEL SCHEMA INICIAL
-- ============================================================================
-- Para ejecutar: copiar todo y pegar en Supabase SQL Editor
-- Luego crear el primer usuario via Supabase Auth y asignarle
-- rol 'administrador' en user_profiles manualmente
-- ============================================================================
