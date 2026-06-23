import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const { secretKey } = await req.json()
    if (!secretKey) {
      return NextResponse.json({ error: 'Secret key requerida' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabase = createClient(supabaseUrl, secretKey)

    const { data, error } = await supabase.from('user_profiles').select('id').limit(1)
    if (!error) {
      return NextResponse.json({ status: 'ready', message: 'Base de datos ya migrada' })
    }

    const fs = await import('fs')
    const path = await import('path')
    const sqlPath = path.join(process.cwd(), 'supabase-schema.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')

    const statements = sql.split(';')
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 10 && !s.startsWith('--'))

    let success = 0, failed = 0, errors: string[] = []

    for (const stmt of statements) {
      try {
        const res = await fetch(`${supabaseUrl}/rest/v1/sql`, {
          method: 'POST',
          headers: {
            'apikey': secretKey,
            'Authorization': `Bearer ${secretKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: stmt + ';' }),
        })
        if (res.ok || res.status === 204 || res.status === 201) {
          success++
        } else {
          const text = await res.text()
          if (text.includes('already exists') || text.includes('duplicate') || text.includes('already there')) {
            success++
          } else {
            errors.push(`Stmt ${success + failed + 1}: ${text.substring(0, 100)}`)
            failed++
          }
        }
      } catch (e: any) {
        errors.push(`Stmt ${success + failed + 1}: ${e.message}`)
        failed++
      }
    }

    await syncUserProfiles(supabaseUrl, secretKey)

    return NextResponse.json({
      status: failed === 0 ? 'ok' : 'partial',
      success, failed, errors: errors.slice(0, 10),
      message: failed === 0 ? 'Migración completada exitosamente' : `Migración parcial: ${success} OK, ${failed} fallos`,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

async function syncUserProfiles(supabaseUrl: string, secretKey: string) {
  const res = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    headers: { 'apikey': secretKey, 'Authorization': `Bearer ${secretKey}` },
  })
  if (!res.ok) return
  const data = await res.json()
  const users = data.users || []

  for (const u of users) {
    let rol = 'CONSULTA'
    if (u.email === 'admin@fii.edu') rol = 'ADMINISTRADOR'
    else if (u.email === 'colaborador@fii.edu') rol = 'OPERADOR'
    await fetch(`${supabaseUrl}/rest/v1/user_profiles?on_conflict=user_id`, {
      method: 'POST',
      headers: {
        'apikey': secretKey, 'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify({ user_id: u.id, email: u.email, rol }),
    })
  }
}
