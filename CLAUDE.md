# CannTrace — Contexto para Claude Code

> Este archivo se carga automaticamente cuando Claude Code abre este repo.
> Contiene el estado actual del proyecto + reglas criticas. Mantener actualizado.

## Que es CannTrace

PWA de trazabilidad seed-to-sale para cannabis medicinal con validacion **GAMP5 Categoria 5**.

- **Cliente ancla**: FIS S.A.S. (Argentina)
- **Genetica**: PETE HOPE (Ka) — ~65 dias flora · esquejado ~14 dias
- **Sistemas**: RDWC (Flora 2 / SFL2) + COCO (Flora 1 / SFL1)
- **Developer**: OA Consultora

## Links

| Servicio | URL |
|---|---|
| App live | https://canntrace.pages.dev |
| GitHub | https://github.com/grancobud/canntrace |
| Supabase | https://supabase.com/dashboard/project/sqdqvhjlmdweuuncwlfb |
| CoA publico ejemplo | https://canntrace.pages.dev/traza/CL7 |
| Pitch deck | https://canntrace.pages.dev/pitch |

## Credenciales

> Las credenciales NO viven en el repositorio. Un secreto escrito en un archivo
> versionado queda en el historial de git para siempre, aunque despues se borre.
> Estas estuvieron aca hasta el 13/09/2026 y fueron rotadas.

| Servicio | Donde esta |
|---|---|
| Login admin | gestor de contrasenas |
| Login operador | gestor de contrasenas |
| Supabase Project ID | `SUPABASE_PROJECT_REF` (.env) |
| Supabase PAT | `SUPABASE_ACCESS_TOKEN` (.env, nunca commitear) |
| Cloudflare Token | `CLOUDFLARE_API_TOKEN` (.env, nunca commitear) |

IMPORTANTE: usuarios se crean via API GoTrue `/auth/v1/signup`, NO SQL directo.

## Stack

- **Frontend**: React 19 · Vite 8 · Tailwind CSS 4 (con @theme) · shadcn/ui · TypeScript 6
- **State/Data**: @tanstack/react-query · @tanstack/react-table · @tanstack/react-virtual
- **Forms**: react-hook-form + zod + @hookform/resolvers
- **Motion**: framer-motion (easing cubic-bezier(0.22, 1, 0.36, 1) as const)
- **UI libs**: sonner (toasts) · vaul (drawers) · cmdk (command palette) · nuqs (URL state)
- **Backend**: Supabase (Postgres + Auth + Storage + RLS + RPCs) · MFA TOTP
- **Charts**: @tremor/react · recharts · @nivo/sankey · @nivo/heatmap · react-chrono
- **Visual**: ReactFlow (arbol) · bpmn-js (procesos) · FullCalendar · react-qr-code · bwip-js
- **Export**: ExcelJS · OpenTHC CRE v2018
- **Offline**: Dexie (IndexedDB) · vite-plugin-pwa
- **Deploy**: Cloudflare Pages (TLS 1.3 edge global)

## Rutas de codigo

```
F:/gaston-workspace/cannabis-trazabilidad/
├── src/frontend/canntrace-app/       ← React app principal
│   ├── src/
│   │   ├── pages/                    ← 30+ paginas
│   │   ├── components/
│   │   │   ├── ui/                   ← data-table, filter-bar, progress-ring, empty-state, loading-states
│   │   │   └── layout/               ← Layout, Sidebar, Header, BottomNav, PageTransition
│   │   ├── hooks/                    ← useAuth, useConfirm, useDarkMode, useOnlineStatus
│   │   ├── lib/                      ← supabase, servicios, schemas (zod), queryClient
│   │   └── types/
│   ├── public/                       ← favicon, og-image.svg, manifest, _headers, _redirects
│   ├── index.html                    ← SEO + OG + JSON-LD
│   ├── tsconfig.app.json             ← ignoreDeprecations 6.0 + baseUrl
│   └── vite.config.ts
└── docs/                             ← documentacion GAMP5
```

