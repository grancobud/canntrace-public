# FS-001: Especificacion Funcional del Sistema
## Sistema de Trazabilidad de Cannabis Medicinal - CannTrace

---

## CARATULA

| Campo | Valor |
|-------|-------|
| **Documento** | FS-001 |
| **Titulo** | Especificacion Funcional del Sistema CannTrace |
| **Version** | 0.1 (Draft) |
| **Fecha** | 2026-04-16 |
| **Autor** | Equipo CannTrace |
| **Clasificacion GAMP5** | Categoria 5 (Software Custom) |
| **URS de referencia** | URS-001 v0.1 |
| **Marco regulatorio** | ANMAT Disp. 4159/2023 Anexo 6, ARICCAME Ley 27.669, EU GMP Annex 11, 21 CFR Part 11 |
| **Estado** | Borrador - Pendiente de aprobacion |

### Historial de Revisiones

| Rev | Fecha | Autor | Descripcion | Aprobado por |
|-----|-------|-------|-------------|--------------|
| 0.1 | 2026-04-16 | Equipo CannTrace | Draft inicial basado en URS-001 v0.1 | Pendiente |

---

## 1. PROPOSITO Y ALCANCE

### 1.1 Proposito

Esta Especificacion Funcional (FS) define el comportamiento detallado del sistema CannTrace, describiendo como cada requerimiento de usuario documentado en URS-001 sera implementado a nivel funcional. El documento sirve como base para:

- El desarrollo del software (Especificacion de Diseno DS-001)
- La elaboracion de protocolos de calificacion OQ (Operational Qualification)
- La verificacion de trazabilidad entre requerimientos y funcionalidades implementadas
- La evaluacion regulatoria por parte de QA y auditores

### 1.2 Alcance Funcional

El sistema CannTrace cubre las siguientes areas funcionales:

| Modulo | Codigo FS | Descripcion |
|--------|-----------|-------------|
| Autenticacion y Control de Acceso | FS-2 | Login, MFA, roles, sesiones, bloqueo |
| Entrada de Datos via Chat | FS-3 | Texto libre -> IA -> JSON -> confirmacion -> INSERT |
| Escaneo QR | FS-4 | Individual, rango, lote, pre-carga de stock |
| Operaciones Seed-to-Sale | FS-5 | 16 operaciones del flujo productivo |
| Trazabilidad | FS-6 | Inversa (producto->madre) y directa (madre->productos) |
| Gestion de Stock | FS-7 | Incremento/decremento, validacion >= 0, vistas |
| Laboratorio y Cuarentena | FS-8 | Resultados cannabinoides, contaminantes, certificados |
| Reportes y Exportacion | FS-9 | PDF con hash, CSV regulatorio |
| Audit Trail y Firma Electronica | FS-10 | Inmutable, SHA-256, hash encadenado, ALCOA+ |

### 1.3 Exclusiones

- Punto de venta (POS) y facturacion
- Gestion contable, fiscal o impositiva
- Integracion con LIMS de laboratorios externos (fase futura)
- Entrada de datos por voz o audio
- Aplicacion nativa (solo PWA)

### 1.4 Documentos de Referencia

| Documento | Version | Relacion |
|-----------|---------|----------|
| URS-001 | 0.1 | Requerimientos de usuario que esta FS implementa |
| VP-001 | 0.1 | Plan de Validacion maestro |
| RA-001 | (pendiente) | Evaluacion de Riesgos |
| DS-001 | (pendiente) | Especificacion de Diseno (derivada de esta FS) |

---

## 2. ARQUITECTURA DEL SISTEMA

### 2.1 Diagrama de Arquitectura

```
+------------------------------------------------------------------+
|                      USUARIO (Navegador/PWA)                      |
+------------------------------------------------------------------+
|  React + Vite + TypeScript + Tailwind CSS                        |
|  +-------------------+  +----------------+  +------------------+ |
|  | Modulo Chat (FS-3)|  | Escaner QR     |  | Dashboard/Stock  | |
|  | Texto -> IA       |  | (FS-4)         |  | (FS-7/FS-9)     | |
|  +--------+----------+  +-------+--------+  +--------+---------+ |
|           |                      |                    |           |
|  +--------v----------------------v--------------------v---------+ |
|  |              Service Worker (Cache + Offline Queue)          | |
|  +------------------------------+-------------------------------+ |
+----------------------------------+--------------------------------+
                                   | HTTPS (TLS 1.2+)
                                   v
+------------------------------------------------------------------+
|                    SUPABASE EDGE FUNCTIONS                        |
|                    (Deno / TypeScript)                            |
|  +------------------+  +------------------+  +-----------------+ |
|  | /api/chat        |  | /api/operations  |  | /api/reports    | |
|  | Groq API call    |  | CRUD + audit     |  | PDF/CSV gen     | |
|  +--------+---------+  +--------+---------+  +--------+--------+ |
|           |                      |                    |           |
|  +--------v----------------------v--------------------v---------+ |
|  |              Supabase Auth (JWT + MFA)                       | |
|  +--------------------------------------------------------------+ |
+----------------------------------+--------------------------------+
                                   |
                                   v
+------------------------------------------------------------------+
|                    SUPABASE POSTGRESQL                            |
|                    Region: sa-east-1 (Sao Paulo)                 |
|  +------------------+  +------------------+  +-----------------+ |
|  | Tablas           |  | RLS Policies     |  | Triggers        | |
|  | transaccionales  |  | (por rol)        |  | audit_trail     | |
|  +------------------+  +------------------+  +-----------------+ |
|  +------------------+  +------------------+                      |
|  | Supabase Storage |  | CHECK constraints|                      |
|  | (fotos, PDFs)    |  | + FK integrity   |                      |
|  +------------------+  +------------------+                      |
+------------------------------------------------------------------+
                                   |
                                   v
+------------------------------------------------------------------+
|                    SERVICIOS EXTERNOS                             |
|  +------------------+  +------------------+                      |
|  | Groq API         |  | Cloudflare R2    |                      |
|  | Llama-3.1-8B     |  | (backup storage) |                      |
|  | Estructuracion   |  |                  |                      |
|  +------------------+  +------------------+                      |
+------------------------------------------------------------------+
```

### 2.2 Componentes del Sistema y Clasificacion GAMP5

| # | Componente | Tecnologia | Funcion | Cat. GAMP5 | Justificacion |
|---|-----------|------------|---------|------------|---------------|
| 1 | Frontend PWA | React 18 + Vite + TypeScript + Tailwind CSS | Interfaz de usuario, logica de presentacion | Cat. 5 | UI custom con flujos de negocio especificos |
| 2 | Service Worker | Workbox (Google) | Cache offline, cola de sincronizacion | Cat. 4 (configurado) | Libreria estandar configurada para CannTrace |
| 3 | Supabase Auth | Supabase GoTrue | Autenticacion, JWT, MFA, gestion de sesiones | Cat. 4 (configurado) | Producto comercial con configuracion custom de roles y politicas |
| 4 | Supabase Edge Functions | Deno Runtime | Logica de negocio server-side, validaciones | Cat. 5 | Funciones custom para flujo seed-to-sale |
| 5 | PostgreSQL | Supabase PostgreSQL 15 | Persistencia, integridad referencial, RLS | Cat. 4 (configurado) | Motor de BD estandar con esquema custom |
| 6 | Esquema de BD | SQL DDL custom | Tablas, constraints, triggers, funciones PL/pgSQL | Cat. 5 | Modelo de datos y reglas de negocio custom |
| 7 | Groq API | LLM Llama-3.1-8B via API REST | Estructuracion de texto libre a JSON | Cat. 5 | Integracion custom con validacion post-IA |
| 8 | Supabase Storage | S3-compatible | Almacenamiento de fotos, PDFs, certificados | Cat. 4 (configurado) | Servicio estandar con politicas de acceso custom |
| 9 | Cloudflare R2 | S3-compatible | Backup de archivos, redundancia | Cat. 3 (COTS) | Infraestructura comercial sin customizacion |
| 10 | Libreria QR | html5-qrcode | Decodificacion de codigos QR via camara | Cat. 4 (configurado) | Libreria open-source con parametros custom |

