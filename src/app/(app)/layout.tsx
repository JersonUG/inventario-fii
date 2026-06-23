'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import Sidebar from '@/components/Sidebar'
import BrandHeader from '@/components/BrandHeader'
import { ArrowLeft } from 'lucide-react'

const MAIN_PAGES = ['/dashboard', '/items', '/actas', '/historial', '/traslados', '/no-localizados']

function AppContent({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const isMainPage = MAIN_PAGES.includes(pathname)

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [loading, user, router])

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fii"></div></div>
  if (!user) return null

  const userRol = profile?.rol || 'CONSULTA'

  return (
    <div className="flex h-screen bg-gray-50 uppercase-mode">
      <Sidebar userEmail={user.email} userRol={userRol} onLogout={async () => {
        await supabase.from('auth_log').insert([{
          user_id: user.id, user_name: user.email || 'Sistema',
          action: 'logout',
        }])
        await supabase.auth.signOut()
        router.push('/login')
      }} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <BrandHeader />
        <div className="flex items-center gap-2 px-6 py-2 bg-white border-b border-gray-100 shadow-sm">
          {!isMainPage && (
            <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-fii transition-colors font-medium px-2 py-1 rounded-md hover:bg-blue-50">
              <ArrowLeft size={16} /> Volver
            </button>
          )}
          <div className="flex-1" />
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            <span className="capitalize">{pathname.replace(/\//g, ' › ').replace(/^./, '')}</span>
          </div>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            userRol === 'ADMINISTRADOR' ? 'bg-purple-100 text-purple-700'
            : userRol === 'OPERADOR' ? 'bg-blue-100 text-blue-700'
            : 'bg-gray-100 text-gray-600'
          }`}>
            {userRol}
          </span>
        </div>
        <div className="flex-1 overflow-auto p-6">{children}</div>
      </main>
    </div>
  )
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppContent>{children}</AppContent>
    </AuthProvider>
  )
}
