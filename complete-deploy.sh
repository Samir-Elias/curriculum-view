#!/bin/bash
# complete-deploy.sh - Deployment completo para Vercel + Backend

echo "🚀 Deployment completo: Frontend (Vercel) + Backend"

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"; }
info() { echo -e "${BLUE}[INFO] $1${NC}"; }
warn() { echo -e "${YELLOW}[WARN] $1${NC}"; }
error() { echo -e "${RED}[ERROR] $1${NC}"; }

# Función para desplegar backend en Railway
deploy_backend_railway() {
    log "Desplegando backend en Railway..."
    
    if ! command -v railway &> /dev/null; then
        warn "Railway CLI no encontrado. Instalando..."
        npm install -g @railway/cli
    fi
    
    cd backend
    
    # Login (si no está logueado)
    if ! railway whoami &> /dev/null; then
        log "Iniciando sesión en Railway..."
        railway login
    fi
    
    # Inicializar proyecto si no existe
    if [ ! -f "railway.toml" ]; then
        log "Inicializando proyecto Railway..."
        railway init
    fi
    
    # Desplegar
    log "Desplegando backend..."
    railway up
    
    # Obtener URL del deployment
    BACKEND_URL=$(railway status --json | grep -o '"url":"[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$BACKEND_URL" ]; then
        log "✅ Backend desplegado en: $BACKEND_URL"
        echo "$BACKEND_URL/api/v1" > ../backend-url.txt
    else
        error "No se pudo obtener la URL del backend"
        exit 1
    fi
    
    cd ..
}

# Función para desplegar backend en Render
deploy_backend_render() {
    log "Para desplegar en Render:"
    info "1. Ve a https://render.com"
    info "2. Conecta tu repositorio GitHub"
    info "3. Crea un nuevo Web Service"
    info "4. Configuración:"
    info "   - Build Command: pip install -r requirements.txt"
    info "   - Start Command: uvicorn server:app --host 0.0.0.0 --port \$PORT"
    info "   - Environment: Python 3"
    info "5. Agrega variables de entorno:"
    info "   - MONGO_URL=mongodb+srv://..."
    info "   - DB_NAME=tu_database"
    
    read -p "Ingresa la URL de tu backend en Render (ej: https://tu-app.onrender.com): " BACKEND_URL
    if [ -n "$BACKEND_URL" ]; then
        echo "$BACKEND_URL/api/v1" > backend-url.txt
        log "✅ URL del backend guardada: $BACKEND_URL"
    fi
}

# Función para configurar MongoDB Atlas
setup_mongodb_atlas() {
    log "Configurando MongoDB Atlas..."
    
    info "1. Ve a https://cloud.mongodb.com"
    info "2. Crea una cuenta gratuita"
    info "3. Crea un nuevo cluster (M0 Sandbox - Free)"
    info "4. Configuración de red:"
    info "   - Add IP Address: 0.0.0.0/0 (Allow access from anywhere)"
    info "5. Crea un usuario de base de datos"
    info "6. Obtén la connection string"
    
    read -p "Ingresa tu MongoDB connection string: " MONGO_URL
    
    # Actualizar variables de entorno del backend
    cd backend
    cat > .env << EOF
MONGO_URL=$MONGO_URL
DB_NAME=curriculum_database
PORT=8000
EOF
    cd ..
    
    log "✅ MongoDB Atlas configurado"
}

# Función para actualizar Vercel
update_vercel_env() {
    local backend_url=$1
    
    log "Actualizando variables de entorno en Vercel..."
    
    if ! command -v vercel &> /dev/null; then
        warn "Vercel CLI no encontrado. Instalando..."
        npm install -g vercel
    fi
    
    cd frontend
    
    # Login si no está logueado
    if ! vercel whoami &> /dev/null; then
        log "Iniciando sesión en Vercel..."
        vercel login
    fi
    
    # Agregar variable de entorno
    log "Configurando REACT_APP_API_URL=$backend_url"
    vercel env add REACT_APP_API_URL production
    echo "$backend_url"
    
    # Redesplegar
    log "Redesplegando frontend..."
    vercel --prod
    
    cd ..
    
    log "✅ Frontend actualizado con nueva URL del backend"
}

# Función para verificar la conexión
verify_connection() {
    local backend_url=$1
    local frontend_url="https://curriculum-view.vercel.app"
    
    log "Verificando conexión..."
    
    # Verificar backend
    if curl -s "$backend_url/health" > /dev/null; then
        log "✅ Backend responde correctamente"
    else
        error "❌ Backend no responde en $backend_url"
        return 1
    fi
    
    # Verificar frontend
    if curl -s "$frontend_url" > /dev/null; then
        log "✅ Frontend accesible"
    else
        error "❌ Frontend no accesible"
        return 1
    fi
    
    log "🎉 ¡Conexión verificada exitosamente!"
    info "Frontend: $frontend_url"
    info "Backend: $backend_url"
}

# Función principal
main() {
    log "Iniciando deployment completo..."
    
    # Verificar dependencias
    if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
        error "Directorios backend/frontend no encontrados"
        exit 1
    fi
    
    # Seleccionar plataforma para backend
    echo ""
    echo "Selecciona plataforma para el backend:"
    echo "1) Railway (Recomendado)"
    echo "2) Render"
    echo "3) Ya está desplegado (solo actualizar URL)"
    read -p "Opción [1-3]: " backend_choice
    
    case $backend_choice in
        1)
            setup_mongodb_atlas
            deploy_backend_railway
            ;;
        2)
            setup_mongodb_atlas
            deploy_backend_render
            ;;
        3)
            read -p "Ingresa la URL completa de tu backend: " BACKEND_URL
            echo "$BACKEND_URL/api/v1" > backend-url.txt
            ;;
        *)
            error "Opción inválida"
            exit 1
            ;;
    esac
    
    # Leer URL del backend
    if [ -f "backend-url.txt" ]; then
        BACKEND_API_URL=$(cat backend-url.txt)
        log "Usando backend URL: $BACKEND_API_URL"
    else
        error "No se pudo determinar la URL del backend"
        exit 1
    fi
    
    # Actualizar Vercel
    update_vercel_env "$BACKEND_API_URL"
    
    # Verificar conexión
    verify_connection "$BACKEND_API_URL"
    
    # Resumen final
    echo ""
    log "🎉 ¡Deployment completado exitosamente!"
    echo ""
    info "URLs finales:"
    info "  Frontend: https://curriculum-view.vercel.app"
    info "  Backend:  $BACKEND_API_URL"
    info "  API Docs: ${BACKEND_API_URL%/api/v1}/docs"
    echo ""
    log "Tu aplicación ya está completamente funcional!"
    
    # Limpiar archivo temporal
    rm -f backend-url.txt
}

# Ejecutar si se llama directamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi