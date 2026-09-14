# URS-001: Especificacion de Requerimientos de Usuario
## Sistema de Trazabilidad de Cannabis Medicinal - CannTrace

| Campo | Valor |
|-------|-------|
| **Documento** | URS-001 |
| **Version** | 0.1 (Draft) |
| **Fecha** | 2026-04-16 |
| **Autor** | Equipo CannTrace |
| **Clasificacion GAMP5** | Categoria 5 (Software Custom) |
| **Marco regulatorio** | ANMAT Disp. 4159/2023 Anexo 6, ARICCAME Ley 27.669, EU GMP Annex 11, 21 CFR Part 11 |

### Historial de Revisiones

| Rev | Fecha | Autor | Descripcion |
|-----|-------|-------|-------------|
| 0.1 | 2026-04-16 | Equipo CannTrace | Draft inicial |

---

## 1. PROPOSITO Y ALCANCE

### 1.1 Proposito
Este documento define los requerimientos de usuario para el sistema CannTrace, una aplicacion web progresiva (PWA) de trazabilidad seed-to-sale para cannabis medicinal e industrial, disenada para cumplir con GAMP5 Categoria 5 y regulaciones ANMAT/ARICCAME.

### 1.2 Alcance
- Trazabilidad completa desde planta madre hasta producto final almacenado
- 16 operaciones del flujo productivo
- Labores culturales configurables
- Gestion de stock de insumos
- Audit trail inmutable conforme ALCOA+
- Entrada de datos via chat textual con IA + confirmacion humana
- Exportacion regulatoria para ANMAT/ARICCAME/REPROCANN

### 1.3 Exclusiones
- Punto de venta (POS)
- Gestion contable/fiscal
- Integracion con laboratorios externos (fase futura)
- Entrada por voz/audio

---

## 2. DESCRIPCION GENERAL DEL SISTEMA

CannTrace es una PWA que permite a operadores de cultivo de cannabis registrar cada operacion del ciclo productivo mediante una interfaz de chat textual. El sistema procesa el texto con IA ligera para extraer datos estructurados, los presenta al operador para confirmacion, y los almacena en PostgreSQL con audit trail inmutable y firma electronica.

### 2.1 Arquitectura General
- **Frontend:** PWA (React + Vite + TypeScript)
- **Backend:** Supabase Edge Functions (Deno/TypeScript)
- **Base de datos:** Supabase PostgreSQL con RLS
- **IA:** Groq API (Llama-3.1-8B) para estructuracion de texto
- **Almacenamiento:** Supabase Storage + Cloudflare R2

---

## 3. ROLES DE USUARIO

| Rol | Permisos | Descripcion |
|-----|----------|-------------|
| **Operador** | Crear operaciones, ver stock propio, escanear QR | Trabajador de campo/cultivo |
| **Supervisor** | Todo lo de operador + aprobar operaciones criticas + ver reportes | Jefe de sala/area |
| **Auditor** | Solo lectura + audit trail completo + exportacion | Personal de QA/regulatorio |
| **Administrador** | Gestion de usuarios, configuracion del sistema, backup | IT/Administracion |

---

## 4. REQUERIMIENTOS FUNCIONALES

### 4.1 Autenticacion y Control de Acceso

| ID | Requerimiento | Riesgo | Criterio de Aceptacion | Prueba |
|----|---------------|--------|------------------------|--------|
| RF-001 | El sistema debe autenticar usuarios con email/password + MFA opcional | Alto | Login exitoso con credenciales validas, rechazo con invalidas | OQ-001 |
| RF-002 | El sistema debe bloquear la cuenta tras 5 intentos fallidos consecutivos | Alto | Cuenta bloqueada al 5to intento, notificacion al administrador | OQ-002 |
| RF-003 | El sistema debe controlar acceso por rol (operador/supervisor/auditor/admin) | Critico | Cada rol accede SOLO a las funciones autorizadas en la tabla de roles | OQ-003, PQ-001 |
| RF-004 | Las sesiones deben expirar tras 30 minutos de inactividad | Alto | Sesion cerrada automaticamente, redirect a login | OQ-004 |
| RF-005 | El sistema debe registrar cada login/logout en el audit trail | Critico | Registro en audit_log con user_id, timestamp, ip_address | OQ-005 |

