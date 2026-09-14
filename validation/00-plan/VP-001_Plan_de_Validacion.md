# VP-001 -- Plan Maestro de Validacion

## Sistema CannTrace -- Trazabilidad Integral de Cannabis Medicinal

---

## 1. CARATULA

| Campo | Detalle |
|---|---|
| **Documento ID** | VP-001 |
| **Titulo** | Plan Maestro de Validacion -- Sistema CannTrace |
| **Version** | 0.1 |
| **Clasificacion** | Confidencial -- Uso Interno |
| **Estado** | Borrador |
| **Fecha de Emision** | 2026-04-16 |
| **Fecha de Vigencia** | Pendiente aprobacion |
| **Preparado por** | Equipo de Validacion CannTrace |
| **Categoria GAMP5** | Categoria 5 -- Sistema Configurado a Medida |
| **Normativa Aplicable** | ANMAT Disp. 4159/2023 Anexo 6; GAMP5 2nd Ed.; ICH Q9; 21 CFR Part 11 |

### Historial de Revisiones

| Version | Fecha | Autor | Descripcion del Cambio | Aprobado por |
|---|---|---|---|---|
| 0.1 | 2026-04-16 | Equipo de Validacion | Emision inicial del documento | Pendiente |
| | | | | |
| | | | | |

### Distribucion del Documento

| Copia N.ro | Destinatario | Cargo | Fecha de Entrega |
|---|---|---|---|
| 1 | System Owner | Propietario del Sistema | |
| 2 | Process Owner | Propietario del Proceso | |
| 3 | QA Manager | Responsable de Calidad | |
| 4 | IT/Dev Lead | Lider de Desarrollo | |
| 5 | Archivo Regulatorio | Documentacion Oficial | |

---

## 2. PROPOSITO

### 2.1 Objetivo del Documento

El presente Plan Maestro de Validacion (VP-001) establece la estrategia, el enfoque, las responsabilidades y el cronograma para la validacion del sistema computarizado **CannTrace**, una aplicacion web progresiva (PWA) destinada a la trazabilidad integral de cannabis medicinal desde semilla hasta venta (*seed-to-sale*).

### 2.2 Justificacion Regulatoria

La validacion de este sistema es requerida por las siguientes disposiciones y marcos normativos:

- **ANMAT Disposicion 4159/2023, Anexo 6** -- "Buenas Practicas de Fabricacion para Elaboradores, Importadores y Exportadores de Medicamentos": establece en su Anexo 6 los requisitos para la validacion de sistemas computarizados utilizados en el ambito de las Buenas Practicas de Manufactura (BPM/GMP). En particular, exige que todo sistema informatico que gestione datos criticos GMP debe estar validado previamente a su uso en produccion, debe mantener registros completos de audit trail, y debe asegurar la integridad de datos conforme a los principios ALCOA+ (Atribuible, Legible, Contemporaneo, Original, Exacto, Completo, Consistente, Duradero, Disponible).

- **ISPE GAMP5 Segunda Edicion (2022)** -- Guia de referencia internacional para la validacion de sistemas computarizados en la industria farmaceutica. Proporciona el marco metodologico basado en riesgo utilizado en este plan.

- **ICH Q9 -- Quality Risk Management** -- Marco armonizado para la gestion de riesgos de calidad, utilizado como base para la evaluacion de riesgos del sistema.

- **21 CFR Part 11 (referencia)** -- Si bien la normativa FDA no aplica directamente en jurisdiccion argentina, se toma como referencia de mejores practicas para registros electronicos y firmas electronicas.

### 2.3 Alcance de la Validacion

Este plan cubre la validacion completa del ciclo de vida del sistema CannTrace, incluyendo:

- Verificacion de que los requerimientos del usuario son satisfechos (URS).
- Verificacion de que el diseno funcional y tecnico cumple con los requerimientos.
- Calificacion de la instalacion (IQ), operacion (OQ) y desempeno (PQ).
- Evaluacion de riesgos basada en FMEA.
- Verificacion de integridad de datos y audit trail.
- Validacion de interfaces con sistemas externos (Groq API, Supabase).

---

## 3. ALCANCE

### 3.1 Sistema Incluido

| Atributo | Descripcion |
|---|---|
| **Nombre del Sistema** | CannTrace |
| **Tipo** | Aplicacion Web Progresiva (PWA) |
| **Funcion Principal** | Trazabilidad integral seed-to-sale de cannabis medicinal |
| **Categoria GAMP5** | Categoria 5 -- Software Configurado a Medida |
| **Ambiente** | Cloud-hosted (Supabase + Cloudflare Pages) |
| **Usuarios** | Operadores de cultivo, laboratorio QC, almacen, logistica, QA, direccion tecnica |

### 3.2 Funcionalidades Cubiertas

1. **Gestion de Lotes de Semillas**: Registro, genealogia, certificados de origen.
2. **Trazabilidad de Cultivo**: Etapas fenologicas, condiciones ambientales, tratamientos fitosanitarios.
3. **Control de Cosecha y Secado**: Pesos, rendimientos, condiciones de proceso.
4. **Control de Calidad / Laboratorio**: Registro de resultados analiticos (cannabinoides, microbiologia, metales pesados, pesticidas), liberacion de lotes.
5. **Gestion de Inventario**: Stock en tiempo real, movimientos, asignacion de ubicaciones.
6. **Despacho y Distribucion**: Ordenes de salida, cadena de custodia, trazabilidad inversa.
7. **Audit Trail**: Registro inmutable de todas las operaciones criticas GMP.
8. **Reportes Regulatorios**: Generacion de informes para ANMAT, certificados de analisis, balances de materia.
9. **Interfaz de Voz/Texto a JSON**: Carga de datos mediante lenguaje natural procesado por Groq API.

### 3.3 Elementos Fuera de Alcance

- Sistemas de control de acceso fisico a instalaciones.
- Equipos de laboratorio analitico (HPLC, GC-MS) -- se validan por separado; solo se valida la interfaz de datos.
- Sistemas de facturacion y contabilidad.
- Red de infraestructura (routers, switches) -- cubierto por calificacion de IT separada.

### 3.4 Clasificacion GAMP5

El sistema CannTrace se clasifica como **Categoria 5 -- Software Configurado a Medida** dado que:

- El codigo fuente es desarrollado especificamente para las necesidades del proceso de cannabis medicinal.
- No se trata de un software comercial COTS (Categoria 4) ni de un componente de infraestructura (Categorias 1-3).
- Incluye logica de negocio personalizada, flujos de trabajo configurados y reglas de validacion especificas del dominio regulatorio de cannabis.

Esto implica que se requiere el **nivel maximo de documentacion y testing** segun GAMP5.

---

## 4. DESCRIPCION DEL SISTEMA

### 4.1 Arquitectura General

```
+------------------------------------------------------------------+
|                         USUARIOS                                  |
|  Operadores / QA / Lab / Direccion Tecnica                       |
+----------------------------------+-------------------------------+
                                   |
                            HTTPS / TLS 1.3
                                   |
+----------------------------------v-------------------------------+
|                    FRONTEND -- React PWA                          |
|  - React 18+ con TypeScript                                      |
|  - TailwindCSS + Componentes UI                                  |
|  - Service Worker (modo offline)                                  |
|  - Almacenamiento local (IndexedDB) para cache offline            |
|  - Hosted en Cloudflare Pages                                     |
+----------------------------------+-------------------------------+
                                   |
                         API REST / Realtime
                                   |
+----------------------------------v-------------------------------+
|                    BACKEND -- Supabase                             |
|  +--------------------+  +--------------------+                   |
|  | PostgreSQL 15+     |  | Edge Functions     |                   |
|  | - Tablas GMP       |  | (Deno/TypeScript)  |                   |
|  | - RLS Policies     |  | - Business Logic   |                   |
|  | - Audit Trail      |  | - Validaciones     |                   |
|  | - Triggers         |  | - Integraciones    |                   |
|  +--------------------+  +--------------------+                   |
|  +--------------------+  +--------------------+                   |
|  | Auth (GoTrue)      |  | Storage (S3)       |                   |
|  | - JWT Tokens       |  | - Documentos       |                   |
|  | - RBAC             |  | - Certificados     |                   |
|  | - MFA              |  | - Fotos de lotes   |                   |
|  +--------------------+  +--------------------+                   |
+----------------------------------+-------------------------------+
                                   |
                          API REST (HTTPS)
                                   |
+----------------------------------v-------------------------------+
|                    GROQ API -- LLM Service                        |
|  - Modelo: LLaMA 3 / Mixtral (via Groq Cloud)                    |
|  - Funcion: Text-to-JSON (lenguaje natural -> datos estructurados)|
|  - Sin almacenamiento de datos del lado del proveedor             |
+------------------------------------------------------------------+
```

### 4.2 Componentes del Sistema

| Componente | Tecnologia | Funcion | Proveedor | GAMP Cat. |
|---|---|---|---|---|
| Frontend PWA | React + TypeScript | Interfaz de usuario, captura de datos, visualizacion | Desarrollo propio | Cat. 5 |
| Base de Datos | Supabase PostgreSQL 15+ | Almacenamiento persistente, audit trail, RLS | Supabase Inc. | Cat. 1 (infra) |
| Edge Functions | Deno (TypeScript) en Supabase | Logica de negocio, validaciones server-side | Desarrollo propio | Cat. 5 |
| Autenticacion | Supabase Auth (GoTrue) | Autenticacion, autorizacion RBAC, MFA | Supabase Inc. | Cat. 3 |
| Almacenamiento | Supabase Storage (S3) | Documentos, certificados, imagenes | Supabase Inc. | Cat. 1 (infra) |
| Text-to-JSON | Groq API (LLaMA 3) | Conversion lenguaje natural a datos estructurados | Groq Inc. | Cat. 5 |
| Hosting | Cloudflare Pages | Servicio de hosting para PWA | Cloudflare Inc. | Cat. 1 (infra) |
| Service Worker | Workbox (Google) | Funcionalidad offline, cache | Open Source | Cat. 3 |

### 4.3 Clasificacion de Datos

#### 4.3.1 Datos Criticos GMP (Impacto Directo en Calidad del Producto)

Estos datos requieren audit trail completo, validacion estricta y controles de integridad:

| Dato | Tabla/Entidad | Criticidad | Justificacion |
|---|---|---|---|
| Identificacion de lote | `batches` | **Critica** | Trazabilidad regulatoria obligatoria |
| Resultados analiticos | `lab_results` | **Critica** | Liberacion de lote, seguridad del paciente |
| Decisiones de liberacion/rechazo | `batch_decisions` | **Critica** | Impacto directo en distribucion |
| Movimientos de inventario | `inventory_movements` | **Critica** | Balance de materia, prevencion de desvio |
| Condiciones de cultivo | `cultivation_logs` | **Alta** | Trazabilidad de proceso |
| Pesos y rendimientos | `harvest_records` | **Alta** | Balance de materia |
| Tratamientos fitosanitarios | `treatments` | **Alta** | Seguridad del producto, periodos de carencia |
| Firmas electronicas | `signatures` | **Critica** | Atribuibilidad, no repudio |
| Audit trail | `audit_log` | **Critica** | Integridad de datos, requisito regulatorio |

#### 4.3.2 Datos No Criticos (Sin Impacto Directo en Calidad)

| Dato | Tabla/Entidad | Criticidad | Justificacion |
|---|---|---|---|
| Preferencias de usuario | `user_preferences` | Baja | Configuracion visual, sin impacto GMP |
| Dashboards y reportes visuales | `dashboard_config` | Baja | Presentacion de datos, no datos fuente |
| Notas internas no regulatorias | `internal_notes` | Media | Comunicacion interna |
| Configuracion de notificaciones | `notification_settings` | Baja | Funcionalidad auxiliar |

### 4.4 Flujos de Datos Criticos

1. **Registro de Lote** --> Asignacion de ID unico --> Registro en audit trail --> Confirmacion al usuario.
2. **Carga de Resultados** --> Validacion de formato y rango --> Almacenamiento en BD --> Audit trail --> Notificacion a QA.
3. **Liberacion de Lote** --> Verificacion de resultados completos --> Firma electronica --> Cambio de estado --> Audit trail.
4. **Text-to-JSON** --> Input de usuario (voz/texto) --> Envio a Groq API --> Respuesta JSON --> Validacion de esquema --> Presentacion al usuario para confirmacion --> Almacenamiento con firma.

---

## 5. ESTRATEGIA DE VALIDACION

### 5.1 Enfoque Basado en Riesgo (GAMP5)

La estrategia de validacion sigue el enfoque basado en riesgo de GAMP5 Segunda Edicion (2022), que establece que el esfuerzo de validacion debe ser proporcional al riesgo que el sistema representa para la seguridad del paciente, la calidad del producto y la integridad de los datos.

**Principio rector**: *"El nivel de esfuerzo de validacion debe ser proporcional al nivel de riesgo."*

### 5.2 Modelo en V (V-Model)

El ciclo de vida de validacion sigue el Modelo en V de GAMP5:

```
  Requerimientos de Usuario (URS)  <------------>  Calificacion de Desempeno (PQ)
         |                                                    ^
         v                                                    |
  Especificacion Funcional (FS)    <------------>  Calificacion Operacional (OQ)
         |                                                    ^
         v                                                    |
  Especificacion de Diseno (DS)    <------------>  Calificacion de Instalacion (IQ)
         |                                                    ^
         v                                                    |
         +----------->  DESARROLLO / CONFIGURACION  ----------+
```

Cada nivel del lado izquierdo (especificacion) tiene su correspondiente nivel de verificacion en el lado derecho (calificacion), asegurando trazabilidad bidireccional de todos los requerimientos.

### 5.3 Enfoque Hibrido: GAMP5 Completo + CSA

Se adopta un **enfoque hibrido** que combina:

#### 5.3.1 GAMP5 Completo -- Para Funciones Criticas GMP

Aplicado a todas las funcionalidades con impacto directo en la calidad del producto o la seguridad del paciente:

- Documentacion formal completa (URS, FS, DS, protocolos IQ/OQ/PQ).
- Trazabilidad bidireccional de requerimientos.
- Protocolos de prueba pre-aprobados con criterios de aceptacion definidos.
- Evidencia documental firmada de cada ejecucion de prueba.
- FMEA formal para identificacion y mitigacion de riesgos.

**Funciones cubiertas por GAMP5 completo:**

- Gestion de lotes y trazabilidad.
- Registro de resultados analiticos.
- Decisiones de liberacion/rechazo.
- Audit trail y firmas electronicas.
- Movimientos de inventario y balance de materia.
- Control de acceso basado en roles (RBAC).
- Integridad de datos (backup, recuperacion, inmutabilidad de audit trail).

#### 5.3.2 Computer Software Assurance (CSA) -- Para Funciones No Criticas

Aplicado a funcionalidades de interfaz de usuario y auxiliares sin impacto GMP directo:

- Testing basado en pensamiento critico (*critical thinking-based testing*).
- Pruebas exploratorias documentadas con evidencia de resultado.
- Scripts de prueba no estructurados (ad-hoc testing con documentacion de hallazgos).
- Menor carga documental, enfoque en la efectividad del testing.

**Funciones cubiertas por CSA:**

- Dashboards y visualizaciones.
- Preferencias de usuario y personalizacion de interfaz.
- Notificaciones no criticas.
- Funcionalidades de navegacion y usabilidad general.

### 5.4 Criterios de Seleccion del Enfoque

| Criterio | GAMP5 Completo | CSA |
|---|---|---|
| Impacto en calidad del producto | Si | No |
| Impacto en seguridad del paciente | Si | No |
| Datos sujetos a audit trail | Si | No |
| Funcionalidad regulatoria | Si | No |
| Solo UI/UX sin impacto en datos | No | Si |
| Reportes visuales (datos ya validados) | No | Si |

### 5.5 Actividades de Validacion por Fase

| Fase | Actividad | Entregables | Enfoque |
|---|---|---|---|
| Planificacion | Elaboracion del Plan de Validacion | VP-001 (este documento) | GAMP5 |
| Especificacion | Requerimientos de Usuario | URS-001 | GAMP5 |
| Especificacion | Especificacion Funcional | FS-001 | GAMP5 |
| Especificacion | Especificacion de Diseno | DS-001 | GAMP5 |
| Evaluacion de Riesgos | Analisis FMEA | FMEA-001 | GAMP5 |
| Calificacion | Calificacion de Instalacion | IQ-001 (Protocolo + Informe) | GAMP5 |
| Calificacion | Calificacion Operacional | OQ-001 (Protocolo + Informe) | GAMP5 |
| Calificacion | Calificacion de Desempeno | PQ-001 (Protocolo + Informe) | GAMP5 |
| Trazabilidad | Matriz de Trazabilidad | TM-001 | GAMP5 |
| Cierre | Informe Final de Validacion | VR-001 | GAMP5 |

---

## 6. ORGANIZACION Y RESPONSABILIDADES

### 6.1 Estructura Organizativa de Validacion

```
                    +---------------------+
                    |    System Owner     |
                    | (Propietario del    |
                    |     Sistema)        |
                    +----------+----------+
                               |
              +----------------+----------------+
              |                                 |
   +----------v----------+          +-----------v---------+
   |   Process Owner     |          |   Validation Lead   |
   | (Propietario del    |          | (Lider de           |
   |     Proceso)        |          |  Validacion)        |
   +----------+----------+          +-----------+----------+
              |                                 |
              |                    +------------+------------+
              |                    |                         |
   +----------v----------+  +-----v-------+   +-------------v---+
   |    QA Manager       |  |  IT/Dev     |   |   SME (Expertos |
   | (Responsable de     |  |  Lead       |   |   de Proceso)   |
   |     Calidad)        |  |             |   |                 |
   +---------------------+  +-------------+   +-----------------+
```

### 6.2 Matriz de Responsabilidades (RACI)

| Actividad | System Owner | Process Owner | QA Manager | IT/Dev Lead | Validation Lead |
|---|---|---|---|---|---|
| Aprobacion del Plan de Validacion | **A** | C | R | C | **R** |
| Elaboracion de URS | C | **R** | C | C | A |
| Elaboracion de FS/DS | C | C | C | **R** | A |
| Evaluacion de Riesgos (FMEA) | I | **R** | R | R | **A** |
| Desarrollo del Sistema | I | C | I | **R** | C |
| Ejecucion de IQ | I | I | C | **R** | A |
| Ejecucion de OQ | I | C | **R** | R | A |
| Ejecucion de PQ | I | **R** | R | C | A |
| Revision de Protocolos | C | C | **A** | C | R |
| Aprobacion de Informes | **A** | C | R | C | R |
| Gestion de Desviaciones | I | C | **A** | R | R |
| Gestion de Cambios | **A** | C | R | R | R |
| Mantenimiento del Estado Validado | C | C | **R** | R | A |

**Leyenda**: R = Responsable, A = Aprueba, C = Consultado, I = Informado.

### 6.3 Descripcion de Roles

