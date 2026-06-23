// Script de migración automática para Supabase
// Lee supabase-schema.sql y ejecuta cada sentencia
// Uso: SUPABASE_SECRET_KEY=sb_secret_... node scripts/migrate.js

const fs = require('fs')
const path = require('path')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pivjjwymjutxqdjvmjdt.supabase.co'
const SECRET_KEY = process.env.SUPABASE_SECRET_KEY

async function main() {
  if (!SECRET_KEY) {
    console.error('ERROR: Variable SUPABASE_SECRET_KEY no definida')
    console.error('Uso: SUPABASE_SECRET_KEY=... node scripts/migrate.js')
    process.exit(1)
  }

  console.log('=== Migración automática de base de datos ===\n')

  // Leer schema SQL
  const sqlPath = path.join(__dirname, '..', 'supabase-schema.sql')
  const sql = fs.readFileSync(sqlPath, 'utf8')

  // Dividir en sentencias individuales (por punto y coma)
  var statements = sql.split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  var success = 0, failed = 0

  for (var i = 0; i < statements.length; i++) {
    var stmt = statements[i]
    if (stmt.length < 10) continue

    try {
      var res = await fetch(SUPABASE_URL + '/rest/v1/sql', {
        method: 'POST',
        headers: {
          'apikey': SECRET_KEY,
          'Authorization': 'Bearer ' + SECRET_KEY,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ query: stmt + ';' }),
      })
      if (res.ok || res.status === 204) {
        success++
      } else {
        var text = await res.text()
        // Ignorar errores de "already exists" y columnas duplicadas
        if (text.indexOf('already exists') >= 0 || text.indexOf('duplicate') >= 0 || text.indexOf('already there') >= 0) {
          success++
        } else {
          console.log('  WARN (' + (i + 1) + '):', text.substring(0, 100))
          failed++
        }
      }
    } catch (e) {
      console.log('  ERROR (' + (i + 1) + '):', e.message)
      failed++
    }
  }

  console.log('\nResultado: ' + success + ' OK, ' + failed + ' fallos')

  // Crear perfiles para usuarios existentes
  console.log('\n--- Sincronizando perfiles de usuarios ---')
  try {
    var res = await fetch(SUPABASE_URL + '/auth/v1/admin/users', {
      method: 'GET',
      headers: { 'apikey': SECRET_KEY, 'Authorization': 'Bearer ' + SECRET_KEY },
    })
    var data = await res.json()
    var users = data.users || []

    for (var i = 0; i < users.length; i++) {
      var u = users[i]
      var rol = 'CONSULTA'
      if (u.email === 'admin@fii.edu') rol = 'ADMINISTRADOR'
      else if (u.email === 'colaborador@fii.edu') rol = 'OPERADOR'

      var r = await fetch(SUPABASE_URL + '/rest/v1/user_profiles?user_id=eq.' + u.id, {
        method: 'GET',
        headers: { 'apikey': SECRET_KEY, 'Authorization': 'Bearer ' + SECRET_KEY },
      })
      var existing = await r.json()

      if (!existing || existing.length === 0) {
        var r2 = await fetch(SUPABASE_URL + '/rest/v1/user_profiles', {
          method: 'POST',
          headers: {
            'apikey': SECRET_KEY, 'Authorization': 'Bearer ' + SECRET_KEY,
            'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates',
          },
          body: JSON.stringify({ user_id: u.id, email: u.email, rol: rol }),
        })
        if (r2.ok || r2.status === 201) console.log('  Perfil creado: ' + u.email + ' -> ' + rol)
      } else {
        console.log('  Perfil existe: ' + u.email + ' -> ' + existing[0].rol)
      }
    }
  } catch (e) {
    console.log('  Error sincronizando perfiles:', e.message)
  }

  console.log('\n=== Migración completada ===')
}

main().catch(function(e) { console.error(e); process.exit(1) })
