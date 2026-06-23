const fs = require('fs')
const csv = fs.readFileSync('C:/Users/USER/Desktop/AngVel/MATRIZ GENERAL  DE BIENES 2026/inventario_limpio_ready.csv', 'utf8')
const lines = csv.split('\n').filter(l => l.trim())
const estado = {}, cuenta = {}, colores = {}
let sinUbi = 0, sinMarca = 0
for (let i = 1; i < lines.length; i++) {
  const row = parseLine(lines[i])
  const e = String(row[10] || '').trim()
  const c = String(row[3] || '').trim()
  const col = String(row[15] || '').trim()
  estado[e] = (estado[e] || 0) + 1
  cuenta[c] = (cuenta[c] || 0) + 1
  if (!row[12] || !String(row[12]).trim()) sinUbi++
  if (!row[6] || !String(row[6]).trim()) sinMarca++
  if (col) colores[col] = (colores[col] || 0) + 1
}
console.log('Total:', lines.length - 1)
console.log('\nESTADOS:')
Object.entries(estado).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(v, 'x', k))
console.log('\nSin ubicacion:', sinUbi)
console.log('Sin marca:', sinMarca)
console.log('\nCOLORES (top 15):')
Object.entries(colores).sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([k, v]) => console.log(v, 'x', k))

function parseLine(line) {
  const res = []
  let cur = '', q = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') { q = !q; continue }
    if (c === ',' && !q) { res.push(cur); cur = ''; continue }
    cur += c
  }
  res.push(cur)
  return res
}
