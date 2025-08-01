@echo off
echo 🔧 Corrigiendo estructura de React en Windows...

cd frontend

echo 📁 Reorganizando archivos...

:: Crear directorio src si no existe
if not exist "src" mkdir src

:: Mover archivos de components a src
if exist "src\components\index.js" (
    echo Moviendo index.js...
    move "src\components\index.js" "src\index.js"
)

if exist "src\components\index.css" (
    echo Moviendo index.css...
    move "src\components\index.css" "src\index.css"
)

if exist "src\components\App.js" (
    echo Moviendo App.js...
    move "src\components\App.js" "src\App.js"
)

if exist "src\components\App.css" (
    echo Moviendo App.css...
    move "src\components\App.css" "src\App.css"
)

:: Crear index.js correcto
echo 📝 Creando index.js correcto...
(
echo import React from 'react';
echo import ReactDOM from 'react-dom/client';
echo import './index.css';
echo import App from './App';
echo.
echo const root = ReactDOM.createRoot^(document.getElementById^('root'^)^);
echo root.render^(
echo   ^<React.StrictMode^>
echo     ^<App /^>
echo   ^</React.StrictMode^>
echo ^);
) > src\index.js

:: Crear index.css correcto
echo 📝 Creando index.css correcto...
(
echo @tailwind base;
echo @tailwind components;
echo @tailwind utilities;
echo.
echo body {
echo   margin: 0;
echo   font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto',
echo     'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans',
echo     'Helvetica Neue', sans-serif;
echo   -webkit-font-smoothing: antialiased;
echo   -moz-osx-font-smoothing: grayscale;
echo }
echo.
echo code {
echo   font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
echo     monospace;
echo }
echo.
echo /* Ocultar cualquier marca de agua */
echo [id*="emergent"],
echo [class*="emergent"],
echo [data-emergent],
echo .watermark,
echo .badge,
echo a[href*="emergent"] {
echo   display: none !important;
echo   visibility: hidden !important;
echo   opacity: 0 !important;
echo }
) > src\index.css

:: Limpiar node_modules y package-lock.json
echo 🧹 Limpiando dependencias...
if exist "node_modules" rmdir /s /q node_modules
if exist "package-lock.json" del package-lock.json

:: Reinstalar dependencias
echo 📦 Reinstalando dependencias...
npm install

echo.
echo ✅ Estructura corregida!
echo.
echo Archivos movidos:
echo   ✓ src\index.js (punto de entrada principal)
echo   ✓ src\App.js (componente principal)
echo   ✓ src\App.css (estilos)
echo   ✓ src\index.css (estilos globales con Tailwind)
echo.
echo 🚀 Ahora puedes ejecutar:
echo   npm start  (para desarrollo)
echo   npm run build  (para producción)
echo.
echo 🌐 Para Vercel:
echo   vercel --prod
echo.
pause