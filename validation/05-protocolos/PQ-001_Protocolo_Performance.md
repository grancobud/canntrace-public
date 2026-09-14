# PROTOCOLO DE CUALIFICACION DE DESEMPENO (PQ)

| Campo | Valor |
|---|---|
| **Documento** | PQ-001 |
| **Version** | 0.1 |
| **Fecha** | 2026-04-16 |
| **Sistema** | CannTrace - Sistema de Trazabilidad Seed-to-Sale |
| **Clasificacion GAMP5** | Categoria 5 - Aplicacion Personalizada |
| **Estado** | BORRADOR |

---

## 1. OBJETIVO

Verificar que el sistema CannTrace funciona de manera confiable y consistente bajo condiciones reales de operacion, incluyendo flujos completos de trazabilidad seed-to-sale, generacion de reportes, rendimiento bajo carga y cumplimiento integral ALCOA+ en un entorno que simula la operacion productiva real.

Este protocolo complementa la Cualificacion Operacional (OQ-001) al evaluar el sistema como un todo integrado, no como funciones individuales.

---

## 2. ALCANCE

- Flujos completos de autenticacion en condiciones reales
- Ciclo de vida completo seed-to-sale (16 operaciones encadenadas)
- Generacion de reportes regulatorios (PDF y CSV)
- Rendimiento del sistema bajo carga concurrente
- Cumplimiento ALCOA+ de extremo a extremo
- Respaldo y restauracion de datos
- Integridad de la cadena de auditoria

---

## 3. REFERENCIAS

| Codigo | Documento |
|---|---|
| URS-001 | Especificacion de Requerimientos de Usuario |
| DS-001 | Especificacion de Diseno del Sistema |
| VP-001 | Plan Maestro de Validacion |
| IQ-001 | Protocolo de Cualificacion de Instalacion (ejecutado) |
| OQ-001 | Protocolo de Cualificacion Operacional (ejecutado) |
| RA-001 | Evaluacion de Riesgos |

---

## 4. RESPONSABILIDADES

| Rol | Responsabilidad |
|---|---|
| **Responsable de Validacion** | Coordinacion general, redaccion y aprobacion del protocolo |
| **Operadores de Produccion** | Ejecucion de flujos seed-to-sale con datos reales |
| **Administrador de Sistemas** | Ejecucion de pruebas de carga y rendimiento |
| **Responsable de Calidad (QA)** | Verificacion de cumplimiento ALCOA+, revision de resultados |
| **Responsable Regulatorio** | Validacion de reportes generados vs. formato regulatorio |

---

## 5. PRERREQUISITOS

| # | Prerrequisito | Verificado | Firma | Fecha |
|---|---|---|---|---|
| 1 | Protocolo IQ-001 ejecutado y aprobado | ☐ | | |
| 2 | Protocolo OQ-001 ejecutado y aprobado | ☐ | | |
| 3 | Datos de prueba representativos preparados (lotes, plantas, operaciones) | ☐ | | |
| 4 | Usuarios de prueba creados con roles asignados (operador, supervisor, admin, auditor) | ☐ | | |
| 5 | Herramientas de prueba de carga disponibles (k6, Artillery o equivalente) | ☐ | | |
| 6 | Entorno de prueba aislado o entorno de staging disponible | ☐ | | |
| 7 | Criterios de rendimiento definidos y aprobados (tiempos de respuesta objetivo) | ☐ | | |

---

## 6. PROCEDIMIENTO DE EJECUCION

### 6.1 Instrucciones Generales

1. Las pruebas PQ-004 a PQ-008 deben ejecutarse secuencialmente ya que representan un flujo continuo.
2. Las pruebas de carga (PQ-011 a PQ-014) deben ejecutarse en un entorno controlado para evitar afectar otros servicios.
3. Registrar capturas de pantalla, logs y metricas como evidencia adjunta.
4. Todo resultado debe registrarse en el momento de la ejecucion, sin alteraciones posteriores.
5. En caso de falla, documentar la desviacion en la Seccion 8 antes de continuar.

---

## 7. CASOS DE PRUEBA

### Modulo A - Rendimiento de Autenticacion

