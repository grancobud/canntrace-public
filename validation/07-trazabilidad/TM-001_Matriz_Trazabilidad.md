# TM-001 - Matriz de Trazabilidad Bidireccional

| Campo | Detalle |
|---|---|
| **ID Documento** | TM-001 |
| **Titulo** | Matriz de Trazabilidad Bidireccional GAMP5 |
| **Proyecto** | CannTrace - PWA de Trazabilidad de Cannabis |
| **Version** | 0.1 |
| **Fecha** | 2026-04-16 |
| **Clasificacion GAMP5** | Categoria 5 - Software Personalizado |
| **Estado** | Borrador |
| **Autor** | Equipo de Validacion CannTrace |

---

## 1. PROPOSITO

El proposito de esta Matriz de Trazabilidad Bidireccional es asegurar la trazabilidad completa y bidireccional desde cada requerimiento definido en la Especificacion de Requerimientos de Usuario (URS-001) hasta los casos de prueba correspondientes (IQ/OQ/PQ), pasando por las Especificaciones Funcionales (FS), Especificaciones de Diseno (DS) y el Analisis de Riesgos (FMEA).

Esta matriz garantiza que:
- Cada requerimiento del URS tiene al menos una especificacion funcional asociada
- Cada especificacion funcional tiene un diseno correspondiente
- Cada riesgo identificado en el FMEA esta vinculado al requerimiento original
- Cada requerimiento tiene al menos un caso de prueba que verifica su cumplimiento
- No existen requerimientos huerfanos ni pruebas sin requerimiento asociado

## 2. ALCANCE

Cubre todos los requerimientos del documento URS-001:
- **RF-001 a RF-040**: Requerimientos Funcionales
- **RNF-001 a RNF-007**: Requerimientos No Funcionales
- **RR-001 a RR-013**: Requerimientos Regulatorios
- **RI-001 a RI-005**: Requerimientos de Interfaz
- **RS-001 a RS-006**: Requerimientos de Seguridad

## 3. DOCUMENTOS REFERENCIADOS

| ID Documento | Titulo | Version |
|---|---|---|
| URS-001 | Especificacion de Requerimientos de Usuario | 0.1 |
| FS-001 | Especificacion Funcional | 0.1 |
| DS-001 | Especificacion de Diseno | 0.1 |
| FMEA-001 | Analisis de Modos de Falla y Efectos | 0.1 |
| IQ-001 | Protocolo de Calificacion de Instalacion | 0.1 |
| OQ-001 | Protocolo de Calificacion Operacional | 0.1 |
| PQ-001 | Protocolo de Calificacion de Desempeno | 0.1 |

## 4. CONVENCIONES DE REFERENCIA

### 4.1 Especificacion Funcional (FS)
| Prefijo | Modulo |
|---|---|
| FS-2.x | Autenticacion y Control de Acceso |
| FS-3.x | Chat e Interaccion con IA |
| FS-4.x | Escaneo y Generacion de QR |
| FS-5.x | Operaciones de Cultivo |
| FS-6.x | Trazabilidad de Lotes |
| FS-7.x | Gestion de Stock e Inventario |
| FS-8.x | Reportes y Exportaciones |
| FS-9.x | Audit Trail |

### 4.2 Especificacion de Diseno (DS)
| Prefijo | Componente |
|---|---|
| DS-1.x | Frontend (PWA/UI) |
| DS-2.x | Backend (API/Logica de Negocio) |
| DS-3.x | Base de Datos |
| DS-4.x | Inteligencia Artificial |
| DS-5.x | Infraestructura y DevOps |

### 4.3 Casos de Prueba
| Prefijo | Fase |
|---|---|
| IQ-xxx | Calificacion de Instalacion |
| OQ-xxx | Calificacion Operacional |
| PQ-xxx | Calificacion de Desempeno |

---

## 5. MATRIZ DE TRAZABILIDAD

### 5.1 Requerimientos Funcionales (RF-001 a RF-040)

