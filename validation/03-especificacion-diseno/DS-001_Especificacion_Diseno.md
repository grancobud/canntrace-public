# DS-001: Especificacion de Diseno del Sistema

## CannTrace -- PWA de Trazabilidad Seed-to-Sale de Cannabis Medicinal

---

| Campo | Detalle |
|---|---|
| **ID Documento** | DS-001 |
| **Titulo** | Especificacion de Diseno del Sistema CannTrace |
| **Version** | 0.1 (Borrador) |
| **Fecha** | 2026-04-16 |
| **Estado** | Borrador |
| **Clasificacion GAMP5** | Categoria 5 -- Software Configurado a Medida |
| **Marco Regulatorio** | ANMAT Disp. 4159/2023 Anexo 6, ARICCAME Ley 27.669, EU GMP Annex 11, 21 CFR Part 11 |
| **Preparado por** | Equipo de Desarrollo CannTrace |
| **Documento Padre** | URS-001 v0.1, FS-001 v0.1 |

### Historial de Revisiones

| Version | Fecha | Autor | Descripcion del Cambio | Aprobado por |
|---|---|---|---|---|
| 0.1 | 2026-04-16 | Equipo de Desarrollo | Emision inicial del documento | Pendiente |
| | | | | |

---

## TABLA DE CONTENIDOS

