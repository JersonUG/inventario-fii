'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Package, ArrowLeftRight, History, FileText, LogOut, Menu, X, SearchX, AlertTriangle, Trash2 } from 'lucide-react'
import { useState } from 'react'

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/items', label: 'Inventario General', icon: Package },
  { href: '/items?clasificacion=DADO_DE_BAJA', label: 'Dados de Baja', icon: Trash2 },
  { href: '/no-localizados', label: 'No Localizados', icon: SearchX },
  { href: '/items?clasificacion=PROXIMO_A_BAJA', label: 'Próximos a Baja', icon: AlertTriangle },
  { href: '/traslados', label: 'Traslados', icon: ArrowLeftRight },
  { href: '/actas', label: 'Actas', icon: FileText },
  { href: '/historial', label: 'Historial', icon: History },
]

export default function Sidebar({ userEmail, onLogout }: { userEmail?: string; onLogout: () => void }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-ug text-white rounded-lg">
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-ug text-white flex flex-col transition-transform duration-300 shadow-2xl ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="relative p-6 border-b border-ug-light/30 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-fii/20 to-transparent pointer-events-none" />
          <div className="flex items-center gap-3 mb-2 relative z-10">
            <div className="w-10 h-10 bg-gradient-to-br from-fii to-fii-light rounded-xl flex items-center justify-center shadow-lg shadow-fii/30">
              <svg viewBox="0 0 50 50" className="w-6 h-6" fill="none">
                <path d="M25 8 L33 22 L25 18 L17 22 Z" fill="white" />
                <rect x="15" y="22" width="20" height="16" rx="2" fill="white" />
                <text x="25" y="36" textAnchor="middle" fill="#002855" fontSize="10" fontWeight="bold">FII</text>
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight text-white">Inventario FII</h1>
              <p className="text-fii-light text-[10px] leading-tight tracking-wider">UG · FAC. ING. INDUSTRIAL</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 relative z-10">
            <div className="w-1.5 h-1.5 rounded-full bg-fii-light animate-pulse" />
            <p className="text-fii-light/80 text-xs truncate font-medium">{userEmail}</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link key={href} href={href} onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 relative group ${
                  isActive ? 'bg-gradient-to-r from-fii/90 to-fii-light/80 text-white shadow-lg shadow-fii/20' : 'text-blue-200 hover:bg-white/5 hover:text-white'
                }`}>
                {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-fii-light rounded-r-full" />}
                <div className={`p-1.5 rounded-lg transition-all duration-200 ${isActive ? 'bg-white/15' : 'group-hover:bg-white/5'}`}>
                  <Icon size={18} />
                </div>
                <span className="font-medium text-sm">{label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t border-ug-light/30">
          <button onClick={onLogout} className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-blue-200 hover:bg-white/5 hover:text-white w-full transition-all duration-200 group">
            <div className="p-1.5 rounded-lg group-hover:bg-white/5 transition-colors"><LogOut size={18} /></div>
            <span className="font-medium text-sm">Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {mobileOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />}
    </>
  )
}
