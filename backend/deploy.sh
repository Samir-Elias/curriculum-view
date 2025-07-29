#!/bin/bash
# deploy.sh - Script de deployment completamente limpio

echo "🚀 Iniciando deployment del proyecto limpio..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Verificar dependencias
check_dependencies() {
    log "Verificando dependencias..."
    
    # Verificar Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js no está instalado"
        exit 1
    fi
    
    # Verificar Python
    if ! command -v python3 &> /dev/null; then
        error "Python 3 no está instalado"
        exit 1
    fi
    
    # Verificar npm/yarn
    if ! command -v npm &> /dev/null && ! command -v yarn &> /dev/null; then
        error "npm o yarn no están instalados"
        exit 1
    fi
    
    log "✅ Todas las dependencias están instaladas"
}

# Limpiar archivos temporales
clean_temp_files() {
    log "Limpiando archivos temporales..."
    
    # Frontend
    if [ -d "frontend/node_modules" ]; then
        rm -rf frontend/node_modules
    fi
    
    if [ -d "frontend/build" ]; then
        rm -rf frontend/build
    fi
    
    # Backend
    if [ -d "backend/__pycache__" ]; then
        rm -rf backend/__pycache__
    fi
    
    if [ -d "backend/.pytest_cache" ]; then
        rm -rf backend/.pytest_cache
    fi
    
    # Archivos de log
    find . -name "*.log" -delete
    find . -name "*.pyc" -delete
    
    log "✅ Archivos temporales limpiados"
}

# Setup del backend
setup_backend() {
    log "Configurando backend..."
    
    cd backend
    
    # Crear entorno virtual si no existe
    if [ ! -d "venv" ]; then
        python3 -m venv venv
        log "Entorno virtual creado"
    fi
    
    # Activar entorno virtual
    source venv/bin/activate
    
    # Instalar dependencias
    pip install --upgrade pip
    pip install -r requirements.txt
    
    log "✅ Backend configurado"
    cd ..
}

# Setup del frontend
setup_frontend() {
    log "Configurando frontend..."
    
    cd frontend
    
    # Instalar dependencias
    if command -v yarn &> /dev/null; then
        yarn install
    else
        npm install
    fi
    
    log "✅ Frontend configurado"
    cd ..
}

# Build del frontend
build_frontend() {
    log "Construyendo frontend..."
    
    cd frontend
    
    # Build de producción
    if command -v yarn &> /dev/null; then
        yarn build
    else
        npm run build
    fi
    
    if [ ! -d "build" ]; then
        error "Build del frontend falló"
        exit 1
    fi
    
    log "✅ Frontend construido exitosamente"
    cd ..
}

# Verificar que no hay marcas de agua
verify_clean_build() {
    log "Verificando que el build esté limpio..."
    
    # Buscar referencias a emergent en el build
    if grep -r -i "emergent" frontend/build/ 2>/dev/null; then
        error "Se encontraron referencias a 'emergent' en el build"
        warn "Revisando archivos problemáticos..."
        grep -r -l -i "emergent" frontend/build/ 2>/dev/null || true
        exit 1
    fi
    
    # Verificar que no hay scripts externos no autorizados
    if grep -r "posthog\|analytics\|tracking" frontend/build/ 2>/dev/null; then
        warn "Se encontraron scripts de tracking, verifica si son necesarios"
    fi
    
    log "✅ Build verificado como limpio"
}

