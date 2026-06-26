import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import ExcelJS from 'exceljs'

export async function POST(req: NextRequest) {
  try {
    const { clasificacion, search, filters: filtersStr } = await req.json()
    const filters: Record<string, string> = filtersStr || {}

    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { authorization: authHeader } },
    })

    const buildQuery = () => {
      let q = supabase
        .from('items')
        .select('item,cod_inv,cod_esbye,cuenta,cant,descripcion,marca,modelo,serie,fecha_adquisicion,estado,valor,ubicacion,observaciones,no_acta,servidor_asignado,clasificacion_activo')
        .order('item', { ascending: true })
      if (clasificacion) q = q.eq('clasificacion_activo', clasificacion)
      if (search) {
        q = q.or(
          `cod_inv.ilike.%${search}%,descripcion.ilike.%${search}%,serie.ilike.%${search}%,marca.ilike.%${search}%,modelo.ilike.%${search}%,ubicacion.ilike.%${search}%,observaciones.ilike.%${search}%,no_acta.ilike.%${search}%,cod_esbye.ilike.%${search}%,servidor_asignado.ilike.%${search}%`
        )
      }
      Object.entries(filters).forEach(([key, value]) => {
        if (value) q = q.ilike(key, value)
      })
      return q
    }

    const PAGE_SIZE = 1000
    let allItems: any[] = []
    let page = 0
    let hasMore = true

    while (hasMore) {
      const from = page * PAGE_SIZE
      const to = from + PAGE_SIZE - 1
      const { data, error } = await buildQuery().range(from, to)
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      if (!data || data.length === 0) {
        hasMore = false
      } else {
        allItems = allItems.concat(data)
        hasMore = data.length === PAGE_SIZE
        page++
      }
    }

    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'Inventario FII'
    workbook.created = new Date()

    const ws = workbook.addWorksheet('Inventario')

    const headerStyle: Partial<ExcelJS.Style> = {
      font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 11, name: 'Calibri' },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF002855' } },
      alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
      border: {
        top: { style: 'thin' }, bottom: { style: 'thin' },
        left: { style: 'thin' }, right: { style: 'thin' },
      },
    }

    const cellStyle: Partial<ExcelJS.Style> = {
      font: { size: 10, name: 'Calibri' },
      alignment: { vertical: 'middle', wrapText: true },
      border: {
        top: { style: 'thin' }, bottom: { style: 'thin' },
        left: { style: 'thin' }, right: { style: 'thin' },
      },
    }

    const columnHeaders = [
      'ITEM', 'COD. INV', 'COD. ESBYE', 'CUENTA', 'CANT',
      'DESCRIPCIÓN', 'MARCA', 'MODELO', 'SERIE', 'FECHA ADQ.',
      'ESTADO', 'VALOR ($)', 'UBICACIÓN', 'OBSERVACIONES',
      'No. ACTA', 'SERVIDOR ASIGNADO', 'CLASIFICACIÓN',
    ]

    const headerRow = ws.addRow(columnHeaders)
    headerRow.eachCell(cell => { cell.style = headerStyle })
    headerRow.height = 30

    const colWidths = [8, 14, 14, 12, 6, 40, 16, 16, 18, 14, 12, 12, 20, 30, 14, 20, 16]
    ws.columns = columnHeaders.map((_, i) => ({ width: colWidths[i] || 12 }))

    const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('es-ES') : '-'

    for (const item of allItems) {
      const row = ws.addRow([
        item.item, item.cod_inv, item.cod_esbye, item.cuenta, item.cant,
        item.descripcion, item.marca, item.modelo, item.serie,
        formatDate(item.fecha_adquisicion), item.estado,
        item.valor != null ? item.valor : null, item.ubicacion, item.observaciones,
        item.no_acta || '-', item.servidor_asignado || '-', item.clasificacion_activo,
      ])
      row.eachCell(cell => { cell.style = cellStyle })
    }

    if (allItems.length) {
      const lastRow = ws.lastRow!.number
      for (let col = 1; col <= columnHeaders.length; col++) {
        ws.getCell(lastRow, col).border = {
          top: { style: 'thin' }, bottom: { style: 'medium' },
          left: { style: 'thin' }, right: { style: 'thin' },
        }
      }
    }

    const buf = await workbook.xlsx.writeBuffer()

    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Inventario_FII_${new Date().toISOString().split('T')[0]}.xlsx"`,
        'Content-Length': buf.byteLength.toString(),
        'X-Total-Count': allItems.length.toString(),
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
