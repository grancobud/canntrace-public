# FOR-REV-001: Planilla de Revision Periodica del Sistema

## Revision Anual GAMP5 -- Sistema CannTrace

---

| Campo | Valor |
|-------|-------|
| **ID Documento** | FOR-REV-001 |
| **Version** | 0.1 |
| **Fecha de Emision** | 2026-04-16 |
| **SOP Asociado** | SOP-006 (Revision Periodica de Sistemas Computarizados Validados) |
| **Normativa** | ANMAT Disp. 4159/2023 Anexo 6, GAMP5 2da Ed., 21 CFR Part 11 |

---

## SECCION 1: INFORMACION GENERAL

| Campo | Completar |
|-------|-----------|
| **Nombre del Sistema** | CannTrace |
| **Version del Sistema** | ____________________________________________ |
| **Clasificacion GAMP5** | Categoria 5 -- Software Configurado a Medida |
| **Periodo de Revision** | Desde: ____/____/________ Hasta: ____/____/________ |
| **Fecha de Revision** | ____/____/________ |
| **Revision N** | ________ (primera = 1, segunda = 2, etc.) |
| **Revision Anterior** | Fecha: ____/____/________ N: ________ |
| **Revisor Principal** | ____________________________________________ |
| **Cargo del Revisor** | ____________________________________________ |

---

## SECCION 2: EVALUACION POR AREA

*Para cada area, evaluar el estado actual y registrar observaciones. Marcar SI, NO o N/A segun corresponda.*

---

### Area 1: SOPs Vigentes y Cumplidos

**Pregunta:** Los procedimientos operativos estandar (SOP-001 a SOP-006) estan actualizados y se cumplen en la operacion diaria?

| Evaluacion | Marcar |
|------------|--------|
| [ ] SI | Los SOPs estan vigentes y se cumplen |
| [ ] NO | Se detectaron incumplimientos o SOPs desactualizados |
| [ ] N/A | No aplica |

**SOPs Revisados:**

| SOP | Titulo | Vigente | Se Cumple | Ultima Revision |
|-----|--------|---------|-----------|-----------------|
| SOP-001 | Uso del Sistema CannTrace | [ ] SI [ ] NO | [ ] SI [ ] NO | ____/____/________ |
| SOP-002 | Backup y Recuperacion | [ ] SI [ ] NO | [ ] SI [ ] NO | ____/____/________ |
| SOP-003 | Control de Cambios | [ ] SI [ ] NO | [ ] SI [ ] NO | ____/____/________ |
| SOP-004 | Gestion de Incidentes | [ ] SI [ ] NO | [ ] SI [ ] NO | ____/____/________ |

**Observaciones:**

_______________________________________________________________________________

_______________________________________________________________________________

---

### Area 2: Procedimientos de Control de Cambios Activos

**Pregunta:** El proceso de control de cambios (SOP-003) esta activo y todos los cambios al sistema durante el periodo fueron gestionados formalmente?

| Evaluacion | Marcar |
|------------|--------|
| [ ] SI | Todos los cambios pasaron por control de cambios formal |
| [ ] NO | Se detectaron cambios sin documentacion formal |
| [ ] N/A | No hubo cambios en el periodo |

**Resumen de Cambios del Periodo:**

| RFC N | Fecha | Descripcion | Categoria | Estado |
|-------|-------|-------------|-----------|--------|
| RFC-____-____ | ____/____/__ | ________________________________ | Critico/Mayor/Menor | Cerrado/Abierto |
| RFC-____-____ | ____/____/__ | ________________________________ | Critico/Mayor/Menor | Cerrado/Abierto |
| RFC-____-____ | ____/____/__ | ________________________________ | Critico/Mayor/Menor | Cerrado/Abierto |

**Total de cambios en el periodo:** ________

**Observaciones:**

_______________________________________________________________________________

---

### Area 3: Incidentes Gestionados Segun SOP-004

**Pregunta:** Todos los incidentes del periodo fueron reportados, investigados y cerrados conforme a SOP-004?

| Evaluacion | Marcar |
|------------|--------|
| [ ] SI | Todos los incidentes gestionados correctamente |
| [ ] NO | Se detectaron incidentes sin documentacion o sin cierre |
| [ ] N/A | No hubo incidentes en el periodo |

**Resumen de Incidentes del Periodo:**

