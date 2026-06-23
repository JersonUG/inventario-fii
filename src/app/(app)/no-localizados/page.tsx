'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { SearchX, Search, RotateCcw, ChevronLeft, ChevronRight, Package, MapPin, User, X, Save } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { CLASIFICACION_OPTIONS } from '@/types/database'

const ITEMS_PER_PAGE = 25

export default function NoLocalizadosPage() {
  const [items, setItems] = useState<any[]>([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [reincorporando, setReincorporando] = useState(false)
  const [reincorporateForm, setReincorporateForm] = useState({ ubicacion: '', estado: 'Bueno', observaciones: '' })
  const totalPages = Math.ceil(count / ITEMS_PER_PAGE)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      let query = supabase.from('items').select('*', { count: 'exact' }).eq('clasificacion_activo', 'NO_LOCALIZADO')
      if (search) {
        query = query.or(`cod_inv.ilike.%${search}%,descripcion.ilike.%${search}%,serie.ilike.%${search}%,marca.ilike.%${search}%,ubicacion.ilike.%${search}%`)
      }
      const from = (page - 1) * ITEMS_PER_PAGE
      const { data, count: total, error } = await query.order('item', { ascending: true }).range(from, from + ITEMS_PER_PAGE - 1)
      if (!error) { setItems(data || []); setCount(total || 0) }
      setLoading(false)
    }
    load()
  }, [page, search])

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); setSearch(searchInput) }

  const openModal = (item: any) => {
    setSelectedItem(item)
    setReincorporateForm({ ubicacion: item.ubicacion || '', estado: item.estado || 'Bueno', observaciones: '' })
    setModalOpen(true)
  }

  const handleReincorporate = async () => {
    if (!selectedItem || !reincorporateForm.ubicacion) { toast.error('La ubicación es obligatoria'); return }
    setReincorporando(true)
    const user = (await supabase.auth.getUser()).data.user

    const { error } = await supabase.from('items').update({
      clasificacion_activo: 'ACTIVO',
      ubicacion: reincorporateForm.ubicacion,
      estado: reincorporateForm.estado,
      observaciones: reincorporateForm.observaciones
        ? `${selectedItem.observaciones || ''} [Reincorporado: ${reincorporateForm.observaciones}]`
        : selectedItem.observaciones,
    }).eq('id', selectedItem.id)

    if (error) { toast.error('Error al reincorporar'); setReincorporando(false); return }

    await supabase.from('item_history').insert([{
      item_id: selectedItem.id,
      action: 'reincorporar',
      changes: { estado: { old: selectedItem.estado, new: reincorporateForm.estado }, ubicacion: { old: selectedItem.ubicacion, new: reincorporateForm.ubicacion } },
      user_id: user?.id || '',
      user_name: user?.email || 'Sistema',
    }])

    toast.success('Bien reincorporado al inventario')
    setModalOpen(false)
    setReincorporando(false)
    setItems(prev => prev.filter(i => i.id !== selectedItem.id))
    setCount(prev => prev - 1)
  }

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('es-ES') : '-'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
            <SearchX className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Bienes No Localizados</h1>
            <p className="text-sm text-gray-500 mt-0.5">Activos marcados como no encontrados en auditoría</p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Buscar por código, descripción, serie, marca..."
                className="input-field pl-9" />
            </div>
            <button type="submit" className="px-5 py-2.5 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">Buscar</button>
          </form>
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm whitespace-nowrap min-w-[900px]">
            <thead>
              <tr className="bg-gradient-to-r from-ug to-fii text-left">
                <th className="table-header">ITEM</th>
                <th className="table-header">COD. INV</th>
                <th className="table-header">DESCRIPCIÓN</th>
                <th className="table-header">MARCA</th>
                <th className="table-header">SERIE</th>
                <th className="table-header">UBICACIÓN</th>
                <th className="table-header">ESTADO</th>
                <th className="table-header">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="p-8 text-center text-gray-500">Cargando...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={8} className="p-12 text-center text-gray-500">
                  <SearchX className="mx-auto text-gray-300 mb-3" size={40} />
                  <p className="font-medium">No hay bienes no localizados</p>
                  <p className="text-sm mt-1">Todos los activos están en su lugar</p>
                </td></tr>
              ) : items.map((item: any, idx: number) => (
                <tr key={item.id} className={`border-t border-gray-100 hover:bg-orange-50/50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                  <td className="table-cell font-mono"><Link href={`/items/${item.id}`} className="text-fii hover:underline">{item.item}</Link></td>
                  <td className="table-cell font-mono text-gray-500">{item.cod_inv || '-'}</td>
                  <td className="table-cell max-w-[250px] truncate" title={item.descripcion}>{item.descripcion}</td>
                  <td className="table-cell">{item.marca || '-'}</td>
                  <td className="table-cell font-mono text-gray-500">{item.serie || '-'}</td>
                  <td className="table-cell text-gray-500">{item.ubicacion || '-'}</td>
                  <td className="table-cell">
                    <span className={`badge ${
                      item.estado === 'Bueno' ? 'bg-emerald-100 text-emerald-700' :
                      item.estado === 'Regular' ? 'bg-amber-100 text-amber-700' :
                      item.estado === 'Malo' ? 'bg-red-100 text-red-700' :
                      item.estado === 'Para Baja' ? 'bg-rose-100 text-rose-700' :
                      item.estado === 'Dado de Baja' ? 'bg-gray-300 text-gray-700 line-through' :
                      'bg-gray-100 text-gray-600'
                    }`}>{item.estado}</span>
                  </td>
                  <td className="table-cell">
                    <button onClick={() => openModal(item)} className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg text-xs font-medium hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-sm">
                      <RotateCcw size={12} /> Incorporar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between p-4 border-t border-gray-100 bg-gray-50/50">
          <p className="text-sm text-gray-500 font-medium">{count} no localizado(s)</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ChevronLeft size={16} /></button>
            <span className="text-sm text-gray-600 font-medium px-3">Pág. {page} de {totalPages || 1}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>

      {modalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <RotateCcw size={18} className="text-emerald-600" />
                Reincorporar Activo
              </h2>
              <button onClick={() => setModalOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 mb-4 text-sm">
              <p className="font-medium text-gray-800">#{selectedItem.item} — {selectedItem.descripcion}</p>
              <p className="text-gray-500 mt-1">Ubicación anterior: {selectedItem.ubicacion || '-'}</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nueva ubicación</label>
                <input type="text" value={reincorporateForm.ubicacion} onChange={(e) => setReincorporateForm(p => ({ ...p, ubicacion: e.target.value }))}
                  placeholder="Ej: Edificio A, Piso 3" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select value={reincorporateForm.estado} onChange={(e) => setReincorporateForm(p => ({ ...p, estado: e.target.value }))} className="input-field">
                  <option value="Bueno">Bueno</option>
                  <option value="Regular">Regular</option>
                  <option value="Malo">Malo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones (opcional)</label>
                <textarea value={reincorporateForm.observaciones} onChange={(e) => setReincorporateForm(p => ({ ...p, observaciones: e.target.value }))}
                  rows={2} className="input-field" placeholder="Motivo de la no localización..." />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleReincorporate} disabled={reincorporando || !reincorporateForm.ubicacion}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-2.5 rounded-xl font-medium hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 transition-all shadow-md">
                <Save size={16} /> {reincorporando ? 'Procesando...' : 'Reincorporar al Inventario'}
              </button>
              <button onClick={() => setModalOpen(false)} className="px-6 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition-colors">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