| ID | Descripcion | Pasos | Criterio de Aceptacion | Resultado Esperado | Resultado Real | PASA/FALLA | Ejecutor | Fecha |
|---|---|---|---|---|---|---|---|---|
| PQ-001 | Tiempo de respuesta de login bajo condiciones normales | 1. Abrir la aplicacion desde el navegador. 2. Ingresar credenciales validas de un usuario operador. 3. Medir el tiempo desde el envio del formulario hasta la carga completa del dashboard. Repetir 5 veces y promediar. | Tiempo promedio de login < 3 segundos | El usuario accede al dashboard en menos de 3 segundos en promedio. La sesion JWT se genera correctamente. | | | | |
| PQ-002 | Login concurrente de multiples usuarios | 1. Preparar 10 cuentas de usuario con diferentes roles. 2. Ejecutar login simultaneo de las 10 cuentas usando herramienta de prueba. 3. Verificar que todas las sesiones se crean correctamente. | 100% de logins exitosos con tiempo < 5 segundos cada uno | Las 10 sesiones se crean sin errores. Ningun usuario recibe error de autenticacion. Los roles se asignan correctamente en cada sesion. | | | | |
| PQ-003 | Persistencia de sesion y reconexion | 1. Iniciar sesion como operador. 2. Mantener la sesion inactiva durante el periodo maximo configurado menos 1 minuto. 3. Realizar una accion. 4. Esperar a que la sesion expire. 5. Verificar redireccion al login. 6. Reiniciar sesion y verificar acceso. | La sesion se mantiene activa durante el periodo configurado. Tras expirar, se requiere re-autenticacion. | La sesion permanece activa durante la inactividad dentro del periodo. Tras expiracion, el sistema redirige al login. El re-login es exitoso y restaura el contexto del usuario. | | | | |

### Modulo B - Flujo Completo Seed-to-Sale

| ID | Descripcion | Pasos | Criterio de Aceptacion | Resultado Esperado | Resultado Real | PASA/FALLA | Ejecutor | Fecha |
|---|---|---|---|---|---|---|---|---|
| PQ-004 | Registro de semilla y creacion de lote inicial | 1. Iniciar sesion como operador. 2. Via chat, registrar: "Recibimos 100 semillas de la variedad Charlotte's Web, proveedor SeedBank AR, lote proveedor SB-2026-001". 3. Confirmar la operacion. 4. Verificar creacion del lote, QR generado y registro en audit_log. | Se crea el lote con todos los campos, se genera QR unico, se registra en audit_log con hash, firma y timestamp | Lote creado con ID unico, variedad, proveedor, cantidad. Codigo QR generado y asociado. Registro de audit_log con usuario, accion, timestamp, hash SHA-256. Stock actualizado: +100 semillas. | | | | |
| PQ-005 | Germinacion y trasplante (operaciones encadenadas) | 1. Registrar germinacion de 95 semillas del lote anterior (5 descartadas). 2. Registrar trasplante de 95 plantines a macetas individuales. 3. Verificar trazabilidad: las operaciones se vinculan al lote original. 4. Verificar stock: semillas -95, plantines +95. | Cada operacion se vincula al lote padre. Stock refleja los movimientos. Audit trail completo. | Operacion de germinacion registrada con referencia al lote original. Operacion de trasplante registrada con referencia a germinacion. Stock de semillas: 5 (100-95). Stock de plantines: 95. Audit trail: 2 registros nuevos con hash chain valido. | | | | |
| PQ-006 | Ciclo vegetativo, floracion y cosecha | 1. Registrar inicio de fase vegetativa para las 95 plantas. 2. Registrar transicion a floracion (90 plantas, 5 descartadas por defecto). 3. Registrar cosecha: peso humedo total 45 kg. 4. Verificar trazabilidad completa desde semilla hasta cosecha. | Cada fase se registra con datos completos. La trazabilidad inversa muestra toda la cadena. | Fase vegetativa: 95 plantas registradas. Floracion: 90 plantas, 5 descartadas con motivo documentado. Cosecha: 45 kg peso humedo, asociado a las 90 plantas. Trazabilidad inversa funcional desde cosecha hasta semilla. | | | | |
| PQ-007 | Secado, curado, procesamiento y empaquetado | 1. Registrar secado: 45 kg humedo -> 12 kg seco. 2. Registrar curado: 12 kg durante 14 dias. 3. Registrar procesamiento/trimming: 12 kg -> 10 kg producto final. 4. Registrar empaquetado: 200 unidades de 50g cada una. 5. Verificar que stock refleja cada transformacion. | Las mermas se calculan y registran correctamente. Stock actualizado en cada paso. | Secado: merma 73.3% registrada. Curado: sin merma, periodo registrado. Procesamiento: merma 16.7% registrada, trim separado. Empaquetado: 200 unidades * 50g = 10 kg. Stock final: 200 unidades de producto terminado. | | | | |
| PQ-008 | Despacho y trazabilidad completa extremo a extremo | 1. Registrar despacho de 50 unidades al dispensario "Farmacia Central". 2. Escanear QR de una unidad despachada. 3. Ejecutar trazabilidad inversa desde esa unidad hasta la semilla original. 4. Verificar que cada paso intermedio es visible y verificable. | La trazabilidad muestra la cadena completa. Cada nodo tiene datos, responsable y timestamp. | Despacho registrado: 50 unidades, destino, numero de remito. Stock actualizado: 150 unidades restantes. Trazabilidad inversa de la unidad muestra: despacho <- empaquetado <- procesamiento <- curado <- secado <- cosecha <- floracion <- vegetativo <- trasplante <- germinacion <- recepcion semilla. Todos los nodos tienen: usuario, fecha/hora, hash verificable. | | | | |

### Modulo C - Generacion de Reportes

| ID | Descripcion | Pasos | Criterio de Aceptacion | Resultado Esperado | Resultado Real | PASA/FALLA | Ejecutor | Fecha |
|---|---|---|---|---|---|---|---|---|
| PQ-009 | Generacion de reporte PDF regulatorio | 1. Acceder al modulo de reportes como supervisor. 2. Seleccionar reporte de trazabilidad completa para el lote de prueba. 3. Generar PDF. 4. Medir tiempo de generacion. 5. Verificar contenido, formato y hash de integridad. | PDF generado en < 10 segundos. Contiene todos los datos del lote. Hash de integridad incluido. | PDF generado correctamente con: encabezado regulatorio, datos del lote completo, cadena de trazabilidad, firmas electronicas, hash SHA-256 del documento, pie de pagina con fecha de generacion y numero de pagina. Tiempo de generacion < 10 segundos. | | | | |
| PQ-010 | Exportacion CSV de datos operacionales | 1. Acceder al modulo de reportes como supervisor. 2. Seleccionar exportacion de operaciones del ultimo mes. 3. Generar CSV. 4. Abrir el archivo y verificar estructura y datos. 5. Verificar que los datos coinciden con los registros de la base de datos. | CSV generado correctamente. Datos coinciden con la base de datos. Formato compatible con Excel. | CSV generado con: encabezados descriptivos, separador adecuado (coma o punto y coma), codificacion UTF-8, todos los campos de las operaciones, datos que coinciden 100% con los registros de base de datos. | | | | |

### Modulo D - Rendimiento Bajo Carga

