# Migracion bulk Excel → Supabase (CUMCS)

Script para migrar las ~46k filas de `CM-RE-1010 Matriz Consolidada v2.xlsx` a las tablas `registros_*` de Supabase.

## Estado inicial

- Excel maestro: `F:/gaston-workspace/Gamp5/CM-RE-1010 Matriz Consolidada v2.xlsx` (93 hojas, 57 con data).
- Tablas Postgres destino (todas ya creadas, ver migration `20260419_create_cumcs_tables_g01_g02_g03_g06.sql`):
  - `registros_condiciones_ambientales` (G01, CM-RE-0101..0108)
  - `registros_trazabilidad` (G02, CM-RE-0201..0211)
  - `registros_fertilizantes` (G03, CM-RE-0301..0306)
  - `registros_agua` (G04, CM-RE-0401..0403) — pre-existente
  - `registros_fitosanitarios` (G05, CM-RE-0501..0507) — pre-existente
  - `registros_cosecha` (G06, CM-RE-0601..0611)
  - `registros_mantenimiento` (G07, CM-RE-0701..0707) — pre-existente
  - `registros_personal` (G08, CM-RE-0801..0810) — pre-existente
  - `registros_calidad` (G09, CM-RE-0901..0911) — pre-existente
  - `registros_documentales` (G10, CM-RE-1001..1010) — pre-existente

## Archivos

- `inspect.mjs` — Fase 0: inspecciona las 93 hojas, detecta header row, columnas, data ranges. Output: `reports/inspect-YYYYMMDD.json`. NO toca BD.
- `migrate.mjs` — Fase 3: ejecuta migracion bulk. Lee Excel stream, normaliza, valida, upsert con audit. Por defecto 3 CUMCS piloto; con `--all` migra todo.
- `mapeo.mjs` — Fase 1: mapeo columnas Excel → campos Postgres por CUMCS. Editable.

## Instalacion

```bash
cd F:/gaston-workspace/cannabis-trazabilidad/scripts/migracion-cumcs
npm install --legacy-peer-deps
```

## Uso

> **IMPORTANTE**: Los scripts corren desde `src/frontend/canntrace-app/` para resolver `exceljs`, `xlsx` y `@supabase/supabase-js` que estan en ese `node_modules`.

### 1. Fase 0 — Inspeccion (sin tocar BD)

```bash
cd F:/gaston-workspace/cannabis-trazabilidad/scripts/migracion-cumcs
node inspect.mjs
```

Genera `scripts/migracion-cumcs/reports/inspect-YYYYMMDD.json` con:
- Por cada hoja: usedRange, header row detectado, columnas inferidas, count de data rows.
- Usar para validar antes de migrar.

### 2. Fase 3 — Migracion dry-run (no escribe)

```bash
cd F:/gaston-workspace/cannabis-trazabilidad/src/frontend/canntrace-app
export SUPABASE_SERVICE_ROLE_KEY="..."  # desde Supabase Dashboard > Settings > API
node migrate.mjs --dry-run
```

### 3. Fase 3 — Migracion real (piloto 3 CUMCS)

```bash
node migrate.mjs
```

Por default migra: `CM-RE-0104` (ambiental vegetativa, ~2037 filas), `CM-RE-0401` (agua sanitizacion, ~998 filas), `CM-RE-0801` (personal capacitacion, ~1008 filas). Total ~4000 filas, ~2 min.

### 4. Fase 3 — Migracion completa (todas las 57 hojas con data)

**Requiere extender `CUMCS_MAPEOS` en `migrate.mjs`** con los mapeos de columnas Excel → campos DB para los 54 CUMCS restantes. El patron esta en los 3 piloto del archivo. Mapearlos tras correr inspect.mjs con los headers reales.

```bash
node migrate.mjs --all
```

Migra las 57 hojas con data. ~46k filas, 3-6 min con audit trigger activo.

### Flags

- `--dry-run` — no escribe a BD, solo reporta que haria.
- `--all` — migra todas las hojas (default: 3 piloto).
- `--sheet=CM-RE-XXXX` — migra solo esa hoja.
- `--verbose` — log por cada batch.
- `--force` — re-migrar incluso si el hash del Excel ya esta en `migration_log`.

## Idempotencia

- Cada tabla destino tiene UNIQUE index sobre `(tipo, fecha, ...)` — re-correr no duplica.
- Tabla `migration_log` (creada al primer run) guarda `source_hash` del Excel + rows por hoja.
- Fila que no pasa Zod/normalizer: registrada en `reports/errors-YYYYMMDD.jsonl`, NO aborta corrida.

## Limitaciones conocidas

- Las hojas con columnas "multi-sistema" lado a lado (ej CM-RE-0102 con 3 sistemas por fila) se reducen a 1 fila por sistema detectado. Revisar reporte de mapeo.
- Las camadas escritas como "la 7" o "7" se normalizan a "C7". Si aparecen "C8" o "C10" (invalidas en CannTrace), se registra como error y NO se inserta.
- Fechas serial Excel (numeros >20000) se convierten via `xlsx.SSF.parse_date_code`. Otras heuristicas: dd/mm/yyyy, yyyy-mm-dd, mm-dd-yy.