### 4.2 Entrada de Datos via Chat Textual

| ID | Requerimiento | Riesgo | Criterio de Aceptacion | Prueba |
|----|---------------|--------|------------------------|--------|
| RF-006 | El operador debe poder escribir texto libre describiendo la operacion | Medio | Interfaz de chat acepta texto de hasta 2000 caracteres | OQ-006 |
| RF-007 | El sistema debe procesar el texto con IA y extraer datos estructurados (JSON) | Medio | JSON generado contiene los campos requeridos para la operacion detectada | OQ-007 |
| RF-008 | El sistema debe presentar los datos extraidos en pantalla de confirmacion | Critico | Pantalla muestra TODOS los campos extraidos, permite editar cada uno | OQ-008 |
| RF-009 | Los datos NO se guardan hasta que el operador confirme explicitamente | Critico | Sin confirmacion, no hay INSERT en tabla transaccional ni en audit_log | OQ-009, PQ-002 |
| RF-010 | Si la IA no puede estructurar el texto, debe ofrecer formulario manual como fallback | Medio | Formulario con campos de la operacion aparece cuando IA retorna error o confianza < 70% | OQ-010 |
| RF-011 | El texto original escrito por el operador debe guardarse en audit_log.input_raw | Critico | Campo input_raw nunca es NULL en registros de operaciones | OQ-011 |

### 4.3 Escaneo QR

| ID | Requerimiento | Riesgo | Criterio de Aceptacion | Prueba |
|----|---------------|--------|------------------------|--------|
| RF-012 | El sistema debe escanear codigos QR via camara del dispositivo | Alto | QR decodificado correctamente en < 3 segundos | OQ-012 |
| RF-013 | Debe soportar 3 modos de escaneo: individual, por rango (2 extremos), por lote | Alto | Cada modo genera la lista correcta de individuos/lotes | OQ-013 |
| RF-014 | El escaneo por rango debe calcular automaticamente los individuos intermedios | Alto | Rango [A001, A010] genera 10 individuos (A001..A010) | OQ-014 |
| RF-015 | El escaneo por lote debe traer todos los individuos asociados al lote desde stock | Alto | Escanear 1 etiqueta trae todos los registros del lote vinculado | OQ-015 |

### 4.4 Flujo Seed-to-Sale (16 Operaciones)

| ID | Requerimiento | Riesgo | Criterio de Aceptacion | Prueba |
|----|---------------|--------|------------------------|--------|
| RF-016 | Ingreso de insumos: registrar producto, almacen, lote, cantidad, fecha vencimiento | Alto | Stock incrementado correctamente, audit trail generado | OQ-016 |
| RF-017 | Planta madre: alta de individuos en sala de madres con QR y datos ambientales | Critico | Cada planta tiene ID unico, vinculada a almacen/instalacion | OQ-017, PQ-003 |
| RF-018 | Fertilizacion (labor cultural): consumir insumo del stock, aplicar a lote de plantas | Alto | Stock de insumo decrementado, operacion registrada contra lote | OQ-018 |
| RF-019 | Utilizacion de insumos: asignar insumos (macetas, etc.) a lotes de plantas | Alto | Stock decrementado, trazabilidad insumo->lote preservada | OQ-019 |
| RF-020 | Baja de stock: registrar baja de individuo con motivo (muerte, descarte, etc.) | Critico | Individuo removido del stock activo, motivo registrado en audit trail | OQ-020 |
| RF-021 | Esquejado: alta de esquejes en sala de clonacion vinculados a planta madre origen | Critico | Trazabilidad esqueje->planta madre preservada | OQ-021, PQ-004 |
| RF-022 | Vegetativa: transicion esqueje->planta en sala vegetativa | Alto | Esquejes decrementados, plantas generadas con nuevo estado | OQ-022 |
| RF-023 | Poda (labor cultural): registrar poda sobre individuo con fecha y responsable | Medio | Operacion registrada con individuo_id, fecha, responsable | OQ-023 |
| RF-024 | Floracion: movimiento de lote de vegetativa a flora | Alto | Ubicacion actualizada en stock, audit trail con origen/destino | OQ-024 |
| RF-025 | Control de plagas (labor cultural): registrar aplicacion sobre lote en floracion | Medio | Operacion vinculada al lote correcto, campos configurables guardados | OQ-025 |
| RF-026 | Cosecha: movimiento de flora a sala de cosecha con peso fresco | Critico | Peso fresco registrado, lote movido, trazabilidad intacta | OQ-026, PQ-005 |
| RF-027 | Secado: decremento de plantas, generacion de flores con tracking individual | Critico | N plantas -> M flores (M <= N), diferencia documentada como baja | OQ-027 |
| RF-028 | Trimming: transicion de individuos a lotes (pierde individualidad, pasa a granel) | Critico | Flores individuales decrementadas, lote granel generado con peso neto y rendimiento | OQ-028, PQ-006 |
| RF-029 | Cuarentena: reubicacion a deposito de cuarentena con motivo y resultado analisis | Alto | Producto movido, motivo y resultado registrados | OQ-029 |
| RF-030 | Fraccionamiento: decremento de lote granel, generacion de producto fraccionado | Alto | Lote origen decrementado, nuevo lote fraccionado con peso unitario | OQ-030 |
| RF-031 | Almacenamiento: reubicacion de producto final al deposito | Alto | Producto disponible en deposito como paso final del flujo | OQ-031 |

