-- P2.5: Alertas automaticas por umbral
-- Crea tabla alertas_operativas + trigger que se dispara en INSERT/UPDATE
-- en registros_condiciones_ambientales y registros_cosecha.
-- Si algun parametro sale de rango fisico → inserta alerta con severidad y mensaje.
--
-- Aplicada via mcp__supabase__apply_migration el 2026-04-19.
-- Test verificado: registro con temp=35, humedad=90, pH=4.5, ec=5.2, co2=250
-- genera 5 alertas (3 critical, 2 warning).

CREATE TABLE IF NOT EXISTS public.alertas_operativas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tabla_origen varchar(64) NOT NULL,
  registro_id uuid NOT NULL,
  codigo_cumcs varchar(20),
  camada varchar(10),
  tipo_alerta varchar(40) NOT NULL,
  severidad varchar(20) NOT NULL,
  titulo varchar(200) NOT NULL,
  mensaje text NOT NULL,
  parametro varchar(40),
  valor_detectado numeric,
  rango_min numeric,
  rango_max numeric,
  resuelta boolean DEFAULT false,
  resuelta_por uuid REFERENCES auth.users(id),
  resuelta_en timestamptz,
  accion_tomada text,
  creado_en timestamptz NOT NULL DEFAULT now(),
  organizacion_id uuid DEFAULT '00000000-0000-0000-0000-000000000001'::uuid
);

COMMENT ON TABLE public.alertas_operativas IS
  'P2.5: alertas auto-generadas por triggers al detectar parametros fuera de rango.';

CREATE INDEX idx_alertas_resueltas ON public.alertas_operativas (resuelta, creado_en DESC);
CREATE INDEX idx_alertas_severidad ON public.alertas_operativas (severidad, creado_en DESC) WHERE NOT resuelta;
CREATE INDEX idx_alertas_camada ON public.alertas_operativas (camada, creado_en DESC);

ALTER TABLE public.alertas_operativas ENABLE ROW LEVEL SECURITY;

CREATE POLICY lectura_alertas_op ON public.alertas_operativas
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY update_alertas_op ON public.alertas_operativas
  FOR UPDATE USING (auth.uid() IS NOT NULL);

ALTER PUBLICATION supabase_realtime ADD TABLE public.alertas_operativas;