| URS ID | Descripcion | FS Ref | DS Ref | FMEA Ref | Test Case | Estado |
|---|---|---|---|---|---|---|
| RF-001 | Login con credenciales y validacion de roles | FS-2.1 | DS-1.1, DS-2.1 | FMEA-001 | OQ-001 | Pendiente |
| RF-002 | Registro de usuarios con aprobacion de admin | FS-2.2 | DS-1.1, DS-2.1, DS-3.1 | FMEA-002 | OQ-002 | Pendiente |
| RF-003 | Gestion de roles y permisos (admin, operador, auditor, lectura) | FS-2.3 | DS-2.1, DS-3.1 | FMEA-003 | OQ-003 | Pendiente |
| RF-004 | Recuperacion de contrasena por email | FS-2.4 | DS-1.1, DS-2.1 | FMEA-004 | OQ-004 | Pendiente |
| RF-005 | Cierre de sesion automatico por inactividad | FS-2.5 | DS-1.2, DS-2.1 | FMEA-005 | OQ-005 | Pendiente |
| RF-006 | Chat conversacional con IA para consultas operativas | FS-3.1 | DS-1.3, DS-4.1 | FMEA-006 | OQ-006 | Pendiente |
| RF-007 | Procesamiento de lenguaje natural en espanol | FS-3.2 | DS-4.1, DS-4.2 | FMEA-007 | OQ-007 | Pendiente |
| RF-008 | Historial de conversaciones por usuario | FS-3.3 | DS-1.3, DS-3.2 | FMEA-008 | OQ-008 | Pendiente |
| RF-009 | Respuestas contextuales basadas en datos del sistema | FS-3.4 | DS-4.1, DS-2.2 | FMEA-009 | OQ-009 | Pendiente |
| RF-010 | Sugerencias automaticas de acciones desde el chat | FS-3.5 | DS-4.1, DS-1.3 | FMEA-010 | OQ-010 | Pendiente |
| RF-011 | Generacion de codigos QR unicos por lote/planta | FS-4.1 | DS-1.4, DS-2.3 | FMEA-011 | OQ-011 | Pendiente |
| RF-012 | Escaneo de QR con camara del dispositivo | FS-4.2 | DS-1.4 | FMEA-012 | OQ-012 | Pendiente |
| RF-013 | Vinculacion QR a registro de trazabilidad completo | FS-4.3 | DS-2.3, DS-3.3 | FMEA-013 | OQ-013 | Pendiente |
| RF-014 | Impresion de etiquetas QR | FS-4.4 | DS-1.4, DS-2.3 | FMEA-014 | OQ-014 | Pendiente |
| RF-015 | Lectura QR sin conexion con sincronizacion posterior | FS-4.5 | DS-1.5, DS-2.3 | FMEA-015 | OQ-015 | Pendiente |
| RF-016 | Registro de siembra con fecha, cepa, sustrato y responsable | FS-5.1 | DS-1.6, DS-2.4, DS-3.4 | FMEA-016 | OQ-016 | Pendiente |
| RF-017 | Registro de riego con volumen, pH, EC y nutrientes | FS-5.2 | DS-1.6, DS-2.4, DS-3.4 | FMEA-017 | OQ-017 | Pendiente |
| RF-018 | Registro de condiciones ambientales (temp, humedad, CO2) | FS-5.3 | DS-1.6, DS-2.4, DS-3.4 | FMEA-018 | OQ-018 | Pendiente |
| RF-019 | Registro de aplicacion de fertilizantes y fitosanitarios | FS-5.4 | DS-1.6, DS-2.4, DS-3.4 | FMEA-019 | OQ-019 | Pendiente |
| RF-020 | Registro de poda, trasplante y cambio de fotoperiodo | FS-5.5 | DS-1.6, DS-2.4 | FMEA-020 | OQ-020 | Pendiente |
| RF-021 | Registro de cosecha con peso humedo y seco | FS-5.6 | DS-1.6, DS-2.4, DS-3.4 | FMEA-021 | OQ-021 | Pendiente |
| RF-022 | Registro de secado y curado con parametros de control | FS-5.7 | DS-1.6, DS-2.4 | FMEA-022 | OQ-022 | Pendiente |
| RF-023 | Registro de analisis de laboratorio (cannabinoides, microbiologia) | FS-5.8 | DS-1.6, DS-2.4, DS-3.4 | FMEA-023 | OQ-023 | Pendiente |
| RF-024 | Workflow de aprobacion/rechazo de lotes | FS-5.9 | DS-2.4, DS-3.4 | FMEA-024 | OQ-024 | Pendiente |
| RF-025 | Alertas por parametros fuera de rango | FS-5.10 | DS-2.5, DS-1.7 | FMEA-025 | OQ-025 | Pendiente |
| RF-026 | Trazabilidad completa semilla-a-venta por lote | FS-6.1 | DS-2.6, DS-3.5 | FMEA-026 | OQ-026 | Pendiente |
| RF-027 | Genealogia de lotes (division, mezcla, derivacion) | FS-6.2 | DS-2.6, DS-3.5 | FMEA-027 | OQ-027 | Pendiente |
| RF-028 | Consulta de historial completo por codigo QR | FS-6.3 | DS-2.6, DS-1.4 | FMEA-028 | OQ-028 | Pendiente |
| RF-029 | Cadena de custodia con firmas electronicas | FS-6.4 | DS-2.6, DS-3.5 | FMEA-029 | OQ-029 | Pendiente |
| RF-030 | Recall/retiro de lotes con notificacion automatica | FS-6.5 | DS-2.6, DS-2.5 | FMEA-030 | OQ-030 | Pendiente |
| RF-031 | Inventario en tiempo real por ubicacion y estado | FS-7.1 | DS-1.8, DS-2.7, DS-3.6 | FMEA-031 | OQ-031 | Pendiente |
| RF-032 | Movimientos de stock entre ubicaciones | FS-7.2 | DS-1.8, DS-2.7 | FMEA-032 | OQ-032 | Pendiente |
| RF-033 | Alertas de stock minimo y vencimiento | FS-7.3 | DS-2.7, DS-2.5 | FMEA-033 | OQ-033 | Pendiente |
| RF-034 | Conciliacion de inventario fisico vs sistema | FS-7.4 | DS-1.8, DS-2.7 | FMEA-034 | OQ-034 | Pendiente |
| RF-035 | Registro de destruccion de material con evidencia | FS-7.5 | DS-1.8, DS-2.7, DS-3.6 | FMEA-035 | OQ-035 | Pendiente |
| RF-036 | Dashboard con KPIs de produccion y cumplimiento | FS-8.1 | DS-1.9, DS-2.8 | FMEA-036 | OQ-036 | Pendiente |
| RF-037 | Reportes regulatorios preformateados (ANMAT, SENASA) | FS-8.2 | DS-1.9, DS-2.8 | FMEA-037 | OQ-037 | Pendiente |
| RF-038 | Exportacion a PDF, Excel y CSV | FS-8.3 | DS-1.9, DS-2.8 | FMEA-038 | OQ-038 | Pendiente |
| RF-039 | Reportes de trazabilidad por lote con linea de tiempo | FS-8.4 | DS-1.9, DS-2.8 | FMEA-039 | OQ-039 | Pendiente |
| RF-040 | Programacion de reportes automaticos | FS-8.5 | DS-2.8, DS-5.3 | FMEA-040 | OQ-040 | Pendiente |

