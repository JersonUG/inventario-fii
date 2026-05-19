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
      <div className="flex items-center gap-3 mb-6"><History className="text-sky-600" size={24} /><h1 className="text-2xl font-bold text-gray-800">Historial de Cambios</h1></div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Buscar por usuario o acción..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="p-3 font-medium text-gray-600">FECHA</th>
                <th className="p-3 font-medium text-gray-600">ACCIÓN</th>
                <th className="p-3 font-medium text-gray-600">USUARIO</th>
                <th className="p-3 font-medium text-gray-600">DETALLE</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={4} className="p-8 text-center text-gray-500">Cargando...</td></tr>
              : entries.length === 0 ? <tr><td colSpan={4} className="p-8 text-center text-gray-500">Sin registros</td></tr>
              : entries.map((entry: any) => (
                <tr key={entry.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="p-3 text-xs text-gray-500 whitespace-nowrap">{new Date(entry.created_at).toLocaleString('es-ES')}</td>
                  <td className="p-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${actionColors[entry.action] || 'bg-gray-100 text-gray-600'}`}>
                      {entry.action === 'baja' ? 'Dar de baja' : entry.action}
                    </span>
                  </td>
                  <td className="p-3 text-xs">{entry.user_name || entry.user_id || 'Sistema'}</td>
                  <td className="p-3 text-xs text-gray-600 max-w-md truncate">
                    {entry.action === 'create' ? 'Ítem creado' : entry.action === 'baja' ? 'Ítem dado de baja'
                    : entry.action === 'delete' ? 'Ítem eliminado' : entry.action === 'transfer' ? 'Traslado'
                    : entry.action === 'update' ? 'Ítem modificado' : JSON.stringify(entry.changes)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between p-4 border-t border-gray-100">
          <p className="text-sm text-gray-500">{count} registros</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 hover:bg-gray-100 rounded disabled:opacity-30"><ChevronLeft size={16} /></button>
            <span className="text-sm text-gray-600">Pág. {page} de {totalPages || 1}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="p-2 hover:bg-gray-100 rounded disabled:opacity-30"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  )
}
