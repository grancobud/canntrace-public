# FMEA-001: Evaluacion de Riesgos - CannTrace PWA

---

## CARATULA

| Campo | Detalle |
|---|---|
| **ID Documento** | FMEA-001 |
| **Titulo** | Analisis de Modos de Falla y Efectos (FMEA) - Sistema CannTrace |
| **Version** | 0.1 |
| **Fecha** | 2026-04-16 |
| **Estado** | Borrador |
| **Clasificacion GAMP5** | Categoria 5 - Aplicacion Personalizada |
| **Sistema** | CannTrace - PWA de Trazabilidad de Cannabis |
| **Alcance** | Todos los modulos del sistema (8 modulos) |
| **Normativa Aplicable** | ICH Q9 (Quality Risk Management), ISPE GAMP5, 21 CFR Part 11 |
| **Preparado por** | Equipo de Validacion |
| **Revisado por** | QA Manager |
| **Aprobado por** | Responsable de Calidad |

### Historial de Versiones

| Version | Fecha | Autor | Descripcion del Cambio |
|---|---|---|---|
| 0.1 | 2026-04-16 | Equipo de Validacion | Creacion inicial del documento |

---

## 1. OBJETIVO

Identificar, evaluar y priorizar los riesgos asociados a los modos de falla del sistema CannTrace PWA, aplicando la metodologia FMEA conforme a ICH Q9 y GAMP5. El objetivo es garantizar que todos los riesgos que puedan afectar la integridad de datos, la trazabilidad seed-to-sale y el cumplimiento regulatorio sean identificados, evaluados y mitigados adecuadamente.

---

## 2. ALCANCE

Este analisis FMEA cubre los 8 modulos del sistema CannTrace:

| # | Modulo | Descripcion |
|---|---|---|
| 1 | **Auth & Access Control** | Autenticacion, autorizacion, gestion de sesiones y roles |
| 2 | **Chat Data Entry** | Ingreso de datos via chat con IA (NLP), interpretacion y confirmacion |
| 3 | **QR Scanning** | Lectura de codigos QR individuales y por rango, validacion |
| 4 | **Seed-to-Sale Operations** | Operaciones de trazabilidad: siembra, cosecha, procesamiento, transferencia, destruccion |
| 5 | **Audit Trail** | Registro inmutable de todas las transacciones, cadena de hash |
| 6 | **Data Integrity** | Sincronizacion offline/online, manejo de concurrencia, integridad referencial |
| 7 | **Reporting** | Generacion de reportes regulatorios, exportacion PDF, validacion de contenido |
| 8 | **Infrastructure** | Servicios cloud (Supabase, Groq API), backups, disponibilidad |

---

## 3. METODOLOGIA

### 3.1 Marco de Referencia

Se utiliza la metodologia **FMEA (Failure Mode and Effects Analysis)** conforme a:
- **ICH Q9** - Quality Risk Management
- **ISPE GAMP5** - Guia para sistemas computarizados en entornos GxP
- **ISO 14971** - Aplicacion del manejo de riesgos (adaptado)

### 3.2 Equipo de Evaluacion

El analisis FMEA es realizado por un equipo multidisciplinario que incluye:
- Responsable de Calidad (QA)
- Desarrollador principal del sistema
- Experto en dominio (operaciones de cannabis)
- Especialista en ciberseguridad
- Responsable de cumplimiento regulatorio

### 3.3 Escalas de Evaluacion

#### 3.3.1 Severidad (S) - Impacto del efecto de la falla

| Valor | Clasificacion | Criterio |
|---|---|---|
| 1 | Ninguna | Sin efecto perceptible |
| 2 | Muy menor | Inconveniente menor, usuario no lo nota |
| 3 | Menor | Efecto menor, leve molestia al usuario |
| 4 | Muy baja | Defecto notado por el usuario, degradacion leve del servicio |
| 5 | Baja | Reduccion de rendimiento, usuario insatisfecho |
| 6 | Moderada | Sistema degradado, funcionalidad parcialmente perdida |
| 7 | Alta | Sistema inoperable para la funcion afectada, datos potencialmente incorrectos |
| 8 | Muy alta | Perdida de datos o integridad comprometida, incumplimiento regulatorio menor |
| 9 | Peligrosa con aviso | Incumplimiento regulatorio grave, trazabilidad perdida, datos no recuperables |
| 10 | Peligrosa sin aviso | Violacion critica de seguridad, datos manipulados sin deteccion, perdida total de trazabilidad |

#### 3.3.2 Ocurrencia (O) - Probabilidad de que ocurra la causa

| Valor | Clasificacion | Criterio | Tasa Estimada |
|---|---|---|---|
| 1 | Casi imposible | Falla eliminada por diseno | < 1 en 1.000.000 |
| 2 | Remota | Falla muy improbable | 1 en 500.000 |
| 3 | Muy baja | Falla rara, ocurrencia aislada | 1 en 100.000 |
| 4 | Baja | Pocas fallas esperadas | 1 en 10.000 |
| 5 | Moderada-baja | Fallas ocasionales | 1 en 2.000 |
| 6 | Moderada | Fallas periodicas | 1 en 500 |
| 7 | Moderada-alta | Fallas frecuentes | 1 en 100 |
| 8 | Alta | Fallas repetidas | 1 en 20 |
| 9 | Muy alta | Falla casi segura | 1 en 5 |
| 10 | Certeza | Falla inevitable en operacion normal | >= 1 en 2 |

