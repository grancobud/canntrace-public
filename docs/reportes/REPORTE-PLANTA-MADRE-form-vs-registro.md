# Reporte: Form `/operacion` vs Registro real (xlsx) — Planta Madre

> Comparación campo-por-campo de los 3 CM-RE de Planta Madre.
> Fuente del registro: `CM-RE-1010 Matriz Consolidada v2.xlsx` (parseado a `inputs/gaston/registros/CM-RE-XXXX.md`).
> Fuente del form: `src/components/operaciones/CamposCumcs.tsx` + `src/lib/camposChatCumcs.ts`.
> Generado: 24-04-2026.

---

## CM-RE-0101 — Condiciones Ambientales Planta Madre HIDRO (RDWC)

### Encabezado fijo del registro (xlsx)
- CULTIVO: Cannabis Medicinal *(constante)*
- SUSTRATO: RDWC *(= sistema)*
- VARIEDAD EN USO: Pete Hope *(default)*
- MES *(rango temporal)*
- FRECUENCIA DEL RIEGO
- SALA: Plantas Madres *(constante)*
- ID LOTE: 25.PM6 *(ej)*
- HS. LUZ
- ETAPA *(con nota "sensores 1 y 2")*

### Tabla diaria (xlsx)
| # | Campo xlsx | En form actual | Tipo | Nota |
|---|---|---|---|---|
| 1 | Fecha | ✅ `fecha` | date | OK |
| 2 | Sistema | ✅ `sistema` | select RDWC/COCO | OK |
| 3 | Humedad % | ✅ `humedad` | number | OK |
| 4 | Temperatura °C | ✅ `temperatura` | number | OK |
| 5 | T° A.A | ✅ `temp_aa` | number | OK |
| 6 | T° H2O | ✅ `temp_h2o` | number | OK |
| 7 | EC | ✅ `ec` | number | OK |
| 8 | pH Inicial | ✅ `ph_inicial` | number | OK |
| 9 | pH ML (+/-) | ✅ `ph_ml` | text | OK |
| 10 | pH Corregido | ✅ `ph_corregido` | text | OK |
| 11 | VPD (kPa) | ⚠️ `vpd` (form usa `vpd`, schema espera `vpd_kpa`) | number | **Mismatch nombre** |
| 12 | CO2 (ppm) | ⚠️ `co2` (form usa `co2`, schema espera `co2_ppm`) | number | **Mismatch nombre** |
| 13 | Ventilación | ✅ `ventilacion` | text | OK |
| 14 | Observaciones | ❌ **FALTA en CamposCumcs** (sí está en CAMPOS_CUMCS) | textarea | **Falta input** |

### Faltan en el form (vs encabezado del registro)
- ❌ `variedad` — no se pregunta, asume Pete Hope
- ❌ `frecuencia_riego` — no se pregunta
- ❌ `hs_luz` — no se pregunta
- ❌ `etapa` — no se pregunta
- ❌ `sala` — asume "Plantas Madres" implícito
- ❌ `id_lote` — sí está como input ✅

### Sobran en el form (vs registro)
- Ninguno significativo.

---

## CM-RE-0102 — Condiciones Ambientales Planta Madre COCO

### Encabezado fijo del registro (xlsx)
- CULTIVO: Cannabis Medicinal
- SUSTRATO: **COCO**
- SALA: Plantas Madres
- ETAPA *(múltiple por columna en el xlsx)*

### Diferencia clave vs 0101
El xlsx de 0102 agrega 2 columnas **fijas** a la izquierda de cada fila:
- **Identificación de planta madre** (ej `25.PM4`)
- **Variedad** (ej `Pete Hope`)

…y luego repite el bloque ambiental (Fecha, Sistema, Humedad, Temp, T°A.A, T°H2O, EC, pH, VPD, CO2, Ventilación, Observaciones) varias veces para distintos rangos temporales (la planilla del cliente registra varias mediciones por planta madre en columnas paralelas).

### Tabla
| # | Campo xlsx | En form actual | Estado |
|---|---|---|---|
| 1 | **Identificación PM** (`id_planta_madre`) | ❌ **FALTA** | **Falta** (CAMPOS_CUMCS lo declara, CamposCumcs no lo renderiza) |
| 2 | **Variedad** | ❌ **FALTA** input visible (default hardcoded "Pete Hope" en G02 vegetativa, no en G01) | **Falta** |
| 3 | Fecha | ✅ `fecha` | OK |
| 4 | Sistema | ✅ `sistema` (default Coco) | OK |
| 5-13 | Bloque ambiental (igual a 0101) | ✅ idéntico | OK |
| 14 | Observaciones | ❌ Falta input | **Falta** |

