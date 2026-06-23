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

const HEADER_MAP = {
  item: 'item',
  codigo_inventario: 'cod_inv',
  codigo_esbye: 'cod_esbye',
  cuenta: 'cuenta',
  cantidad: 'cant',
  descripcion: 'descripcion',
  marca: 'marca',
  modelo: 'modelo',
  serie: 'serie',
  fecha_adquisicion: 'fecha_adquisicion',
  estado: 'estado',
  valor: 'valor',
  ubicacion: 'ubicacion',
  observaciones: 'observaciones',
  numero_acta: 'no_acta',
  colores: 'mes',
}

function parseDate(val) {
  if (!val || val === 'S/F' || val === 'S/FECHA' || val === '' || val === 'SN' || val === 'S/N' || val === 'S/SERIE' || val === 'S/S' || val === 'S/MODELO' || val === 'S/M' || val === 'S/MARCA' || val === 'S/COD' || val === 'S/S') return null
  if (!isNaN(val)) {
    const d = new Date(new Date(1899,11,30).getTime() + parseInt(val)*86400000)
    try { return d.toISOString().split('T')[0] } catch { return null }
  }
  const ymd = val.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (ymd) return val
  const dmy = val.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2,'0')}-${dmy[1].padStart(2,'0')}`
  const d = new Date(val)
  if (!isNaN(d.getTime())) try { return d.toISOString().split('T')[0] } catch { return null }
  return null
}

function normalizeEstado(raw) {
  const v = (raw || '').trim().toLowerCase().replace(/^\w/, c => c.toUpperCase())
  if (!v || v === 'S/M' || v === 'S/N') return 'Regular'
  const map = {
    Buena: 'Bueno', Buieno: 'Bueno',
    Mala: 'Malo', Malos: 'Malo', Dañado: 'Malo', Dañada: 'Malo',
    Rgular: 'Regular', Negro: 'Regular', Sn: 'Regular',
    Reparación: 'Reparacion',
  }
  return map[v] || v
}

function normalizeCuenta(raw) {
  const rawUpper = (raw || '').toUpperCase().replace(/[.\s]+/g, ' ').trim()
  const eq = ['EQUIPOS, SISTEMA Y P','EQUIPOS, SISTEMA,P','EQUIPOS, SISTEMA P','EQUIPOS, SISTEMAS','EQUIPO Y SISTEMA','EQUIPOS Y SISTEMAS','EQUIPOS, SISTEMA Y P.','EQUIPO','EQUPO','EQUIPOS, SISTEMAS Y P']
  const mq = ['MAQUINARIA Y EQUIPO','MAQUINARIA Y EQUIPOS','MAQUINARIAS Y EQUIPO','MAQUINARIAS Y EQUIPOS']
  if (eq.includes(rawUpper)) return 'Equipos, Sistemas y P'
  if (mq.includes(rawUpper)) return 'Maquinarias y Equipos'
  return 'S/CTA'
}

function detectBaja(r) {
  const text = ((r.observaciones || '') + ' ' + (r.mes || '')).toUpperCase()
  if (text.includes('SE DIO DE BAJA') || text.includes('DIO DE BAJA')) {
    r.estado = 'Dado de Baja'; r.is_active = false
  } else if (text.includes('PARA LA BAJA') || text.includes('POSIBLE BAJA') || text.includes('DAR DE BAJA') || text.includes('DE BAJA') || text.includes('SUBASTA') || text.includes('CHATARRI')) {
    if (r.estado !== 'Dado de Baja') r.estado = 'Para Baja'
  }
}

function classifyActivo(r) {
  if (r.is_missing) return 'NO_LOCALIZADO'
  if (r.estado === 'Dado de Baja') return 'DADO_DE_BAJA'
  if (r.estado === 'Para Baja') return 'PROXIMO_A_BAJA'
  return 'ACTIVO'
}

async function migrate() {
  // 1. Autenticar
  const { data: { user }, error: loginError } = await supabase.auth.signInWithPassword({
    email: 'admin@fii.edu',
    password: 'Admin123!',
  })
  if (loginError) { console.error('❌ Error al autenticar:', loginError.message); process.exit(1) }
  console.log(`✅ Autenticado como: ${user.email}`)

  // 2. Buscar archivo (CSV primero, luego Excel)
  const rootDir = path.join(__dirname, '..')
  const files = fs.readdirSync(rootDir)
  let dataFile = files.find(f => f.match(/\.csv$/i))
  if (!dataFile) dataFile = files.find(f => f.match(/\.(xlsx|xls)$/i))
  if (!dataFile) { console.error('❌ No se encontró archivo CSV o Excel en:', rootDir); process.exit(1) }
  console.log(`📄 Leyendo: ${dataFile}`)

  const isCSV = dataFile.match(/\.csv$/i)
  let rows
  if (isCSV) {
    const csvText = fs.readFileSync(path.join(rootDir, dataFile), 'utf8')
    const lines = csvText.split('\n').filter(l => l.trim())
    const headerRow = lines[0].split(',').map(h => JSON.parse(h))
    rows = lines.slice(1).map(line => {
      const vals = parseCSVLine(line)
      const obj = {}
      headerRow.forEach((h, i) => { obj[h] = (vals[i] || '').trim() })
      return obj
    })
  } else {
    const workbook = XLSX.readFile(path.join(rootDir, dataFile), { cellDates: true })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const raw = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false })
    rows = raw.slice(3).filter(row => row[0]).map(row => {
      const obj = {}
      const idxToKey = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17]
      const csvKeys = Object.keys(HEADER_MAP) // item, codigo_inventario, codigo_esbye...
      idxToKey.forEach((ci, i) => { if (csvKeys[i]) obj[csvKeys[i]] = row[ci] })
      // Col 17 (COLORES) en v7 → agregar a observaciones para deteccion de baja
      if (row[17]) obj.observaciones = ((obj.observaciones||'') + ' / ' + row[17]).replace(/^\/ /,'')
      // Col 16 legacy (formato anterior, ausente en v7)
      if (row[16] && !row[17]) obj.observaciones = ((obj.observaciones||'') + ' / ' + row[16]).replace(/^\/ /,'')
      return obj
    })
  }

  console.log(`📊 Registros a migrar: ${rows.length}`)

  // 3. Limpiar datos existentes
  console.log('🗑️ Eliminando datos existentes...')
  for (const table of ['acta_items', 'item_history', 'items']) {
    const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (error && table === 'items') { console.error('❌ Error al limpiar:', error.message); process.exit(1) }
    else if (error) console.warn(`⚠️ Error al limpiar ${table}:`, error.message)
  }
  console.log('✅ Datos existentes eliminados')

  // 4. Migrar en lotes
  let inserted = 0, errors = 0
  for (let i = 0; i < rows.length; i += 100) {
    const batch = rows.slice(i, i + 100)
    const records = batch.map(row => {
      const r = {}
      Object.entries(HEADER_MAP).forEach(([src, dest]) => {
        let v = row[src] !== undefined ? row[src] : ''
        if (dest === 'fecha_adquisicion') v = parseDate(v)
        else if (dest === 'cant' || dest === 'item') v = parseInt(v) || 0
        else if (dest === 'valor') v = parseFloat(String(v).replace(/[^0-9.-]/g,'')) || null
        r[dest] = v
      })
      r.estado = normalizeEstado(r.estado)
      r.cuenta = normalizeCuenta(r.cuenta)
      detectBaja(r)
      r.clasificacion_activo = classifyActivo(r)
      return r
    })

    const { error } = await supabase.from('items').insert(records)
    if (error) { console.error(`\n❌ Lote ${i}-${i+100}: ${error.message}`); errors += batch.length }
    else inserted += batch.length

    process.stdout.write(`\r📊 ${Math.min(100, Math.round((i+100)/rows.length*100))}% (${inserted} ok, ${errors} err)`)
  }

  await supabase.auth.signOut()
  console.log(`\n✅ Migración completada: ${inserted} insertados, ${errors} errores`)
}

function parseCSVLine(line) {
  const result = []
  let current = '', inQuote = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') { inQuote = !inQuote; continue }
    if (c === ',' && !inQuote) { result.push(current); current = ''; continue }
    current += c
  }
  result.push(current)
  return result
}

migrate().catch(console.error)