| ID | Descripcion | Pasos | Criterio de Aceptacion | Resultado Esperado | Resultado Real | PASA/FALLA | Ejecutor | Fecha |
|---|---|---|---|---|---|---|---|---|
| PQ-011 | Tiempo de respuesta de API bajo carga normal | 1. Configurar herramienta de carga con 10 usuarios virtuales concurrentes. 2. Ejecutar operaciones CRUD mixtas durante 5 minutos. 3. Medir tiempos de respuesta (p50, p95, p99). | p95 < 2 segundos para operaciones de lectura. p95 < 5 segundos para operaciones de escritura. | Metricas de respuesta dentro de los umbrales. Sin errores 5xx. Tasa de exito > 99%. Registro correcto en audit_log para cada operacion de escritura. | | | | |
| PQ-012 | Rendimiento de consultas de trazabilidad | 1. Con 1000+ registros en la base de datos, ejecutar consulta de trazabilidad inversa completa. 2. Medir tiempo de respuesta. 3. Repetir 10 veces y promediar. | Tiempo promedio de consulta de trazabilidad < 3 segundos | La consulta de trazabilidad inversa completa (10+ nodos) se resuelve en menos de 3 segundos en promedio. Los datos devueltos son correctos y completos. | | | | |
| PQ-013 | Prueba de estres: operaciones simultaneas | 1. Configurar 25 usuarios virtuales concurrentes. 2. Cada usuario ejecuta un flujo de registro de operacion via chat. 3. Ejecutar durante 10 minutos. 4. Verificar integridad de datos post-prueba. | Sin perdida de datos. Sin registros duplicados. Audit trail integro. | Todas las operaciones se registran correctamente. No hay registros duplicados en la base de datos. La cadena de hash del audit trail se mantiene integra. Tasa de error < 1%. | | | | |
| PQ-014 | Tiempo de carga de dashboard con datos reales | 1. Con la base de datos poblada con datos de prueba (1000+ operaciones, 100+ lotes). 2. Iniciar sesion como diferentes roles (operador, supervisor, admin). 3. Medir tiempo de carga del dashboard para cada rol. | Dashboard carga completamente en < 5 segundos para cualquier rol | Dashboard del operador carga en < 5s. Dashboard del supervisor carga en < 5s (incluye metricas agregadas). Dashboard del admin carga en < 5s (incluye indicadores de sistema). Todos los graficos y contadores muestran datos correctos. | | | | |

### Modulo E - Cumplimiento ALCOA+ de Extremo a Extremo

| ID | Descripcion | Pasos | Criterio de Aceptacion | Resultado Esperado | Resultado Real | PASA/FALLA | Ejecutor | Fecha |
|---|---|---|---|---|---|---|---|---|
| PQ-015 | Verificacion ALCOA+ del flujo seed-to-sale completo | 1. Revisar todos los registros de audit_log generados durante las pruebas PQ-004 a PQ-008. 2. Verificar cada atributo ALCOA+ para cada registro. 3. Documentar cumplimiento por atributo. | 100% de registros cumplen con los 9 atributos ALCOA+ | **Attributable**: Cada registro tiene user_id vinculado a usuario verificado. **Legible**: Todos los campos son legibles y comprensibles. **Contemporaneo**: Timestamps dentro de 5 segundos de la accion real. **Original**: Registros son primera captura, no copias. **Accurate**: Datos coinciden con la operacion realizada. **+Complete**: No hay campos nulos en campos obligatorios. **+Consistent**: Formato uniforme en todos los registros. **+Enduring**: Registros persisten tras cierre de sesion y reinicio. **+Available**: Registros accesibles para auditoria en todo momento. | | | | |
| PQ-016 | Inmutabilidad y cadena de hash del audit trail | 1. Obtener los primeros 50 registros del audit_log. 2. Para cada registro, recalcular el hash SHA-256 usando los campos originales. 3. Verificar que el hash calculado coincide con el almacenado. 4. Verificar que cada registro referencia al hash del registro anterior (chain). 5. Intentar modificar un registro directamente en la base de datos. | 100% de hashes verificados. Cadena integra. Modificacion directa bloqueada. | Todos los hashes recalculados coinciden con los almacenados. La cadena de hashes es continua sin interrupciones. El intento de modificacion directa es rechazado por el trigger de proteccion o genera una alerta detectable. | | | | |

### Modulo F - Respaldo y Recuperacion

| ID | Descripcion | Pasos | Criterio de Aceptacion | Resultado Esperado | Resultado Real | PASA/FALLA | Ejecutor | Fecha |
|---|---|---|---|---|---|---|---|---|
| PQ-017 | Backup y restauracion de datos | 1. Registrar el estado actual de la base de datos (conteos de tablas, ultimo registro). 2. Ejecutar backup manual o verificar backup automatico reciente. 3. Agregar 5 registros nuevos de prueba. 4. Restaurar el backup anterior en un entorno de prueba separado. 5. Verificar que el entorno restaurado refleja el estado pre-backup. | Backup se ejecuta sin errores. Restauracion recupera datos completos. Datos post-backup no aparecen en la restauracion. | Backup generado correctamente con tamano > 0. Restauracion exitosa en entorno de prueba. Conteos de tablas coinciden con el estado original. Los 5 registros nuevos no existen en la restauracion. Integridad de la cadena de audit trail verificada post-restauracion. | | | | |

