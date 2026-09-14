# PROTOCOLO DE CUALIFICACION DE INSTALACION (IQ)

| Campo | Valor |
|---|---|
| **Documento** | IQ-001 |
| **Version** | 0.1 |
| **Fecha** | 2026-04-16 |
| **Sistema** | CannTrace - Sistema de Trazabilidad Seed-to-Sale |
| **Clasificacion GAMP5** | Categoria 5 - Aplicacion Personalizada |
| **Estado** | BORRADOR |

---

## 1. OBJETIVO

Verificar que el sistema CannTrace ha sido instalado correctamente en el entorno de produccion, confirmando que todos los componentes de infraestructura, base de datos, servicios de autenticacion y aplicacion frontend se encuentran operativos y configurados segun las especificaciones de diseno (DS-001) y los requerimientos de usuario (URS-001).

---

## 2. ALCANCE

Este protocolo cubre la verificacion de instalacion de los siguientes componentes:

- Proyecto Supabase (backend-as-a-service)
- Base de datos PostgreSQL (esquema, tablas, triggers, RLS)
- Certificados SSL/TLS
- Servicio de autenticacion (Supabase Auth)
- Aplicacion frontend (PWA - Progressive Web App)
- Variables de entorno y configuracion
- Sistema de respaldo (backups)

---

## 3. REFERENCIAS

| Codigo | Documento |
|---|---|
| URS-001 | Especificacion de Requerimientos de Usuario |
| DS-001 | Especificacion de Diseno del Sistema |
| VP-001 | Plan Maestro de Validacion |
| RA-001 | Evaluacion de Riesgos |
| GAMP5 | ISPE GAMP 5 - A Risk-Based Approach to Compliant GxP Computerized Systems |

---

## 4. RESPONSABILIDADES

| Rol | Responsabilidad |
|---|---|
| **Responsable de Validacion** | Redaccion, revision y aprobacion del protocolo. Supervision de ejecucion. |
| **Administrador de Sistemas** | Ejecucion de las pruebas tecnicas de infraestructura y base de datos. |
| **Responsable de Calidad (QA)** | Revision de resultados, aprobacion de desviaciones, firma final. |
| **Desarrollador Principal** | Soporte tecnico durante la ejecucion de pruebas. |

---

## 5. PRERREQUISITOS

Antes de iniciar la ejecucion de este protocolo, se deben cumplir las siguientes condiciones:

| # | Prerrequisito | Verificado | Firma | Fecha |
|---|---|---|---|---|
| 1 | Plan Maestro de Validacion (VP-001) aprobado | ☐ | | |
| 2 | Especificacion de Diseno (DS-001) aprobada | ☐ | | |
| 3 | Entorno de produccion provisionado en Supabase | ☐ | | |
| 4 | Codigo fuente desplegado en repositorio controlado | ☐ | | |
| 5 | Acceso administrativo disponible para el ejecutor | ☐ | | |
| 6 | Herramientas de verificacion disponibles (CLI Supabase, navegador, terminal) | ☐ | | |
| 7 | Evaluacion de riesgos (RA-001) completada | ☐ | | |

---

## 6. PROCEDIMIENTO DE EJECUCION

### 6.1 Instrucciones Generales

1. Cada caso de prueba debe ejecutarse en el orden establecido.
2. Registrar el resultado real observado en la columna correspondiente.
3. Marcar **PASA** si el resultado real coincide con el resultado esperado.
4. Marcar **FALLA** si el resultado real NO coincide. En caso de falla, documentar la desviacion en la Seccion 8.
5. Firmar y fechar cada caso de prueba al momento de su ejecucion.
6. No se permite alterar los resultados una vez registrados. Cualquier correccion debe hacerse mediante una linea sobre el dato original, con firma y fecha.

---

## 7. CASOS DE PRUEBA