# Crear archivos de configuración para deployment
create_deployment_configs() {
    log "Creando archivos de configuración..."
    
    # Dockerfile para backend
    cat > backend/Dockerfile << 'EOF'
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
EOF

    # Dockerfile para frontend
    cat > frontend/Dockerfile << 'EOF'
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
EOF

    # nginx.conf para frontend
    cat > frontend/nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        # Gzip compression
        gzip on;
        gzip_vary on;
        gzip_min_length 1024;
        gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

        # Handle client routing
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
EOF

    # docker-compose.yml
    cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - MONGO_URL=mongodb://mongo:27017
      - DB_NAME=clean_database
    depends_on:
      - mongo
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped

  mongo:
    image: mongo:6.0
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    restart: unless-stopped

volumes:
  mongo_data:
EOF

    # Vercel config para frontend
    cat > frontend/vercel.json << 'EOF'
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    }
  ],
  "routes": [
    {
      "src": "/static/(.*)",
      "headers": {
        "cache-control": "s-maxage=31536000,immutable"
      }
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
EOF

    # Railway config para backend
    cat > backend/railway.toml << 'EOF'
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "uvicorn server:app --host 0.0.0.0 --port $PORT"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
EOF

    # Heroku Procfile
    cat > backend/Procfile << 'EOF'
web: uvicorn server:app --host 0.0.0.0 --port $PORT
EOF

    # GitHub Actions workflow
    mkdir -p .github/workflows
    cat > .github/workflows/deploy.yml << 'EOF'
name: Deploy Clean Project

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    
    - name: Install dependencies
      run: |
        cd backend
        python -m pip install --upgrade pip
        pip install -r requirements.txt
    
    - name: Run tests
      run: |
        cd backend
        pytest

  test-frontend:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: frontend/package-lock.json
    
    - name: Install dependencies
      run: |
        cd frontend
        npm ci
    
    - name: Build project
      run: |
        cd frontend
        npm run build
    
    - name: Verify clean build
      run: |
        if grep -r -i "emergent" frontend/build/; then
          echo "Found emergent references in build!"
          exit 1
        fi

  deploy:
    needs: [test-backend, test-frontend]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to production
      run: |
        echo "Deploying to production..."
        # Aquí agregarías tus comandos de deployment específicos
EOF

    log "✅ Archivos de configuración creados"
}

# Función principal de deployment
deploy() {
    local environment=${1:-"local"}
    
    log "Iniciando deployment para entorno: $environment"
    
    case $environment in
        "local")
            deploy_local
            ;;
        "docker")
            deploy_docker
            ;;
        "vercel")
            deploy_vercel
            ;;
        "railway")
            deploy_railway
            ;;
        *)
            error "Entorno no soportado: $environment"
            echo "Entornos soportados: local, docker, vercel, railway"
            exit 1
            ;;
    esac
}

# Deployment local
deploy_local() {
    log "Desplegando localmente..."
    
    # Iniciar MongoDB si no está corriendo
    if ! pgrep -x "mongod" > /dev/null; then
        warn "MongoDB no está corriendo. Iniciando..."
        if command -v brew &> /dev/null; then
            brew services start mongodb-community
        elif command -v systemctl &> /dev/null; then
            sudo systemctl start mongod
        else
            warn "No se pudo iniciar MongoDB automáticamente"
        fi
    fi
    
    # Iniciar backend
    log "Iniciando backend..."
    cd backend
    source venv/bin/activate
    nohup uvicorn server:app --host 0.0.0.0 --port 8000 --reload > ../backend.log 2>&1 &
    BACKEND_PID=$!
    cd ..
    
    # Iniciar frontend
    log "Iniciando frontend..."
    cd frontend
    if command -v yarn &> /dev/null; then
        nohup yarn start > ../frontend.log 2>&1 &
    else
        nohup npm start > ../frontend.log 2>&1 &
    fi
    FRONTEND_PID=$!
    cd ..
    
    # Guardar PIDs para poder detener después
    echo $BACKEND_PID > backend.pid
    echo $FRONTEND_PID > frontend.pid
    
    log "✅ Deployment local completado"
    info "Backend: http://localhost:8000"
    info "Frontend: http://localhost:3000"
    info "Para detener: ./deploy.sh stop"
}