#### 3.3.3 Deteccion (D) - Capacidad de detectar la falla antes de que impacte al usuario/sistema

| Valor | Clasificacion | Criterio |
|---|---|---|
| 1 | Certeza absoluta | Controles automaticos detectan el 100% de las fallas |
| 2 | Muy alta | Controles detectan la falla con alta probabilidad |
| 3 | Alta | Buen sistema de deteccion, pocos escapes |
| 4 | Moderada-alta | Sistema de deteccion efectivo en la mayoria de los casos |
| 5 | Moderada | Sistema de deteccion detecta ~50% de las fallas |
| 6 | Baja | Deteccion deficiente, se escapan muchas fallas |
| 7 | Muy baja | Controles insuficientes, deteccion rara |
| 8 | Remota | Controles ineficaces, deteccion casi nula |
| 9 | Muy remota | Sin controles efectivos, falla pasa desapercibida |
| 10 | Imposible | No existe ningun mecanismo de deteccion |

### 3.4 Calculo del RPN (Risk Priority Number)

```
RPN = Severidad (S) x Ocurrencia (O) x Deteccion (D)
```

**Rango posible:** 1 a 1000

### 3.5 Niveles de Riesgo y Acciones Requeridas

| Nivel de Riesgo | Rango RPN | Accion Requerida |
|---|---|---|
| **Bajo** | 1 - 50 | Aceptable. Monitorear en proxima revision. |
| **Moderado** | 51 - 100 | Accion de mejora planificada. Implementar antes de produccion. |
| **Alto** | 101 - 200 | Accion correctiva obligatoria. Debe resolverse antes del go-live. |
| **Muy Alto** | 201 - 400 | Accion correctiva critica inmediata. Bloquea el go-live hasta resolucion. |
| **Critico** | 401 - 1000 | Escalacion a direccion. Sistema NO puede liberarse sin mitigacion completa. |

---

## 4. ANALISIS FMEA - TABLA COMPLETA

### MODULO 1: AUTH & ACCESS CONTROL

| ID | Modulo | Modo de Falla | Efecto | S | Causa Raiz | O | Control Actual | D | RPN | Nivel de Riesgo | Accion Recomendada | Responsable |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| FMEA-001 | Auth & Access Control | Acceso no autorizado al sistema | Exposicion de datos sensibles de trazabilidad, posible manipulacion de registros de cannabis, violacion de privacidad de pacientes/clientes | 10 | Credenciales debiles o reutilizadas por usuarios; falta de politica de contrasenas robusta; ausencia de MFA | 5 | Autenticacion via Supabase Auth con JWT tokens; politica de contrasenas minima (8 caracteres); timeout de sesion a 30 minutos | 5 | 250 | Muy Alto | Implementar MFA obligatorio para roles Admin y Auditor; politica de contrasenas con complejidad (mayuscula, numero, especial, min 12 chars); integracion con IdP corporativo (OAuth2/SAML); rate limiting en endpoint de login (max 5 intentos, bloqueo 15 min); alerta automatica por intentos fallidos consecutivos | Seguridad / DevOps |
| FMEA-002 | Auth & Access Control | Secuestro de sesion (session hijacking) | Un atacante toma el control de una sesion activa, puede operar como el usuario legitimo, registrar operaciones falsas de trazabilidad | 9 | Token JWT almacenado de forma insegura en localStorage; transmision sin HTTPS; ausencia de binding de sesion a IP/device | 4 | JWT con expiracion de 1 hora; refresh token con rotacion; HTTPS obligatorio en produccion | 5 | 180 | Alto | Migrar almacenamiento de tokens a httpOnly cookies con flag Secure y SameSite=Strict; implementar fingerprinting de dispositivo (hash de User-Agent + IP) y forzar re-autenticacion si cambia; reducir TTL del access token a 15 minutos; implementar logout remoto desde panel de admin | Seguridad / Backend |
| FMEA-003 | Auth & Access Control | Escalacion de privilegios (role escalation) | Un usuario con rol Operador puede ejecutar acciones de Admin (eliminar registros, modificar configuracion, acceder a datos de otras instalaciones) | 10 | Falla en validacion de roles del lado del servidor; confianza excesiva en claims del JWT sin verificacion en backend; RLS de Supabase mal configurado | 3 | Row Level Security (RLS) en Supabase; validacion de rol en middleware del frontend; roles definidos en tabla `user_roles` | 4 | 120 | Alto | Implementar validacion de permisos en CADA funcion RPC del backend (defense in depth); audit de politicas RLS con test automatizados; crear suite de tests de penetracion para escalacion horizontal y vertical; verificar que ningun endpoint devuelve datos sin filtro de `facility_id` del usuario | Backend / QA |

### MODULO 2: CHAT DATA ENTRY (IA/NLP)

