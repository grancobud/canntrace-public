-- ============================================================================
-- CannTrace v0.3 - Integraciones: pgAudit + OpenTHC + Mejoras
-- Fecha: 2026-04-16
-- ============================================================================
-- INTEGRACIONES:
--   1. pgAudit: audit logging a nivel de sesion/objeto (estandar industria)
--   2. OpenTHC: campos y estandares de la API cannabis open source
--   3. Tabla de variedades/cepas (inspirado en OpenTHC vdb)
--   4. Tabla de resultados de laboratorio (OpenTHC lab)
--   5. Tabla de etiquetas QR (inspirado en OpenTHC ULID)
--   6. Firma electronica mejorada (preparacion para Documenso)
-- ============================================================================

-- ============================================================================
-- 1. pgAudit - Habilitar en Supabase
-- ============================================================================
-- NOTA: En Supabase, ir a Database > Extensions > buscar "pgaudit" > Enable
-- Luego ejecutar esta configuracion:

-- Nivel de log: DDL + WRITE (no READ para evitar ruido)
-- ALTER SYSTEM SET pgaudit.log = 'ddl, write';
-- ALTER SYSTEM SET pgaudit.log_catalog = off;
-- ALTER SYSTEM SET pgaudit.log_relation = on;
-- ALTER SYSTEM SET pgaudit.log_statement_once = on;
-- SELECT pg_reload_conf();

-- COMENTARIO: pgAudit complementa nuestro registro_auditoria custom.
-- pgAudit registra a nivel de PostgreSQL (mas bajo nivel, dificil de manipular).
-- registro_auditoria registra a nivel de aplicacion (mas legible, con contexto de negocio).
-- Juntos proveen defensa en profundidad (GAMP5 best practice).

-- ============================================================================
-- 2. VARIEDADES / CEPAS (inspirado en OpenTHC/vdb)
-- ============================================================================
-- OpenTHC mantiene una base de datos de variedades de cannabis.
-- Agregamos esta tabla para vincular lotes a variedades especificas.

CREATE TABLE variedades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(200) NOT NULL,
  nombre_cientifico VARCHAR(200),
  tipo VARCHAR(50) CHECK (tipo IN ('sativa', 'indica', 'hibrido', 'ruderalis', 'cbd')),
  thc_porcentaje_tipico NUMERIC(5,2),
  cbd_porcentaje_tipico NUMERIC(5,2),
  descripcion TEXT,
  origen VARCHAR(200), -- Pais/region de origen
  codigo_openthc VARCHAR(50), -- Referencia al estandar OpenTHC si existe
  activo BOOLEAN NOT NULL DEFAULT true,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  creado_por UUID NOT NULL REFERENCES auth.users(id),
  eliminado BOOLEAN NOT NULL DEFAULT false
);

COMMENT ON TABLE variedades IS 'OpenTHC/vdb: Catalogo de variedades/cepas de cannabis con datos geneticos';

-- Vincular lotes a variedades
ALTER TABLE lotes ADD COLUMN variedad_id UUID REFERENCES variedades(id);

-- ============================================================================
-- 3. RESULTADOS DE LABORATORIO (inspirado en OpenTHC/lab)
-- ============================================================================
-- Requisito critico para compliance: vincular resultados de analisis a lotes.
-- La app de los videos mencionaba "resultado de analisis" en cuarentena
-- pero era texto libre. Esto lo estructura.

