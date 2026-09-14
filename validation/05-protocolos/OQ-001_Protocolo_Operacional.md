# PROTOCOLO DE CUALIFICACION OPERACIONAL (OQ)

| Campo | Valor |
|---|---|
| **Documento** | OQ-001 |
| **Version** | 0.1 |
| **Fecha** | 2026-04-16 |
| **Sistema** | CannTrace - Sistema de Trazabilidad Seed-to-Sale |
| **Clasificacion GAMP5** | Categoria 5 - Aplicacion Personalizada |
| **Estado** | BORRADOR |

---

## 1. OBJETIVO

Verificar que todas las funciones del sistema CannTrace operan correctamente de acuerdo con las especificaciones de diseno (DS-001) y los requerimientos de usuario (URS-001). Este protocolo evalua cada modulo funcional del sistema bajo condiciones normales de operacion, condiciones limite y condiciones de error.

---

## 2. ALCANCE

Este protocolo cubre la verificacion operacional de los siguientes modulos:

1. Autenticacion y Control de Acceso
2. Chat con IA (Interfaz Conversacional)
3. Gestion de Codigos QR
4. Operaciones Seed-to-Sale (16 operaciones)
5. Trazabilidad
6. Gestion de Stock
7. Reportes y Exportacion
8. Audit Trail (ALCOA+)
9. Seguridad

---

## 3. REFERENCIAS

| Codigo | Documento |
|---|---|
| URS-001 | Especificacion de Requerimientos de Usuario |
| DS-001 | Especificacion de Diseno del Sistema |
| VP-001 | Plan Maestro de Validacion |
| IQ-001 | Protocolo de Cualificacion de Instalacion (ejecutado) |
| RA-001 | Evaluacion de Riesgos |
| GAMP5 | ISPE GAMP 5 - A Risk-Based Approach to Compliant GxP Computerized Systems |

---

## 4. RESPONSABILIDADES

| Rol | Responsabilidad |
|---|---|
| **Responsable de Validacion** | Coordinacion general, redaccion y aprobacion del protocolo |
| **Tester Funcional** | Ejecucion de casos de prueba de modulos funcionales |
| **Tester de Seguridad** | Ejecucion de casos de prueba de seguridad |
| **Responsable de Calidad (QA)** | Revision de resultados, aprobacion de desviaciones |
| **Desarrollador Principal** | Soporte tecnico y resolucion de incidencias |

---

## 5. PRERREQUISITOS

| # | Prerrequisito | Verificado | Firma | Fecha |
|---|---|---|---|---|
| 1 | Protocolo IQ-001 ejecutado y aprobado | ☐ | | |
| 2 | Usuarios de prueba creados con todos los roles (admin, supervisor, operador, auditor) | ☐ | | |
| 3 | Datos de prueba cargados (lotes de ejemplo, codigos QR) | ☐ | | |
| 4 | Entorno de prueba aislado de produccion | ☐ | | |
| 5 | Acceso a todas las funcionalidades del sistema confirmado | ☐ | | |
| 6 | Navegador compatible disponible (Chrome, Firefox, Edge - ultima version) | ☐ | | |
| 7 | Dispositivo con camara disponible para pruebas de QR | ☐ | | |

---

## 6. PROCEDIMIENTO DE EJECUCION

### 6.1 Instrucciones Generales

1. Ejecutar cada caso de prueba siguiendo los pasos indicados en orden.
2. Registrar el resultado real observado con precision en la columna correspondiente.
3. Marcar **PASA** si el resultado real coincide con el resultado esperado segun el criterio de aceptacion.
4. Marcar **FALLA** si el resultado real NO coincide. Documentar inmediatamente la desviacion en la Seccion 9.
5. Capturar evidencia (capturas de pantalla, logs) para cada caso de prueba.
6. Firmar y fechar cada caso de prueba al completar su ejecucion.
7. Los casos de prueba dentro de cada modulo pueden ejecutarse en cualquier orden salvo que se indique dependencia.

---

## 7. CASOS DE PRUEBA

### MODULO 1 - AUTENTICACION Y CONTROL DE ACCESO