-- Trigger de condiciones ambientales: evalua temp/humedad/pH/EC/CO2/plagas/hongos
CREATE OR REPLACE FUNCTION public.evaluar_alertas_ambientales()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  IF NEW.temperatura IS NOT NULL THEN
    IF NEW.temperatura > 32 THEN
      INSERT INTO public.alertas_operativas (tabla_origen, registro_id, codigo_cumcs, camada, tipo_alerta, severidad, titulo, mensaje, parametro, valor_detectado, rango_max)
      VALUES (TG_TABLE_NAME, NEW.id, NEW.tipo, NEW.camada, 'temp_alta', 'critical',
        'Temperatura alta: ' || NEW.temperatura || '°C',
        'Temperatura registrada (' || NEW.temperatura || '°C) excede el maximo recomendado (32°C). Riesgo: estres termico, reduccion de calidad.',
        'temperatura', NEW.temperatura, 32);
    ELSIF NEW.temperatura < 16 THEN
      INSERT INTO public.alertas_operativas (tabla_origen, registro_id, codigo_cumcs, camada, tipo_alerta, severidad, titulo, mensaje, parametro, valor_detectado, rango_min)
      VALUES (TG_TABLE_NAME, NEW.id, NEW.tipo, NEW.camada, 'temp_baja', 'warning',
        'Temperatura baja: ' || NEW.temperatura || '°C',
        'Temperatura (' || NEW.temperatura || '°C) por debajo del minimo (16°C). Riesgo: crecimiento ralentizado.',
        'temperatura', NEW.temperatura, 16);
    END IF;
  END IF;

  IF NEW.humedad IS NOT NULL THEN
    IF NEW.humedad > 85 THEN
      INSERT INTO public.alertas_operativas (tabla_origen, registro_id, codigo_cumcs, camada, tipo_alerta, severidad, titulo, mensaje, parametro, valor_detectado, rango_max)
      VALUES (TG_TABLE_NAME, NEW.id, NEW.tipo, NEW.camada, 'humedad_alta', 'critical',
        'Humedad critica: ' || NEW.humedad || '%',
        'Humedad (' || NEW.humedad || '%) excede 85%. Riesgo muy alto: botrytis, oidio, podredumbre.',
        'humedad', NEW.humedad, 85);
    ELSIF NEW.humedad < 35 THEN
      INSERT INTO public.alertas_operativas (tabla_origen, registro_id, codigo_cumcs, camada, tipo_alerta, severidad, titulo, mensaje, parametro, valor_detectado, rango_min)
      VALUES (TG_TABLE_NAME, NEW.id, NEW.tipo, NEW.camada, 'humedad_baja', 'warning',
        'Humedad baja: ' || NEW.humedad || '%',
        'Humedad (' || NEW.humedad || '%) baja. Riesgo de estres hidrico en plantas.',
        'humedad', NEW.humedad, 35);
    END IF;
  END IF;

  IF NEW.ph_corregido IS NOT NULL AND (NEW.ph_corregido < 5.5 OR NEW.ph_corregido > 6.5) THEN
    INSERT INTO public.alertas_operativas (tabla_origen, registro_id, codigo_cumcs, camada, tipo_alerta, severidad, titulo, mensaje, parametro, valor_detectado, rango_min, rango_max)
    VALUES (TG_TABLE_NAME, NEW.id, NEW.tipo, NEW.camada, 'ph_fuera_rango', 'warning',
      'pH fuera rango: ' || NEW.ph_corregido,
      'pH (' || NEW.ph_corregido || ') fuera del rango optimo (5.5 - 6.5). Revisar absorcion de nutrientes.',
      'ph_corregido', NEW.ph_corregido, 5.5, 6.5);
  END IF;

  IF NEW.ec IS NOT NULL AND NEW.ec > 3.5 THEN
    INSERT INTO public.alertas_operativas (tabla_origen, registro_id, codigo_cumcs, camada, tipo_alerta, severidad, titulo, mensaje, parametro, valor_detectado, rango_max)
    VALUES (TG_TABLE_NAME, NEW.id, NEW.tipo, NEW.camada, 'ec_alta', 'warning',
      'EC alta: ' || NEW.ec,
      'EC (' || NEW.ec || ') alta. Riesgo toxicidad salina.',
      'ec', NEW.ec, 3.5);
  END IF;

  IF NEW.co2_ppm IS NOT NULL AND NEW.co2_ppm < 400 THEN
    INSERT INTO public.alertas_operativas (tabla_origen, registro_id, codigo_cumcs, camada, tipo_alerta, severidad, titulo, mensaje, parametro, valor_detectado, rango_min)
    VALUES (TG_TABLE_NAME, NEW.id, NEW.tipo, NEW.camada, 'co2_bajo', 'info',
      'CO2 bajo: ' || NEW.co2_ppm || ' ppm',
      'CO2 ambiental (' || NEW.co2_ppm || ' ppm) bajo el minimo recomendado (400 ppm).',
      'co2_ppm', NEW.co2_ppm, 400);
  END IF;

  IF NEW.presencia_insectos IS NOT NULL AND LOWER(NEW.presencia_insectos) IN ('si','sí','yes') THEN
    INSERT INTO public.alertas_operativas (tabla_origen, registro_id, codigo_cumcs, camada, tipo_alerta, severidad, titulo, mensaje)
    VALUES (TG_TABLE_NAME, NEW.id, NEW.tipo, NEW.camada, 'plaga_detectada', 'critical',
      'Insectos detectados en ' || NEW.tipo,
      'Presencia de insectos reportada. Requiere accion correctiva inmediata (revisar SOP-MIP).');
  END IF;

  IF NEW.presencia_hongos IS NOT NULL AND LOWER(NEW.presencia_hongos) IN ('si','sí','yes') THEN
    INSERT INTO public.alertas_operativas (tabla_origen, registro_id, codigo_cumcs, camada, tipo_alerta, severidad, titulo, mensaje)
    VALUES (TG_TABLE_NAME, NEW.id, NEW.tipo, NEW.camada, 'hongo_detectado', 'critical',
      'Hongos detectados en ' || NEW.tipo,
      'Presencia de hongos reportada. Aislar lote + lab analysis (LMR/microbiologia).');
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_alertas_cond_amb
  AFTER INSERT OR UPDATE ON public.registros_condiciones_ambientales
  FOR EACH ROW EXECUTE FUNCTION public.evaluar_alertas_ambientales();

