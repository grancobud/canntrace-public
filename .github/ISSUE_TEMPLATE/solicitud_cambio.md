---
name: Solicitud de Cambio (RFC)
about: Solicitar un cambio siguiendo el procedimiento de control de cambios (SOP-003)
labels: cambio, revision-pendiente
---

## ID del Cambio
<!-- RFC-YYYY-NNNN (auto-asignar) -->

## Tipo de Cambio
- [ ] **Mayor** - Afecta funcionalidad validada, requiere re-validacion parcial
- [ ] **Menor** - No afecta funcionalidad validada ni integridad de datos
- [ ] **Emergencia** - Correccion critica urgente (requiere documentacion retroactiva en 48h)

## Descripcion del Cambio
<!-- Que se quiere cambiar y por que -->


## Justificacion
<!-- Por que es necesario este cambio -->


## Evaluacion de Impacto

### Funcional
- [ ] Afecta logica de negocio (operaciones seed-to-sale)
- [ ] Afecta calculo de stock
- [ ] Afecta interfaz de usuario

### Datos
- [ ] Modifica esquema de base de datos
- [ ] Afecta audit trail
- [ ] Afecta firma electronica

### Validacion
- [ ] Requiere re-ejecucion de tests OQ
- [ ] Requiere re-ejecucion de tests PQ
- [ ] Requiere actualizacion de Matriz de Trazabilidad

### Seguridad
- [ ] Afecta control de acceso (RLS)
- [ ] Afecta autenticacion
- [ ] Afecta encriptacion

### Regulatorio
- [ ] Afecta compliance ANMAT/ARICCAME
- [ ] Afecta reportes regulatorios
- [ ] Afecta ALCOA+ (integridad de datos)

## Requerimientos Afectados
<!-- Lista de IDs del URS que se ven impactados -->
- RF-
- RR-

## Plan de Implementacion
1.
2.
3.

## Plan de Rollback
<!-- Como revertir si falla -->


## Aprobaciones Requeridas
- [ ] QA/Regulatorio
- [ ] Propietario del Sistema
- [ ] IT/Desarrollo
