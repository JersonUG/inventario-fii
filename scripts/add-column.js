const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const envPath = path.join(__dirname, '..', '.env.local')
const content = fs.readFileSync(envPath, 'utf-8')
content.split('\n').forEach(line => {
  const [key, ...vals] = line.split('=')
  if (key && vals.length) process.env[key.trim()] = vals.join('=').trim()
})

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

async function main() {
  const { error: loginError } = await supabase.auth.signInWithPassword({
    email: 'admin@fii.edu', password: 'Admin123!',
  })
  if (loginError) { console.error('❌', loginError.message); process.exit(1) }

  // Try select to check if exists
  const { data } = await supabase.from('items').select('clasificacion_activo').limit(1)
  if (data) {
    console.log('✅ Columna clasificacion_activo ya existe')
    return
  }

  console.log('⚠️ Columna no existe. Ejecuta esto en Supabase SQL Editor:')
  console.log('ALTER TABLE items ADD COLUMN IF NOT EXISTS clasificacion_activo TEXT NOT NULL DEFAULT \'ACTIVO\';')
}

main().catch(console.error)