| Rol | Responsabilidades Principales |
|---|---|
| **System Owner** | Responsable maximo del sistema. Aprueba el plan de validacion, autoriza cambios criticos, asegura recursos. Responsable ante las autoridades regulatorias por el estado validado del sistema. |
| **Process Owner** | Responsable de los procesos de negocio soportados por el sistema. Define requerimientos de usuario, valida que el sistema cumpla las necesidades operativas, participa en PQ. |
| **QA Manager** | Asegura que la validacion cumple con los requisitos regulatorios. Revisa y aprueba documentacion. Gestiona desviaciones y CAPA. Responsable de la liberacion del sistema para uso en produccion. |
| **IT/Dev Lead** | Responsable tecnico del desarrollo, configuracion y mantenimiento del sistema. Ejecuta IQ, participa en OQ, gestiona la infraestructura tecnica. |
| **Validation Lead** | Coordina todas las actividades de validacion. Elabora y mantiene la documentacion de validacion. Asegura el cumplimiento del cronograma. Genera la matriz de trazabilidad. |

---

## 7. DOCUMENTOS ENTREGABLES

### 7.1 Lista Completa de Entregables de Validacion

| ID Documento | Titulo | Fase | Estado | Responsable |
|---|---|---|---|---|
| **VP-001** | Plan Maestro de Validacion | Planificacion | En elaboracion | Validation Lead |
| **URS-001** | Especificacion de Requerimientos de Usuario | Especificacion | Pendiente | Process Owner |
| **FS-001** | Especificacion Funcional | Especificacion | Pendiente | IT/Dev Lead |
| **DS-001** | Especificacion de Diseno | Especificacion | Pendiente | IT/Dev Lead |
| **FMEA-001** | Analisis de Modo y Efecto de Falla | Riesgos | Pendiente | Validation Lead |
| **IQ-001-P** | Protocolo de Calificacion de Instalacion | Calificacion | Pendiente | IT/Dev Lead |
| **IQ-001-R** | Informe de Calificacion de Instalacion | Calificacion | Pendiente | IT/Dev Lead |
| **OQ-001-P** | Protocolo de Calificacion Operacional | Calificacion | Pendiente | QA Manager |
| **OQ-001-R** | Informe de Calificacion Operacional | Calificacion | Pendiente | QA Manager |
| **PQ-001-P** | Protocolo de Calificacion de Desempeno | Calificacion | Pendiente | Process Owner |
| **PQ-001-R** | Informe de Calificacion de Desempeno | Calificacion | Pendiente | Process Owner |
| **TM-001** | Matriz de Trazabilidad de Requerimientos | Trazabilidad | Pendiente | Validation Lead |
| **VR-001** | Informe Final de Validacion | Cierre | Pendiente | Validation Lead |
| **SOP-001** | SOP de Uso del Sistema CannTrace | SOPs | Pendiente | Process Owner |
| **SOP-002** | SOP de Administracion del Sistema | SOPs | Pendiente | IT/Dev Lead |
| **SOP-003** | SOP de Control de Cambios | SOPs | Pendiente | QA Manager |
| **SOP-004** | SOP de Backup y Recuperacion | SOPs | Pendiente | IT/Dev Lead |
| **SOP-005** | SOP de Gestion de Incidentes | SOPs | Pendiente | QA Manager |
| **SOP-006** | SOP de Revision Periodica | SOPs | Pendiente | Validation Lead |
| **TR-001** | Registros de Capacitacion | Capacitacion | Pendiente | QA Manager |
| **SA-001** | Evaluacion de Proveedores (Supplier Assessment) | Proveedores | Pendiente | QA Manager |

### 7.2 Relacion entre Documentos

```
VP-001 (Plan)
  |
  +---> URS-001 (Requerimientos)
  |       |
  |       +---> FS-001 (Funcional)
  |       |       |
  |       |       +---> DS-001 (Diseno)
  |       |               |
  |       |               +---> DESARROLLO
  |       |                       |
  |       |               +---> IQ-001 (verifica DS-001)
  |       |       +---> OQ-001 (verifica FS-001)
  |       +---> PQ-001 (verifica URS-001)
  |
  +---> FMEA-001 (Riesgos) --> alimenta IQ/OQ/PQ
  |
  +---> TM-001 (Trazabilidad) --> vincula todo
  |
  +---> VR-001 (Informe Final) --> cierra validacion
  |
  +---> SOPs (001-006) --> operacion post-validacion
  |
  +---> TR-001 (Capacitacion) --> habilitacion de usuarios
  |
  +---> SA-001 (Proveedores) --> evaluacion de terceros
```

---

## 8. EVALUACION DE RIESGOS

### 8.1 Metodologia

La evaluacion de riesgos se realiza mediante **Analisis de Modo y Efecto de Falla (FMEA)**, documentada en el entregable **FMEA-001**, en alineacion con:

- **ICH Q9** -- Quality Risk Management.
- **ISPE GAMP5** -- Apendice M3: Risk Assessment.
- **ANMAT Disp. 4159/2023** -- Requisitos de gestion de riesgos para sistemas computarizados.

### 8.2 Proceso de Evaluacion de Riesgos

```
Identificacion de Peligros
        |
        v
Analisis de Riesgos (FMEA)
  - Severidad (S): 1-5
  - Probabilidad de Ocurrencia (O): 1-5
  - Detectabilidad (D): 1-5
  - RPN = S x O x D
        |
        v
Evaluacion de Riesgos
  - RPN >= 60: Riesgo CRITICO --> accion correctiva obligatoria
  - RPN 30-59: Riesgo ALTO --> accion correctiva recomendada
  - RPN 10-29: Riesgo MEDIO --> monitoreo
  - RPN < 10: Riesgo BAJO --> aceptable
        |
        v
Control de Riesgos
  - Controles preventivos (diseno)
  - Controles de deteccion (testing)
  - Controles de mitigacion (procedimientos)
        |
        v
Revision de Riesgos Residuales
        |
        v
Aceptacion Formal del Riesgo Residual
```

### 8.3 Escalas de Evaluacion

#### Severidad (S)

| Nivel | Valor | Descripcion |
|---|---|---|
| Catastrofico | 5 | Perdida de integridad de datos GMP, impacto en seguridad del paciente |
| Critico | 4 | Incumplimiento regulatorio grave, perdida de trazabilidad de lote |
| Mayor | 3 | Error en datos no criticos GMP, funcionalidad degradada significativamente |
| Menor | 2 | Inconveniente operativo, workaround disponible |
| Insignificante | 1 | Impacto estetico o de usabilidad sin consecuencia funcional |

#### Probabilidad de Ocurrencia (O)

| Nivel | Valor | Descripcion |
|---|---|---|
| Muy alta | 5 | Ocurrira con certeza (>90% probabilidad) |
| Alta | 4 | Probable (50-90%) |
| Moderada | 3 | Posible (10-50%) |
| Baja | 2 | Improbable (1-10%) |
| Muy baja | 1 | Casi imposible (<1%) |