## Reglas criticas

### Desarrollo
- `npm install --legacy-peer-deps` SIEMPRE (React 19 requiere esto)
- `npm run build` corre `tsc -b && vite build` — **debe quedar limpio**
- Motion variants con `ease: [0.22, 1, 0.36, 1] as const` (framer-motion Variants)
- **Primary color**: siempre `primary-700` (no `primary-600`)
- **Tokens semanticos**: `bg-white dark:bg-surface-900` (no glassmorphism `bg-surface-900/40`)
- **Typography**: Inter (body), Space Grotesk (display), JetBrains Mono (codigos lote `font-mono tabular-nums`)

### Deploy
```bash
CLOUDFLARE_API_TOKEN="$CLOUDFLARE_API_TOKEN" \
npx wrangler pages deploy dist --project-name canntrace --branch master --commit-dirty=true
```

**NO DEPLOYAR sin permiso explicito** de Gaston.

### Datos
- **NO inventar datos**. Si no hay: "sin registro" o estimar con nota clara
- **Flora 1 (SFL1) = COCO**, **Flora 2 (SFL2) = RDWC**
- Fechas deben **ENCADENAR** cronologicamente
- Trazabilidad es **INVERSA** (sale-to-seed)
- Camadas reales: **C7 C9 C11 C12 C15 C16** (C8 y C10 NO existen; C13/C14 solo madres PM8/PM9)

### Compliance
- Audit log SHA-256 encadenado (21 CFR Part 11 / EU-GMP Annex 11 / ALCOA+)
- Tabla `audit_log` es **append-only** — triggers bloquean UPDATE/DELETE
- RLS activo en todas las tablas (23 tablas con multi-tenancy por `tenant_id`)
- 2FA TOTP nativo Supabase MFA disponible en `/configuracion` tab Seguridad

## Estado actual (17/abril/2026 — sesion noche)

### Sprints completados
| Sprint | Estado | Contenido |
|---|---|---|
| **Sprint 0** Public face | ✅ | Landing, Login split-screen, Password reset, 2FA TOTP, SEO+OG, Contacto con BD, Docs+FAQ, Sidebar 6 grupos |
| **Sprint 1** Fundacion visual | ✅ | Paleta #0D6B4E esmeralda + #C49A2C dorado, tokens semanticos, skeletons, sonner+useConfirm, EmptyState, a11y |
| **Sprint 2** Data patterns | ✅ | Breadcrumbs, DataTable TanStack, TanStack Query, Cmdk grupos+atajos, Dashboard period selector, FilterBar chips, Progress ring |
| **Sprint 3** Refinamiento | ✅ | BottomNav mobile, framer-motion, Suspense granular, Optimistic UI, RHF+zod Forms |
| **Extras** | ✅ | CoA publico rewrite, 404 page, Pitch deck `/pitch`, Legal `/terminos` + `/privacidad`, og-image.svg |

### TypeScript
**100% limpio** — `npm run build` corre `tsc -b && vite build` sin errores.

### Paginas publicas (10)
`/` (Landing) · `/login` · `/olvide-contrasena` · `/reset-contrasena` · `/contacto` · `/docs` · `/pitch` · `/terminos` · `/privacidad` · `/traza/:codigo` (CoA)

### Paginas core autenticadas (24)
Panel, Dashboard BI, Stock, Trazabilidad, Alertas, AuditTrail/:id, SOPs, TrazInversa, GAMP5, CultivoCalc, Mapa, Arbol, Registros CUMCS, Forms G08+G10, REPROCANN, Configuracion, Metricas, Operacion, Historial, Escaner, Calendario, Procesos BPMN, Importador, EtiquetasQR