| ID | Modulo | Descripcion | Pasos | Criterio de Aceptacion | Resultado Esperado | Resultado Real | PASA/FALLA | Ejecutor | Fecha |
|---|---|---|---|---|---|---|---|---|---|
| OQ-001 | Auth | Login con credenciales validas | 1. Abrir la aplicacion en el navegador. 2. Ingresar email y contrasena de un usuario operador valido. 3. Presionar "Iniciar Sesion". | El usuario accede al dashboard correspondiente a su rol | Login exitoso. Se muestra el dashboard del operador. Token JWT generado. Registro de sesion creado en audit_log. | | | | |
| OQ-002 | Auth | Login con credenciales invalidas | 1. Abrir la aplicacion. 2. Ingresar email valido con contrasena incorrecta. 3. Presionar "Iniciar Sesion". | El sistema rechaza el intento y muestra mensaje generico de error | Login rechazado. Mensaje: "Credenciales invalidas" (sin revelar si el error es email o contrasena). Intento fallido registrado en audit_log. | | | | |
| OQ-003 | Auth | Bloqueo por intentos fallidos consecutivos | 1. Ingresar credenciales invalidas 5 veces consecutivas para el mismo usuario. 2. Intentar login con credenciales correctas al sexto intento. | La cuenta se bloquea temporalmente tras 5 intentos fallidos | Tras el 5to intento fallido, el sistema muestra: "Cuenta bloqueada temporalmente. Intente nuevamente en X minutos". El 6to intento con credenciales correctas es rechazado. Evento de bloqueo registrado en audit_log. | | | | |
| OQ-004 | Auth | Control de acceso basado en roles | 1. Iniciar sesion como operador. 2. Intentar acceder a la seccion de administracion de usuarios. 3. Cerrar sesion. 4. Iniciar sesion como administrador. 5. Acceder a la seccion de administracion de usuarios. | El operador no puede acceder a funciones de admin. El admin si puede. | Operador: acceso denegado a administracion de usuarios, se muestra mensaje de permisos insuficientes. Admin: acceso concedido, se visualiza el panel de gestion de usuarios. Ambos intentos registrados en audit_log. | | | | |
| OQ-005 | Auth | Expiracion de sesion por inactividad | 1. Iniciar sesion como cualquier usuario. 2. No realizar ninguna accion durante el periodo de timeout configurado. 3. Intentar realizar una accion tras la expiracion. | La sesion expira y el usuario es redirigido al login | Tras el periodo de inactividad, cualquier intento de interaccion redirige al formulario de login. Se muestra mensaje: "Sesion expirada. Por favor, inicie sesion nuevamente". Evento registrado en audit_log. | | | | |

### MODULO 2 - CHAT CON IA (INTERFAZ CONVERSACIONAL)

| ID | Modulo | Descripcion | Pasos | Criterio de Aceptacion | Resultado Esperado | Resultado Real | PASA/FALLA | Ejecutor | Fecha |
|---|---|---|---|---|---|---|---|---|---|
| OQ-006 | Chat | Ingreso de texto libre para operacion | 1. Iniciar sesion como operador. 2. Abrir el modulo de chat. 3. Escribir: "Recibi 50 semillas de la variedad Sativa Gold del proveedor SeedAR". 4. Enviar el mensaje. | El sistema parsea el texto y extrae los campos relevantes | El chat reconoce la intencion de registrar recepcion de semillas. Extrae: cantidad=50, variedad="Sativa Gold", proveedor="SeedAR". Presenta los datos parseados al usuario para confirmacion. | | | | |
| OQ-007 | Chat | Parseo por IA de datos estructurados | 1. Escribir en el chat: "Cosechamos el lote L-2026-001, peso humedo 23.5 kg, 45 plantas". 2. Enviar el mensaje. 3. Verificar los campos extraidos. | El parser de IA extrae correctamente todos los campos numericos y referencias | Campos extraidos: operacion=cosecha, lote="L-2026-001", peso_humedo=23.5, unidad="kg", cantidad_plantas=45. Todos los campos se muestran en la pantalla de confirmacion. | | | | |
| OQ-008 | Chat | Pantalla de confirmacion antes de registro | 1. Ingresar una operacion via chat. 2. Revisar la pantalla de confirmacion con los datos extraidos. 3. Presionar "Confirmar". | Se muestra pantalla de confirmacion con todos los datos antes de registrar | La pantalla de confirmacion muestra todos los campos extraidos en formato legible. Incluye botones "Confirmar" y "Cancelar". Al confirmar, la operacion se registra en la base de datos. Se genera QR y se actualiza audit_log. | | | | |
| OQ-009 | Chat | Manejo de entrada ambigua (fallback) | 1. Escribir en el chat un texto ambiguo: "Hicimos algo con las plantas hoy". 2. Enviar el mensaje. | El sistema solicita aclaracion o muestra opciones de operacion | El chat responde solicitando mas informacion: tipo de operacion, cantidad, lote involucrado. Ofrece opciones de operaciones disponibles. No se registra ninguna operacion sin datos completos. | | | | |
| OQ-010 | Chat | Almacenamiento de input_raw | 1. Ingresar una operacion via chat con texto libre. 2. Confirmar la operacion. 3. Verificar en la base de datos que se guardo el texto original. | El campo input_raw almacena el texto exacto ingresado por el usuario | En la tabla de operaciones, el campo `input_raw` contiene el texto completo tal como fue escrito por el usuario, sin modificaciones. El campo coexiste con los datos estructurados parseados. | | | | |
| OQ-011 | Chat | Cancelacion de operacion desde confirmacion | 1. Ingresar una operacion via chat. 2. En la pantalla de confirmacion, presionar "Cancelar". 3. Verificar que no se registro la operacion. | La operacion no se registra al cancelar | Al presionar "Cancelar", el sistema vuelve al chat sin registrar la operacion. No se crea registro en la base de datos. No se genera entrada en audit_log para la operacion (solo para la accion de cancelar, si aplica). | | | | |