| ID | Modulo | Modo de Falla | Efecto | S | Causa Raiz | O | Control Actual | D | RPN | Nivel de Riesgo | Accion Recomendada | Responsable |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| FMEA-004 | Chat Data Entry | La IA malinterpreta el texto del usuario y extrae un tipo de operacion incorrecto | Ejemplo: usuario dice "cosechamos 50 plantas del lote A" y el sistema registra una destruccion en vez de una cosecha. Dato regulatorio incorrecto persistido. | 9 | Ambiguedad en el lenguaje natural; modelo de NLP entrenado con datos insuficientes en terminologia cannabica hispanohablante; sinonimos no mapeados ("cosechar" vs "cortar" vs "levantar") | 6 | Pantalla de confirmacion obligatoria antes de persistir; el sistema muestra tipo de operacion interpretado y pide si/no al usuario; prompt de Groq con instrucciones explicitas de clasificacion | 4 | 216 | Muy Alto | Agregar clasificador secundario basado en reglas (keywords) que valide la salida del LLM; implementar confidence score visible al usuario (< 80% muestra warning); crear diccionario de sinonimos cannabicos rioplatenses; agregar opcion de correccion facil (dropdown con tipos de operacion); log de todas las interpretaciones del LLM para auditoria y reentrenamiento | IA / Backend |
| FMEA-005 | Chat Data Entry | La IA extrae cantidades incorrectas del texto | Ejemplo: usuario dice "20 kilos" y el sistema interpreta "200 kilos"; o confunde unidades ("20 g" como "20 kg"). Registro con cantidad erronea que distorsiona inventario. | 8 | Errores de parsing numerico del LLM; confusion entre notacion con punto/coma decimal (1.500 vs 1,500); ambiguedad en unidades no especificadas | 5 | Confirmacion visual de cantidad y unidad extraida; validacion de rango razonable por tipo de operacion (ej: una planta no puede pesar 500 kg) | 4 | 160 | Alto | Implementar parser numerico determinista post-LLM que valide formato y unidades; crear limites configurables por tipo de operacion y etapa (ej: cosecha max 5 kg/planta); mostrar en pantalla de confirmacion la cantidad en texto grande y color diferenciado; solicitar doble confirmacion si la cantidad excede el promedio historico del lote en mas de 2 desviaciones estandar | IA / Backend |
| FMEA-006 | Chat Data Entry | El usuario confirma datos incorrectos sin revisar | Datos erroneos persisten en el sistema porque el usuario presiono "Confirmar" sin leer la pantalla de revision, por apuro o fatiga operativa | 7 | Fatiga del usuario en operaciones repetitivas; pantalla de confirmacion poco visible o con demasiada informacion; boton de confirmar demasiado accesible; falta de resumen claro | 7 | Pantalla de confirmacion obligatoria con campos resaltados; timeout de 3 segundos antes de habilitar boton "Confirmar" | 5 | 245 | Muy Alto | Redisenar pantalla de confirmacion con campos criticos en tamanio grande y color rojo; implementar delay progresivo (5 seg para operaciones que modifiquen > 10 unidades); agregar checkbox "He verificado que los datos son correctos" para operaciones criticas (destruccion, transferencia entre instalaciones); implementar ventana de correccion de 15 minutos post-confirmacion (anulacion con motivo en audit trail) | UX / Frontend |

### MODULO 3: QR SCANNING

| ID | Modulo | Modo de Falla | Efecto | S | Causa Raiz | O | Control Actual | D | RPN | Nivel de Riesgo | Accion Recomendada | Responsable |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| FMEA-007 | QR Scanning | Escaneo duplicado del mismo codigo QR en una operacion | Un mismo individuo (planta/producto) se registra dos veces en la misma operacion, distorsionando conteos e inventario | 6 | Usuario escanea rapidamente sin esperar confirmacion visual; QR fisicamente cercanos; scanner lee el mismo QR en dos frames consecutivos | 6 | Validacion de unicidad en memoria durante sesion de escaneo activa; alerta visual y sonora si QR ya fue escaneado en la misma sesion | 3 | 108 | Alto | Implementar debounce de 2 segundos entre lecturas del mismo QR; mostrar contador visible de QRs escaneados unicos vs intentos totales; feedback haptico (vibracion) diferenciado para "QR nuevo aceptado" vs "QR duplicado rechazado"; validacion adicional en backend al persistir la operacion (UNIQUE constraint en tabla de detalle) | Frontend / Backend |
| FMEA-008 | QR Scanning | Escaneo por rango calcula mal la cantidad de individuos | El usuario escanea QR de inicio "PLT-001" y fin "PLT-050", pero el sistema calcula 49 en vez de 50 individuos (error off-by-one), o incluye IDs que no existen en la base de datos | 7 | Error logico en calculo de rango (off-by-one); IDs no consecutivos en la base de datos (ej: PLT-025 fue destruido previamente); formato de ID no estandarizado | 4 | Preview de la lista expandida de IDs antes de confirmar; validacion contra base de datos de IDs existentes y activos; calculo inclusivo de extremos | 3 | 84 | Moderado | Mostrar lista completa expandida de IDs incluidos en el rango con estado actual de cada uno (activo/inactivo/destruido); resaltar en amarillo los IDs que no existen o estan inactivos; requerir confirmacion explicita si algun ID del rango esta faltante; implementar test unitario exhaustivo para funcion de expansion de rangos con casos borde | Frontend / Backend |