| INC N | Fecha | Severidad | Estado | CAPA Asociado |
|-------|-------|-----------|--------|---------------|
| INC-____-____ | ____/____/__ | Critico/Mayor/Menor | Cerrado/Abierto | CAPA-____-____ |
| INC-____-____ | ____/____/__ | Critico/Mayor/Menor | Cerrado/Abierto | CAPA-____-____ |
| INC-____-____ | ____/____/__ | Critico/Mayor/Menor | Cerrado/Abierto | CAPA-____-____ |

**Total de incidentes:** ________ | **Criticos:** ________ | **Mayores:** ________ | **Menores:** ________

**Observaciones:**

_______________________________________________________________________________

---

### Area 4: Integridad del Audit Trail Verificada

**Pregunta:** Se verifico la integridad de la cadena de hashes del audit trail y no se detectaron alteraciones?

| Evaluacion | Marcar |
|------------|--------|
| [ ] SI | Cadena de hashes intacta, integridad verificada |
| [ ] NO | Se detectaron inconsistencias en la cadena de hashes |
| [ ] N/A | No aplica |

| Verificacion | Resultado |
|--------------|-----------|
| Fecha de verificacion | ____/____/________ |
| Funcion ejecutada | verificar_integridad_cadena() |
| Total registros en audit trail | ____________ |
| Cadena valida | [ ] SI  [ ] NO |
| Primer error detectado en | ____________ (timestamp, si aplica) |
| ID del registro con error | ____________ (UUID, si aplica) |

**Observaciones:**

_______________________________________________________________________________

---

### Area 5: Backup y Restauracion Probados (Semestral)

**Pregunta:** Se ejecutaron pruebas de backup y restauracion al menos una vez cada semestre conforme a SOP-002?

| Evaluacion | Marcar |
|------------|--------|
| [ ] SI | Pruebas de backup/restore ejecutadas y exitosas |
| [ ] NO | No se realizaron pruebas o las pruebas fallaron |
| [ ] N/A | No aplica |

| Prueba | Fecha | Resultado | Ejecutado por |
|--------|-------|-----------|---------------|
| Backup semestral 1 | ____/____/________ | [ ] Exitoso [ ] Fallido | _________________ |
| Restore semestral 1 | ____/____/________ | [ ] Exitoso [ ] Fallido | _________________ |
| Backup semestral 2 | ____/____/________ | [ ] Exitoso [ ] Fallido | _________________ |
| Restore semestral 2 | ____/____/________ | [ ] Exitoso [ ] Fallido | _________________ |

| Metrica | Valor |
|---------|-------|
| RPO alcanzado (Recovery Point Objective) | ____________ |
| RTO alcanzado (Recovery Time Objective) | ____________ |
| Datos restaurados correctamente | [ ] SI  [ ] NO |

**Observaciones:**

_______________________________________________________________________________

---

### Area 6: Accesos de Usuario Revisados (Activos/Inactivos)

**Pregunta:** Se revisaron las cuentas de usuario y se desactivaron las que ya no corresponden?

| Evaluacion | Marcar |
|------------|--------|
| [ ] SI | Revision completada, accesos actualizados |
| [ ] NO | No se realizo revision o quedan accesos pendientes |
| [ ] N/A | No aplica |

| Metrica | Cantidad |
|---------|----------|
| Total usuarios registrados | ____________ |
| Usuarios activos | ____________ |
| Usuarios desactivados en esta revision | ____________ |
| Usuarios con rol administrador | ____________ |
| Usuarios con rol auditor | ____________ |
| Usuarios con rol supervisor | ____________ |
| Usuarios con rol operador | ____________ |
| Intentos de acceso no autorizado detectados | ____________ |

**Observaciones:**

_______________________________________________________________________________

---

### Area 7: Rendimiento del Sistema Aceptable

**Pregunta:** El sistema opera dentro de los parametros de rendimiento establecidos (tiempo de respuesta < 3s, disponibilidad >= 99.5%)?

| Evaluacion | Marcar |
|------------|--------|
| [ ] SI | Rendimiento dentro de parametros aceptables |
| [ ] NO | Se detectaron degradaciones de rendimiento |
| [ ] N/A | No aplica |

| Metrica | Objetivo | Valor Actual |
|---------|----------|--------------|
| Tiempo de respuesta p95 | < 3 segundos | ____________ seg |
| Disponibilidad mensual promedio | >= 99.5% | ____________ % |
| Usuarios concurrentes maximos | >= 50 | ____________ |
| Errores de sincronizacion offline | 0 | ____________ |
| Precision IA (Text-to-JSON) | >= 95% | ____________ % |