CREATE TABLE resultados_laboratorio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id UUID NOT NULL REFERENCES lotes(id),
  operacion_id UUID REFERENCES operaciones(id), -- Operacion de cuarentena asociada

  -- Laboratorio
  laboratorio_nombre VARCHAR(200) NOT NULL,
  laboratorio_codigo VARCHAR(100),
  numero_certificado VARCHAR(100),
  fecha_analisis DATE NOT NULL,
  fecha_recepcion DATE,

  -- Cannabinoides (% peso seco)
  thc_total NUMERIC(6,3),
  thc_delta9 NUMERIC(6,3),
  thca NUMERIC(6,3),
  cbd_total NUMERIC(6,3),
  cbda NUMERIC(6,3),
  cbg NUMERIC(6,3),
  cbn NUMERIC(6,3),

  -- Contaminantes
  pesticidas_aprobado BOOLEAN,
  metales_pesados_aprobado BOOLEAN,
  microbiologico_aprobado BOOLEAN,
  micotoxinas_aprobado BOOLEAN,
  solventes_residuales_aprobado BOOLEAN,

  -- Resultado general
  resultado_general VARCHAR(20) NOT NULL CHECK (resultado_general IN ('aprobado', 'rechazado', 'pendiente', 'condicional')),
  observaciones TEXT,

  -- Archivo del certificado
  archivo_certificado_url TEXT, -- URL en Supabase Storage

  -- Datos completos del analisis (JSON para flexibilidad)
  datos_completos JSONB DEFAULT '{}',

  -- Audit
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  creado_por UUID NOT NULL REFERENCES auth.users(id),
  verificado_por UUID REFERENCES auth.users(id),
  verificado_en TIMESTAMPTZ,

  -- Firma
  firma_registro VARCHAR(64)
);

COMMENT ON TABLE resultados_laboratorio IS 'OpenTHC/lab: Resultados de analisis vinculados a lotes con certificados';
CREATE INDEX idx_resultados_lab_lote ON resultados_laboratorio(lote_id);
CREATE INDEX idx_resultados_lab_resultado ON resultados_laboratorio(resultado_general);

-- Audit trail automatico para resultados de lab
CREATE TRIGGER trg_historial_resultados_lab
  AFTER INSERT OR UPDATE OR DELETE ON resultados_laboratorio
  FOR EACH ROW EXECUTE FUNCTION registrar_historial_cambios();

-- ============================================================================
-- 4. ETIQUETAS QR (gestion de codigos)
-- ============================================================================
-- Inspirado en OpenTHC que usa ULIDs para identificadores unicos.
-- Esta tabla gestiona las etiquetas fisicas (QR) y su estado.

CREATE TABLE etiquetas_qr (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(100) NOT NULL UNIQUE, -- El valor codificado en el QR
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('individuo', 'lote', 'insumo')),

  -- Vinculacion (solo uno puede estar lleno)
  individuo_id UUID REFERENCES individuos(id),
  lote_id UUID REFERENCES lotes(id),

  -- Estado
  estado VARCHAR(20) NOT NULL DEFAULT 'disponible'
    CHECK (estado IN ('disponible', 'asignada', 'usada', 'anulada')),

  -- Rango (para generacion por lotes de etiquetas)
  rango_inicio VARCHAR(100),
  rango_fin VARCHAR(100),

  -- Metadata
  impresa BOOLEAN NOT NULL DEFAULT false,
  fecha_impresion TIMESTAMPTZ,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  creado_por UUID NOT NULL REFERENCES auth.users(id)
);

COMMENT ON TABLE etiquetas_qr IS 'RF-012/RF-014: Gestion de etiquetas QR con estados y rangos';
CREATE INDEX idx_etiquetas_estado ON etiquetas_qr(estado);
CREATE INDEX idx_etiquetas_individuo ON etiquetas_qr(individuo_id);
CREATE INDEX idx_etiquetas_lote ON etiquetas_qr(lote_id);

-- ============================================================================
-- 5. FIRMA ELECTRONICA MEJORADA (preparacion para Documenso)
-- ============================================================================
-- Tabla separada para firmas electronicas formales (21 CFR Part 11).
-- Cuando integremos Documenso, esta tabla almacena las referencias.

CREATE TABLE firmas_electronicas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Que se firma
  nombre_tabla VARCHAR(100) NOT NULL,
  id_registro UUID NOT NULL,

  -- Quien firma
  firmante_id UUID NOT NULL REFERENCES auth.users(id),
  nombre_firmante VARCHAR(200) NOT NULL,
  rol_firmante rol_usuario NOT NULL,

  -- Significado de la firma (requerido por 21 CFR Part 11)
  significado VARCHAR(100) NOT NULL CHECK (significado IN (
    'creacion', 'aprobacion', 'verificacion', 'revision',
    'liberacion', 'anulacion', 'correccion'
  )),

  -- Hash del contenido firmado
  hash_contenido VARCHAR(64) NOT NULL, -- SHA-256 del registro al momento de firmar
  algoritmo VARCHAR(20) NOT NULL DEFAULT 'SHA-256',

  -- Autenticacion (los 2 componentes de 21 CFR Part 11)
  metodo_autenticacion VARCHAR(50) NOT NULL DEFAULT 'password',
  -- En futuro con Documenso: 'documenso_api', 'passkey', etc.

  -- Referencia externa (para cuando se integre Documenso)
  documenso_signature_id VARCHAR(200),
  documenso_document_id VARCHAR(200),

  -- Timestamp (del servidor, no editable)
  firmado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Inmutable: no se puede modificar una firma
  CONSTRAINT chk_firma_inmutable CHECK (true) -- El trigger lo protege
);