### MODULO 4: SEED-TO-SALE OPERATIONS

| ID | Modulo | Modo de Falla | Efecto | S | Causa Raiz | O | Control Actual | D | RPN | Nivel de Riesgo | Accion Recomendada | Responsable |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| FMEA-009 | Seed-to-Sale | Stock queda en valor negativo (error de sistema) | Inventario inconsistente: el sistema muestra -5 unidades de un producto. Indica que se registraron mas salidas que entradas, evidencia de error logico o transacciones no registradas. Regulatoriamente inaceptable. | 9 | Race condition en operaciones concurrentes sobre el mismo lote; falta de CHECK constraint en base de datos; logica de deduccion no atomica | 4 | Validacion pre-operacion: "stock actual >= cantidad a deducir"; transacciones en funciones RPC de Supabase | 4 | 144 | Alto | Agregar CHECK constraint en base de datos (`stock_quantity >= 0`); migrar logica de actualizacion de stock a transaccion atomica con SELECT FOR UPDATE; implementar cola de operaciones por lote (serializar operaciones concurrentes); alerta automatica a QA si stock llega a cero; reporte diario de reconciliacion de inventario automatico | Backend / DBA |
| FMEA-010 | Seed-to-Sale | Cadena de trazabilidad rota (parent_batch_id NULL) | Un lote derivado no tiene referencia a su lote padre. Se pierde la trazabilidad seed-to-sale: imposible rastrear el origen de un producto terminado hasta la semilla/clon original. Hallazgo critico en auditoria regulatoria. | 10 | Error en logica de creacion de lotes derivados; campo `parent_batch_id` permite NULL cuando no deberia en ciertos contextos; migracion de datos incompleta | 3 | Constraint NOT NULL en `parent_batch_id` para lotes tipo derivado; validacion en funcion RPC de creacion de lote; test de integridad referencial en CI | 3 | 90 | Moderado | Agregar trigger de base de datos que valide que todo lote tipo "derivado", "procesado" o "transferido" tenga parent_batch_id valido y que el lote padre exista y este activo; implementar query de integridad que corra diariamente y reporte cadenas rotas; crear dashboard de trazabilidad visual que muestre arbol genealogico de cada lote; test E2E que recorra cadena completa de seed-to-sale | Backend / QA |
| FMEA-011 | Seed-to-Sale | Transicion de tracking individual a bulk pierde datos | Al convertir 100 plantas individuales (con QR propio) a un lote a granel (bulk), se pierde la referencia de que plantas especificas componen el lote. Trazabilidad parcialmente destruida. | 8 | Logica de agrupacion elimina registros individuales en vez de marcarlos como "consolidados"; tabla de junction `individual_to_bulk` no se popula correctamente | 4 | Tabla `batch_individuals` que mapea individual_id a bulk_batch_id; validacion de conteo (suma de individuales == cantidad bulk) | 4 | 128 | Alto | Implementar soft-delete para registros individuales (nunca DELETE fisico); garantizar que tabla `batch_individuals` se popule atomicamente en la misma transaccion que la creacion del bulk; agregar campo `consolidation_date` y `consolidation_operation_id` para trazabilidad completa; validar invariante: SUM(individuales consolidados) == stock del lote bulk; alertar si hay discrepancia | Backend / QA |
| FMEA-012 | Seed-to-Sale | Operacion asignada a instalacion incorrecta | Una cosecha en la Instalacion A se registra bajo la Instalacion B. Distorsiona inventarios de ambas instalaciones. Incumplimiento regulatorio si las instalaciones tienen licencias diferentes. | 8 | Usuario con acceso a multiples instalaciones no verifica el selector de facility; default de facility incorrecto al iniciar sesion; bug en RLS que filtra por facility_id equivocado | 4 | Selector de instalacion activa visible en header; RLS filtra por facility_id del usuario; validacion en backend | 5 | 160 | Alto | Mostrar nombre de instalacion activa en CADA pantalla de confirmacion en tamanio prominente y con color de la instalacion; requerir confirmacion explicita si se cambia de instalacion durante una sesion de trabajo; implementar geolocalizacion opcional que valide que el usuario esta fisicamente en la instalacion seleccionada (GPS del dispositivo vs coordenadas de la instalacion); log de cambios de instalacion activa | Frontend / Backend |

### MODULO 5: AUDIT TRAIL

