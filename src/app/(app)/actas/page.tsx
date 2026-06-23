'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Search, FileText, Calendar, User, Download, Trash2 } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { ACTA_TIPOS, ActaTipo } from '@/types/acta-templates'

interface Acta {
  id: string
  name: string
  fecha: string
  responsable: string
  file_url: string | null
  file_type: string | null
  notas: string | null
  tipo: ActaTipo | null
  template_data: any | null
  created_at: string
}

export default function ActasPage() {
  const [actas, setActas] = useState<Acta[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterTipo, setFilterTipo] = useState<ActaTipo | 'TODOS'>('TODOS')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const loadActas = useCallback(async () => {
    setLoading(true)
    let query = supabase.from('actas').select('*', { count: 'exact' }).order('created_at', { ascending: false })
    if (search) { query = query.or(`name.ilike.%${search}%,responsable.ilike.%${search}%,notas.ilike.%${search}%`) }
    if (filterTipo !== 'TODOS') { query = query.eq('tipo', filterTipo) }
    const { data, error } = await query
    if (!error) setActas(data || [])
    else toast.error('Error al cargar actas')
    setLoading(false)
  }, [search, filterTipo])

  useEffect(() => { loadActas() }, [loadActas])

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('actas').delete().eq('id', id)
    if (error) { toast.error('Error al eliminar'); return }
    toast.success('Acta eliminada')
    setDeleteConfirm(null)
    loadActas()
  }

  const getTipoLabel = (t: ActaTipo | null) => ACTA_TIPOS.find(tp => tp.value === t)?.label || 'Sin tipo'
  const getTipoBadge = (t: ActaTipo | null) => {
    const colors: Record<string, string> = {
      ENTREGA_ADMIN: 'bg-purple-100 text-purple-700',
      ASIGNACION_USUARIO: 'bg-blue-100 text-blue-700',
      RECEPCION_BODEGA: 'bg-green-100 text-green-700',
      CONSTATACION_FISICA: 'bg-amber-100 text-amber-700',
    }
    return colors[t || ''] || 'bg-gray-100 text-gray-600'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-fii to-fii-light rounded-xl flex items-center justify-center shadow-lg shadow-fii/20">
            <FileText className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Actas</h1>
            <p className="text-sm text-gray-500 mt-0.5">{actas.length} registro(s)</p>
          </div>
        </div>
        <Link href="/actas/nueva" className="btn-primary">
          <Plus size={18} /> Nueva Acta
        </Link>
      </div>

      <div className="card mb-6 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Buscar acta, responsable..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10" />
          </div>
          <select value={filterTipo} onChange={(e) => setFilterTipo(e.target.value as ActaTipo | 'TODOS')} className="input-field sm:w-auto">
            <option value="TODOS">Todos los tipos</option>
            {ACTA_TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="card p-12 text-center text-gray-500">Cargando...</div>
      ) : actas.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No hay actas registradas</p>
          <Link href="/actas/nueva" className="text-fii text-sm hover:underline mt-2 inline-block">Crear primera acta</Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm whitespace-nowrap min-w-[700px]">
              <thead>
                <tr className="bg-gradient-to-r from-ug to-fii text-left">
                  <th className="table-header w-12">TIPO</th>
                  <th className="table-header">ACTA</th>
                  <th className="table-header">FECHA</th>
                  <th className="table-header">RESPONSABLE</th>
                  <th className="table-header">NOTAS</th>
                  <th className="table-header text-center">BIENES</th>
                  <th className="table-header text-center">PDF</th>
                  <th className="table-header text-center">ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {actas.map((acta, idx) => (
                  <tr key={acta.id} className={`border-t border-gray-100 hover:bg-sky-50/50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                    <td className="table-cell">
                      {acta.tipo ? (
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${getTipoBadge(acta.tipo)}`}>
                          {getTipoLabel(acta.tipo)}
                        </span>
                      ) : <span className="text-gray-400 text-xs">—</span>}
                    </td>
                    <td className="table-cell font-medium">
                      <Link href={`/actas/${acta.id}`} className="text-fii hover:underline">
                        {acta.name}
                      </Link>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <Calendar size={14} />
                        {new Date(acta.fecha).toLocaleDateString('es-ES')}
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <User size={14} />
                        {acta.responsable || '-'}
                      </div>
                    </td>
                    <td className="table-cell max-w-[200px] truncate text-gray-400 text-xs">{acta.notas || '-'}</td>
                    <td className="table-cell text-center"><ActItemCount actaId={acta.id} /></td>
                    <td className="table-cell text-center">
                      {acta.file_url ? (
                        <a href={acta.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-fii hover:underline">
                          <Download size={14} /> PDF
                        </a>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="table-cell text-center">
                      {deleteConfirm === acta.id ? (
                        <div className="flex items-center gap-1 justify-center">
                          <button onClick={() => handleDelete(acta.id)} className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700">Sí</button>
                          <button onClick={() => setDeleteConfirm(null)} className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300">No</button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteConfirm(acta.id)} className="p-1.5 hover:bg-red-100 rounded text-red-500 transition-colors"><Trash2 size={14} /></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function ActItemCount({ actaId }: { actaId: string }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    supabase.from('acta_items').select('id', { count: 'exact' }).eq('acta_id', actaId).then(({ count }) => setCount(count || 0))
  }, [actaId])
  return <span className="text-xs font-mono text-gray-500">{count}</span>
}
