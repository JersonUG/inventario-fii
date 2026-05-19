'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Package, FileText, AlertTriangle, TrendingUp } from 'lucide-react'

export default function DashboardPage() {
  const [stats, setStats] = useState({ total: 0, activos: 0, bajas: 0, actas: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { count: total } = await supabase.from('items').select('*', { count: 'exact', head: true })
      const { count: activos } = await supabase.from('items').select('*', { count: 'exact', head: true }).eq('is_active', true)
      const { count: bajas } = await supabase.from('items').select('*', { count: 'exact', head: true }).eq('is_active', false)
      const { count: actas } = await supabase.from('actas').select('*', { count: 'exact', head: true })
      setStats({ total: total || 0, activos: activos || 0, bajas: bajas || 0, actas: actas || 0 })
      setLoading(false)
    }
    load()
  }, [])

  const cards = [
    { label: 'Total Registros', value: stats.total, icon: Package, color: 'bg-blue-500', href: '/items' },
    { label: 'Activos', value: stats.activos, icon: TrendingUp, color: 'bg-green-500', href: '/items' },
    { label: 'Dados de Baja', value: stats.bajas, icon: AlertTriangle, color: 'bg-red-500', href: '/items?bajas=true' },
    { label: 'Actas Digitalizadas', value: stats.actas, icon: FileText, color: 'bg-purple-500', href: '/actas' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map(({ label, value, icon: Icon, color, href }) => (
          <Link key={label} href={href} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{loading ? <span className="inline-block w-16 h-8 bg-gray-200 animate-pulse rounded" /> : value.toLocaleString()}</p>
              </div>
              <div className={`${color} p-3 rounded-lg`}><Icon className="w-6 h-6 text-white" /></div>
            </div>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/items/new" className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
            <p className="font-medium text-blue-900">Agregar Nuevo Ítem</p>
            <p className="text-sm text-blue-600 mt-1">Registrar un nuevo activo en el inventario</p>
          </Link>
          <Link href="/traslados" className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
            <p className="font-medium text-green-900">Realizar Traslado</p>
            <p className="text-sm text-green-600 mt-1">Cambiar ubicación o propiedad de activos</p>
          </Link>
          <Link href="/actas/nueva" className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
            <p className="font-medium text-purple-900">Nueva Acta</p>
            <p className="text-sm text-purple-600 mt-1">Digitalizar o generar un acta</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
