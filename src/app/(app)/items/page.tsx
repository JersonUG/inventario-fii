'use client'

import { useEffect, useState, useCallback, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Plus, Search, ChevronLeft, ChevronRight, Edit, Trash2, X, Download, FileText, XCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useRealtime } from '@/hooks/useRealtime'
import Link from 'next/link'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import { CLASIFICACION_OPTIONS } from '@/types/database'

const ITEMS_PER_PAGE = 50

function ItemsPageContent() {
  const { profile } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const canEdit = profile?.rol === 'ADMINISTRADOR' || profile?.rol === 'OPERADOR'
  const [items, setItems] = useState<any[]>([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [filterOptions, setFilterOptions] = useState<Record<string, string[]>>({})
  const [clasificacionFilter, setClasificacionFilter] = useState(searchParams.get('clasificacion') || '')
  const [noActaFilter, setNoActaFilter] = useState('')
  const [noActaSearch, setNoActaSearch] = useState('')
  const [noActaOptions, setNoActaOptions] = useState<string[]>([])
  const [noActaAll, setNoActaAll] = useState<string[]>([])
  const [noActaDropdownOpen, setNoActaDropdownOpen] = useState(false)
  const noActaRef = useRef<HTMLDivElement>(null)

  const totalPages = Math.ceil(count / ITEMS_PER_PAGE)

  const loadItems = useCallback(async () => {
    setLoading(true)
    let query = supabase.from('items').select('*', { count: 'exact' })

    if (clasificacionFilter) query = query.eq('clasificacion_activo', clasificacionFilter)

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
  }, [page, search, clasificacionFilter, filters])

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

  useRealtime('items', loadItems)
  useEffect(() => { loadItems() }, [loadItems])
  useEffect(() => { loadFilterOptions() }, [loadFilterOptions])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (noActaRef.current && !noActaRef.current.contains(e.target as Node)) setNoActaDropdownOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    supabase.rpc('get_distinct_values', { col_name: 'no_acta' }).then(({ data }) => {
      if (data) setNoActaAll(data.map((d: any) => d.val).filter(Boolean).sort())
    })
  }, [])

  useEffect(() => {
    if (!noActaSearch) { setNoActaOptions(noActaAll); return }
    const s = noActaSearch.toUpperCase()
    setNoActaOptions(noActaAll.filter(v => v.toUpperCase().includes(s)))
  }, [noActaSearch, noActaAll])

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar permanentemente? No se puede deshacer.')) return
    const { data: item } = await supabase.from('items').select('item,descripcion').eq('id', id).single()
    if (!item) { toast.error('Ítem no encontrado'); return }
    const user = (await supabase.auth.getUser()).data.user
    const { error } = await supabase.from('items').delete().eq('id', id)
    if (error) { toast.error('Error: ' + error.message); return }
    if (user) {
      await supabase.from('item_history').insert([{
        item_id: id, action: 'delete',
        changes: { item: { old: item.item }, descripcion: { old: item.descripcion } },
        user_id: user.id, user_name: user.email || 'Sistema',
      }])
    }
    toast.success('Ítem eliminado'); loadItems()
  }

  const handleExport = async () => {
    setExporting(true)
    const { data: allItems, error } = await supabase.from('items')
      .select('item,cod_inv,cod_esbye,cuenta,cant,descripcion,marca,modelo,serie,fecha_adquisicion,estado,valor,ubicacion,observaciones,no_acta,mes,clasificacion_activo')
      .order('item', { ascending: true })

    if (error || !allItems) { toast.error('Error al exportar'); setExporting(false); return }

    const ws = XLSX.utils.json_to_sheet(allItems.map(i => ({
      ITEM: i.item,
      'COD. INV': i.cod_inv,
      'COD. ESBYE': i.cod_esbye,
      CUENTA: i.cuenta,
      CANT: i.cant,
      DESCRIPCIÓN: i.descripcion,
      MARCA: i.marca,
      MODELO: i.modelo,
      SERIE: i.serie,
      'FECHA ADQ.': i.fecha_adquisicion,
      ESTADO: i.estado,
      'VALOR ($)': i.valor,
      UBICACIÓN: i.ubicacion,
      OBSERVACIONES: i.observaciones,
      'No. ACTA': i.no_acta,
      'COLORES / NOTAS': i.mes,
      CLASIFICACIÓN: i.clasificacion_activo,
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Inventario')
    XLSX.writeFile(wb, `Inventario_FII_${new Date().toISOString().split('T')[0]}.xlsx`)
    toast.success(`Exportados ${allItems.length} registros`)
    setExporting(false)
  }

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); setSearch(searchInput) }
  const clearFilters = () => { setFilters({}); setSearch(''); setSearchInput(''); setPage(1); clearNoActa(); setClasificacionFilter('') }
  const selectNoActa = (val: string) => {
    setNoActaFilter(val); setNoActaSearch(val); setNoActaDropdownOpen(false); setPage(1)
    setFilters(prev => ({ ...prev, no_acta: val }))
  }
  const clearNoActa = () => {
    setNoActaFilter(''); setNoActaSearch(''); setPage(1)
    setFilters(prev => { const n = { ...prev }; delete n.no_acta; return n })
  }
  const toggleSelect = (id: string) => setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])
  const toggleSelectAll = () => setSelected(selected.length === items.length ? [] : items.map(i => i.id))
  const formatValor = (v: number | null) => v != null ? `$${v.toFixed(2)}` : '-'
  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('es-ES') : '-'

  const getClasificacionBadge = (c: string) => {
    const opt = CLASIFICACION_OPTIONS.find(o => o.value === c)
    return opt ? opt.color : 'bg-gray-100 text-gray-600'
  }

  const getRowClass = (item: any) => {
    if (item.clasificacion_activo === 'DADO_DE_BAJA') return 'bg-red-50/30'
    if (item.clasificacion_activo === 'NO_LOCALIZADO') return 'bg-orange-50/50'
    if (item.clasificacion_activo === 'PROXIMO_A_BAJA') return 'bg-amber-50/50'
    return ''
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {clasificacionFilter
              ? CLASIFICACION_OPTIONS.find(o => o.value === clasificacionFilter)?.label || 'Inventario'
              : 'Inventario General'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {clasificacionFilter ? 'Vista filtrada del inventario general' : 'Gestión de activos patrimoniales'}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} disabled={exporting} className="btn-secondary">
            <Download size={16} /> {exporting ? 'Exportando...' : 'Exportar Excel'}
          </button>
          {canEdit && <Link href="/items/new" className="btn-primary"><Plus size={16} /> Nuevo Ítem</Link>}
        </div>
      </div>

      <div className="card">
        <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex flex-col sm:flex-row gap-3">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Buscar: código, descripción, serie, marca, modelo, ubicación..."
                  className="input-field pl-9"
                />
              </div>
              <button type="submit" className="px-5 py-2.5 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">Buscar</button>
            </form>
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            <select
              value={clasificacionFilter}
              onChange={(e) => { setClasificacionFilter(e.target.value); setPage(1) }}
              className="filter-select"
            >
              <option value="">Todas las clasificaciones</option>
              {CLASIFICACION_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            {Object.keys(filterOptions).map(col => (
              <select
                key={col}
                value={filters[col] || ''}
                onChange={(e) => { setFilters(prev => ({ ...prev, [col]: e.target.value })); setPage(1) }}
                className="filter-select"
              >
                <option value="">{col === 'cuenta' ? 'Categoría' : col}</option>
                {filterOptions[col].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            ))}
            <div className="relative min-w-[180px]" ref={noActaRef}>
              <input type="text" value={noActaSearch} onChange={(e) => { setNoActaSearch(e.target.value); setNoActaDropdownOpen(true); if (!e.target.value) clearNoActa() }}
                onFocus={() => setNoActaDropdownOpen(true)} placeholder="No. Acta..." className="filter-select w-full"
              />
              {noActaDropdownOpen && noActaOptions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                  {noActaOptions.map(v => (
                    <button key={v} type="button" onClick={() => selectNoActa(v)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-sky-50 transition-colors border-b border-gray-50 last:border-0"
                    >{v}</button>
                  ))}
                </div>
              )}
              {noActaDropdownOpen && noActaSearch && noActaOptions.length === 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-3 text-sm text-gray-500">Sin resultados</div>
              )}
            </div>
            {(clasificacionFilter || Object.keys(filters).length > 0 || search || noActaFilter) && (
              <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 px-3 py-1.5 rounded-lg border border-red-200 hover:border-red-300 transition-colors">
                <X size={14} /> Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {noActaFilter && (
          <div className="px-4 py-3 bg-gradient-to-r from-amber-50 to-white border-b border-amber-200 flex items-center gap-3 text-sm">
            <FileText size={16} className="text-amber-600" />
            <span className="font-medium text-amber-800">No. Acta: {noActaFilter}</span>
            <span className="text-amber-600 font-medium">{count} bienes encontrados</span>
            <button onClick={clearNoActa} className="ml-auto text-amber-400 hover:text-red-500 transition-colors" title="Quitar filtro"><XCircle size={18} /></button>
          </div>
        )}
        
        {selected.length > 0 && (
          <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-white border-b border-blue-100 flex items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-fii/10 text-fii font-medium text-xs">{selected.length} seleccionado(s)</span>
            <Link href={`/traslados?ids=${selected.join(',')}`} className="text-fii hover:text-fii-dark font-medium text-xs hover:underline">Trasladar seleccionados</Link>
          </div>
        )}

        <div className="overflow-x-auto scrollbar-thin border-t border-gray-100">
          <div className="text-xs text-gray-400 px-4 py-1.5 bg-gray-50 italic flex items-center gap-1.5">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
            Desplázate horizontalmente para ver más columnas
          </div>
          <table className="w-full text-sm whitespace-nowrap min-w-[2100px]">
            <thead>
              <tr className="bg-gradient-to-r from-ug to-fii text-left">
                <th className="table-header sticky left-0 bg-gradient-to-r from-ug to-fii z-10 w-10"><input type="checkbox" checked={selected.length === items.length && items.length > 0} onChange={toggleSelectAll} className="rounded accent-white" /></th>
                <th className="table-header">ITEM</th>
                <th className="table-header">COD. INV</th>
                <th className="table-header">COD. ESBYE</th>
                <th className="table-header">CUENTA</th>
                <th className="table-header">CANT</th>
                <th className="table-header">DESCRIPCIÓN</th>
                <th className="table-header">MARCA</th>
                <th className="table-header">MODELO</th>
                <th className="table-header">SERIE</th>
                <th className="table-header">FECHA ADQ.</th>
                <th className="table-header">ESTADO</th>
                <th className="table-header">VALOR</th>
                <th className="table-header">UBICACIÓN</th>
                <th className="table-header">OBSERVACIONES</th>
                <th className="table-header">No. ACTA</th>
                <th className="table-header">COLORES / NOTAS</th>
                <th className="table-header">CLASIFICACIÓN</th>
                <th className="table-header sticky right-0 bg-gradient-to-r from-ug to-fii z-10">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={19} className="p-8 text-center text-gray-500">Cargando...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={19} className="p-8 text-center text-gray-500">No se encontraron registros</td></tr>
              ) : items.map((item: any, idx: number) => (
                <tr key={item.id} className={`border-t border-gray-100 hover:bg-sky-50/50 transition-colors ${getRowClass(item)} ${idx % 2 === 0 && !getRowClass(item) ? 'bg-white' : ''}`}>
                  <td className="table-cell sticky left-0 bg-white z-10"><input type="checkbox" checked={selected.includes(item.id)} onChange={() => toggleSelect(item.id)} className="rounded accent-fii" /></td>
                  <td className="table-cell font-mono">{item.item}</td>
                  <td className="table-cell font-mono text-gray-500">{item.cod_inv || '-'}</td>
                  <td className="table-cell text-gray-500">{item.cod_esbye || '-'}</td>
                  <td className="table-cell text-gray-500">{item.cuenta || '-'}</td>
                  <td className="table-cell text-center">{item.cant || 1}</td>
                  <td className="table-cell max-w-[250px] truncate" title={item.descripcion}>{item.descripcion}</td>
                  <td className="table-cell">{item.marca || '-'}</td>
                  <td className="table-cell">{item.modelo || '-'}</td>
                  <td className="table-cell font-mono text-gray-500">{item.serie || '-'}</td>
                  <td className="table-cell text-gray-500">{formatDate(item.fecha_adquisicion)}</td>
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
                  <td className="table-cell font-mono">{formatValor(item.valor)}</td>
                  <td className="table-cell max-w-[150px] truncate" title={item.ubicacion}>{item.ubicacion || '-'}</td>
                  <td className="table-cell max-w-[150px] truncate text-gray-500" title={item.observaciones}>{item.observaciones || '-'}</td>
                  <td className="table-cell max-w-[150px] truncate text-gray-500" title={item.no_acta}>{item.no_acta || '-'}</td>
                  <td className="table-cell max-w-[200px] truncate text-gray-500" title={item.mes}>{item.mes || '-'}</td>
                  <td className="table-cell">
                    <span className={`badge ${getClasificacionBadge(item.clasificacion_activo)}`}>
                      {CLASIFICACION_OPTIONS.find(o => o.value === item.clasificacion_activo)?.label || item.clasificacion_activo}
                    </span>
                  </td>
                  <td className="table-cell sticky right-0 bg-white z-10">
                    <div className="flex items-center gap-1">
                      <Link href={`/items/${item.id}`} className="p-1.5 hover:bg-sky-100 rounded text-sky-600 transition-colors" title="Ver detalle"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></Link>
                      {canEdit && <><Link href={`/items/${item.id}/edit`} className="p-1.5 hover:bg-blue-100 rounded text-fii transition-colors"><Edit size={14} /></Link>
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 hover:bg-red-100 rounded text-red-600 transition-colors" title="Eliminar"><Trash2 size={14} /></button></>}
                    </div>
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

export default function ItemsPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-gray-500">Cargando...</div>}>
      <ItemsPageContent />
    </Suspense>
  )
}
