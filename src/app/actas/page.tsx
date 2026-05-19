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
        <div className="flex items-center gap-3"><FileText className="text-blue-900" size={24} /><h1 className="text-2xl font-bold text-gray-800">Actas</h1></div>
        <Link href="/actas/nueva" className="flex items-center gap-2 bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700 text-sm"><Plus size={16} /> Nueva Acta</Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Buscar actas por nombre o responsable..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {loading ? <div className="p-8 text-center text-gray-500">Cargando...</div>
          : actas.length === 0 ? <div className="p-8 text-center text-gray-500">No hay actas registradas</div>
          : actas.map((acta: any) => (
            <div key={acta.id} className="p-4 flex items-start gap-4 hover:bg-gray-50 transition-colors">
              <div className="p-2 bg-purple-100 rounded-lg"><FileText className="text-purple-600" size={20} /></div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800">{acta.name}</p>
                <div className="flex gap-4 mt-1 text-xs text-gray-500">
                  <span>{acta.responsable || 'Sin responsable'}</span>
                  <span>{acta.fecha ? new Date(acta.fecha).toLocaleDateString('es-ES') : '-'}</span>
                  {acta.file_type && <span className="uppercase">{acta.file_type.split('/')[1] || acta.file_type}</span>}
                </div>
                {acta.notas && <p className="text-xs text-gray-400 mt-1 truncate">{acta.notas}</p>}
              </div>
              <div className="flex items-center gap-2">
                {acta.file_url && <a href={acta.file_url} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-blue-100 rounded text-blue-600"><ExternalLink size={16} /></a>}
                <button onClick={() => handleDelete(acta.id)} className="p-2 hover:bg-red-100 rounded text-red-600"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between p-4 border-t border-gray-100">
          <p className="text-sm text-gray-500">{count} actas</p>
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
