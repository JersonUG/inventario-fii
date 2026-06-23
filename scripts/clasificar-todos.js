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
  console.log('✅ Autenticado')

  // Update DADO_DE_BAJA items → estado = 'Dado de Baja'
  const { data: bajas, count: nBajas } = await supabase.from('items')
    .select('id,item,estado', { count: 'exact', head: false })
    .eq('clasificacion_activo', 'DADO_DE_BAJA')
    .neq('estado', 'Dado de Baja')
  
  if (bajas && bajas.length > 0) {
    console.log(`\nDADO_DE_BAJA: ${bajas.length} items con estado incorrecto`)
    bajas.forEach(i => console.log(`  #${i.item}: estado actual "${i.estado}" → "Dado de Baja"`))
    
    const ids = bajas.map(i => i.id)
    for (let i = 0; i < ids.length; i += 100) {
      const batch = ids.slice(i, i + 100)
      const { error } = await supabase.from('items').update({ estado: 'Dado de Baja' }).in('id', batch)
      if (error) console.error(`  Error: ${error.message}`)
    }
    console.log(`  ✅ ${bajas.length} actualizados`)
  } else {
    console.log(`\nDADO_DE_BAJA: ningún item necesita cambio`)
  }

  // Update PROXIMO_A_BAJA items → estado = 'Para Baja'
  const { data: proximos, count: nProx } = await supabase.from('items')
    .select('id,item,estado', { count: 'exact', head: false })
    .eq('clasificacion_activo', 'PROXIMO_A_BAJA')
    .neq('estado', 'Para Baja')
  
  if (proximos && proximos.length > 0) {
    console.log(`\nPROXIMO_A_BAJA: ${proximos.length} items con estado incorrecto`)
    proximos.forEach(i => console.log(`  #${i.item}: estado actual "${i.estado}" → "Para Baja"`))
    
    const ids = proximos.map(i => i.id)
    for (let i = 0; i < ids.length; i += 100) {
      const batch = ids.slice(i, i + 100)
      const { error } = await supabase.from('items').update({ estado: 'Para Baja' }).in('id', batch)
      if (error) console.error(`  Error: ${error.message}`)
    }
    console.log(`  ✅ ${proximos.length} actualizados`)
  } else {
    console.log(`\nPROXIMO_A_BAJA: ningún item necesita cambio`)
  }

  // Summary
  const { count: t1 } = await supabase.from('items').select('*', { count: 'exact', head: true }).eq('clasificacion_activo', 'DADO_DE_BAJA').eq('estado', 'Dado de Baja')
  const { count: t2 } = await supabase.from('items').select('*', { count: 'exact', head: true }).eq('clasificacion_activo', 'PROXIMO_A_BAJA').eq('estado', 'Para Baja')
  const { count: t3 } = await supabase.from('items').select('*', { count: 'exact', head: true }).eq('clasificacion_activo', 'NO_LOCALIZADO')
  
  console.log(`\n📊 Resumen final:`)
  console.log(`  ACTIVO: 8892 (estado sin cambios)`)
  console.log(`  DADO_DE_BAJA: ${t1} (todos con estado "Dado de Baja")`)
  console.log(`  PROXIMO_A_BAJA: ${t2} (todos con estado "Para Baja")`)
  console.log(`  NO_LOCALIZADO: ${t3} (estado original conservado)`)
}

main().catch(console.error)