### Componentes UI reutilizables
- `components/ui/data-table.tsx` — TanStack Table generica (sort, filter, virtual, density, pagination)
- `components/ui/filter-bar.tsx` — chips removibles AnimatePresence
- `components/ui/progress-ring.tsx` — SVG circular animado (5 variants)
- `components/ui/empty-state.tsx` — estado vacio con CTAs
- `components/ui/loading-states.tsx` — 6 skeletons (KpiCard, TableRow, Chart, KpiGrid, BentoKpi, TrazabilidadCards)
- `components/ui/skeleton.tsx` — primitivo shadcn
- `hooks/useConfirm.tsx` — AlertDialog imperativo (reemplaza `confirm()` nativo)
- `components/layout/PageTransition.tsx` — AnimatePresence para rutas
- `components/layout/BottomNav.tsx` — 5 items mobile con badge alertas
- `components/TwoFactorSetup.tsx` — Supabase MFA enroll+verify
- `lib/schemas.ts` — zod centralizados (contactoSchema, olvideContrasenaSchema, resetPasswordSchema, operacionBaseSchema, totpCodeSchema, loteSchema)
- `lib/queryClient.ts` — TanStack QueryClient con staleTime 30s

### Supabase cambios recientes
- Tabla `contactos` con RLS (INSERT publico con validacion email/nombre/mensaje; SELECT/UPDATE admin+supervisor)
- 17 funciones publicas parcheadas con `SET search_path = public, pg_catalog` (fix advisor WARN)
- Supabase MFA TOTP activo

### Sesion 18/04/2026 tarde/noche - batch posterior

**Todo lo nuevo deployado**:
- `bg-primary-50` → `bg-primary-100` en todas las paginas (primary-50 era casi blanco). Landing hero gradient fix.
- **Dark mode POR DEFECTO** — `useDarkMode` default true, script inline antipath en index.html (evita flash blanco), toggle sol/luna en landing.
- **Login con 4 roles** de vuelta (Admin violeta / Supervisor azul / Operador verde / Auditor ambar, grid 2x2 debajo del form).
- **Fase 1 chat AI OPERATIVA**: `OPENROUTER_API_KEY` seteada, cascade ampliado a `openrouter/free` router + 8 fallbacks con retry 2x. `gemma-3-27b` descartado (no soporta tools). `tool_choice: 'auto'` (forzado era rechazado por algunos providers). `modelo_usado` captura el modelo real que respondio (ej `nvidia/nemotron-nano-9b-v2:free`).
- **Lag /operacion fixed**: `PaginaOperacion` lazy-load tabs + `ChatOperacion` query liviana (id, codigo_lote, estado, limit 200) en vez del `stockService.getLotes` con joins pesados.
- **40 archivos subidos a Supabase Storage** via `scripts/upload_to_storage.mjs` (gamp5/ validation/ scripts/ memoria-claude/).

### Sesion 18/04/2026 noche - Fase 1 AI-asistido

Chat de Nueva Operacion puede extraer campos estructurados de texto libre via OpenRouter.

**Entry point**: `/operacion` → tab "Chat rapido" → boton **"Decilo en una frase (IA)"** arriba del selector de area.

**Arquitectura**:
- Edge Function `supabase/functions/ai-extract-operacion/` (Deno) — primary `meta-llama/llama-3.3-70b-instruct:free`, fallback `google/gemma-3-27b-it:free`, tool-use con schema JSON.
- Cliente `src/lib/aiExtract.ts` invoca via `supabase.functions.invoke`.
- UI: `InputLibreAI.tsx` (textarea + ejemplos + spinner) → `PreviewExtraccion.tsx` (7 campos editables + badge confianza).
- `ChatOperacion.tsx` recibe la extraccion y mapea a slots CUMCS, salta a paso "responsable", audit `datos_extra.{via_ai, modelo_ia, prompt_original, prompt_version}`.

**Setup pendiente (Gaston)**:
```bash
# 1. Conseguir key de openrouter.ai/settings/keys (gratis, sin tarjeta)
# 2. Setear secret
SUPABASE_ACCESS_TOKEN=$SUPABASE_ACCESS_TOKEN npx supabase secrets set OPENROUTER_API_KEY=sk-or-v1-... --project-ref sqdqvhjlmdweuuncwlfb
```