### 5.2 Requerimientos No Funcionales (RNF-001 a RNF-007)

| URS ID | Descripcion | FS Ref | DS Ref | FMEA Ref | Test Case | Estado |
|---|---|---|---|---|---|---|
| RNF-001 | Tiempo de respuesta menor a 2 segundos para operaciones criticas | FS-9.1 | DS-2.9, DS-5.1 | FMEA-041 | PQ-001 | Pendiente |
| RNF-002 | Disponibilidad del sistema 99.5% (uptime anual) | FS-9.2 | DS-5.1, DS-5.2 | FMEA-042 | PQ-002 | Pendiente |
| RNF-003 | Soporte para 100 usuarios concurrentes minimo | FS-9.3 | DS-2.9, DS-5.1 | FMEA-043 | PQ-003 | Pendiente |
| RNF-004 | PWA instalable en dispositivos moviles y desktop | FS-9.4 | DS-1.1, DS-5.4 | FMEA-044 | IQ-001 | Pendiente |
| RNF-005 | Funcionamiento offline con sincronizacion automatica | FS-9.5 | DS-1.5, DS-2.9 | FMEA-045 | PQ-004 | Pendiente |
| RNF-006 | Interfaz responsive adaptada a pantallas 320px a 2560px | FS-9.6 | DS-1.1, DS-1.2 | FMEA-046 | PQ-005 | Pendiente |
| RNF-007 | Backup automatico diario con retencion de 365 dias | FS-9.7 | DS-5.2, DS-3.7 | FMEA-047 | IQ-002, PQ-006 | Pendiente |

