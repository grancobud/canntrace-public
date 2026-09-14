# CannTrace

**Trazabilidad de cannabis medicinal, construida para poder auditarse.** Cada
planta desde su esqueje, cada gramo hasta el paciente que lo recibió, y los
papeles que un organismo de control va a pedir.

---

## Lo primero, porque importa más que el código

**Este sistema se desarrolló y nunca llegó a implementarse.** No hay una
instalación en producción, no se ejecutaron los protocolos de validación y
ninguna área de Calidad aprobó nada.

Lo publico igual porque el trabajo que hay adentro es real y las decisiones se
pueden leer. Y porque de acá salió lo que vino después: el mismo enfoque,
reescrito, sí corre hoy en producción en una asociación civil argentina.

**El sistema no está validado.** Incluye el set documental para *poder*
validarse — que es otra cosa. Validar exige ejecutar los protocolos, cerrar los
desvíos y que Calidad apruebe el informe. Eso no ocurrió.

---

## Sobre los datos

Este repositorio **no contiene información de pacientes, socios ni operaciones
reales**. Los CUIT, números de registro y códigos que aparecen en el código son
marcadores (`30-XXXXXXXX-X`, `REP-XXXXXXXX`).

Las credenciales que alguna vez estuvieron escritas en el repositorio original
fueron rotadas, y este repositorio arranca con un historial nuevo justamente
para que no viajen en él. Si encontrás algo que parezca un dato real, es un
error y te agradezco el aviso.

---

## Qué resuelve

Una organización que cultiva cannabis medicinal en Argentina tiene que sostener
tres cosas a la vez, y las tres se pisan:

1. **El cultivo.** De qué madre salió cada planta, en qué etapa está, cuántos
   gramos rindió. Sin eso no hay genética trazable.
2. **La entrega.** Qué lote recibió cada paciente. Si no se puede reconstruir
   para atrás, no hay trazabilidad inversa.
3. **El papelerío.** Registros por formulario, informes periódicos,
   cromatografías por lote, nómina de usuarios.

Las tres se apoyan sobre el mismo dato, para que no haya tres planillas que se
contradicen.

---

## Decisiones que vale la pena mirar

### El control de acceso vive en la base, no en la interfaz

Los permisos son políticas de **Row Level Security de PostgreSQL**. Esconder un
ítem del menú es UX; no es una barrera. Si alguien evita la interfaz y pega
directo contra la API, lo que decide es el RLS.

Ver `supabase/migrations/20260819_rls_gamp5_select_solo_autenticados.sql`.

### Registro append-only

Las operaciones no se editan ni se borran: se corrigen con un asiento nuevo que
referencia al anterior. Un registro que se puede reescribir no prueba nada ante
una inspección. La auditoría usa `pgaudit` sobre el esquema
(`src/database/migrations/003_pgaudit_openthc.sql`).

### Estructuración asistida por IA, con el humano adelante

Los registros llegaban en planillas Excel con formatos distintos. Hay un agente
que propone el mapeo de columnas a campos de la base y **deja un borrador**, no
un asiento. La escritura la confirma una persona.

Ver `supabase/functions/agent-cumcs/` y `scripts/migracion-cumcs/`.

### Snapshot de trazabilidad recalculado por trigger

El estado de trazabilidad no se calcula al consultarlo: se mantiene en una tabla
que un trigger recalcula cuando cambia lo que la alimenta
(`supabase/migrations/20260425_trigger_recalcular_snapshot.sql`). Una consulta
que tarda es una consulta que nadie corre antes de una inspección.

### Set documental GAMP5

En `validation/` está la estructura completa: plan de validación, URS,
especificación funcional y de diseño, análisis de riesgos, protocolos IQ/OQ/PQ,
matriz de trazabilidad y los SOP. Escrito para que el sistema **pueda**
validarse. Repito lo de arriba: no se validó.

---

## Cómo está construido

| Capa | Tecnología |
|---|---|
| Frontend | React 19 · TypeScript · Vite · Tailwind · shadcn/ui |
| Datos | PostgreSQL vía Supabase, con RLS y pgaudit |
| Backend | Supabase Edge Functions (Deno) |
| Integraciones | Cloudflare Workers |
| Tests | Playwright (e2e) |

Construido con **Claude Code** sobre el repositorio real. El trabajo es definir
el problema, decidir la arquitectura y verificar el resultado contra los datos y
la operación reales.

---

## Cómo levantarlo

```bash
git clone <este-repo> && cd canntrace/src/frontend/canntrace-app
npm install
cp .env.example .env
```

Completá `.env` con las credenciales de tu propio proyecto de Supabase. Ningún
script de este repositorio trae credenciales incrustadas: si falta una variable,
aborta y te dice cuál.

```bash
npm run dev
```

### Base de datos

```bash
supabase link --project-ref <tu-project-ref>
supabase db push
```

Las migraciones están en `supabase/migrations/` y `src/database/migrations/`, en
orden cronológico.

---

## Estructura

```
src/database/migrations/   esquema inicial y auditoría
src/frontend/canntrace-app/  la aplicación
supabase/migrations/       esquema, RLS, triggers, snapshot
supabase/functions/        Edge Functions (incluye el agente)
scripts/                   migración e ingesta de planillas
validation/                set documental GAMP5 y SOPs
workers/                   Cloudflare Workers
tests/                     pruebas
```

---

## Licencia

Ver `LICENSE`.