### 4.5 Trazabilidad

| ID | Requerimiento | Riesgo | Criterio de Aceptacion | Prueba |
|----|---------------|--------|------------------------|--------|
| RF-032 | El sistema debe permitir trazabilidad inversa: desde producto final hasta planta madre | Critico | Dado un lote final, obtener cadena completa: almacenamiento->fraccionamiento->cuarentena->trimming->secado->cosecha->floracion->vegetativa->esquejado->planta_madre | PQ-007 |
| RF-033 | El sistema debe permitir trazabilidad directa: desde planta madre hasta todos los productos derivados | Critico | Dada una planta madre, listar todos los lotes/productos que se originaron de ella | PQ-008 |
| RF-034 | Cada operacion debe vincular origen y destino (almacen, instalacion, lote) | Alto | Ningun registro de operacion tiene origen o destino NULL | OQ-032 |

### 4.6 Gestion de Stock

| ID | Requerimiento | Riesgo | Criterio de Aceptacion | Prueba |
|----|---------------|--------|------------------------|--------|
| RF-035 | El stock debe reflejar en tiempo real las cantidades por producto/lote/ubicacion | Alto | Despues de cada operacion, consulta de stock retorna cantidad actualizada | OQ-033 |
| RF-036 | No debe ser posible decrementar stock por debajo de cero | Critico | Operacion que intente decrementar a negativo debe ser rechazada con error | OQ-034 |
| RF-037 | El sistema debe pre-cargar datos del stock al escanear QR o seleccionar producto | Medio | Al escanear QR, mostrar producto, lote, cantidad disponible automaticamente | OQ-035 |

### 4.7 Reportes y Exportacion

| ID | Requerimiento | Riesgo | Criterio de Aceptacion | Prueba |
|----|---------------|--------|------------------------|--------|
| RF-038 | Exportar reporte de trazabilidad completo en PDF con hash de integridad | Critico | PDF generado con hash SHA-256, verificable offline | OQ-036, PQ-009 |
| RF-039 | Exportar datos en CSV para presentacion ante ANMAT/ARICCAME/REPROCANN | Critico | CSV con todos los campos requeridos por regulacion vigente | OQ-037, PQ-010 |
| RF-040 | Dashboard con resumen de operaciones, stock actual, y alertas | Bajo | Dashboard muestra datos actualizados en < 5 segundos | OQ-038 |

---

## 5. REQUERIMIENTOS NO FUNCIONALES

