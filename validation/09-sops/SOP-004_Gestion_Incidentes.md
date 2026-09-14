# PROCEDIMIENTO OPERATIVO ESTANDAR

---

| Campo | Detalle |
|---|---|
| **Documento ID** | SOP-004 |
| **Titulo** | Gestion de Incidentes del Sistema CannTrace |
| **Version** | 0.1 |
| **Fecha de Emision** | 2026-04-16 |
| **Clasificacion** | GAMP5 - Categoria 5 (Software Personalizado) |
| **Norma de Referencia** | ANMAT Disposicion 4159/2023 |
| **Estado** | Borrador |

---

## 1. PROPOSITO

Establecer un procedimiento sistematico para la deteccion, registro, clasificacion, investigacion, resolucion y cierre de incidentes del sistema CannTrace, incluyendo la gestion de acciones correctivas y preventivas (CAPA) cuando corresponda, asegurando la continuidad operativa, la integridad de los datos de trazabilidad y el cumplimiento de los requisitos de ANMAT Disposicion 4159/2023 y las directrices GAMP5.

## 2. ALCANCE

Este procedimiento aplica a todos los incidentes relacionados con:

- **Funcionamiento del sistema**: errores de software, caidas del servicio, problemas de rendimiento, fallas de integracion.
- **Integridad de datos**: discrepancias en registros, datos faltantes, inconsistencias en el audit trail, corrupcion de datos.
- **Seguridad**: accesos no autorizados, vulnerabilidades detectadas, brechas de seguridad, intentos de manipulacion de datos.
- **Infraestructura**: problemas con Supabase, conectividad, almacenamiento, certificados SSL.
- **Usabilidad**: errores en la interfaz conversacional, interpretaciones incorrectas del chat, problemas de generacion de QR o reportes.

**Exclusiones**: Las consultas operativas de rutina (ej: "como genero un reporte") se gestionan a traves del soporte de primer nivel y no requieren este procedimiento.

## 3. DEFINICIONES

| Termino | Definicion |
|---|---|
| **Incidente** | Evento no planificado que causa o puede causar una interrupcion, degradacion del servicio o afectacion de la integridad de datos del sistema CannTrace. |
| **Problema** | Causa raiz subyacente de uno o mas incidentes. Un problema se investiga cuando un incidente es recurrente o cuando la causa raiz no es inmediatamente evidente. |
| **CAPA (Accion Correctiva y Preventiva)** | Accion correctiva: elimina la causa raiz de un incidente ocurrido. Accion preventiva: elimina la causa potencial de un incidente que aun no ha ocurrido pero cuyo riesgo ha sido identificado. |
| **Workaround (Solucion Temporal)** | Solucion provisional que restaura el servicio o mitiga el impacto del incidente mientras se trabaja en la solucion definitiva. |
| **Escalamiento** | Transferencia de la gestion del incidente a un nivel superior de autoridad o expertise tecnico cuando el nivel actual no puede resolverlo dentro del tiempo establecido. |
| **Tiempo de Respuesta** | Tiempo maximo permitido desde la deteccion/reporte del incidente hasta el inicio de las acciones de contencion. |
| **Tiempo de Resolucion** | Tiempo maximo permitido desde la deteccion/reporte del incidente hasta la implementacion de la solucion (temporal o definitiva). |

## 4. CLASIFICACION DE INCIDENTES

### 4.1 Niveles de Severidad

| Nivel | Clasificacion | Descripcion | Tiempo de Respuesta | Tiempo de Resolucion |
|---|---|---|---|---|
| **1** | **CRITICO** | Sistema completamente inoperativo. Perdida de datos confirmada o en curso. Brecha de seguridad activa. Incumplimiento regulatorio inmediato. Imposibilidad de registrar operaciones de trazabilidad. | **30 minutos** | **4 horas** |
| **2** | **MAYOR** | Funcionalidad critica degradada pero sistema parcialmente operativo. Riesgo de perdida de datos. Errores en el audit trail. Multiples usuarios afectados. Generacion de reportes regulatorios fallida. | **2 horas** | **24 horas** |
| **3** | **MENOR** | Funcionalidad no critica afectada. Un solo usuario o funcionalidad secundaria afectada. Problema estetico o de rendimiento. Workaround disponible e identificado. | **8 horas** | **5 dias habiles** |

### 4.2 Criterios de Clasificacion