| ID | Modulo | Modo de Falla | Efecto | S | Causa Raiz | O | Control Actual | D | RPN | Nivel de Riesgo | Accion Recomendada | Responsable |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| FMEA-013 | Audit Trail | Registro de audit trail modificado (violacion de integridad) | Registro historico alterado post-facto. Invalida la auditoria completa. Si se descubre, puede resultar en suspension de licencia. Violacion de 21 CFR Part 11. | 10 | Acceso directo a base de datos por administrador; politicas RLS insuficientes en tabla de audit; falta de proteccion contra UPDATE/DELETE en registros de auditoria | 2 | Tabla de audit trail con politica RLS que deniega UPDATE y DELETE; cadena de hash SHA-256 que enlaza cada registro con el anterior; triggers de base de datos que previenen modificaciones | 3 | 60 | Moderado | Implementar replica de audit trail en almacenamiento externo inmutable (ej: blockchain de consorcio o AWS QLDB); verificacion periodica automatica de integridad de cadena de hash (job diario); alertar inmediatamente si se detecta cualquier inconsistencia; implementar firma digital del servidor en cada registro de audit; deshabilitar superuser access a tabla de audit en produccion; registrar todo intento de modificacion como incidente de seguridad | Seguridad / DBA |
| FMEA-014 | Audit Trail | Registro de auditoria faltante para una transaccion | Una operacion de negocio (ej: destruccion de producto) se ejecuta exitosamente pero no se genera el registro de audit correspondiente. Hueco en el trail detectable en auditoria. | 9 | Transaccion de negocio y registro de audit no estan en la misma transaccion atomica; error silencioso en trigger de audit; funcion RPC no invoca al mecanismo de audit | 3 | Trigger AFTER INSERT/UPDATE en tablas de negocio que inserta en `audit_trail`; cada funcion RPC incluye llamada explicita a `fn_create_audit_record`; test de integridad que compara count de operaciones vs count de audits | 3 | 81 | Moderado | Migrar generacion de audit trail a trigger de base de datos (no depender de codigo aplicativo); implementar reconciliacion automatica diaria: por cada registro en tablas de operaciones debe existir al menos un registro en audit_trail con el mismo `operation_id`; alerta si la diferencia es > 0; agregar campo `audit_record_id` en tablas de operaciones (FK obligatoria que fuerza la existencia del audit) | Backend / DBA |
| FMEA-015 | Audit Trail | Cadena de hash rota (registro manipulado) | Un registro intermedio en la cadena de hash no es consistente con su predecesor. Indica posible manipulacion. Invalida toda la cadena desde el punto de quiebre. Hallazgo critico en auditoria. | 10 | Manipulacion directa de la base de datos; error en calculo de hash durante un deployment; corrupcion de datos por falla de hardware; restauracion parcial de backup que no preserva la cadena | 2 | Hash SHA-256 calculado como H(n) = SHA256(H(n-1) + datos_registro_n); verificacion periodica manual; constraint en trigger que valida hash del registro anterior | 2 | 40 | Bajo | Implementar job automatico cada 6 horas que recorre toda la cadena de hash y verifica integridad; si detecta quiebre: alerta inmediata a QA, registro del punto exacto de quiebre, bloqueo de nuevas operaciones hasta investigacion; exportar hash del ultimo registro a servicio externo (timestamping authority) cada hora como anclaje de integridad; documentar procedimiento de respuesta ante cadena rota | Seguridad / Backend |
| FMEA-016 | Audit Trail | Manipulacion de timestamps en registros de auditoria | Registros de audit con timestamps incorrectos o manipulados. Altera la secuencia temporal de eventos. Puede usarse para encubrir operaciones no autorizadas. | 9 | Uso de timestamp del cliente (frontend) en vez del servidor; reloj del servidor no sincronizado (NTP); acceso directo a base de datos permite ALTER de timestamps | 3 | Timestamp generado por `now()` de PostgreSQL en trigger de base de datos (no proviene del cliente); servidor sincronizado con NTP | 3 | 81 | Moderado | Asegurar que TODOS los timestamps en audit_trail provienen exclusivamente de `now()` del servidor via trigger (nunca aceptar timestamp del cliente); implementar monitoreo de drift de NTP con alerta si desfase > 1 segundo; incluir campo `server_timestamp` adicional generado por Supabase Edge Function como segundo testigo temporal; agregar numero de secuencia monotonicamente creciente ademas del timestamp | Backend / Infra |

### MODULO 6: DATA INTEGRITY

| ID | Modulo | Modo de Falla | Efecto | S | Causa Raiz | O | Control Actual | D | RPN | Nivel de Riesgo | Accion Recomendada | Responsable |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| FMEA-017 | Data Integrity | Perdida de datos durante sincronizacion offline-to-online | Operaciones registradas en modo offline se pierden al reconectar. Transacciones de trazabilidad no persisten. Gap en el registro regulatorio. | 8 | Falla en Service Worker durante sincronizacion; IndexedDB corrupta; usuario cierra la app antes de completar sync; conflicto de versiones en datos offline vs online | 5 | Cola de sincronizacion en IndexedDB con estado pendiente/sincronizado/error; reintentos automaticos cada 30 segundos; indicador visual de operaciones pendientes de sync | 5 | 200 | Alto | Implementar confirmacion de sincronizacion con receipt del servidor (cada operacion recibe un `sync_receipt_id`); mantener cola offline persistente hasta recibir confirmacion positiva del servidor; agregar notificacion push al usuario si hay operaciones pendientes por mas de 1 hora; implementar export manual de cola offline a archivo JSON como respaldo de emergencia; test E2E de escenarios offline/online/offline | Frontend / Backend |
| FMEA-018 | Data Integrity | Operaciones concurrentes sobre el mismo lote (race condition) | Dos usuarios modifican el stock del mismo lote simultaneamente. Resultado: stock incorrecto. Ej: stock=100, usuario A deduce 30, usuario B deduce 20, resultado esperado 50 pero queda en 70 u 80 por falta de atomicidad. | 8 | Multiples usuarios operando en la misma instalacion; falta de bloqueo optimista/pesimista en operaciones de stock; lectura de stock y escritura no atomicas | 5 | Funciones RPC con transacciones PostgreSQL; operaciones de stock usan `UPDATE ... SET stock = stock - cantidad` (atomico); validacion pre-operacion | 4 | 160 | Alto | Migrar a SELECT FOR UPDATE (bloqueo pesimista) para operaciones de stock criticas; implementar versionamiento optimista con campo `version` en tabla de lotes (si version cambio entre lectura y escritura, rechazar y pedir re-lectura); serializar operaciones criticas por lote usando advisory locks de PostgreSQL; test de stress con 10 usuarios concurrentes sobre el mismo lote | Backend / DBA |

