-- Funciones SQL para popular trazabilidad_snapshot con la lógica del frontend.
-- Calculan: año dinámico del PM, códigos jerárquicos, cantidades capadas a trim,
-- fechas, estado, stage actual.

CREATE OR REPLACE FUNCTION recalcular_snapshot_camada(p_camada text)
RETURNS trazabilidad_snapshot
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_camada_n text;
  v_pm record;
  v_year text;
  v_pm_code text;
  v_cl_code text;
  v_linea text;
  v_sistema text;
  v_sala text;
  v_sub_grupo text;
  v_base_jer text;
  -- Cantidades
  v_total_esqueje numeric := 0;
  v_total_vege numeric := 0;
  v_total_flora numeric := 0;
  v_total_alm_raw numeric := 0;
  v_total_trim numeric := 0;
  v_total_alm numeric := 0;
  v_yield_kg numeric;
  v_bolsas integer := 0;
  v_cuadros integer := 0;
  v_pad_len int := 2;
  -- Rangos
  v_vg_first int;
  v_vg_last int;
  v_cds_first int;
  v_cds_last int;
  -- Fechas
  v_fecha_pm date;
  v_fecha_esq_ini date;
  v_fecha_esq_fin date;
  v_fecha_vege_ini date;
  v_fecha_vege_fin date;
  v_fecha_flora_ini date;
  v_fecha_flora_fin date;
  v_fecha_cosecha date;
  v_fecha_secado_ini date;
  v_fecha_secado_fin date;
  v_fecha_trim date;
  v_fecha_cuar date;
  v_fecha_frac date;
  v_fecha_dep date;
  -- Estado
  v_estado text := 'en_proceso';
  v_stage_actual text := 'planta_madre';
  v_total_dias int := 0;
  v_has_vege boolean := false;
  v_has_flora boolean := false;
  v_has_cosecha boolean := false;
  v_has_secado boolean := false;
  v_has_trim boolean := false;
  v_has_cuar boolean := false;
  v_has_frac boolean := false;
  v_has_dep boolean := false;
  -- Auditoría
  v_fuente jsonb := '{}'::jsonb;
  -- Códigos calculados
  v_codigo_pm text;
  v_codigo_cl text;
  v_codigo_vg_first text;
  v_codigo_vg_last text;
  v_codigo_fl_first text;
  v_codigo_fl_last text;
  v_codigo_cds_first text;
  v_codigo_cds_last text;
  v_codigo_alm text;
  v_codigo_dep_first text;
  v_codigo_dep_last text;
  v_result trazabilidad_snapshot;