### 5.3 Requerimientos Regulatorios (RR-001 a RR-013)

| URS ID | Descripcion | FS Ref | DS Ref | FMEA Ref | Test Case | Estado |
|---|---|---|---|---|---|---|
| RR-001 | Cumplimiento de Resolucion 845/2024 ANMAT (cannabis medicinal) | FS-6.1, FS-8.2 | DS-2.6, DS-2.8 | FMEA-048 | OQ-041, PQ-007 | Pendiente |
| RR-002 | Cumplimiento Ley 27.350 y Decreto 883/2020 | FS-6.1, FS-8.2 | DS-2.6, DS-2.8 | FMEA-049 | OQ-042 | Pendiente |
| RR-003 | Registro SENASA para trazabilidad de insumos agricolas | FS-5.4, FS-8.2 | DS-2.4, DS-2.8 | FMEA-050 | OQ-043 | Pendiente |
| RR-004 | Audit trail conforme 21 CFR Part 11 | FS-9.1 | DS-2.10, DS-3.8 | FMEA-051 | OQ-044 | Pendiente |
| RR-005 | Firma electronica con significado legal | FS-6.4, FS-9.1 | DS-2.10, DS-3.8 | FMEA-052 | OQ-045 | Pendiente |
| RR-006 | Registros inmodificables (solo append, sin borrado fisico) | FS-9.1 | DS-2.10, DS-3.8 | FMEA-053 | OQ-046 | Pendiente |
| RR-007 | Timestamp con fuente de tiempo confiable (NTP) | FS-9.1 | DS-5.5, DS-2.10 | FMEA-054 | IQ-003, OQ-047 | Pendiente |
| RR-008 | Retencion de registros minimo 10 anos | FS-9.1 | DS-3.7, DS-5.2 | FMEA-055 | PQ-008 | Pendiente |
| RR-009 | Generacion de reportes para inspecciones regulatorias | FS-8.2 | DS-2.8, DS-1.9 | FMEA-056 | OQ-048 | Pendiente |
| RR-010 | Control de cambios documentado en el sistema | FS-9.1 | DS-2.10, DS-3.8 | FMEA-057 | OQ-049 | Pendiente |
| RR-011 | Identificacion unica e irrepetible por lote | FS-6.1, FS-4.1 | DS-2.3, DS-3.5 | FMEA-058 | OQ-050 | Pendiente |
| RR-012 | Trazabilidad de materias primas hasta producto final | FS-6.1, FS-6.2 | DS-2.6, DS-3.5 | FMEA-059 | OQ-051, PQ-009 | Pendiente |
| RR-013 | Capacidad de recall completo en menos de 24 horas | FS-6.5 | DS-2.6, DS-2.5 | FMEA-060 | PQ-010 | Pendiente |

### 5.4 Requerimientos de Interfaz (RI-001 a RI-005)