| ID | Requerimiento | Riesgo | Criterio de Aceptacion | Prueba |
|----|---------------|--------|------------------------|--------|
| RNF-001 | Tiempo de respuesta < 3 segundos para 95% de las operaciones | Medio | Medicion con herramienta de performance (Lighthouse, k6) | PQ-011 |
| RNF-002 | Sistema debe funcionar offline (cache local + sync al reconectar) | Alto | Operaciones registradas offline se sincronizan al recuperar conexion sin perdida de datos | PQ-012 |
| RNF-003 | Disponibilidad del sistema >= 99.5% mensual (excluyendo mantenimiento programado) | Alto | Monitoreo de uptime registrado | PQ-013 |
| RNF-004 | Soporte para al menos 50 usuarios concurrentes sin degradacion | Medio | Test de carga con 50 sesiones simultaneas | PQ-014 |
| RNF-005 | Datos almacenados con encriptacion en transito (TLS 1.2+) y en reposo | Critico | Certificado SSL valido, encriptacion de Supabase verificada | IQ-001 |
| RNF-006 | Multi-idioma: espanol (predeterminado) e ingles | Bajo | Interfaz completa en ambos idiomas | OQ-039 |
| RNF-007 | Compatible con Chrome, Safari, Firefox (ultimas 2 versiones) y como PWA instalable | Medio | Tests de compatibilidad en los 3 navegadores | OQ-040 |

---

## 6. REQUERIMIENTOS REGULATORIOS (ALCOA+ / GAMP5)

| ID | Requerimiento | Principio ALCOA+ | Riesgo | Criterio de Aceptacion | Prueba |
|----|---------------|------------------|--------|------------------------|--------|
| RR-001 | Cada registro debe estar vinculado a un usuario autenticado unico | Atribuible | Critico | user_id NOT NULL en todas las tablas transaccionales y audit_log | OQ-041 |
| RR-002 | Todos los registros deben ser legibles y exportables en formato humano | Legible | Alto | Exportacion PDF/CSV legible sin software especializado | OQ-042 |
| RR-003 | Timestamp UTC del servidor asignado automaticamente, no editable por usuario | Contemporaneo | Critico | Campo timestamp_utc generado por DEFAULT NOW(), sin posibilidad de override | OQ-043, PQ-015 |
| RR-004 | El texto original escrito por el operador debe preservarse sin modificacion | Original | Critico | Campo input_raw en audit_log es inmutable post-INSERT | OQ-044 |
| RR-005 | Validacion de rangos y campos obligatorios a nivel de base de datos (CHECK constraints) | Preciso | Critico | INSERT con datos fuera de rango rechazado por DB | OQ-045 |
| RR-006 | Audit trail debe registrar TODAS las operaciones CRUD sobre datos regulados | Completo | Critico | Conteo de registros en audit_log == conteo de operaciones ejecutadas | OQ-046, PQ-016 |
| RR-007 | Formato de datos consistente (ISO 8601 para fechas, UTF-8 para texto) | Consistente | Alto | Ningun registro con formato de fecha/texto inconsistente | OQ-047 |
| RR-008 | Datos accesibles y recuperables durante todo el periodo de retencion (minimo 5 anos) | Duradero | Critico | Backup verificable, restauracion exitosa de datos de 5+ anos | PQ-017 |
| RR-009 | Datos disponibles para consulta/exportacion por auditores en cualquier momento | Disponible | Critico | Rol auditor puede acceder y exportar cualquier registro sin restriccion temporal | OQ-048 |
| RR-010 | Audit trail inmutable: tabla solo INSERT, triggers impiden UPDATE/DELETE | Integridad | Critico | Intento de UPDATE/DELETE en audit_log genera excepcion en DB | IQ-002, OQ-049 |
| RR-011 | Firma electronica: hash SHA-256 del registro + timestamp + user_id | 21 CFR Part 11 | Critico | Cada registro critico tiene record_signature valido y verificable | OQ-050 |
| RR-012 | Hash encadenado en audit trail (cada registro incluye hash del anterior) | Integridad | Alto | Verificacion de cadena de hashes detecta cualquier manipulacion | OQ-051, PQ-018 |
| RR-013 | Motivo de cambio obligatorio para UPDATE/DELETE de datos criticos | Trazable | Critico | Campo reason NOT NULL para acciones UPDATE/DELETE en audit_log | OQ-052 |

---

## 7. REQUERIMIENTOS DE INTERFAZ