### 2.3 Entornos

| Entorno | Proposito | Region | URL |
|---------|-----------|--------|-----|
| Desarrollo (DEV) | Desarrollo activo, pruebas unitarias | sa-east-1 | canntrace-dev.supabase.co |
| Validacion (VAL) | IQ/OQ/PQ, pruebas formales de calificacion | sa-east-1 | canntrace-val.supabase.co |
| Produccion (PROD) | Uso operativo real | sa-east-1 | canntrace.supabase.co |

---

## 3. DESCRIPCION FUNCIONAL DETALLADA

---

### FS-2: Autenticacion y Control de Acceso

**Implementa:** RF-001, RF-002, RF-003, RF-004, RF-005, RS-001, RS-002, RS-003, RR-001

#### FS-2.1 Proceso de Login

1. El usuario accede a la URL del sistema y visualiza la pantalla de login.
2. Ingresa email y password.
3. El frontend envia las credenciales a `supabase.auth.signInWithPassword()`.
4. Supabase Auth valida las credenciales contra bcrypt (costo >= 10).
5. Si MFA esta habilitado para el usuario, se solicita el codigo TOTP.
6. Si las credenciales son validas, se emite un JWT con los claims:
   - `sub`: UUID del usuario
   - `role`: rol asignado (operador|supervisor|auditor|admin)
   - `org_id`: identificador de la organizacion
   - `exp`: timestamp de expiracion (1 hora)
7. Se genera un refresh token (7 dias de vigencia).
8. Se registra el evento de login en `audit_log`:
   - `action`: 'LOGIN'
   - `user_id`: UUID
   - `ip_address`: IP del cliente
   - `user_agent`: navegador/dispositivo
   - `timestamp_utc`: NOW()

#### FS-2.2 Bloqueo de Cuenta

1. Cada intento fallido incrementa `auth.users.failed_login_count`.
2. Al alcanzar 5 intentos fallidos consecutivos:
   - Se establece `auth.users.locked_until` = NOW() + 30 minutos.
   - Se registra evento `ACCOUNT_LOCKED` en `audit_log`.
   - Se envia notificacion al administrador via tabla `notifications`.
3. El desbloqueo puede ser:
   - Automatico tras 30 minutos.
   - Manual por un administrador desde el panel de usuarios.

#### FS-2.3 Gestion de Roles y Permisos

| Recurso / Accion | Operador | Supervisor | Auditor | Admin |
|-------------------|----------|------------|---------|-------|
| Crear operaciones | SI | SI | NO | NO |
| Confirmar datos extraidos por IA | SI | SI | NO | NO |
| Aprobar operaciones criticas | NO | SI | NO | NO |
| Ver stock propio (por ubicacion) | SI | SI | SI | SI |
| Ver stock global | NO | SI | SI | SI |
| Escanear QR | SI | SI | NO | NO |
| Ver audit trail | NO | NO | SI | SI |
| Exportar PDF/CSV | NO | SI | SI | SI |
| Gestionar usuarios | NO | NO | NO | SI |
| Configurar sistema | NO | NO | NO | SI |

Los permisos se implementan en dos niveles:
- **Frontend:** rutas protegidas con React Router guards basados en el claim `role` del JWT.
- **Backend:** Row Level Security (RLS) en PostgreSQL, con politicas que evaluan `auth.jwt() ->> 'role'`.

#### FS-2.4 Expiracion de Sesion

1. El JWT expira tras 1 hora (RS-003).
2. Un timer en el frontend detecta 30 minutos de inactividad (RF-004).
3. Al detectar inactividad:
   - Se muestra un dialogo de advertencia con cuenta regresiva de 60 segundos.
   - Si el usuario no interactua, se ejecuta `supabase.auth.signOut()`.
   - Se registra evento `SESSION_EXPIRED` en `audit_log`.
   - Se redirige a la pantalla de login.

---

### FS-3: Entrada de Datos via Chat Textual

**Implementa:** RF-006, RF-007, RF-008, RF-009, RF-010, RF-011, RR-001, RR-003, RR-004

#### FS-3.1 Flujo de Entrada por Chat

```
+------------------+     +------------------+     +------------------+
| 1. Operador      |     | 2. Edge Function |     | 3. Groq API      |
| escribe texto    +---->| /api/chat        +---->| Llama-3.1-8B     |
| libre en chat    |     | Valida JWT       |     | Prompt template  |
+------------------+     +------------------+     +--------+---------+
                                                           |
                                                           v
+------------------+     +------------------+     +------------------+
| 6. INSERT en DB  |     | 5. Operador      |     | 4. Frontend      |
| + audit_log      |<----+ confirma o edita  |<----+ muestra JSON     |
| + firma SHA-256  |     | datos extraidos  |     | en pantalla de   |
+------------------+     +------------------+     | confirmacion     |
                                                  +------------------+
```

#### FS-3.2 Detalle del Procesamiento

1. **Captura de texto:** El operador escribe en la interfaz de chat. El texto se almacena en memoria como `input_raw`. Limite: 2000 caracteres (RF-006).

2. **Envio al servidor:** POST a `/api/chat` con payload:
   ```json
   {
     "text": "Hoy transplante 20 esquejes del lote ESQ-2026-003 a la sala vegetativa",
     "context": {
       "location": "sala_vegetativa",
       "recent_operations": ["esquejado"]
     }
   }
   ```

3. **Procesamiento IA (Groq):** La Edge Function invoca Groq API con un prompt de sistema que incluye:
   - Lista de las 16 operaciones validas y sus campos requeridos.
   - Formato JSON esperado para la respuesta.
   - Instrucciones de extraer solo datos explicitos en el texto.
   - Regla: si la confianza es < 70%, retornar `"confidence": "low"`.

4. **Respuesta estructurada:** La IA retorna un JSON como:
   ```json
   {
     "operation": "vegetativa",
     "confidence": 0.92,
     "data": {
       "source_lot": "ESQ-2026-003",
       "quantity": 20,
       "destination": "sala_vegetativa",
       "date": "2026-04-16"
     },
     "missing_fields": []
   }
   ```

5. **Pantalla de confirmacion (RF-008, RF-009):** El frontend presenta los datos en un formulario pre-llenado con:
   - Cada campo extraido editable.
   - Campos faltantes resaltados en rojo.
   - Boton [Confirmar] (verde) y [Cancelar] (gris).
   - **Los datos NO se persisten hasta que el operador presione [Confirmar].**

6. **Fallback a formulario manual (RF-010):** Si `confidence < 0.70` o la IA retorna error:
   - Se muestra un formulario vacio con los campos de la operacion detectada (o selector de operacion si no se detecto ninguna).
   - Se informa al operador: "No se pudo interpretar automaticamente. Complete el formulario manualmente."

7. **Persistencia (RF-011):** Al confirmar, se ejecuta en una transaccion:
   - INSERT en la tabla de operacion correspondiente.
   - INSERT en `audit_log` con `input_raw` = texto original, `structured_data` = JSON confirmado.
   - Calculo de firma electronica SHA-256.

---

### FS-4: Escaneo QR

**Implementa:** RF-012, RF-013, RF-014, RF-015, RF-037

#### FS-4.1 Modos de Escaneo

| Modo | Flujo | Ejemplo |
|------|-------|---------|
| **Individual** | Escanea 1 QR -> obtiene 1 individuo/lote | Escanea QR de planta PM-001 |
| **Rango** | Escanea 2 QR (inicio + fin) -> calcula intermedios | Escanea PM-001 y PM-010 -> genera PM-001..PM-010 |
| **Lote** | Escanea 1 QR de lote -> trae todos los individuos del lote | Escanea LOT-2026-005 -> trae 50 individuos asociados |

#### FS-4.2 Flujo de Escaneo Individual

1. El operador selecciona modo "Individual" en la interfaz.
2. Se activa la camara via `navigator.mediaDevices.getUserMedia()`.
3. La libreria `html5-qrcode` decodifica el contenido del QR.
4. Formato esperado del QR: `CT:{tipo}:{id}` (ejemplo: `CT:PLANT:PM-001`).
5. El sistema consulta la tabla correspondiente y pre-carga los datos:
   - Producto, lote, cantidad disponible, ubicacion actual (RF-037).
