/**
 * Script de migración del Excel a Supabase
 * 
 * 1. Copia el archivo .xlsx a la raíz del proyecto
 * 2. Configura .env.local
 * 3. Ejecuta: node scripts/migrate-excel.js
 */

const XLSX = require('xlsx')
const { createClient } = require('@supabase/supabase-js')
const path = require('path')
const fs = require('fs')

// Cargar .env.local
const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf-8')
  content.split('\n').forEach(line => {
    const [key, ...vals] = line.split('=')
    if (key && vals.length) process.env[key.trim()] = vals.join('=').trim()
  })
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

const excelDir = path.join(__dirname, '..')
const files = fs.readdirSync(excelDir)
const excelFile = files.find(f => f.match(/\.(xlsx|xls)$/i))
if (!excelFile) { console.error('No se encontró archivo Excel en:', excelDir); process.exit(1) }

console.log(`📄 Leyendo: ${excelFile}`)
const workbook = XLSX.readFile(path.join(excelDir, excelFile), { cellDates: true })
const sheet = workbook.Sheets[workbook.SheetNames[0]]
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false })

console.log(`📊 Filas totales: ${rows.length}`)
const dataRows = rows.slice(3).filter(row => row[0])
console.log(`📦 Registros a migrar: ${dataRows.length}`)

const COL_MAP = { 0:'item', 1:'cod_inv', 2:'cod_esbye', 3:'cuenta', 4:'cant', 5:'descripcion', 6:'marca', 7:'modelo', 8:'serie', 9:'fecha_adquisicion', 10:'estado', 11:'valor', 12:'ubicacion', 13:'observaciones', 14:'no_acta', 15:'mes' }

function parseDate(val) {
  if (!val || val === 'S/F' || val === 'S/FECHA' || val === 'S/FECHA' || val === '' || val === 'SN' || val === 'S/N' || val === 'S/SERIE' || val === 'S/S' || val === 'S/MODELO' || val === 'S/M' || val === 'S/MARCA' || val === 'S/COD' || val === 'S/S') return null
  // Número serial de Excel
  if (!isNaN(val)) {
    const d = new Date(new Date(1899,11,30).getTime() + parseInt(val)*86400000)
    try { return d.toISOString().split('T')[0] } catch { return null }
  }
  // Formato DD/MM/YYYY (común en español)
  const dmy = val.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2,'0')}-${dmy[1].padStart(2,'0')}`
  // Intentar parseo estándar
  const d = new Date(val)
  if (!isNaN(d.getTime())) try { return d.toISOString().split('T')[0] } catch { return null }
  return null
}

async function migrate() {
  let inserted = 0, errors = 0
  for (let i = 0; i < dataRows.length; i += 100) {
    const batch = dataRows.slice(i, i + 100)
    const records = batch.map(row => {
      const r = {}
      Object.entries(COL_MAP).forEach(([ci, f]) => {
        let v = row[parseInt(ci)]
        if (f === 'fecha_adquisicion') v = parseDate(v)
        else if (f === 'cant' || f === 'item') v = parseInt(v) || 0
        else if (f === 'valor') v = parseFloat(String(v).replace(/[^0-9.-]/g,'')) || null
        r[f] = v
      })
      return r
    })

    const { error } = await supabase.from('items').insert(records)
    if (error) { console.error(`❌ Lote ${i}-${i+100}: ${error.message}`); errors += batch.length }
    else inserted += batch.length

    process.stdout.write(`\r📊 ${Math.min(100, Math.round((i+100)/dataRows.length*100))}% (${inserted} ok, ${errors} err)`)
  }
  console.log(`\n✅ Listo: ${inserted} insertados, ${errors} errores`)
}

migrate().catch(console.error)
