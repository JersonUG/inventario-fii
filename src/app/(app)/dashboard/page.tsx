'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useRealtime } from '@/hooks/useRealtime'
import Link from 'next/link'
import { Package, FileText, AlertTriangle, TrendingUp, Plus, ArrowRightLeft, FilePlus, SearchX } from 'lucide-react'

export default function DashboardPage() {
  const [stats, setStats] = useState({ total: 0, activos: 0, bajas: 0, actas: 0, paraBaja: 0, noLocalizados: 0 })
  const [loading, setLoading] = useState(true)

  const loadStats = useCallback(async () => {
    const { count: total } = await supabase.from('items').select('*', { count: 'exact', head: true })
    const { count: activos } = await supabase.from('items').select('*', { count: 'exact', head: true }).eq('clasificacion_activo', 'ACTIVO')
    const { count: bajas } = await supabase.from('items').select('*', { count: 'exact', head: true }).eq('clasificacion_activo', 'DADO_DE_BAJA')
    const { count: actas } = await supabase.from('actas').select('*', { count: 'exact', head: true })
    const { count: paraBaja } = await supabase.from('items').select('*', { count: 'exact', head: true }).eq('clasificacion_activo', 'PROXIMO_A_BAJA')
    const { count: noLocalizados } = await supabase.from('items').select('*', { count: 'exact', head: true }).eq('clasificacion_activo', 'NO_LOCALIZADO')
    setStats({ total: total || 0, activos: activos || 0, bajas: bajas || 0, actas: actas || 0, paraBaja: paraBaja || 0, noLocalizados: noLocalizados || 0 })
    setLoading(false)
  }, [])

  useRealtime('items', loadStats)
  useRealtime('actas', loadStats)
  useEffect(() => { loadStats() }, [loadStats])

  const cards = [
    { label: 'Total Registros', value: stats.total, icon: Package, from: 'from-fii', to: 'to-fii-dark', href: '/items' },
    { label: 'Activos', value: stats.activos, icon: TrendingUp, from: 'from-emerald-500', to: 'to-green-700', href: '/items?clasificacion=ACTIVO' },
    { label: 'Dados de Baja', value: stats.bajas, icon: AlertTriangle, from: 'from-amber-500', to: 'to-orange-700', href: '/items?clasificacion=DADO_DE_BAJA' },
    { label: 'Actas Digitalizadas', value: stats.actas, icon: FileText, from: 'from-violet-500', to: 'to-purple-700', href: '/actas' },
    { label: 'Próximos a Baja', value: stats.paraBaja, icon: AlertTriangle, from: 'from-red-500', to: 'to-red-700', href: '/items?clasificacion=PROXIMO_A_BAJA' },
    { label: 'No Localizados', value: stats.noLocalizados, icon: SearchX, from: 'from-orange-500', to: 'to-orange-700', href: '/no-localizados' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Panel general del sistema de inventario</p>
        </div>
        <div className="flex gap-2">
          <Link href="/items/new" className="btn-primary"><Plus size={16} /> Nuevo Ítem</Link>
          <Link href="/actas/nueva" className="btn-secondary"><FilePlus size={16} /> Nueva Acta</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {cards.map(({ label, value, icon: Icon, from, to, href }) => (
          <Link key={label} href={href} className={`card-gradient bg-gradient-to-br ${from} ${to} p-[1px]`}>
            <div className="bg-white/95 backdrop-blur rounded-[11px] p-5 h-full hover:bg-white/90 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{label}</p>
                  <p className="text-3xl font-bold text-gray-800 mt-1.5">
                    {loading ? <span className="inline-block w-16 h-8 bg-gray-200 animate-pulse rounded" /> : value.toLocaleString()}
                  </p>
                </div>
                <div className={`bg-gradient-to-br ${from} ${to} p-3 rounded-xl shadow-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-fii rounded-full inline-block" />
          Acciones Rápidas
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/items/new" className="group p-5 bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-100 hover:border-fii/30 transition-all duration-200">
            <div className="w-10 h-10 bg-gradient-to-br from-fii to-fii-light rounded-lg flex items-center justify-center shadow-sm mb-3 group-hover:shadow-md transition-shadow">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <p className="font-semibold text-gray-800 group-hover:text-sky-700 transition-colors">Agregar Nuevo Ítem</p>
            <p className="text-sm text-gray-500 mt-1">Registrar un nuevo activo en el inventario</p>
          </Link>
          <Link href="/traslados" className="group p-5 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border border-emerald-100 hover:border-emerald-300 transition-all duration-200">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-sm mb-3 group-hover:shadow-md transition-shadow">
              <ArrowRightLeft className="w-5 h-5 text-white" />
            </div>
            <p className="font-semibold text-gray-800 group-hover:text-emerald-700 transition-colors">Realizar Traslado</p>
            <p className="text-sm text-gray-500 mt-1">Cambiar ubicación o propiedad de activos</p>
          </Link>
          <Link href="/actas/nueva" className="group p-5 bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl border border-violet-100 hover:border-violet-300 transition-all duration-200">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-violet-600 rounded-lg flex items-center justify-center shadow-sm mb-3 group-hover:shadow-md transition-shadow">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <p className="font-semibold text-gray-800 group-hover:text-violet-700 transition-colors">Nueva Acta</p>
            <p className="text-sm text-gray-500 mt-1">Digitalizar o generar un acta</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
