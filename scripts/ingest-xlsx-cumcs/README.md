# Ingest CM-RE-1010 v2 -> Postgres CannTrace

Levanta el xlsx maestro de FIS (`gamp5/CM-RE-1010 Matriz Consolidada v2.xlsx`) a las tablas `registros_*` operativas + `xlsx_raw_rows` (captura cruda).

## Que hace

1. **Captura cruda** (todas las hojas con datos): cada fila del xlsx -> 1 fila en `xlsx_raw_rows` con la fila entera en JSON. Garantiza que nada se pierde.
2. **Captura estructurada** (10 hojas mapeadas en `mappings.yaml`): mismas filas, pero con columnas tipadas en su tabla operativa (registros_cosecha, registros_personal, etc.).
3. **Idempotente**: `fingerprint = sha256(codigo|sheet|fila|json)` guardado en `datos_extra.fingerprint`. Re-correr no duplica (indice unico parcial bloquea).

## Setup

```bash
cd scripts/ingest-xlsx-cumcs
npm install --no-save
```

Necesita Node 18+ (usa `fetch` nativo).

## Variables de entorno

- `SUPABASE_PAT` (obligatoria) — PAT de Supabase con permisos sobre el proyecto. Empieza con `sbp_`.
- `SUPABASE_PROJECT_REF` (opcional) — default `sqdqvhjlmdweuuncwlfb` (CannTrace).

## Uso

```bash
# Dry-run (no escribe, solo cuenta)
SUPABASE_PAT=sbp_... node ingest.mjs --dry-run

# Aplicar
SUPABASE_PAT=sbp_... node ingest.mjs --apply

# Re-ingestar (borra previo de este source_file primero)
SUPABASE_PAT=sbp_... node ingest.mjs --apply --reingest

# Una sola hoja
SUPABASE_PAT=sbp_... node ingest.mjs --apply --only CM-RE-0601

# xlsx alternativo
SUPABASE_PAT=sbp_... node ingest.mjs --apply --xlsx ./otra.xlsx
```

## Salida

```
[CM-RE-0601] codigo=CM-RE-0601 raw=982 struct=982 (->registros_cosecha)
[CM-RE-0605] codigo=CM-RE-0605 raw=1000 struct=1000 (->registros_cosecha)
...
=== REPORT ===
{ "total_raw": 4500, "total_struct": 3800, ... }
```

## Verificacion

```sql
-- Captura cruda total
SELECT count(*) FROM xlsx_raw_rows;

-- Cuanto se estructuro
SELECT 'cosecha' AS t, count(*) FROM registros_cosecha WHERE datos_extra->>'fingerprint_source'='CM-RE-1010-v2'
UNION ALL SELECT 'personal', count(*) FROM registros_personal WHERE datos_extra->>'fingerprint_source'='CM-RE-1010-v2'
UNION ALL SELECT 'mantenimiento', count(*) FROM registros_mantenimiento WHERE datos_extra->>'fingerprint_source'='CM-RE-1010-v2'
UNION ALL SELECT 'lab', count(*) FROM resultados_laboratorio WHERE datos_extra->>'fingerprint_source'='CM-RE-1010-v2'
UNION ALL SELECT 'documentales', count(*) FROM registros_documentales WHERE datos_extra->>'fingerprint_source'='CM-RE-1010-v2'
UNION ALL SELECT 'calidad', count(*) FROM registros_calidad WHERE datos_extra->>'fingerprint_source'='CM-RE-1010-v2';

-- Hojas que solo quedaron en raw (no mapeadas)
SELECT codigo_cumcs, count(*) FROM xlsx_raw_rows
GROUP BY codigo_cumcs ORDER BY codigo_cumcs;
```

## Agregar mas hojas mapeadas

Editar `mappings.yaml`. Cada entrada:

```yaml
CM-RE-XXXX:
  table: registros_xxx
  tipo: <discriminator>
  header_keywords: ['palabra1', 'palabra2']
  columns:
    etiqueta normalizada: nombre_columna_bd
    otra etiqueta: datos_extra.subkey
```

Las claves `header_keywords` y `columns` se normalizan: lowercase + strip + sin acentos + sin puntuacion. La fila header se identifica por la presencia de >=2 keywords.
