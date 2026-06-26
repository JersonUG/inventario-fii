import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import JSZip from 'jszip'

export async function POST(req: NextRequest) {
  try {
    const { year } = await req.json()
    if (!year || !/^\d{4}$/.test(year)) {
      return NextResponse.json({ error: 'Año inválido' }, { status: 400 })
    }

    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { authorization: authHeader } },
    })

    const { data: actas, error } = await supabase
      .from('actas')
      .select('id,name,file_url,file_type')
      .gte('fecha', `${year}-01-01`)
      .lte('fecha', `${year}-12-31`)
      .not('file_url', 'is', null)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!actas || actas.length === 0) {
      return NextResponse.json({ error: 'No hay documentos en este año' }, { status: 404 })
    }

    const zip = new JSZip()

    for (const acta of actas) {
      if (!acta.file_url) continue
      try {
        const res = await fetch(acta.file_url)
        if (!res.ok) continue
        const buffer = await res.arrayBuffer()
        const ext = acta.file_type?.includes('pdf') ? '.pdf' : '.pdf'
        const safeName = acta.name.replace(/[^a-zA-Z0-9áéíóúñÑüÜ\s._-]/g, '').substring(0, 80) || `documento_${acta.id.substring(0, 8)}`
        zip.file(`${safeName}${ext}`, buffer)
      } catch { }
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })

    return new NextResponse(new Uint8Array(zipBuffer), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="Archivo_${year}.zip"`,
        'Content-Length': zipBuffer.byteLength.toString(),
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