| ID | Requerimiento | Riesgo | Criterio de Aceptacion | Prueba |
|----|---------------|--------|------------------------|--------|
| RI-001 | Interfaz de chat textual como metodo primario de entrada de datos | Medio | Chat funcional con historial de conversacion por sesion | OQ-053 |
| RI-002 | Formulario manual como fallback cuando IA no puede estructurar | Medio | Formulario con todos los campos de la operacion seleccionada | OQ-054 |
| RI-003 | Pantalla de confirmacion obligatoria antes de guardar | Critico | Datos estructurados mostrados con botones [Editar] y [Confirmar] | OQ-055 |
| RI-004 | Escaner QR integrado via camara del dispositivo | Alto | API MediaDevices funcional en navegadores soportados | OQ-056 |
| RI-005 | Navegacion intuitiva entre modulos (trazabilidad, stock, reportes, config) | Bajo | Navegacion principal accesible en < 2 taps/clicks | OQ-057 |

---

## 8. REQUERIMIENTOS DE SEGURIDAD

| ID | Requerimiento | Riesgo | Criterio de Aceptacion | Prueba |
|----|---------------|--------|------------------------|--------|
| RS-001 | Passwords hasheados con bcrypt (costo >= 10) | Critico | Ningun password almacenado en texto plano | IQ-003 |
| RS-002 | Comunicacion exclusivamente via HTTPS (TLS 1.2+) | Critico | HTTP redirige a HTTPS, certificado valido | IQ-004 |
| RS-003 | Tokens JWT con expiracion maxima de 1 hora, refresh tokens de 7 dias | Alto | Token expirado resulta en 401 Unauthorized | OQ-058 |
| RS-004 | Rate limiting: maximo 100 requests/minuto por usuario | Medio | Request 101 en 1 minuto retorna 429 Too Many Requests | OQ-059 |
| RS-005 | Proteccion contra SQL injection via prepared statements | Critico | Input malicioso no ejecuta SQL arbitrario | OQ-060 |
| RS-006 | CORS configurado para aceptar solo origenes autorizados | Alto | Request desde origen no autorizado retorna 403 | IQ-005 |

---

## 9. CRITERIOS DE ACEPTACION GLOBALES

1. **100% de requerimientos Criticos** deben pasar IQ/OQ/PQ sin desviaciones abiertas
2. **95% de requerimientos Alto** deben pasar; desviaciones documentadas con CAPA
3. **90% de requerimientos Medio/Bajo** deben pasar; desviaciones menores aceptables con justificacion
4. **Matriz de Trazabilidad** completa: cada RF/RNF/RR/RI/RS vinculado a al menos 1 test
5. **Zero defectos criticos** en audit trail y firma electronica

---

## 10. DOCUMENTOS DE REFERENCIA

- ISPE GAMP 5: A Risk-Based Approach to Compliant GxP Computerized Systems (2da Edicion, 2022)
- ANMAT Disposicion 4159/2023 - Anexo 6: Sistemas Informatizados
- Ley 27.669 - Marco Regulatorio Cannabis (ARICCAME)
- EU GMP Annex 11 - Computerised Systems
- 21 CFR Part 11 - Electronic Records; Electronic Signatures
- ICH Q9 - Quality Risk Management
- ISPE GAMP Guide: Artificial Intelligence (Julio 2025)

---

## 11. APENDICE A: Glosario

| Termino | Definicion |
|---------|-----------|
| ALCOA+ | Attributable, Legible, Contemporaneous, Original, Accurate + Complete, Consistent, Enduring, Available |
| Audit Trail | Registro cronologico inmutable de todas las acciones sobre datos regulados |
| CAPA | Corrective and Preventive Action (Accion Correctiva y Preventiva) |
| GAMP5 | Good Automated Manufacturing Practice, 5ta guia de ISPE |
| IQ/OQ/PQ | Installation/Operational/Performance Qualification |
| PWA | Progressive Web App |
| RLS | Row Level Security (seguridad a nivel de fila en PostgreSQL) |
| URS | User Requirement Specification |
| VMP | Validation Master Plan |

---

## 12. APROBACIONES

| Rol | Nombre | Firma | Fecha |
|-----|--------|-------|-------|
| Propietario del Proceso | _______________ | _______________ | ___/___/______ |
| QA/Regulatorio | _______________ | _______________ | ___/___/______ |
| IT/Desarrollo | _______________ | _______________ | ___/___/______ |
| Propietario del Sistema | _______________ | _______________ | ___/___/______ |