**Estado**: Edge Function deployada (responde `{"error":"OPENROUTER_API_KEY no configurada"}` hasta setear secret). Frontend live en https://canntrace.pages.dev.

**Rate limits OpenRouter free**: 20 req/min + 200 req/dia por modelo. Con 2 modelos en cascade → 400 extracciones/dia. FIS tipicamente 50-100 ops/dia → sobra.

### Sesion 18/04/2026 - batch completo
Features + perf + infra:
- **CoA Parser** `/coa-parser` — upload PDF lab, regex cannabinoides/terpenos/controles/metadatos, guarda en `resultados_laboratorio` asociado a lote. CoA publico `/traza/:codigo` mergea datos reales si existen.
- **Scanner real** `/escaner` con `@zxing/browser` (QR + DataMatrix + Code128/39 + EAN13), multi-device, parse GS1/URL, multi-modo. Pasa codigos al Chat Operacion via sessionStorage.
- **BuscadorGlobal Cmd+K**: grupo "Alertas por tipo" + 8 rutas nuevas en Navegacion.
- **Sidebar semaforo** rojo/amarillo/verde al pie + grupo "Acceso rapido" arriba con Nueva Op + Escaner. BottomNav mobile con dot semaforo sobre Alertas.
- **Dashboard SparkAreaChart** en KPI hero "Stock final" segun periodo.
- **Metricas**: tabs lazy-loaded (Sankey 187KB + Heatmap 70KB + Timeline 186KB), comparador camadas con border-left color por sistema (RDWC azul / COCO ambar), accent-500 dorado selector.
- **PaginaEtiquetasQR fix**: `react-qr-code` v2.0.18 double-CJS-wrap con `isComponent()` detector `$$typeof`. `GS1Modal` extraido con `bwip-js` 913KB lazy.
- **exceljs** lazy-loaded en PaginaTrazabilidad + PaginaImportador (-930KB off main bundle).
- **PWA reactivada**: `src/lib/pwa.ts` con `registerSW` + sonner prompts. Workbox genera `dist/sw.js`.
- **Offline sync**: `colaSync()` + `useColaSync` hook con auto-sync al volver online, EstadoConexion con retry manual.
- **Dark mode**: 23 reglas `!important` migradas a `@layer utilities`.
- **SOPs**: boton "Nueva version" con auto-increment X.Y y prefill.
- **Alertas**: "+N mas" ahora es expandible.
- **Operacion**: segmented control con motion layoutId.
- **Panel**: fondo `bg-primary-50` (verde menta).

Testing + infra:
- **Playwright E2E**: `e2e/smoke.spec.ts` (10 tests anonimos) + `e2e/authenticated.spec.ts` (9 tests con admin login). GitHub Action push + diario 06:00 UTC.
- **Worker backup** Cloudflare: `workers/backup-supabase/` con cron domingo 03:00 UTC, REST API + CompressionStream + R2 put. Trigger manual via `X-Manual-Trigger`. Alternativa en `scripts/backup-supabase-to-r2.mjs` + `.github/workflows/backup-supabase.yml`.
- **SQL migration** `supabase/migrations/20260418_populate_lote_padre_id.sql` — 2 pasadas para llenar FK genealogica desde `datos_extra.viene_de`.

### Git
- Master pushed: ultimos commits de la sesion 18/04.
- Backup branch: `backup/pre-rediseno-20260417-1953`.

## Pendientes (no bloqueantes)

### Setup manual del usuario
- **R2 bucket**: habilitar R2 en Cloudflare Dashboard (one-click) → `wrangler r2 bucket create canntrace-backups`
- **Worker backup**: setear secrets `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` (de Supabase Dashboard > Settings > API), `ADMIN_TOKEN` → `npm run deploy` en `workers/backup-supabase/`
- **Alternativo GitHub Action**: 3 secrets en repo (SUPABASE_DB_URL, CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID)
- **SQL migration lote_padre_id**: correr via Supabase SQL Editor o `supabase db push` cuando este listo.

