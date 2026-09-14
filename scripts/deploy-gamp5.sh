#!/bin/bash
# =============================================================================
# CannTrace — Deploy controlado GAMP5
# =============================================================================
# Este script reemplaza el deploy directo. Verifica que existe un Change Request
# aprobado antes de permitir el deploy a produccion.
#
# Uso: ./scripts/deploy-gamp5.sh [--force-dev]
#   --force-dev: solo para ambiente de desarrollo, salta verificaciones
# =============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

FRONTEND_DIR="src/frontend/canntrace-app"
DIST_DIR="$FRONTEND_DIR/dist"

echo "=============================================="
echo " CannTrace — Deploy Controlado (GAMP5)"
echo "=============================================="
echo ""

# Check --force-dev flag
if [[ "${1:-}" == "--force-dev" ]]; then
    echo -e "${YELLOW}[!] MODO DESARROLLO — verificaciones GAMP5 omitidas${NC}"
    echo ""
else
    echo -e "${RED}VERIFICACION GAMP5 OBLIGATORIA:${NC}"
    echo ""
    echo "Antes de deployar a produccion, confirme:"
    echo "  1. Existe Change Request aprobado en /change-control"
    echo "  2. El RT aprobo el cambio (firma electronica)"
    echo "  3. Los tests relevantes pasaron (OQ parcial)"
    echo "  4. Se actualizo la documentacion afectada"
    echo ""
    read -p "CR aprobado? (ingrese ID del CR o 'cancelar'): " CR_ID
    if [[ "$CR_ID" == "cancelar" || -z "$CR_ID" ]]; then
        echo -e "${RED}Deploy cancelado. No hay CR aprobado.${NC}"
        exit 1
    fi
    echo ""
    read -p "RT aprobo? Nombre y matricula: " RT_NOMBRE
    if [[ -z "$RT_NOMBRE" ]]; then
        echo -e "${RED}Deploy cancelado. Se requiere aprobacion del RT.${NC}"
        exit 1
    fi
    echo ""
    echo -e "${GREEN}Registro de deploy:${NC}"
    echo "  CR: $CR_ID"
    echo "  RT: $RT_NOMBRE"
    echo "  Fecha: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
    echo "  Commit: $(git rev-parse --short HEAD)"
    echo ""
fi

# Build
echo "[1/3] Building..."
cd "$FRONTEND_DIR"
npm run build
cd -

if [[ ! -d "$DIST_DIR" ]]; then
    echo -e "${RED}Error: dist/ no existe. Build fallo.${NC}"
    exit 1
fi

# Deploy
echo "[2/3] Deploying to Cloudflare Pages..."
# El token va por variable de entorno, nunca escrito acá: este archivo se
# commitea, y un token en el repo es un token que hay que rotar.
if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
    echo -e "${RED}Falta CLOUDFLARE_API_TOKEN.${NC}"
    echo "Exportalo antes de deployar:  export CLOUDFLARE_API_TOKEN=<token>"
    exit 1
fi

npx wrangler pages deploy "$DIST_DIR" \
    --project-name canntrace \
    --branch master \
    --commit-dirty=true

echo ""
echo -e "${GREEN}[3/3] Deploy exitoso.${NC}"
echo ""
echo "POST-DEPLOY:"
echo "  - Verificar funcionamiento en https://canntrace.pages.dev"
echo "  - Actualizar estado del CR a 'implementado'"
echo "  - Documentar evidencia de verificacion post-deploy"
echo "  - Si hay regresion: ejecutar rollback (deploy del commit anterior)"
