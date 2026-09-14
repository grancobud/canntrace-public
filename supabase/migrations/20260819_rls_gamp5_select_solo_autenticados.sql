-- Las policies de SELECT de las tres tablas GAMP5 estaban sobre el rol `public`
-- con `using (true)`. `public` incluye a `anon`, asi que cualquiera con la clave
-- publicable leia los datos sin login: ia_model_registry devolvia sus filas
-- —con endpoint_url de la infraestructura interna, autorizado_por y riesgo_datos—
-- a cualquiera que preguntara. capa_actions y change_requests daban cero solo
-- porque estaban vacias, no porque estuvieran protegidas.
--
-- Las policies de modificacion ya estaban bien (admin/supervisor) y no se tocan.
-- Ninguna vista publica del sitio lee estas tablas: las tres pantallas que las
-- usan exigen sesion y permiso.
--
-- Verificado antes y despues con la clave publicable: antes ia_model_registry
-- devolvia filas sin login, ahora las tres responden bloqueado, y un rol
-- authenticated sigue leyendo con normalidad.

drop policy if exists capa_select on public.capa_actions;
create policy capa_select on public.capa_actions
  for select to authenticated using (true);

drop policy if exists change_requests_select on public.change_requests;
create policy change_requests_select on public.change_requests
  for select to authenticated using (true);

drop policy if exists ia_model_registry_select on public.ia_model_registry;
create policy ia_model_registry_select on public.ia_model_registry
  for select to authenticated using (true);