6. Los datos pre-cargados se inyectan en el formulario o contexto del chat.
7. Tiempo maximo de decodificacion: 3 segundos (RF-012).

#### FS-4.3 Flujo de Escaneo por Rango

1. El operador selecciona modo "Rango".
2. Escanea el primer QR (inicio del rango).
3. Escanea el segundo QR (fin del rango).
4. El sistema extrae los identificadores numericos y calcula los intermedios (RF-014):
   - Ejemplo: `PM-001` a `PM-010` genera la lista [PM-001, PM-002, ..., PM-010].
5. Se valida que todos los individuos del rango existan en la base de datos.
6. Si alguno no existe, se informa al operador con la lista de faltantes.

#### FS-4.4 Flujo de Escaneo por Lote

1. El operador selecciona modo "Lote".
2. Escanea 1 QR con el identificador de lote.
3. El sistema consulta `SELECT * FROM stock WHERE lot_id = :lot_id AND status = 'active'`.
4. Retorna todos los individuos asociados al lote (RF-015).
5. Se muestra la lista al operador para confirmar antes de operar.

---

### FS-5: Operaciones Seed-to-Sale

**Implementa:** RF-016 a RF-031, RR-001, RR-003, RR-004, RR-005, RR-006, RR-010, RR-011, RR-013

#### FS-5.1 Flujo General de Operacion

Todas las 16 operaciones siguen este flujo base:

```
[Entrada]        [Validacion]       [Persistencia]       [Post-accion]
Texto/QR/Form -> Campos completos -> Transaccion DB   -> Audit + Firma
                 Stock suficiente    INSERT operacion     Stock update
                 Permisos OK         INSERT audit_log     Notificaciones
```

#### FS-5.2 Operacion 01 - Ingreso de Insumos (RF-016)

| Campo | Descripcion | Obligatorio | Validacion |
|-------|-------------|-------------|------------|
| product_name | Nombre del insumo (fertilizante, maceta, sustrato) | SI | TEXT NOT NULL, max 200 chars |
| lot_id | Codigo de lote del proveedor | SI | UNIQUE por producto |
| quantity | Cantidad ingresada | SI | NUMERIC > 0 |
| unit | Unidad (kg, L, unidades) | SI | ENUM ('kg','L','unit','ml','g') |
| warehouse_id | Almacen de destino | SI | FK a warehouses |
| expiration_date | Fecha de vencimiento | NO | DATE >= TODAY |
| supplier | Proveedor | NO | TEXT max 200 chars |
| notes | Observaciones | NO | TEXT max 1000 chars |

**Efecto sobre stock:** `stock.quantity += quantity` (incremento).

#### FS-5.3 Operacion 02 - Alta de Planta Madre (RF-017)

| Campo | Descripcion | Obligatorio | Validacion |
|-------|-------------|-------------|------------|
| individual_id | Identificador unico de la planta (QR) | SI | UNIQUE, formato CT:PLANT:{id} |
| strain | Variedad/genetica | SI | FK a strains |
| mother_room_id | Sala de madres | SI | FK a rooms WHERE type='mother' |
| origin | Origen de la planta | SI | ENUM ('seed','clone','donation') |
| env_temp | Temperatura ambiental (C) | NO | NUMERIC 15-40 |
| env_humidity | Humedad relativa (%) | NO | NUMERIC 20-90 |
| photo_url | Foto de la planta | NO | URL a Supabase Storage |

**Efecto sobre stock:** `INSERT INTO stock (individual_id, type='plant_mother', status='active')`.
**Operacion critica:** Requiere aprobacion de supervisor si `origin = 'donation'`.

#### FS-5.4 Operacion 03 - Fertilizacion / Labor Cultural (RF-018)

| Campo | Descripcion | Obligatorio | Validacion |
|-------|-------------|-------------|------------|
| target_lot_id | Lote de plantas destino | SI | FK a lots WHERE status='active' |
| input_product_id | Insumo utilizado | SI | FK a stock WHERE type='input' |
| quantity_used | Cantidad consumida del insumo | SI | NUMERIC > 0, <= stock disponible |
| application_method | Metodo de aplicacion | NO | TEXT max 200 |
| responsible_user | Operador que aplica | SI | AUTO: auth.uid() |

**Efecto sobre stock:** `stock.quantity -= quantity_used` para el insumo.
**Validacion critica:** Si `stock.quantity - quantity_used < 0`, rechazar con error (RF-036).

#### FS-5.5 Operacion 04 - Utilizacion de Insumos (RF-019)

Similar a Fertilizacion pero para insumos no consumibles (macetas, tutores, etc.).

| Campo | Descripcion | Obligatorio | Validacion |
|-------|-------------|-------------|------------|
| target_lot_id | Lote de plantas destino | SI | FK a lots |
| input_product_id | Insumo asignado | SI | FK a stock |
| quantity_assigned | Cantidad asignada | SI | NUMERIC > 0 |

**Efecto sobre stock:** Decremento del insumo, trazabilidad insumo->lote preservada.

#### FS-5.6 Operacion 05 - Baja de Stock (RF-020)

| Campo | Descripcion | Obligatorio | Validacion |
|-------|-------------|-------------|------------|
| individual_id o lot_id | Individuo o lote a dar de baja | SI | FK existente con status='active' |
| reason | Motivo de baja | SI | ENUM ('death','contamination','discard','theft','other') |
| reason_detail | Descripcion adicional | SI si reason='other' | TEXT max 500 |
| quantity | Cantidad (si es lote parcial) | Condicional | NUMERIC > 0 |
| supervisor_approval | Aprobacion del supervisor | SI | Firma electronica |

**Efecto sobre stock:** `status = 'inactive'` o decremento de cantidad.
**Operacion critica:** SIEMPRE requiere motivo (RR-013) y firma de supervisor.

#### FS-5.7 Operacion 06 - Esquejado (RF-021)

| Campo | Descripcion | Obligatorio | Validacion |
|-------|-------------|-------------|------------|
| mother_plant_id | Planta madre origen | SI | FK a stock WHERE type='plant_mother' AND status='active' |
| clone_count | Cantidad de esquejes | SI | INTEGER > 0 |
| clone_room_id | Sala de clonacion | SI | FK a rooms WHERE type='clone' |
| clone_lot_id | Lote asignado a los esquejes | SI | UNIQUE, generado o ingresado |
| substrate | Sustrato utilizado | NO | TEXT |
| rooting_hormone | Hormona de enraizamiento | NO | FK a stock WHERE type='input' |

**Efecto sobre stock:**
- INSERT de N esquejes individuales vinculados a `mother_plant_id`.
- Cada esqueje hereda la trazabilidad a la planta madre (RF-021).
- Si se uso hormona: decremento de stock del insumo.

#### FS-5.8 Operacion 07 - Vegetativa (RF-022)

| Campo | Descripcion | Obligatorio | Validacion |
|-------|-------------|-------------|------------|
| source_lot_id | Lote de esquejes enraizados | SI | FK a lots WHERE stage='clone' |
| quantity | Cantidad a transicionar | SI | INTEGER > 0, <= disponibles |
| veg_room_id | Sala vegetativa destino | SI | FK a rooms WHERE type='vegetative' |
| new_lot_id | Nuevo lote en vegetativa | SI | UNIQUE |

**Efecto sobre stock:**
- Decremento de esquejes en sala de clonacion.
- Generacion de plantas en sala vegetativa con nuevo estado.
- Trazabilidad: planta_veg -> esqueje -> planta_madre preservada.

#### FS-5.9 Operacion 08 - Poda / Labor Cultural (RF-023)

| Campo | Descripcion | Obligatorio | Validacion |
|-------|-------------|-------------|------------|
| target_individual_id | Planta podada | SI | FK a stock WHERE status='active' |
| prune_type | Tipo de poda | SI | ENUM ('apical','lateral','defoliation','lollipopping') |
| date | Fecha de realizacion | SI | DATE, DEFAULT TODAY |
| responsible_user | Operador | SI | AUTO: auth.uid() |
| notes | Observaciones | NO | TEXT max 500 |

**Efecto sobre stock:** Sin cambio de cantidad. Registro en historial del individuo.

#### FS-5.10 Operacion 09 - Floracion (RF-024)

| Campo | Descripcion | Obligatorio | Validacion |
|-------|-------------|-------------|------------|
| source_lot_id | Lote en vegetativa | SI | FK a lots WHERE stage='vegetative' |
| flower_room_id | Sala de floracion destino | SI | FK a rooms WHERE type='flower' |
| quantity | Cantidad a mover | SI | INTEGER > 0 |
| photoperiod | Fotoperiodo aplicado (hs luz) | NO | INTEGER 10-14 |

**Efecto sobre stock:** Cambio de ubicacion y etapa. Audit trail con origen/destino.

#### FS-5.11 Operacion 10 - Control de Plagas / Labor Cultural (RF-025)

| Campo | Descripcion | Obligatorio | Validacion |
|-------|-------------|-------------|------------|
| target_lot_id | Lote en floracion | SI | FK a lots WHERE stage='flower' |
| pest_type | Tipo de plaga/enfermedad | SI | TEXT, seleccion de catalogo configurable |
| treatment_product | Producto aplicado | SI | FK a stock WHERE type='input' |
| quantity_used | Cantidad aplicada | SI | NUMERIC > 0 |
| application_date | Fecha de aplicacion | SI | DATE |
| waiting_period_days | Periodo de carencia (dias) | NO | INTEGER >= 0 |

**Efecto sobre stock:** Decremento del producto fitosanitario.

#### FS-5.12 Operacion 11 - Cosecha (RF-026)

| Campo | Descripcion | Obligatorio | Validacion |
|-------|-------------|-------------|------------|
| source_lot_id | Lote en floracion | SI | FK a lots WHERE stage='flower' |
| harvest_room_id | Sala de cosecha | SI | FK a rooms WHERE type='harvest' |
| fresh_weight_kg | Peso fresco total (kg) | SI | NUMERIC > 0 |
| plant_count | Cantidad de plantas cosechadas | SI | INTEGER > 0 |
| harvest_date | Fecha de cosecha | SI | DATE |

**Operacion critica:** Requiere firma electronica del operador y supervisor.
**Efecto sobre stock:** Plantas movidas a cosecha con peso fresco registrado.

#### FS-5.13 Operacion 12 - Secado (RF-027)

| Campo | Descripcion | Obligatorio | Validacion |
|-------|-------------|-------------|------------|
| source_lot_id | Lote cosechado | SI | FK a lots WHERE stage='harvest' |
| dry_room_id | Sala de secado | SI | FK a rooms WHERE type='drying' |
| input_plant_count | Cantidad de plantas ingresadas | SI | INTEGER > 0 |
| output_flower_count | Cantidad de flores generadas | SI | INTEGER > 0, <= input_plant_count |
| dry_weight_kg | Peso seco total (kg) | SI | NUMERIC > 0, < fresh_weight_kg |
| loss_reason | Motivo de diferencia (si output < input) | Condicional | TEXT, requerido si output < input |

**Efecto sobre stock:**
- Decremento de N plantas.
- Generacion de M flores con tracking individual (M <= N).
- Si M < N: diferencia documentada como baja con motivo (RR-013).

#### FS-5.14 Operacion 13 - Trimming (RF-028)

| Campo | Descripcion | Obligatorio | Validacion |
|-------|-------------|-------------|------------|
| source_individuals | Lista de flores individuales | SI | ARRAY de FK a stock |
| output_lot_id | Lote granel generado | SI | UNIQUE |
| net_weight_kg | Peso neto resultante (kg) | SI | NUMERIC > 0 |
| trim_waste_kg | Peso de descarte (trim) | SI | NUMERIC >= 0 |
| yield_percent | Rendimiento (%) | AUTO | (net_weight / sum(individual_weights)) * 100 |

**Operacion critica:** Punto de transicion de individuo a granel.
**Efecto sobre stock:**
- Flores individuales decrementadas (status='processed').
- Lote granel generado con peso neto.
- Se pierde la individualidad; la trazabilidad se mantiene via `source_individuals`.

#### FS-5.15 Operacion 14 - Cuarentena (RF-029)

| Campo | Descripcion | Obligatorio | Validacion |
|-------|-------------|-------------|------------|
| source_lot_id | Lote a poner en cuarentena | SI | FK a lots |
| quarantine_room_id | Deposito de cuarentena | SI | FK a rooms WHERE type='quarantine' |
| reason | Motivo de cuarentena | SI | ENUM ('lab_pending','contamination_suspect','regulatory_hold') |
| lab_sample_id | ID de muestra de laboratorio | NO | FK a lab_samples |

**Efecto sobre stock:** Producto movido, status cambia a 'quarantine'.

#### FS-5.16 Operacion 15 - Fraccionamiento (RF-030)

| Campo | Descripcion | Obligatorio | Validacion |
|-------|-------------|-------------|------------|
| source_lot_id | Lote granel origen | SI | FK a lots WHERE stage='trimmed' AND status='released' |
| fraction_count | Cantidad de fracciones | SI | INTEGER > 0 |
| unit_weight_kg | Peso por unidad (kg) | SI | NUMERIC > 0 |
| total_weight_kg | Peso total fraccionado | AUTO | fraction_count * unit_weight_kg |
| new_lot_prefix | Prefijo para lotes nuevos | SI | TEXT, para generar LOT-xxx-001..N |

**Validacion:** `total_weight_kg <= source_lot.available_weight`.
**Efecto sobre stock:** Lote origen decrementado; N nuevos lotes fraccionados generados.

#### FS-5.17 Operacion 16 - Almacenamiento (RF-031)

| Campo | Descripcion | Obligatorio | Validacion |
|-------|-------------|-------------|------------|
| source_lot_id | Lote fraccionado | SI | FK a lots WHERE stage='fractioned' |
| storage_room_id | Deposito de almacenamiento final | SI | FK a rooms WHERE type='storage' |
| storage_conditions | Condiciones (temp, humedad) | NO | JSON {temp_c, humidity_pct} |

**Efecto sobre stock:** Producto disponible en deposito como paso final del flujo seed-to-sale.

---

### FS-6: Trazabilidad

**Implementa:** RF-032, RF-033, RF-034

#### FS-6.1 Trazabilidad Inversa (RF-032)

Dado un producto final (lote almacenado), el sistema reconstruye la cadena completa:

```
Almacenamiento (FS-5.17)
    |
    v
Fraccionamiento (FS-5.16) -- lote granel origen
    |
    v
Cuarentena (FS-5.15) -- si aplica
    |
    v
Trimming (FS-5.14) -- flores individuales origen
    |
    v
Secado (FS-5.13) -- lote cosechado origen
    |
    v
Cosecha (FS-5.12) -- lote en floracion origen
    |
    v
Floracion (FS-5.10) -- lote vegetativo origen
    |
    v
Vegetativa (FS-5.8) -- lote de esquejes origen
    |
    v
Esquejado (FS-5.7) -- planta madre origen
    |
    v
PLANTA MADRE (FS-5.3) -- origen raiz de toda la cadena
```

**Implementacion:** Consulta recursiva (`WITH RECURSIVE`) sobre la tabla `operations` siguiendo las FK `source_lot_id` y `source_individual_id` hacia atras.

#### FS-6.2 Trazabilidad Directa (RF-033)

Dada una planta madre, el sistema lista todos los productos derivados:

1. Consulta `operations WHERE source = mother_plant_id`.
2. Para cada esquejado encontrado, sigue la cadena hacia adelante.
3. Retorna arbol de derivados con cantidades en cada etapa.

#### FS-6.3 Visualizacion

La interfaz de trazabilidad presenta:
- **Vista arbol:** nodos expandibles desde planta madre hasta producto final.
- **Vista tabla:** lista cronologica de todas las operaciones del lote/individuo.
- **Filtros:** por rango de fechas, tipo de operacion, responsable, ubicacion.

---

### FS-7: Gestion de Stock

**Implementa:** RF-035, RF-036, RF-037

#### FS-7.1 Regla de Stock No Negativo (RF-036)

Implementado como CHECK constraint a nivel de base de datos:

```sql
ALTER TABLE stock ADD CONSTRAINT stock_quantity_non_negative
  CHECK (quantity >= 0);
```

Adicionalmente, cada Edge Function que ejecuta un decremento realiza una validacion previa:

```sql
SELECT quantity FROM stock WHERE id = :id FOR UPDATE;
-- Si quantity - requested_amount < 0 -> ROLLBACK + error 422
```

#### FS-7.2 Vistas de Stock

| Vista | Acceso | Datos |
|-------|--------|-------|
| Stock por ubicacion | Operador+ | Productos en la sala/almacen del operador |
| Stock global | Supervisor+ | Todos los productos de todas las ubicaciones |
| Stock historico | Auditor+ | Movimientos de stock en rango de fechas |
| Alertas de stock | Supervisor+ | Productos bajo minimo, vencimientos proximos |

#### FS-7.3 Pre-carga de Datos (RF-037)

Al escanear un QR o seleccionar un producto en el chat:
1. Se consulta `stock` con el ID escaneado.
2. Se retorna: nombre del producto, lote, cantidad disponible, ubicacion, fecha de vencimiento.
3. Los datos se inyectan automaticamente en el formulario o contexto del chat.

---

### FS-8: Laboratorio y Cuarentena

**Implementa:** RF-029 (complemento)

#### FS-8.1 Registro de Muestras de Laboratorio

| Campo | Descripcion | Obligatorio |
|-------|-------------|-------------|
| sample_id | Identificador unico de muestra | SI (autogenerado) |
| lot_id | Lote del cual se extrajo la muestra | SI |
| sample_date | Fecha de toma de muestra | SI |
| sample_weight_g | Peso de la muestra (gramos) | SI |
| lab_name | Laboratorio destino | SI |
| status | Estado del analisis | SI (ENUM: pending, in_progress, completed, failed) |

#### FS-8.2 Resultados de Cannabinoides

| Campo | Descripcion | Unidad |
|-------|-------------|--------|
| thc_total | THC total | % p/p |
| cbd_total | CBD total | % p/p |
| cbg | CBG | % p/p |
| cbn | CBN | % p/p |
| thc_cbd_ratio | Relacion THC:CBD | ratio |
| moisture_content | Contenido de humedad | % |

#### FS-8.3 Resultados de Contaminantes

| Campo | Descripcion | Limite |
|-------|-------------|--------|
| heavy_metals | Metales pesados (Pb, Cd, Hg, As) | Segun ANMAT |
| pesticides | Residuos de pesticidas | Segun ANMAT |
| microbiological | Recuento microbiologico (UFC/g) | Segun Farmacopea Argentina |
| mycotoxins | Aflatoxinas, ocratoxina | Segun ANMAT |

#### FS-8.4 Flujo de Liberacion

1. Muestra tomada del lote -> lote pasa a cuarentena (FS-5.15).
2. Resultados de laboratorio ingresados (manual o importacion futura).
3. Si TODOS los parametros estan dentro de limites:
   - Status de muestra -> `completed`.
   - Supervisor revisa y firma la liberacion.
   - Lote pasa de `quarantine` a `released`.
4. Si algun parametro esta fuera de limites:
   - Status de muestra -> `failed`.
   - Lote permanece en cuarentena.
   - Se genera alerta para supervisor y QA.
   - Se requiere decision: reprocesar, destruir, o re-analizar.

#### FS-8.5 Certificado de Analisis

El sistema genera un certificado PDF con:
- Datos del lote (ID, variedad, fecha de cosecha, peso).
- Resultados de cannabinoides y contaminantes.
- Status (aprobado/rechazado).
- Firma electronica del responsable de QA.
- Hash SHA-256 del documento.

---

### FS-9: Reportes y Exportacion

**Implementa:** RF-038, RF-039, RF-040

#### FS-9.1 Reporte PDF de Trazabilidad (RF-038)

**Contenido del PDF:**
1. Caratula con datos del lote y fecha de generacion.
2. Cadena de trazabilidad completa (inversa).
3. Tabla de todas las operaciones asociadas.
4. Datos de laboratorio (si aplica).
5. Pie de pagina con hash SHA-256 del contenido.

**Generacion del hash:**
1. Se serializa el contenido del reporte a JSON canonico.
2. Se calcula `SHA-256(JSON_canonico)`.
3. Se incluye el hash en el pie de cada pagina.
4. El hash se almacena en `reports.integrity_hash` para verificacion posterior offline.

#### FS-9.2 Exportacion CSV Regulatoria (RF-039)

| Formato | Destinatario | Campos |
|---------|-------------|--------|
| CSV-ANMAT | ANMAT | codigo_lote, variedad, fecha_cosecha, peso_neto, thc_total, cbd_total, estado, responsable |
| CSV-ARICCAME | ARICCAME | id_planta, origen, etapa_actual, ubicacion, fecha_ultima_operacion, responsable |
| CSV-REPROCANN | REPROCANN | paciente_id (anonimizado), producto, concentracion, lote, fecha_entrega |

Cada CSV incluye:
- Encabezado con nombre del reporte, fecha de generacion, hash de integridad.
- Codificacion UTF-8 con BOM.
- Separador punto y coma (;) para compatibilidad con Excel en espanol.

#### FS-9.3 Dashboard (RF-040)

Widgets del dashboard:
- Operaciones del dia (cantidad por tipo).
- Stock actual por ubicacion (grafico de barras).
- Alertas activas (vencimientos, stock bajo, cuarentena pendiente).
- Ultimo audit trail (ultimas 20 entradas).
- Estado de muestras de laboratorio.

Tiempo de carga objetivo: < 5 segundos.

---

### FS-10: Audit Trail y Firma Electronica

**Implementa:** RF-005, RF-011, RR-001, RR-003, RR-004, RR-005, RR-006, RR-010, RR-011, RR-012, RR-013

#### FS-10.1 Estructura de la Tabla audit_log

| Campo | Tipo | Descripcion | Restriccion |
|-------|------|-------------|-------------|
| id | UUID | Identificador unico del registro | PK, DEFAULT gen_random_uuid() |
| timestamp_utc | TIMESTAMPTZ | Momento del evento | NOT NULL, DEFAULT NOW(), inmutable |
| user_id | UUID | Usuario que ejecuto la accion | NOT NULL, FK a auth.users |
| action | TEXT | Tipo de accion | NOT NULL, ENUM definido |
| table_name | TEXT | Tabla afectada | NOT NULL |
| record_id | UUID | ID del registro afectado | NOT NULL |
| old_data | JSONB | Datos antes del cambio (para UPDATE) | NULL para INSERT |
| new_data | JSONB | Datos despues del cambio | NOT NULL |
| input_raw | TEXT | Texto original del operador | NULL si no aplica |
| reason | TEXT | Motivo del cambio | NOT NULL para UPDATE/DELETE |
| ip_address | INET | Direccion IP del cliente | NOT NULL |
| user_agent | TEXT | Navegador/dispositivo | NOT NULL |
| record_signature | TEXT | Hash SHA-256 del registro | NOT NULL |
| previous_hash | TEXT | Hash del registro anterior en la cadena | NOT NULL (excepto primer registro) |

#### FS-10.2 Inmutabilidad (RR-010)

La tabla `audit_log` es estrictamente de solo INSERT. Implementado mediante:

```sql
-- Trigger que impide UPDATE
CREATE OR REPLACE FUNCTION prevent_audit_update()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'UPDATE no permitido en audit_log. Los registros de auditoria son inmutables.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_no_update
  BEFORE UPDATE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_update();

-- Trigger que impide DELETE
CREATE OR REPLACE FUNCTION prevent_audit_delete()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'DELETE no permitido en audit_log. Los registros de auditoria son inmutables.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_no_delete
  BEFORE DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_delete();
```

Adicionalmente, RLS policies impiden que cualquier rol (incluyendo admin) ejecute UPDATE/DELETE.

#### FS-10.3 Firma Electronica SHA-256 (RR-011)

Para cada registro critico, se calcula:

```
record_signature = SHA-256(
  timestamp_utc || '|' ||
  user_id || '|' ||
  action || '|' ||
  table_name || '|' ||
  record_id || '|' ||
  new_data::TEXT
)
```

