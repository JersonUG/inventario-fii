'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import BrandHeader from '@/components/BrandHeader'
import { ArrowLeft } from 'lucide-react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const isMainPage = ['/dashboard', '/items', '/actas', '/historial', '/traslados'].includes(pathname)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login') } else { setUser(user) }
      setLoading(false)
    })
  }, [router])

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div></div>
  if (!user) return null

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar userEmail={user.email} onLogout={() => { supabase.auth.signOut(); router.push('/login') }} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <BrandHeader />
        <div className="flex items-center gap-2 px-6 py-2 bg-white border-b border-gray-200">
          {!isMainPage && (
            <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-gray-600 hover:text-sky-600 transition-colors">
              <ArrowLeft size={16} /> Volver
            </button>
          )}
          <div className="flex-1" />
          <p className="text-xs text-gray-400 capitalize truncate">{pathname.replace(/\//g, ' › ').replace(/^./, '')}</p>
        </div>
        <div className="flex-1 overflow-auto p-6">{children}</div>
      </main>
    </div>
  )
}