| ID | Descripcion | Criterio de Aceptacion | Resultado Esperado | Resultado Real | PASA/FALLA | Ejecutor | Fecha |
|---|---|---|---|---|---|---|---|
| IQ-001 | Verificar que el proyecto Supabase esta activo y en estado saludable | Ejecutar health check del proyecto via API de gestion de Supabase o dashboard | El proyecto responde con estado "ACTIVE_HEALTHY". No se reportan errores de servicio. | | | | |
| IQ-002 | Verificar la version de PostgreSQL instalada | Ejecutar `SELECT version();` en la consola SQL de Supabase | La version reportada es PostgreSQL 15.x o superior, compatible con las extensiones requeridas (pgcrypto, uuid-ossp). | | | | |
| IQ-003 | Verificar que las 16 tablas del esquema estan creadas con las columnas correctas | Ejecutar consulta contra `information_schema.tables` y `information_schema.columns` para el esquema `public` | Se confirman 16 tablas: `usuarios`, `roles`, `permisos`, `lotes`, `plantas`, `operaciones`, `trazabilidad`, `stock`, `movimientos`, `qr_codes`, `audit_log`, `firmas_electronicas`, `reportes`, `configuracion`, `notificaciones`, `sesiones`. Cada tabla contiene las columnas definidas en DS-001. | | | | |
| IQ-004 | Verificar que Row Level Security (RLS) esta habilitado en todas las tablas | Ejecutar `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';` | Las 16 tablas muestran `rowsecurity = true` (16/16). Ninguna tabla tiene RLS deshabilitado. | | | | |
| IQ-005 | Verificar que todos los triggers de base de datos estan activos | Ejecutar `SELECT trigger_name, event_object_table, is_enabled FROM information_schema.triggers;` | Se confirman 20 o mas triggers activos (estado `ENABLED`), incluyendo: triggers de audit trail, triggers de calculo de stock, triggers de hash chain, triggers de validacion de datos. | | | | |
| IQ-006 | Verificar que el certificado SSL/TLS es valido | Inspeccionar el certificado del endpoint de la API de Supabase mediante navegador o herramienta de linea de comandos (`openssl s_client`) | El certificado SSL/TLS es valido, no esta expirado, la cadena de confianza es completa y el dominio coincide con el endpoint del proyecto. Protocolo TLS 1.2 o superior. | | | | |
| IQ-007 | Verificar que Supabase Auth esta configurado correctamente | Revisar la configuracion de autenticacion en el dashboard de Supabase: proveedores, politicas de contrasena, duracion de sesion | Auth esta habilitado con proveedor email/password. Politica de contrasena: minimo 8 caracteres, requiere mayuscula, minuscula y numero. Duracion de sesion JWT configurada (ej. 3600s). Confirmacion de email habilitada o deshabilitada segun DS-001. | | | | |
| IQ-008 | Verificar que la aplicacion frontend (PWA) compila sin errores | Ejecutar el comando de build del proyecto frontend (`npm run build` o equivalente) en el entorno de despliegue | El proceso de build finaliza exitosamente con codigo de salida 0. No se reportan errores de compilacion. Se generan los archivos estaticos en el directorio de salida. El Service Worker se registra correctamente. | | | | |
| IQ-009 | Verificar que las variables de entorno estan configuradas | Revisar el archivo `.env` o la configuracion de entorno del despliegue. Verificar que cada variable requerida tiene un valor asignado y no esta vacia. | Las siguientes variables estan presentes y configuradas: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (solo servidor), `APP_ENV=production`, `ENCRYPTION_KEY`. Ninguna variable critica esta vacia o con valor por defecto de desarrollo. | | | | |
| IQ-010 | Verificar que el sistema de respaldo (backup) esta configurado | Verificar la configuracion de backups automaticos en Supabase (plan Pro o superior) o la existencia de un proceso de backup manual documentado | Los backups automaticos estan habilitados con frecuencia diaria o superior. Se verifica que existe al menos un backup reciente (< 24 horas). El procedimiento de restauracion esta documentado y accesible. | | | | |

---

## 8. REGISTRO DE DESVIACIONES

Cualquier resultado que no cumpla con el criterio de aceptacion debe documentarse como desviacion en esta seccion.

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

## 9. RESUMEN DE RESULTADOS

| Metrica | Valor |
|---|---|
| **Total de casos de prueba** | 10 |
| **Casos PASA** | ___/10 |
| **Casos FALLA** | ___/10 |
| **Desviaciones abiertas** | ___ |
| **Desviaciones resueltas** | ___ |

### Conclusion

☐ **APROBADO** - Todos los casos de prueba pasaron satisfactoriamente. El sistema cumple con los criterios de cualificacion de instalacion. Se autoriza proceder con la Cualificacion Operacional (OQ-001).

☐ **APROBADO CON DESVIACIONES** - Se identificaron desviaciones menores que no afectan la funcionalidad critica del sistema. Las desviaciones estan documentadas y las acciones correctivas han sido completadas o planificadas. Se autoriza proceder con la Cualificacion Operacional (OQ-001) con condiciones.

☐ **RECHAZADO** - Se identificaron desviaciones criticas que impiden la operacion segura del sistema. Se requieren acciones correctivas antes de repetir la cualificacion.

---

## 10. FIRMAS DE APROBACION

| Rol | Nombre | Firma | Fecha |
|---|---|---|---|
| **Ejecutor de Pruebas** | | | |
| **Revisor Tecnico** | | | |
| **Responsable de Validacion** | | | |
| **Responsable de Calidad (QA)** | | | |

---

*Fin del documento IQ-001 v0.1*
