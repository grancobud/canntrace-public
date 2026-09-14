-- Fix: trigger_audit_log() fallaba con "function digest(text, unknown) does not exist"
-- al INSERT en las nuevas tablas CUMCS (G01, G02, G03, G06).
--
-- Root cause: search_path del trigger era 'public, pg_catalog', pero pgcrypto.digest()
-- vive en schema 'extensions'. Tablas viejas funcionaban por accidente (session
-- search_path del usuario autenticado resolvia 'extensions'), pero con RLS enforcement
-- estricto + funcion SECURITY DEFINER el search_path del trigger se aplica literal.
--
-- Fix: (1) agregar 'extensions' al search_path, (2) cast explicito 'sha256'::text
-- para evitar el "unknown" fallback que confunde al resolver.
--
-- Aplicado via mcp__supabase__apply_migration el 2026-04-19.

CREATE OR REPLACE FUNCTION public.trigger_audit_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog, extensions
AS $$
DECLARE
  v_usuario_id UUID;
  v_usuario_email TEXT;
  v_datos_ant JSONB;
  v_datos_nue JSONB;
  v_registro_id TEXT;
  v_campos_mod TEXT[];
  v_hash_prev TEXT;
  v_hash_nue TEXT;
  v_payload TEXT;
BEGIN
  -- Capturar usuario actual
  BEGIN
    v_usuario_id := auth.uid();
    SELECT email INTO v_usuario_email FROM auth.users WHERE id = v_usuario_id;
  EXCEPTION WHEN OTHERS THEN
    v_usuario_id := NULL;
    v_usuario_email := 'sistema';
  END;

  -- Capturar datos
  IF TG_OP = 'DELETE' THEN
    v_datos_ant := to_jsonb(OLD);
    v_datos_nue := NULL;
    v_registro_id := COALESCE(OLD.id::text, '?');
  ELSIF TG_OP = 'UPDATE' THEN
    v_datos_ant := to_jsonb(OLD);
    v_datos_nue := to_jsonb(NEW);
    v_registro_id := COALESCE(NEW.id::text, '?');
    SELECT array_agg(key) INTO v_campos_mod
    FROM jsonb_each(v_datos_nue) WHERE v_datos_ant->key IS DISTINCT FROM value;
  ELSE -- INSERT
    v_datos_ant := NULL;
    v_datos_nue := to_jsonb(NEW);
    v_registro_id := COALESCE(NEW.id::text, '?');
  END IF;

  -- Hash anterior (cadena de bloques)
  SELECT hash_sha256 INTO v_hash_prev
  FROM audit_log ORDER BY id DESC LIMIT 1;
  v_hash_prev := COALESCE(v_hash_prev, 'GENESIS');

  -- Hash actual = SHA256(hash_anterior + tabla + registro + operacion + datos + usuario + fecha)
  -- Cast explicito 'sha256'::text para evitar "function digest(text, unknown)".
  v_payload := v_hash_prev || '|' || TG_TABLE_NAME || '|' || v_registro_id || '|' || TG_OP || '|'
    || COALESCE(v_datos_nue::text, 'null') || '|' || COALESCE(v_usuario_id::text, '') || '|' || NOW()::text;
  v_hash_nue := encode(extensions.digest(v_payload, 'sha256'::text), 'hex');

  -- Insert append-only
  INSERT INTO audit_log (
    usuario_id, usuario_email, tabla_nombre, registro_id, operacion,
    datos_anteriores, datos_nuevos, campos_modificados, hash_sha256, hash_anterior
  ) VALUES (
    v_usuario_id, v_usuario_email, TG_TABLE_NAME, v_registro_id, TG_OP,
    v_datos_ant, v_datos_nue, v_campos_mod, v_hash_nue, v_hash_prev
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;