COMMENT ON TABLE firmas_electronicas IS 'RR-011/21 CFR Part 11: Firmas electronicas con significado, hash y autenticacion dual';
CREATE INDEX idx_firmas_tabla_registro ON firmas_electronicas(nombre_tabla, id_registro);
CREATE INDEX idx_firmas_firmante ON firmas_electronicas(firmante_id);

-- Inmutabilidad de firmas
CREATE TRIGGER trg_firmas_inmutable_update
  BEFORE UPDATE ON firmas_electronicas
  FOR EACH ROW EXECUTE FUNCTION impedir_modificacion_auditoria();

CREATE TRIGGER trg_firmas_inmutable_delete
  BEFORE DELETE ON firmas_electronicas
  FOR EACH ROW EXECUTE FUNCTION impedir_modificacion_auditoria();

-- ============================================================================
-- 6. TABLA DE CONFIGURACION DEL SISTEMA (para compliance pluggable)
-- ============================================================================

CREATE TABLE configuracion_sistema (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clave VARCHAR(100) NOT NULL UNIQUE,
  valor TEXT NOT NULL,
  tipo VARCHAR(20) NOT NULL DEFAULT 'texto' CHECK (tipo IN ('texto', 'numero', 'booleano', 'json')),
  descripcion TEXT,
  categoria VARCHAR(50) NOT NULL DEFAULT 'general',
  modificable BOOLEAN NOT NULL DEFAULT true,
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_por UUID REFERENCES auth.users(id)
);

COMMENT ON TABLE configuracion_sistema IS 'Configuracion global del sistema (jurisdiccion, parametros, etc.)';

-- Configuracion inicial
INSERT INTO configuracion_sistema (clave, valor, tipo, descripcion, categoria) VALUES
  ('jurisdiccion', 'argentina', 'texto', 'Jurisdiccion regulatoria principal', 'compliance'),
  ('marco_regulatorio', 'ANMAT_4159_2023', 'texto', 'Marco regulatorio aplicable', 'compliance'),
  ('retencion_datos_anos', '5', 'numero', 'Anos minimos de retencion de datos', 'compliance'),
  ('version_gamp5', '2da_edicion_2022', 'texto', 'Version de GAMP5 aplicada', 'compliance'),
  ('firma_electronica_activa', 'true', 'booleano', 'Requiere firma electronica en operaciones criticas', 'seguridad'),
  ('ia_activa', 'true', 'booleano', 'Habilitar procesamiento IA de texto', 'funcional'),
  ('ia_modelo', 'llama-3.1-8b', 'texto', 'Modelo de IA para estructuracion de texto', 'funcional'),
  ('ia_proveedor', 'groq', 'texto', 'Proveedor de API de IA', 'funcional'),
  ('ia_confianza_minima', '0.7', 'numero', 'Confianza minima para aceptar resultado IA (RF-010)', 'funcional'),
  ('zona_horaria', 'America/Argentina/Buenos_Aires', 'texto', 'Zona horaria para display (DB siempre UTC)', 'general'),
  ('idioma', 'es', 'texto', 'Idioma de la interfaz', 'general'),
  ('modo_offline', 'true', 'booleano', 'Habilitar modo offline con sync', 'funcional');

-- Historial de cambios en configuracion
CREATE TRIGGER trg_historial_configuracion
  AFTER INSERT OR UPDATE OR DELETE ON configuracion_sistema
  FOR EACH ROW EXECUTE FUNCTION registrar_historial_cambios();

