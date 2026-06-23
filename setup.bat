@echo off
chcp 65001 >nul
title Instalador - Inventario FII
cls
echo ============================================
echo    SISTEMA DE INVENTARIO - FACULTAD DE
echo    INGENIERIA INDUSTRIAL - UNIVERSIDAD DE
echo    GUAYAQUIL
echo ============================================
echo.
echo Requisitos:
echo - Windows 10/11
echo - Node.js 18+ (https://nodejs.org)
echo - Git (https://git-scm.com)
echo.
echo.
echo PASO 1: Instalando dependencias...
echo.
call npm install
if %errorlevel% neq 0 (
    echo Error instalando dependencias
    pause
    exit /b 1
)
echo.
echo PASO 2: Creando archivo de configuracion...
echo.
if not exist .env.local (
    echo NEXT_PUBLIC_SUPABASE_URL=https://pivjjwymjutxqdjvmjdt.supabase.co > .env.local
    echo NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpdmpqd3ltanV0eHFkanZtamR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMTIzNjMsImV4cCI6MjA5NDY4ODM2M30.pWEZcElSqKW6l6xqbsGi0QP4z0_OePT6uLolvk9VtN0 >> .env.local
    echo .env.local creado
) else (
    echo .env.local ya existe
)
echo.
echo PASO 3: Construyendo el proyecto...
echo.
call npm run build
if %errorlevel% neq 0 (
    echo Error en la compilacion
    pause
    exit /b 1
)
echo.
echo PASO 4: Creando acceso directo...
echo.
echo @echo off > iniciar_inventario.bat
echo chcp 65001 ^>nul >> iniciar_inventario.bat
echo title Inventario FII >> iniciar_inventario.bat
echo start /min "" cmd /c "npx next start -p 3000" >> iniciar_inventario.bat
echo echo. >> iniciar_inventario.bat
echo echo Servidor iniciado en http://localhost:3000 >> iniciar_inventario.bat
echo echo. >> iniciar_inventario.bat
echo pause >> iniciar_inventario.bat
echo.
echo ============================================
echo    INSTALACION COMPLETADA
echo ============================================
echo.
echo Para iniciar el sistema:
echo   - Doble click en "iniciar_inventario.bat"
echo   - O ejecuta: npx next start -p 3000
echo.
echo Luego abre en tu navegador:
echo   http://localhost:3000
echo.
echo Credenciales de acceso:
echo   Email: admin@fii.edu
echo   Password: Admin123!
echo.
echo BASE DE DATOS (Supabase):
echo   Si la base de datos esta vacia, debes ejecutar
echo   el script supabase-schema.sql en:
echo   https://supabase.com/dashboard/project/pivjjwymjutxqdjvmjdt/sql/new
echo.
pause