| URS ID | Descripcion | FS Ref | DS Ref | FMEA Ref | Test Case | Estado |
|---|---|---|---|---|---|---|
| RI-001 | Integracion con API de ANMAT para reporte automatico | FS-8.2 | DS-2.11, DS-5.6 | FMEA-061 | OQ-052, PQ-011 | Pendiente |
| RI-002 | Integracion con sistemas de laboratorio (LIMS) via API | FS-5.8 | DS-2.11, DS-5.6 | FMEA-062 | OQ-053 | Pendiente |
| RI-003 | Integracion con sensores IoT (temperatura, humedad) | FS-5.3 | DS-2.11, DS-5.6 | FMEA-063 | IQ-004, OQ-054 | Pendiente |
| RI-004 | Integracion con sistema contable/ERP via API REST | FS-7.1, FS-8.3 | DS-2.11, DS-5.6 | FMEA-064 | OQ-055 | Pendiente |
| RI-005 | Notificaciones push y email para alertas criticas | FS-5.10, FS-6.5 | DS-2.5, DS-5.7 | FMEA-065 | OQ-056 | Pendiente |

### 5.5 Requerimientos de Seguridad (RS-001 a RS-006)

| URS ID | Descripcion | FS Ref | DS Ref | FMEA Ref | Test Case | Estado |
|---|---|---|---|---|---|---|
| RS-001 | Encriptacion de datos en transito (TLS 1.3) y en reposo (AES-256) | FS-2.5, FS-9.1 | DS-5.8, DS-3.9 | FMEA-066 | IQ-005, OQ-057 | Pendiente |
| RS-002 | Autenticacion multifactor (MFA) para roles criticos | FS-2.6 | DS-1.1, DS-2.1 | FMEA-067 | OQ-058 | Pendiente |
| RS-003 | Politica de contrasenas seguras (minimo 12 caracteres, complejidad) | FS-2.7 | DS-2.1, DS-1.1 | FMEA-068 | OQ-059 | Pendiente |
| RS-004 | Bloqueo de cuenta tras 5 intentos fallidos de login | FS-2.8 | DS-2.1, DS-3.1 | FMEA-069 | OQ-060 | Pendiente |
| RS-005 | Registro de todos los accesos y acciones en log de seguridad | FS-9.1 | DS-2.10, DS-3.8 | FMEA-070 | OQ-061 | Pendiente |
| RS-006 | Segregacion de datos por organizacion (multi-tenancy seguro) | FS-2.9 | DS-2.12, DS-3.10 | FMEA-071 | OQ-062, PQ-012 | Pendiente |

---

## 6. RESUMEN DE COBERTURA

### 6.1 Estadisticas de Trazabilidad

| Categoria | Cantidad Requerimientos | FS Refs | DS Refs | FMEA Refs | Test Cases |
|---|---|---|---|---|---|
| Funcionales (RF) | 40 | 40 | 40 | 40 | 40 |
| No Funcionales (RNF) | 7 | 7 | 7 | 7 | 8 |
| Regulatorios (RR) | 13 | 13 | 13 | 13 | 15 |
| Interfaz (RI) | 5 | 5 | 5 | 5 | 6 |
| Seguridad (RS) | 6 | 6 | 6 | 6 | 7 |
| **TOTAL** | **71** | **71** | **71** | **71** | **76** |

### 6.2 Cobertura por Fase de Prueba

| Fase | Cantidad de Casos | Cobertura |
|---|---|---|
| IQ (Calificacion de Instalacion) | IQ-001 a IQ-005 | Instalacion PWA, backup, NTP, IoT, TLS |
| OQ (Calificacion Operacional) | OQ-001 a OQ-062 | Todas las funcionalidades operativas |
| PQ (Calificacion de Desempeno) | PQ-001 a PQ-012 | Rendimiento, disponibilidad, carga, regulatorio |

### 6.3 Analisis de Brechas

| Verificacion | Resultado |
|---|---|
| Requerimientos sin FS | 0 (sin brechas) |
| Requerimientos sin DS | 0 (sin brechas) |
| Requerimientos sin FMEA | 0 (sin brechas) |
| Requerimientos sin Test Case | 0 (sin brechas) |
| Test Cases huerfanos (sin URS) | 0 (sin brechas) |

---

