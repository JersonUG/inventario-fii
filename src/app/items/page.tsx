'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Plus, Search, ChevronLeft, ChevronRight, Edit, Trash2, Archive, X } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

const ITEMS_PER_PAGE = 50

function ItemsPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [items, setItems] = useState<any[]>([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [showBajas, setShowBajas] = useState(searchParams.get('bajas') === 'true')
  const [selected, setSelected] = useState<string[]>([])
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [filterOptions, setFilterOptions] = useState<Record<string, string[]>>({})

  const totalPages = Math.ceil(count / ITEMS_PER_PAGE)

  const loadItems = useCallback(async () => {
    setLoading(true)
    let query = supabase.from('items').select('*', { count: 'exact' })
    if (!showBajas) query = query.eq('is_active', true)
    if (search) {
      query = query.or(
        `cod_inv.ilike.%${search}%,descripcion.ilike.%${search}%,serie.ilike.%${search}%,marca.ilike.%${search}%,modelo.ilike.%${search}%,ubicacion.ilike.%${search}%,observaciones.ilike.%${search}%,no_acta.ilike.%${search}%,cod_esbye.ilike.%${search}%,mes.ilike.%${search}%`
      )
    }
    Object.entries(filters).forEach(([key, value]) => {
      if (value) query = query.ilike(key, value)
    })

    const from = (page - 1) * ITEMS_PER_PAGE
    const { data, count: total, error } = await query.order('item', { ascending: true }).range(from, from + ITEMS_PER_PAGE - 1)
    if (!error) { setItems(data || []); setCount(total || 0) }
    setLoading(false)
  }, [page, search, showBajas, filters])

  const loadFilterOptions = useCallback(async () => {
    const cols = ['cuenta', 'estado', 'ubicacion', 'marca']
    const opts: Record<string, string[]> = {}
    for (const col of cols) {
      const { data } = await supabase.rpc('get_distinct_values', { col_name: col })
      if (data) {
        opts[col] = data
          .map((d: any) => (d.val || '').trim())
          .filter(Boolean)
          .sort((a: string, b: string) => a.localeCompare(b, 'es', { sensitivity: 'base' }))
      }
    }
    setFilterOptions(opts)
  }, [])

  useEffect(() => { loadItems() }, [loadItems])
  useEffect(() => { loadFilterOptions() }, [loadFilterOptions])

  const handleBaja = async (id: string) => {
    if (!confirm('¿Dar de baja este ítem?')) return
    await supabase.from('items').update({ is_active: false }).eq('id', id)
    toast.success('Ítem dado de baja'); loadItems()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar permanentemente? No se puede deshacer.')) return
    await supabase.from('items').delete().eq('id', id)
    toast.success('Ítem eliminado'); loadItems()
  }

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); setSearch(searchInput) }
  const clearFilters = () => { setFilters({}); setSearch(''); setSearchInput(''); setPage(1) }
  const toggleSelect = (id: string) => setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])
  const toggleSelectAll = () => setSelected(selected.length === items.length ? [] : items.map(i => i.id))
  const formatValor = (v: number | null) => v != null ? `$${v.toFixed(2)}` : '-'
  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('es-ES') : '-'

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Inventario</h1>
        <Link href="/items/new" className="flex items-center gap-2 bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700 transition-colors text-sm">
          <Plus size={16} /> Nuevo
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row gap-3">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Buscar: código, descripción, serie, marca, modelo, ubicación, propietario..."
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>
              <button type="submit" className="px-4 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200">Buscar</button>
            </form>
            <label className="flex items-center gap-2 text-sm cursor-pointer whitespace-nowrap">
              <input type="checkbox" checked={showBajas} onChange={(e) => { setShowBajas(e.target.checked); setPage(1) }} className="rounded" />
              Mostrar dados de baja
            </label>
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            {Object.keys(filterOptions).map(col => (
              <select
                key={col}
                value={filters[col] || ''}
                onChange={(e) => { setFilters(prev => ({ ...prev, [col]: e.target.value })); setPage(1) }}
                className="text-xs border border-gray-200 rounded px-2 py-1.5 bg-white capitalize"
              >
                <option value="">{col}</option>
                {filterOptions[col].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            ))}
            {(Object.keys(filters).length > 0 || search) && (
              <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 px-2 py-1.5">
                <X size={14} /> Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {selected.length > 0 && (
          <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 flex items-center gap-3 text-sm">
            <span className="font-medium text-blue-900">{selected.length} seleccionado(s)</span>
            <Link href={`/traslados?ids=${selected.join(',')}`} className="text-blue-600 hover:underline">Trasladar seleccionados</Link>
          </div>
        )}

        <div className="overflow-x-auto scrollbar-thin border-t border-gray-100">
          <div className="text-xs text-gray-400 px-4 py-1 bg-gray-50 italic">
            ← Desplázate horizontalmente para ver más columnas →
          </div>
          <table className="w-full text-sm whitespace-nowrap min-w-[2000px]">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="p-3 sticky left-0 bg-gray-50 z-10 w-10"><input type="checkbox" checked={selected.length === items.length && items.length > 0} onChange={toggleSelectAll} className="rounded" /></th>
                <th className="p-3 font-medium text-gray-600 min-w-[60px]">ITEM</th>
                <th className="p-3 font-medium text-gray-600 min-w-[100px]">COD. INV</th>
                <th className="p-3 font-medium text-gray-600 min-w-[100px]">COD. ESBYE</th>
                <th className="p-3 font-medium text-gray-600 min-w-[120px]">CUENTA</th>
                <th className="p-3 font-medium text-gray-600 min-w-[50px]">CANT</th>
                <th className="p-3 font-medium text-gray-600 min-w-[250px]">DESCRIPCIÓN</th>
                <th className="p-3 font-medium text-gray-600 min-w-[100px]">MARCA</th>
                <th className="p-3 font-medium text-gray-600 min-w-[100px]">MODELO</th>
                <th className="p-3 font-medium text-gray-600 min-w-[120px]">SERIE</th>
                <th className="p-3 font-medium text-gray-600 min-w-[120px]">FECHA ADQ.</th>
                <th className="p-3 font-medium text-gray-600 min-w-[90px]">ESTADO</th>
                <th className="p-3 font-medium text-gray-600 min-w-[90px]">VALOR</th>
                <th className="p-3 font-medium text-gray-600 min-w-[150px]">UBICACIÓN</th>
                <th className="p-3 font-medium text-gray-600 min-w-[150px]">OBSERVACIONES</th>
                <th className="p-3 font-medium text-gray-600 min-w-[150px]">No. ACTA</th>
                <th className="p-3 font-medium text-gray-600 min-w-[80px]">MES</th>
                <th className="p-3 font-medium text-gray-600 min-w-[100px] sticky right-0 bg-gray-50 z-10">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={18} className="p-8 text-center text-gray-500">Cargando...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={18} className="p-8 text-center text-gray-500">No se encontraron registros</td></tr>
              ) : items.map((item: any) => (
                <tr key={item.id} className={`border-t border-gray-100 hover:bg-gray-50 transition-colors ${!item.is_active ? 'bg-red-50/30' : ''}`}>
                  <td className="p-3 sticky left-0 bg-white z-10"><input type="checkbox" checked={selected.includes(item.id)} onChange={() => toggleSelect(item.id)} className="rounded" /></td>
                  <td className="p-3 font-mono text-xs">{item.item}</td>
                  <td className="p-3 font-mono text-xs">{item.cod_inv || '-'}</td>
                  <td className="p-3 text-xs">{item.cod_esbye || '-'}</td>
                  <td className="p-3 text-xs">{item.cuenta || '-'}</td>
                  <td className="p-3 text-xs text-center">{item.cant || 1}</td>
                  <td className="p-3 text-xs max-w-[250px] truncate" title={item.descripcion}>{item.descripcion}</td>
                  <td className="p-3 text-xs">{item.marca || '-'}</td>
                  <td className="p-3 text-xs">{item.modelo || '-'}</td>
                  <td className="p-3 font-mono text-xs">{item.serie || '-'}</td>
                  <td className="p-3 text-xs">{formatDate(item.fecha_adquisicion)}</td>
                  <td className="p-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      item.estado === 'Bueno' ? 'bg-green-100 text-green-700' :
                      item.estado === 'Regular' ? 'bg-yellow-100 text-yellow-700' :
                      item.estado === 'Malo' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                    }`}>{item.estado}</span>
                  </td>
                  <td className="p-3 font-mono text-xs">{formatValor(item.valor)}</td>
                  <td className="p-3 text-xs max-w-[150px] truncate" title={item.ubicacion}>{item.ubicacion || '-'}</td>
                  <td className="p-3 text-xs max-w-[150px] truncate" title={item.observaciones}>{item.observaciones || '-'}</td>
                  <td className="p-3 text-xs max-w-[150px] truncate" title={item.no_acta}>{item.no_acta || '-'}</td>
                  <td className="p-3 text-xs">{item.mes || '-'}</td>
                  <td className="p-3 sticky right-0 bg-white z-10">
                    <div className="flex items-center gap-1">
                      <Link href={`/items/${item.id}/edit`} className="p-1.5 hover:bg-blue-100 rounded text-blue-600"><Edit size={14} /></Link>
                      {item.is_active && <button onClick={() => handleBaja(item.id)} className="p-1.5 hover:bg-orange-100 rounded text-orange-600" title="Dar de baja"><Archive size={14} /></button>}
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 hover:bg-red-100 rounded text-red-600" title="Eliminar"><Trash2 size={14} /></button>
                    </div>
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

export default function ItemsPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-gray-500">Cargando...</div>}>
      <ItemsPageContent />
    </Suspense>
  )
}
