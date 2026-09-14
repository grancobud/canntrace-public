# PROCEDIMIENTO OPERATIVO ESTANDAR

---

| Campo | Detalle |
|---|---|
| **Documento ID** | SOP-003 |
| **Titulo** | Control de Cambios del Sistema CannTrace |
| **Version** | 0.1 |
| **Fecha de Emision** | 2026-04-16 |
| **Clasificacion** | GAMP5 - Categoria 5 (Software Personalizado) |
| **Norma de Referencia** | ANMAT Disposicion 4159/2023 |
| **Estado** | Borrador |

---

## 1. PROPOSITO

Establecer un procedimiento sistematico y documentado para la gestion de cambios en el sistema CannTrace, asegurando que toda modificacion sea evaluada, aprobada, implementada y verificada de manera controlada, minimizando el riesgo de introducir errores o afectar la integridad de los datos de trazabilidad, en cumplimiento con las directrices GAMP5 y los requisitos de ANMAT Disposicion 4159/2023.

## 2. ALCANCE

Este procedimiento aplica a todos los cambios realizados en:

- **Software**: Codigo fuente, interfaz de usuario, logica de negocio, funciones Edge, integraciones.
- **Base de datos**: Estructura de tablas, relaciones, indices, funciones almacenadas, politicas RLS, migraciones.
- **Infraestructura**: Configuracion de Supabase, parametros de seguridad, politicas de autenticacion, dominios.
- **Configuracion operativa**: Roles de usuario, permisos, parametros del sistema, umbrales de alerta, plantillas de reportes.
- **Documentacion**: SOPs, manuales, especificaciones, protocolos de validacion.

**Exclusiones**: Los cambios de contenido operativo (registro de operaciones normales, actualizacion de inventario) NO son considerados cambios al sistema y no requieren este procedimiento.

## 3. DEFINICIONES

| Termino | Definicion |
|---|---|
| **Cambio Mayor** | Modificacion que afecta la funcionalidad critica del sistema, la estructura de la base de datos, la seguridad, el audit trail o el cumplimiento regulatorio. Requiere evaluacion de impacto completa, pruebas de regresion y aprobacion del Comite de Cambios. Ejemplos: nueva funcionalidad, cambio en la logica de trazabilidad, modificacion del esquema de base de datos, cambio en politicas de seguridad. |
| **Cambio Menor** | Modificacion que no afecta funcionalidad critica ni datos regulatorios. Impacto limitado y riesgo bajo. Requiere evaluacion simplificada y aprobacion del Responsable de IT. Ejemplos: correccion de errores de interfaz visual, mejora de rendimiento sin cambio funcional, actualizacion de textos de ayuda, ajuste de estilos CSS. |
| **Cambio de Emergencia** | Modificacion urgente requerida para resolver un incidente critico que afecta la operacion del sistema o la integridad de los datos. Puede implementarse con aprobacion verbal del Director Tecnico, pero debe documentarse retroactivamente dentro de las 48 horas siguientes. |
| **Solicitud de Cambio (RFC)** | Formulario formal que inicia el proceso de control de cambios. Documento identificado como FOR-CC-001. |
| **Evaluacion de Impacto** | Analisis documentado del efecto que un cambio propuesto puede tener sobre el sistema, los datos, la validacion, la seguridad y el cumplimiento regulatorio. |
| **Comite de Cambios** | Grupo responsable de evaluar y aprobar/rechazar las solicitudes de cambios mayores. Compuesto por: Responsable de IT, Responsable de Calidad y Director Tecnico. |
| **Pruebas de Regresion** | Conjunto de pruebas ejecutadas para verificar que un cambio no ha introducido defectos en funcionalidades previamente validadas. |
| **Ambiente de Test/Staging** | Replica del ambiente de produccion utilizada para probar los cambios antes de su implementacion definitiva. |

## 4. RESPONSABILIDADES