# Deployment con Docker
deploy_docker() {
    log "Desplegando con Docker..."
    
    if ! command -v docker &> /dev/null; then
        error "Docker no está instalado"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose no está instalado"
        exit 1
    fi
    
    # Build y deploy
    docker-compose down
    docker-compose build --no-cache
    docker-compose up -d
    
    log "✅ Deployment con Docker completado"
    info "Aplicación disponible en: http://localhost"
    info "API disponible en: http://localhost:8000"
}

# Deployment en Vercel
deploy_vercel() {
    log "Desplegando en Vercel..."
    
    if ! command -v vercel &> /dev/null; then
        error "Vercel CLI no está instalado"
        info "Instala con: npm i -g vercel"
        exit 1
    fi
    
    cd frontend
    vercel --prod
    cd ..
    
    log "✅ Frontend desplegado en Vercel"
    warn "Recuerda desplegar el backend por separado"
}

# Deployment en Railway
deploy_railway() {
    log "Desplegando en Railway..."
    
    if ! command -v railway &> /dev/null; then
        error "Railway CLI no está instalado"
        info "Instala con: npm i -g @railway/cli"
        exit 1
    fi
    
    # Deploy backend
    cd backend
    railway up
    cd ..
    
    log "✅ Backend desplegado en Railway"
    warn "Deploy el frontend por separado en Vercel o Netlify"
}

# Función para detener servicios locales
stop_local() {
    log "Deteniendo servicios locales..."
    
    if [ -f backend.pid ]; then
        BACKEND_PID=$(cat backend.pid)
        kill $BACKEND_PID 2>/dev/null || true
        rm backend.pid
    fi
    
    if [ -f frontend.pid ]; then
        FRONTEND_PID=$(cat frontend.pid)
        kill $FRONTEND_PID 2>/dev/null || true
        rm frontend.pid
    fi
    
    log "✅ Servicios detenidos"
}

# Función de ayuda
show_help() {
    echo "📖 Uso del script de deployment:"
    echo ""
    echo "  ./deploy.sh [comando] [opciones]"
    echo ""
    echo "Comandos disponibles:"
    echo "  setup          - Configurar dependencias"
    echo "  build          - Construir el proyecto"
    echo "  local          - Deploy local"
    echo "  docker         - Deploy con Docker"
    echo "  vercel         - Deploy en Vercel"
    echo "  railway        - Deploy en Railway"
    echo "  stop           - Detener servicios locales"
    echo "  clean          - Limpiar archivos temporales"
    echo "  verify         - Verificar que el build está limpio"
    echo "  help           - Mostrar esta ayuda"
    echo ""
    echo "Ejemplos:"
    echo "  ./deploy.sh setup"
    echo "  ./deploy.sh build"
    echo "  ./deploy.sh local"
    echo "  ./deploy.sh docker"
    echo ""
}

# Función principal
main() {
    case ${1:-""} in
        "setup")
            check_dependencies
            clean_temp_files
            setup_backend
            setup_frontend
            create_deployment_configs
            ;;
        "build")
            build_frontend
            verify_clean_build
            ;;
        "local")
            deploy local
            ;;
        "docker")
            deploy docker
            ;;
        "vercel")
            deploy vercel
            ;;
        "railway")
            deploy railway
            ;;
        "stop")
            stop_local
            ;;
        "clean")
            clean_temp_files
            ;;
        "verify")
            verify_clean_build
            ;;
        "help"|"--help"|"-h")
            show_help
            ;;
        "")
            log "🚀 Setup completo del proyecto limpio"
            check_dependencies
            clean_temp_files
            setup_backend
            setup_frontend
            build_frontend
            verify_clean_build
            create_deployment_configs
            log "✅ Proyecto listo para deployment"
            info "Usa './deploy.sh local' para probar localmente"
            ;;
        *)
            error "Comando no reconocido: $1"
            show_help
            exit 1
            ;;
    esac
}

# Ejecutar función principal con todos los argumentos
main "$@"