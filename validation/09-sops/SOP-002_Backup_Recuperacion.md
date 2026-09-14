# PROCEDIMIENTO OPERATIVO ESTANDAR

---

| Campo | Detalle |
|---|---|
| **Documento ID** | SOP-002 |
| **Titulo** | Backup y Recuperacion ante Desastres - Sistema CannTrace |
| **Version** | 0.1 |
| **Fecha de Emision** | 2026-04-16 |
| **Clasificacion** | GAMP5 - Categoria 5 (Software Personalizado) |
| **Norma de Referencia** | ANMAT Disposicion 4159/2023 |
| **Estado** | Borrador |

---

## 1. PROPOSITO

Establecer el procedimiento para la realizacion de copias de seguridad (backups), su verificacion periodica y la recuperacion del sistema CannTrace ante situaciones de perdida de datos o desastre, garantizando la integridad, disponibilidad y trazabilidad de los registros conforme a los requisitos de ANMAT Disposicion 4159/2023 y las directrices GAMP5.

## 2. ALCANCE

Este procedimiento aplica a:

- Toda la infraestructura del sistema CannTrace: base de datos Supabase, almacenamiento de archivos, configuraciones del sistema y audit trail.
- Todos los ambientes del sistema: Produccion, Staging/Test.
- Todo el personal responsable de la administracion tecnica del sistema.
- Los datos historicos desde la puesta en marcha del sistema hasta su decomisionamiento.

## 3. DEFINICIONES

| Termino | Definicion |
|---|---|
| **Backup (Copia de Seguridad)** | Copia de los datos y configuraciones del sistema almacenada en una ubicacion separada para permitir su restauracion en caso de perdida. |
| **RPO (Recovery Point Objective)** | Punto de recuperacion objetivo. Cantidad maxima de datos que se puede perder medida en tiempo. Para CannTrace: **RPO = 24 horas** (backup diario automatico). |
| **RTO (Recovery Time Objective)** | Tiempo de recuperacion objetivo. Tiempo maximo aceptable para restaurar el sistema a operacion normal. Para CannTrace: **RTO = 4 horas** (ambiente cloud). |
| **Backup Completo (Full)** | Copia integral de toda la base de datos, archivos y configuraciones del sistema. |
| **Backup Incremental** | Copia unicamente de los datos modificados desde el ultimo backup completo. |
| **Restauracion (Restore)** | Proceso de recuperar datos desde un backup para restablecer el sistema a un estado funcional previo. |
| **Disaster Recovery (DR)** | Plan y conjunto de procedimientos para recuperar la operacion del sistema ante un evento catastrofico. |
| **Supabase** | Plataforma de backend como servicio (BaaS) que aloja la base de datos PostgreSQL, autenticacion y almacenamiento de archivos de CannTrace. |
| **Audit Trail** | Registro cronologico e inmutable de todas las acciones del sistema. Su integridad debe preservarse en todo backup. |

## 4. RESPONSABILIDADES

| Rol | Responsabilidades |
|---|---|
| **Administrador del Sistema** | Configurar y monitorear los backups automaticos, ejecutar backups manuales semanales, realizar pruebas de restauracion, ejecutar el plan de recuperacion ante desastres. |
| **Responsable de IT** | Supervisar la estrategia de backup, aprobar cambios en la politica de respaldo, verificar el cumplimiento del cronograma de pruebas. |
| **Responsable de Calidad** | Auditar los registros de backup y restauracion, verificar la integridad de los datos recuperados, aprobar los resultados de las pruebas semestrales. |
| **Director Tecnico** | Aprobar el presente procedimiento, autorizar la ejecucion del plan de recuperacion ante desastres. |

## 5. PROGRAMA DE BACKUP

### 5.1 Backup Automatico Diario (Supabase)

