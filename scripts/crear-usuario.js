// Script para crear usuario adicional en Supabase Auth
// Uso: node scripts/crear-usuario.js
// El script leera la SECRET_KEY de la variable de entorno SUPABASE_SECRET_KEY

const readline = require('readline')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
var SECRET_KEY = process.env.SUPABASE_SECRET_KEY

async function prompt(texto) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise(function(resolve) { rl.question(texto, function(r) { rl.close(); resolve(r) }) })
}

async function main() {
  if (!SUPABASE_URL) { console.error('ERROR: NEXT_PUBLIC_SUPABASE_URL no definida'); process.exit(1) }
  if (!SECRET_KEY) SECRET_KEY = await prompt('Pega la SECRET_KEY de Supabase: ')

  console.log('\n=== Configurar usuarios Supabase ===\n')

  var headers = { 'apikey': SECRET_KEY, 'Authorization': 'Bearer ' + SECRET_KEY, 'Content-Type': 'application/json' }

  // 1. Buscar admin existente
  console.log('1. Buscando admin@fii.edu...')
  var res1 = await fetch(SUPABASE_URL + '/auth/v1/admin/users', { method: 'GET', headers: { 'apikey': SECRET_KEY, 'Authorization': 'Bearer ' + SECRET_KEY } })
  var data = await res1.json()
  var users = data.users || []
  var adminUser = null
  for (var i = 0; i < users.length; i++) {
    if (users[i].email === 'admin@fii.edu') { adminUser = users[i]; break }
  }

  if (adminUser) {
    console.log('   Actualizando contrasena...')
    var r = await fetch(SUPABASE_URL + '/auth/v1/admin/users/' + adminUser.id, {
      method: 'PUT', headers: headers,
      body: JSON.stringify({ password: 'admin123' }),
    })
    if (r.ok) console.log('   CONTRASENA CAMBIADA A "admin123"')
    else { var t = await r.text(); console.log('   ERROR:', t.substring(0, 200)) }
  } else {
    console.log('   No encontrado, creando...')
    var r = await fetch(SUPABASE_URL + '/auth/v1/admin/users', {
      method: 'POST', headers: headers,
      body: JSON.stringify({ email: 'admin@fii.edu', password: 'admin123', email_confirm: true }),
    })
    if (r.ok) console.log('   CREADO: admin@fii.edu / admin123')
    else { var t = await r.text(); console.log('   ERROR:', t.substring(0, 200)) }
  }

  // 2. Crear usuario colaborador
  console.log('\n2. Creando colaborador@fii.edu...')
  var r2 = await fetch(SUPABASE_URL + '/auth/v1/admin/users', {
    method: 'POST', headers: headers,
    body: JSON.stringify({ email: 'colaborador@fii.edu', password: 'colab123', email_confirm: true }),
  })
  if (r2.ok) console.log('   CREADO: colaborador@fii.edu / colab123')
  else {
    var t2 = await r2.text()
    if (t2.indexOf('already exists') >= 0) console.log('   Ya existe')
    else console.log('   ERROR:', t2.substring(0, 200))
  }

  console.log('\n=== Listo ===')
}

main().catch(function(e) { console.error(e) })