La firma se almacena como string hexadecimal de 64 caracteres.

#### FS-10.4 Hash Encadenado (RR-012)

Cada registro incluye el hash del registro anterior:

```
previous_hash = (SELECT record_signature FROM audit_log ORDER BY timestamp_utc DESC LIMIT 1)
```

Esto crea una cadena de hashes similar a un blockchain. Cualquier manipulacion de un registro rompe la cadena y es detectable mediante verificacion:

```sql
-- Verificacion de integridad de la cadena
SELECT id, timestamp_utc,
  CASE WHEN record_signature = expected_hash THEN 'OK' ELSE 'CORRUPTED' END AS integrity
FROM audit_chain_verification_view;
```

#### FS-10.5 Acciones Registradas

| Accion | Tabla(s) afectada(s) | Descripcion |
|--------|---------------------|-------------|
| LOGIN | auth_events | Inicio de sesion exitoso |
| LOGOUT | auth_events | Cierre de sesion |
| LOGIN_FAILED | auth_events | Intento de login fallido |
| ACCOUNT_LOCKED | auth_events | Cuenta bloqueada |
| SESSION_EXPIRED | auth_events | Sesion expirada por inactividad |
| INSERT | operaciones, stock | Creacion de registro |
| UPDATE | stock, lots | Modificacion de registro (con motivo) |
| DELETE | stock | Eliminacion logica (con motivo) |
| APPROVE | operaciones | Aprobacion de operacion critica |
| RELEASE | lab_samples | Liberacion de lote tras analisis |
| EXPORT | reports | Generacion de reporte PDF/CSV |

---

## 4. INTERFACES DE USUARIO

### 4.1 Pantalla de Login

```
+--------------------------------------------------+
|                                                  |
|              [Logo CannTrace]                    |
|                                                  |
|     Sistema de Trazabilidad Cannabis Medicinal   |
|                                                  |
|     +--------------------------------------+     |
|     | Email                                |     |
|     +--------------------------------------+     |
|                                                  |
|     +--------------------------------------+     |
|     | Password                        [O]  |     |
|     +--------------------------------------+     |
|                                                  |
|     [ ] Recordar dispositivo                     |
|                                                  |
|     [        INICIAR SESION        ]             |
|                                                  |
|     Olvidaste tu contrasena?                     |
|                                                  |
+--------------------------------------------------+
|  v0.1.0 | Powered by Supabase | sa-east-1       |
+--------------------------------------------------+
```

### 4.2 Dashboard Principal

```
+--------------------------------------------------+
| [=] CannTrace          [Notif: 3]  [User] [Sal] |
+--------------------------------------------------+
| > Inicio  | Stock | Trazabilidad | Reportes      |
+--------------------------------------------------+
|                                                  |
| OPERACIONES HOY          STOCK ACTUAL            |
| +---------------------+  +---------------------+ |
| | Esquejados:     12  |  | Madres:        45   | |
| | Vegetativa:      8  |  | Esquejes:     120   | |
| | Cosecha:         3  |  | Plantas Veg:   80   | |
| | Secado:          2  |  | Flores:        60   | |
| +---------------------+  | Prod. Final:   25   | |
|                          +---------------------+ |
| ALERTAS                                          |
| +----------------------------------------------+ |
| | [!] 2 lotes en cuarentena pendientes         | |
| | [!] Sustrato XY: stock bajo (5 kg)           | |
| | [i] Lab muestra M-2026-042: resultados OK    | |
| +----------------------------------------------+ |
|                                                  |
| ULTIMO AUDIT TRAIL                               |
| +----------------------------------------------+ |
| | 14:32 | Juan P. | Cosecha | LOT-FL-008       | |
| | 14:15 | Maria L.| Riego   | LOT-VG-012       | |
| | 13:50 | Juan P. | Secado  | LOT-CO-005       | |
| +----------------------------------------------+ |
+--------------------------------------------------+
```

### 4.3 Pantalla de Chat

```
+--------------------------------------------------+
| [<] Chat de Operaciones              [QR] [Form] |
+--------------------------------------------------+
|                                                  |
| Sistema: Bienvenido Juan. Que operacion vas a    |
|          registrar hoy?                          |
|                                                  |
| Juan: Hoy hice esquejado de la planta madre     |
|       PM-045, saque 15 esquejes y los puse en   |
|       la sala de clones con sustrato jiffy       |
|                                                  |
| Sistema: Entendido. Extraje estos datos:         |
|          [Ver pantalla de confirmacion...]       |
|                                                  |
+--------------------------------------------------+
| +----------------------------------------------+ |
| | Escribe la operacion que realizaste...       | |
| +----------------------------------------------+ |
| [Enviar]                            [QR] [Mic-] |
+--------------------------------------------------+
```

### 4.4 Pantalla de Confirmacion

```
+--------------------------------------------------+
| [<] Confirmar Operacion                          |
+--------------------------------------------------+
|                                                  |
| Operacion detectada: ESQUEJADO                   |
| Confianza IA: 94%                                |
|                                                  |
| +----------------------------------------------+ |
| | Planta Madre:  [PM-045          ] [Edit]     | |
| | Cantidad:      [15              ] [Edit]     | |
| | Sala destino:  [Clonacion       ] [Edit]     | |
| | Lote nuevo:    [ESQ-2026-015    ] [Auto]     | |
| | Sustrato:      [Jiffy           ] [Edit]     | |
| | Fecha:         [2026-04-16      ] [Hoy]      | |
| | Responsable:   [Juan Perez      ] [Auto]     | |
| +----------------------------------------------+ |
|                                                  |
| Texto original:                                  |
| "Hoy hice esquejado de la planta madre PM-045,  |
|  saque 15 esquejes y los puse en la sala de     |
|  clones con sustrato jiffy"                      |
|                                                  |
| [   CANCELAR   ]        [   CONFIRMAR   ]        |
|                                                  |
+--------------------------------------------------+
```

### 4.5 Pantalla de Stock

```
+--------------------------------------------------+
| [<] Stock Actual               [Filtrar] [Buscar]|
+--------------------------------------------------+
| Ubicacion: [Todas          v]                    |
| Tipo:      [Todos          v]                    |
+--------------------------------------------------+
| PRODUCTO       | LOTE        | CANT | UBICACION  |
|----------------|-------------|------|------------|
| Planta Madre   | PM-045      |    1 | Madres     |
| Esqueje        | ESQ-2026-015|   15 | Clonacion  |
| Planta Veg     | VG-2026-008 |   22 | Vegetativa |
| Flor individual| FL-2026-003 |   18 | Secado     |
| Flores granel  | TR-2026-001 | 2.5kg| Cuarentena |
| Sustrato Jiffy | INS-JIF-001 | 50 u | Almacen A  |
| Fertilizante X | INS-FRT-003 | 12 L | Almacen A  |
+--------------------------------------------------+
| Pagina 1 de 3              [<] [1] [2] [3] [>]  |
+--------------------------------------------------+
```

### 4.6 Pantalla de Trazabilidad

```
+--------------------------------------------------+
| [<] Trazabilidad              [Inversa] [Direct] |
+--------------------------------------------------+
| Buscar lote/individuo: [TR-2026-001    ] [Buscar]|
+--------------------------------------------------+
|                                                  |
| CADENA DE TRAZABILIDAD INVERSA                   |
|                                                  |
| [Almacenamiento] LOT-ST-001 (2026-04-15)        |
|       ^                                          |
| [Fraccionamiento] LOT-FR-001 x5 (2026-04-14)    |
|       ^                                          |
| [Cuarentena] LOT-QR-001 LIBERADO (2026-04-12)   |
|       ^                                          |
| [Trimming] TR-2026-001 2.5kg (2026-04-10)       |
|       ^                                          |
| [Secado] LOT-SC-003 3.1kg (2026-04-05)          |
|       ^                                          |
| [Cosecha] LOT-CO-008 5.2kg (2026-03-28)         |
|       ^                                          |
| [Floracion] LOT-FL-012 x18 (2026-02-15)         |
|       ^                                          |
| [Vegetativa] LOT-VG-008 x22 (2026-01-20)        |
|       ^                                          |
| [Esquejado] ESQ-2025-089 x25 (2025-12-10)       |
|       ^                                          |
| [Planta Madre] PM-045 Strain: CBD-Rich-1        |
|                                                  |
+--------------------------------------------------+
```

