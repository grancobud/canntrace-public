# PROCEDIMIENTO OPERATIVO ESTANDAR

---

| Campo | Detalle |
|---|---|
| **Documento ID** | SOP-001 |
| **Titulo** | Uso del Sistema CannTrace |
| **Version** | 0.1 |
| **Fecha de Emision** | 2026-04-16 |
| **Clasificacion** | GAMP5 - Categoria 5 (Software Personalizado) |
| **Norma de Referencia** | ANMAT Disposicion 4159/2023 |
| **Estado** | Borrador |

---

## 1. PROPOSITO

Establecer el procedimiento estandar para el uso del sistema de trazabilidad CannTrace, asegurando que todos los usuarios operen el sistema de manera consistente, confiable y conforme a los requisitos regulatorios de ANMAT Disposicion 4159/2023 y las buenas practicas de manufactura (BPM) aplicables a productos derivados de cannabis.

## 2. ALCANCE

Este procedimiento aplica a:

- Todos los usuarios del sistema CannTrace (operadores, supervisores, responsables de calidad, administradores).
- Todas las operaciones registradas en el sistema: siembra, cultivo, cosecha, secado, procesamiento, almacenamiento, distribucion y dispensacion.
- Todos los sitios y ubicaciones donde el sistema CannTrace este implementado.

## 3. DEFINICIONES

| Termino | Definicion |
|---|---|
| **CannTrace** | Sistema informatizado de trazabilidad para cannabis medicinal, basado en interfaz conversacional (chat) con base de datos Supabase y generacion de codigos QR. |
| **Operacion** | Cualquier actividad del ciclo de vida del producto que debe ser registrada en el sistema (ej: siembra, transplante, cosecha, procesamiento). |
| **Lote** | Conjunto de unidades de producto que comparten las mismas condiciones de produccion y procesamiento, identificado con un codigo unico. |
| **Codigo QR** | Codigo de respuesta rapida asociado a un lote, planta o producto que permite su identificacion y trazabilidad mediante escaneo. |
| **Audit Trail** | Registro cronologico e inmutable de todas las acciones realizadas en el sistema, incluyendo usuario, fecha/hora, accion y datos modificados. |
| **Interfaz Conversacional** | Metodo de interaccion con el sistema mediante lenguaje natural a traves de un chat, donde el usuario describe la operacion y el sistema la procesa. |
| **Rol de Usuario** | Nivel de permisos asignado a cada usuario del sistema (Operador, Supervisor, Responsable de Calidad, Administrador). |

## 4. RESPONSABILIDADES

| Rol | Responsabilidades |
|---|---|
| **Operador** | Registrar operaciones diarias, escanear codigos QR, confirmar datos ingresados, reportar anomalias. |
| **Supervisor** | Revisar y aprobar operaciones criticas, verificar integridad de datos, autorizar correcciones. |
| **Responsable de Calidad** | Auditar registros del sistema, verificar cumplimiento de procedimientos, revisar audit trail periodicamente. |
| **Administrador del Sistema** | Gestionar cuentas de usuario, configurar parametros del sistema, ejecutar mantenimiento, gestionar backups. |
| **Director Tecnico** | Aprobar el presente procedimiento, supervisar el cumplimiento general del sistema de trazabilidad. |

## 5. PROCEDIMIENTO

### 5.1 Inicio de Sesion (Login)

1. Acceder al sistema CannTrace a traves del navegador web autorizado (URL proporcionada por el Administrador del Sistema).
2. Ingresar las credenciales personales:
   - **Usuario**: direccion de correo electronico institucional asignada.
   - **Contrasena**: contrasena personal (minimo 8 caracteres, incluyendo mayusculas, minusculas, numeros y caracteres especiales).
3. Completar la autenticacion de doble factor (2FA) si esta habilitada para el rol del usuario.
4. Verificar que el sistema muestre correctamente el nombre del usuario y su rol en la barra superior.
5. **NOTA**: Despues de tres (3) intentos fallidos de inicio de sesion, la cuenta sera bloqueada automaticamente. Contactar al Administrador del Sistema para desbloqueo.

### 5.2 Creacion de Operaciones mediante Chat

1. En la pantalla principal, ubicar el area de chat conversacional.
2. Describir la operacion a registrar en lenguaje natural. Ejemplos:
   - *"Registrar siembra del lote L-2026-001, variedad Charlotte's Web, 50 plantines, invernadero A, sustrato coco-perlita"*
   - *"Cosecha del lote L-2026-001, 15 plantas, peso fresco total 12.5 kg"*
   - *"Mover lote L-2026-001 de sala de secado a almacen refrigerado"*
3. El sistema procesara el mensaje y presentara un formulario estructurado con los datos interpretados.
4. Revisar cuidadosamente cada campo del formulario generado:
   - Tipo de operacion
   - Identificacion del lote
   - Cantidades y unidades
   - Ubicacion
   - Fecha y hora
   - Observaciones adicionales

### 5.3 Confirmacion de Datos

1. Verificar que todos los campos del formulario coincidan con la operacion real ejecutada.
2. Si algun dato es incorrecto:
   - Corregir directamente en el campo correspondiente del formulario, o
   - Escribir en el chat la correccion necesaria (ej: *"Corregir peso a 12.8 kg en lugar de 12.5 kg"*).
