'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { FileText, Plus, Search, ChevronLeft, ChevronRight, ExternalLink, Trash2 } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function ActasPage() {
  const [actas, setActas] = useState<any[]>([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const totalPages = Math.ceil(count / 20)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      let query = supabase.from('actas').select('*', { count: 'exact' }).order('created_at', { ascending: false })
      if (search) query = query.or(`name.ilike.%${search}%,responsable.ilike.%${search}%`)
      const from = (page - 1) * 20
      const { data, count: total, error } = await query.range(from, from + 19)
      if (!error) { setActas(data || []); setCount(total || 0) }
      setLoading(false)
    }
    load()
  }, [page, search])

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta acta?')) return
    await supabase.from('actas').delete().eq('id', id)
    toast.success('Acta eliminada')
    setActas(prev => prev.filter(a => a.id !== id))
    setCount(prev => prev - 1)
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-fii to-fii-light rounded-xl flex items-center justify-center shadow-lg shadow-fii/20">
            <FileText className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Actas</h1>
            <p className="text-sm text-gray-500 mt-0.5">Documentos digitalizados del inventario</p>
          </div>
        </div>
        <Link href="/actas/nueva" className="btn-primary"><Plus size={16} /> Nueva Acta</Link>
      </div>

      <div className="card">
        <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Buscar actas por nombre o responsable..."
              className="input-field pl-9" />
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {loading ? <div className="p-12 text-center text-gray-500">Cargando...</div>
          : actas.length === 0 ? <div className="p-12 text-center text-gray-500">
            <FileText className="mx-auto text-gray-300 mb-3" size={40} />
            <p className="text-gray-500 font-medium">No hay actas registradas</p>
            <Link href="/actas/nueva" className="text-sky-600 hover:text-sky-700 text-sm mt-1 inline-block">Crear primera acta</Link>
          </div>
          : actas.map((acta: any, idx: number) => (
            <div key={acta.id} className={`p-4 flex items-start gap-4 hover:bg-sky-50/50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
              <div className="p-2.5 bg-gradient-to-br from-violet-100 to-purple-100 rounded-xl shadow-sm">
                <FileText className="text-violet-600" size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800">{acta.name}</p>
                <div className="flex gap-4 mt-1.5 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    {acta.responsable || 'Sin responsable'}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    {acta.fecha ? new Date(acta.fecha).toLocaleDateString('es-ES') : '-'}
                  </span>
                  {acta.file_type && (
                    <span className="badge bg-gray-100 text-gray-600 uppercase">{acta.file_type.split('/')[1] || acta.file_type}</span>
                  )}
                </div>
                {acta.notas && <p className="text-xs text-gray-400 mt-1.5 truncate">{acta.notas}</p>}
              </div>
              <div className="flex items-center gap-1">
                {acta.file_url && <a href={acta.file_url} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-sky-100 rounded-lg text-sky-600 transition-colors" title="Ver archivo"><ExternalLink size={16} /></a>}
                <button onClick={() => handleDelete(acta.id)} className="p-2 hover:bg-red-100 rounded-lg text-red-600 transition-colors" title="Eliminar"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between p-4 border-t border-gray-100 bg-gray-50/50">
          <p className="text-sm text-gray-500 font-medium">{count} actas</p>
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