## 7. MATRIZ INVERSA (TEST CASE a URS)

### 7.1 Calificacion de Instalacion (IQ)

| Test Case | URS IDs Verificados |
|---|---|
| IQ-001 | RNF-004 |
| IQ-002 | RNF-007 |
| IQ-003 | RR-007 |
| IQ-004 | RI-003 |
| IQ-005 | RS-001 |

### 7.2 Calificacion Operacional (OQ)

| Test Case | URS IDs Verificados |
|---|---|
| OQ-001 | RF-001 |
| OQ-002 | RF-002 |
| OQ-003 | RF-003 |
| OQ-004 | RF-004 |
| OQ-005 | RF-005 |
| OQ-006 | RF-006 |
| OQ-007 | RF-007 |
| OQ-008 | RF-008 |
| OQ-009 | RF-009 |
| OQ-010 | RF-010 |
| OQ-011 | RF-011 |
| OQ-012 | RF-012 |
| OQ-013 | RF-013 |
| OQ-014 | RF-014 |
| OQ-015 | RF-015 |
| OQ-016 | RF-016 |
| OQ-017 | RF-017 |
| OQ-018 | RF-018 |
| OQ-019 | RF-019 |
| OQ-020 | RF-020 |
| OQ-021 | RF-021 |
| OQ-022 | RF-022 |
| OQ-023 | RF-023 |
| OQ-024 | RF-024 |
| OQ-025 | RF-025 |
| OQ-026 | RF-026 |
| OQ-027 | RF-027 |
| OQ-028 | RF-028 |
| OQ-029 | RF-029 |
| OQ-030 | RF-030 |
| OQ-031 | RF-031 |
| OQ-032 | RF-032 |
| OQ-033 | RF-033 |
| OQ-034 | RF-034 |
| OQ-035 | RF-035 |
| OQ-036 | RF-036 |
| OQ-037 | RF-037 |
| OQ-038 | RF-038 |
| OQ-039 | RF-039 |
| OQ-040 | RF-040 |
| OQ-041 | RR-001 |
| OQ-042 | RR-002 |
| OQ-043 | RR-003 |
| OQ-044 | RR-004 |
| OQ-045 | RR-005 |
| OQ-046 | RR-006 |
| OQ-047 | RR-007 |
| OQ-048 | RR-009 |
| OQ-049 | RR-010 |
| OQ-050 | RR-011 |
| OQ-051 | RR-012 |
| OQ-052 | RI-001 |
| OQ-053 | RI-002 |
| OQ-054 | RI-003 |
| OQ-055 | RI-004 |
| OQ-056 | RI-005 |
| OQ-057 | RS-001 |
| OQ-058 | RS-002 |
| OQ-059 | RS-003 |
| OQ-060 | RS-004 |
| OQ-061 | RS-005 |
| OQ-062 | RS-006 |

### 7.3 Calificacion de Desempeno (PQ)

| Test Case | URS IDs Verificados |
|---|---|
| PQ-001 | RNF-001 |
| PQ-002 | RNF-002 |
| PQ-003 | RNF-003 |
| PQ-004 | RNF-005 |
| PQ-005 | RNF-006 |
| PQ-006 | RNF-007 |
| PQ-007 | RR-001 |
| PQ-008 | RR-008 |
| PQ-009 | RR-012 |
| PQ-010 | RR-013 |
| PQ-011 | RI-001 |
| PQ-012 | RS-006 |

---

## 8. HISTORIAL DE REVISIONES

| Version | Fecha | Autor | Descripcion del Cambio |
|---|---|---|---|
| 0.1 | 2026-04-16 | Equipo de Validacion | Creacion inicial de la matriz de trazabilidad |

---

## 9. APROBACIONES

| Rol | Nombre | Firma | Fecha |
|---|---|---|---|
| Autor | _________________ | _________________ | ____/____/________ |
| Revisor QA | _________________ | _________________ | ____/____/________ |
| Director de Calidad | _________________ | _________________ | ____/____/________ |
| Responsable Regulatorio | _________________ | _________________ | ____/____/________ |
