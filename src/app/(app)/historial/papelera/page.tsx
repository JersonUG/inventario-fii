'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Archive, RotateCcw, Search, ChevronLeft, ChevronRight, History, FileText, ArrowLeftRight, LogIn, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

type Tab = 'items' | 'actas' | 'traslados' | 'auth'

const TAB_LABELS: Record<Tab, string> = { items: 'Ítems', actas: 'Actas', traslados: 'Traslados', auth: 'Accesos' }
const TAB_TABLES: Record<Tab, string> = { items: 'item_history', actas: 'acta_history', traslados: 'transfer_log', auth: 'auth_log' }

export default function PapeleraPage() {
  const { profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const isAdmin = profile?.rol === 'ADMINISTRADOR'

  const [tab, setTab] = useState<Tab>('items')
  const [entries, setEntries] = useState<any[]>([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [restoring, setRestoring] = useState<string | null>(null)
  const [restoringAll, setRestoringAll] = useState(false)
  const totalPages = Math.ceil(count / 50)

  useEffect(() => {
    if (!authLoading && !isAdmin) router.push('/historial')
  }, [authLoading, isAdmin, router])

  const loadHidden = useCallback(async () => {
    setLoading(true)
    const table = TAB_TABLES[tab]
    let query = supabase.from(table).select('*', { count: 'exact' }).eq('visible_en_sistema', false)
      .order('created_at', { ascending: false })
    if (search) query = query.or(`user_name.ilike.%${search}%,action.ilike.%${search}%`)
    const from = (page - 1) * 50
    const { data, count: total, error } = await query.range(from, from + 49)
    if (!error) { setEntries(data || []); setCount(total || 0) }
    setLoading(false)
  }, [tab, page, search])

  useEffect(() => { loadHidden() }, [loadHidden])

  const handleRestore = async (id: string) => {
    setRestoring(id)
    const table = TAB_TABLES[tab]
    const { error } = await supabase.from(table).update({ visible_en_sistema: true }).eq('id', id)
    if (error) { toast.error('Error: ' + error.message) } else { toast.success('Registro restaurado') }
    setRestoring(null)
    loadHidden()
  }

  const handleRestoreAll = async () => {
    if (!confirm(`¿Restaurar todos los registros ocultos de "${TAB_LABELS[tab]}"?`)) return
    setRestoringAll(true)
    const table = TAB_TABLES[tab]
    const { data: toRestore } = await supabase.from(table).select('id').eq('visible_en_sistema', false)
    if (!toRestore || toRestore.length === 0) { toast('No hay registros ocultos'); setRestoringAll(false); return }

    const ids = toRestore.map(r => r.id)
    const { error } = await supabase.from(table).update({ visible_en_sistema: true }).in('id', ids)
    if (error) { toast.error('Error: ' + error.message) } else { toast.success(`${ids.length} registro(s) restaurado(s)`) }
    setRestoringAll(false)
    loadHidden()
  }

  const actionColors: Record<string, string> = {
    create: 'bg-green-100 text-green-700', update: 'bg-blue-100 text-blue-700',
    baja: 'bg-orange-100 text-orange-700', delete: 'bg-red-100 text-red-700',
    transfer: 'bg-purple-100 text-purple-700', reincorporar: 'bg-teal-100 text-teal-700',
    login: 'bg-emerald-100 text-emerald-700', logout: 'bg-rose-100 text-rose-700',
  }

  if (authLoading) return <div className="flex items-center justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fii"></div></div>
  if (!isAdmin) return null

  const tabs: { key: Tab; icon: any }[] = [
    { key: 'items', icon: History },
    { key: 'actas', icon: FileText },
    { key: 'traslados', icon: ArrowLeftRight },
    { key: 'auth', icon: LogIn },
  ]

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button type="button" onClick={() => router.push('/historial')}
          className="w-10 h-10 bg-gradient-to-br from-fii to-fii-light rounded-xl flex items-center justify-center shadow-lg shadow-fii/20 hover:shadow-xl transition-shadow cursor-pointer">
          <ArrowLeft className="text-white" size={20} />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Archive className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Papelera de Historiales</h1>
            <p className="text-sm text-gray-500 mt-0.5">Registros ocultados del sistema — solo visible para administradores</p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex px-4 pt-2 gap-1">
            {tabs.map(t => {
              const Icon = t.icon
              return (
                <button key={t.key} onClick={() => { setTab(t.key); setPage(1); setSearch('') }}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                    tab === t.key ? 'bg-white text-fii border-t border-x border-gray-200 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
                  }`}
                >
                  <Icon size={16} /> {TAB_LABELS[t.key]}
                </button>
              )
            })}
          </div>
        </div>

        <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-4 flex-wrap">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Buscar..."
              className="input-field pl-9" />
          </div>
          {count > 0 && (
            <button onClick={handleRestoreAll} disabled={restoringAll}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50">
              <RotateCcw size={16} />
              {restoringAll ? 'Restaurando...' : 'RESTAURAR TODO'}
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-ug to-fii text-left">
                <th className="table-header">FECHA</th>
                <th className="table-header">ACCIÓN</th>
                <th className="table-header">USUARIO</th>
                <th className="table-header">DETALLE</th>
                <th className="table-header text-center">ACCIÓN</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={5} className="p-8 text-center text-gray-500">Cargando...</td></tr>
              : entries.length === 0 ? <tr><td colSpan={5} className="p-8 text-center text-gray-500">No hay registros ocultos en esta categoría</td></tr>
              : entries.map((entry: any, idx: number) => (
                <tr key={entry.id} className={`border-t border-gray-100 hover:bg-sky-50/50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                  <td className="table-cell text-gray-500 whitespace-nowrap">{new Date(entry.created_at).toLocaleString('es-ES')}</td>
                  <td className="table-cell">
                    <span className={`badge capitalize ${actionColors[entry.action || entry.transfer_type] || 'bg-gray-100 text-gray-600'}`}>
                      {tab === 'traslados' ? entry.transfer_type : entry.action === 'baja' ? 'Dar de baja' : entry.action}
                    </span>
                  </td>
                  <td className="table-cell">{entry.user_name || entry.user_id || 'Sistema'}</td>
                  <td className="table-cell text-gray-600 max-w-md truncate">
                    {tab === 'items' ? (
                      entry.action === 'create' ? 'Ítem creado' : entry.action === 'baja' ? 'Ítem dado de baja'
                      : entry.action === 'delete' ? 'Ítem eliminado' : entry.action === 'transfer' ? 'Traslado'
                      : entry.action === 'update' ? 'Ítem modificado' : entry.action === 'reincorporar' ? 'Reincorporado al inventario'
                      : JSON.stringify(entry.changes)
                    ) : tab === 'actas' ? (
                      entry.action === 'create' ? 'Acta creada' : entry.action === 'update' ? 'Acta modificada'
                      : entry.action === 'add_item' ? `Activo agregado` : entry.action === 'remove_item' ? `Activo removido`
                      : entry.action === 'delete' ? 'Acta eliminada'
                      : JSON.stringify(entry.changes)
                    ) : tab === 'auth' ? (
                      entry.action === 'login' ? 'Inicio de sesión' : 'Cierre de sesión'
                    ) : (
                      entry.transfer_type === 'ubicacion' ? `Ubicación: ${entry.from_value || '—'} → ${entry.to_value || '—'}`
                      : entry.transfer_type === 'responsable' ? `Responsable: ${entry.from_value || '—'} → ${entry.to_value || '—'}`
                      : `${entry.from_value || '—'} → ${entry.to_value || '—'}`
                    )}
                  </td>
                  <td className="table-cell text-center">
                    <button onClick={() => handleRestore(entry.id)} disabled={restoring === entry.id}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors disabled:opacity-50">
                      <RotateCcw size={14} />
                      {restoring === entry.id ? '...' : 'Restaurar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between p-4 border-t border-gray-100 bg-gray-50/50">
          <p className="text-sm text-gray-500 font-medium">{count} registros ocultos</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ChevronLeft size={16} /></button>
            <span className="text-sm text-gray-600 font-medium px-3">Pág. {page} de {totalPages || 1}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  )
}