| Rol | Responsabilidades |
|---|---|
| **Solicitante** | Identificar la necesidad de cambio, completar el formulario RFC (FOR-CC-001), proporcionar informacion de soporte. |
| **Administrador del Sistema** | Evaluar la viabilidad tecnica, estimar el esfuerzo, implementar el cambio en ambiente de test y produccion, ejecutar pruebas tecnicas. |
| **Responsable de IT** | Evaluar el impacto tecnico, aprobar cambios menores, participar en el Comite de Cambios para cambios mayores. |
| **Responsable de Calidad** | Evaluar el impacto regulatorio y en la validacion, participar en el Comite de Cambios, verificar la documentacion post-implementacion. |
| **Director Tecnico** | Aprobar cambios mayores como parte del Comite de Cambios, autorizar cambios de emergencia. |
| **Comite de Cambios** | Evaluar, aprobar o rechazar solicitudes de cambios mayores. Reunion ordinaria mensual o extraordinaria segun necesidad. |

## 5. PROCEDIMIENTO

### 5.1 Inicio: Solicitud de Cambio

1. El Solicitante completa el formulario **Solicitud de Cambio (FOR-CC-001)** que incluye:
   - Numero de solicitud (generado automaticamente: RFC-AAAA-NNN).
   - Fecha de solicitud.
   - Nombre y rol del solicitante.
   - Descripcion detallada del cambio propuesto.
   - Justificacion del cambio (motivo, beneficio esperado, problema que resuelve).
   - Urgencia propuesta (Normal / Urgente / Emergencia).
   - Componentes del sistema afectados.
   - Referencia a incidencia relacionada (si aplica, ver SOP-004).
2. El formulario se envio al Responsable de IT para su clasificacion inicial.

### 5.2 Clasificacion del Cambio

El Responsable de IT clasifica el cambio dentro de las 48 horas habiles siguientes a la recepcion:

| Criterio | Cambio Mayor | Cambio Menor |
|---|---|---|
| Afecta funcionalidad critica | Si | No |
| Modifica estructura de base de datos | Si | No |
| Impacta audit trail o trazabilidad | Si | No |
| Afecta seguridad o autenticacion | Si | No |
| Requiere actualizacion de documentacion de validacion | Si | No |
| Impacta cumplimiento regulatorio | Si | No |
| Riesgo estimado | Medio / Alto | Bajo |

Si al menos un criterio resulta "Si" para Cambio Mayor, el cambio se clasifica como **Mayor**.

### 5.3 Evaluacion de Impacto

#### 5.3.1 Cambios Mayores

El Administrador del Sistema, en conjunto con el Responsable de IT y el Responsable de Calidad, elaboran el **Informe de Evaluacion de Impacto (FOR-CC-002)** que incluye:

1. **Impacto Funcional**: Funcionalidades afectadas directa e indirectamente.
2. **Impacto en Datos**: Efecto sobre datos existentes, migraciones necesarias, riesgo de perdida de datos.
3. **Impacto en Validacion**: Documentos de validacion que requieren actualizacion (URS, IQ, OQ, PQ).
4. **Impacto en Seguridad**: Efecto sobre politicas de acceso, autenticacion, autorizacion.
5. **Impacto Regulatorio**: Efecto sobre el cumplimiento de ANMAT Disposicion 4159/2023.
6. **Impacto en Audit Trail**: Efecto sobre la integridad y continuidad del registro de auditoria.
7. **Impacto en Integraciones**: Efecto sobre integraciones con otros sistemas.

#### 5.3.2 Evaluacion de Riesgos

Para cada cambio mayor, se realiza una evaluacion de riesgo simplificada:

| Factor | Bajo (1) | Medio (2) | Alto (3) |
|---|---|---|---|
| **Probabilidad de fallo** | Cambio simple y aislado | Cambio moderado con algunas dependencias | Cambio complejo con multiples dependencias |
| **Impacto de fallo** | Estetico, sin perdida de datos | Funcionalidad degradada, sin perdida de datos | Perdida de datos o incumplimiento regulatorio |
| **Reversibilidad** | Facilmente reversible | Reversible con esfuerzo moderado | Dificil o imposible de revertir |

**Nivel de Riesgo = Probabilidad x Impacto x Reversibilidad**

