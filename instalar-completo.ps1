param([string]$SecretKey = "")

$ErrorActionPreference = 'Stop'
Write-Host "=== INVENTARIO FII - INSTALACION COMPLETA ===" -ForegroundColor Cyan

# 1. Clonar
$repo = "https://github.com/JersonUG/inventario-fii"
if (!(Test-Path "inventario-fii")) {
    git clone $repo
}
Set-Location inventario-fii

# 2. Crear .env.local
@"
NEXT_PUBLIC_SUPABASE_URL=https://pivjjwymjutxqdjvmjdt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_beMhkJsU7aVNrpJLlu7JXw_-Pki6IiC
"@ | Out-File -Encoding utf8 .env.local

# 3. Instalar dependencias
Write-Host "`nInstalando dependencias..." -ForegroundColor Yellow
npm install

# 4. Obtener Service Role Key
if ([string]::IsNullOrEmpty($SecretKey)) {
    $SecretKey = Read-Host "`nIngresa la Service Role Key de Supabase"
}
$supabaseUrl = "https://pivjjwymjutxqdjvmjdt.supabase.co"

# 5. Migrar SQL via API
Write-Host "`nEjecutando migracion SQL..." -ForegroundColor Yellow
$sql = Get-Content -Raw supabase-schema.sql
$statements = $sql -split ';' | ForEach-Object { $_.Trim() } | Where-Object { $_.Length -gt 10 -and $_ -notmatch '^\s*--' }

$ok = 0; $fail = 0
foreach ($stmt in $statements) {
    try {
        $body = @{ query = "$stmt;" } | ConvertTo-Json
        $r = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/sql" -Method Post -Headers @{
            'apikey' = $SecretKey
            'Authorization' = "Bearer $SecretKey"
            'Content-Type' = 'application/json'
        } -Body $body -ErrorAction SilentlyContinue
        $ok++
    } catch {
        $err = $_.Exception.Message
        if ($err -match 'already exists|duplicate|already there') { $ok++ } else { $fail++; Write-Host "  Fallo: $($err.Substring(0, Math.Min(80, $err.Length)))" -ForegroundColor DarkGray }
    }
}

# 6. Sincronizar usuarios
Write-Host "`nSincronizando usuarios..." -ForegroundColor Yellow
$users = Invoke-RestMethod -Uri "$supabaseUrl/auth/v1/admin/users" -Headers @{
    'apikey' = $SecretKey; 'Authorization' = "Bearer $SecretKey"
} -ErrorAction SilentlyContinue
if ($users -and $users.users) {
    foreach ($u in $users.users) {
        $rol = 'CONSULTA'
        if ($u.email -eq 'admin@fii.edu') { $rol = 'ADMINISTRADOR' }
        elseif ($u.email -eq 'colaborador@fii.edu') { $rol = 'OPERADOR' }
        $body = @{ user_id = $u.id; email = $u.email; rol = $rol } | ConvertTo-Json
        Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/user_profiles" -Method Post -Headers @{
            'apikey' = $SecretKey; 'Authorization' = "Bearer $SecretKey"
            'Content-Type' = 'application/json'; 'Prefer' = 'resolution=merge-duplicates'
        } -Body $body -ErrorAction SilentlyContinue | Out-Null
    }
}

Write-Host "Migracion: $ok OK, $fail fallos" -ForegroundColor $(if ($fail -eq 0) { 'Green' } else { 'Yellow' })

# 7. Build
Write-Host "`nCompilando..." -ForegroundColor Yellow
npm run build

# 8. Iniciar
Write-Host "`n=== SISTEMA LISTO ===" -ForegroundColor Green
Write-Host "Abre: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Credenciales:" -ForegroundColor Cyan
Write-Host "  admin@fii.edu / admin123 (ADMIN)" -ForegroundColor Cyan
Write-Host "  colaborador@fii.edu / colab123 (OPERADOR)" -ForegroundColor Cyan
Write-Host "  auditor@fii.edu / audit123 (CONSULTA)" -ForegroundColor Cyan
npm run start