### MODULO 7: REPORTING

| ID | Modulo | Modo de Falla | Efecto | S | Causa Raiz | O | Control Actual | D | RPN | Nivel de Riesgo | Accion Recomendada | Responsable |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| FMEA-019 | Reporting | Reporte regulatorio generado sin campos obligatorios | Reporte enviado a la autoridad regulatoria incompleto. Puede resultar en observacion, multa o requerimiento de informacion adicional. Retrasa aprobaciones. | 7 | Template de reporte desactualizado respecto a los requisitos regulatorios vigentes; consulta SQL no incluye todos los campos; campo NULL en base de datos no detectado | 4 | Schema de validacion JSON para cada tipo de reporte; validacion de campos obligatorios antes de generar PDF; checklist de completitud pre-envio | 3 | 84 | Moderado | Mantener catalogo de campos obligatorios por tipo de reporte regulatorio, versionado y revisado trimestralmente; validacion automatica del PDF generado contra el catalogo antes de permitir descarga; implementar "reporte de prueba" que el usuario puede generar y revisar antes del envio oficial; alerta si algun campo obligatorio tiene valor NULL o vacio; test de regresion para cada tipo de reporte | QA / Regulatorio |
| FMEA-020 | Reporting | Hash del PDF no coincide con su contenido | El PDF almacenado fue modificado despues de su generacion (ej: editado externamente y re-subido). El hash almacenado en audit trail no coincide con el contenido actual. Integridad del documento comprometida. | 9 | Acceso no autorizado al storage de PDFs; error en calculo de hash al generar; bug en proceso de generacion que modifica el archivo post-hash | 2 | Hash SHA-256 calculado al generar PDF y almacenado en tabla `report_documents`; verificacion de hash al descargar; PDFs almacenados en Supabase Storage con acceso controlado | 2 | 36 | Bajo | Implementar verificacion automatica de hash cada vez que se accede al PDF (no solo al descargar); almacenar hash adicional en audit trail (doble registro); implementar bucket de storage con politica de inmutabilidad (write-once); agregar firma digital del servidor al PDF al momento de generacion; boton "Verificar Integridad" visible al usuario que recalcula hash en tiempo real | Backend / Seguridad |

### MODULO 8: INFRASTRUCTURE

| ID | Modulo | Modo de Falla | Efecto | S | Causa Raiz | O | Control Actual | D | RPN | Nivel de Riesgo | Accion Recomendada | Responsable |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| FMEA-021 | Infrastructure | Caida del servicio Supabase (outage) | Sistema completamente inoperable en modo online. Usuarios no pueden autenticarse ni registrar operaciones (excepto offline). Operaciones en cola se acumulan. Riesgo de timeout en sync posterior. | 7 | Mantenimiento programado de Supabase; incidente de infraestructura del proveedor; DDoS al proveedor; agotamiento de cuota de requests del plan | 4 | Modo offline de la PWA permite operaciones basicas sin conexion; Service Worker cachea recursos estaticos; cola de sync en IndexedDB; status page de Supabase monitoreado | 3 | 84 | Moderado | Implementar health check automatico cada 60 segundos con indicador visual de estado de conexion; mejorar modo offline para cubrir todas las operaciones criticas (actualmente solo soporta registro); implementar fallback a segunda instancia de Supabase (disaster recovery); notificacion push a administradores cuando se detecta outage; SLA documentado con plan de contingencia manual (formularios en papel) | DevOps / Infra |
| FMEA-022 | Infrastructure | API de Groq no disponible (IA falla) | Modulo de Chat Data Entry deja de funcionar. Usuarios no pueden ingresar datos por chat. Deben usar formulario manual alternativo. Degradacion de experiencia pero sin perdida de funcionalidad. | 5 | Outage del proveedor Groq; rate limiting excedido; API key expirada o revocada; latencia excesiva (> 10 seg) | 5 | Formulario manual como alternativa al chat IA; timeout de 10 seg en llamadas a Groq con fallback automatico a formulario; API key rotada trimestralmente | 2 | 50 | Bajo | Implementar cache local de interpretaciones frecuentes (top 20 tipos de operaciones) para funcionar sin IA; agregar segundo proveedor de LLM como fallback (ej: Ollama local o API alternativa); mostrar banner informativo "Modo manual activo - IA temporalmente no disponible"; registrar metricas de disponibilidad de Groq API para evaluacion de SLA; pre-validar API key al inicio de cada sesion | Backend / DevOps |
| FMEA-023 | Infrastructure | Falla en backup de base de datos | No se genera backup programado. En caso de desastre (corrupcion, borrado accidental), el ultimo backup valido puede ser de hace dias o semanas. Perdida de datos potencialmente catastrofica. | 9 | Configuracion de backup automatico deshabilitada; espacio en disco insuficiente; proceso de backup falla silenciosamente sin alerta; credenciales de acceso al storage de backups expiradas | 3 | Backup automatico diario de Supabase (incluido en plan Pro); backup adicional semanal via `pg_dump` a S3; retention de 30 dias | 5 | 135 | Alto | Implementar verificacion automatica de backup: despues de cada backup, intentar restauracion en entorno de test y validar integridad (row count, checksum de tablas criticas); alerta inmediata si backup no se completa en ventana esperada; backup incremental cada 6 horas ademas del diario; almacenar backups en al menos 2 regiones geograficas distintas; test de restauracion completa trimestral documentado; WAL archiving habilitado para point-in-time recovery | DBA / DevOps |

