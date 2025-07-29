@echo off
echo 🚀 Configurando proyecto limpio en Windows...

:: Colores para output
set "GREEN=[92m"
set "RED=[91m"
set "YELLOW=[93m"
set "NC=[0m"

:: Verificar si estamos en el directorio correcto
if not exist "backend" (
    echo %RED%Error: No se encuentra el directorio 'backend'%NC%
    echo Asegurate de estar en el directorio raiz del proyecto
    pause
    exit /b 1
)

:: Crear directorio frontend si no existe
if not exist "frontend" (
    mkdir frontend
)

echo %GREEN%Configurando Backend...%NC%
cd backend

:: Verificar Python
py --version >nul 2>&1
if errorlevel 1 (
    echo %RED%Error: Python no está instalado o no está en PATH%NC%
    echo Instala Python desde https://python.org/downloads/
    echo O ejecuta: winget install Python.Python.3.11
    pause
    exit /b 1
)

:: Crear entorno virtual
if not exist "venv" (
    echo Creando entorno virtual...
    py -m venv venv
)

:: Activar entorno virtual
call venv\Scripts\activate.bat

:: Crear requirements.txt si no existe
if not exist "requirements.txt" (
    echo Creando requirements.txt...
    echo fastapi==0.110.1> requirements.txt
    echo uvicorn[standard]==0.25.0>> requirements.txt
    echo pymongo==4.5.0>> requirements.txt
    echo motor==3.3.1>> requirements.txt
    echo python-dotenv==1.0.1>> requirements.txt
    echo pydantic[email]==2.6.4>> requirements.txt
    echo python-multipart==0.0.9>> requirements.txt
)

:: Instalar dependencias
echo Instalando dependencias de Python...
python -m pip install --upgrade pip
pip install -r requirements.txt

:: Crear archivo .env si no existe
if not exist ".env" (
    echo Creando archivo .env...
    echo MONGO_URL="mongodb://localhost:27017"> .env
    echo DB_NAME="mi_database_limpia">> .env
)

:: Crear server.py básico si no existe
if not exist "server.py" (
    echo Creando server.py básico...
    (
        echo from fastapi import FastAPI
        echo from fastapi.middleware.cors import CORSMiddleware
        echo.
        echo app = FastAPI^(title="Mi Proyecto Limpio"^)
        echo.
        echo app.add_middleware^(
        echo     CORSMiddleware,
        echo     allow_origins=["http://localhost:3000"],
        echo     allow_credentials=True,
        echo     allow_methods=["*"],
        echo     allow_headers=["*"],
        echo ^)
        echo.
        echo @app.get^("/api/v1/"^)
        echo async def root^(^):
        echo     return {"message": "Backend limpio funcionando!"}
        echo.
        echo if __name__ == "__main__":
        echo     import uvicorn
        echo     uvicorn.run^(app, host="0.0.0.0", port=8000^)
    ) > server.py
)

cd ..

echo %GREEN%Configurando Frontend...%NC%
cd frontend

:: Verificar Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo %RED%Error: Node.js no está instalado%NC%
    echo Instala Node.js desde https://nodejs.org/
    echo O ejecuta: winget install OpenJS.NodeJS
    pause
    exit /b 1
)

:: Crear proyecto React si no existe package.json
if not exist "package.json" (
    echo Inicializando proyecto React...
    npx create-react-app . --template javascript
)

:: Instalar dependencias adicionales
echo Instalando dependencias adicionales...
npm install framer-motion axios

:: Instalar Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

:: Crear archivo .env para frontend
if not exist ".env" (
    echo Creando .env para frontend...
    echo REACT_APP_API_URL=http://localhost:8000/api/v1> .env
)

:: Configurar Tailwind
if not exist "src\index.css.backup" (
    echo Configurando Tailwind CSS...
    copy src\index.css src\index.css.backup
    (
        echo @tailwind base;
        echo @tailwind components;
        echo @tailwind utilities;
        echo.
        type src\index.css.backup
    ) > src\index.css
)

cd ..

:: Crear script de inicio
echo %GREEN%Creando scripts de inicio...%NC%
(
    echo @echo off
    echo echo Iniciando Backend...
    echo cd backend
    echo call venv\Scripts\activate.bat
    echo start "Backend" python -m uvicorn server:app --reload --host 0.0.0.0 --port 8000
    echo cd ..
    echo echo Backend iniciado en: http://localhost:8000
    echo echo Iniciando Frontend...
    echo cd frontend
    echo start "Frontend" npm start
    echo cd ..
    echo echo Frontend iniciará en: http://localhost:3000
    echo echo.
    echo echo %GREEN%✅ Proyecto iniciado!%NC%
    echo pause
) > start.bat

:: Crear script de instalación de MongoDB
(
    echo @echo off
    echo echo Instalando MongoDB...
    echo winget install MongoDB.Server
    echo echo Iniciando servicio MongoDB...
    echo net start MongoDB
    echo echo MongoDB instalado e iniciado!
    echo pause
) > install-mongodb.bat

echo.
echo %GREEN%✅ Configuración completada!%NC%
echo.
echo Próximos pasos:
echo 1. Instala MongoDB: ./install-mongodb.bat
echo 2. Inicia el proyecto: ./start.bat
echo.
echo URLs importantes:
echo - Backend API: http://localhost:8000/api/v1/
echo - Frontend: http://localhost:3000
echo - API Docs: http://localhost:8000/docs
echo.
pause