### 4.7 Pantalla de Historial / Audit Trail

```
+--------------------------------------------------+
| [<] Audit Trail                          [Export] |
+--------------------------------------------------+
| Desde: [2026-04-01] Hasta: [2026-04-16]         |
| Usuario: [Todos    v] Accion: [Todas    v]       |
+--------------------------------------------------+
| FECHA/HORA   | USUARIO  | ACCION  | DETALLE      |
|--------------|----------|---------|--------------|
| 04-16 14:32  | Juan P.  | INSERT  | Cosecha      |
|              |          |         | LOT-CO-008   |
|              |          |         | Sig: a3f2... |
|--------------|----------|---------|--------------|
| 04-16 14:15  | Maria L. | INSERT  | Riego        |
|              |          |         | LOT-VG-012   |
|              |          |         | Sig: 7b1c... |
|--------------|----------|---------|--------------|
| 04-16 13:50  | Juan P.  | INSERT  | Secado       |
|              |          |         | LOT-SC-003   |
|              |          |         | Sig: e5d9... |
+--------------------------------------------------+
| [Verificar integridad de cadena de hashes]       |
| Estado: CADENA INTEGRA (1,247 registros)         |
+--------------------------------------------------+
```

---

## 5. MODELO DE DATOS

### 5.1 Diagrama Entidad-Relacion

```
+------------------+       +------------------+       +------------------+
|    auth.users    |       |     profiles     |       |      roles       |
|------------------|       |------------------|       |------------------|
| id (PK, UUID)   |<----->| user_id (FK)     |------>| id (PK)          |
| email            |       | full_name        |       | name             |
| encrypted_pw     |       | role_id (FK)     |       | permissions      |
| mfa_enabled      |       | org_id (FK)      |       +------------------+
+------------------+       | active           |
        |                  +------------------+
        |
        |  1:N
        v
+------------------+       +------------------+       +------------------+
|    audit_log     |       |   organizations  |       |     rooms        |
|------------------|       |------------------|       |------------------|
| id (PK, UUID)   |       | id (PK, UUID)    |       | id (PK, UUID)    |
| timestamp_utc    |       | name             |       | name             |
| user_id (FK)     |       | license_number   |       | type (ENUM)      |
| action           |       | address          |       | org_id (FK)      |
| table_name       |       +------------------+       | capacity         |
| record_id        |               |                  +------------------+
| old_data (JSONB) |               |                          |
| new_data (JSONB) |               |  1:N                     |
| input_raw        |               v                          |
| reason           |       +------------------+               |
| ip_address       |       |    warehouses    |               |
| record_signature |       |------------------|               |
| previous_hash    |       | id (PK, UUID)    |               |
+------------------+       | name             |               |
                           | room_id (FK)     |<--------------+
                           | org_id (FK)      |
                           +------------------+
                                   |
                                   |  1:N
                                   v
+------------------+       +------------------+       +------------------+
|     strains      |       |      stock       |       |    operations    |
|------------------|       |------------------|       |------------------|
| id (PK, UUID)   |       | id (PK, UUID)    |       | id (PK, UUID)    |
| name             |<------| strain_id (FK)   |       | type (ENUM)      |
| type (indica/    |       | individual_id    |       | timestamp_utc    |
|  sativa/hybrid)  |       | lot_id (FK)      |       | user_id (FK)     |
| thc_expected     |       | product_type     |       | source_lot_id FK |
| cbd_expected     |       | quantity          |       | dest_lot_id FK   |
+------------------+       | unit             |       | source_room FK   |
                           | warehouse_id FK  |       | dest_room FK     |
                           | status (ENUM)    |       | quantity          |
                           | expiration_date  |       | weight_kg         |
                           +------------------+       | data (JSONB)     |
                                   |                  | signature        |
                                   |  N:1             +------------------+
                                   v                          |
                           +------------------+               |
                           |      lots        |               |
                           |------------------|               |
                           | id (PK, UUID)    |<--------------+
                           | lot_code         |
                           | strain_id (FK)   |       +------------------+
                           | stage (ENUM)     |       |   lab_samples    |
                           | created_at       |       |------------------|
                           | mother_plant_id  |       | id (PK, UUID)    |
                           | source_lot_id FK |       | lot_id (FK)      |
                           +------------------+       | sample_date      |
                                                      | status (ENUM)    |
                                                      | thc_total        |
+------------------+       +------------------+       | cbd_total        |
|  notifications   |       |     reports      |       | contaminants JSON|
|------------------|       |------------------|       | certificate_url  |
| id (PK, UUID)   |       | id (PK, UUID)    |       | approved_by FK   |
| user_id (FK)     |       | type (PDF/CSV)   |       +------------------+
| message          |       | generated_by FK  |
| read             |       | generated_at     |
| created_at       |       | integrity_hash   |
+------------------+       | file_url         |
                           +------------------+
```

### 5.2 Resumen de Tablas

| # | Tabla | Registros estimados (1 ano) | Proposito |
|---|-------|----------------------------|-----------|
| 1 | auth.users | 50 | Usuarios del sistema |
| 2 | profiles | 50 | Perfil extendido y rol |
| 3 | roles | 4 | Definicion de roles |
| 4 | organizations | 1-5 | Organizaciones/licencias |
| 5 | rooms | 20-50 | Salas e instalaciones |
| 6 | warehouses | 10-30 | Almacenes dentro de salas |
| 7 | strains | 10-50 | Variedades/geneticas |
| 8 | stock | 10,000+ | Inventario activo |
| 9 | lots | 5,000+ | Lotes de produccion |
| 10 | operations | 50,000+ | Historial de operaciones |
| 11 | audit_log | 100,000+ | Audit trail inmutable |
| 12 | lab_samples | 500+ | Muestras de laboratorio |
| 13 | notifications | 10,000+ | Notificaciones a usuarios |
| 14 | reports | 1,000+ | Reportes generados |
| 15 | chat_sessions | 20,000+ | Sesiones de chat con IA |
| 16 | system_config | 50 | Configuracion del sistema |

---

## 6. REGLAS DE NEGOCIO

### 6.1 Reglas de Integridad de Datos

| # | Regla | Implementacion | Ref. URS |
|---|-------|----------------|----------|
| RN-001 | El stock nunca puede ser negativo | CHECK constraint en PostgreSQL + validacion pre-INSERT en Edge Function | RF-036 |
| RN-002 | El timestamp_utc es generado por el servidor y no puede ser editado por el usuario | DEFAULT NOW() en columna, sin parametro de timestamp en la API | RR-003 |
| RN-003 | El campo input_raw es inmutable una vez insertado | Trigger BEFORE UPDATE que previene cambios en audit_log.input_raw | RR-004 |
| RN-004 | Todo cambio (UPDATE/DELETE) requiere motivo obligatorio | CHECK constraint: reason NOT NULL para action IN ('UPDATE','DELETE') | RR-013 |
| RN-005 | Firma electronica obligatoria en operaciones criticas (cosecha, secado, trimming, baja) | Edge Function requiere re-autenticacion antes de INSERT | RR-011 |
| RN-006 | Cada registro debe estar vinculado a un usuario autenticado | NOT NULL constraint en user_id de todas las tablas transaccionales | RR-001 |
| RN-007 | Los IDs de QR deben ser unicos globalmente | UNIQUE constraint en stock.individual_id | RF-012 |
| RN-008 | Un lote en cuarentena no puede ser fraccionado | CHECK en Edge Function: lots.status != 'quarantine' para op fraccionamiento | RF-029, RF-030 |
| RN-009 | El peso seco nunca puede exceder el peso fresco | Validacion: dry_weight_kg < fresh_weight_kg | RF-027 |
| RN-010 | La cantidad de flores generadas en secado no puede exceder la cantidad de plantas | CHECK: output_flower_count <= input_plant_count | RF-027 |
| RN-011 | Solo un supervisor puede aprobar operaciones criticas | RLS policy + validacion de rol en Edge Function | RF-003 |
| RN-012 | Un lote solo puede ser liberado si tiene resultados de laboratorio aprobados | Estado lab_samples.status = 'completed' AND todos los parametros en rango | RF-029 |
| RN-013 | El hash encadenado del audit trail debe ser verificable en cualquier momento | Vista materializada con calculo de hashes para comparacion | RR-012 |
| RN-014 | Los reportes PDF deben incluir hash de integridad verificable offline | SHA-256 del contenido serializado incluido en el pie del PDF | RF-038 |
| RN-015 | Datos de exportacion CSV deben cumplir formato requerido por ANMAT/ARICCAME | Templates de CSV con campos obligatorios segun regulacion vigente | RF-039 |
| RN-016 | La trazabilidad debe ser completa: ningun registro de operacion tiene origen o destino NULL | NOT NULL constraints en source_lot_id y dest_lot_id (o dest_room_id) | RF-034 |
| RN-017 | Los esquejes siempre heredan la trazabilidad a la planta madre | FK mother_plant_id NOT NULL en operacion de esquejado | RF-021 |
| RN-018 | El periodo de retencion minimo de datos es 5 anos | Politica de backup y retencion configurada en Supabase | RR-008 |