### Resumen 0102
- **Falta crítico**: `id_planta_madre`, `variedad`, `observaciones` como inputs visibles.
- El form hoy renderiza 0102 *idéntico* a 0101 — no respeta los 2 campos fijos extra.

---

## CM-RE-0201 — Trazabilidad Plantas Madres

### Encabezado del registro (xlsx)
- FIS S.A.S. — Código CM-RE-0201
- CÓDIGOS DE TRAZABILIDAD PLANTAS MADRES — Rev.: 02
- Ref. CUMCS IMC-GAP · Disposición 4159 ANMAT — Fecha: Abril/2026

### Columnas del registro (xlsx)
| # | Columna xlsx | En form actual | Estado |
|---|---|---|---|
| 1 | Código ID | ✅ `codigo_id` | OK |
| 2 | Fecha de ingreso | ✅ `fecha_ingreso` | OK |
| 3 | Fecha de baja | ✅ `fecha_baja` (con nota "vacío si vigente") | OK |
| 4 | Sistema | ✅ `sistema` (RDWC/COCO) | OK |
| 5 | Nº Clonación que da origen PM | ✅ `clonacion_origen` | OK |
| 6 | ID Madre que da origen | ✅ `madre_origen` | OK |

### Resumen 0201
- ✅ **6/6 campos**: el form **coincide exactamente** con el registro xlsx.
- Es el más limpio de los 3.

---

## Resumen general

| CM-RE | Coincidencia | Acción si querés simetría 100% |
|---|---|---|
| **CM-RE-0201** Trazabilidad PM | ✅ **100%** | Nada que tocar |
| **CM-RE-0101** Cond. Amb. Hidro | ⚠️ **~80%** | Renombrar `vpd→vpd_kpa`, `co2→co2_ppm`. Agregar input `observaciones`. Opcional: variedad, frecuencia_riego, hs_luz, etapa |
| **CM-RE-0102** Cond. Amb. Coco | ❌ **~65%** | Mismo que 0101 + agregar `id_planta_madre` y `variedad` upfront |

## Notas técnicas (para no romper data existente)

1. **Mismatch de keys (`vpd` vs `vpd_kpa`, `co2` vs `co2_ppm`)**: la tabla `registros_condiciones_ambientales` tiene columnas `vpd_kpa` y `co2_ppm`. El form guarda con keys `vpd`/`co2` que terminan en `datos_extra` (jsonb) en vez de las columnas top-level. Renombrar arregla esto.

2. **Si agregás campos al form**, también deberías:
   - Asegurar que `cumcsRouter.ts` los mapee a la columna correcta de `registros_condiciones_ambientales` (si existe la columna) o los deje en `datos_extra`.
   - Verificar que `CAMPOS_CUMCS` (camposChatCumcs.ts) los tenga, así el agente IA los pregunta.

3. **El registro tiene "encabezado fijo" + "tabla diaria"**: en una app no tiene sentido pedirle al operador que reingrese cultivo/sala/etapa cada vez. Conviene:
   - Encabezado fijo → setear default por instalación o por sesión.
   - Solo pedirle la fila diaria (los 14 campos de tabla).

## Próximos pasos sugeridos (cuando vos digas)

1. Aplicar fix en CM-RE-0101: rename `vpd→vpd_kpa`, `co2→co2_ppm`, agregar `observaciones`.
2. Aplicar fix en CM-RE-0102: lo mismo de 0101 + agregar `id_planta_madre` y `variedad` arriba.
3. Verificar guardado en Supabase: que las columnas top-level se llenen correctamente.
4. Smoke test: cargar 1 registro Hidro y 1 Coco, leer en `/admin/registros`, confirmar que aparecen completos.

---

# 🔎 Auditoría EXACTA de labels (form vs xlsx) — pedido del usuario

**Regla**: el label del input debe ser **idéntico** al header del xlsx original (incluyendo tildes, mayúsculas y artículos). Las planillas son documentos formales y el operador no se debe confundir.

## CM-RE-0101 — labels

