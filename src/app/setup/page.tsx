'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { CheckCircle, Database, ArrowRight, Copy, Check, ExternalLink } from 'lucide-react'

export default function SetupPage() {
  const [status, setStatus] = useState<'checking' | 'ready' | 'needs_setup'>('checking')
  const [copied, setCopied] = useState(false)

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