### MODULO 3 - GESTION DE CODIGOS QR

| ID | Modulo | Descripcion | Pasos | Criterio de Aceptacion | Resultado Esperado | Resultado Real | PASA/FALLA | Ejecutor | Fecha |
|---|---|---|---|---|---|---|---|---|---|
| OQ-012 | QR | Escaneo de QR individual | 1. Generar un codigo QR para un lote existente. 2. Escanear el QR con la camara del dispositivo. 3. Verificar que se muestra la informacion del lote. | El escaneo QR resuelve correctamente al lote asociado | El escaner reconoce el codigo QR. Se muestra la ficha del lote con: ID, variedad, estado actual, ultima operacion, historial de trazabilidad resumido. Tiempo de respuesta < 3 segundos. | | | | |
| OQ-013 | QR | Escaneo de rango de QR (lote) | 1. Generar codigos QR para un rango de unidades (ej. unidades 001 a 010 de un lote). 2. Escanear el primer QR del rango. 3. Verificar que el sistema ofrece opcion de operar sobre el rango completo. | El sistema reconoce que el QR pertenece a un rango y ofrece operacion por lote | Al escanear un QR de rango, el sistema identifica el rango completo. Ofrece opcion: "Operar sobre esta unidad" o "Operar sobre el rango completo (10 unidades)". Ambas opciones funcionan correctamente. | | | | |
| OQ-014 | QR | Escaneo batch de multiples QR | 1. Activar modo de escaneo batch. 2. Escanear 5 codigos QR de diferentes lotes en secuencia rapida. 3. Verificar que todos los escaneos se registran. | El sistema procesa multiples escaneos consecutivos sin perder datos | Los 5 escaneos se registran correctamente en secuencia. Se muestra lista de los 5 items escaneados. No se pierden escaneos por velocidad. Se puede asignar una operacion comun a todos los items escaneados. | | | | |
| OQ-015 | QR | Pre-carga de datos al escanear QR | 1. Escanear el QR de un lote existente. 2. Iniciar una nueva operacion sobre ese lote. 3. Verificar que los datos del lote se pre-cargan automaticamente en el formulario/chat. | Al escanear QR, los datos del lote se pre-cargan en el contexto de operacion | Tras escanear el QR, al iniciar una operacion, los campos de lote, variedad, cantidad actual y estado se pre-cargan automaticamente. El operador solo debe ingresar los datos nuevos de la operacion. | | | | |

### MODULO 4 - OPERACIONES SEED-TO-SALE

| ID | Modulo | Descripcion | Pasos | Criterio de Aceptacion | Resultado Esperado | Resultado Real | PASA/FALLA | Ejecutor | Fecha |
|---|---|---|---|---|---|---|---|---|---|
| OQ-016 | Operaciones | Recepcion de semillas | 1. Registrar recepcion: variedad, proveedor, cantidad, lote proveedor. 2. Confirmar. 3. Verificar lote creado, QR generado, stock actualizado. | Se crea lote con datos completos, QR unico, stock +N | Lote creado con ID unico. QR generado y asociado. Stock: +N semillas. Audit log con hash y firma. | | | | |
| OQ-017 | Operaciones | Recepcion de esquejes | 1. Registrar recepcion de esquejes: variedad, proveedor, cantidad, lote madre. 2. Confirmar. 3. Verificar registro y stock. | Se crea registro de esquejes con trazabilidad al lote madre | Registro creado vinculado al lote madre (si aplica). QR generado. Stock: +N esquejes. Audit log registrado. | | | | |
| OQ-018 | Operaciones | Germinacion | 1. Seleccionar lote de semillas. 2. Registrar germinacion: cantidad germinada, cantidad descartada, motivo descarte. 3. Confirmar. | Stock de semillas disminuye, stock de plantines aumenta. Descarte documentado. | Semillas: -N. Plantines: +M (donde M = N - descartadas). Motivo de descarte registrado. Trazabilidad: plantines vinculados al lote de semillas. | | | | |
| OQ-019 | Operaciones | Trasplante | 1. Seleccionar lote de plantines. 2. Registrar trasplante: cantidad, tipo de contenedor, ubicacion. 3. Confirmar. | Operacion registrada con ubicacion y datos completos | Trasplante registrado con referencia al lote origen. Ubicacion asignada. Stock actualizado. QR actualizado si aplica. | | | | |
| OQ-020 | Operaciones | Fase vegetativa | 1. Registrar inicio de fase vegetativa para un lote. 2. Documentar condiciones (nutrientes, luz, temperatura). 3. Confirmar. | Fase registrada con condiciones de cultivo | Cambio de estado del lote a "vegetativo". Condiciones de cultivo registradas. Fecha de inicio documentada. Audit log actualizado. | | | | |
| OQ-021 | Operaciones | Floracion | 1. Registrar transicion a floracion. 2. Documentar cambio de fotoperiodo. 3. Registrar descarte si aplica. 4. Confirmar. | Transicion documentada con datos de fotoperiodo y descarte | Estado del lote: "floracion". Fotoperiodo registrado. Plantas descartadas documentadas con motivo. Stock actualizado. | | | | |
| OQ-022 | Operaciones | Cosecha | 1. Registrar cosecha: peso humedo total, cantidad de plantas cosechadas. 2. Asociar al lote en floracion. 3. Confirmar. | Peso humedo registrado. Trazabilidad mantenida. | Operacion de cosecha vinculada al lote. Peso humedo registrado en kg. Cantidad de plantas documentada. Stock actualizado: +kg cosecha humeda. | | | | |
| OQ-023 | Operaciones | Secado | 1. Registrar inicio y fin de secado. 2. Registrar peso seco final. 3. Calcular merma. 4. Confirmar. | Merma calculada correctamente. Peso seco < peso humedo. | Periodo de secado documentado. Peso seco registrado. Merma calculada automaticamente (% perdida). Stock: -peso humedo, +peso seco. | | | | |
| OQ-024 | Operaciones | Curado | 1. Registrar inicio de curado. 2. Documentar condiciones (humedad, temperatura). 3. Registrar finalizacion con peso final. 4. Confirmar. | Periodo y condiciones de curado documentados | Fechas de inicio y fin registradas. Condiciones de curado documentadas. Peso final registrado. Merma calculada si aplica. | | | | |
| OQ-025 | Operaciones | Procesamiento / Trimming | 1. Registrar procesamiento: peso entrada, peso salida, tipo de procesamiento. 2. Documentar subproductos (trim, descarte). 3. Confirmar. | Merma y subproductos documentados. Balance de masa verificable. | Peso entrada y salida registrados. Merma: entrada - salida - subproductos = 0 (balance cerrado). Subproductos con QR propio si aplica. | | | | |
| OQ-026 | Operaciones | Analisis de laboratorio | 1. Registrar envio de muestra a laboratorio. 2. Registrar resultados: THC%, CBD%, contaminantes. 3. Adjuntar numero de certificado. 4. Confirmar. | Resultados de laboratorio vinculados al lote con referencia al certificado | Muestra vinculada al lote. Resultados registrados: THC%, CBD%, perfil de terpenos (si aplica), contaminantes. Numero de certificado documentado. Estado del lote: "analizado". | | | | |
| OQ-027 | Operaciones | Empaquetado | 1. Registrar empaquetado: cantidad de unidades, peso por unidad, tipo de empaque. 2. Generar QR individuales por unidad. 3. Confirmar. | Unidades individuales creadas con QR unico cada una | N unidades creadas. Cada unidad con QR individual. Peso total = N * peso_unidad (con tolerancia). Stock: +N unidades empaquetadas. Trazabilidad: cada unidad vinculada al lote procesado. | | | | |
| OQ-028 | Operaciones | Etiquetado | 1. Registrar etiquetado: informacion en etiqueta, lote, fecha vencimiento. 2. Vincular al empaquetado. 3. Confirmar. | Informacion de etiqueta registrada y vinculada a las unidades | Datos de etiqueta registrados: nombre producto, variedad, THC/CBD%, peso neto, lote, fecha produccion, fecha vencimiento, numero de registro. Vinculado a las unidades empaquetadas. | | | | |
| OQ-029 | Operaciones | Almacenamiento | 1. Registrar almacenamiento: ubicacion, condiciones. 2. Vincular unidades almacenadas. 3. Confirmar. | Ubicacion y condiciones registradas | Ubicacion de almacen asignada. Condiciones documentadas (temperatura, humedad). Unidades vinculadas a la ubicacion. Stock de almacen actualizado. | | | | |
| OQ-030 | Operaciones | Despacho / Distribucion | 1. Registrar despacho: destinatario, cantidad, numero de remito. 2. Seleccionar unidades a despachar. 3. Confirmar. | Stock disminuye. Destino y remito documentados. | Despacho registrado con: destinatario, direccion, numero de remito, transportista. Unidades despachadas marcadas como "en transito". Stock: -N unidades. Trazabilidad: destino documentado. | | | | |
| OQ-031 | Operaciones | Descarte / Destruccion | 1. Registrar descarte: motivo, cantidad, metodo de destruccion. 2. Documentar testigos (si regulacion lo requiere). 3. Confirmar. | Descarte documentado con motivo, metodo y testigos | Descarte registrado con: motivo (ej. contaminacion, vencimiento, defecto), cantidad, metodo de destruccion, testigos (nombre y firma si aplica). Stock: -N. Producto marcado como "destruido". No reversible. | | | | |

### MODULO 5 - TRAZABILIDAD