| Parametro | Valor |
|---|---|
| **Frecuencia** | Diaria, automatica |
| **Hora de ejecucion** | 03:00 AM (hora Argentina, UTC-3) |
| **Tipo** | Backup completo de la base de datos PostgreSQL |
| **Ejecutado por** | Plataforma Supabase (automatico) |
| **Retencion** | 7 dias (plan Pro) / 30 dias (plan Enterprise) |
| **Ubicacion** | Infraestructura de Supabase (AWS) |
| **Monitoreo** | Verificacion diaria del estado del backup en el dashboard de Supabase |

### 5.2 Backup Manual Semanal (Exportacion)

| Parametro | Valor |
|---|---|
| **Frecuencia** | Semanal, cada viernes |
| **Hora de ejecucion** | Entre 17:00 y 18:00 (hora Argentina) |
| **Tipo** | Exportacion completa (pg_dump) + exportacion de archivos de almacenamiento |
| **Ejecutado por** | Administrador del Sistema |
| **Retencion** | 12 meses |
| **Ubicacion primaria** | Almacenamiento en la nube (bucket cifrado, separado de produccion) |
| **Ubicacion secundaria** | Disco externo cifrado, almacenado en ubicacion fisica segura |
| **Formato** | SQL comprimido (.sql.gz) + archivos en .tar.gz |

#### Procedimiento de Backup Manual Semanal:

1. Acceder al servidor de administracion con credenciales autorizadas.
2. Ejecutar el script de backup manual: `backup_canntrace_weekly.sh`.
3. El script realizara automaticamente:
   - Exportacion de la base de datos completa (pg_dump con formato custom).
   - Exportacion de los archivos del storage de Supabase.
   - Exportacion de la configuracion del sistema.
   - Compresion y cifrado del archivo resultante (AES-256).
   - Calculo del hash SHA-256 del archivo de backup.
4. Verificar que el archivo de backup se genero correctamente:
   - Comprobar el tamano del archivo (debe ser coherente con backups anteriores).
   - Verificar el hash SHA-256 registrado en el log.
5. Transferir el archivo de backup a:
   - Ubicacion primaria: bucket de almacenamiento en la nube.
   - Ubicacion secundaria: disco externo cifrado.
6. Registrar la ejecucion en el **Formulario de Registro de Backup** (FOR-BKP-001) con los siguientes datos:
   - Fecha y hora de inicio y finalizacion.
   - Tamano del archivo.
   - Hash SHA-256.
   - Ubicaciones de almacenamiento.
   - Resultado (exitoso/fallido).
   - Nombre del responsable.

### 5.3 Backup Mensual de Archivo

| Parametro | Valor |
|---|---|
| **Frecuencia** | Mensual, ultimo dia habil del mes |
| **Tipo** | Backup completo + audit trail completo |
| **Retencion** | 10 anos (conforme requisito regulatorio) |
| **Ubicacion** | Almacenamiento de archivo a largo plazo (cloud archive + copia fisica) |

## 6. CONTENIDO DEL BACKUP

Cada backup debe incluir los siguientes componentes:

| Componente | Descripcion | Criticidad |
|---|---|---|
| **Base de datos PostgreSQL** | Todas las tablas, relaciones, indices, funciones almacenadas y datos | CRITICA |
| **Audit Trail** | Tabla completa de registros de auditoria con todos los campos | CRITICA |
| **Politicas RLS** | Row Level Security policies de Supabase | ALTA |
| **Archivos de almacenamiento** | Documentos adjuntos, imagenes, certificados de analisis | ALTA |
| **Configuracion del sistema** | Parametros, roles, permisos, umbrales de alerta | ALTA |
| **Funciones Edge** | Codigo de las funciones serverless desplegadas | MEDIA |
| **Esquema de base de datos** | DDL completo para recrear la estructura de la base de datos | CRITICA |
| **Datos de autenticacion** | Configuracion de usuarios y roles (NO contrasenas en texto plano) | ALTA |

## 7. PROCEDIMIENTO DE VERIFICACION

### 7.1 Verificacion Mensual (Test de Restauracion)

**Frecuencia**: Una vez al mes, primera semana del mes.

**Procedimiento**:

1. Seleccionar el backup semanal mas reciente.
2. Crear un ambiente de prueba aislado (proyecto Supabase temporal o base de datos local).
3. Ejecutar el procedimiento de restauracion completo en el ambiente de prueba:
   - Restaurar la base de datos desde el archivo SQL.
   - Restaurar los archivos de almacenamiento.
   - Restaurar la configuracion del sistema.
4. Verificar la integridad de los datos restaurados:
   - **Conteo de registros**: Comparar el numero de registros en tablas criticas (lotes, operaciones, audit trail) con el conteo del sistema de produccion al momento del backup.
   - **Integridad referencial**: Verificar que no existan registros huerfanos ni relaciones rotas.
   - **Audit Trail**: Confirmar que el audit trail esta completo e inalterado (verificar hash del primer y ultimo registro).
   - **Datos de muestra**: Seleccionar aleatoriamente 10 registros de operaciones y verificar su contenido contra documentacion fisica.
   - **Funcionalidad basica**: Realizar una prueba de login, consulta de lote y generacion de reporte en el ambiente restaurado.
5. Registrar los resultados en el **Formulario de Verificacion de Backup** (FOR-BKP-002):
   - Fecha de la prueba.
   - Backup utilizado (fecha y hash).
   - Resultados de cada verificacion.
   - Tiempo de restauracion (para validar RTO).
   - Anomalias detectadas.
   - Conclusion: CONFORME / NO CONFORME.
6. En caso de resultado NO CONFORME:
   - Registrar una incidencia segun SOP-004.
   - Investigar la causa raiz.
   - Ejecutar un backup manual inmediato y verificar.
   - Notificar al Responsable de IT y al Responsable de Calidad.

### 7.2 Verificacion Diaria (Automatica)

1. Verificar en el dashboard de Supabase que el backup automatico diario se ejecuto exitosamente.
2. Revisar alertas de error en el sistema de monitoreo.
3. Registrar el estado en el log diario de operaciones IT.

## 8. PROCEDIMIENTO DE RECUPERACION ANTE DESASTRES

### 8.1 Clasificacion de Escenarios de Desastre

| Escenario | Descripcion | Severidad | RTO |
|---|---|---|---|
| **E1** | Corrupcion parcial de datos (una o pocas tablas) | MEDIA | 2 horas |
| **E2** | Perdida completa de la base de datos | ALTA | 4 horas |
| **E3** | Caida del servicio Supabase | ALTA | 4 horas (dependiente del proveedor) |
| **E4** | Perdida de acceso a la cuenta de Supabase | CRITICA | 8 horas |
| **E5** | Desastre total (perdida de todos los servicios cloud) | CRITICA | 24 horas |

### 8.2 Procedimiento General de Recuperacion

#### Paso 1: Deteccion y Evaluacion

1. Identificar el tipo y alcance de la perdida o interrupcion.
2. Clasificar el escenario segun la tabla 8.1.
3. Notificar inmediatamente al Responsable de IT y al Director Tecnico.
4. Registrar la incidencia segun SOP-004 (Gestion de Incidentes).
5. Notificar a los usuarios afectados sobre la interrupcion del servicio.

#### Paso 2: Seleccion del Punto de Restauracion

1. Identificar el backup mas reciente disponible y verificado.
2. Determinar el punto de restauracion optimo considerando:
   - Fecha y hora del ultimo backup exitoso.
   - Naturaleza de la falla (si la corrupcion fue gradual, puede ser necesario un backup anterior).
3. Calcular la perdida de datos estimada (diferencia entre el punto de restauracion y el momento de la falla).

#### Paso 3: Ejecucion de la Restauracion

**Para Escenarios E1 (Corrupcion parcial):**

1. Identificar las tablas afectadas.
2. Restaurar unicamente las tablas danadas desde el backup mas reciente.
3. Verificar la integridad referencial con el resto de la base de datos.
4. Verificar el audit trail.

**Para Escenarios E2-E5 (Restauracion completa):**