-- ============================================================================
-- 7. VISTAS ADICIONALES
-- ============================================================================

-- Vista de operaciones recientes con detalle
CREATE VIEW vista_operaciones_recientes AS
SELECT
  o.id,
  o.tipo_operacion,
  o.estado,
  o.fecha_operacion,
  o.cantidad_entrada,
  o.cantidad_salida,
  o.peso_fresco_kg,
  o.responsable,
  o.observaciones,
  o.texto_original,
  pu.nombre_completo AS creado_por_nombre,
  io.nombre AS instalacion_origen,
  id.nombre AS instalacion_destino,
  lo.codigo_lote AS lote_origen_codigo,
  ld.codigo_lote AS lote_destino_codigo
FROM operaciones o
LEFT JOIN perfiles_usuario pu ON o.creado_por = pu.id
LEFT JOIN instalaciones io ON o.instalacion_origen_id = io.id
LEFT JOIN instalaciones id ON o.instalacion_destino_id = id.id
LEFT JOIN lotes lo ON o.lote_origen_id = lo.id
LEFT JOIN lotes ld ON o.lote_destino_id = ld.id
ORDER BY o.fecha_operacion DESC;

COMMENT ON VIEW vista_operaciones_recientes IS 'Vista enriquecida de operaciones con nombres legibles';

-- Vista de resultados de lab por lote
CREATE VIEW vista_resultados_lab AS
SELECT
  rl.id,
  l.codigo_lote,
  p.nombre AS producto,
  v.nombre AS variedad,
  rl.laboratorio_nombre,
  rl.fecha_analisis,
  rl.thc_total,
  rl.cbd_total,
  rl.resultado_general,
  rl.numero_certificado
FROM resultados_laboratorio rl
JOIN lotes l ON rl.lote_id = l.id
JOIN productos p ON l.producto_id = p.id
LEFT JOIN variedades v ON l.variedad_id = v.id
ORDER BY rl.fecha_analisis DESC;

COMMENT ON VIEW vista_resultados_lab IS 'Resultados de laboratorio con datos de lote y variedad';

-- ============================================================================
-- 8. RLS para nuevas tablas
-- ============================================================================

ALTER TABLE variedades ENABLE ROW LEVEL SECURITY;
ALTER TABLE resultados_laboratorio ENABLE ROW LEVEL SECURITY;
ALTER TABLE etiquetas_qr ENABLE ROW LEVEL SECURITY;
ALTER TABLE firmas_electronicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion_sistema ENABLE ROW LEVEL SECURITY;

-- Lectura general
CREATE POLICY lectura_variedades ON variedades FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY lectura_resultados_lab ON resultados_laboratorio FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY lectura_etiquetas ON etiquetas_qr FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY lectura_config ON configuracion_sistema FOR SELECT USING (auth.uid() IS NOT NULL);

-- Firmas: todos pueden leer, nadie puede modificar (triggers lo impiden)
CREATE POLICY lectura_firmas ON firmas_electronicas FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY crear_firmas ON firmas_electronicas
  FOR INSERT WITH CHECK (firmante_id = auth.uid()); -- Solo podes firmar como vos mismo

-- Admin: gestion de variedades, config, etiquetas
CREATE POLICY admin_variedades ON variedades FOR ALL
  USING (obtener_rol_usuario() = 'administrador');
CREATE POLICY admin_config ON configuracion_sistema FOR ALL
  USING (obtener_rol_usuario() = 'administrador');
CREATE POLICY admin_etiquetas ON etiquetas_qr FOR ALL
  USING (obtener_rol_usuario() IN ('administrador', 'supervisor'));

-- Supervisor puede crear resultados de lab
CREATE POLICY crear_resultados_lab ON resultados_laboratorio
  FOR INSERT WITH CHECK (obtener_rol_usuario() IN ('supervisor', 'administrador'));

-- ============================================================================
-- FIN - CannTrace v0.3 (Integraciones)
-- Tablas nuevas: 5 (variedades, resultados_laboratorio, etiquetas_qr,
--                    firmas_electronicas, configuracion_sistema)
-- Total acumulado: 16 tablas, 20+ triggers, 5 vistas, 8+ funciones
-- ============================================================================