| ID | Modulo | Descripcion | Pasos | Criterio de Aceptacion | Resultado Esperado | Resultado Real | PASA/FALLA | Ejecutor | Fecha |
|---|---|---|---|---|---|---|---|---|---|
| OQ-032 | Trazabilidad | Trazabilidad inversa (producto -> origen) | 1. Seleccionar una unidad de producto terminado. 2. Ejecutar consulta de trazabilidad inversa. 3. Verificar que se muestra toda la cadena hasta la semilla/esqueje original. | La cadena completa desde producto final hasta materia prima es visible y verificable | Se muestra cadena: unidad <- empaquetado <- procesamiento <- curado <- secado <- cosecha <- floracion <- vegetativo <- trasplante <- germinacion <- recepcion. Cada nodo muestra: operacion, fecha, responsable, datos clave. | | | | |
| OQ-033 | Trazabilidad | Trazabilidad directa (origen -> productos) | 1. Seleccionar un lote de semillas original. 2. Ejecutar consulta de trazabilidad directa. 3. Verificar que se muestran todos los productos derivados. | Todos los productos derivados de la materia prima son identificables | Se muestra arbol de derivacion: semilla -> germinacion -> ... -> N unidades de producto final + M unidades descartadas. La suma de productos + descartes + mermas cierra con la cantidad original. | | | | |
| OQ-034 | Trazabilidad | Campos origen/destino nunca nulos | 1. Revisar 20 registros aleatorios de operaciones que implican movimiento de material. 2. Verificar que los campos `origen` y `destino` no son nulos. | 100% de registros de movimiento tienen origen y destino documentados | Los 20 registros verificados tienen campos origen y destino con valores validos (no nulos, no vacios). Cada movimiento tiene referencia clara al lote/ubicacion de origen y al lote/ubicacion de destino. | | | | |

### MODULO 6 - GESTION DE STOCK

| ID | Modulo | Descripcion | Pasos | Criterio de Aceptacion | Resultado Esperado | Resultado Real | PASA/FALLA | Ejecutor | Fecha |
|---|---|---|---|---|---|---|---|---|---|
| OQ-035 | Stock | Actualizacion de stock en tiempo real | 1. Consultar stock actual de un producto. 2. Registrar una operacion que modifica el stock (ej. despacho de 10 unidades). 3. Consultar stock inmediatamente despues. | El stock se actualiza inmediatamente tras confirmar la operacion | Stock antes: N unidades. Tras despacho de 10: N-10 unidades. La actualizacion es inmediata (sin delay perceptible). El dashboard refleja el cambio sin necesidad de recargar la pagina. | | | | |
| OQ-036 | Stock | Stock no puede ser negativo | 1. Consultar stock actual de un producto (ej. 5 unidades). 2. Intentar registrar un despacho de 10 unidades (mas de las disponibles). 3. Verificar que el sistema rechaza la operacion. | El sistema impide operaciones que resultarian en stock negativo | El sistema muestra error: "Stock insuficiente. Disponible: 5, Solicitado: 10". La operacion no se registra. El stock permanece en 5 unidades. El intento se registra en audit_log. | | | | |
| OQ-037 | Stock | Pre-carga de stock al registrar operacion | 1. Iniciar una operacion de despacho para un lote especifico. 2. Verificar que el sistema muestra el stock disponible actual. | El stock disponible se muestra antes de confirmar la operacion | Al iniciar la operacion, el sistema muestra: "Stock disponible: N unidades de [producto] en [ubicacion]". El operador puede verificar la cantidad disponible antes de ingresar la cantidad a despachar. | | | | |

### MODULO 7 - REPORTES Y EXPORTACION

| ID | Modulo | Descripcion | Pasos | Criterio de Aceptacion | Resultado Esperado | Resultado Real | PASA/FALLA | Ejecutor | Fecha |
|---|---|---|---|---|---|---|---|---|---|
| OQ-038 | Reportes | Generacion de PDF con hash de integridad | 1. Generar un reporte de trazabilidad en formato PDF. 2. Verificar que el PDF contiene un hash de integridad. 3. Recalcular el hash del PDF y comparar. | El PDF incluye hash SHA-256 verificable | PDF generado con: contenido del reporte, hash SHA-256 visible en el documento, fecha de generacion, usuario que genero. El hash recalculado coincide con el impreso en el documento. | | | | |
| OQ-039 | Reportes | Exportacion CSV de datos | 1. Acceder al modulo de reportes. 2. Seleccionar datos a exportar (ej. operaciones del mes). 3. Exportar como CSV. 4. Abrir en Excel o editor de texto. | CSV generado con formato correcto y datos completos | Archivo CSV con: encabezados descriptivos, datos completos sin truncamiento, codificacion UTF-8, separador consistente. Los datos coinciden con los mostrados en pantalla. | | | | |
| OQ-040 | Reportes | Dashboard con indicadores en tiempo real | 1. Acceder al dashboard principal. 2. Verificar que muestra indicadores clave: lotes activos, stock total, operaciones del dia, alertas. 3. Registrar una operacion y verificar que el dashboard se actualiza. | El dashboard muestra datos actualizados sin necesidad de recarga manual | Dashboard muestra: total de lotes activos, stock por categoria, operaciones registradas hoy, alertas activas (si las hay). Tras registrar una nueva operacion, los contadores se actualizan automaticamente. | | | | |