**Observaciones:**

_______________________________________________________________________________

---

### Area 8: Requerimientos Regulatorios Vigentes

**Pregunta:** El sistema sigue cumpliendo con todos los requisitos regulatorios aplicables (ANMAT, ARICCAME, GAMP5)?

| Evaluacion | Marcar |
|------------|--------|
| [ ] SI | Cumplimiento regulatorio vigente |
| [ ] NO | Se detectaron cambios regulatorios que requieren accion |
| [ ] N/A | No aplica |

| Normativa | Vigente | Cambios Detectados |
|-----------|---------|-------------------|
| ANMAT Disp. 4159/2023 Anexo 6 | [ ] SI [ ] NO | ________________________________ |
| Ley 27.669 (ARICCAME) | [ ] SI [ ] NO | ________________________________ |
| EU GMP Annex 11 (referencia) | [ ] SI [ ] NO | ________________________________ |
| 21 CFR Part 11 (referencia) | [ ] SI [ ] NO | ________________________________ |
| ISPE GAMP5 2da Ed. | [ ] SI [ ] NO | ________________________________ |

**Observaciones:**

_______________________________________________________________________________

---

### Area 9: Registros de Capacitacion al Dia

**Pregunta:** Todos los usuarios activos del sistema tienen registros de capacitacion vigentes?

| Evaluacion | Marcar |
|------------|--------|
| [ ] SI | Todos los usuarios capacitados y con registros vigentes |
| [ ] NO | Se detectaron usuarios sin capacitacion vigente |
| [ ] N/A | No aplica |

| Metrica | Cantidad |
|---------|----------|
| Total usuarios activos | ____________ |
| Usuarios con capacitacion vigente | ____________ |
| Usuarios con capacitacion vencida | ____________ |
| Capacitaciones realizadas en el periodo | ____________ |

**Usuarios con capacitacion vencida (listar):**

_______________________________________________________________________________

**Observaciones:**

_______________________________________________________________________________

---

### Area 10: Parches de Seguridad Aplicados

**Pregunta:** Se aplicaron los parches de seguridad y actualizaciones necesarios durante el periodo?

| Evaluacion | Marcar |
|------------|--------|
| [ ] SI | Parches y actualizaciones al dia |
| [ ] NO | Hay actualizaciones pendientes |
| [ ] N/A | No aplica |

| Componente | Version Actual | Ultima Version | Actualizado | Fecha |
|------------|---------------|----------------|-------------|-------|
| Supabase (backend) | ____________ | ____________ | [ ] SI [ ] NO | ____/____/__ |
| React (frontend) | ____________ | ____________ | [ ] SI [ ] NO | ____/____/__ |
| Dependencias NPM | ____________ | ____________ | [ ] SI [ ] NO | ____/____/__ |
| Groq API | ____________ | ____________ | [ ] SI [ ] NO | ____/____/__ |
| Certificado SSL | ____________ | ____________ | [ ] SI [ ] NO | ____/____/__ |

**Vulnerabilidades conocidas sin parchear:**

_______________________________________________________________________________

**Observaciones:**

_______________________________________________________________________________

---

### Area 11: Politica de Retencion de Datos Cumplida

**Pregunta:** La politica de retencion de datos se cumple (minimo 5 anos para datos regulados)?

| Evaluacion | Marcar |
|------------|--------|
| [ ] SI | Politica de retencion cumplida |
| [ ] NO | Se detectaron problemas de retencion |
| [ ] N/A | No aplica |

| Metrica | Valor |
|---------|-------|
| Registro mas antiguo en sistema | ____/____/________ |
| Datos con mas de 5 anos | [ ] SI (cantidad: ____) [ ] NO |
| Datos archivados externamente | [ ] SI [ ] NO |
| Espacio de almacenamiento utilizado | ____________ GB |
| Espacio de almacenamiento disponible | ____________ GB |

**Observaciones:**

_______________________________________________________________________________

---

## SECCION 3: RESUMEN DE EVALUACION