#### Detectabilidad (D)

| Nivel | Valor | Descripcion |
|---|---|---|
| No detectable | 5 | El fallo no sera detectado antes de impactar al usuario/producto |
| Deteccion dificil | 4 | Solo detectable mediante auditoria exhaustiva |
| Deteccion moderada | 3 | Detectable mediante revision de rutina |
| Facilmente detectable | 2 | Detectado por controles automaticos del sistema |
| Deteccion inmediata | 1 | Deteccion automatica en tiempo real con alerta |

### 8.4 Areas Criticas Identificadas Preliminarmente

Las siguientes areas seran evaluadas en detalle en FMEA-001:

1. **Integridad del Audit Trail**: Riesgo de manipulacion, borrado o corrupcion de registros de auditoria.
2. **Disponibilidad del Sistema (Cloud)**: Dependencia de proveedores externos (Supabase, Cloudflare, Groq).
3. **Sincronizacion Offline/Online**: Riesgo de conflictos de datos cuando el PWA trabaja sin conexion y luego sincroniza.
4. **Precision de Text-to-JSON (Groq API)**: Riesgo de interpretacion incorrecta de datos ingresados por voz/texto libre.
5. **Control de Acceso (RBAC)**: Riesgo de escalacion de privilegios o acceso no autorizado a funciones criticas.
6. **Backup y Recuperacion**: Riesgo de perdida de datos ante fallo de infraestructura cloud.
7. **Firma Electronica**: Riesgo de firma no atribuible o repudiable.

---

## 9. CRITERIOS DE ACEPTACION

### 9.1 Criterios Generales

Para que el sistema CannTrace sea considerado **validado y apto para uso en produccion**, deben cumplirse los siguientes criterios:

| Nivel de Criticidad del Caso de Prueba | Tasa de Aprobacion Requerida | Condicion Adicional |
|---|---|---|
| **Critico** | **100%** | Cero defectos abiertos. Todos los casos deben pasar sin excepcion. |
| **Alto** | **>= 95%** | Defectos residuales deben tener CAPA aprobado y no impactar funciones GMP. |
| **Medio** | **>= 90%** | Defectos residuales documentados con plan de remediacion y fecha limite. |
| **Bajo** | **>= 90%** | Defectos residuales aceptados formalmente por el System Owner. |

### 9.2 Criterios Especificos por Fase

#### IQ -- Calificacion de Instalacion

- Todos los componentes de software instalados coinciden con las versiones especificadas en DS-001.
- La configuracion de la base de datos coincide con la especificacion de diseno.
- Los accesos y permisos estan configurados conforme a la matriz RBAC definida.
- Los certificados SSL/TLS estan vigentes y correctamente configurados.
- Los backups automaticos estan operativos y verificados.

#### OQ -- Calificacion Operacional

- Todas las funciones criticas GMP operan conforme a FS-001.
- El audit trail registra correctamente: usuario, fecha/hora, accion, valor anterior, valor nuevo.
- Las firmas electronicas son unicas, no reutilizables y vinculadas a la identidad del firmante.
- Los controles de acceso impiden que usuarios sin privilegios accedan a funciones restringidas.
- Las validaciones de datos rechazan entradas fuera de rango o en formato incorrecto.
- Los reportes regulatorios generan datos consistentes con los registros fuente.

#### PQ -- Calificacion de Desempeno

- El sistema opera satisfactoriamente bajo condiciones de uso real durante un periodo minimo de 2 semanas.
- Los usuarios capacitados pueden completar flujos de trabajo criticos sin asistencia tecnica.
- El rendimiento del sistema es aceptable (tiempos de respuesta < 3 segundos para operaciones estandar).
- No se producen perdidas de datos durante la operacion normal ni durante la sincronizacion offline/online.
- La precision del modulo Text-to-JSON (Groq API) alcanza >= 95% de conversion correcta en datos estructurados.

### 9.3 Criterios de Integridad de Datos (Audit Trail)

- **Cero defectos criticos** en la funcionalidad de audit trail.
- Imposibilidad de desactivar, eliminar o modificar registros de audit trail por cualquier usuario, incluyendo administradores.
- Todos los registros de audit trail contienen: timestamp UTC, usuario, accion, entidad afectada, valor anterior, valor nuevo, direccion IP.
- Los registros de audit trail son legibles, accesibles y exportables para auditorias regulatorias.

### 9.4 Condiciones para Liberacion del Sistema

La liberacion del sistema para uso en produccion requiere la aprobacion formal de:

1. El Informe Final de Validacion (VR-001) aprobado por System Owner, QA Manager y Validation Lead.
2. Cero desviaciones criticas abiertas.
3. Todas las CAPAs asociadas a desviaciones mayores completadas o con plan de accion aprobado.
4. Registros de capacitacion (TR-001) completos para todos los usuarios que operaran el sistema.
5. SOPs operativos revisados y aprobados.

---

## 10. GESTION DE CAMBIOS

### 10.1 Referencia Procedimental

La gestion de cambios al sistema validado se rige por el procedimiento **SOP-003 -- Control de Cambios para Sistemas Computarizados Validados**.

### 10.2 Principio General

**Ningun cambio al sistema validado puede implementarse en produccion sin pasar por el proceso formal de control de cambios.** Esto incluye, pero no se limita a:

- Cambios en el codigo fuente (frontend o backend).
- Cambios en la configuracion de la base de datos (esquema, triggers, RLS policies).
- Actualizaciones de dependencias o librerias de terceros.
- Cambios en la infraestructura (version de Supabase, migracion de region, etc.).
- Cambios en las integraciones externas (actualizacion de API de Groq, endpoints, modelos).
- Cambios en los roles y permisos de usuario.
- Cambios en los SOPs operativos que afecten el uso del sistema.

### 10.3 Clasificacion de Cambios

| Categoria | Descripcion | Aprobacion Requerida | Revalidacion |
|---|---|---|---|
| **Critico** | Cambio que afecta funcionalidad critica GMP, integridad de datos o audit trail | System Owner + QA Manager + Validation Lead | Revalidacion parcial o completa segun evaluacion de impacto |
| **Mayor** | Cambio que afecta funcionalidad no critica pero significativa, o nuevas funcionalidades | QA Manager + Validation Lead | Testing de regresion + actualizacion de documentacion |
| **Menor** | Correcciones de errores cosmeticos, mejoras de rendimiento sin impacto funcional | Validation Lead | Testing focalizado, documentacion de cambio |
| **Emergencia** | Correccion de defecto critico en produccion que requiere accion inmediata | QA Manager (retroactivo: System Owner) | Validacion post-implementacion obligatoria dentro de 5 dias habiles |