---

## 5. RESUMEN DE RIESGOS

### 5.1 Distribucion de Riesgos por Nivel

| Nivel de Riesgo | Rango RPN | Cantidad | Porcentaje | IDs |
|---|---|---|---|---|
| **Critico** | 401 - 1000 | 0 | 0% | - |
| **Muy Alto** | 201 - 400 | 3 | 13% | FMEA-001, FMEA-004, FMEA-006 |
| **Alto** | 101 - 200 | 8 | 35% | FMEA-002, FMEA-003, FMEA-005, FMEA-007, FMEA-009, FMEA-011, FMEA-012, FMEA-017, FMEA-018 |
| **Moderado** | 51 - 100 | 7 | 30% | FMEA-008, FMEA-010, FMEA-013, FMEA-014, FMEA-016, FMEA-019, FMEA-021 |
| **Bajo** | 1 - 50 | 5 | 22% | FMEA-015, FMEA-020, FMEA-022, FMEA-023* |
| **TOTAL** | | **23** | **100%** | |

> *Nota: FMEA-023 (RPN=135) esta clasificado como Alto. La fila Bajo incluye FMEA-015 (40), FMEA-020 (36) y FMEA-022 (50).

**Distribucion corregida:**

| Nivel de Riesgo | Rango RPN | Cantidad | Porcentaje | IDs |
|---|---|---|---|---|
| **Critico** | 401 - 1000 | 0 | 0% | - |
| **Muy Alto** | 201 - 400 | 3 | 13.0% | FMEA-001 (250), FMEA-004 (216), FMEA-006 (245) |
| **Alto** | 101 - 200 | 9 | 39.2% | FMEA-002 (180), FMEA-003 (120), FMEA-005 (160), FMEA-007 (108), FMEA-009 (144), FMEA-011 (128), FMEA-012 (160), FMEA-017 (200), FMEA-018 (160), FMEA-023 (135) |
| **Moderado** | 51 - 100 | 8 | 34.8% | FMEA-008 (84), FMEA-010 (90), FMEA-013 (60), FMEA-014 (81), FMEA-016 (81), FMEA-019 (84), FMEA-021 (84) |
| **Bajo** | 1 - 50 | 3 | 13.0% | FMEA-015 (40), FMEA-020 (36), FMEA-022 (50) |
| **TOTAL** | | **23** | **100%** | |

### 5.2 Top 5 Riesgos por RPN (Mayor a Menor)

| Ranking | ID | Modo de Falla | RPN | Nivel | Modulo |
|---|---|---|---|---|---|
| 1 | FMEA-001 | Acceso no autorizado al sistema | **250** | Muy Alto | Auth & Access Control |
| 2 | FMEA-006 | Usuario confirma datos incorrectos sin revisar | **245** | Muy Alto | Chat Data Entry |
| 3 | FMEA-004 | IA malinterpreta texto, extrae operacion incorrecta | **216** | Muy Alto | Chat Data Entry |
| 4 | FMEA-017 | Perdida de datos durante sincronizacion offline-to-online | **200** | Alto | Data Integrity |
| 5 | FMEA-002 | Secuestro de sesion (session hijacking) | **180** | Alto | Auth & Access Control |

### 5.3 Riesgos por Modulo

| Modulo | Cantidad de Riesgos | RPN Promedio | RPN Max | Riesgo Mas Alto |
|---|---|---|---|---|
| Auth & Access Control | 3 | 183.3 | 250 | FMEA-001 (Muy Alto) |
| Chat Data Entry | 3 | 207.0 | 245 | FMEA-006 (Muy Alto) |
| QR Scanning | 2 | 96.0 | 108 | FMEA-007 (Alto) |
| Seed-to-Sale Operations | 4 | 130.5 | 160 | FMEA-012 (Alto) |
| Audit Trail | 4 | 65.5 | 81 | FMEA-014 (Moderado) |
| Data Integrity | 2 | 180.0 | 200 | FMEA-017 (Alto) |
| Reporting | 2 | 60.0 | 84 | FMEA-019 (Moderado) |
| Infrastructure | 3 | 89.7 | 135 | FMEA-023 (Alto) |

