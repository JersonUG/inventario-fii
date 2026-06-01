'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { History, ChevronLeft, ChevronRight, Search } from 'lucide-react'

export default function HistoryPage() {
  const [entries, setEntries] = useState<any[]>([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const totalPages = Math.ceil(count / 50)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      let query = supabase.from('item_history').select('*', { count: 'exact' }).order('created_at', { ascending: false })
      if (search) query = query.or(`user_name.ilike.%${search}%,action.ilike.%${search}%`)
      const from = (page - 1) * 50
      const { data, count: total, error } = await query.range(from, from + 49)
      if (!error) { setEntries(data || []); setCount(total || 0) }
      setLoading(false)
    }
    load()
  }, [page, search])

  const actionColors: Record<string, string> = {
    create: 'bg-green-100 text-green-700', update: 'bg-blue-100 text-blue-700',
    baja: 'bg-orange-100 text-orange-700', delete: 'bg-red-100 text-red-700',
    transfer: 'bg-purple-100 text-purple-700',
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-fii to-fii-light rounded-xl flex items-center justify-center shadow-lg shadow-fii/20">
          <History className="text-white" size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Historial de Cambios</h1>
          <p className="text-sm text-gray-500 mt-0.5">Registro de auditoría del inventario</p>
        </div>
      </div>
      <div className="card">
        <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Buscar por usuario o acción..."
              className="input-field pl-9" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-ug to-fii text-left">
                <th className="table-header">FECHA</th>
                <th className="table-header">ACCIÓN</th>
                <th className="table-header">USUARIO</th>
                <th className="table-header">DETALLE</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={4} className="p-8 text-center text-gray-500">Cargando...</td></tr>
              : entries.length === 0 ? <tr><td colSpan={4} className="p-8 text-center text-gray-500">Sin registros</td></tr>
              : entries.map((entry: any, idx: number) => (
                <tr key={entry.id} className={`border-t border-gray-100 hover:bg-sky-50/50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                  <td className="table-cell text-gray-500 whitespace-nowrap">{new Date(entry.created_at).toLocaleString('es-ES')}</td>
                  <td className="table-cell">
                    <span className={`badge capitalize ${actionColors[entry.action] || 'bg-gray-100 text-gray-600'}`}>
                      {entry.action === 'baja' ? 'Dar de baja' : entry.action}
                    </span>
                  </td>
                  <td className="table-cell">{entry.user_name || entry.user_id || 'Sistema'}</td>
                  <td className="table-cell text-gray-600 max-w-md truncate">
                    {entry.action === 'create' ? 'Ítem creado' : entry.action === 'baja' ? 'Ítem dado de baja'
                    : entry.action === 'delete' ? 'Ítem eliminado' : entry.action === 'transfer' ? 'Traslado'
                    : entry.action === 'update' ? 'Ítem modificado' : JSON.stringify(entry.changes)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between p-4 border-t border-gray-100 bg-gray-50/50">
          <p className="text-sm text-gray-500 font-medium">{count} registros</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ChevronLeft size={16} /></button>
            <span className="text-sm text-gray-600 font-medium px-3">Pág. {page} de {totalPages || 1}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  )
}