1. [Proposito y Alcance](#1-proposito-y-alcance)
2. [Documentos de Referencia](#2-documentos-de-referencia)
3. [DS-1: Arquitectura Frontend](#ds-1-arquitectura-frontend)
4. [DS-2: Arquitectura Backend](#ds-2-arquitectura-backend)
5. [DS-3: Diseno de Base de Datos](#ds-3-diseno-de-base-de-datos)
6. [DS-4: Integracion de IA](#ds-4-integracion-de-ia)
7. [DS-5: Infraestructura](#ds-5-infraestructura)
8. [Aprobaciones](#6-aprobaciones)

---

## 1. PROPOSITO Y ALCANCE

### 1.1 Proposito

Este documento define el diseno tecnico detallado del sistema CannTrace, describiendo la arquitectura de cada componente, el esquema completo de base de datos, las interfaces de programacion y las decisiones de infraestructura. Cada decision de diseno esta vinculada a los requerimientos de URS-001 y las especificaciones funcionales de FS-001.

### 1.2 Alcance

El diseno cubre los cinco pilares tecnologicos del sistema:

| Seccion | Componente | Alcance |
|---|---|---|
| DS-1 | Frontend | PWA React, estructura de componentes, estado, routing |
| DS-2 | Backend | Edge Functions, endpoints API, logica de negocio |
| DS-3 | Base de Datos | Schema PostgreSQL completo, 16 tablas, triggers, RLS |
| DS-4 | Inteligencia Artificial | Pipeline Groq API, parsing texto-a-JSON, fallback |
| DS-5 | Infraestructura | Hosting, seguridad, backup, monitoreo |

---

## 2. DOCUMENTOS DE REFERENCIA

| ID Documento | Titulo | Version |
|---|---|---|
| VP-001 | Plan Maestro de Validacion | 0.1 |
| URS-001 | Especificacion de Requerimientos de Usuario | 0.1 |
| FS-001 | Especificacion Funcional | 0.1 |
| FMEA-001 | Analisis de Modos de Falla y Efectos | 0.1 |
| 001_schema_inicial.sql | Migracion Schema v0.1 (ingles) | 0.1 |
| 002_schema_espanol.sql | Migracion Schema v0.2 (espanol) | 0.2 |
| 003_pgaudit_openthc.sql | Configuracion pgAudit y OpenTHC | 0.1 |

---

## DS-1: ARQUITECTURA FRONTEND

*Requerimientos cubiertos: RF-006 a RF-015, RI-001 a RI-005, RNF-001, RNF-002, RNF-006, RNF-007*

### DS-1.1 Stack Tecnologico

| Componente | Tecnologia | Version | Justificacion |
|---|---|---|---|
| Framework | React | 18+ | Ecosistema maduro, amplia comunidad, renderizado eficiente |
| Build Tool | Vite | 6+ | HMR rapido, build optimizado, soporte nativo TypeScript |
| Lenguaje | TypeScript | 5.4+ | Tipado estatico para reducir errores en runtime (RR-005) |
| Estilos | TailwindCSS | 4+ | Utility-first, responsive nativo, tema consistente |
| Componentes UI | shadcn/ui | Ultima | Accesibilidad WCAG, composables, estilizables con Tailwind |
| Iconos | Lucide React | Ultima | Ligero, consistente, SVG optimizado |
| QR Scanner | html5-qrcode | 2.3+ | Lectura de QR via MediaDevices API (RF-012) |
| QR Generator | qrcode.react | 4+ | Generacion de codigos QR para impresion (RF-014) |
| PWA | vite-plugin-pwa | 0.20+ | Service Worker, manifest, cache offline (RNF-002) |
| HTTP Client | Supabase JS | 2.40+ | Cliente nativo con soporte Realtime y Auth |
| Estado Offline | IndexedDB (Dexie) | 4+ | Almacenamiento local para operaciones sin conexion |
| Routing | React Router | 7+ | Navegacion SPA con lazy loading |
| Formularios | React Hook Form + Zod | Ultimas | Validacion declarativa con esquemas tipados |
| PDF Export | jsPDF + html2canvas | Ultimas | Generacion de reportes PDF con hash (RF-038) |
| CSV Export | papaparse | 5+ | Exportacion CSV para ANMAT/ARICCAME (RF-039) |

### DS-1.2 Arquitectura de Componentes

```
canntrace-app/
  src/
  +-- main.tsx                    # Punto de entrada
  +-- App.tsx                     # Router principal + providers
  +-- components/
  |   +-- layout/
  |   |   +-- AppShell.tsx        # Layout principal (sidebar, header, main)
  |   |   +-- Sidebar.tsx         # Navegacion lateral responsive
  |   |   +-- Header.tsx          # Barra superior con usuario y notificaciones
  |   |   +-- BottomNav.tsx       # Navegacion inferior para movil
  |   +-- auth/
  |   |   +-- LoginForm.tsx       # RF-001: Formulario de login
  |   |   +-- MFASetup.tsx        # RF-001: Configuracion de MFA
  |   |   +-- ProtectedRoute.tsx  # RF-003: Wrapper de control de acceso
  |   +-- chat/
  |   |   +-- ChatContainer.tsx   # RF-006: Contenedor principal del chat
  |   |   +-- ChatMessage.tsx     # Burbuja de mensaje (usuario/sistema)
  |   |   +-- ChatInput.tsx       # Campo de entrada de texto libre
  |   |   +-- ConfirmationCard.tsx # RF-008: Tarjeta de datos extraidos
  |   |   +-- ManualForm.tsx      # RF-010: Formulario fallback
  |   +-- qr/
  |   |   +-- QRScanner.tsx       # RF-012: Escaner de QR via camara
  |   |   +-- QRBatchScanner.tsx  # RF-013: Escaner por rango/lote
  |   |   +-- QRGenerator.tsx     # Generador de QR para impresion
  |   +-- operations/
  |   |   +-- OperationWizard.tsx # RF-016 a RF-031: Wizard de operaciones
  |   |   +-- OperationTimeline.tsx # Linea de tiempo del lote
  |   |   +-- OperationDetail.tsx # Detalle de operacion confirmada
  |   +-- stock/
  |   |   +-- StockDashboard.tsx  # RF-035: Stock en tiempo real
  |   |   +-- StockMovement.tsx   # Movimientos de inventario
  |   +-- reports/
  |   |   +-- ReportBuilder.tsx   # RF-038/RF-039: Generador de reportes
  |   |   +-- TraceabilityView.tsx # RF-032/RF-033: Trazabilidad completa
  |   |   +-- AuditTrailViewer.tsx # RR-006: Visor de audit trail
  |   +-- admin/
  |   |   +-- UserManagement.tsx  # Gestion de usuarios y roles
  |   |   +-- SystemConfig.tsx    # Configuracion del sistema
  |   +-- ui/                     # Componentes base shadcn/ui
  +-- hooks/
  |   +-- useAuth.ts              # Hook de autenticacion
  |   +-- useChat.ts              # Hook de logica de chat + IA
  |   +-- useQRScanner.ts         # Hook de escaner QR
  |   +-- useOfflineSync.ts       # Hook de sincronizacion offline
  |   +-- useAuditTrail.ts        # Hook de consulta de audit trail
  +-- lib/
  |   +-- supabase.ts             # Cliente Supabase configurado
  |   +-- ai-parser.ts            # Comunicacion con Edge Function de IA
  |   +-- crypto.ts               # Funciones de hash SHA-256 (RR-011)
  |   +-- offline-db.ts           # IndexedDB via Dexie (RNF-002)
  |   +-- validators.ts           # Esquemas Zod para validacion
  +-- types/
  |   +-- database.ts             # Tipos generados de Supabase
  |   +-- operations.ts           # Tipos de operaciones seed-to-sale
  |   +-- enums.ts                # Enums del sistema
  +-- pages/
  |   +-- LoginPage.tsx           # /login
  |   +-- DashboardPage.tsx       # / (pagina principal)
  |   +-- ChatPage.tsx            # /chat (entrada de datos)
  |   +-- StockPage.tsx           # /stock
  |   +-- ReportsPage.tsx         # /reportes
  |   +-- TraceabilityPage.tsx    # /trazabilidad
  |   +-- AuditPage.tsx           # /auditoria
  |   +-- AdminPage.tsx           # /admin
  +-- styles/
      +-- globals.css             # Estilos globales + tema Tailwind
```

### DS-1.3 Routing y Navegacion

| Ruta | Pagina | Rol Minimo | Requerimiento |
|---|---|---|---|
| `/login` | LoginPage | Publico | RF-001 |
| `/` | DashboardPage | Operador | RF-040 |
| `/chat` | ChatPage | Operador | RF-006 a RF-011 |
| `/chat/confirmar/:id` | ConfirmationPage | Operador | RF-008, RF-009 |
| `/stock` | StockPage | Operador | RF-035 a RF-037 |
| `/operaciones` | OperationsPage | Operador | RF-016 a RF-031 |
| `/operaciones/:id` | OperationDetailPage | Operador | RF-034 |
| `/trazabilidad` | TraceabilityPage | Operador | RF-032, RF-033 |
| `/trazabilidad/:loteId` | TraceDetailPage | Operador | RF-032 |
| `/reportes` | ReportsPage | Supervisor | RF-038 a RF-040 |
| `/auditoria` | AuditPage | Auditor | RR-006, RR-009 |
| `/admin` | AdminPage | Administrador | RF-003 |
| `/admin/usuarios` | UserManagementPage | Administrador | RF-003 |
| `/admin/config` | SystemConfigPage | Administrador | -- |

### DS-1.4 Gestion de Estado

**Estrategia**: Estado local con React Context + Supabase Realtime para sincronizacion.

| Ambito | Tecnologia | Datos | Persistencia |
|---|---|---|---|
| Sesion de usuario | Supabase Auth + Context | JWT, perfil, rol | SessionStorage |
| Chat activo | useState/useReducer | Mensajes, JSON parseado | Memoria (sesion) |
| Stock en tiempo real | Supabase Realtime | Cambios en lotes | Suscripcion activa |
| Cache offline | IndexedDB (Dexie) | Operaciones pendientes | Persistente local |
| Tema/Preferencias | localStorage | Idioma, modo oscuro | Persistente local |

### DS-1.5 Service Worker y Modo Offline (RNF-002)

```
+--------------------------------------------------+
|                  SERVICE WORKER                    |
|  +---------------------------------------------+ |
|  |  ESTRATEGIA DE CACHE                         | |
|  |                                               | |
|  |  Cache-First: Archivos estaticos (JS, CSS,   | |
|  |               imagenes, fuentes)              | |
|  |                                               | |
|  |  Network-First: API calls, datos dinamicos    | |
|  |                                               | |
|  |  Stale-While-Revalidate: Catalogos           | |
|  |    (productos, almacenes, instalaciones)       | |
|  +---------------------------------------------+ |
|                                                    |
|  +---------------------------------------------+ |
|  |  COLA DE SINCRONIZACION                       | |
|  |                                               | |
|  |  1. Operador registra operacion offline       | |
|  |  2. Se guarda en IndexedDB con flag "pending" | |
|  |  3. Al reconectar, Background Sync envia      | |
|  |  4. Servidor valida y responde                | |
|  |  5. Se marca como "synced" en IndexedDB       | |
|  |  6. Conflictos: server-wins + notificacion    | |
|  +---------------------------------------------+ |
+--------------------------------------------------+
```

**Reglas de sincronizacion:**

- Las operaciones offline se encolan con timestamp del dispositivo.
- Al sincronizar, el servidor asigna `fecha_operacion` definitiva (RR-003).
- Si hay conflicto de stock (RF-036), el servidor rechaza y notifica al operador.
- Maximo 100 operaciones en cola offline antes de requerir conexion.

---

## DS-2: ARQUITECTURA BACKEND

*Requerimientos cubiertos: RF-001 a RF-005, RF-016 a RF-040, RR-001 a RR-013, RS-001 a RS-006*

### DS-2.1 Stack Tecnologico Backend

| Componente | Tecnologia | Justificacion |
|---|---|---|
| Runtime | Supabase Edge Functions (Deno) | Serverless, TypeScript nativo, baja latencia |
| Base de datos | Supabase PostgreSQL 15+ | RLS nativo, triggers, pgcrypto, PITR |
| Autenticacion | Supabase Auth (GoTrue) | JWT, MFA, RBAC, password hashing bcrypt |
| Storage | Supabase Storage (S3-compatible) | Documentos, fotos, certificados |
| Realtime | Supabase Realtime | Suscripciones a cambios de stock en tiempo real |

### DS-2.2 Endpoints API (Edge Functions)

#### DS-2.2.1 Autenticacion y Sesiones

| Endpoint | Metodo | Descripcion | URS Ref |
|---|---|---|---|
| `/auth/login` | POST | Login con email/password | RF-001 |
| `/auth/logout` | POST | Cierre de sesion con registro en audit trail | RF-005 |
| `/auth/mfa/setup` | POST | Configuracion de MFA | RF-001 |
| `/auth/mfa/verify` | POST | Verificacion de token MFA | RF-001 |
| `/auth/session/check` | GET | Verificar sesion activa (30 min inactividad) | RF-004 |

#### DS-2.2.2 Chat e IA

| Endpoint | Metodo | Descripcion | URS Ref |
|---|---|---|---|
| `/chat/parse` | POST | Enviar texto libre, retorna JSON estructurado | RF-007 |
| `/chat/confirm` | POST | Confirmar datos parseados, ejecutar operacion | RF-009 |
| `/chat/history` | GET | Obtener historial de conversaciones del usuario | RF-008 |

#### DS-2.2.3 Operaciones Seed-to-Sale

| Endpoint | Metodo | Descripcion | URS Ref |
|---|---|---|---|
| `/operaciones` | POST | Crear nueva operacion (16 tipos) | RF-016 a RF-031 |
| `/operaciones/:id` | GET | Obtener detalle de operacion | RF-034 |
| `/operaciones/:id/confirmar` | PUT | Confirmar operacion (borrador -> confirmada) | RF-009 |
| `/operaciones/:id/anular` | PUT | Anular operacion con motivo obligatorio | RR-013 |
| `/operaciones/sync` | POST | Sincronizar operaciones offline | RNF-002 |

#### DS-2.2.4 Stock y Trazabilidad

| Endpoint | Metodo | Descripcion | URS Ref |
|---|---|---|---|
| `/stock` | GET | Consultar stock actual (filtros por producto/ubicacion) | RF-035 |
| `/stock/lote/:id` | GET | Detalle de lote con historial | RF-037 |
| `/trazabilidad/inversa/:loteId` | GET | Cadena desde producto final a planta madre | RF-032 |
| `/trazabilidad/directa/:individuoId` | GET | Productos derivados de planta madre | RF-033 |
| `/qr/decode` | POST | Decodificar QR y retornar datos del stock | RF-012 |
| `/qr/rango` | POST | Calcular individuos de un rango escaneado | RF-014 |

#### DS-2.2.5 Reportes y Exportacion

| Endpoint | Metodo | Descripcion | URS Ref |
|---|---|---|---|
| `/reportes/trazabilidad/:loteId` | GET | Reporte PDF con hash SHA-256 | RF-038 |
| `/reportes/csv/anmat` | GET | Exportacion CSV formato ANMAT | RF-039 |
| `/reportes/csv/ariccame` | GET | Exportacion CSV formato ARICCAME | RF-039 |
| `/reportes/dashboard` | GET | Datos agregados para dashboard | RF-040 |
| `/auditoria` | GET | Consulta de audit trail (paginada) | RR-006, RR-009 |
| `/auditoria/integridad` | GET | Verificacion de cadena de hashes | RR-012 |

#### DS-2.2.6 Administracion

| Endpoint | Metodo | Descripcion | URS Ref |
|---|---|---|---|
| `/admin/usuarios` | GET/POST/PUT | CRUD de perfiles de usuario | RF-003 |
| `/admin/almacenes` | GET/POST/PUT | CRUD de almacenes | -- |
| `/admin/instalaciones` | GET/POST/PUT | CRUD de instalaciones | -- |
| `/admin/productos` | GET/POST/PUT | CRUD de productos | -- |
| `/admin/backup/verify` | POST | Verificar ultimo backup | RR-008 |

### DS-2.3 Logica de Negocio por Operacion

Cada operacion del flujo seed-to-sale sigue este patron estandar:

```
+---------------------------------------------------------------+
|                    PATRON DE OPERACION                         |
|                                                                |
|  1. RECIBIR request (JSON o texto parseado por IA)             |
|  2. VALIDAR campos obligatorios (Zod schema)                   |
|  3. VERIFICAR permisos del usuario (rol + RLS)                 |
|  4. VERIFICAR stock suficiente en origen (RF-036)              |
|  5. INICIAR transaccion PostgreSQL                             |
|     a. DECREMENTAR stock en lote/individuo origen              |
|     b. GENERAR nuevo lote/individuo en destino                 |
|     c. CREAR registro en tabla operaciones                     |
|     d. TRIGGER: audit trail automatico                         |
|     e. TRIGGER: historial de cambios automatico                |
|     f. GENERAR firma electronica SHA-256 (RR-011)              |
|  6. COMMIT transaccion                                         |
|  7. RETORNAR operacion creada + ID de lote destino             |
+---------------------------------------------------------------+
```

### DS-2.4 Tabla de Operaciones y Transformaciones

| Tipo Operacion | Origen (decrementa) | Destino (genera) | Campos Especificos | URS |
|---|---|---|---|---|
| ingreso_insumos | -- (externo) | Lote insumo | fecha_vencimiento, proveedor | RF-016 |
| planta_madre | -- | Individuo planta_madre | datos_extra (cepa, genetica) | RF-017 |
| fertilizacion | Lote insumo | -- (labor cultural) | cantidad_consumida, lote destino | RF-018 |
| utilizacion_insumos | Lote insumo | -- (asigna a lote) | individuo_ids | RF-019 |
| baja_stock | Individuo/Lote | -- (baja) | motivo (muerte, descarte, etc.) | RF-020 |
| esquejado | Individuo planta_madre | Individuo esqueje | individuo_padre_id | RF-021 |
| vegetativa | Individuo esqueje | Individuo planta | cambio de instalacion | RF-022 |
| poda | -- (labor cultural) | -- | individuo_id, responsable | RF-023 |
| floracion | Lote vegetativa | Lote flora | cambio de instalacion | RF-024 |
| control_plagas | Lote insumo | -- (labor cultural) | producto aplicado, dosis | RF-025 |
| cosecha | Lote flora | Lote cosecha | peso_fresco_kg | RF-026 |
| secado | N individuos | M individuos (M<=N) | peso_seco_kg, horas_secado | RF-027 |
| trimming | Individuos flor | Lote granel | peso_neto_g, rendimiento_% | RF-028 |
| cuarentena | Lote | Lote cuarentena | motivo, resultado_analisis | RF-029 |
| fraccionamiento | Lote granel | Lotes fraccionados | peso_unitario, n_fracciones | RF-030 |
| almacenamiento | Lote | Deposito final | ubicacion_deposito | RF-031 |

---

## DS-3: DISENO DE BASE DE DATOS

*Requerimientos cubiertos: RF-003, RF-011, RF-016 a RF-036, RR-001 a RR-013, RS-001 a RS-006*

*Referencia: `002_schema_espanol.sql` (migracion v0.2, produccion)*

### DS-3.1 Diagrama Entidad-Relacion

```
+---------------------+          +---------------------+
|  perfiles_usuario    |          |      sesiones        |
|---------------------|          |---------------------|
| id (PK, FK auth)    |<------+ | id (PK)              |
| nombre_completo      |       | | usuario_id (FK)      |---+
| rol (ENUM)           |       | | inicio               |   |
| activo               |       | | fin                  |   |
| ultimo_acceso        |       | | ip_direccion         |   |
| creado_en            |       | | agente_usuario       |   |
| actualizado_en       |       | | activa               |   |
+---------------------+       | +---------------------+   |
         |                     |                            |
         | 1:N                 |                            |
         v                     |                            |
+---------------------+       |                            |
|     almacenes        |       |                            |
|---------------------|       |                            |
| id (PK)              |       |                            |
| nombre               |       |                            |
| descripcion          |       |                            |
| activo               |       |                            |
| creado_en            |       |                            |
| creado_por (FK)      |-------+                            |
| eliminado            |                                    |
+---------------------+                                    |
         |                                                  |
         | 1:N                                              |
         v                                                  |
+---------------------+                                    |
|   instalaciones      |                                    |
|---------------------|                                    |
| id (PK)              |                                    |
| almacen_id (FK)      |                                    |
| nombre               |                                    |
| tipo (CHECK)         |                                    |
| activo               |                                    |
| creado_en            |                                    |
| creado_por (FK)      |------------------------------------+
| eliminado            |
+---------------------+
    |              |
    | 1:N          | 1:N
    v              v
+--------+   +--------+
| lotes  |   |individuos|
+--------+   +--------+
    |              |
    | N:1 (padre)  | N:1 (padre)
    v              v
+---------------------+       +---------------------+
|       lotes          |       |     individuos       |
|---------------------|       |---------------------|
| id (PK)              |       | id (PK)              |
| codigo_lote (UNIQUE) |       | codigo_serie (UNIQUE)|
| producto_id (FK)     |       | lote_id (FK)         |
| instalacion_id (FK)  |       | producto_id (FK)     |
| lote_padre_id (FK)   |---+   | instalacion_id (FK)  |
| cantidad (>=0)       |   |   | individuo_padre_id   |---+
| estado (ENUM)        |   |   | estado (ENUM)        |   |
| fecha_vencimiento    |   |   | datos_extra (JSONB)  |   |
| modo_seguimiento     |   |   | creado_en            |   |
| datos_extra (JSONB)  |   +-->| creado_por (FK)      |   |
| creado_en            |       | actualizado_en       |   |
| creado_por (FK)      |       | eliminado            |   |
| actualizado_en       |       +---------------------+   |
| eliminado            |                |                  |
+---------------------+                |                  |
         |                              |                  |
         | N:1                          +---> (auto-ref)   |
         v                                                 +---> (auto-ref)
+---------------------+
|     productos        |       +---------------------+
|---------------------|       | registro_auditoria   |
| id (PK)              |       |---------------------|
| nombre               |       | id (PK)              |
| tipo_producto (ENUM) |       | marca_tiempo         |
| modo_seguimiento     |       | usuario_id (FK)      |
| unidad_medida (CHECK)|       | nombre_usuario       |
| descripcion          |       | tipo_accion (ENUM)   |
| activo               |       | nombre_tabla         |
| creado_en            |       | id_registro          |
| creado_por (FK)      |       | valor_anterior (JSON)|
| eliminado            |       | valor_nuevo (JSONB)  |
+---------------------+       | texto_original       |
                               | json_estructurado    |
+---------------------+       | motivo               |
|    operaciones       |       | direccion_ip         |
|---------------------|       | sesion_id (FK)       |
| id (PK)              |       | firma_registro (SHA) |
| tipo_operacion (ENUM)|       | hash_anterior (SHA)  |
| estado (ENUM)        |       +---------------------+
| instalacion_origen   |
| lote_origen          |       +---------------------+
| instalacion_destino  |       | historial_cambios    |
| lote_destino         |       |---------------------|
| cantidad_entrada     |       | id (PK BIGSERIAL)    |
| cantidad_salida      |       | marca_tiempo         |
| responsable          |       | usuario_id (FK)      |
| observaciones        |       | nombre_tabla         |
| notas_sanitarias     |       | id_registro          |
| peso_fresco_kg       |       | operacion (CHECK)    |
| peso_seco_kg         |       | datos_anteriores     |
| peso_neto_g          |       | datos_nuevos         |
| rendimiento_%        |       | campos_modificados[] |
| temperatura_c        |       +---------------------+
| humedad_%            |
| co2_ppm              |       +---------------------+
| horas_secado         |       | insumos_operacion    |
| sustrato             |       |---------------------|
| datos_extra (JSONB)  |       | id (PK)              |
| individuo_ids[]      |       | operacion_id (FK)    |
| texto_original       |       | producto_id (FK)     |
| json_estructurado    |       | lote_id (FK)         |
| fecha_operacion      |       | cantidad_consumida   |
| creado_por (FK)      |       | creado_en            |
| confirmado_por (FK)  |       +---------------------+
| confirmado_en        |
| anulado_por (FK)     |
| anulado_en           |
| motivo_anulacion     |
| firma_registro (SHA) |
+---------------------+
```

### DS-3.2 Schema Completo de Tablas

#### DS-3.2.1 Tipos Enumerados

| Tipo | Valores | URS Ref |
|---|---|---|
| `rol_usuario` | operador, supervisor, auditor, administrador | RF-003 |
| `tipo_operacion` | ingreso_insumos, planta_madre, fertilizacion, utilizacion_insumos, baja_stock, esquejado, vegetativa, poda, floracion, control_plagas, cosecha, secado, trimming, cuarentena, fraccionamiento, almacenamiento | RF-016 a RF-031 |
| `tipo_producto` | insumo, planta_madre, esqueje, planta, flor, flor_trimmeada, flor_fraccionada, producto_final | -- |
| `estado_item` | activo, baja, consumido, procesado, cuarentena | RF-020 |
| `modo_seguimiento` | individual, lote | RF-028 |
| `accion_auditoria` | CREAR, MODIFICAR, ELIMINAR, CONFIRMAR, INICIAR_SESION, CERRAR_SESION, EXPORTAR | RR-006 |
| `estado_operacion` | borrador, confirmada, anulada | RF-009 |

#### DS-3.2.2 Tabla: `perfiles_usuario`

| Columna | Tipo | Constraint | Descripcion | URS |
|---|---|---|---|---|
| id | UUID | PK, FK auth.users | ID vinculado a Supabase Auth | RF-001 |
| nombre_completo | VARCHAR(200) | NOT NULL | Nombre completo del usuario | RR-001 |
| rol | rol_usuario | NOT NULL DEFAULT 'operador' | Rol asignado al usuario | RF-003 |
| activo | BOOLEAN | NOT NULL DEFAULT true | Flag de usuario activo/inactivo | RF-003 |
| ultimo_acceso | TIMESTAMPTZ | -- | Timestamp del ultimo login | RF-005 |
| creado_en | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Fecha de creacion | -- |
| actualizado_en | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Ultima actualizacion (trigger) | -- |

#### DS-3.2.3 Tabla: `sesiones`

| Columna | Tipo | Constraint | Descripcion | URS |
|---|---|---|---|---|
| id | UUID | PK DEFAULT gen_random_uuid() | ID unico de sesion | RF-005 |
| usuario_id | UUID | NOT NULL, FK auth.users | Usuario de la sesion | RF-005 |
| inicio | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Inicio de sesion | RF-005 |
| fin | TIMESTAMPTZ | -- | Fin de sesion (NULL si activa) | RF-004 |
| ip_direccion | INET | -- | Direccion IP del cliente | RS-005 |
| agente_usuario | TEXT | -- | User-Agent del navegador | -- |
| activa | BOOLEAN | NOT NULL DEFAULT true | Flag de sesion activa | RF-004 |

#### DS-3.2.4 Tabla: `almacenes`

| Columna | Tipo | Constraint | Descripcion | URS |
|---|---|---|---|---|
| id | UUID | PK DEFAULT gen_random_uuid() | ID del almacen | -- |
| nombre | VARCHAR(200) | NOT NULL | Nombre descriptivo | -- |
| descripcion | TEXT | -- | Descripcion del almacen | -- |
| activo | BOOLEAN | NOT NULL DEFAULT true | Flag activo/inactivo | -- |
| creado_en | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Fecha de creacion | -- |
| creado_por | UUID | NOT NULL, FK auth.users | Usuario creador | RR-001 |
| eliminado | BOOLEAN | NOT NULL DEFAULT false | Soft delete | -- |

#### DS-3.2.5 Tabla: `instalaciones`

| Columna | Tipo | Constraint | Descripcion | URS |
|---|---|---|---|---|
| id | UUID | PK DEFAULT gen_random_uuid() | ID de la instalacion | -- |
| almacen_id | UUID | NOT NULL, FK almacenes | Almacen contenedor | -- |
| nombre | VARCHAR(200) | NOT NULL | Nombre de la sala/area | -- |
| descripcion | TEXT | -- | Descripcion | -- |
| tipo | VARCHAR(100) | CHECK (11 valores validos) | Tipo de instalacion | RF-017 |
| activo | BOOLEAN | NOT NULL DEFAULT true | Flag activo | -- |
| creado_en | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Fecha creacion | -- |
| creado_por | UUID | NOT NULL, FK auth.users | Usuario creador | RR-001 |
| eliminado | BOOLEAN | NOT NULL DEFAULT false | Soft delete | -- |

**Valores validos de `tipo`:** sala_madres, sala_clonacion, sala_vegetativa, sala_flora, sala_cosecha, sala_secado, sala_trimming, deposito_cuarentena, sala_fraccionado, deposito, estanteria_insumos.

#### DS-3.2.6 Tabla: `productos`

| Columna | Tipo | Constraint | Descripcion | URS |
|---|---|---|---|---|
| id | UUID | PK DEFAULT gen_random_uuid() | ID del producto | -- |
| nombre | VARCHAR(200) | NOT NULL | Nombre del producto | -- |
| tipo_producto | tipo_producto | NOT NULL | Categoria del producto | -- |
| modo_seguimiento | modo_seguimiento | NOT NULL DEFAULT 'individual' | Individual o por lote | RF-028 |
| unidad_medida | VARCHAR(50) | NOT NULL DEFAULT 'unidad', CHECK | Unidad (unidad/gramo/kg/litro/ml) | -- |
| descripcion | TEXT | -- | Descripcion del producto | -- |
| activo | BOOLEAN | NOT NULL DEFAULT true | Flag activo | -- |
| creado_en | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Fecha creacion | -- |
| creado_por | UUID | NOT NULL, FK auth.users | Usuario creador | RR-001 |
| eliminado | BOOLEAN | NOT NULL DEFAULT false | Soft delete | -- |

#### DS-3.2.7 Tabla: `lotes`

| Columna | Tipo | Constraint | Descripcion | URS |
|---|---|---|---|---|
| id | UUID | PK DEFAULT gen_random_uuid() | ID del lote | -- |
| codigo_lote | VARCHAR(100) | NOT NULL UNIQUE | Codigo unico del lote | RF-032 |
| producto_id | UUID | NOT NULL, FK productos | Producto asociado | -- |
| instalacion_id | UUID | NOT NULL, FK instalaciones | Ubicacion actual | RF-034 |
| lote_padre_id | UUID | FK lotes (self) | Lote de origen (trazabilidad inversa) | RF-032 |
| cantidad | NUMERIC(12,4) | NOT NULL CHECK (>=0) | Cantidad actual en stock | RF-036 |
| estado | estado_item | NOT NULL DEFAULT 'activo' | Estado del lote | RF-020 |
| fecha_vencimiento | DATE | -- | Fecha de vencimiento | RF-016 |
| modo_seguimiento | modo_seguimiento | NOT NULL DEFAULT 'individual' | Modo de tracking | -- |
| datos_extra | JSONB | DEFAULT '{}' | Campos configurables | -- |
| creado_en | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Fecha creacion | RR-003 |
| creado_por | UUID | NOT NULL, FK auth.users | Usuario creador | RR-001 |
| actualizado_en | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Ultima actualizacion (trigger) | -- |
| eliminado | BOOLEAN | NOT NULL DEFAULT false | Soft delete | -- |

**Indices:** `idx_lotes_producto`, `idx_lotes_instalacion`, `idx_lotes_padre`.

#### DS-3.2.8 Tabla: `individuos`

| Columna | Tipo | Constraint | Descripcion | URS |
|---|---|---|---|---|
| id | UUID | PK DEFAULT gen_random_uuid() | ID del individuo | -- |
| codigo_serie | VARCHAR(100) | NOT NULL UNIQUE | Codigo QR unico | RF-012 |
| lote_id | UUID | NOT NULL, FK lotes | Lote contenedor | -- |
| producto_id | UUID | NOT NULL, FK productos | Producto asociado | -- |
| instalacion_id | UUID | NOT NULL, FK instalaciones | Ubicacion actual | RF-034 |
| individuo_padre_id | UUID | FK individuos (self) | Padre (planta madre -> esqueje) | RF-021 |
| estado | estado_item | NOT NULL DEFAULT 'activo' | Estado del individuo | RF-020 |
| datos_extra | JSONB | DEFAULT '{}' | Campos configurables | -- |
| creado_en | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Fecha creacion | RR-003 |
| creado_por | UUID | NOT NULL, FK auth.users | Usuario creador | RR-001 |
| actualizado_en | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Ultima actualizacion (trigger) | -- |
| eliminado | BOOLEAN | NOT NULL DEFAULT false | Soft delete | -- |

**Indices:** `idx_individuos_lote`, `idx_individuos_padre`.

#### DS-3.2.9 Tabla: `operaciones`

| Columna | Tipo | Constraint | Descripcion | URS |
|---|---|---|---|---|
| id | UUID | PK DEFAULT gen_random_uuid() | ID de la operacion | -- |
| tipo_operacion | tipo_operacion | NOT NULL | Tipo de operacion (16 valores) | RF-016 a RF-031 |
| estado | estado_operacion | NOT NULL DEFAULT 'borrador' | Borrador/Confirmada/Anulada | RF-009 |
| instalacion_origen_id | UUID | FK instalaciones | Instalacion de origen | RF-034 |
| lote_origen_id | UUID | FK lotes | Lote de origen | RF-034 |
| instalacion_destino_id | UUID | FK instalaciones | Instalacion de destino | RF-034 |
| lote_destino_id | UUID | FK lotes | Lote de destino | RF-034 |
| cantidad_entrada | NUMERIC(12,4) | CHECK (>=0) | Cantidad de entrada | -- |
| cantidad_salida | NUMERIC(12,4) | CHECK (>=0) | Cantidad de salida | -- |
| responsable | VARCHAR(200) | -- | Responsable de la operacion | -- |
| observaciones | TEXT | -- | Observaciones generales | -- |
| notas_sanitarias | TEXT | -- | Notas sanitarias/fitosanitarias | RF-025 |
| peso_fresco_kg | NUMERIC(10,3) | -- | Peso fresco en kg | RF-026 |
| peso_seco_kg | NUMERIC(10,3) | -- | Peso seco en kg | RF-027 |
| peso_neto_g | NUMERIC(10,3) | -- | Peso neto en gramos | RF-028 |
| rendimiento_porcentaje | NUMERIC(5,2) | CHECK (0-100) | Rendimiento en % | RF-028 |
| temperatura_c | NUMERIC(5,2) | -- | Temperatura en Celsius | RF-017 |
| humedad_porcentaje | NUMERIC(5,2) | CHECK (0-100) | Humedad relativa % | RF-017 |
| co2_ppm | NUMERIC(8,2) | -- | CO2 en ppm | RF-017 |
| horas_secado | NUMERIC(8,2) | -- | Horas de secado | RF-027 |
| sustrato | VARCHAR(200) | -- | Tipo de sustrato utilizado | RF-017 |
| datos_extra | JSONB | DEFAULT '{}' | Campos configurables | -- |
| individuo_ids | UUID[] | DEFAULT '{}' | IDs de individuos involucrados | RF-013 |
| texto_original | TEXT | -- | Texto libre del operador (ALCOA: Original) | RF-011, RR-004 |
| json_estructurado | JSONB | -- | JSON generado por la IA | RF-007 |
| fecha_operacion | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Timestamp inmutable | RR-003 |
| creado_por | UUID | NOT NULL, FK auth.users | Usuario que creo la operacion | RR-001 |
| confirmado_por | UUID | FK auth.users | Usuario que confirmo | RF-009 |
| confirmado_en | TIMESTAMPTZ | -- | Timestamp de confirmacion | RF-009 |
| anulado_por | UUID | FK auth.users | Usuario que anulo | RR-013 |
| anulado_en | TIMESTAMPTZ | -- | Timestamp de anulacion | -- |
| motivo_anulacion | TEXT | -- | Motivo obligatorio de anulacion | RR-013 |
| firma_registro | VARCHAR(64) | -- | Hash SHA-256 de firma electronica | RR-011 |

**Indices:** `idx_operaciones_tipo`, `idx_operaciones_lote_origen`, `idx_operaciones_lote_destino`, `idx_operaciones_creador`, `idx_operaciones_fecha`, `idx_operaciones_estado`.

#### DS-3.2.10 Tabla: `insumos_operacion`

| Columna | Tipo | Constraint | Descripcion | URS |
|---|---|---|---|---|
| id | UUID | PK DEFAULT gen_random_uuid() | ID del registro | -- |
| operacion_id | UUID | NOT NULL, FK operaciones | Operacion asociada | RF-018 |
| producto_id | UUID | NOT NULL, FK productos | Producto insumo consumido | RF-019 |
| lote_id | UUID | NOT NULL, FK lotes | Lote del insumo | RF-019 |
| cantidad_consumida | NUMERIC(12,4) | NOT NULL CHECK (>0) | Cantidad consumida | RF-018 |
| creado_en | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Fecha registro | -- |

#### DS-3.2.11 Tabla: `registro_auditoria` (Audit Trail Inmutable)

| Columna | Tipo | Constraint | Descripcion | URS |
|---|---|---|---|---|
| id | UUID | PK DEFAULT gen_random_uuid() | ID del registro | -- |
| marca_tiempo | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Timestamp del evento | RR-003 |
| usuario_id | UUID | NOT NULL, FK auth.users | Usuario que ejecuto la accion | RR-001 |
| nombre_usuario | VARCHAR(200) | NOT NULL | Nombre desnormalizado (legibilidad) | RR-002 |
| tipo_accion | accion_auditoria | NOT NULL | Tipo de accion registrada | RR-006 |
| nombre_tabla | VARCHAR(100) | NOT NULL | Tabla afectada | RR-006 |
| id_registro | UUID | NOT NULL | ID del registro afectado | RR-006 |
| valor_anterior | JSONB | -- | Estado previo (NULL si CREAR) | RR-013 |
| valor_nuevo | JSONB | -- | Estado nuevo (NULL si ELIMINAR) | RR-013 |
| texto_original | TEXT | -- | Texto libre del operador | RR-004 |
| json_estructurado | JSONB | -- | JSON parseado por IA | -- |
| motivo | TEXT | -- | Motivo (obligatorio para MODIFICAR/ELIMINAR) | RR-013 |
| direccion_ip | INET | -- | IP del cliente | RS-005 |
| sesion_id | UUID | FK sesiones | Sesion asociada | -- |
| firma_registro | VARCHAR(64) | NOT NULL (trigger) | SHA-256 del registro | RR-011 |
| hash_anterior | VARCHAR(64) | NOT NULL (trigger) | Hash del registro anterior (cadena) | RR-012 |

**Constraint:** `chk_motivo_obligatorio` -- Motivo NOT NULL para acciones MODIFICAR y ELIMINAR.

**Inmutabilidad:** Triggers `trg_auditoria_inmutable_update` y `trg_auditoria_inmutable_delete` impiden cualquier UPDATE o DELETE sobre esta tabla (RR-010).

**Indices:** `idx_auditoria_tabla_registro`, `idx_auditoria_usuario_tiempo`, `idx_auditoria_accion`, `idx_auditoria_tiempo`.

#### DS-3.2.12 Tabla: `historial_cambios` (pgMemento-style)

| Columna | Tipo | Constraint | Descripcion | URS |
|---|---|---|---|---|
| id | BIGSERIAL | PK | ID secuencial | -- |
| marca_tiempo | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Timestamp del cambio | RR-003 |
| usuario_id | UUID | NOT NULL, FK auth.users | Usuario que ejecuto el cambio | RR-001 |
| nombre_tabla | VARCHAR(100) | NOT NULL | Tabla afectada | -- |
| id_registro | UUID | NOT NULL | ID del registro | -- |
| operacion | VARCHAR(10) | CHECK (INSERT/UPDATE/DELETE) | Tipo de operacion SQL | -- |
| datos_anteriores | JSONB | -- | Estado previo completo | -- |
| datos_nuevos | JSONB | -- | Estado nuevo completo | -- |
| campos_modificados | TEXT[] | -- | Lista de columnas cambiadas | -- |

### DS-3.3 Triggers de Integridad

| Trigger | Tabla | Evento | Funcion | URS |
|---|---|---|---|---|
| trg_auditoria_inmutable_update | registro_auditoria | BEFORE UPDATE | impedir_modificacion_auditoria() | RR-010 |
| trg_auditoria_inmutable_delete | registro_auditoria | BEFORE DELETE | impedir_modificacion_auditoria() | RR-010 |
| trg_firma_auditoria | registro_auditoria | BEFORE INSERT | generar_firma_registro() | RR-011, RR-012 |
| trg_operaciones_timestamp_inmutable | operaciones | BEFORE UPDATE | impedir_cambio_timestamp() | RR-003 |
| trg_lotes_stock_check | lotes | BEFORE INSERT/UPDATE | verificar_stock_no_negativo() | RF-036 |
| trg_operaciones_auditoria | operaciones | AFTER INSERT/UPDATE | auditoria_automatica_operaciones() | RR-006 |
| trg_historial_lotes | lotes | AFTER INSERT/UPDATE/DELETE | registrar_historial_cambios() | -- |
| trg_historial_individuos | individuos | AFTER INSERT/UPDATE/DELETE | registrar_historial_cambios() | -- |
| trg_historial_productos | productos | AFTER INSERT/UPDATE/DELETE | registrar_historial_cambios() | -- |
| trg_historial_almacenes | almacenes | AFTER INSERT/UPDATE/DELETE | registrar_historial_cambios() | -- |
| trg_historial_instalaciones | instalaciones | AFTER INSERT/UPDATE/DELETE | registrar_historial_cambios() | -- |
| trg_lotes_actualizar | lotes | BEFORE UPDATE | actualizar_marca_tiempo() | -- |
| trg_individuos_actualizar | individuos | BEFORE UPDATE | actualizar_marca_tiempo() | -- |
| trg_perfiles_actualizar | perfiles_usuario | BEFORE UPDATE | actualizar_marca_tiempo() | -- |

### DS-3.4 Vistas de Reporte

| Vista | Descripcion | URS |
|---|---|---|
| vista_stock_actual | Stock en tiempo real por producto/lote/ubicacion | RF-035 |
| vista_trazabilidad_inversa | CTE recursiva desde producto final hasta planta madre | RF-032 |
| vista_reporte_auditoria | Datos formateados para exportacion regulatoria | RR-009 |

### DS-3.5 Row Level Security (RLS)

| Politica | Tabla | Operacion | Condicion | Rol |
|---|---|---|---|---|
| lectura_general_* | Todas las de negocio | SELECT | auth.uid() IS NOT NULL | Todos |
| crear_operaciones | operaciones | INSERT | rol IN (operador, supervisor, admin) | Operador+ |
| lectura_auditoria | registro_auditoria | SELECT | rol IN (auditor, admin) | Auditor+ |
| lectura_historial | historial_cambios | SELECT | rol IN (auditor, admin) | Auditor+ |
| admin_* | Config (perfiles, almacenes, etc.) | ALL | rol = administrador | Admin |
| sesiones_propias | sesiones | SELECT | usuario_id = auth.uid() | Propietario |
| auditoria_sin_insert_directo | registro_auditoria | INSERT | false (solo triggers) | Nadie |

---

## DS-4: INTEGRACION DE IA

*Requerimientos cubiertos: RF-006 a RF-011, RR-004*

### DS-4.1 Pipeline Texto-a-JSON

```
+-----------------------------------------------------------------------+
|                    FLUJO CHAT -> CONFIRMAR -> GUARDAR                   |
|                                                                         |
|  OPERADOR                    EDGE FUNCTION                    BASE DE  |
|  (Frontend)                  (Backend)                        DATOS    |
|                                                                         |
|  1. Escribe texto   ------>  2. Recibe texto                           |
|     libre en chat            3. Guarda texto_original (RR-004)         |
|                              4. Envia a Groq API:                      |
|                                 - System prompt con schema             |
|                                 - Texto del operador                   |
|                                 - Formato JSON esperado                |
|                              5. Recibe JSON + confidence score         |
|                                                                         |
|                              6. Evalua confidence:                      |
|                      +-------+  >= 70%: continua                       |
|                      |       |  < 70%: retorna fallback                |
|                      v       v                                          |
|  7a. VER tarjeta    7b. VER formulario                                 |
|      confirmacion       manual (fallback)                              |
|                                                                         |
|  8. EDITAR campos   ------>  (el operador corrige si necesario)        |
|     si necesario                                                        |
|                                                                         |
|  9. CONFIRMAR       ------>  10. Validar JSON completo (Zod)           |
|     explicitamente           11. Verificar stock (RF-036)              |
|                              12. INSERT en operaciones                  |
|                              13. TRIGGER: audit trail                   |
|                              14. TRIGGER: historial cambios             |
|                              15. Generar firma SHA-256                  |
|                                                                         |
|  16. VER confirmacion <-----  17. Retornar operacion creada            |
|      exitosa                                                            |
+-----------------------------------------------------------------------+
```

### DS-4.2 Configuracion de Groq API

| Parametro | Valor | Justificacion |
|---|---|---|
| Modelo | llama-3.1-8b-instant | Balance entre velocidad y precision |
| Temperatura | 0.1 | Salida deterministica para datos estructurados |
| Max tokens | 1024 | Suficiente para JSON de operacion completa |
| Top-p | 0.9 | Precision en vocabulario tecnico |
| Formato respuesta | JSON Mode | Garantiza salida JSON valida |
| Timeout | 10 segundos | Limite para no bloquear al operador |

### DS-4.3 System Prompt

El system prompt instruye al modelo para:

1. Identificar el tipo de operacion entre las 16 del flujo seed-to-sale.
2. Extraer campos estructurados segun la operacion detectada.
3. Retornar JSON con campo `confidence` (0.0 a 1.0).
4. Si no puede determinar el tipo, retornar `{ "tipo": null, "confidence": 0, "mensaje": "..." }`.

### DS-4.4 Esquema JSON de Respuesta

```json
{
  "tipo_operacion": "cosecha",
  "confidence": 0.92,
  "datos": {
    "instalacion_origen": "Sala de Flora",
    "lote_origen": "LOTE-FLORA-001",
    "instalacion_destino": "Sala de Cosecha",
    "peso_fresco_kg": 1.250,
    "responsable": "Juan Perez",
    "observaciones": "Cosecha completa del lote",
    "individuo_ids": ["IND-001", "IND-002"]
  },
  "campos_faltantes": [],
  "sugerencias": ["Verificar peso fresco con balanza calibrada"]
}
```

### DS-4.5 Umbral de Confianza y Fallback

| Rango Confidence | Accion | URS |
|---|---|---|
| >= 0.70 | Mostrar tarjeta de confirmacion con datos pre-llenados | RF-008 |
| 0.40 -- 0.69 | Mostrar tarjeta con advertencia "Baja confianza, verifique los datos" | RF-008 |
| < 0.40 | Activar formulario manual como fallback | RF-010 |
| Error de API / Timeout | Activar formulario manual + notificar al operador | RF-010 |

### DS-4.6 Consideraciones de Privacidad

- Los datos enviados a Groq API no incluyen IDs internos de base de datos.
- Se envian nombres genericos de productos y ubicaciones, no datos de pacientes.
- Segun terminos de Groq, los datos NO se usan para entrenamiento.
- El texto original se preserva intacto en `texto_original` antes del envio a Groq (RR-004).
- Referencia: SA-001-B (Evaluacion de proveedor Groq).

---

## DS-5: INFRAESTRUCTURA

*Requerimientos cubiertos: RNF-001 a RNF-005, RS-001 a RS-006, RR-008*

### DS-5.1 Arquitectura de Despliegue

```
+-----------------------------------------------------------------------+
|                                                                         |
|   USUARIO                                                               |
|   (Navegador / PWA instalada)                                           |
|        |                                                                |
|        | HTTPS (TLS 1.2+)                                               |
|        v                                                                |
|   +-------------------+                                                 |
|   | CLOUDFLARE PAGES  |  <-- CDN global, DDoS protection               |
|   | (Frontend PWA)    |      Dominio: canntrace.pages.dev               |
|   +-------------------+      (o dominio personalizado)                  |
|        |                                                                |
|        | HTTPS                                                          |
|        v                                                                |
|   +-------------------+                                                 |
|   | SUPABASE          |  Region: sa-east-1 (Sao Paulo)                  |
|   | (Backend)         |  Plan: Pro                                      |
|   |                   |                                                 |
|   | +---------------+ |  +---------------+                              |
|   | | PostgreSQL 15 | |  | Edge Functions|                              |
|   | | - 16 tablas   | |  | (Deno)       |                              |
|   | | - RLS         | |  | - API REST   |                              |
|   | | - Triggers    | |  | - Logica     |                              |
|   | | - pgcrypto    | |  +------+-------+                              |
|   | +-------+-------+ |         |                                       |
|   |         |          |         | HTTPS                                 |
|   | +-------+-------+  |         v                                       |
|   | | Auth (GoTrue) |  |  +---------------+                             |
|   | | - JWT         |  |  | GROQ API      |                             |
|   | | - bcrypt      |  |  | (LLM Service) |                             |
|   | | - MFA (TOTP)  |  |  | LLaMA 3.1-8B  |                             |
|   | +---------------+  |  +---------------+                             |
|   |                    |                                                 |
|   | +---------------+  |                                                 |
|   | | Storage (S3)  |  |                                                 |
|   | | - Documentos  |  |                                                 |
|   | | - Fotos       |  |                                                 |
|   | +---------------+  |                                                 |
|   |                    |                                                 |
|   | +---------------+  |                                                 |
|   | | Realtime      |  |                                                 |
|   | | - WebSockets  |  |                                                 |
|   | | - Stock sync  |  |                                                 |
|   | +---------------+  |                                                 |
|   +-------------------+                                                 |
+-----------------------------------------------------------------------+
```

### DS-5.2 Configuracion de Supabase

| Parametro | Valor | Justificacion |
|---|---|---|
| Region | sa-east-1 (Sao Paulo, Brasil) | Menor latencia para Argentina, cumplimiento de residencia de datos LATAM |
| Plan | Pro | PITR, backups diarios, 8GB RAM, analytics |
| PostgreSQL | 15+ | Triggers, RLS, pgcrypto, CTE recursivas |
| Extensiones | pgcrypto, citext | UUID, SHA-256, emails case-insensitive |
| PITR | Habilitado (7 dias) | Recuperacion granular ante incidentes |
| Backup diario | Habilitado (30 dias retencion) | RR-008: Retencion de datos 5+ anos |
| Connection pooling | PgBouncer (modo transaccion) | RNF-004: Soporte 50+ usuarios concurrentes |
| SSL Enforcement | Habilitado | RS-002: Solo conexiones cifradas |

### DS-5.3 Configuracion de Cloudflare Pages

| Parametro | Valor | Justificacion |
|---|---|---|
| Build command | `npm run build` | Produccion optimizada via Vite |
| Build output | `dist/` | Directorio estandar de Vite |
| Node version | 20 LTS | Version estable con soporte largo |
| Deploy branch | `main` | Deploy automatico en push a main |
| Preview branches | Habilitado | Testing de PRs antes de merge |
| Custom domain | Configurable | Para dominio propio del cliente |
| HTTPS | Forzado | RS-002 |
| Headers | CSP, HSTS, X-Frame-Options | RS-006 |

### DS-5.4 Configuracion de Seguridad

| Control | Configuracion | URS |
|---|---|---|
| Password hashing | bcrypt, costo >= 10 (Supabase Auth) | RS-001 |
| HTTPS | TLS 1.2+ forzado en Supabase y Cloudflare | RS-002 |
| JWT expiracion | Access token: 1 hora, Refresh token: 7 dias | RS-003 |
| Rate limiting | 100 req/min por usuario (Edge Function middleware) | RS-004 |
| SQL injection | Supabase client usa prepared statements | RS-005 |
| CORS | Solo origenes autorizados (dominio de produccion) | RS-006 |
| MFA | TOTP via Supabase Auth (opcional, recomendado para admin/auditor) | RF-001 |
| RLS | Habilitado en TODAS las tablas (11 tablas) | RF-003 |
| Cuenta bloqueada | Supabase Auth configurable: 5 intentos fallidos | RF-002 |
| Sesion inactiva | Verificacion client-side cada 60s, timeout 30 min | RF-004 |

### DS-5.5 Estrategia de Backup

| Componente | Metodo | Frecuencia | Retencion | Verificacion | URS |
|---|---|---|---|---|---|
| Base de datos | Supabase backup automatico | Diario | 30 dias (Pro) | Semestral (SOP-002) | RR-008 |
| PITR | Supabase Point-in-Time Recovery | Continuo | 7 dias | Semestral (SOP-002) | RR-008 |
| Audit trail | Export CSV/JSON automatico | Semanal | 5+ anos (almacenamiento externo) | Anual | RR-008 |
| Storage (docs) | Supabase Storage backup | Diario | 30 dias | Semestral | -- |
| Codigo fuente | Git (GitHub) | Cada commit | Indefinido | -- | -- |
| Configuracion | Documentado en DS-001 (este doc) | Cada cambio | Control de versiones | -- | -- |

### DS-5.6 Monitoreo y Alertas

| Componente | Herramienta | Metricas | Umbral de Alerta |
|---|---|---|---|
| Uptime | Supabase Dashboard + UptimeRobot | Disponibilidad | < 99.5% mensual (RNF-003) |
| Performance | Supabase Analytics | Tiempo de respuesta | > 3 segundos p95 (RNF-001) |
| Edge Functions | Supabase Logs | Errores, latencia | Tasa de error > 1% |
| Base de datos | Supabase Metrics | Conexiones, queries | Pool > 80% capacidad |
| Seguridad | Audit trail + Supabase Auth logs | Logins fallidos | > 10 intentos fallidos en 5 min |
| Groq API | Logs de Edge Function | Timeouts, errores | Tasa de fallo > 5% |

---

## 6. APROBACIONES

### 6.1 Declaracion de Conformidad

Este documento de Especificacion de Diseno (DS-001) ha sido elaborado en conformidad con:

- ISPE GAMP5 Segunda Edicion (2022)
- ANMAT Disposicion 4159/2023, Anexo 6
- 21 CFR Part 11 (como referencia)
- EU GMP Annex 11

Cada decision de diseno esta vinculada a los requerimientos de URS-001 y las especificaciones funcionales de FS-001, segun se indica en las columnas "URS Ref" a lo largo del documento.

### 6.2 Firmas de Aprobacion

| Rol | Nombre | Firma | Fecha |
|---|---|---|---|
| **IT/Dev Lead** (Autor) | _________________________ | _________________________ | ____/____/________ |
| **Validation Lead** (Revisor) | _________________________ | _________________________ | ____/____/________ |
| **QA Manager** (Aprobador) | _________________________ | _________________________ | ____/____/________ |
| **System Owner** (Aprobador) | _________________________ | _________________________ | ____/____/________ |
| **Process Owner** (Consultado) | _________________________ | _________________________ | ____/____/________ |

### 6.3 Declaracion de Aprobacion

*Al firmar este documento, los abajo firmantes confirman que:*

1. *Han revisado el contenido completo de esta Especificacion de Diseno (DS-001).*
2. *El diseno propuesto satisface los requerimientos definidos en URS-001.*
3. *El diseno es consistente con las especificaciones funcionales de FS-001.*
4. *Las decisiones de diseno estan adecuadamente justificadas y documentadas.*
5. *Autorizan el inicio del desarrollo conforme a este diseno.*

---

**FIN DEL DOCUMENTO DS-001**

*Este documento es propiedad confidencial. Su reproduccion total o parcial sin autorizacion esta prohibida.*

*Documento controlado -- Verificar estado de vigencia antes de usar.*