### 5.4 Acciones Requeridas para Riesgos Muy Alto y Critico

Los siguientes riesgos clasificados como **Muy Alto** (RPN 201-400) requieren **accion correctiva critica inmediata** y **bloquean el go-live** hasta su resolucion:

#### FMEA-001 - Acceso no autorizado (RPN: 250)

| Item | Detalle |
|---|---|
| **Accion** | Implementar MFA obligatorio para Admin/Auditor; politica de contrasenas robusta; rate limiting; monitoreo de intentos fallidos |
| **Responsable** | Seguridad / DevOps |
| **Plazo** | Antes de UAT |
| **Criterio de aceptacion** | MFA activo para 100% de usuarios Admin/Auditor; 0 intentos de fuerza bruta exitosos en test de penetracion; rate limiting activo y verificado |
| **Verificacion** | Test de penetracion por tercero; revision de configuracion de autenticacion; test funcional de MFA |

#### FMEA-004 - IA malinterpreta operacion (RPN: 216)

| Item | Detalle |
|---|---|
| **Accion** | Clasificador secundario basado en reglas; confidence score visible; diccionario de sinonimos cannabicos; log de interpretaciones |
| **Responsable** | IA / Backend |
| **Plazo** | Antes de OQ |
| **Criterio de aceptacion** | Tasa de interpretacion correcta >= 95% en suite de 200 frases de prueba; confidence score mostrado al usuario en 100% de los casos; 0 operaciones criticas (destruccion) sin doble confirmacion |
| **Verificacion** | Suite de tests con 200+ frases de prueba representativas; test de usabilidad con operadores reales; revision de logs de interpretacion |

#### FMEA-006 - Usuario confirma sin revisar (RPN: 245)

| Item | Detalle |
|---|---|
| **Accion** | Rediseno de pantalla de confirmacion; delay progresivo; checkbox de verificacion para operaciones criticas; ventana de correccion post-confirmacion |
| **Responsable** | UX / Frontend |
| **Plazo** | Antes de UAT |
| **Criterio de aceptacion** | Test de usabilidad: 90% de usuarios leen datos criticos antes de confirmar (eye tracking o entrevista); delay activo para operaciones > 10 unidades; checkbox obligatorio para destruccion y transferencia; ventana de correccion funcional |
| **Verificacion** | Test de usabilidad con 5+ operadores; test funcional de delay y checkbox; test E2E de flujo de correccion post-confirmacion |

---

## 6. CONCLUSIONES Y PROXIMOS PASOS

### 6.1 Conclusiones

1. **No se identificaron riesgos Criticos (RPN > 400)**, lo cual indica un nivel base aceptable de controles.
2. **Se identificaron 3 riesgos Muy Alto** que requieren mitigacion obligatoria antes del go-live, concentrados en los modulos de Autenticacion (1) y Chat Data Entry (2).
3. **El modulo Chat Data Entry presenta el mayor riesgo acumulado** (RPN promedio 207.0), dado que depende de interpretacion de IA con inherente incertidumbre.
4. **El modulo de Audit Trail tiene riesgos bien mitigados** (RPN promedio 65.5) gracias a los controles criptograficos implementados (hash chain).
5. **La sincronizacion offline/online (FMEA-017, RPN 200)** es el riesgo tecnico mas alto y requiere atencion prioritaria.

### 6.2 Proximos Pasos

| # | Accion | Responsable | Plazo |
|---|---|---|---|
| 1 | Implementar todas las acciones correctivas para riesgos Muy Alto (FMEA-001, FMEA-004, FMEA-006) | Equipo de desarrollo | Antes de OQ |
| 2 | Implementar acciones para riesgos Alto (9 items) | Equipo de desarrollo | Antes de UAT |
| 3 | Re-evaluar FMEA post-implementacion de acciones correctivas | QA | Despues de OQ |
| 4 | Documentar residual risk para riesgos que no puedan reducirse por debajo de Moderado | QA / Regulatorio | Antes de go-live |
| 5 | Planificar acciones de mejora para riesgos Moderado | Equipo de desarrollo | Post go-live (Q3 2026) |
| 6 | Revision periodica de FMEA (trimestral o ante cambios significativos) | QA | Continuo |

---

## 7. APROBACIONES

| Rol | Nombre | Firma | Fecha |
|---|---|---|---|
| Preparado por | _________________ | _________________ | ____/____/________ |
| Revisado por (QA) | _________________ | _________________ | ____/____/________ |
| Aprobado por (Calidad) | _________________ | _________________ | ____/____/________ |
| Aprobado por (Regulatorio) | _________________ | _________________ | ____/____/________ |

---

*Documento generado conforme a GAMP5, ICH Q9 y buenas practicas de gestion de riesgos para sistemas computarizados en la industria del cannabis medicinal/recreativo.*

*Fin del documento FMEA-001 v0.1*