| Header xlsx (original) | Label form actual | ¿Match? | Fix |
|---|---|---|---|
| `ID LOTE` | "ID Lote" | ❌ | → `ID LOTE` |
| `Fecha` | "Fecha" | ✅ | — |
| `Sistema` | "Sistema" | ✅ | — |
| `Humedad (%)` | "Humedad (%)" | ✅ | — |
| `Temperatura °C` | "Temperatura °C" | ✅ | — |
| `T° A.A` | "T° A.A" | ✅ | — |
| `T° H20` *(sic, así está en el xlsx)* | "T° H2O" | ❌ | → `T° H20` (respetar xlsx aunque sea typo) |
| `EC` | "EC" | ✅ | — |
| `pH Inicial` | "pH Inicial" | ✅ | — |
| `ML (pH+/-)` | "ML (pH+/-)" | ✅ | — |
| `pH Corregido` | "pH Corregido" | ✅ | — |
| `VPD (kpa)` *(sic, minúsculas)* | "VPD (kPa)" | ❌ | → `VPD (kpa)` (respetar xlsx) |
| `CO2 (ppm)` | "CO2 (ppm)" | ✅ | — |
| `Ventilación` | "Ventilacion" | ❌ | → `Ventilación` (agregar tilde) |
| `Observaciones` | (no input) | ❌ | → agregar input "Observaciones" |

**Total cambios 0101**: 5 labels a corregir + 1 input nuevo.

## CM-RE-0102 — labels

| Header xlsx (original) | Label form actual | ¿Match? | Fix |
|---|---|---|---|
| `Identificacion de planta madre` *(sic, sin tilde en xlsx)* | (no input) | ❌ | → agregar input `Identificacion de planta madre` |
| `Variedad` | (no input visible) | ❌ | → agregar input `Variedad` |
| Resto idéntico a 0101 | mismos labels que 0101 | mismos issues | mismos fixes |

**Total cambios 0102**: 2 inputs nuevos arriba + los 5 labels + 1 input observaciones de 0101.

## CM-RE-0201 — labels

| Header xlsx (original) | Label form actual | ¿Match? | Fix |
|---|---|---|---|
| `Código ID` | "Codigo ID *" | ❌ | → `Código ID *` (tilde) |
| `Fecha de ingreso` | "Fecha ingreso *" | ❌ | → `Fecha de ingreso *` (agregar "de") |
| `Fecha de baja` | "Fecha baja" | ❌ | → `Fecha de baja` (agregar "de") |
| `Sistema` | "Sistema *" | ✅ | — |
| `Nº Clonación que da origen PM` | "Nº Clonacion origen" | ❌ | → `Nº Clonación que da origen PM` (tilde + texto completo) |
| `ID Madre que da origen` | "ID Madre origen" | ❌ | → `ID Madre que da origen` (texto completo) |

**Total cambios 0201**: 5 labels a corregir.

## Resumen consolidado

| CM-RE | Labels a corregir | Inputs nuevos | Total |
|---|---|---|---|
| 0101 | 5 | 1 (`Observaciones`) | **6** |
| 0102 | 5 (heredados) | 3 (`Identificacion de planta madre`, `Variedad`, `Observaciones`) | **8** |
| 0201 | 5 | 0 | **5** |

**Convención que respeta xlsx (incluso typos)**:
- `T° H20` (no H2O) — así está en xlsx
- `VPD (kpa)` (minúsculas) — así está en xlsx
- `Identificacion de planta madre` (sin tilde) — así está en xlsx

Si querés "limpiar typos del xlsx" en el form, decime y los corregimos. Pero el pedido fue "respetar el formato formal" → mantener tal cual.

## Sobre `id_planta_madre` vs `id_lote`

Decisión confirmada por el usuario: **el nombre debe coincidir con el xlsx**. Por lo tanto:
- En **CM-RE-0101**: la key/label del input es `ID LOTE` (porque así dice el header del xlsx en el encabezado fijo de esa hoja).
- En **CM-RE-0102**: la key/label es `Identificacion de planta madre` (así dice la columna del xlsx).
- En **CM-RE-0201**: la key/label es `Código ID` (así dice la columna del xlsx).

Internamente en la base, la key del jsonb puede ser distinta (snake_case sin tildes para evitar problemas SQL), pero el label visible al operador debe ser exacto al xlsx.

**Sugerencia**: usar keys snake_case (`id_lote`, `id_planta_madre`, `codigo_id`) y labels exactos al xlsx. Así DB queda manejable y operador ve la planilla familiar.