### Modulo G - Verificacion de Integridad de Cadena de Auditoria

| ID | Descripcion | Pasos | Criterio de Aceptacion | Resultado Esperado | Resultado Real | PASA/FALLA | Ejecutor | Fecha |
|---|---|---|---|---|---|---|---|---|
| PQ-018 | Verificacion integral de la cadena de auditoria completa | 1. Ejecutar script o procedimiento de verificacion de integridad sobre la totalidad del audit_log. 2. Verificar secuencia de IDs (sin gaps inesperados). 3. Verificar cadena de hashes completa. 4. Verificar que todos los registros tienen firma electronica valida. 5. Generar reporte de integridad. | 0 inconsistencias detectadas. Cadena de hashes 100% integra. Todas las firmas validas. | El script de verificacion recorre todos los registros del audit_log. Secuencia de IDs: continua, sin gaps (o gaps documentados por operaciones de sistema). Cadena de hashes: cada hash_anterior coincide con el hash del registro previo. Firmas electronicas: todas validas y vinculadas a usuarios activos. Reporte de integridad generado con resultado: "CADENA INTEGRA - 0 anomalias detectadas". | | | | |

---

## 8. REGISTRO DE DESVIACIONES

### Desviacion #___

| Campo | Detalle |
|---|---|
| **Caso de prueba afectado** | |
| **Descripcion de la desviacion** | |
| **Impacto evaluado** | ☐ Critico ☐ Mayor ☐ Menor |
| **Causa raiz identificada** | |
| **Accion correctiva propuesta** | |
| **Responsable de la accion** | |
| **Fecha limite de resolucion** | |
| **Estado** | ☐ Abierta ☐ En progreso ☐ Resuelta ☐ Cerrada |
| **Verificacion de cierre** | |
| **Firma de verificacion** | |
| **Fecha de cierre** | |

*(Copiar esta plantilla para cada desviacion adicional)*

---

## 9. RESUMEN DE RESULTADOS

| Metrica | Valor |
|---|---|
| **Total de casos de prueba** | 18 |
| **Casos PASA** | ___/18 |
| **Casos FALLA** | ___/18 |
| **Desviaciones abiertas** | ___ |
| **Desviaciones resueltas** | ___ |

### Resumen por Modulo

| Modulo | Casos | PASA | FALLA |
|---|---|---|---|
| A - Rendimiento de Autenticacion | 3 | | |
| B - Flujo Seed-to-Sale | 5 | | |
| C - Generacion de Reportes | 2 | | |
| D - Rendimiento Bajo Carga | 4 | | |
| E - Cumplimiento ALCOA+ | 2 | | |
| F - Respaldo y Recuperacion | 1 | | |
| G - Integridad Cadena Auditoria | 1 | | |

### Conclusion

☐ **APROBADO** - Todos los casos de prueba de desempeno pasaron satisfactoriamente. El sistema CannTrace demuestra funcionamiento confiable y consistente bajo condiciones reales de operacion. Se autoriza la liberacion del sistema para uso productivo.

☐ **APROBADO CON DESVIACIONES** - Se identificaron desviaciones que no afectan la integridad de datos ni la seguridad del paciente. Las desviaciones estan documentadas y las acciones correctivas completadas o planificadas. Se autoriza la liberacion del sistema con condiciones.

☐ **RECHAZADO** - Se identificaron deficiencias criticas en el desempeno del sistema. Se requieren correcciones y re-ejecucion parcial o total del protocolo antes de autorizar la liberacion.

---

## 10. FIRMAS DE APROBACION

| Rol | Nombre | Firma | Fecha |
|---|---|---|---|
| **Ejecutor de Pruebas** | | | |
| **Revisor Tecnico** | | | |
| **Responsable de Validacion** | | | |
| **Responsable de Calidad (QA)** | | | |
| **Responsable Regulatorio** | | | |

---

*Fin del documento PQ-001 v0.1*