1. Provisionar un nuevo ambiente Supabase (si el original no esta disponible).
2. Restaurar la base de datos completa desde el backup.
3. Restaurar los archivos de almacenamiento.
4. Restaurar la configuracion del sistema y las funciones Edge.
5. Configurar las politicas RLS.
6. Verificar la autenticacion y los permisos de usuario.

#### Paso 4: Verificacion Post-Restauracion

1. Ejecutar todas las verificaciones detalladas en la seccion 7.1.
2. Verificar que el audit trail sea continuo y no presente brechas.
3. Verificar la funcionalidad completa del sistema:
   - Login de usuarios.
   - Creacion de operaciones via chat.
   - Escaneo de QR.
   - Generacion de reportes.
   - Correcta aplicacion de permisos por rol.
4. Documentar las operaciones realizadas entre el punto de restauracion y el momento de la falla que deban ser reingresadas manualmente.

#### Paso 5: Reingreso de Datos Perdidos

1. Identificar todas las operaciones realizadas despues del ultimo backup que no esten en el sistema restaurado.
2. Utilizar registros fisicos (bitacoras, formularios impresos de respaldo) para reconstruir los datos.
3. Reingresar los datos al sistema con la anotacion "Reingreso post-restauracion - [fecha del incidente]".
4. El Supervisor debe aprobar cada registro reingresado.

#### Paso 6: Cierre y Documentacion

1. Confirmar que el sistema esta completamente operativo.
2. Notificar a todos los usuarios sobre la restauracion del servicio.
3. Completar el **Formulario de Recuperacion ante Desastres** (FOR-BKP-003).
4. Realizar un backup manual inmediato del sistema restaurado.
5. Ejecutar la investigacion de causa raiz (segun SOP-004).

## 9. PROGRAMA DE PRUEBAS

### 9.1 Prueba Semestral de Recuperacion ante Desastres

| Parametro | Valor |
|---|---|
| **Frecuencia** | Semestral (junio y diciembre) |
| **Responsable de ejecucion** | Administrador del Sistema |
| **Supervision** | Responsable de IT + Responsable de Calidad |
| **Ambiente** | Ambiente de prueba aislado (NO produccion) |

**Procedimiento de la prueba semestral:**

1. Planificar la prueba con al menos 2 semanas de anticipacion.
2. Notificar a todos los involucrados.
3. Simular un escenario de desastre (rotativo entre E1 a E5).
4. Ejecutar el procedimiento de recuperacion completo.
5. Medir y registrar:
   - Tiempo total de recuperacion (comparar con RTO).
   - Integridad de los datos recuperados.
   - Funcionalidad del sistema restaurado.
   - Problemas encontrados durante el proceso.
6. Documentar los resultados en el **Informe de Prueba de DR** (INF-DR-001).
7. Si el RTO no se cumple o hay problemas de integridad:
   - Iniciar un CAPA segun SOP-004.
   - Implementar mejoras al procedimiento.
   - Reprogramar una prueba de seguimiento.

## 10. REGISTROS GENERADOS

| Registro | Codigo | Responsable | Retencion |
|---|---|---|---|
| Formulario de Registro de Backup | FOR-BKP-001 | Administrador del Sistema | 10 anos |
| Formulario de Verificacion de Backup | FOR-BKP-002 | Administrador del Sistema | 10 anos |
| Formulario de Recuperacion ante Desastres | FOR-BKP-003 | Responsable de IT | 10 anos |
| Informe de Prueba de DR Semestral | INF-DR-001 | Responsable de IT | 10 anos |
| Log diario de verificacion de backups | LOG-BKP-DIA | Administrador del Sistema | 5 anos |

## 11. DOCUMENTOS RELACIONADOS

| Documento | Referencia |
|---|---|
| SOP de Uso del Sistema | SOP-001 |
| SOP de Control de Cambios | SOP-003 |
| SOP de Gestion de Incidentes | SOP-004 |
| Plan de Validacion del Sistema | VP-CANNTRACE-001 |
| Contrato de Servicio Supabase | CON-SUPA-001 |

## 12. HISTORIAL DE REVISIONES

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