| Puntuacion | Nivel | Accion |
|---|---|---|
| 1 - 8 | BAJO | Proceder con controles estandar |
| 9 - 18 | MEDIO | Proceder con controles adicionales y plan de rollback detallado |
| 19 - 27 | ALTO | Requiere aprobacion unanime del Comite de Cambios y plan de rollback validado |

#### 5.3.3 Cambios Menores

Para cambios menores, se completa una evaluacion simplificada dentro del formulario FOR-CC-001 (seccion de evaluacion rapida), sin requerir un informe separado.

### 5.4 Aprobacion

#### 5.4.1 Cambios Mayores

1. El Comite de Cambios revisa la solicitud y la evaluacion de impacto.
2. El Comite puede:
   - **Aprobar**: Se autoriza la implementacion bajo las condiciones documentadas.
   - **Aprobar con condiciones**: Se autoriza con requisitos adicionales (ej: pruebas extra, documentacion complementaria).
   - **Rechazar**: Se justifica el rechazo y se notifica al solicitante.
   - **Solicitar mas informacion**: Se devuelve al equipo tecnico para complementar la evaluacion.
3. La decision se registra en el **Acta de Comite de Cambios (FOR-CC-003)**.

#### 5.4.2 Cambios Menores

1. El Responsable de IT revisa y aprueba o rechaza el cambio.
2. La decision se documenta directamente en el formulario FOR-CC-001.

### 5.5 Implementacion en Ambiente de Test

1. El Administrador del Sistema implementa el cambio en el **ambiente de Staging/Test**.
2. Se ejecutan las siguientes pruebas:
   - **Pruebas funcionales**: Verificar que el cambio funciona segun lo especificado.
   - **Pruebas de regresion**: Verificar que las funcionalidades existentes no se vean afectadas.
   - **Pruebas de datos**: Verificar la integridad de los datos y las migraciones (si aplica).
   - **Pruebas de seguridad**: Verificar que los permisos y el control de acceso funcionan correctamente.
3. Los resultados se documentan en el **Informe de Pruebas de Cambio (FOR-CC-004)**.

### 5.6 Pruebas de Regresion

Para cambios mayores, se ejecuta el conjunto completo de pruebas de regresion:

1. **Funcionalidad de login y autenticacion**: Verificar inicio/cierre de sesion, permisos por rol.
2. **Operaciones via chat**: Verificar creacion, confirmacion y registro de al menos 3 tipos de operaciones.
3. **Escaneo QR**: Verificar lectura y asociacion correcta de codigos QR.
4. **Reportes**: Verificar generacion de al menos 2 tipos de reportes.
5. **Audit Trail**: Verificar que todas las acciones quedan registradas correctamente.
6. **Integridad de datos**: Verificar que los datos existentes no se alteraron.

Para cambios menores, se ejecutan unicamente las pruebas directamente relacionadas con el area modificada.

### 5.7 Actualizacion de Documentacion

Segun el resultado de la evaluacion de impacto, actualizar los documentos afectados:

| Tipo de Documento | Cuando Actualizar |
|---|---|
| Especificacion de Requerimientos (URS) | Cuando se modifica o agrega funcionalidad |
| Especificacion Funcional (FS) | Cuando cambia la logica de negocio |
| Protocolo de IQ/OQ/PQ | Cuando el cambio invalida pruebas existentes |
| Manual de Usuario | Cuando cambia la interfaz o los procedimientos de uso |
| SOPs afectados | Cuando el cambio modifica procedimientos operativos |
| Matriz de trazabilidad | Siempre que se actualice cualquier documento de validacion |

### 5.8 Implementacion en Produccion

1. Programar la implementacion en una ventana de mantenimiento acordada (preferentemente fuera del horario laboral).
2. Realizar un **backup completo** del sistema de produccion ANTES de la implementacion (segun SOP-002).
3. Implementar el cambio en produccion.
4. Ejecutar las pruebas de verificacion post-implementacion:
   - Verificar que el cambio funciona correctamente en produccion.
   - Verificar que las funcionalidades existentes no se vieron afectadas.
   - Verificar la integridad del audit trail.
5. Si la verificacion falla:
   - Ejecutar el **plan de rollback** para revertir el cambio.
   - Restaurar el sistema desde el backup previo si es necesario.
   - Registrar una incidencia segun SOP-004.