| N | Area de Evaluacion | Resultado | Requiere Accion |
|---|-------------------|-----------|-----------------|
| 1 | SOPs vigentes y cumplidos | [ ] SI [ ] NO [ ] N/A | [ ] SI [ ] NO |
| 2 | Control de cambios activo | [ ] SI [ ] NO [ ] N/A | [ ] SI [ ] NO |
| 3 | Incidentes gestionados (SOP-004) | [ ] SI [ ] NO [ ] N/A | [ ] SI [ ] NO |
| 4 | Integridad del audit trail | [ ] SI [ ] NO [ ] N/A | [ ] SI [ ] NO |
| 5 | Backup/restauracion probados | [ ] SI [ ] NO [ ] N/A | [ ] SI [ ] NO |
| 6 | Accesos de usuario revisados | [ ] SI [ ] NO [ ] N/A | [ ] SI [ ] NO |
| 7 | Rendimiento aceptable | [ ] SI [ ] NO [ ] N/A | [ ] SI [ ] NO |
| 8 | Requerimientos regulatorios vigentes | [ ] SI [ ] NO [ ] N/A | [ ] SI [ ] NO |
| 9 | Registros de capacitacion al dia | [ ] SI [ ] NO [ ] N/A | [ ] SI [ ] NO |
| 10 | Parches de seguridad aplicados | [ ] SI [ ] NO [ ] N/A | [ ] SI [ ] NO |
| 11 | Politica de retencion cumplida | [ ] SI [ ] NO [ ] N/A | [ ] SI [ ] NO |

---

## SECCION 4: RE-EVALUACION DE RIESGOS

**Se requiere re-evaluacion de riesgos (FMEA)?**

- [ ] **NO** -- Los riesgos identificados en FMEA-001 siguen siendo validos y las mitigaciones son efectivas.
- [ ] **SI** -- Se requiere actualizacion del FMEA por los siguientes motivos:

_______________________________________________________________________________

_______________________________________________________________________________

---

## SECCION 5: NECESIDAD DE REVALIDACION

**Se requiere revalidacion parcial o total del sistema?**

- [ ] **NO** -- El sistema se mantiene en estado validado. No se detectaron cambios o hallazgos que requieran revalidacion.
- [ ] **SI, PARCIAL** -- Se requiere revalidacion parcial por los siguientes motivos:

_______________________________________________________________________________

_______________________________________________________________________________

- [ ] **SI, TOTAL** -- Se requiere revalidacion completa por los siguientes motivos:

_______________________________________________________________________________

_______________________________________________________________________________

---

## SECCION 6: ACCIONES CORRECTIVAS / ITEMS DE ACCION

| N | Descripcion de la Accion | Prioridad | Responsable | Fecha Limite | Estado |
|---|--------------------------|-----------|-------------|-------------|--------|
| 1 | ________________________________ | Alta/Media/Baja | _________________ | ____/____/__ | Abierto |
| 2 | ________________________________ | Alta/Media/Baja | _________________ | ____/____/__ | Abierto |
| 3 | ________________________________ | Alta/Media/Baja | _________________ | ____/____/__ | Abierto |
| 4 | ________________________________ | Alta/Media/Baja | _________________ | ____/____/__ | Abierto |
| 5 | ________________________________ | Alta/Media/Baja | _________________ | ____/____/__ | Abierto |

---

## SECCION 7: CONCLUSION

**Estado del sistema tras la revision periodica:**

- [ ] **MANTIENE ESTADO VALIDADO** -- El sistema opera conforme a su validacion original. No se requieren acciones correctivas significativas.
- [ ] **MANTIENE CON ACCIONES** -- El sistema se mantiene en estado validado, sujeto al cierre satisfactorio de las acciones correctivas detalladas en la Seccion 6.
- [ ] **REQUIERE ACCION INMEDIATA** -- Se detectaron hallazgos criticos que requieren accion inmediata y posible revalidacion.

**Comentarios de conclusion:**

_______________________________________________________________________________

_______________________________________________________________________________

_______________________________________________________________________________

---

## SECCION 8: APROBACIONES

| Rol | Nombre | Firma | Fecha |
|-----|--------|-------|-------|
| **QA / Regulatorio** | _________________________ | _________________________ | ____/____/________ |
| **System Owner** (Propietario del Sistema) | _________________________ | _________________________ | ____/____/________ |
| **Process Owner** (Propietario del Proceso) | _________________________ | _________________________ | ____/____/________ |

*Al firmar, los aprobadores confirman que han revisado los hallazgos de esta revision periodica y estan de acuerdo con la conclusion y las acciones propuestas.*

---

*Documento controlado -- FOR-REV-001 v0.1 -- CannTrace GAMP5 Cat.5*

*Proxima revision programada: ____/____/________ (12 meses desde la fecha de esta revision)*
