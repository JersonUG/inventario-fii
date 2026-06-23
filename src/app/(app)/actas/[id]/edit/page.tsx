'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Save, Upload, FileText, Search, X, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface InventoryItem {
  id: string
  item: number
  cod_inv: string
  cod_esbye: string
  cant: number
  descripcion: string
  marca: string
  modelo: string
  serie: string
  fecha_adquisicion: string | null
  estado: string
  valor: number | null
}

const ITEMS_PER_PAGE = 25

export default function EditActaPage() {
  const params = useParams()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', fecha: '', responsable: '', notas: '' })
  const [originalForm, setOriginalForm] = useState({ name: '', fecha: '', responsable: '', notas: '' })
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [existingFileUrl, setExistingFileUrl] = useState('')
  const [existingFileType, setExistingFileType] = useState('')

  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [invCount, setInvCount] = useState(0)
  const [invPage, setInvPage] = useState(1)
  const [invSearch, setInvSearch] = useState('')
  const [invSearchInput, setInvSearchInput] = useState('')
  const [invLoading, setInvLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const totalInvPages = Math.ceil(invCount / ITEMS_PER_PAGE)

  useEffect(() => {
    const loadActa = async () => {
      const { data: actaData, error } = await supabase.from('actas').select('*').eq('id', params.id).single()
      if (error || !actaData) { toast.error('Acta no encontrada'); router.push('/actas'); return }
      const initial = { name: actaData.name, fecha: actaData.fecha, responsable: actaData.responsable || '', notas: actaData.notas || '' }
      setForm(initial); setOriginalForm(initial)
      setExistingFileUrl(actaData.file_url || '')
      setExistingFileType(actaData.file_type || '')

      const { data: rels } = await supabase.from('acta_items').select('item_id').eq('acta_id', params.id)
      if (rels && rels.length > 0) {
        setSelectedIds(rels.map(r => r.item_id))
      }
      setLoading(false)
    }
    loadActa()
  }, [params.id, router])

  const loadInventory = useCallback(async () => {
    setInvLoading(true)
    let query = supabase.from('items').select('id,item,cod_inv,cod_esbye,cant,descripcion,marca,modelo,serie,fecha_adquisicion,estado,valor', { count: 'exact' }).eq('clasificacion_activo', 'ACTIVO')
    if (invSearch) {
      query = query.or(
        `cod_inv.ilike.%${invSearch}%,cod_esbye.ilike.%${invSearch}%,descripcion.ilike.%${invSearch}%,marca.ilike.%${invSearch}%,modelo.ilike.%${invSearch}%,serie.ilike.%${invSearch}%,estado.ilike.%${invSearch}%`
      )
    }
    const from = (invPage - 1) * ITEMS_PER_PAGE
    const { data, count: total, error } = await query.order('item', { ascending: true }).range(from, from + ITEMS_PER_PAGE - 1)
    if (!error) { setInventory(data || []); setInvCount(total || 0) }
    setInvLoading(false)
  }, [invPage, invSearch])

  useEffect(() => { loadInventory() }, [loadInventory])

  const update = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }))

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      setFile(f)
      if (f.type.startsWith('image/')) setPreview(URL.createObjectURL(f))
      else setPreview(null)
    }
  }

  const handleSearch = () => { setInvPage(1); setInvSearch(invSearchInput) }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === inventory.length && inventory.length > 0) {
      setSelectedIds(prev => prev.filter(id => !inventory.find(i => i.id === id)))
    } else {
      const newIds = [...selectedIds]
      inventory.forEach(i => { if (!newIds.includes(i.id)) newIds.push(i.id) })
      setSelectedIds(newIds)
    }
  }

  const removeSelected = (id: string) => setSelectedIds(prev => prev.filter(s => s !== id))

  const selectedItems = inventory.filter(i => selectedIds.includes(i.id))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name) { toast.error('El nombre del acta es obligatorio'); return }
    setSaving(true)

    const user = (await supabase.auth.getUser()).data.user
    if (!user) { toast.error('Debes iniciar sesión'); setSaving(false); return }

    let fileUrl = existingFileUrl
    let fileType = existingFileType

    if (file) {
      if (existingFileUrl) {
        const oldPath = existingFileUrl.split('/').pop()
        if (oldPath) await supabase.storage.from('actas').remove([`actas/${oldPath}`])
      }
      const ext = file.name.split('.').pop()
      const path = `actas/${Date.now()}_${form.name.replace(/\s+/g, '_')}.${ext}`
      const { error: uploadError } = await supabase.storage.from('actas').upload(path, file)
      if (uploadError) { toast.error('Error al subir archivo'); setSaving(false); return }
      const { data: { publicUrl } } = supabase.storage.from('actas').getPublicUrl(path)
      fileUrl = publicUrl
      fileType = file.type
    }

    const { error: updateError } = await supabase.from('actas').update({ ...form, file_url: fileUrl, file_type: fileType }).eq('id', params.id)
    if (updateError) { toast.error('Error al actualizar acta'); setSaving(false); return }

    const { data: existingRels } = await supabase.from('acta_items').select('item_id').eq('acta_id', params.id)
    const existingIds = existingRels?.map(r => r.item_id) || []

    const toRemove = existingIds.filter(id => !selectedIds.includes(id))
    const toAdd = selectedIds.filter(id => !existingIds.includes(id))

    if (toRemove.length > 0) {
      await supabase.from('acta_items').delete().eq('acta_id', params.id).in('item_id', toRemove)
    }
    if (toAdd.length > 0) {
      const relations = toAdd.map(item_id => ({ acta_id: params.id, item_id }))
      await supabase.from('acta_items').insert(relations)
    }

    const changes: Record<string, any> = {}
    if (form.name !== originalForm.name) changes.nombre = { old: originalForm.name, new: form.name }
    if (form.responsable !== originalForm.responsable) changes.responsable = { old: originalForm.responsable, new: form.responsable }
    if (form.notas !== originalForm.notas) changes.notas = { old: originalForm.notas, new: form.notas }
    if (toAdd.length > 0) changes.items_agregados = { new: toAdd.length }
    if (toRemove.length > 0) changes.items_removidos = { new: toRemove.length }

    if (Object.keys(changes).length > 0) {
      await supabase.from('acta_history').insert([{
        acta_id: params.id,
        action: toAdd.length > 0 || toRemove.length > 0 ? 'update' : 'update',
        changes,
        user_id: user.id,
        user_name: user.email || 'Sistema',
      }])
    }

    toast.success('Acta actualizada exitosamente')
    router.push(`/actas/${params.id}`)
  }

  const formatValor = (v: number | null) => v != null ? `$${v.toFixed(2)}` : '-'
  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('es-ES') : '-'

  if (loading) return <div className="text-center py-12 text-gray-500">Cargando...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl flex items-center justify-center shadow-sm">
            <Save className="text-amber-600" size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Editar Acta</h1>
            <p className="text-sm text-gray-500 mt-0.5">{form.name}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-6 space-y-4">
            <h2 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <span className="w-1 h-5 bg-fii rounded-full inline-block" />
              Datos del Acta
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Acta</label>
              <input type="text" value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Ej: ACTA #001 - LABORATORIO"
                className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
              <input type="date" value={form.fecha} onChange={(e) => update('fecha', e.target.value)}
                className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Responsable</label>
              <input type="text" value={form.responsable} onChange={(e) => update('responsable', e.target.value)} placeholder="Nombre del responsable"
                className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
              <textarea value={form.notas} onChange={(e) => update('notas', e.target.value)} rows={3}
                className="input-field" placeholder="Observaciones..." />
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <span className="w-1 h-5 bg-fii rounded-full inline-block" />
              Archivo Digitalizado
            </h2>
            <p className="text-sm text-gray-500">Sube un nuevo archivo o mantén el existente</p>
            {existingFileUrl && !file && (
              <div className="flex items-center gap-3 p-3 bg-violet-50 rounded-xl border border-violet-100">
                <div className="p-2 bg-violet-100 rounded-lg"><FileText size={20} className="text-violet-600" /></div>
                <span className="text-sm font-medium text-violet-700">Archivo actual</span>
                <a href={existingFileUrl} target="_blank" rel="noopener noreferrer" className="ml-auto p-1.5 hover:bg-white rounded text-violet-600"><FileText size={16} /></a>
              </div>
            )}
            <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-violet-400 hover:bg-violet-50/50 transition-all duration-200">
              <Upload className="mx-auto text-gray-400 mb-2" size={32} />
              <p className="text-sm text-gray-500 font-medium">{file ? file.name : 'Haz clic para subir un archivo'}</p>
              <p className="text-xs text-gray-400 mt-1">PDF o JPG — Máx 10MB</p>
              <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} className="hidden" />
            </div>
            {preview && <img src={preview} alt="Preview" className="w-full h-48 object-cover rounded-xl border border-gray-200 shadow-sm" />}
          </div>
        </div>

        <div className="card">
          <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-1 h-5 bg-fii rounded-full inline-block" />
              Ítems del Acta
            </h2>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input type="text" value={invSearchInput} onChange={(e) => setInvSearchInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { handleSearch() } }}
                  placeholder="Buscar: cod_inv, cod_esbye, descripción, marca, modelo, serie, estado..."
                  className="input-field pl-9" />
              </div>
              <button type="button" onClick={handleSearch} className="px-5 py-2.5 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">Buscar</button>
            </div>
          </div>

          <div className="overflow-x-auto scrollbar-thin">
            <div className="text-xs text-gray-400 px-4 py-1.5 bg-gray-50 italic flex items-center gap-1.5">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
              Desplázate horizontalmente para ver más columnas
            </div>
            <table className="w-full text-sm whitespace-nowrap min-w-[1200px]">
              <thead>
                <tr className="bg-gradient-to-r from-ug to-fii text-left">
                  <th className="table-header w-10"><input type="checkbox" checked={selectedIds.length === inventory.length && inventory.length > 0} onChange={toggleSelectAll} className="rounded accent-white" /></th>
                  <th className="table-header">ITEM</th>
                  <th className="table-header">COD. INV. ACTIVO FIJOS</th>
                  <th className="table-header">CÓD. ESBYE</th>
                  <th className="table-header">CANT</th>
                  <th className="table-header">DESCRIPCIÓN</th>
                  <th className="table-header">MARCA</th>
                  <th className="table-header">MODELO</th>
                  <th className="table-header">SERIE</th>
                  <th className="table-header">FECHA ADQUISICIÓN</th>
                  <th className="table-header">ESTADO</th>
                  <th className="table-header">VALOR</th>
                </tr>
              </thead>
              <tbody>
                {invLoading ? (
                  <tr><td colSpan={12} className="p-8 text-center text-gray-500">Cargando inventario...</td></tr>
                ) : inventory.length === 0 ? (
                  <tr><td colSpan={12} className="p-8 text-center text-gray-500">No se encontraron activos</td></tr>
                ) : inventory.map((item: InventoryItem, idx: number) => (
                  <tr key={item.id} className={`border-t border-gray-100 hover:bg-sky-50/50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'} ${selectedIds.includes(item.id) ? 'bg-sky-50' : ''}`}>
                    <td className="table-cell"><input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleSelect(item.id)} className="rounded accent-fii" /></td>
                    <td className="table-cell font-mono">{item.item}</td>
                    <td className="table-cell font-mono text-gray-500">{item.cod_inv || '-'}</td>
                    <td className="table-cell text-gray-500">{item.cod_esbye || '-'}</td>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between p-4 border-t border-gray-100 bg-gray-50/50">
            <p className="text-sm text-gray-500 font-medium">{invCount} activos</p>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setInvPage(p => Math.max(1, p - 1))} disabled={invPage === 1} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ChevronLeft size={16} /></button>
              <span className="text-sm text-gray-600 font-medium px-3">Pág. {invPage} de {totalInvPages || 1}</span>
              <button type="button" onClick={() => setInvPage(p => Math.min(totalInvPages, p + 1))} disabled={invPage >= totalInvPages} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ChevronRight size={16} /></button>
            </div>
          </div>
        </div>

        {selectedIds.length > 0 && (
          <div className="card p-6">
            <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-1 h-5 bg-fii rounded-full inline-block" />
              Activos Asociados al Acta
              <span className="ml-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-fii/10 text-fii font-medium text-xs">{selectedIds.length} activo(s)</span>
            </h2>
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-sm whitespace-nowrap min-w-[1000px]">
                <thead>
                  <tr className="bg-gradient-to-r from-ug to-fii text-left">
                    <th className="table-header">ITEM</th>
                    <th className="table-header">COD. INV. ACTIVO FIJOS</th>
                    <th className="table-header">CÓD. ESBYE</th>
                    <th className="table-header">CANT</th>
                    <th className="table-header">DESCRIPCIÓN</th>
                    <th className="table-header">MARCA</th>
                    <th className="table-header">MODELO</th>
                    <th className="table-header">SERIE</th>
                    <th className="table-header">FECHA ADQUISICIÓN</th>
                    <th className="table-header">ESTADO</th>
                    <th className="table-header">VALOR</th>
                    <th className="table-header">ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedItems.map((item: InventoryItem, idx: number) => (
                    <tr key={item.id} className={`border-t border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                      <td className="table-cell font-mono">{item.item}</td>
                      <td className="table-cell font-mono text-gray-500">{item.cod_inv || '-'}</td>
                      <td className="table-cell text-gray-500">{item.cod_esbye || '-'}</td>
                      <td className="table-cell text-center">{item.cant || 1}</td>
                      <td className="table-cell max-w-[200px] truncate" title={item.descripcion}>{item.descripcion}</td>
                      <td className="table-cell">{item.marca || '-'}</td>
                      <td className="table-cell">{item.modelo || '-'}</td>
                      <td className="table-cell font-mono text-gray-500">{item.serie || '-'}</td>
                      <td className="table-cell text-gray-500">{formatDate(item.fecha_adquisicion)}</td>
                      <td className="table-cell">
                        <span className={`badge ${
                          item.estado === 'Bueno' ? 'bg-emerald-100 text-emerald-700' :
                          item.estado === 'Regular' ? 'bg-amber-100 text-amber-700' :
                          item.estado === 'Malo' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                        }`}>{item.estado}</span>
                      </td>
                      <td className="table-cell font-mono">{formatValor(item.valor)}</td>
                      <td className="table-cell">
                        <button type="button" onClick={() => removeSelected(item.id)} className="p-1.5 hover:bg-red-100 rounded text-red-600 transition-colors" title="Eliminar"><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={saving} className="btn-primary !px-6 !py-2.5">
            <Save size={16} /> {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
          <span className="text-sm text-gray-400">
            {selectedIds.length > 0 ? `${selectedIds.length} activo(s) asociados` : 'Sin activos seleccionados'}
          </span>
        </div>
      </form>
    </div>
  )
}
