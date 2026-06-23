'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useRealtime } from '@/hooks/useRealtime'
import { History, FileText, ArrowLeftRight, LogIn, ChevronLeft, ChevronRight, Search, Trash2, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'

type Tab = 'items' | 'actas' | 'traslados' | 'auth'

const TAB_CONFIG = {
  items: { table: 'item_history', select: '*', filterCol: null, label: 'Ítems', icon: History },
  actas: { table: 'acta_history', select: '*,actas(name)', filterCol: null, label: 'Actas', icon: FileText },
  traslados: { table: 'transfer_log', select: '*,items(item,descripcion)', filterCol: null, label: 'Traslados', icon: ArrowLeftRight },
  auth: { table: 'auth_log', select: '*', filterCol: null, label: 'Accesos', icon: LogIn },
}

export default function HistoryPage() {
  const { profile } = useAuth()
  const isAdmin = profile?.rol === 'ADMINISTRADOR'
  const [tab, setTab] = useState<Tab>('items')
  const [entries, setEntries] = useState<any[]>([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [cleaning, setCleaning] = useState(false)
  const totalPages = Math.ceil(count / 50)

  const buildQuery = useCallback(() => {
    const cfg = TAB_CONFIG[tab]
    let query = supabase.from(cfg.table).select(cfg.select, { count: 'exact' }).eq('visible_en_sistema', true).order('created_at', { ascending: false })

    if (search) {
      if (tab === 'items') query = query.or(`user_name.ilike.%${search}%,action.ilike.%${search}%`)
      else if (tab === 'actas') query = query.or(`user_name.ilike.%${search}%,action.ilike.%${search}%,actas.name.ilike.%${search}%`)
      else if (tab === 'traslados') query = query.or(`user_name.ilike.%${search}%,transfer_type.ilike.%${search}%,from_value.ilike.%${search}%,to_value.ilike.%${search}%`)
      else query = query.or(`user_name.ilike.%${search}%,action.ilike.%${search}%`)
    }
    return query
  }, [tab, search])

  const loadPage = useCallback(async () => {
    setLoading(true)
    const from = (page - 1) * 50
    const { data, count: total, error } = await buildQuery().range(from, from + 49)
    if (!error) { setEntries(data || []); setCount(total || 0) }
    setLoading(false)
  }, [page, buildQuery])

  useRealtime('item_history', loadPage)
  useRealtime('acta_history', loadPage)
  useRealtime('transfer_log', loadPage)
  useRealtime('auth_log', loadPage)

  useEffect(() => { loadPage() }, [loadPage])

  const handleClean = async () => {
    if (!confirm(`¿Ocultar todos los registros visibles de "${TAB_CONFIG[tab].label}"?` +
      '\n\nNo se eliminarán de la base de datos.\nUn administrador puede restaurarlos desde la Papelera de Historiales.')) return

    setCleaning(true)
    const user = (await supabase.auth.getUser()).data.user
    if (!user) { toast.error('Debes iniciar sesión'); setCleaning(false); return }

    const cfg = TAB_CONFIG[tab]
    const { data: toHide } = await supabase.from(cfg.table).select('id').eq('visible_en_sistema', true)
    if (!toHide || toHide.length === 0) { toast('No hay registros para ocultar'); setCleaning(false); return }

    const ids = toHide.map(r => r.id)
    const { error } = await supabase.from(cfg.table).update({ visible_en_sistema: false }).in('id', ids)
    if (error) { toast.error('Error al ocultar: ' + error.message); setCleaning(false); return }

    await supabase.from('historial_cleanup_log').insert([{
      user_id: user.id, user_name: user.email || 'Sistema',
      modulo: tab, cantidad: ids.length,
    }])

    toast.success(`${ids.length} registro(s) ocultado(s)`)
    setCleaning(false)
    setPage(1)
    const { data, count: total, error: err2 } = await buildQuery().range(0, 49)
    if (!err2) { setEntries(data || []); setCount(total || 0) }
  }

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'items', label: 'Ítems', icon: History },
    { key: 'actas', label: 'Actas', icon: FileText },
    { key: 'traslados', label: 'Traslados', icon: ArrowLeftRight },
    { key: 'auth', label: 'Accesos', icon: LogIn },
  ]

  const actionColors: Record<string, string> = {
    create: 'bg-green-100 text-green-700', update: 'bg-blue-100 text-blue-700',
    baja: 'bg-orange-100 text-orange-700', delete: 'bg-red-100 text-red-700',
    transfer: 'bg-purple-100 text-purple-700', reincorporar: 'bg-teal-100 text-teal-700',
    login: 'bg-emerald-100 text-emerald-700', logout: 'bg-rose-100 text-rose-700',
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
                  <Icon size={16} /> {t.label}
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
          {isAdmin && (
            <button onClick={handleClean} disabled={cleaning}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50">
              <Trash2 size={16} />
              {cleaning ? 'Ocultando...' : 'LIMPIAR HISTORIAL'}
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-ug to-fii text-left">
                <th className="table-header">FECHA</th>
                {tab === 'traslados' && <th className="table-header">ITEM</th>}
                {tab === 'actas' && <th className="table-header">ACTA</th>}
                <th className="table-header">ACCIÓN</th>
                <th className="table-header">USUARIO</th>
                <th className="table-header">DETALLE</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={tab !== 'actas' && tab !== 'traslados' ? 4 : 5} className="p-8 text-center text-gray-500">Cargando...</td></tr>
              : entries.length === 0 ? <tr><td colSpan={tab !== 'actas' && tab !== 'traslados' ? 4 : 5} className="p-8 text-center text-gray-500">Sin registros</td></tr>
              : entries.map((entry: any, idx: number) => (
                <tr key={entry.id} className={`border-t border-gray-100 hover:bg-sky-50/50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                  <td className="table-cell text-gray-500 whitespace-nowrap">{new Date(entry.created_at).toLocaleString('es-ES')}</td>
                  {tab === 'traslados' && (
                    <td className="table-cell font-mono text-xs">
                      {entry.items ? `#${entry.items.item} - ${entry.items.descripcion?.substring(0, 50)}...` : '—'}
                    </td>
                  )}
                  {tab === 'actas' && (
                    <td className="table-cell font-medium">{entry.actas?.name || '—'}</td>
                  )}
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