3. Una vez verificados todos los datos, presionar el boton **"Confirmar Operacion"**.
4. El sistema mostrara un mensaje de confirmacion con el numero de registro asignado.
5. **IMPORTANTE**: Una vez confirmada la operacion, esta queda registrada en el audit trail y no puede ser eliminada. Solo se pueden realizar correcciones mediante el procedimiento de enmienda (ver seccion 5.7).

### 5.4 Escaneo de Codigos QR

1. Para operaciones que involucren productos o lotes existentes, utilizar la funcion de escaneo QR:
   - Hacer clic en el icono de camara/QR en la interfaz del sistema.
   - Apuntar la camara del dispositivo al codigo QR impreso en la etiqueta del lote/producto.
   - Esperar a que el sistema reconozca y decodifique el codigo.
2. El sistema cargara automaticamente la informacion asociada al lote/producto escaneado.
3. Verificar que la informacion mostrada corresponda al producto fisico.
4. Si el codigo QR no es reconocido:
   - Verificar que la etiqueta no este danada o sucia.
   - Intentar escanear nuevamente a una distancia de 10-20 cm.
   - Si persiste el problema, ingresar manualmente el codigo de lote y reportar la incidencia al Supervisor.

### 5.5 Generacion de Reportes

1. Acceder al modulo de reportes desde el menu principal o solicitar via chat:
   - *"Generar reporte de trazabilidad del lote L-2026-001"*
   - *"Reporte de inventario actual por ubicacion"*
   - *"Reporte de operaciones del mes de abril 2026"*
2. Seleccionar los parametros del reporte:
   - Tipo de reporte (trazabilidad, inventario, operaciones, audit trail).
   - Rango de fechas.
   - Filtros adicionales (lote, ubicacion, operador, tipo de operacion).
3. El sistema generara el reporte en formato PDF y/o CSV.
4. Verificar que el reporte contenga la informacion esperada.
5. Para reportes regulatorios destinados a ANMAT:
   - Utilizar exclusivamente las plantillas de reporte oficiales configuradas en el sistema.
   - Asegurar que el reporte incluya todos los campos requeridos por la Disposicion 4159/2023.
   - El reporte debe ser revisado por el Responsable de Calidad antes de su envio.

### 5.6 Cierre de Sesion (Logout)

1. Al finalizar las actividades, cerrar sesion presionando el boton **"Cerrar Sesion"** en el menu de usuario (esquina superior derecha).
2. **NUNCA** cerrar el navegador sin antes cerrar sesion en el sistema.
3. El sistema cerrara la sesion automaticamente despues de 30 minutos de inactividad.
4. Al cerrar sesion, verificar que el sistema muestre la pantalla de inicio de sesion.

### 5.7 Enmiendas y Correcciones

1. Si se detecta un error en un registro ya confirmado:
   - Solicitar al Supervisor la autorizacion para realizar una enmienda.
   - Escribir en el chat: *"Solicitar enmienda del registro [numero de registro], motivo: [descripcion del error]"*.
   - El Supervisor revisara y aprobara o rechazara la solicitud.
2. Una vez aprobada, el sistema permitira agregar una nota de correccion al registro original.
3. El registro original NO se modifica ni elimina; la correccion se agrega como un registro adicional vinculado.
4. Todas las enmiendas quedan registradas en el audit trail con: usuario solicitante, usuario aprobador, fecha/hora, motivo y descripcion del cambio.

## 6. REGISTROS GENERADOS

| Registro | Ubicacion | Retencion |
|---|---|---|
| Log de inicio/cierre de sesion | Audit Trail del sistema (Supabase) | 10 anos |
| Registros de operaciones | Base de datos CannTrace (Supabase) | 10 anos |
| Historial de conversaciones (chat) | Base de datos CannTrace (Supabase) | 10 anos |
| Reportes generados (PDF/CSV) | Almacenamiento del sistema + copia local | 10 anos |
| Registros de escaneo QR | Audit Trail del sistema (Supabase) | 10 anos |
| Registros de enmiendas | Audit Trail del sistema (Supabase) | 10 anos |

## 7. DOCUMENTOS RELACIONADOS

| Documento | Referencia |
|---|---|
| Plan de Validacion del Sistema | VP-CANNTRACE-001 |
| SOP de Backup y Recuperacion | SOP-002 |
| SOP de Control de Cambios | SOP-003 |
| SOP de Gestion de Incidentes | SOP-004 |
| Especificacion de Requerimientos de Usuario | URS-CANNTRACE-001 |
| Manual de Usuario CannTrace | MU-CANNTRACE-001 |

## 8. HISTORIAL DE REVISIONES

| Version | Fecha | Descripcion del Cambio | Autor |
|---|---|---|---|
| 0.1 | 2026-04-16 | Emision inicial - Borrador para revision | Equipo de Validacion |

---

## TABLA DE APROBACION

| Funcion | Nombre | Firma | Fecha |
|---|---|---|---|
| **Elaborado por** | _________________________ | _____________ | ____/____/____ |
| **Revisado por (Calidad)** | _________________________ | _____________ | ____/____/____ |
| **Revisado por (IT/Sistemas)** | _________________________ | _____________ | ____/____/____ |
| **Aprobado por (Director Tecnico)** | _________________________ | _____________ | ____/____/____ |

---

*Documento controlado. Prohibida su reproduccion parcial o total sin autorizacion del Responsable de Calidad. Las copias impresas se consideran no controladas.*