### MODULO 8 - AUDIT TRAIL (ALCOA+)

| ID | Modulo | Descripcion | Pasos | Criterio de Aceptacion | Resultado Esperado | Resultado Real | PASA/FALLA | Ejecutor | Fecha |
|---|---|---|---|---|---|---|---|---|---|
| OQ-041 | Audit | Attributable - Cada registro identifica al autor | 1. Registrar una operacion como usuario "operador1". 2. Verificar el registro en audit_log. 3. Confirmar que contiene user_id vinculado a "operador1". | Cada registro de audit tiene user_id valido y verificable | El registro en audit_log contiene: user_id que corresponde a "operador1", nombre completo del usuario, rol al momento de la accion. No existen registros con user_id nulo o generico. | | | | |
| OQ-042 | Audit | Legible - Registros comprensibles | 1. Abrir el visor de audit trail. 2. Revisar 10 registros aleatorios. 3. Verificar que cada registro es comprensible sin necesidad de decodificacion. | Los registros son legibles y comprensibles por personal no tecnico | Los 10 registros revisados muestran: descripcion en lenguaje natural de la accion, datos antes/despues del cambio (si aplica), formato de fecha legible, nombres de usuario (no solo IDs). | | | | |
| OQ-043 | Audit | Contemporaneo - Timestamps precisos | 1. Registrar la hora actual del reloj del sistema. 2. Ejecutar una operacion. 3. Verificar el timestamp del registro en audit_log. 4. Comparar con la hora registrada. | El timestamp del registro difiere < 5 segundos de la hora real de la accion | Timestamp del audit_log esta dentro de 5 segundos de la hora real de ejecucion. Formato ISO 8601 con zona horaria. El reloj del servidor esta sincronizado (NTP). | | | | |
| OQ-044 | Audit | Original - Primer registro, no copia | 1. Verificar que el audit_log almacena el registro original de cada accion. 2. Confirmar que no existe proceso de copia o duplicacion intermedia. 3. Verificar metadatos de creacion. | Los registros son la captura primaria de la informacion | Cada registro en audit_log tiene un unico punto de creacion (INSERT). No existen procesos batch que copien datos desde otras tablas. Metadatos de creacion (created_at) coinciden con el timestamp de la operacion. | | | | |
| OQ-045 | Audit | Accurate - Datos correctos | 1. Registrar una operacion con datos conocidos. 2. Verificar que el audit_log refleja exactamente los datos ingresados. 3. Comparar campos clave. | Los datos en el audit trail coinciden 100% con la operacion realizada | Campos verificados: tipo de operacion, datos ingresados (cantidades, pesos, etc.), usuario, timestamp. Todos coinciden exactamente con la operacion ejecutada. Sin redondeos no autorizados. | | | | |
| OQ-046 | Audit | Complete - Sin campos obligatorios vacios | 1. Revisar 20 registros aleatorios del audit_log. 2. Verificar que ningun campo obligatorio esta nulo o vacio. | 100% de registros tienen todos los campos obligatorios completos | Los 20 registros verificados tienen: id, user_id, action, entity_type, entity_id, timestamp, hash - todos con valores validos. Ningun campo obligatorio es NULL, cadena vacia, o valor por defecto generico. | | | | |
| OQ-047 | Audit | Consistent - Formato uniforme | 1. Revisar 20 registros de diferentes tipos de operacion en audit_log. 2. Verificar uniformidad de formato en timestamps, identificadores y estructura. | Formato uniforme en todos los registros independientemente del tipo de operacion | Todos los registros usan: mismo formato de timestamp (ISO 8601), misma estructura de JSON para datos, misma convencion de nombres. No hay inconsistencias de formato entre diferentes tipos de operacion. | | | | |
| OQ-048 | Audit | Enduring - Registros persisten | 1. Crear un registro de audit. 2. Cerrar sesion. 3. Reiniciar el navegador. 4. Iniciar sesion nuevamente. 5. Verificar que el registro persiste. | Los registros persisten independientemente de la sesion del usuario | El registro creado en el paso 1 esta presente y sin modificaciones tras cerrar sesion, reiniciar navegador y volver a ingresar. Los datos son identicos a los originales. | | | | |
| OQ-049 | Audit | Available - Registros accesibles para auditoria | 1. Iniciar sesion como auditor. 2. Acceder al modulo de audit trail. 3. Buscar registros por rango de fecha, usuario, tipo de operacion. 4. Verificar que los resultados son accesibles y descargables. | Los registros son accesibles para consulta y exportacion en todo momento | El auditor puede: filtrar por fecha, usuario, tipo de operacion, lote. Los resultados se muestran paginados. Se pueden exportar a CSV/PDF. El tiempo de consulta es < 5 segundos para rangos de hasta 30 dias. | | | | |
| OQ-050 | Audit | Inmutabilidad - No se pueden editar registros | 1. Identificar un registro existente en audit_log. 2. Intentar ejecutar un UPDATE directo sobre la tabla via consola SQL. 3. Verificar que la operacion es rechazada o genera alerta. | Los registros de audit no pueden ser modificados una vez creados | El intento de UPDATE es rechazado por el trigger de proteccion de inmutabilidad. Mensaje de error: "Modificacion de registros de auditoria no permitida". Si se utiliza SUPERUSER para forzar, se genera registro de alerta con el intento. | | | | |
| OQ-051 | Audit | Hash chain - Cadena de integridad | 1. Obtener 10 registros consecutivos del audit_log. 2. Para cada registro, verificar que el campo `previous_hash` coincide con el `hash` del registro anterior. 3. Recalcular un hash y comparar. | La cadena de hashes es continua e integra | Cada registro N tiene: hash = SHA-256(datos_registro_N), previous_hash = hash del registro N-1. El primer registro tiene previous_hash = "GENESIS" o valor inicial documentado. Los hashes recalculados coinciden con los almacenados. | | | | |
| OQ-052 | Audit | Firma electronica con motivo requerido | 1. Registrar una operacion que requiere firma electronica (ej. descarte). 2. Verificar que el sistema solicita contrasena y motivo/comentario. 3. Confirmar con firma. 4. Verificar registro. | Las operaciones criticas requieren firma electronica con motivo documentado | Al ejecutar la operacion, se solicita: contrasena del usuario (re-autenticacion), motivo/comentario obligatorio. Tras confirmar, el registro incluye: firma_electronica (hash de credenciales + timestamp), motivo documentado, IP del dispositivo. | | | | |

