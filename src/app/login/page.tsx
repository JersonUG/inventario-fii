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
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-6 mb-3">
            <img src="/images/logo-ug.png" alt="UG" className="h-24 w-auto object-contain" />
            <img src="/images/logo-facultad.png" alt="FII" className="h-20 w-auto object-contain" />
          </div>
          <h1 className="text-xl font-bold text-gray-800" style={{ fontFamily: 'Georgia, serif' }}>UNIVERSIDAD DE GUAYAQUIL</h1>
          <p className="text-sm text-gray-600 mt-1 font-medium">Facultad de Ingeniería Industrial</p>
          <div className="w-16 h-0.5 bg-sky-500 mx-auto mt-3"></div>
          <p className="text-lg font-semibold text-[#0f172a] mt-3">Sistema de Inventario</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition"
              placeholder="admin@fii.edu" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition"
              placeholder="••••••••" required />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-[#0f172a] hover:bg-[#1e293b] text-white font-semibold py-3 rounded-lg transition duration-200 disabled:opacity-50">
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
        <p className="text-center text-xs text-gray-400 mt-4">Sistema de Gestión de Inventario</p>
      </div>
    </div>
  )
}
