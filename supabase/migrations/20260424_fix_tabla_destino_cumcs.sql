-- Fix tabla_destino para G01/G02/G03/G06
-- Las tablas registros_* fueron creadas el 19/04 (migration 20260419_create_cumcs_tables_g01_g02_g03_g06)
-- pero el catalogo tipos_registro_cumcs siguio apuntando a operaciones/lotes (datos genericos).
-- Esto realinea el catalogo con la realidad: cada CM-RE-XXXX apunta a su tabla operativa especifica.

BEGIN;

-- G01 - Condiciones Ambientales (8 codigos): todos a registros_condiciones_ambientales
UPDATE public.tipos_registro_cumcs
SET tabla_destino = 'registros_condiciones_ambientales'
WHERE codigo IN ('CM-RE-0101','CM-RE-0102','CM-RE-0103','CM-RE-0104',
                 'CM-RE-0105','CM-RE-0106','CM-RE-0107','CM-RE-0108');

-- G02 - Trazabilidad Productiva (11 codigos): todos a registros_trazabilidad
UPDATE public.tipos_registro_cumcs
SET tabla_destino = 'registros_trazabilidad'
WHERE codigo IN ('CM-RE-0201','CM-RE-0202','CM-RE-0203','CM-RE-0204','CM-RE-0205',
                 'CM-RE-0206','CM-RE-0207','CM-RE-0208','CM-RE-0209','CM-RE-0210',
                 'CM-RE-0211');

-- G03 - Fertilizantes e Insumos (6 codigos): mayoria a registros_fertilizantes,
-- 0306 (Demanda) queda en registros_documentales (es papeleria, no aplicacion).
UPDATE public.tipos_registro_cumcs
SET tabla_destino = 'registros_fertilizantes'
WHERE codigo IN ('CM-RE-0301','CM-RE-0302','CM-RE-0303','CM-RE-0304','CM-RE-0305');

-- 0306 ya esta en registros_documentales, no se toca.

-- G06 - Cosecha y Postcosecha (11 codigos): split por tipo
-- 0601-0606: tabulares de cosecha/postcosecha -> registros_cosecha
UPDATE public.tipos_registro_cumcs
SET tabla_destino = 'registros_cosecha'
WHERE codigo IN ('CM-RE-0601','CM-RE-0602','CM-RE-0603','CM-RE-0604',
                 'CM-RE-0605','CM-RE-0606');

-- 0607-0610: certificados/documentos de almacenamiento -> registros_documentales
UPDATE public.tipos_registro_cumcs
SET tabla_destino = 'registros_documentales'
WHERE codigo IN ('CM-RE-0607','CM-RE-0608','CM-RE-0609','CM-RE-0610');

-- 0611: certificado lote propagacion -> trazabilidad
UPDATE public.tipos_registro_cumcs
SET tabla_destino = 'registros_trazabilidad'
WHERE codigo = 'CM-RE-0611';

COMMIT;

-- Verificacion sugerida (no ejecuta, solo referencia):
-- SELECT grupo, tabla_destino, count(*)
-- FROM public.tipos_registro_cumcs
-- GROUP BY grupo, tabla_destino
-- ORDER BY grupo, tabla_destino;
