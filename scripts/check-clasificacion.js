const { createClient } = require('@supabase/supabase-js')
const path = require('path')
const fs = require('fs')

const envPath = path.join(__dirname, '..', '.env.local')
const content = fs.readFileSync(envPath, 'utf-8')
content.split('\n').forEach(line => {
  const [key, ...vals] = line.split('=')
  if (key && vals.length) process.env[key.trim()] = vals.join('=').trim()
})

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

async function main() {
  const { error: loginError } = await supabase.auth.signInWithPassword({ email: 'admin@fii.edu', password: 'Admin123!' })
  if (loginError) { console.error('❌', loginError.message); process.exit(1) }

  const { data: all, error } = await supabase.from('items').select('id,item,estado,observaciones,mes,clasificacion_activo').range(0, 11000)
  if (error) { console.error(error); process.exit(1) }

  // Count by estado
  const grupos = {}
  all.forEach(i => { const e = i.estado || '(vacio)'; grupos[e] = (grupos[e] || 0) + 1 })
  console.log('Conteo por estado:')
  Object.entries(grupos).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${k}: ${v}`))

  // Search text for baja keywords
  const bajaKW = all.filter(i => {
    const t = ((i.observaciones || '') + ' ' + (i.mes || '')).toUpperCase()
    return t.includes('SE DIO DE BAJA') || t.includes('DIO DE BAJA') || t.includes('DADO DE BAJA')
  })
  console.log(`\nItems con "DIO DE BAJA" en texto: ${bajaKW.length}`)
  if (bajaKW.length > 0) {
    bajaKW.slice(0, 5).forEach(i => console.log(`  #${i.item} estado:${i.estado} clas:${i.clasificacion_activo} obs:${(i.observaciones||'').substring(0,60)}`))
  }

  const paraKW = all.filter(i => {
    const t = ((i.observaciones || '') + ' ' + (i.mes || '')).toUpperCase()
    return !bajaKW.includes(i) && (t.includes('PARA LA BAJA') || t.includes('POSIBLE BAJA') || t.includes('DAR DE BAJA') || t.includes('DE BAJA') || t.includes('SUBASTA') || t.includes('CHATARRI'))
  })
  console.log(`\nItems con keywords de "Para Baja": ${paraKW.length}`)
  if (paraKW.length > 0) {
    paraKW.slice(0, 5).forEach(i => console.log(`  #${i.item} estado:${i.estado} clas:${i.clasificacion_activo} obs:${(i.observaciones||'').substring(0,60)}`))
  }

  console.log(`\nTotal items: ${all.length}`)
}

main().catch(console.error)
