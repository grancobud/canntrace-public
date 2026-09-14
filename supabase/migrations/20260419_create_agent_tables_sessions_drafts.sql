-- Tablas auxiliares para el agent multi-step (P2.2):
--   chat_sessions: memoria conversacional entre sesiones por usuario
--   pending_inserts: drafts de inserts que esperan confirmacion humana (TTL 10 min)
--
-- Aplicada via mcp__supabase__apply_migration el 2026-04-19.

-- ============ chat_sessions ============
CREATE TABLE public.chat_sessions (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_cumcs varchar(20),
  last_tabla varchar(64),
  last_camada varchar(10),
  last_fecha_cargada date,
  pending_questions jsonb DEFAULT '[]'::jsonb,
  conversation_summary text,
  total_turnos int DEFAULT 0,
  actualizado_en timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.chat_sessions IS
  'P2.2 agent: memoria conversacional por usuario. 1 fila por user_id (upsert).';

ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY lectura_chat_sessions ON public.chat_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY upsert_chat_sessions ON public.chat_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY update_chat_sessions ON public.chat_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX idx_chat_sessions_actualizado ON public.chat_sessions (actualizado_en DESC);

-- ============ pending_inserts ============
CREATE TABLE public.pending_inserts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tabla_destino varchar(64) NOT NULL,
  codigo_cumcs varchar(20) NOT NULL,
  payload jsonb NOT NULL,
  preview_text text,
  zod_ok boolean DEFAULT true,
  zod_errors jsonb DEFAULT '[]'::jsonb,
  expira_en timestamptz NOT NULL DEFAULT (now() + interval '10 minutes'),
  creado_en timestamptz NOT NULL DEFAULT now(),
  confirmado_en timestamptz,
  confirmado_registro_id uuid,
  cancelado_en timestamptz
);

COMMENT ON TABLE public.pending_inserts IS
  'P2.2 agent: drafts con TTL 10 min que esperan confirmacion del usuario.';

ALTER TABLE public.pending_inserts ENABLE ROW LEVEL SECURITY;

CREATE POLICY lectura_pending ON public.pending_inserts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY crear_pending ON public.pending_inserts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY update_pending ON public.pending_inserts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX idx_pending_user_expira ON public.pending_inserts (user_id, expira_en)
  WHERE confirmado_en IS NULL AND cancelado_en IS NULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.pending_inserts;

CREATE OR REPLACE VIEW public.vista_drafts_activos AS
SELECT *
FROM public.pending_inserts
WHERE confirmado_en IS NULL
  AND cancelado_en IS NULL
  AND expira_en > now();

COMMENT ON VIEW public.vista_drafts_activos IS
  'Drafts pendientes de confirmacion. Respeta RLS de la tabla base.';
