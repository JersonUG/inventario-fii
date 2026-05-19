'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Package, ArrowLeftRight, History, FileText, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/items', label: 'Inventario', icon: Package },
  { href: '/traslados', label: 'Traslados', icon: ArrowLeftRight },
  { href: '/historial', label: 'Historial', icon: History },
  { href: '/actas', label: 'Actas', icon: FileText },
]

export default function Sidebar({ userEmail, onLogout }: { userEmail?: string; onLogout: () => void }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-[#0f172a] text-white rounded-lg">
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-[#0f172a] text-white flex flex-col transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 border-b border-[#1e293b]">
          <div className="flex items-center gap-3 mb-2">
            <svg viewBox="0 0 50 50" className="w-8 h-8 flex-shrink-0" fill="none">
              <circle cx="25" cy="25" r="23" stroke="#38bdf8" strokeWidth="1.5" fill="none" />
              <path d="M25 8 L33 22 L25 18 L17 22 Z" fill="#38bdf8" />
              <rect x="15" y="22" width="20" height="16" rx="2" fill="#38bdf8" />
              <text x="25" y="36" textAnchor="middle" fill="#0f172a" fontSize="10" fontWeight="bold">FII</text>
            </svg>
            <div>
              <h1 className="text-lg font-bold leading-tight text-white">Inventario FII</h1>
              <p className="text-sky-400 text-[10px] leading-tight">UG · Fac. Ing. Industrial</p>
            </div>
          </div>
          <p className="text-sky-300 text-xs truncate">{userEmail}</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                pathname === href || pathname.startsWith(href + '/') ? 'bg-sky-600 text-white' : 'text-sky-200 hover:bg-[#1e293b] hover:text-white'
              }`}>
              <Icon size={20} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-[#1e293b]">
          <button onClick={onLogout} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sky-200 hover:bg-[#1e293b] hover:text-white w-full transition-colors">
            <LogOut size={20} />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {mobileOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />}
    </>
  )
}