| Criterio | CRITICO | MAYOR | MENOR |
|---|---|---|---|
| Usuarios afectados | Todos | Multiples | Uno o pocos |
| Operaciones bloqueadas | Si, operaciones de trazabilidad | Parcialmente | No, o secundarias |
| Riesgo de perdida de datos | Confirmado o inminente | Posible | Improbable |
| Impacto en audit trail | Datos de auditoria afectados | Posible afectacion | Sin afectacion |
| Workaround disponible | No | Parcial | Si |
| Impacto regulatorio | Directo e inmediato | Potencial | Sin impacto |

## 5. RESPONSABILIDADES

| Rol | Responsabilidades |
|---|---|
| **Cualquier Usuario** | Detectar y reportar incidentes al Administrador del Sistema o Supervisor inmediatamente. |
| **Administrador del Sistema** | Recibir reportes de incidentes, registrar formalmente, clasificar, ejecutar acciones de contencion, investigar y resolver incidentes de nivel 3 (menores). Escalar incidentes de nivel 1 y 2. |
| **Responsable de IT** | Gestionar incidentes de nivel 2 (mayores). Coordinar con proveedores externos (Supabase) cuando sea necesario. Supervisar la resolucion de todos los incidentes. |
| **Responsable de Calidad** | Evaluar el impacto regulatorio de los incidentes, determinar si se requiere CAPA, verificar la eficacia de las acciones correctivas, auditar el proceso de gestion de incidentes. |
| **Director Tecnico** | Gestionar incidentes de nivel 1 (criticos) en coordinacion con el Responsable de IT. Autorizar acciones de emergencia. Notificar a ANMAT si el incidente lo requiere. |
| **Comite de Calidad** | Revisar incidentes criticos y recurrentes. Aprobar CAPAs. Revisar tendencias trimestrales. |

## 6. PROCEDIMIENTO

### 6.1 Deteccion del Incidente

Los incidentes pueden ser detectados mediante:

1. **Reporte de usuario**: Un usuario identifica un comportamiento anomalo y lo reporta.
2. **Monitoreo automatizado**: Alertas del sistema de monitoreo (caidas, errores de aplicacion, alertas de Supabase).
3. **Auditoria periodica**: Revision del audit trail o de los logs del sistema detecta una anomalia.
4. **Pruebas de verificacion**: Durante pruebas planificadas (backup, cambios) se detecta un problema.

### 6.2 Registro del Incidente

1. El Administrador del Sistema (o quien detecte el incidente) registra formalmente el incidente en el **Formulario de Registro de Incidente (FOR-INC-001)** con los siguientes datos:

   | Campo | Descripcion |
   |---|---|
   | Numero de incidente | Generado automaticamente: INC-AAAA-NNN |
   | Fecha y hora de deteccion | Fecha y hora en que se detecto o reporto el incidente |
   | Reportado por | Nombre y rol de quien reporta |
   | Clasificacion inicial | Critico / Mayor / Menor |
   | Descripcion del incidente | Descripcion detallada del problema observado |
   | Componente afectado | Software / Base de datos / Infraestructura / Seguridad |
   | Funcionalidad afectada | Descripcion especifica de la funcionalidad impactada |
   | Impacto observado | Usuarios afectados, operaciones bloqueadas, datos en riesgo |
   | Reproducibilidad | Siempre / Intermitente / Unica vez |
   | Capturas de pantalla/logs | Evidencia adjunta del incidente |

2. El registro debe realizarse dentro de los **30 minutos** siguientes a la deteccion para incidentes criticos y dentro de las **4 horas** para incidentes mayores y menores.

### 6.3 Evaluacion y Clasificacion

1. El Administrador del Sistema (o el Responsable de IT para incidentes escalados) evalua el incidente y confirma o ajusta la clasificacion inicial.
2. Se evalua:
   - Alcance real del impacto.
   - Riesgo para la integridad de datos.
   - Existencia de workaround.
   - Necesidad de escalamiento.
3. Se actualiza el formulario FOR-INC-001 con la clasificacion confirmada.

### 6.4 Contencion (Acciones Inmediatas)

El objetivo de la contencion es minimizar el impacto del incidente mientras se trabaja en la solucion definitiva.

**Para incidentes criticos:**

1. Notificar inmediatamente al Responsable de IT y al Director Tecnico.
2. Evaluar si es necesario poner el sistema en modo de solo lectura o fuera de linea para proteger la integridad de los datos.
3. Activar los registros manuales en papel como respaldo temporal (formularios de emergencia pre-impresos FOR-INC-EMR).
4. Si hay riesgo de perdida de datos, ejecutar un backup inmediato (segun SOP-002).
5. Implementar el workaround disponible (si existe).
6. Comunicar a todos los usuarios afectados el estado del incidente y las instrucciones temporales.

