'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { CheckCircle, Database, ArrowRight, Copy, Check, ExternalLink, Zap, Loader, AlertTriangle } from 'lucide-react'

export default function SetupPage() {
  const [status, setStatus] = useState<'checking' | 'ready' | 'needs_setup'>('checking')
  const [copied, setCopied] = useState(false)
  const [secretKey, setSecretKey] = useState('')
  const [migrating, setMigrating] = useState(false)
  const [migrateResult, setMigrateResult] = useState<{ ok: boolean; msg: string } | null>(null)

  useEffect(() => {
    supabase.from('user_profiles').select('id').limit(1).then(({ error }) => {
      if (error) {
        setStatus('needs_setup')
      } else {
        setStatus('ready')
      }
    })
  }, [])

  const handleCopy = async () => {
    try {
      const res = await fetch('/supabase-schema.sql')
      const sql = await res.text()
      await navigator.clipboard.writeText(sql)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch { }
  }

  const handleVerify = async () => {
    setStatus('checking')
    const { error } = await supabase.from('user_profiles').select('id').limit(1)
    setStatus(error ? 'needs_setup' : 'ready')
  }

  const handleAutoMigrate = async () => {
    if (!secretKey.trim()) return
    setMigrating(true)
    setMigrateResult(null)
    try {
      const res = await fetch('/api/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secretKey: secretKey.trim() }),
      })
      const data = await res.json()
      if (data.status === 'ok') {
        setMigrateResult({ ok: true, msg: data.message })
        setStatus('checking')
        supabase.from('user_profiles').select('id').limit(1).then(({ error }) => {
          setStatus(error ? 'needs_setup' : 'ready')
        })
      } else if (data.status === 'partial') {
        setMigrateResult({ ok: true, msg: `${data.message}. Algunas advertencias pueden ignorarse.` })
        setStatus('checking')
        supabase.from('user_profiles').select('id').limit(1).then(({ error }) => {
          setStatus(error ? 'needs_setup' : 'ready')
        })
      } else if (data.status === 'ready') {
        setMigrateResult({ ok: true, msg: 'La base de datos ya estaba migrada.' })
        setStatus('ready')
      } else {
        setMigrateResult({ ok: false, msg: data.error || data.message || 'Error desconocido' })
      }
    } catch (e: any) {
      setMigrateResult({ ok: false, msg: e.message })
    }
    setMigrating(false)
  }

  if (status === 'checking') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ug via-ug-dark to-ug flex items-center justify-center">
        <div className="bg-white/95 rounded-2xl p-8 shadow-2xl max-w-md w-full text-center">
          <Database className="mx-auto text-fii animate-pulse" size={48} />
          <p className="mt-4 text-gray-600 font-medium">Verificando base de datos...</p>
        </div>
      </div>
    )
  }

  if (status === 'ready') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ug via-ug-dark to-ug flex items-center justify-center p-4">
        <div className="bg-white/95 rounded-2xl p-8 shadow-2xl max-w-md w-full text-center">
          <CheckCircle className="mx-auto text-emerald-500" size={64} />
          <h1 className="text-2xl font-bold text-gray-800 mt-4">Sistema listo</h1>
          <p className="text-gray-500 mt-2">La base de datos está configurada correctamente</p>
          <div className="mt-6 space-y-2 text-left bg-gray-50 rounded-xl p-4 text-sm">
            <p><strong className="text-gray-700">Admin:</strong> admin@fii.edu / admin123</p>
            <p><strong className="text-gray-700">Operador:</strong> colaborador@fii.edu / colab123</p>
            <p><strong className="text-gray-700">Auditor:</strong> auditor@fii.edu / audit123</p>
          </div>
          <a href="/dashboard" className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-ug to-ug-light text-white rounded-xl font-medium hover:shadow-lg transition-all">
            Ir al Dashboard <ArrowRight size={18} />
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ug via-ug-dark to-ug flex items-center justify-center p-4">
      <div className="bg-white/95 rounded-2xl p-8 shadow-2xl max-w-3xl w-full">
        <div className="text-center mb-6">
          <Database className="mx-auto text-fii" size={48} />
          <h1 className="text-xl font-bold text-gray-800 mt-4">Configuración inicial requerida</h1>
          <p className="text-sm text-gray-500 mt-2">
            La base de datos necesita ser configurada por primera vez.
            Sigue estos pasos:
          </p>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-xl p-5 mb-6">
          <div className="flex items-center gap-2 text-purple-800 font-semibold mb-3">
            <Zap size={20} /> Migración automática
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Si tienes la <strong>Service Role Key</strong> (llave secreta) de Supabase, pégala aquí y la migración se ejecutará automáticamente.
            <br />La encuentras en: Supabase Dashboard → Project Settings → API → <code className="bg-purple-100 px-1 rounded">service_role key</code>
          </p>
          <div className="flex gap-2">
            <input type="password" value={secretKey} onChange={e => setSecretKey(e.target.value)}
              placeholder="sb_secret_..."
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500" />
            <button onClick={handleAutoMigrate} disabled={migrating || !secretKey.trim()}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all disabled:opacity-50 inline-flex items-center gap-2">
              {migrating ? <Loader size={16} className="animate-spin" /> : <Zap size={16} />}
              {migrating ? 'Migrando...' : 'Migrar'}
            </button>
          </div>
          {migrateResult && (
            <div className={`mt-3 flex items-start gap-2 text-sm p-3 rounded-lg ${migrateResult.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
              {migrateResult.ok ? <CheckCircle size={16} className="mt-0.5 shrink-0" /> : <AlertTriangle size={16} className="mt-0.5 shrink-0" />}
              <span>{migrateResult.msg}</span>
            </div>
          )}
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
          <div className="relative flex justify-center"><span className="bg-white px-3 text-sm text-gray-400">O manualmente</span></div>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-3 bg-blue-50 rounded-xl p-4">
            <span className="w-7 h-7 bg-fii text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">1</span>
            <div>
              <p className="font-medium text-gray-800">Abre Supabase SQL Editor</p>
              <a href="https://supabase.com/dashboard/project/pivjjwymjutxqdjvmjdt/sql/new" target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1 text-fii hover:underline text-sm mt-1">
                <ExternalLink size={14} /> Abrir Supabase SQL Editor
              </a>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-emerald-50 rounded-xl p-4">
            <span className="w-7 h-7 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">2</span>
            <div>
              <p className="font-medium text-gray-800">Copia el script SQL</p>
              <button onClick={handleCopy}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                {copied ? <><Check size={16} className="text-emerald-500" /> Copiado</> : <><Copy size={16} /> Copiar supabase-schema.sql</>}
              </button>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-amber-50 rounded-xl p-4">
            <span className="w-7 h-7 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">3</span>
            <div>
              <p className="font-medium text-gray-800">Pega y ejecuta en Supabase</p>
              <p className="text-sm text-gray-600 mt-1">Pega todo el contenido en el SQL Editor y haz clic en <strong>"Run"</strong> o <strong>Ctrl+Enter</strong></p>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-purple-50 rounded-xl p-4">
            <span className="w-7 h-7 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">4</span>
            <div>
              <p className="font-medium text-gray-800">Vuelve aquí y verifica</p>
              <button onClick={handleVerify}
                className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-fii to-fii-light text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all">
                <CheckCircle size={16} /> Ya ejecuté el SQL
              </button>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-400 text-center mt-6">
          Este proceso solo se realiza una vez. Si ya ejecutaste el SQL, haz clic en "Ya ejecuté el SQL".
        </p>
      </div>
    </div>
  )
}