### MODULO 9 - SEGURIDAD

| ID | Modulo | Descripcion | Pasos | Criterio de Aceptacion | Resultado Esperado | Resultado Real | PASA/FALLA | Ejecutor | Fecha |
|---|---|---|---|---|---|---|---|---|---|
| OQ-053 | Seguridad | Politica de contrasenas | 1. Intentar crear un usuario con contrasena "1234". 2. Intentar con "abcdefgh". 3. Intentar con "Abcd1234". | El sistema rechaza contrasenas debiles y acepta las que cumplen politica | "1234": rechazada (muy corta). "abcdefgh": rechazada (sin mayuscula ni numero). "Abcd1234": aceptada (cumple: 8+ chars, mayuscula, minuscula, numero). Mensajes de error especificos sobre lo que falta. | | | | |
| OQ-054 | Seguridad | HTTPS obligatorio | 1. Intentar acceder a la aplicacion via HTTP (sin SSL). 2. Verificar redireccion a HTTPS. 3. Verificar que todas las APIs responden solo via HTTPS. | Todo el trafico se transmite cifrado via HTTPS | Acceso HTTP redirige automaticamente a HTTPS (codigo 301/302). Las APIs rechazan conexiones HTTP planas. El certificado SSL es valido y reconocido por el navegador. | | | | |
| OQ-055 | Seguridad | Validacion JWT | 1. Copiar un token JWT valido. 2. Realizar una solicitud a la API con el token. 3. Modificar un caracter del token. 4. Repetir la solicitud con el token alterado. | Tokens validos son aceptados, tokens alterados son rechazados | Token original: solicitud exitosa (200 OK). Token alterado: solicitud rechazada (401 Unauthorized). El error no revela detalles internos de la validacion. | | | | |
| OQ-056 | Seguridad | Rate limiting en API | 1. Configurar un script que envie 100 solicitudes en 10 segundos al mismo endpoint. 2. Ejecutar el script. 3. Verificar que las solicitudes excedentes son rechazadas. | Las solicitudes que exceden el limite son rechazadas con codigo 429 | Las primeras N solicitudes (segun limite configurado) se procesan normalmente. Las solicitudes excedentes reciben respuesta 429 (Too Many Requests) con header `Retry-After`. El sistema se recupera tras el periodo de espera. | | | | |
| OQ-057 | Seguridad | Proteccion contra inyeccion SQL | 1. En un campo de entrada de la aplicacion, ingresar: `'; DROP TABLE operaciones; --`. 2. Enviar el formulario. 3. Verificar que la tabla sigue intacta. 4. Verificar el comportamiento del sistema. | El sistema sanitiza la entrada y no ejecuta SQL malicioso | La entrada maliciosa se almacena como texto plano (sin ejecutar). La tabla `operaciones` permanece intacta. El sistema puede mostrar error de validacion o procesar el texto como dato normal. No se produce error de base de datos no controlado. | | | | |
| OQ-058 | Seguridad | Configuracion CORS | 1. Desde un dominio no autorizado, intentar hacer una solicitud AJAX a la API. 2. Verificar que la solicitud es rechazada por CORS. 3. Desde el dominio autorizado, repetir la solicitud. | Solo los origenes autorizados pueden acceder a la API | Dominio no autorizado: solicitud bloqueada por politica CORS (error en consola del navegador). Dominio autorizado (frontend de la aplicacion): solicitud exitosa. Headers CORS correctos: Access-Control-Allow-Origin especifico (no *). | | | | |
| OQ-059 | Seguridad | Proteccion contra enumeracion de usuarios | 1. Intentar login con email existente y contrasena incorrecta. 2. Intentar login con email inexistente y cualquier contrasena. 3. Comparar los mensajes de error. | Los mensajes de error no revelan si el email existe o no | Ambos intentos muestran el mismo mensaje generico: "Credenciales invalidas". El tiempo de respuesta es similar en ambos casos (sin timing leak). No se revela si el email esta registrado o no. | | | | |
| OQ-060 | Seguridad | Proteccion de datos sensibles en logs | 1. Ejecutar varias operaciones que involucren datos sensibles (contrasenas, tokens). 2. Revisar los logs del servidor y del audit_log. 3. Verificar que no se registran datos sensibles en texto plano. | Los logs no contienen contrasenas, tokens ni datos sensibles en texto plano | Los logs del servidor no contienen: contrasenas, tokens JWT completos, claves API. El audit_log registra acciones pero no credenciales. Los campos sensibles estan enmascarados o hasheados. | | | | |

---

## 8. RESUMEN DE CASOS POR MODULO

| Modulo | Rango de IDs | Cantidad | Descripcion |
|---|---|---|---|
| 1 - Autenticacion | OQ-001 a OQ-005 | 5 | Login, bloqueo, roles, sesion |
| 2 - Chat con IA | OQ-006 a OQ-011 | 6 | Input, parseo, confirmacion, fallback, raw |
| 3 - Codigos QR | OQ-012 a OQ-015 | 4 | Escaneo individual, rango, batch, pre-carga |
| 4 - Operaciones | OQ-016 a OQ-031 | 16 | 16 operaciones seed-to-sale |
| 5 - Trazabilidad | OQ-032 a OQ-034 | 3 | Inversa, directa, campos no nulos |
| 6 - Stock | OQ-035 a OQ-037 | 3 | Tiempo real, no negativo, pre-carga |
| 7 - Reportes | OQ-038 a OQ-040 | 3 | PDF hash, CSV, dashboard |
| 8 - Audit Trail | OQ-041 a OQ-052 | 12 | ALCOA+ (9 atributos), inmutabilidad, hash chain, firma |
| 9 - Seguridad | OQ-053 a OQ-060 | 8 | Passwords, HTTPS, JWT, rate limit, SQLi, CORS |
| **TOTAL** | | **60** | |

---

## 9. REGISTRO DE DESVIACIONES

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

## 10. RESUMEN DE RESULTADOS

| Metrica | Valor |
|---|---|
| **Total de casos de prueba** | 60 |
| **Casos PASA** | ___/60 |
| **Casos FALLA** | ___/60 |
| **Desviaciones abiertas** | ___ |
| **Desviaciones resueltas** | ___ |

### Resumen por Modulo

| Modulo | Casos | PASA | FALLA |
|---|---|---|---|
| 1 - Autenticacion | 5 | | |
| 2 - Chat con IA | 6 | | |
| 3 - Codigos QR | 4 | | |
| 4 - Operaciones | 16 | | |
| 5 - Trazabilidad | 3 | | |
| 6 - Stock | 3 | | |
| 7 - Reportes | 3 | | |
| 8 - Audit Trail | 12 | | |
| 9 - Seguridad | 8 | | |

### Conclusion

☐ **APROBADO** - Todos los casos de prueba operacionales pasaron satisfactoriamente. El sistema cumple con los criterios de cualificacion operacional. Se autoriza proceder con la Cualificacion de Desempeno (PQ-001).

☐ **APROBADO CON DESVIACIONES** - Se identificaron desviaciones que no afectan la funcionalidad critica del sistema. Las desviaciones estan documentadas y las acciones correctivas completadas o planificadas. Se autoriza proceder con la Cualificacion de Desempeno (PQ-001) con condiciones.

☐ **RECHAZADO** - Se identificaron deficiencias criticas en la funcionalidad del sistema. Se requieren correcciones y re-ejecucion parcial o total del protocolo antes de autorizar la siguiente fase.

---

## 11. FIRMAS DE APROBACION

| Rol | Nombre | Firma | Fecha |
|---|---|---|---|
| **Ejecutor de Pruebas** | | | |
| **Revisor Tecnico** | | | |
| **Responsable de Validacion** | | | |
| **Responsable de Calidad (QA)** | | | |

---

*Fin del documento OQ-001 v0.1*