**Para incidentes mayores:**

1. Notificar al Responsable de IT.
2. Implementar el workaround disponible.
3. Comunicar a los usuarios afectados.

**Para incidentes menores:**

1. Implementar el workaround si esta disponible.
2. Informar al usuario reportante.

### 6.5 Investigacion de Causa Raiz

1. Una vez contenido el incidente, iniciar la investigacion de causa raiz.
2. Recopilar evidencia:
   - Logs del sistema y de la aplicacion.
   - Registros del audit trail.
   - Logs de Supabase (base de datos, autenticacion, funciones Edge).
   - Testimonios de los usuarios afectados.
   - Capturas de pantalla y grabaciones.
3. Aplicar metodologia de analisis de causa raiz:
   - **5 Por Que**: Para incidentes simples con causa aparentemente unica.
   - **Diagrama de Ishikawa (Espina de Pescado)**: Para incidentes complejos con multiples factores.
4. Documentar la causa raiz identificada en el formulario FOR-INC-001.
5. Si la causa raiz no puede determinarse de manera concluyente, documentar las causas mas probables y las acciones tomadas para confirmarlas.

### 6.6 Accion Correctiva

1. Definir la solucion definitiva basada en la causa raiz identificada.
2. Si la solucion requiere un cambio en el sistema, iniciar el proceso de Control de Cambios (SOP-003).
   - Para incidentes criticos, puede utilizarse el procedimiento de cambio de emergencia.
3. Implementar la solucion:
   - En ambiente de test primero (salvo cambios de emergencia).
   - Verificar que la solucion resuelve el incidente.
   - Verificar que no introduce nuevos problemas (pruebas de regresion).
4. Implementar en produccion.
5. Documentar la solucion implementada en el formulario FOR-INC-001.

### 6.7 Verificacion de la Solucion

1. Verificar que el incidente esta efectivamente resuelto:
   - La funcionalidad afectada opera correctamente.
   - No se detectan efectos secundarios.
   - Los datos afectados (si los hubo) fueron restaurados o corregidos.
   - El audit trail es integro y continuo.
2. Obtener confirmacion del usuario o area afectada de que el problema esta resuelto.
3. Monitorear el sistema durante un periodo de observacion:
   - Incidentes criticos: 7 dias.
   - Incidentes mayores: 5 dias.
   - Incidentes menores: 3 dias.
4. Si el incidente recurre durante el periodo de observacion, reabrir el caso y reiniciar desde la seccion 6.5.

### 6.8 Determinacion de CAPA

El Responsable de Calidad evalua si el incidente requiere la apertura de un CAPA basandose en los siguientes criterios:

| Criterio | Requiere CAPA |
|---|---|
| Incidente critico (cualquiera) | SI, obligatorio |
| Incidente mayor recurrente (2 o mas ocurrencias) | SI, obligatorio |
| Incidente con perdida de datos confirmada | SI, obligatorio |
| Incidente con impacto regulatorio | SI, obligatorio |
| Incidente mayor no recurrente | Evaluacion caso a caso |
| Incidente menor recurrente (3 o mas ocurrencias) | SI |
| Incidente menor aislado | NO (salvo decision del Responsable de Calidad) |

#### Procedimiento CAPA:

1. Abrir el **Formulario de CAPA (FOR-CAPA-001)** referenciando el/los incidentes asociados.
2. Documentar:
   - Descripcion del problema y causa raiz.
   - **Accion correctiva**: Accion para eliminar la causa raiz del incidente ocurrido.
   - **Accion preventiva**: Accion para evitar la recurrencia o prevenir incidentes similares.
   - Responsable de cada accion.
   - Fecha limite de implementacion.
   - Criterios de eficacia.
3. El Comite de Calidad aprueba el plan CAPA.
4. Implementar las acciones segun el cronograma aprobado.
5. Verificar la eficacia de las acciones:
   - Verificacion a los 30 dias de implementacion.
   - Verificacion a los 90 dias de implementacion.
   - Confirmar que el incidente no ha recurrido.
6. Cerrar el CAPA con la evidencia de eficacia documentada.

### 6.9 Cierre del Incidente

1. Completar todos los campos del formulario FOR-INC-001:
   - Causa raiz confirmada.
   - Acciones de contencion realizadas.
   - Solucion definitiva implementada.
   - Referencia a cambio implementado (si aplica, RFC-AAAA-NNN).
   - Referencia a CAPA (si aplica, CAPA-AAAA-NNN).
   - Periodo de observacion cumplido sin recurrencia.