---

## 7. SEGURIDAD

### 7.1 Row Level Security (RLS)

| Tabla | Operador | Supervisor | Auditor | Admin |
|-------|----------|------------|---------|-------|
| stock | SELECT WHERE warehouse_id IN (user_warehouses) | SELECT ALL | SELECT ALL | SELECT ALL |
| operations | INSERT, SELECT propia | INSERT, SELECT ALL, UPDATE (approve) | SELECT ALL | SELECT ALL |
| audit_log | - | - | SELECT ALL | SELECT ALL |
| profiles | SELECT propia | SELECT ALL | SELECT ALL | ALL |
| lab_samples | - | SELECT, UPDATE | SELECT ALL | SELECT ALL |
| reports | - | SELECT, INSERT | SELECT ALL | SELECT ALL |

### 7.2 Autenticacion y Tokens

| Parametro | Valor | Justificacion |
|-----------|-------|---------------|
| JWT expiration | 3600 segundos (1 hora) | RS-003, limita ventana de uso de token robado |
| Refresh token expiration | 7 dias | Balance entre seguridad y UX |
| Algoritmo JWT | HS256 | Estandar de Supabase Auth |
| Password hash | bcrypt, costo 10 | RS-001, resistencia a fuerza bruta |
| MFA | TOTP (RFC 6238) | RF-001, factor adicional opcional |

### 7.3 Rate Limiting (RS-004)

| Endpoint | Limite | Ventana |
|----------|--------|---------|
| /auth/login | 10 req | 1 minuto |
| /api/chat | 30 req | 1 minuto |
| /api/operations | 100 req | 1 minuto |
| /api/reports | 10 req | 1 minuto |
| Global por usuario | 100 req | 1 minuto |

Implementado via Supabase Edge Functions con contador en memoria (o Redis en escala).

### 7.4 CORS (RS-006)

```json
{
  "allowed_origins": [
    "https://canntrace.app",
    "https://canntrace-val.app"
  ],
  "allowed_methods": ["GET", "POST", "PUT"],
  "allowed_headers": ["Authorization", "Content-Type", "X-Request-ID"],
  "max_age": 86400
}
```

### 7.5 Proteccion contra Inyeccion (RS-005)

- Todas las consultas a PostgreSQL usan prepared statements via el cliente de Supabase.
- Las Edge Functions sanitizan entradas con zod schemas antes de pasarlas a la base de datos.
- El input del chat se escapa antes de enviarse a Groq API para prevenir prompt injection.

---

## 8. TRAZABILIDAD A URS

### 8.1 Matriz de Trazabilidad FS -> URS

| Especificacion Funcional | Requerimientos URS Implementados |
|--------------------------|----------------------------------|
| FS-2: Autenticacion | RF-001, RF-002, RF-003, RF-004, RF-005, RS-001, RS-002, RS-003, RR-001 |
| FS-3: Chat Textual | RF-006, RF-007, RF-008, RF-009, RF-010, RF-011, RR-001, RR-003, RR-004, RI-001, RI-002, RI-003 |
| FS-4: Escaneo QR | RF-012, RF-013, RF-014, RF-015, RF-037, RI-004 |
| FS-5: Operaciones Seed-to-Sale | RF-016 a RF-031, RR-001, RR-003, RR-004, RR-005, RR-006, RR-010, RR-011, RR-013 |
| FS-6: Trazabilidad | RF-032, RF-033, RF-034 |
| FS-7: Gestion de Stock | RF-035, RF-036, RF-037 |
| FS-8: Laboratorio y Cuarentena | RF-029 (complemento) |
| FS-9: Reportes y Exportacion | RF-038, RF-039, RF-040, RR-002, RR-009 |
| FS-10: Audit Trail y Firma | RF-005, RF-011, RR-001, RR-003, RR-004, RR-005, RR-006, RR-010, RR-011, RR-012, RR-013 |

### 8.2 Cobertura de Requerimientos No Funcionales

| Req. URS | FS que lo aborda | Mecanismo |
|----------|------------------|-----------|
| RNF-001 (< 3s respuesta) | FS-9 (Dashboard) | Indices en PostgreSQL, paginacion, cache en Service Worker |
| RNF-002 (Offline) | FS-3, FS-4 | Service Worker con cola de sincronizacion (Workbox) |
| RNF-003 (99.5% uptime) | Arquitectura general | Supabase con SLA, monitoreo externo |
| RNF-004 (50 concurrentes) | Arquitectura general | Connection pooling de Supabase, Edge Functions stateless |
| RNF-005 (Encriptacion) | Seccion 7 Seguridad | TLS 1.2+ en transito, encriptacion en reposo por Supabase |
| RNF-006 (Multi-idioma) | Todas las pantallas | i18n con react-i18next, archivos de traduccion ES/EN |
| RNF-007 (Compatibilidad) | Frontend PWA | Testing en Chrome, Safari, Firefox; manifest.json para PWA |

### 8.3 Cobertura de Requerimientos de Interfaz

| Req. URS | FS / Pantalla |
|----------|---------------|
| RI-001 (Chat textual) | FS-3, Pantalla 4.3 |
| RI-002 (Formulario fallback) | FS-3.2 paso 6 |
| RI-003 (Confirmacion obligatoria) | FS-3.2 paso 5, Pantalla 4.4 |
| RI-004 (Escaner QR) | FS-4, integrado en Pantalla 4.3 |
| RI-005 (Navegacion intuitiva) | Pantalla 4.2, barra de navegacion superior |

### 8.4 Cobertura de Requerimientos de Seguridad

| Req. URS | FS / Seccion |
|----------|-------------|
| RS-001 (bcrypt) | FS-2.1 paso 4, Seccion 7.2 |
| RS-002 (HTTPS) | Seccion 7.2, Arquitectura 2.1 |
| RS-003 (JWT expiration) | FS-2.4, Seccion 7.2 |
| RS-004 (Rate limiting) | Seccion 7.3 |
| RS-005 (SQL injection) | Seccion 7.5 |
| RS-006 (CORS) | Seccion 7.4 |

---

## 9. APROBACIONES

Este documento requiere la aprobacion formal de los siguientes roles antes de proceder con la Especificacion de Diseno (DS-001) y los protocolos de calificacion.

| Rol | Nombre | Firma | Fecha |
|-----|--------|-------|-------|
| Propietario del Proceso | _______________ | _______________ | ___/___/______ |
| QA / Regulatorio | _______________ | _______________ | ___/___/______ |
| IT / Desarrollo | _______________ | _______________ | ___/___/______ |
| Propietario del Sistema | _______________ | _______________ | ___/___/______ |
| Director Tecnico | _______________ | _______________ | ___/___/______ |

---

**Fin del documento FS-001 v0.1**

*Este documento es propiedad de CannTrace. Su reproduccion o distribucion no autorizada esta prohibida.*
*Generado conforme a ISPE GAMP 5 (2da Edicion, 2022) y ANMAT Disp. 4159/2023 Anexo 6.*