### Features nuevas que NECESITAN input del cliente
- REPROCANN report semestral (datos reales ANMAT Res 1780/2025)
- Kushy Strain Dataset (API key)
- Vademecum ANMAT (CSV mensual)
- WhatsApp/Telegram alertas (numeros + bot token)
- AFIP/ARCA facturacion (inscripcion + CUIT)
- IoT ESP32 + MQTT (hardware ~USD 200)

### Polish opcional remanente
- PaginaChecklistCUMCS (662 lines) — funcional, solo color polish hecho
- PaginaAutoAuditoria (622 lines) — funcional, PDF engine intacto
- Feedback audio cliente pendiente: tooltips "Coco Coco C", cuadros secado C11, diferencia QR vs Etiquetas, comparador camadas con mas color (✓ hecho parcial)

### Performance
Todo optimizado — ver bundle report: `PaginaEtiquetasQR` shell tiny, `PaginaMetricas` shell tiny, chunks pesados cargan a demanda.

### Datos operativos por cargar
- Tabla `resultados_laboratorio` vacia (cargar analisis reales)
- Poblar `lote_padre_id` desde `datos_extra.viene_de` (arbol con aristas reales)
- Configurar REPROCANN numero + responsable tecnico en `/reprocann`

## MCPs Cloudflare (para debug/monitoring)

Configurados en Claude Desktop (`claude_desktop_config.json`):
- `cloudflare-builds`: `https://builds.mcp.cloudflare.com/mcp` (ver builds)
- `cloudflare-observability`: `https://observability.mcp.cloudflare.com/mcp` (logs + analytics)
- ~~cloudflare-bindings~~ descartado (bug OAuth cuentas personales) — usar wrangler CLI para R2/KV/D1

## Skills instaladas (Claude user-level `~/.claude/`)

- **superpowers** (obra/superpowers) — 14 workflow skills: brainstorming, writing-plans, executing-plans, subagent-driven-development, dispatching-parallel-agents, test-driven-development, systematic-debugging, verification-before-completion, requesting/receiving-code-review, using-git-worktrees, using-superpowers, writing-skills
- **CCDK** (peterkrueck) — review-work, update-docs, prime, merge + security-scan hook
- **ui-ux-pro-max** (nextlevelbuilder) — 67 estilos, 96 paletas, shadcn MCP integration
- **frontend-design** (Anthropic oficial) — direccion estetica anti-slop

## Memorias en Claude (user-level)