-- Trigger de cosecha: rendimiento, humedad producto, sanidad
CREATE OR REPLACE FUNCTION public.evaluar_alertas_cosecha()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  IF NEW.peso_seco IS NOT NULL AND NEW.plantas_cosechadas IS NOT NULL AND NEW.plantas_cosechadas > 0 THEN
    DECLARE v_rendimiento numeric := (NEW.peso_seco * 1000) / NEW.plantas_cosechadas;
    BEGIN
      IF v_rendimiento < 40 THEN
        INSERT INTO public.alertas_operativas (tabla_origen, registro_id, codigo_cumcs, camada, tipo_alerta, severidad, titulo, mensaje, parametro, valor_detectado, rango_min)
        VALUES (TG_TABLE_NAME, NEW.id, NEW.tipo, NEW.camada, 'rendimiento_bajo', 'warning',
          'Rendimiento bajo: ' || ROUND(v_rendimiento, 1) || ' g/planta',
          'Rendimiento por planta (' || ROUND(v_rendimiento, 1) || ' g) bajo el minimo esperado (40 g). Revisar condiciones de cultivo.',
          'rendimiento_g_planta', v_rendimiento, 40);
      END IF;
    END;
  END IF;

  IF NEW.humedad_pct IS NOT NULL THEN
    IF NEW.humedad_pct > 13 THEN
      INSERT INTO public.alertas_operativas (tabla_origen, registro_id, codigo_cumcs, camada, tipo_alerta, severidad, titulo, mensaje, parametro, valor_detectado, rango_max)
      VALUES (TG_TABLE_NAME, NEW.id, NEW.tipo, NEW.camada, 'humedad_producto_alta', 'critical',
        'Humedad producto alta: ' || NEW.humedad_pct || '%',
        'Humedad del producto (' || NEW.humedad_pct || '%) excede 13%. Riesgo alto de proliferacion microbiana.',
        'humedad_pct', NEW.humedad_pct, 13);
    ELSIF NEW.humedad_pct < 7 THEN
      INSERT INTO public.alertas_operativas (tabla_origen, registro_id, codigo_cumcs, camada, tipo_alerta, severidad, titulo, mensaje, parametro, valor_detectado, rango_min)
      VALUES (TG_TABLE_NAME, NEW.id, NEW.tipo, NEW.camada, 'humedad_producto_baja', 'warning',
        'Producto muy seco: ' || NEW.humedad_pct || '%',
        'Humedad del producto (' || NEW.humedad_pct || '%) por debajo de 7%. Perdida de terpenos, calidad reducida.',
        'humedad_pct', NEW.humedad_pct, 7);
    END IF;
  END IF;

  IF NEW.cond_sanitaria IS NOT NULL AND LOWER(NEW.cond_sanitaria) LIKE '%no adecuad%' THEN
    INSERT INTO public.alertas_operativas (tabla_origen, registro_id, codigo_cumcs, camada, tipo_alerta, severidad, titulo, mensaje)
    VALUES (TG_TABLE_NAME, NEW.id, NEW.tipo, NEW.camada, 'sanidad_no_conforme', 'critical',
      'Condiciones sanitarias NO adecuadas',
      'Registrado "' || NEW.cond_sanitaria || '". Iniciar investigacion + CAPA.');
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_alertas_cosecha
  AFTER INSERT OR UPDATE ON public.registros_cosecha
  FOR EACH ROW EXECUTE FUNCTION public.evaluar_alertas_cosecha();
