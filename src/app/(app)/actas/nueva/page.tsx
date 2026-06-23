'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Save, FileText, Search, X, ChevronLeft, ChevronRight, Trash2, Eye, Download } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { ACTA_TIPOS, ACTA_TEMPLATES, ActaTipo } from '@/types/acta-templates'
import ActaTemplate from '@/components/ActaTemplate'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

interface InventoryItem {
  id: string
  item: number
  cod_inv: string
  cod_esbye: string
  cuenta: string
  cant: number
  descripcion: string
  marca: string
  modelo: string
  serie: string
  fecha_adquisicion: string | null
  estado: string
  valor: number | null
  ubicacion?: string
  no_acta?: string
  clasificacion_activo?: string
}

const BATCH_SIZE = 1000

export default function NewActaPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [tipo, setTipo] = useState<ActaTipo | ''>('')
  const [templateData, setTemplateData] = useState<Record<string, string>>({})
  const [showPreview, setShowPreview] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)

  const [allInventory, setAllInventory] = useState<InventoryItem[]>([])
  const [invSearch, setInvSearch] = useState('')
  const [invSearchInput, setInvSearchInput] = useState('')
  const [invLoading, setInvLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectedItemsFull, setSelectedItemsFull] = useState<InventoryItem[]>([])
  const [invPage, setInvPage] = useState(1)
  const ITEMS_PER_PAGE = 50

  const filtered = invSearch
    ? allInventory.filter(i =>
        [i.cod_inv, i.descripcion, i.marca, i.modelo, i.serie, i.ubicacion, i.no_acta].some(
          v => v?.toLowerCase().includes(invSearch.toLowerCase())
        )
      )
    : allInventory

  // Load ALL items in batches
  useEffect(() => {
    let cancelled = false
    const loadAll = async () => {
      setInvLoading(true)
      const all: InventoryItem[] = []
      // First get total count
      const { count } = await supabase.from('items').select('*', { count: 'exact', head: true })
      const total = count || 0
      const pages = Math.ceil(total / BATCH_SIZE)
      for (let i = 0; i < pages; i++) {
        const from = i * BATCH_SIZE
        const { data } = await supabase
          .from('items')
          .select('id,item,cod_inv,cod_esbye,cuenta,cant,descripcion,marca,modelo,serie,fecha_adquisicion,estado,valor,ubicacion,no_acta,clasificacion_activo')
          .order('item', { ascending: true })
          .range(from, from + BATCH_SIZE - 1)
        if (cancelled) return
        if (data) all.push(...data)
      }
      if (!cancelled) {
        setAllInventory(all)
        setInvLoading(false)
      }
    }
    loadAll()
    return () => { cancelled = true }
  }, [])

  // Load full data for selected items
  useEffect(() => {
    if (selectedIds.length === 0) { setSelectedItemsFull([]); return }
    const fetchItems = async () => {
      const { data } = await supabase.from('items').select('id,item,cod_inv,cod_esbye,cuenta,cant,descripcion,marca,modelo,serie,fecha_adquisicion,estado,valor').in('id', selectedIds).order('item', { ascending: true })
      setSelectedItemsFull(data || [])
    }
    fetchItems()
  }, [selectedIds])

  const campos = tipo ? ACTA_TEMPLATES[tipo].campos : []

  const updateTemplateField = (key: string, value: string) => {
    setTemplateData(prev => ({ ...prev, [key]: value }))
  }

  const handleSearch = () => { setInvPage(1); setInvSearch(invSearchInput) }
  const clearSearch = () => { setInvSearchInput(''); setInvSearch(''); setInvPage(1) }
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const invPageItems = filtered.slice((invPage - 1) * ITEMS_PER_PAGE, invPage * ITEMS_PER_PAGE)
  const toggleSelect = (id: string) => setSelectedIds(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])
  const toggleSelectAll = () => {
    if (selectedIds.length === invPageItems.length && invPageItems.length > 0 && invPageItems.every(i => selectedIds.includes(i.id))) {
      setSelectedIds(prev => prev.filter(id => !invPageItems.find(i => i.id === id)))
    } else {
      const newIds = [...selectedIds]
      invPageItems.forEach(i => { if (!newIds.includes(i.id)) newIds.push(i.id) })
      setSelectedIds(newIds)
    }
  }
  const removeSelected = (id: string) => setSelectedIds(prev => prev.filter(s => s !== id))

  const generatePDFBlob = async (): Promise<Blob | null> => {
    const el = previewRef.current
    if (!el) return null
    try {
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, logging: false })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = 210
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      let heightLeft = pdfHeight
      let position = 0
      const pageHeight = 297

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight)
      heightLeft -= pageHeight
      while (heightLeft > 0) {
        position = heightLeft - pdfHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight)
        heightLeft -= pageHeight
      }
      return pdf.output('blob')
    } catch (err) {
      console.error('PDF error:', err)
      return null
    }
  }

  const handlePreview = () => {
    if (!tipo) { toast.error('Selecciona un tipo de acta'); return }
    setShowPreview(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tipo) { toast.error('Selecciona un tipo de acta'); return }
    if (!templateData.NUMERO_ACTA) { toast.error('El número de acta es obligatorio'); return }
    if (!templateData.FECHA_DIA || !templateData.FECHA_MES || !templateData.FECHA_ANIO) { toast.error('La fecha es obligatoria'); return }

    setSaving(true)
    const user = (await supabase.auth.getUser()).data.user
    if (!user) { toast.error('Debes iniciar sesión'); setSaving(false); return }

    // Build name
    const tipoLabel = ACTA_TIPOS.find(t => t.value === tipo)?.label || tipo
    const name = `ACTA No. ${templateData.NUMERO_ACTA} - ${tipoLabel} - ${templateData.FECHA_DIA}/${templateData.FECHA_MES}/${templateData.FECHA_ANIO}`

    // Generate PDF
    const { data: existingActas } = await supabase.from('actas').select('id').eq('name', name).limit(1)
    let fileUrl = ''
    let fileType = ''

    // Generate PDF after insert (since PDF needs the items data)
    const { data: acta, error: actaError } = await supabase.from('actas').insert([{
      name,
      fecha: `${templateData.FECHA_ANIO}-${templateData.FECHA_MES.padStart(2,'0')}-${templateData.FECHA_DIA.padStart(2,'0')}`,
      responsable: templateData.NOMBRE_ADMINISTRADOR || '',
      notas: `Tipo: ${tipoLabel} | Usuario: ${templateData.NOMBRE_USUARIO_FINAL || templateData.NOMBRE_ENTREGA || ''}`,
      tipo,
      template_data: templateData,
    }]).select().single()

    if (actaError) { toast.error('Error al guardar acta: ' + actaError.message); setSaving(false); return }

    // Save item relations
    if (selectedIds.length > 0) {
      const relations = selectedIds.map(item_id => ({ acta_id: acta.id, item_id }))
      const { error: relError } = await supabase.from('acta_items').insert(relations)
      if (relError) { toast.error('Error al asociar activos'); setSaving(false); return }
    }

    // History
    await supabase.from('acta_history').insert([{
      acta_id: acta.id, action: 'create',
      changes: { tipo: { new: tipo }, numero_acta: { new: templateData.NUMERO_ACTA }, items_count: { new: selectedIds.length } },
      user_id: user.id, user_name: user.email || 'Sistema',
    }])

    // Generate and upload PDF
    const blob = await generatePDFBlob()
    if (blob) {
      const path = `actas/${acta.id}.pdf`
      const { error: upError } = await supabase.storage.from('actas').upload(path, blob, { contentType: 'application/pdf', upsert: true })
      if (!upError) {
        const { data: { publicUrl } } = supabase.storage.from('actas').getPublicUrl(path)
        await supabase.from('actas').update({ file_url: publicUrl, file_type: 'application/pdf' }).eq('id', acta.id)
      }
    }

    toast.success(`Acta #${templateData.NUMERO_ACTA} registrada con ${selectedIds.length} activo(s)`)
    router.push('/actas')
  }

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('es-ES') : '-'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => router.back()} className="w-10 h-10 bg-gradient-to-br from-fii to-fii-light rounded-xl flex items-center justify-center shadow-lg shadow-fii/20 hover:shadow-xl transition-shadow cursor-pointer">
            <ArrowLeft className="text-white" size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Nueva Acta</h1>
            <p className="text-sm text-gray-500 mt-0.5">Generar acta institucional desde plantilla</p>
          </div>
        </div>
        <div className="flex gap-2">
          {tipo && (
            <button type="button" onClick={handlePreview} className="btn-secondary">
              <Eye size={16} /> Vista Previa
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tipo selector */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-fii rounded-full inline-block" />
            Tipo de Acta
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {ACTA_TIPOS.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => {
                  setTipo(t.value)
                  setTemplateData({})
                  setShowPreview(false)
                }}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  tipo === t.value
                    ? 'border-fii bg-fii/5 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <FileText size={24} className={tipo === t.value ? 'text-fii' : 'text-gray-400'} />
                <p className={`font-medium mt-2 ${tipo === t.value ? 'text-fii' : 'text-gray-700'}`}>{t.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic form */}
        {tipo && (
          <div className="card p-6">
            <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-fii rounded-full inline-block" />
              Datos de la Plantilla — {ACTA_TIPOS.find(t => t.value === tipo)?.label}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {campos.map(campo => (
                <div key={campo.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {campo.label}
                    {campo.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <input
                    type="text"
                    value={templateData[campo.key] || ''}
                    onChange={(e) => updateTemplateField(campo.key, e.target.value)}
                    className="input-field"
                    placeholder={campo.label}
                    required={campo.required}
                  />
                </div>
              ))}
            </div>
            {!tipo.includes('RECEPCION') && (
              <p className="text-xs text-gray-400 mt-3">Los campos marcados con * son obligatorios</p>
            )}
          </div>
        )}

        {/* Inventory selection */}
        {tipo && (
          <div className="card">
            <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span className="w-1 h-5 bg-fii rounded-full inline-block" />
                Agregar Bienes al Acta
                {selectedIds.length > 0 && (
                  <span className="ml-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-fii/10 text-fii font-medium text-xs">{selectedIds.length} seleccionado(s)</span>
                )}
              </h2>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input type="text" value={invSearchInput} onChange={(e) => setInvSearchInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { handleSearch() } }}
                    placeholder="Buscar: código, descripción, marca, modelo, serie, ubicación..."
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
              <table className="w-full text-sm whitespace-nowrap min-w-[1300px]">
                <thead>
                  <tr className="bg-gradient-to-r from-ug to-fii text-left">
                    <th className="table-header w-10"><input type="checkbox" checked={invPageItems.length > 0 && invPageItems.every(i => selectedIds.includes(i.id))} onChange={toggleSelectAll} className="rounded accent-white" /></th>
                    <th className="table-header">ITEM</th>
                    <th className="table-header">COD. INV.</th>
                    <th className="table-header">CÓD. ESBYE</th>
                    <th className="table-header">CUENTA</th>
                    <th className="table-header">CANT</th>
                    <th className="table-header">DESCRIPCIÓN</th>
                    <th className="table-header">MARCA</th>
                    <th className="table-header">MODELO</th>
                    <th className="table-header">SERIE</th>
                    <th className="table-header">FECHA ADQ.</th>
                    <th className="table-header">ESTADO</th>
                    <th className="table-header">CLASIFICACIÓN</th>
                  </tr>
                </thead>
                <tbody>
                  {invLoading ? (
                    <tr><td colSpan={13} className="p-8 text-center text-gray-500">Cargando inventario...</td></tr>
                  ) : invPageItems.length === 0 ? (
                    <tr><td colSpan={13} className="p-8 text-center text-gray-500">No se encontraron activos</td></tr>
                  ) : invPageItems.map((item: InventoryItem, idx: number) => (
                    <tr key={item.id} className={`border-t border-gray-100 hover:bg-sky-50/50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'} ${selectedIds.includes(item.id) ? 'bg-sky-50' : ''}`}>
                      <td className="table-cell"><input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleSelect(item.id)} className="rounded accent-fii" /></td>
                      <td className="table-cell font-mono">{item.item}</td>
                      <td className="table-cell font-mono text-gray-500">{item.cod_inv || '-'}</td>
                      <td className="table-cell text-gray-500">{item.cod_esbye || '-'}</td>
                      <td className="table-cell text-gray-500">{item.cuenta || '-'}</td>
                      <td className="table-cell text-center">{item.cant || 1}</td>
                      <td className="table-cell max-w-[200px] truncate" title={item.descripcion}>{item.descripcion}</td>
                      <td className="table-cell">{item.marca || '-'}</td>
                      <td className="table-cell">{item.modelo || '-'}</td>
                      <td className="table-cell font-mono text-gray-500">{item.serie || '-'}</td>
                      <td className="table-cell text-gray-500">{formatDate(item.fecha_adquisicion)}</td>
                      <td className="table-cell">
                        <span className={`badge ${item.estado === 'Bueno' ? 'bg-emerald-100 text-emerald-700' : item.estado === 'Regular' ? 'bg-amber-100 text-amber-700' : item.estado === 'Malo' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>{item.estado}</span>
                      </td>
                      <td className="table-cell">
                        <span className={`badge text-xs ${
                          item.clasificacion_activo === 'ACTIVO' ? 'bg-emerald-100 text-emerald-700' :
                          item.clasificacion_activo === 'DADO_DE_BAJA' ? 'bg-gray-300 text-gray-700' :
                          item.clasificacion_activo === 'NO_LOCALIZADO' ? 'bg-red-100 text-red-700' :
                          item.clasificacion_activo === 'PROXIMO_A_BAJA' ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>{item.clasificacion_activo?.replace(/_/g, ' ') || 'ACTIVO'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between p-4 border-t border-gray-100 bg-gray-50/50">
              <p className="text-sm text-gray-500 font-medium">{filtered.length} de {allInventory.length} activos</p>
              <div className="flex items-center gap-2">
                {invSearch && <button onClick={clearSearch} className="text-xs text-fii hover:underline mr-2">Limpiar filtro</button>}
                <button type="button" onClick={() => setInvPage(p => Math.max(1, p - 1))} disabled={invPage === 1} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ChevronLeft size={16} /></button>
                <span className="text-sm text-gray-600 font-medium px-3">Pág. {invPage} de {totalPages}</span>
                <button type="button" onClick={() => setInvPage(p => Math.min(totalPages, p + 1))} disabled={invPage >= totalPages} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ChevronRight size={16} /></button>
              </div>
            </div>
          </div>
        )}

        {/* Selected items table */}
        {selectedIds.length > 0 && (
          <div className="card p-6">
            <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-1 h-5 bg-fii rounded-full inline-block" />
              Bienes Asociados al Acta
              <span className="ml-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-fii/10 text-fii font-medium text-xs">{selectedIds.length} bien(es)</span>
            </h2>
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-sm whitespace-nowrap min-w-[1100px]">
                <thead>
                  <tr className="bg-gradient-to-r from-ug to-fii text-left">
                    <th className="table-header">ITEM</th>
                    <th className="table-header">COD. INV.</th>
                    <th className="table-header">CÓD. ESBYE</th>
                    <th className="table-header">CUENTA</th>
                    <th className="table-header">CANT</th>
                    <th className="table-header">DESCRIPCIÓN</th>
                    <th className="table-header">MARCA</th>
                    <th className="table-header">MODELO</th>
                    <th className="table-header">SERIE</th>
                    <th className="table-header">FECHA ADQ.</th>
                    <th className="table-header">ESTADO</th>
                    <th className="table-header">ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedItemsFull.map((item, idx) => (
                    <tr key={item.id} className={`border-t border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                      <td className="table-cell font-mono">{item.item}</td>
                      <td className="table-cell font-mono text-gray-500">{item.cod_inv || '-'}</td>
                      <td className="table-cell text-gray-500">{item.cod_esbye || '-'}</td>
                      <td className="table-cell text-gray-500">{item.cuenta || '-'}</td>
                      <td className="table-cell text-center">{item.cant || 1}</td>
                      <td className="table-cell max-w-[200px] truncate" title={item.descripcion}>{item.descripcion}</td>
                      <td className="table-cell">{item.marca || '-'}</td>
                      <td className="table-cell">{item.modelo || '-'}</td>
                      <td className="table-cell font-mono text-gray-500">{item.serie || '-'}</td>
                      <td className="table-cell text-gray-500">{formatDate(item.fecha_adquisicion)}</td>
                      <td className="table-cell"><span className={`badge ${item.estado === 'Bueno' ? 'bg-emerald-100 text-emerald-700' : item.estado === 'Regular' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>{item.estado}</span></td>
                      <td className="table-cell"><button type="button" onClick={() => removeSelected(item.id)} className="p-1.5 hover:bg-red-100 rounded text-red-600 transition-colors"><Trash2 size={14} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Submit */}
        {tipo && (
          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-primary !px-6 !py-2.5">
              <Save size={16} /> {saving ? 'Guardando...' : 'Guardar Acta y Generar PDF'}
            </button>
            <span className="text-sm text-gray-400">
              {selectedIds.length > 0 ? `${selectedIds.length} bien(es) asociado(s)` : 'Sin bienes seleccionados'}
            </span>
          </div>
        )}
      </form>

      {/* Preview modal */}
      {showPreview && tipo && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={() => setShowPreview(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-[210mm] w-full my-8" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-4 border-b border-gray-200 rounded-t-2xl">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <Eye size={18} /> Vista Previa del Acta
              </h2>
              <div className="flex gap-2">
                <button onClick={async () => {
                  const blob = await generatePDFBlob()
                  if (blob) {
                    const url = URL.createObjectURL(blob)
                    window.open(url, '_blank')
                  } else toast.error('Error al generar PDF')
                }} className="btn-primary !text-xs !px-3 !py-1.5">
                  <Download size={14} /> Descargar PDF
                </button>
                <button onClick={() => setShowPreview(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
              </div>
            </div>
            <div ref={previewRef}>
              <ActaTemplate tipo={tipo} data={templateData} items={selectedItemsFull} preview />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
