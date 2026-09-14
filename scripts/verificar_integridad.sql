-- ============================================================================
-- CannTrace - Script de Verificacion de Integridad
-- Inspirado en: shtracer + immudb chain verification
-- Ejecutar periodicamente o antes de cada auditoria
-- ============================================================================

-- 1. VERIFICAR CADENA DE HASHES DEL AUDIT TRAIL
SELECT * FROM verificar_integridad_cadena();

-- 2. CONTAR REGISTROS DE AUDITORIA vs OPERACIONES
-- (Cada operacion debe tener al menos 1 registro de auditoria)
SELECT
  'operaciones' AS tabla,
  COUNT(*) AS total_registros,
  (SELECT COUNT(*) FROM registro_auditoria WHERE nombre_tabla = 'operaciones') AS total_en_auditoria,
  CASE
    WHEN COUNT(*) <= (SELECT COUNT(*) FROM registro_auditoria WHERE nombre_tabla = 'operaciones')
    THEN 'OK'
    ELSE 'ALERTA: Operaciones sin registro de auditoria'
  END AS estado
FROM operaciones;

-- 3. VERIFICAR QUE NO HAY STOCK NEGATIVO
SELECT
  l.codigo_lote,
  p.nombre AS producto,
  l.cantidad,
  CASE WHEN l.cantidad < 0 THEN 'VIOLACION GAMP5' ELSE 'OK' END AS estado
FROM lotes l
JOIN productos p ON l.producto_id = p.id
WHERE l.cantidad < 0;

-- 4. VERIFICAR TIMESTAMPS NO FUTUROS
SELECT
  id,
  tipo_operacion,
  fecha_operacion,
  'ALERTA: Timestamp en el futuro' AS problema
FROM operaciones
WHERE fecha_operacion > NOW() + INTERVAL '1 minute';

-- 5. VERIFICAR FIRMAS ELECTRONICAS
-- (Cada operacion confirmada debe tener firma)
SELECT
  o.id,
  o.tipo_operacion,
  o.estado,
  o.firma_registro,
  CASE
    WHEN o.estado = 'confirmada' AND o.firma_registro IS NULL
    THEN 'FALTA FIRMA'
    ELSE 'OK'
  END AS estado_firma
FROM operaciones o
WHERE o.estado = 'confirmada' AND o.firma_registro IS NULL;

-- 6. VERIFICAR USUARIOS CON SESIONES ACTIVAS ANOMALAS
-- (Sesiones activas de mas de 24 horas)
SELECT
  s.id,
  pu.nombre_completo,
  s.inicio,
  NOW() - s.inicio AS duracion,
  'ALERTA: Sesion de mas de 24h' AS problema
FROM sesiones s
JOIN perfiles_usuario pu ON s.usuario_id = pu.id
WHERE s.activa = true AND s.inicio < NOW() - INTERVAL '24 hours';

-- 7. RESUMEN DE INTEGRIDAD
SELECT
  (SELECT COUNT(*) FROM registro_auditoria) AS total_registros_auditoria,
  (SELECT COUNT(*) FROM operaciones) AS total_operaciones,
  (SELECT COUNT(*) FROM lotes WHERE estado = 'activo') AS lotes_activos,
  (SELECT COUNT(*) FROM individuos WHERE estado = 'activo') AS individuos_activos,
  (SELECT COUNT(*) FROM firmas_electronicas) AS total_firmas,
  (SELECT cadena_valida FROM verificar_integridad_cadena()) AS cadena_hashes_integra,
  NOW() AS verificado_en;