Archivos en `C:\Users\Gaston\.claude\projects\F--\memory\`:
- `canntrace_proyecto.md` — estado general (este archivo es el gemelo commiteado)
- `canntrace_sesion_17042026_noche.md` — **ULTIMA** rediseño 19 deploys
- `canntrace_sesion_17042026_tarde.md` — mega batch 12+ paginas nuevas
- `canntrace_sesion_17042026.md` — sesion 4 audit log + QR publico
- `canntrace_sesion_16042026.md` — 6 camadas trazadas
- `canntrace_prompt_nueva_sesion.md` — prompt listo para continuar

## Design system (actual)

### Paleta
```css
--color-primary-700: #0D6B4E;  /* esmeralda medicinal - principal */
--color-accent-500:  #C49A2C;  /* dorado - GAMP5 badges, trust signals */
--color-surface-*;              /* escala slate con tinte verdoso en claros */
```

### Tipografia
```css
--font-sans: 'Inter', system-ui;
--font-mono: 'JetBrains Mono'; /* codigos de lote, tabular-nums */
--font-display: 'Space Grotesk'; /* h1/h2/h3 */
```

### Motion
- Easing: `cubic-bezier(0.22, 1, 0.36, 1)` as const
- Duration: 0.3-0.5s
- Stagger children: 0.05-0.08s
- `whileInView` con `viewport={{ once: true, margin: '-100px' }}`

### Layout
- Cards: `bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl`
- Hover: `hover:shadow-md hover:border-primary-300 dark:hover:border-primary-700 hover:-translate-y-0.5 transition-all`
- Icons: 40-44px (w-10/w-11 h-10/h-11) en rounded-xl con bg-primary-100/primary-900-40

## Para continuar en nueva sesion

Lee:
1. Este archivo (`CLAUDE.md`)
2. `~/.claude/projects/F--/memory/canntrace_sesion_17042026_noche.md` (historia completa de la ultima sesion)

O pega el prompt de `~/.claude/projects/F--/memory/canntrace_prompt_nueva_sesion.md`.

---

**Ultima actualizacion**: 19 de abril de 2026 TARDE (commits 8271680 → 422722f) — MEGA batch post P2.

---

## SESION 19/04/2026 TARDE — MEGA BATCH (15+ commits)

### Agent IA evolucionado v1.2 → v1.3 → v1.4
- **v1.2.0** (bbc7e96): TABLA_SCHEMA dinamico, tools tolerantes a tablas sin camada, nueva tool `countRecords`
- **v1.3.0** (330e0b4): memoria conversacional cross-sesion — lee chat_sessions, genera resumen cada 20 turnos via LLM
- **v1.4.0** (2b9dc29): auto-confirm optimista — si last_cumcs coincide + total_turnos>=10, `proposeInsert` devuelve `auto_confirm_eligible:true` y el LLM llama `confirmInsert` directo

### Cascade LLM 9 providers
`supabase/functions/_shared/llm-cascade.ts`:
Cerebras → Groq → SambaNova → NVIDIA → GitHub Models (gpt-4o-mini) → Together → Cloudflare Workers AI → Gemini → OpenRouter.

Secrets nuevos: GITHUB_TOKEN, TOGETHER_API_KEY, SAMBANOVA_API_KEY, CF_ACCOUNT_ID, CF_WORKERS_AI_TOKEN.

### Fix definitivo ChunkLoadError ("F5 en /operacion")
Root cause identificado: Vite hashea chunks, al deployar cambia hash, PWA con index cacheado intenta chunk viejo.

3 capas: `lazyWithRetry.ts` wrapper + 37 lazy() reemplazados + ErrorBoundary con auto-reload. UI amigable "Actualizacion disponible".

### Rutas nuevas
| Ruta | Pagina | Grupo |
|---|---|---|
| `/admin/registros` | Explorador Registros (view+edit+firma) | Administracion |
| `/cuaderno-campo` | Cuaderno ANMAT | Documentacion |
| `/forecasting` | Forecasting pragmatica | Calidad |

### Firma electronica 21 CFR Part 11
`src/components/FirmaElectronica.tsx`. Drawing pad canvas + password re-auth + SHA-256 + tabla `firmas_electronicas` (PNG base64).

### Presence Realtime
`src/hooks/usePresence.ts` + `PresenciaAvatars.tsx`. En /trazabilidad + /admin/registros.

### Infra
- **Backup GitHub Actions** funcionando (domingo 03:00 UTC, gpg AES-256, artifact 90 dias)
- **Bundle optimization**: index 281KB → 78KB, react-core 944KB → 178KB, 12 manual chunks en `vite.config.ts`
- **Checkout@v5** en los 3 workflows

### Data
- **51 lotes backfilled** por regla (CDS→FLO, COS→FLO, FLO→VEG, VEG→PM). 92/105 con padre.
- **964 campos historicos** recuperados via regex sobre datos_extra
- **Golden-set baseline 68%** (34/50), top fail `cantidad` 10/16

### Gotchas nuevos
- Supabase corre **Postgres 17.6** → pg_dump debe ser v17 (no 16, Ubuntu lo preinstala)
- Tabla `firmas_electronicas` YA EXISTIA con otro schema — usamos ALTER ADD COLUMN para agregar `firma_png_base64`
- CF Workers AI requiere **2 secrets** (ACCOUNT_ID + TOKEN) — caso especial en el cascade
- Despues de cada deploy, **hard refresh una vez** para bajar index fresh (chunks hash cambian)

### Pendientes POST-mega
**Polish (4-8h)**: PaginaChecklistCUMCS, PaginaAutoAuditoria, Mobile UX agent, expandir Playwright.
**Agent (1-2h)**: tune prompt `ai-extract-operacion` para cantidad, re-correr golden-set (target 80%).
**Cliente**: REPROCANN, IoT, Kushy, Vademecum (bloqueados esperando datos FIS).
**Pre-prod FIS**: IQ/OQ/PQ + Claude Haiku + BAA (solo cuando salgan de demo, 4-6 meses, $15-30k).

---

## Estado 19/04/2026 — P0 + P1 + P2 COMPLETOS (10 commits esta sesion)

### P0 — Bloqueantes cerrados

**P0.1** — `src/lib/camposChatCumcs.ts` con 84/84 CUMCS schemas (antes 35). Agregados G01(8), G04(3), G07(7) completos + parciales G02(+6), G03(+3), G05(+6), G06(+6), G09(+10).

**P0.2** — 4 tablas Postgres nuevas (G01/G02/G03/G06):
- `registros_condiciones_ambientales`
- `registros_trazabilidad`
- `registros_fertilizantes`
- `registros_cosecha`

Migrations versionadas:
- `20260419_create_cumcs_tables_g01_g02_g03_g06.sql`
- `20260419_fix_trigger_audit_log_search_path.sql` — fix bug "digest(text, unknown) does not exist" agregando `extensions` al search_path del trigger audit.

**P0.3** — `scripts/migracion-cumcs/` standalone con `package.json` propio:
- `inspect.mjs`: mapea 67 hojas con data del Excel maestro
- `migrate.mjs`: 3 CUMCS piloto default, flag `--all` para las 57
- Requiere `SUPABASE_SERVICE_ROLE_KEY`. NO EJECUTADO aun.

### P1 — Quick wins + mejoras Fase 1

- **P1.1** `temperature: 0` en Edge Functions (determinismo, primer paso GAMP5 PQ).
- **P1.2** `prompt_version` semver: `v1.2.0` (extract), `v1.1.0` (next-question), `v1.0.0` (agent). Git tag `prompt-v1.1.0`.
- **P1.3** `modelo_ia` real guardado (`openrouter/free → modelo-real:free`).
- **P1.4** `tests/llm-golden-set.json` con 50 casos + `tests/run-golden-set.mjs` con drift detection.
- **P1.5** Fase 1 hibrida: `follow_up_message` + `campos_faltantes` si hay gaps. UI bubble verde con icono MessageCircle.
- **P1.6** Router CUMCS dual-write (`src/lib/cumcsRouter.ts`): G01-G06 van a su tabla especifica ademas de operaciones.
- **P1.7** Chat guiado con preguntas IA: Edge Function `ai-next-question` + `src/lib/aiGuidedChat.ts` + toggle UI default ON.

### P2 — Agent multi-step (CORE FEATURE)

**P2.1** Cascade multi-proveedor `supabase/functions/_shared/llm-cascade.ts`:
- Cerebras → Groq → Gemini → OpenRouter
- Cada provider se activa si su env var existe (CEREBRAS_API_KEY, GROQ_API_KEY, GEMINI_API_KEY, OPENROUTER_API_KEY)
- 1 retry con backoff 1s en 429/503
- `prefer_tool_use: true` skipea Gemini (no soporta tools nativo)

**P2.2** Edge Function `supabase/functions/agent-cumcs/` con 6 tools + loop multi-step (max 8 steps):
- `tools-schema.ts` — definiciones OpenAI-style
- `tools-impl.ts` — handlers con validacion Zod-like (rangos numericos, camadas validas, required)
- `index.ts` — loop: user msg → LLM + tools → tool_calls → dispatch → tool_results → LLM razona → respuesta final

Las 6 tools:
1. `getContext(userId)` — memoria sesion previa
2. `getLatest(tabla, camada)` — ultimo registro
3. `checkMissingDates(tabla, camada, desde, hasta)` — fechas sin data
4. `getTableMetadata(codigo_cumcs)` — campos + rangos
5. `proposeInsert(codigo_cumcs, data)` — crea draft TTL 10min en `pending_inserts`
6. `confirmInsert(draft_id)` — ejecuta INSERT real + actualiza `chat_sessions`

Migration `20260419_create_agent_tables_sessions_drafts.sql`:
- `chat_sessions` (memoria por user_id)
- `pending_inserts` (drafts TTL 10min + Realtime)

**P2.3** UI chat + preview side-by-side (`src/components/chat/ChatAgent.tsx` + `src/lib/agentCumcs.ts`):
- Filtro previo: grid 10 grupos CUMCS con gradientes + icons Lucide
- Click grupo → sub-lista CUMCS
- Layout split: chat izquierda / preview derecha (desktop) o stack vertical (mobile)
- Realtime suscripcion a `pending_inserts` refresca preview en vivo con animacion verde por campo
- Botones "Confirmar y guardar" + "Cancelar draft"
- Tab "Agente IA (beta)" en `/operacion` (lazy-loaded)

**P2.4** Realtime + TanStack Query invalidation cross-pagina:
- Migration `20260419_enable_realtime_on_cumcs_tables.sql`: publication en 12 tablas
- Hook `src/hooks/useRealtimeInvalidation.ts` con `useGlobalCumcsRealtimeInvalidation()`
- Montado en `Layout.tsx` → toda pagina abierta refresca sin F5

**P2.5** Alertas automaticas por umbral (`20260419_alertas_automaticas_por_umbral.sql`):
- Tabla `alertas_operativas` con severidad (info/warning/critical)
- Trigger `evaluar_alertas_ambientales`: temp, humedad, pH, EC, CO2, plagas, hongos
- Trigger `evaluar_alertas_cosecha`: rendimiento, humedad producto, sanidad
- Realtime habilitado → /alertas refresca sin F5

**P2.6** 1 test Playwright E2E del agent en `authenticated.spec.ts`.

### Arquitectura post-P2

```
UI React 19 → Edge Functions Supabase (Deno) → Postgres + RLS + audit hash-chain
                                             ↓
                                         Realtime broadcast
                                             ↓
                                   Invalidacion automatica en cliente
```

3 Edge Functions: `ai-extract-operacion`, `ai-next-question`, `agent-cumcs`.
Cascade LLM: hoy solo `OPENROUTER_API_KEY`. Agregar otras para mas velocidad/cuota.

### Pendientes para proxima sesion (priorizar)

1. Correr `tests/run-golden-set.mjs` para establecer baseline accuracy.
2. `cd scripts/migracion-cumcs && node migrate.mjs --dry-run` con `SUPABASE_SERVICE_ROLE_KEY` → despues real.
3. Extender `CUMCS_MAPEOS` en migrate.mjs para las 54 hojas restantes.
4. Setear CEREBRAS_API_KEY + GROQ_API_KEY en Supabase secrets.
5. Panel `/alertas` para mostrar `alertas_operativas` filtradas por severidad.
6. Voz a texto (Web Speech API) en ChatAgent.

### Pendientes pre-prod GAMP5 (cuando FIS salga de demo)

- P3.1 Claude Haiku 4.5 + BAA fecha-locked via Anthropic API direct (~$50-150/mes para 6M tokens).
- P3.2 IQ/OQ/PQ formal: test dataset 200-500 casos + 30 dias data real + TM-002.
- P3.3 Monitoreo continuo drift + change control.