2. El Responsable de IT (o el Director Tecnico para incidentes criticos) revisa y aprueba el cierre.
3. Cambiar el estado del incidente a **CERRADO**.
4. Archivar toda la documentacion asociada.

## 7. MATRIZ DE ESCALAMIENTO

| Nivel | Tiempo Transcurrido | Accion de Escalamiento |
|---|---|---|
| **Nivel 1** | 0 - 30 min | Administrador del Sistema inicia contencion |
| **Nivel 2** | 30 min - 2 horas | Escalamiento al Responsable de IT |
| **Nivel 3** | 2 - 4 horas | Escalamiento al Director Tecnico |
| **Nivel 4** | > 4 horas (criticos) / > 24 horas (mayores) | Director Tecnico evalua notificacion a ANMAT y activacion del plan de continuidad de negocio |

### 7.1 Escalamiento por Tipo de Incidente

| Tipo de Incidente | Primer Contacto | Escalamiento Nivel 2 | Escalamiento Nivel 3 |
|---|---|---|---|
| Error de software | Administrador del Sistema | Responsable de IT | Proveedor externo / Director Tecnico |
| Caida del sistema | Administrador del Sistema | Responsable de IT + Soporte Supabase | Director Tecnico |
| Perdida de datos | Administrador del Sistema | Responsable de IT + Calidad | Director Tecnico |
| Brecha de seguridad | Administrador del Sistema | Responsable de IT | Director Tecnico + Asesor Legal |
| Error de audit trail | Administrador del Sistema | Responsable de Calidad | Director Tecnico |

### 7.2 Contactos de Escalamiento

| Rol | Metodo de Contacto Primario | Metodo Alternativo | Disponibilidad |
|---|---|---|---|
| Administrador del Sistema | [A completar] | [A completar] | Horario laboral + guardia |
| Responsable de IT | [A completar] | [A completar] | Horario laboral + guardia |
| Responsable de Calidad | [A completar] | [A completar] | Horario laboral |
| Director Tecnico | [A completar] | [A completar] | 24/7 para criticos |
| Soporte Supabase | Portal de soporte online | Email de soporte | Segun SLA contratado |

## 8. INDICADORES Y REVISION

### 8.1 Indicadores Clave

El Responsable de IT preparara un informe trimestral de incidentes que incluya:

| Indicador | Objetivo |
|---|---|
| Numero total de incidentes por clasificacion | Tendencia descendente |
| Porcentaje de incidentes resueltos dentro del tiempo objetivo | >= 95% |
| Tiempo promedio de resolucion por clasificacion | Dentro de los tiempos definidos en seccion 4.1 |
| Numero de incidentes recurrentes | Tendencia a cero |
| Numero de CAPAs abiertos | Seguimiento de eficacia |
| Porcentaje de CAPAs cerrados en plazo | >= 90% |

### 8.2 Revision Trimestral

El Comite de Calidad revisara trimestralmente:

1. El informe de indicadores de incidentes.
2. Los incidentes criticos y mayores ocurridos en el periodo.
3. El estado de los CAPAs abiertos.
4. Tendencias y patrones de incidentes.
5. Eficacia de las acciones preventivas implementadas.

## 9. REGISTROS GENERADOS

| Registro | Codigo | Responsable | Retencion |
|---|---|---|---|
| Formulario de Registro de Incidente | FOR-INC-001 | Administrador del Sistema | 10 anos |
| Formulario de Emergencia (registro manual) | FOR-INC-EMR | Usuario que detecta | 10 anos |
| Formulario de CAPA | FOR-CAPA-001 | Responsable de Calidad | 10 anos |
| Informe Trimestral de Incidentes | INF-INC-TRIM | Responsable de IT | 10 anos |
| Acta de Revision Trimestral | ACT-CAL-TRIM | Comite de Calidad | 10 anos |

## 10. DOCUMENTOS RELACIONADOS

| Documento | Referencia |
|---|---|
| SOP de Uso del Sistema | SOP-001 |
| SOP de Backup y Recuperacion | SOP-002 |
| SOP de Control de Cambios | SOP-003 |
| Plan de Validacion del Sistema | VP-CANNTRACE-001 |
| Plan de Continuidad de Negocio | PCN-CANNTRACE-001 |

## 11. HISTORIAL DE REVISIONES

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