### 10.4 Flujo del Proceso de Cambio

```
Solicitud de Cambio (Change Request)
        |
        v
Evaluacion de Impacto
  - Impacto en funciones validadas
  - Impacto en integridad de datos
  - Impacto regulatorio
  - Necesidad de revalidacion
        |
        v
Clasificacion del Cambio
        |
        v
Aprobacion segun categoria
        |
        v
Implementacion en ambiente de desarrollo/testing
        |
        v
Testing de verificacion y regresion
        |
        v
Revision de resultados por QA
        |
        v
Implementacion en produccion
        |
        v
Verificacion post-implementacion
        |
        v
Cierre del Change Request
        |
        v
Actualizacion de documentacion de validacion
```

---

## 11. MANEJO DE DESVIACIONES

### 11.1 Definicion

Una desviacion es cualquier resultado de prueba, hallazgo o evento que no cumple con los criterios de aceptacion establecidos en los protocolos de validacion o en este plan.

### 11.2 Clasificacion de Desviaciones

| Clasificacion | Definicion | Impacto | Accion Requerida |
|---|---|---|---|
| **Critica** | Fallo en una funcion critica GMP, perdida de integridad de datos, brecha de seguridad con impacto en datos regulatorios | La validacion **no puede continuar** hasta que se resuelva. El sistema **no puede ser liberado** con desviaciones criticas abiertas. | CAPA obligatorio. Resolucion antes de avanzar. Aprobacion de System Owner y QA Manager para cierre. |
| **Mayor** | Fallo en una funcion de alta prioridad, resultados inconsistentes en pruebas funcionales, workaround necesario para completar flujo de trabajo | La validacion puede continuar con restricciones. El sistema puede ser liberado **solo si** existe CAPA aprobado con plan de remediacion y fecha. | CAPA obligatorio. Evaluacion de riesgo residual. Aprobacion de QA Manager para cierre. |
| **Menor** | Discrepancia estetica, diferencia menor respecto a la especificacion sin impacto funcional, error tipografico en interfaz | La validacion continua sin restriccion. | Documentacion del hallazgo. Correccion en siguiente release planificado. Aprobacion de Validation Lead para cierre. |

### 11.3 Proceso CAPA (Accion Correctiva y Preventiva)

Para desviaciones Criticas y Mayores, se debe ejecutar el siguiente proceso:

1. **Descripcion del Problema**: Documentacion detallada del hallazgo, incluyendo evidencia objetiva.
2. **Contencion Inmediata**: Acciones para limitar el impacto del problema (si aplica).
3. **Analisis de Causa Raiz**: Utilizando herramientas como los 5 Porques, Diagrama de Ishikawa, o analisis de arbol de fallas.
4. **Accion Correctiva**: Eliminacion de la causa raiz identificada.
5. **Accion Preventiva**: Medidas para prevenir la recurrencia en este y otros sistemas.
6. **Verificacion de Efectividad**: Confirmacion de que las acciones tomadas resolvieron el problema.
7. **Cierre Formal**: Aprobacion documentada por el nivel de autoridad correspondiente.

### 11.4 Registro de Desviaciones

Todas las desviaciones se registran en un log centralizado que incluye:

- Numero secuencial de desviacion (DEV-001, DEV-002, ...).
- Fecha de deteccion.
- Protocolo y caso de prueba donde se detecto.
- Clasificacion (Critica / Mayor / Menor).
- Descripcion del hallazgo.
- Evaluacion de impacto.
- Accion tomada / CAPA asociado.
- Fecha de cierre.
- Responsable del cierre.

---

## 12. GESTION DE PROVEEDORES

### 12.1 Objetivo

Evaluar y documentar la idoneidad de los proveedores de servicios cloud que forman parte de la infraestructura del sistema CannTrace, conforme a los requisitos de GAMP5 para la gestion de proveedores de sistemas computarizados.

### 12.2 Proveedores a Evaluar

| Proveedor | Servicio | Componente del Sistema | Criticidad | Documento |
|---|---|---|---|---|
| **Supabase Inc.** | Base de datos PostgreSQL, Autenticacion, Edge Functions, Storage | Backend completo | **Critica** | SA-001-A |
| **Groq Inc.** | API de inferencia LLM (Text-to-JSON) | Modulo de carga por lenguaje natural | **Alta** | SA-001-B |
| **Cloudflare Inc.** | Hosting de PWA (Cloudflare Pages), CDN, proteccion DDoS | Frontend hosting | **Media** | SA-001-C |

### 12.3 Criterios de Evaluacion de Proveedores

Cada proveedor sera evaluado en las siguientes dimensiones:

| Criterio | Descripcion | Peso |
|---|---|---|
| **Certificaciones de Seguridad** | SOC 2 Type II, ISO 27001, CSA STAR, HIPAA compliance | 25% |
| **SLA de Disponibilidad** | Uptime garantizado (objetivo >= 99.9%), tiempos de respuesta ante incidentes | 20% |
| **Politica de Datos** | Ubicacion de datos, cifrado en reposo y en transito, politica de retencion, acceso del proveedor a datos del cliente | 20% |
| **Backup y Recuperacion** | Frecuencia de backups, RPO/RTO, procedimientos de disaster recovery | 15% |
| **Historial y Estabilidad** | Tiempo en el mercado, base de clientes, historial de incidentes, viabilidad financiera | 10% |
| **Soporte y Comunicacion** | Canales de soporte, tiempos de respuesta, transparencia en incidentes | 10% |

### 12.4 Evaluacion Preliminar

#### 12.4.1 Supabase Inc.

- **Hosting**: AWS (region configurable).
- **Certificaciones**: SOC 2 Type II (en proceso/obtenido para Supabase Pro/Enterprise).
- **Cifrado**: En reposo (AES-256) y en transito (TLS 1.2+).
- **Backups**: Automaticos diarios, PITR (Point-in-Time Recovery) disponible en planes Pro+.
- **RLS**: Row Level Security nativa en PostgreSQL, permite control de acceso granular.
- **Riesgo identificado**: Dependencia de un proveedor unico para multiples servicios criticos. **Mitigacion**: Exportabilidad de datos PostgreSQL estandar; no hay vendor lock-in en la capa de base de datos.

#### 12.4.2 Groq Inc.