BEGIN
  -- Normalizar camada a "C9" (con prefijo)
  v_camada_n := CASE WHEN p_camada LIKE 'C%' THEN p_camada ELSE 'C' || p_camada END;

  -- 1) PM origen: registro con clonacion_origen=CL{camada}
  SELECT * INTO v_pm
  FROM registros_trazabilidad
  WHERE tipo = 'codigo_planta_madre'
    AND clonacion_origen = REPLACE(v_camada_n, 'C', 'CL')
    AND COALESCE((datos_extra->>'eliminada')::boolean, false) = false
  ORDER BY fecha ASC NULLS LAST
  LIMIT 1;

  IF v_pm.id IS NULL THEN
    -- No hay PM identificada para esta camada
    RAISE NOTICE 'Sin PM origen para camada %', v_camada_n;
    RETURN NULL;
  END IF;

  -- Componentes del código
  v_fecha_pm := v_pm.fecha;
  v_year := SUBSTRING(EXTRACT(YEAR FROM v_pm.fecha)::text FROM 3 FOR 2);
  v_pm_code := COALESCE((regexp_match(v_pm.cod_generico, 'PM\d+', 'i'))[1], 'PM' || REPLACE(v_camada_n, 'C', ''));
  v_cl_code := REPLACE(v_camada_n, 'C', 'CL');
  v_sistema := v_pm.sistema;
  v_sub_grupo := v_pm.datos_extra->>'sub_grupo';
  IF v_sub_grupo IS NOT NULL THEN
    v_fuente := v_fuente || jsonb_build_object('sub_grupo', v_sub_grupo);
  END IF;
  IF (v_pm.datos_extra->>'fecha_estimada')::boolean THEN
    v_fuente := v_fuente || jsonb_build_object('fecha_pm_estimada', true,
                                               'fecha_pm_original_bd', v_pm.datos_extra->>'fecha_original_bd');
  END IF;

  -- 2) Lotes y trazas para extraer rangos VG y CDS
  -- Trazas con cod_traza_cosecha (tabla registros_trazabilidad)
  -- VG range desde campo cod_traza_cosecha que mathea VG\d+ y camada C{N}
  WITH trz AS (
    SELECT regexp_matches(cod_traza_cosecha, 'VG(\d+)', 'i') AS m
    FROM registros_trazabilidad
    WHERE cod_traza_cosecha LIKE '%' || v_camada_n || '%'
       OR cod_traza_cosecha LIKE '%C0' || REPLACE(v_camada_n, 'C', '') || '%'
  )
  SELECT MIN((m[1])::int), MAX((m[1])::int)
    INTO v_vg_first, v_vg_last
  FROM trz;

  -- CDS range: cod_traza_trimeo que matchea CDS\d+ y camada
  WITH trz AS (
    SELECT regexp_matches(cod_traza_trimeo, 'CDS(\d+)', 'i') AS m
    FROM registros_trazabilidad
    WHERE cod_traza_trimeo LIKE '%' || v_camada_n
  )
  SELECT MIN((m[1])::int), MAX((m[1])::int)
    INTO v_cds_first, v_cds_last
  FROM trz;

  -- Linea desde primer cod_traza_cosecha
  SELECT (regexp_match(cod_traza_cosecha, 'Li(\d+)', 'i'))[1]
    INTO v_linea
  FROM registros_trazabilidad
  WHERE cod_traza_cosecha LIKE '%' || v_camada_n || '%'
     OR cod_traza_cosecha LIKE '%C0' || REPLACE(v_camada_n, 'C', '') || '%'
  LIMIT 1;
  IF v_linea IS NOT NULL THEN v_linea := 'Li' || v_linea; END IF;

  v_sala := CASE WHEN v_sistema = 'RDWC' THEN 'SF2' ELSE 'SF1' END;

  -- 3) Cantidades desde lotes
  -- Esqueje
  SELECT COALESCE(SUM(cantidad), 0), MIN((datos_extra->>'fecha_inicio')::date), MAX((datos_extra->>'fecha_fin')::date)
    INTO v_total_esqueje, v_fecha_esq_ini, v_fecha_esq_fin
  FROM lotes l
  JOIN productos p ON l.producto_id = p.id
  WHERE l.datos_extra->>'camada' = v_camada_n
    AND p.tipo_producto = 'esqueje';

  -- Vege (planta sin inicio_flora y no FLO)
  SELECT COALESCE(SUM(cantidad), 0), MIN((datos_extra->>'fecha_inicio')::date), MAX((datos_extra->>'fecha_fin')::date)
    INTO v_total_vege, v_fecha_vege_ini, v_fecha_vege_fin
  FROM lotes l
  JOIN productos p ON l.producto_id = p.id
  WHERE l.datos_extra->>'camada' = v_camada_n
    AND p.tipo_producto = 'planta'
    AND COALESCE((l.datos_extra->>'inicio_flora')::text, '') = ''
    AND COALESCE(l.codigo_lote, '') NOT LIKE 'FLO%';
  v_has_vege := v_total_vege > 0 OR v_fecha_vege_ini IS NOT NULL;

  -- Flora
  SELECT COALESCE(SUM(cantidad), 0), MIN((datos_extra->>'fecha_inicio')::date), MAX((datos_extra->>'fecha_fin')::date)
    INTO v_total_flora, v_fecha_flora_ini, v_fecha_flora_fin
  FROM lotes l
  JOIN productos p ON l.producto_id = p.id
  WHERE l.datos_extra->>'camada' = v_camada_n
    AND p.tipo_producto = 'planta'
    AND ((l.datos_extra->>'inicio_flora')::text != '' OR COALESCE(l.codigo_lote, '') LIKE 'FLO%');
  v_has_flora := v_total_flora > 0 OR v_fecha_flora_ini IS NOT NULL;

  -- Cosecha (lote COS-)
  SELECT MIN((datos_extra->>'fecha_inicio')::date)
    INTO v_fecha_cosecha
  FROM lotes l
  JOIN productos p ON l.producto_id = p.id
  WHERE l.datos_extra->>'camada' = v_camada_n
    AND p.tipo_producto = 'flor'
    AND l.codigo_lote LIKE 'COS-%';
  v_has_cosecha := v_fecha_cosecha IS NOT NULL;

  -- Cuadros de secado (lotes flor que NO son COS-)
  SELECT COUNT(*)
    INTO v_cuadros
  FROM lotes l
  JOIN productos p ON l.producto_id = p.id
  WHERE l.datos_extra->>'camada' = v_camada_n
    AND p.tipo_producto = 'flor'
    AND COALESCE(l.codigo_lote, '') NOT LIKE 'COS-%';
  v_has_secado := v_cuadros > 0;

  -- Trim total gramos
  SELECT COALESCE(SUM(cantidad), 0)
    INTO v_total_trim
  FROM lotes l
  JOIN productos p ON l.producto_id = p.id
  WHERE l.datos_extra->>'camada' = v_camada_n
    AND p.tipo_producto = 'flor_trimmeada';
  v_has_trim := v_total_trim > 0;

  -- Almacén / fraccionamiento
  SELECT COALESCE(SUM(cantidad), 0)
    INTO v_total_alm_raw
  FROM lotes l
  JOIN productos p ON l.producto_id = p.id
  WHERE l.datos_extra->>'camada' = v_camada_n
    AND p.tipo_producto = 'flor_fraccionada';
  v_has_frac := v_total_alm_raw > 0;
  v_has_dep := v_has_frac;  -- depósito es la misma data

  -- Cap: alm no puede crecer post-trim
  v_total_alm := CASE
    WHEN v_total_trim > 0 AND v_total_alm_raw > v_total_trim THEN v_total_trim
    ELSE v_total_alm_raw
  END;

  -- Bolsas
  v_bolsas := CASE WHEN v_total_alm > 0 THEN ROUND(v_total_alm / 400.0)::int ELSE 0 END;
  v_pad_len := CASE WHEN v_bolsas >= 100 THEN 3 ELSE 2 END;

  -- Yield kg
  v_yield_kg := CASE WHEN v_total_alm > 0 THEN v_total_alm / 1000.0 ELSE NULL END;

  -- Estado y stage actual (cascade desde el ultimo)
  IF v_has_dep THEN
    v_estado := 'completada';
    v_stage_actual := 'deposito';
  ELSIF v_has_frac THEN
    v_stage_actual := 'fraccionamiento';
  ELSIF v_has_trim THEN
    v_stage_actual := 'trimming';
  ELSIF v_has_secado THEN
    v_stage_actual := 'secado';
  ELSIF v_has_cosecha THEN
    v_stage_actual := 'cosecha';
  ELSIF v_has_flora THEN
    v_stage_actual := 'floracion';
  ELSIF v_has_vege THEN
    v_stage_actual := 'vegetativa';
  ELSIF v_total_esqueje > 0 THEN
    v_stage_actual := 'esquejado';
  END IF;

  -- 4) Construir códigos jerárquicos
  v_base_jer := v_year || '.' || v_pm_code || '.' || v_cl_code;
  IF v_linea IS NOT NULL THEN
    v_base_jer := v_base_jer || '.' || v_linea;
  END IF;

  v_codigo_pm := v_year || '.' || v_pm_code;
  v_codigo_cl := v_year || '.' || v_pm_code || '.' || v_cl_code;

  IF v_vg_first IS NOT NULL THEN
    v_codigo_vg_first := v_base_jer || '.VG' || LPAD(v_vg_first::text, 3, '0');
    v_codigo_vg_last  := v_base_jer || '.VG' || LPAD(COALESCE(v_vg_last, v_vg_first)::text, 3, '0');
    v_codigo_fl_first := v_base_jer || '.VG' || LPAD(v_vg_first::text, 3, '0') || '.' || v_sala;
    v_codigo_fl_last  := v_base_jer || '.VG' || LPAD(COALESCE(v_vg_last, v_vg_first)::text, 3, '0') || '.' || v_sala;
  END IF;

  IF v_cds_first IS NOT NULL THEN
    v_codigo_cds_first := v_base_jer || '.' || v_sala || '.CDS' || LPAD(v_cds_first::text, 2, '0');
    v_codigo_cds_last  := v_base_jer || '.' || v_sala || '.CDS' || LPAD(COALESCE(v_cds_last, v_cds_first)::text, 2, '0');
  END IF;

  -- Frac: ALM-Cn-Sistema-Bnn → Bnn
  IF v_bolsas > 0 THEN
    v_codigo_alm := 'ALM-' || v_camada_n || '-' || v_sistema || '-B' || LPAD('1', v_pad_len, '0') || ' → B' || LPAD(v_bolsas::text, v_pad_len, '0');
    v_codigo_dep_first := v_year || '.FIS.B' || LPAD('1', v_pad_len, '0');
    v_codigo_dep_last  := v_year || '.FIS.B' || LPAD(v_bolsas::text, v_pad_len, '0');
  END IF;

  -- Total días efectivos: hoy - fecha_pm si en proceso, fecha_dep - fecha_pm si completada
  v_total_dias := CASE
    WHEN v_estado = 'completada' AND v_fecha_dep IS NOT NULL THEN (v_fecha_dep - v_fecha_pm)
    ELSE (CURRENT_DATE - v_fecha_pm)
  END;

  -- 5) UPSERT en trazabilidad_snapshot
  INSERT INTO trazabilidad_snapshot (
    camada,
    codigo_pm, codigo_cl, codigo_vg_first, codigo_vg_last,
    codigo_fl_first, codigo_fl_last, codigo_cds_first, codigo_cds_last,
    codigo_alm, codigo_dep_first, codigo_dep_last,
    anio, pm_codigo, cl_codigo, linea, sistema, sala, sub_grupo,
    yield_kg, gramos_trim, gramos_alm_capado, bolsas_calculadas,
    cuadros_secado, plantas_esqueje, plantas_vege, plantas_flora,
    plantas_cosechadas,
    fecha_pm_ingreso, fecha_esqueje_inicio, fecha_esqueje_fin,
    fecha_vege_inicio, fecha_vege_fin, fecha_flora_inicio, fecha_flora_fin,
    fecha_cosecha,
    estado, stage_actual, total_dias_efectivos,
    fuente, ultima_recalculacion
  ) VALUES (
    v_camada_n,
    v_codigo_pm, v_codigo_cl, v_codigo_vg_first, v_codigo_vg_last,
    v_codigo_fl_first, v_codigo_fl_last, v_codigo_cds_first, v_codigo_cds_last,
    v_codigo_alm, v_codigo_dep_first, v_codigo_dep_last,
    v_year, v_pm_code, v_cl_code, v_linea, v_sistema, v_sala, v_sub_grupo,
    v_yield_kg, v_total_trim, v_total_alm, v_bolsas,
    v_cuadros, v_total_esqueje::int, v_total_vege::int, v_total_flora::int,
    v_total_flora::int,  -- plantas cosechadas = plantas que entraron a flora
    v_fecha_pm, v_fecha_esq_ini, v_fecha_esq_fin,
    v_fecha_vege_ini, v_fecha_vege_fin, v_fecha_flora_ini, v_fecha_flora_fin,
    v_fecha_cosecha,
    v_estado, v_stage_actual, v_total_dias,
    v_fuente, now()
  )
  ON CONFLICT (camada) DO UPDATE SET
    codigo_pm = EXCLUDED.codigo_pm,
    codigo_cl = EXCLUDED.codigo_cl,
    codigo_vg_first = EXCLUDED.codigo_vg_first,
    codigo_vg_last = EXCLUDED.codigo_vg_last,
    codigo_fl_first = EXCLUDED.codigo_fl_first,
    codigo_fl_last = EXCLUDED.codigo_fl_last,
    codigo_cds_first = EXCLUDED.codigo_cds_first,
    codigo_cds_last = EXCLUDED.codigo_cds_last,
    codigo_alm = EXCLUDED.codigo_alm,
    codigo_dep_first = EXCLUDED.codigo_dep_first,
    codigo_dep_last = EXCLUDED.codigo_dep_last,
    anio = EXCLUDED.anio,
    pm_codigo = EXCLUDED.pm_codigo,
    cl_codigo = EXCLUDED.cl_codigo,
    linea = EXCLUDED.linea,
    sistema = EXCLUDED.sistema,
    sala = EXCLUDED.sala,
    sub_grupo = EXCLUDED.sub_grupo,
    yield_kg = EXCLUDED.yield_kg,
    gramos_trim = EXCLUDED.gramos_trim,
    gramos_alm_capado = EXCLUDED.gramos_alm_capado,
    bolsas_calculadas = EXCLUDED.bolsas_calculadas,
    cuadros_secado = EXCLUDED.cuadros_secado,
    plantas_esqueje = EXCLUDED.plantas_esqueje,
    plantas_vege = EXCLUDED.plantas_vege,
    plantas_flora = EXCLUDED.plantas_flora,
    plantas_cosechadas = EXCLUDED.plantas_cosechadas,
    fecha_pm_ingreso = EXCLUDED.fecha_pm_ingreso,
    fecha_esqueje_inicio = EXCLUDED.fecha_esqueje_inicio,
    fecha_esqueje_fin = EXCLUDED.fecha_esqueje_fin,
    fecha_vege_inicio = EXCLUDED.fecha_vege_inicio,
    fecha_vege_fin = EXCLUDED.fecha_vege_fin,
    fecha_flora_inicio = EXCLUDED.fecha_flora_inicio,
    fecha_flora_fin = EXCLUDED.fecha_flora_fin,
    fecha_cosecha = EXCLUDED.fecha_cosecha,
    estado = EXCLUDED.estado,
    stage_actual = EXCLUDED.stage_actual,
    total_dias_efectivos = EXCLUDED.total_dias_efectivos,
    fuente = EXCLUDED.fuente,
    ultima_recalculacion = EXCLUDED.ultima_recalculacion
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$$;

-- Recalcular todas las camadas registradas
CREATE OR REPLACE FUNCTION recalcular_todos_snapshots()
RETURNS TABLE(camada text, ok boolean, error text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  c text;
BEGIN
  FOR c IN
    SELECT DISTINCT REPLACE(clonacion_origen, 'CL', 'C') AS cam
    FROM registros_trazabilidad
    WHERE tipo = 'codigo_planta_madre'
      AND clonacion_origen LIKE 'CL%'
      AND COALESCE((datos_extra->>'eliminada')::boolean, false) = false
    ORDER BY cam
  LOOP
    BEGIN
      PERFORM recalcular_snapshot_camada(c);
      camada := c; ok := true; error := NULL;
      RETURN NEXT;
    EXCEPTION WHEN OTHERS THEN
      camada := c; ok := false; error := SQLERRM;
      RETURN NEXT;
    END;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION recalcular_snapshot_camada(text) TO authenticated;
GRANT EXECUTE ON FUNCTION recalcular_todos_snapshots() TO authenticated;
