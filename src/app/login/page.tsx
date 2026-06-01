'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { toast.error(error.message); setLoading(false); return }
    toast.success('Inicio de sesión exitoso')
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ug via-ug-dark to-ug flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-fii/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-fii-light/5 rounded-full blur-3xl" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwZTg1Y2EiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />

      <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-md p-8 relative z-10 border border-white/10">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-6 mb-4">
            <div className="p-2 bg-gray-50 rounded-xl shadow-sm">
              <img src="/images/logo-ug.png" alt="UG" className="h-20 w-auto object-contain" />
            </div>
            <div className="p-2 bg-gray-50 rounded-xl shadow-sm">
              <img src="/images/logo-facultad.png" alt="FII" className="h-16 w-auto object-contain" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-gray-800" style={{ fontFamily: 'Georgia, serif' }}>UNIVERSIDAD DE GUAYAQUIL</h1>
          <p className="text-sm text-gray-600 mt-1 font-medium">Facultad de Ingeniería Industrial</p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="w-8 h-0.5 bg-gradient-to-r from-transparent to-fii rounded-full" />
            <span className="w-8 h-0.5 bg-fii rounded-full" />
            <span className="w-8 h-0.5 bg-gradient-to-l from-transparent to-fii rounded-full" />
          </div>
          <p className="text-lg font-semibold text-ug mt-3">Sistema de Inventario</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-fii focus:border-transparent outline-none transition-all duration-200 bg-gray-50/50"
              placeholder="admin@fii.edu" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-fii focus:border-transparent outline-none transition-all duration-200 bg-gray-50/50"
              placeholder="••••••••" required />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-gradient-to-r from-ug to-ug-light hover:from-fii hover:to-fii-light text-white font-semibold py-3 rounded-xl transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl">
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
        <p className="text-center text-xs text-gray-400 mt-4">Sistema de Gestión de Inventario Patrimonial</p>
      </div>
    </div>
  )
}