- **Servicio**: Inferencia de modelos LLM (LLaMA 3, Mixtral) con baja latencia.
- **Politica de datos**: Segun terminos de servicio, los datos enviados a la API no se utilizan para entrenamiento.
- **Riesgo identificado**: Datos potencialmente sensibles (lotes, resultados) enviados a API externa. **Mitigacion**: (1) Anonimizacion de datos antes del envio, (2) validacion humana obligatoria de toda conversion Text-to-JSON antes de almacenamiento, (3) evaluacion de modelo local como alternativa futura.

#### 12.4.3 Cloudflare Inc.

- **Certificaciones**: SOC 2 Type II, ISO 27001, PCI DSS Level 1.
- **CDN**: Red global con 300+ puntos de presencia.
- **SLA**: 100% uptime SLA (Enterprise), 99.99% (Business).
- **Riesgo identificado**: Bajo. Solo sirve contenido estatico (PWA). La logica y datos criticos residen en Supabase. **Mitigacion**: Degradacion elegante -- la PWA funciona offline con Service Worker.

### 12.5 Acuerdos Requeridos

Para cada proveedor critico se requiere:

- Acuerdo de Nivel de Servicio (SLA) documentado.
- Acuerdo de Procesamiento de Datos (DPA) si aplica.
- Evidencia de certificaciones vigentes.
- Plan de contingencia ante cambio o discontinuidad del proveedor.

---

## 13. CRONOGRAMA

### 13.1 Cronograma General del Proyecto de Validacion

| Fase | Actividades Principales | Duracion Estimada | Hito de Cierre |
|---|---|---|---|
| **Fase 0: Planificacion** | Elaboracion y aprobacion de VP-001 | 1-2 semanas | VP-001 aprobado |
| **Fase 1: Documentacion de Especificacion** | Elaboracion de URS-001, FS-001, DS-001, FMEA-001 | 4-6 semanas | Documentos de especificacion aprobados |
| **Fase 2: Desarrollo y Configuracion** | Desarrollo del sistema conforme a DS-001, configuracion de infraestructura, desarrollo de Edge Functions, integracion de Groq API | 8-12 semanas | Sistema completo en ambiente de testing |
| **Fase 3: IQ -- Calificacion de Instalacion** | Ejecucion de IQ-001, verificacion de instalacion, configuracion, seguridad | 1-2 semanas | IQ-001-R aprobado |
| **Fase 4: OQ -- Calificacion Operacional** | Ejecucion de OQ-001, pruebas funcionales, audit trail, seguridad, integraciones | 3-5 semanas | OQ-001-R aprobado |
| **Fase 5: PQ -- Calificacion de Desempeno** | Ejecucion de PQ-001, pruebas de desempeno con usuarios reales, periodo de uso supervisado | 2-4 semanas | PQ-001-R aprobado |
| **Fase 6: Cierre y Reporte** | Elaboracion de TM-001, VR-001, finalizacion de SOPs, registros de capacitacion | 1-2 semanas | VR-001 aprobado, sistema liberado |

### 13.2 Duracion Total Estimada

| Escenario | Duracion Total |
|---|---|
| Optimista | 20 semanas (~5 meses) |
| Probable | 28 semanas (~7 meses) |
| Pesimista | 33 semanas (~8 meses) |

### 13.3 Diagrama de Fases (Representacion Textual)

```
Semana:  1    4    8    12   16   20   24   28   32
         |    |    |    |    |    |    |    |    |
Fase 0:  [==]
Fase 1:  [========]
Fase 2:       [====================]
Fase 3:                        [==]
Fase 4:                          [========]
Fase 5:                                [======]
Fase 6:                                      [==]
         |    |    |    |    |    |    |    |    |
         P    E    D    D    I    O    P    C
         L    S    E    E    Q    Q    Q    I
         A    P    S    S              E
         N    E    A    A              R
              C    R    R              R
                   R    R              E
                   O    O
                   L    L
                   L    L
                   O    O
```

### 13.4 Dependencias Criticas

| Dependencia | Fases Afectadas | Riesgo | Mitigacion |
|---|---|---|---|
| Aprobacion de URS por Process Owner | Fase 1 --> Fase 2 | Demora en definicion de requerimientos | Reuniones semanales de seguimiento, prototipos tempranos |
| Disponibilidad del equipo de desarrollo | Fase 2 | Recursos compartidos con otros proyectos | Asignacion dedicada durante fase de desarrollo |
| Disponibilidad de ambiente de testing | Fase 3, 4 | Ambiente no listo a tiempo | Aprovisionamiento temprano en Fase 1 |
| Disponibilidad de usuarios para PQ | Fase 5 | Usuarios ocupados con operaciones diarias | Planificacion anticipada con Process Owner |
| Evaluacion de proveedores completada | Fase 3 | Evaluacion no aprobada | Inicio de SA-001 en paralelo con Fase 1 |

---

## 14. REVISION PERIODICA

### 14.1 Revision Anual Obligatoria

El sistema CannTrace, una vez validado, sera sometido a una **revision periodica anual** para confirmar que se mantiene en estado validado. Esta revision sera documentada conforme a **SOP-006 -- Revision Periodica de Sistemas Computarizados Validados**.

### 14.2 Contenido de la Revision Periodica

Cada revision anual debera evaluar, como minimo, los siguientes aspectos:

| Area de Revision | Verificaciones |
|---|---|
| **Estado del Sistema** | El sistema esta operativo y cumple su funcion prevista sin degradacion. |
| **Integridad de Datos** | No se han detectado inconsistencias o corrupciones en los datos GMP. |
| **Audit Trail** | El audit trail funciona correctamente y no ha sido comprometido. |
| **Control de Cambios** | Todos los cambios implementados desde la ultima revision pasaron por control de cambios formal. |
| **Desviaciones e Incidentes** | Revision de todas las desviaciones e incidentes del periodo. Evaluacion de tendencias. |
| **Evaluacion de Proveedores** | Certificaciones de proveedores vigentes. SLAs cumplidos. Revision de incidentes del proveedor. |
| **Backups** | Verificacion de que los backups se ejecutan correctamente. Prueba de restauracion al menos 1 vez al ano. |
| **Seguridad** | Revision de accesos de usuario, cuentas inactivas, intentos de acceso no autorizado. |
| **Capacitacion** | Todos los usuarios actuales tienen capacitacion vigente. |
| **Actualizaciones Regulatorias** | Evaluacion de nuevas disposiciones de ANMAT o cambios normativos que afecten al sistema. |
| **Rendimiento** | Evaluacion de tiempos de respuesta, disponibilidad, y capacidad del sistema. |

### 14.3 Disparadores de Revalidacion

Ademas de la revision anual, se requiere **revalidacion parcial o total** cuando ocurra alguno de los siguientes eventos:

| Evento Disparador | Tipo de Revalidacion | Responsable de Evaluacion |
|---|---|---|
| Cambio critico al sistema (segun SOP-003) | Parcial o total segun evaluacion de impacto | Validation Lead + QA Manager |
| Migracion de infraestructura (cambio de region, proveedor, version mayor de BD) | Parcial (IQ minimo) + regression testing | IT/Dev Lead + Validation Lead |
| Incidente de seguridad que afecte integridad de datos | Segun evaluacion de impacto | QA Manager |
| Cambio en normativa regulatoria aplicable (ANMAT) | Evaluacion de impacto --> revalidacion si corresponde | QA Manager + Validation Lead |
| Hallazgo critico en auditoria regulatoria | Segun hallazgo | System Owner + QA Manager |
| Sistema fuera de uso por mas de 6 meses | Revalidacion completa | System Owner |
| Actualizacion mayor de componentes de terceros (Supabase, Groq) | Evaluacion de impacto --> IQ + regression testing | IT/Dev Lead + Validation Lead |

### 14.4 Documentacion de la Revision

Cada revision periodica generara un **Informe de Revision Periodica** que incluira:

- Periodo cubierto.
- Resumen de hallazgos por area.
- Estado de CAPAs pendientes del periodo anterior.
- Conclusion sobre el estado validado del sistema (Mantiene / Requiere Accion / Requiere Revalidacion).
- Aprobacion del System Owner y QA Manager.

---

## 15. GLOSARIO

| Termino | Definicion |
|---|---|
| **ALCOA+** | Principio de integridad de datos: Atribuible, Legible, Contemporaneo, Original, Exacto (Accurate). El "+" agrega: Completo, Consistente, Duradero (Enduring), Disponible (Available). |
| **ANMAT** | Administracion Nacional de Medicamentos, Alimentos y Tecnologia Medica (Argentina). |
| **Audit Trail** | Registro cronologico e inmutable de todas las acciones realizadas en el sistema que crean, modifican o eliminan datos regulados. |
| **BPM / GMP** | Buenas Practicas de Manufactura / Good Manufacturing Practices. |
| **CAPA** | Accion Correctiva y Accion Preventiva (Corrective and Preventive Action). |
| **COTS** | Commercial Off-The-Shelf -- Software comercial de uso general. |
| **CSA** | Computer Software Assurance -- Enfoque de la FDA basado en pensamiento critico para la garantia de software. |
| **DS** | Especificacion de Diseno (Design Specification). |
| **Edge Function** | Funcion serverless ejecutada en el borde de la red, en este caso provista por Supabase (Deno). |
| **FMEA** | Analisis de Modo y Efecto de Falla (Failure Mode and Effects Analysis). |
| **FS** | Especificacion Funcional (Functional Specification). |
| **GAMP5** | Good Automated Manufacturing Practice, version 5 -- Guia de la ISPE para validacion de sistemas computarizados. |
| **ICH** | International Council for Harmonisation of Technical Requirements for Pharmaceuticals for Human Use. |
| **ICH Q9** | Guia de ICH para gestion de riesgos de calidad (Quality Risk Management). |
| **IQ** | Calificacion de Instalacion (Installation Qualification). |
| **ISPE** | International Society for Pharmaceutical Engineering. |
| **LLM** | Modelo de Lenguaje de Gran Escala (Large Language Model). |
| **MFA** | Autenticacion Multifactor (Multi-Factor Authentication). |
| **OQ** | Calificacion Operacional (Operational Qualification). |
| **PITR** | Recuperacion a un Punto en el Tiempo (Point-in-Time Recovery). |
| **PQ** | Calificacion de Desempeno (Performance Qualification). |
| **PWA** | Aplicacion Web Progresiva (Progressive Web Application). |
| **RACI** | Responsable, Aprueba, Consultado, Informado -- Matriz de asignacion de responsabilidades. |
| **RBAC** | Control de Acceso Basado en Roles (Role-Based Access Control). |
| **RLS** | Row Level Security -- Politica de seguridad a nivel de fila en PostgreSQL. |
| **RPO** | Objetivo de Punto de Recuperacion (Recovery Point Objective) -- Cantidad maxima de datos que se pueden perder. |
| **RPN** | Numero de Prioridad de Riesgo (Risk Priority Number) = S x O x D. |
| **RTO** | Objetivo de Tiempo de Recuperacion (Recovery Time Objective) -- Tiempo maximo para restaurar el servicio. |
| **Seed-to-Sale** | Trazabilidad completa desde la semilla hasta la venta del producto final. |
| **SLA** | Acuerdo de Nivel de Servicio (Service Level Agreement). |
| **SOP** | Procedimiento Operativo Estandar (Standard Operating Procedure). |
| **TM** | Matriz de Trazabilidad (Traceability Matrix). |
| **URS** | Especificacion de Requerimientos de Usuario (User Requirement Specification). |
| **VP** | Plan de Validacion (Validation Plan). |
| **VR** | Informe de Validacion (Validation Report). |

---

## 16. APROBACIONES

### 16.1 Aprobacion del Documento

La aprobacion de este Plan Maestro de Validacion autoriza el inicio de las actividades de validacion del sistema CannTrace conforme a la estrategia, el alcance y el cronograma aqui definidos.

| Rol | Nombre | Firma | Fecha |
|---|---|---|---|
| **System Owner** (Propietario del Sistema) | _________________________ | _________________________ | ____/____/________ |
| **Process Owner** (Propietario del Proceso) | _________________________ | _________________________ | ____/____/________ |
| **QA Manager** (Responsable de Calidad) | _________________________ | _________________________ | ____/____/________ |
| **IT/Dev Lead** (Lider de Desarrollo) | _________________________ | _________________________ | ____/____/________ |
| **Validation Lead** (Lider de Validacion) | _________________________ | _________________________ | ____/____/________ |

### 16.2 Declaracion de Aprobacion

*Al firmar este documento, los abajo firmantes confirman que:*

1. *Han revisado el contenido completo de este Plan Maestro de Validacion (VP-001).*
2. *Estan de acuerdo con la estrategia, el alcance, las responsabilidades y el cronograma establecidos.*
3. *Se comprometen a proveer los recursos necesarios para la ejecucion exitosa de la validacion dentro de sus areas de responsabilidad.*
4. *Autorizan el inicio de las actividades de validacion conforme a este plan.*

---

**FIN DEL DOCUMENTO VP-001**

*Este documento es propiedad confidencial. Su reproduccion total o parcial sin autorizacion esta prohibida.*

*Documento controlado -- Verificar estado de vigencia antes de usar.*
