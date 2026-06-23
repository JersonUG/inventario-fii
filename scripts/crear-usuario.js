const readline = require('readline')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
var SECRET_KEY = process.env.SUPABASE_SECRET_KEY

async function prompt(texto) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise(function(resolve) { rl.question(texto, function(r) { rl.close(); resolve(r) }) })
}

async function upsertProfile(userId, email, rol) {
  // Intenta insertar perfil via API REST de Supabase (directo a la tabla user_profiles)
  var res = await fetch(SUPABASE_URL + '/rest/v1/user_profiles', {
    method: 'POST',
    headers: {
      'apikey': SECRET_KEY, 'Authorization': 'Bearer ' + SECRET_KEY,
      'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates',
    },
    body: JSON.stringify({ user_id: userId, email: email, rol: rol }),
  })
  if (res.ok) return true
  // Fallback: probar con upsert via query params
  var res2 = await fetch(SUPABASE_URL + '/rest/v1/user_profiles?on_conflict=user_id', {
    method: 'POST',
    headers: {
      'apikey': SECRET_KEY, 'Authorization': 'Bearer ' + SECRET_KEY,
      'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates',
    },
    body: JSON.stringify({ user_id: userId, email: email, rol: rol }),
  })
  return res2.ok
}

async function findUser(email) {
  var res = await fetch(SUPABASE_URL + '/auth/v1/admin/users', {
    method: 'GET',
    headers: { 'apikey': SECRET_KEY, 'Authorization': 'Bearer ' + SECRET_KEY },
  })
  var data = await res.json()
  var users = data.users || []
  for (var i = 0; i < users.length; i++) {
    if (users[i].email === email) return users[i]
  }
  return null
}

async function main() {
  if (!SUPABASE_URL) { console.error('ERROR: NEXT_PUBLIC_SUPABASE_URL no definida'); process.exit(1) }
  if (!SECRET_KEY) SECRET_KEY = await prompt('Pega la SECRET_KEY de Supabase: ')

  console.log('\n=== Configurar usuarios Supabase ===\n')

  var headers = { 'apikey': SECRET_KEY, 'Authorization': 'Bearer ' + SECRET_KEY, 'Content-Type': 'application/json' }

  // 1. Configurar ADMIN
  console.log('1. Configurando admin@fii.edu...')
  var adminUser = await findUser('admin@fii.edu')
  if (adminUser) {
    var r = await fetch(SUPABASE_URL + '/auth/v1/admin/users/' + adminUser.id, {
      method: 'PUT', headers: headers,
      body: JSON.stringify({ password: 'admin123' }),
    })
    if (r.ok) console.log('   Contrasena actualizada a "admin123"')
    else { var t = await r.text(); console.log('   ERROR pass:', t.substring(0, 200)) }
    await upsertProfile(adminUser.id, 'admin@fii.edu', 'ADMINISTRADOR')
    console.log('   Rol: ADMINISTRADOR')
  } else {
    console.log('   No encontrado. Creando...')
    var r = await fetch(SUPABASE_URL + '/auth/v1/admin/users', {
      method: 'POST', headers: headers,
      body: JSON.stringify({ email: 'admin@fii.edu', password: 'admin123', email_confirm: true }),
    })
    if (r.ok) {
      var newUser = await r.json()
      await upsertProfile(newUser.id, 'admin@fii.edu', 'ADMINISTRADOR')
      console.log('   CREADO: admin@fii.edu / admin123 (ADMINISTRADOR)')
    } else { var t = await r.text(); console.log('   ERROR:', t.substring(0, 200)) }
  }

  // 2. Configurar COLABORADOR (OPERADOR)
  console.log('\n2. Configurando colaborador@fii.edu...')
  var colabUser = await findUser('colaborador@fii.edu')
  if (colabUser) {
    await upsertProfile(colabUser.id, 'colaborador@fii.edu', 'OPERADOR')
    console.log('   Rol: OPERADOR (puede modificar excepto historiales)')
  } else {
    var r = await fetch(SUPABASE_URL + '/auth/v1/admin/users', {
      method: 'POST', headers: headers,
      body: JSON.stringify({ email: 'colaborador@fii.edu', password: 'colab123', email_confirm: true }),
    })
    if (r.ok) {
      var newUser = await r.json()
      await upsertProfile(newUser.id, 'colaborador@fii.edu', 'OPERADOR')
      console.log('   CREADO: colaborador@fii.edu / colab123 (OPERADOR)')
    } else {
      var t = await r.text()
      if (t.indexOf('already exists') >= 0) console.log('   Ya existe, no se pudo actualizar rol. Ejecuta SQL manual.')
      else console.log('   ERROR:', t.substring(0, 200))
    }
  }

  // 3. Crear AUDITOR (CONSULTA)
  console.log('\n3. Creando auditor@fii.edu...')
  var auditUser = await findUser('auditor@fii.edu')
  if (auditUser) {
    await upsertProfile(auditUser.id, 'auditor@fii.edu', 'CONSULTA')
    console.log('   Rol actualizado: CONSULTA (solo lectura)')
  } else {
    var r = await fetch(SUPABASE_URL + '/auth/v1/admin/users', {
      method: 'POST', headers: headers,
      body: JSON.stringify({ email: 'auditor@fii.edu', password: 'audit123', email_confirm: true }),
    })
    if (r.ok) {
      var newUser = await r.json()
      await upsertProfile(newUser.id, 'auditor@fii.edu', 'CONSULTA')
      console.log('   CREADO: auditor@fii.edu / audit123 (CONSULTA - solo lectura)')
    } else {
      var t = await r.text()
      if (t.indexOf('already exists') >= 0) console.log('   Ya existe')
      else console.log('   ERROR:', t.substring(0, 200))
    }
  }

  console.log('\n=== Listo ===')
  console.log('\nResumen de usuarios:')
  console.log('  admin@fii.edu      / admin123  -> ADMINISTRADOR (todo acceso)')
  console.log('  colaborador@fii.edu / colab123  -> OPERADOR (modifica items/actas)')
  console.log('  auditor@fii.edu    / audit123  -> CONSULTA (solo lectura)')
}

main().catch(function(e) { console.error(e) })