### 5.9 Verificacion Post-Implementacion

1. Durante las 48 horas siguientes a la implementacion, monitorear el sistema para detectar anomalias.
2. Verificar que no hay incidencias reportadas relacionadas con el cambio.
3. El Responsable de Calidad verifica:
   - Que toda la documentacion fue actualizada.
   - Que los registros de pruebas estan completos.
   - Que el audit trail refleja correctamente el proceso de cambio.
4. Cerrar la solicitud de cambio con el estado final:
   - **Implementado exitosamente**.
   - **Implementado con observaciones** (detallar).
   - **Revertido** (indicar motivo y referencia a incidencia).

## 6. CAMBIOS DE EMERGENCIA

### 6.1 Criterios para Cambio de Emergencia

Un cambio se clasifica como de emergencia cuando:

- Un incidente critico afecta la operacion del sistema y requiere correccion inmediata.
- Existe riesgo inminente de perdida de datos o incumplimiento regulatorio.
- Una vulnerabilidad de seguridad critica requiere remediacion urgente.

### 6.2 Procedimiento para Cambios de Emergencia

1. El Administrador del Sistema o el Responsable de IT identifica la necesidad de un cambio de emergencia.
2. Se obtiene **aprobacion verbal** del Director Tecnico (o del Responsable de Calidad si el Director Tecnico no esta disponible).
3. Se documenta la aprobacion verbal registrando: quien aprobo, fecha/hora, medio de comunicacion.
4. Se implementa el cambio directamente en produccion (se puede omitir el paso por ambiente de test si la urgencia lo justifica).
5. Se realizan pruebas de verificacion inmediatas post-implementacion.
6. **Dentro de las 48 horas habiles siguientes**, se debe:
   - Completar retroactivamente el formulario de Solicitud de Cambio (FOR-CC-001) marcando "Cambio de Emergencia".
   - Completar la evaluacion de impacto (FOR-CC-002).
   - Documentar las pruebas realizadas.
   - Evaluar si se requieren pruebas de regresion adicionales.
   - Actualizar toda la documentacion afectada.
   - El Comite de Cambios ratifica o revisa el cambio en su proxima reunion.

## 7. REGISTROS GENERADOS

| Registro | Codigo | Responsable | Retencion |
|---|---|---|---|
| Solicitud de Cambio | FOR-CC-001 | Solicitante | 10 anos |
| Informe de Evaluacion de Impacto | FOR-CC-002 | Administrador del Sistema | 10 anos |
| Acta de Comite de Cambios | FOR-CC-003 | Responsable de IT | 10 anos |
| Informe de Pruebas de Cambio | FOR-CC-004 | Administrador del Sistema | 10 anos |
| Registro de Cambios Implementados | REG-CC-001 | Administrador del Sistema | 10 anos |

## 8. DOCUMENTOS RELACIONADOS

| Documento | Referencia |
|---|---|
| SOP de Uso del Sistema | SOP-001 |
| SOP de Backup y Recuperacion | SOP-002 |
| SOP de Gestion de Incidentes | SOP-004 |
| Plan de Validacion del Sistema | VP-CANNTRACE-001 |
| Especificacion de Requerimientos de Usuario | URS-CANNTRACE-001 |

## 9. HISTORIAL DE REVISIONES

| Version | Fecha | Descripcion del Cambio | Autor |
|---|---|---|---|
| 0.1 | 2026-04-16 | Emision inicial - Borrador para revision | Equipo de Validacion |

---

## TABLA DE APROBACION

| Funcion | Nombre | Firma | Fecha |
|---|---|---|---|
| **Elaborado por** | _________________________ | _____________ | ____/____/____ |
| **Revisado por (IT/Sistemas)** | _________________________ | _____________ | ____/____/____ |
| **Revisado por (Calidad)** | _________________________ | _____________ | ____/____/____ |
| **Aprobado por (Director Tecnico)** | _________________________ | _____________ | ____/____/____ |

---

*Documento controlado. Prohibida su reproduccion parcial o total sin autorizacion del Responsable de Calidad. Las copias impresas se consideran no controladas.*
