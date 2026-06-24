'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, FileText, ExternalLink, Edit, Trash2, History, Download, Eye, X } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'
import { ACTA_TIPOS, ActaTipo } from '@/types/acta-templates'
import ActaTemplate from '@/components/ActaTemplate'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

interface ActaItemJoined {
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

export default function ActaDetailPage() {
  const { profile } = useAuth()
  const canEdit = profile?.rol !== 'CONSULTA'
  const params = useParams()
  const router = useRouter()
  const [acta, setActa] = useState<any>(null)
  const [items, setItems] = useState<ActaItemJoined[]>([])
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'items' | 'history'>('items')
  const [showPreview, setShowPreview] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const load = async () => {
      const { data: actaData, error: actaError } = await supabase.from('actas').select('*').eq('id', params.id).single()
      if (actaError || !actaData) { toast.error('Acta no encontrada'); router.push('/actas'); return }
      setActa(actaData)

      const { data: rels } = await supabase.from('acta_items').select('item_id').eq('acta_id', params.id)
      if (rels && rels.length > 0) {
        const ids = rels.map(r => r.item_id)
        const { data: itemsData } = await supabase.from('items').select('id,item,cod_inv,cod_esbye,cant,descripcion,marca,modelo,serie,fecha_adquisicion,estado,valor').in('id', ids).order('item', { ascending: true })
        setItems(itemsData || [])
      }

      const { data: histData } = await supabase.from('acta_history').select('*').eq('acta_id', params.id).order('created_at', { ascending: false })
      setHistory(histData || [])

      setLoading(false)
    }
    load()
  }, [params.id, router])

  const handleDelete = async () => {
    if (!confirm('¿Eliminar esta acta? También se eliminarán las asociaciones con activos.')) return
    const { data: acta } = await supabase.from('actas').select('name,tipo').eq('id', params.id).single()
    const user = (await supabase.auth.getUser()).data.user
    const { error } = await supabase.from('actas').delete().eq('id', params.id)
    if (error) { toast.error('Error al eliminar'); return }
    if (user && acta) {
      await supabase.from('acta_history').insert([{
        acta_id: params.id, action: 'delete',
        changes: { name: acta.name, tipo: acta.tipo },
        user_id: user.id, user_name: user.email || 'Sistema',
      }])
    }
    toast.success('Acta eliminada')
    router.push('/actas')
  }

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

  const handleRegeneratePDF = async () => {
    const blob = await generatePDFBlob()
    if (!blob) { toast.error('Error al generar PDF'); return }
    const path = `actas/${params.id}.pdf`
    const { error: upError } = await supabase.storage.from('actas').upload(path, blob, { contentType: 'application/pdf', upsert: true })
    if (upError) { toast.error('Error al subir PDF'); return }
    const { data: { publicUrl } } = supabase.storage.from('actas').getPublicUrl(path)
    await supabase.from('actas').update({ file_url: publicUrl, file_type: 'application/pdf' }).eq('id', params.id)
    setActa((prev: any) => ({ ...prev, file_url: publicUrl, file_type: 'application/pdf' }))
    toast.success('PDF actualizado')
  }

  const getTipoLabel = (t: ActaTipo | null) => ACTA_TIPOS.find(tp => tp.value === t)?.label || 'Sin tipo'
  const getTipoBadge = (t: ActaTipo | null) => {
    const colors: Record<string, string> = {
      ENTREGA_ADMIN: 'bg-purple-100 text-purple-700',
      ASIGNACION_USUARIO: 'bg-blue-100 text-blue-700',
      RECEPCION_BODEGA: 'bg-green-100 text-green-700',
      CONSTATACION_FISICA: 'bg-amber-100 text-amber-700',
      ENTREGA_RECEPCION_CONSTATACION: 'bg-rose-100 text-rose-700',
    }
    return colors[t || ''] || 'bg-gray-100 text-gray-600'
  }

  const formatValor = (v: number | null) => v != null ? `$${v.toFixed(2)}` : '-'
  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('es-ES') : '-'

  const actionColors: Record<string, string> = {
    create: 'bg-green-100 text-green-700 border-green-200',
    update: 'bg-blue-100 text-blue-700 border-blue-200',
    delete: 'bg-red-100 text-red-700 border-red-200',
    add_items: 'bg-violet-100 text-violet-700 border-violet-200',
    remove_items: 'bg-orange-100 text-orange-700 border-orange-200',
  }

  if (loading) return <div className="text-center py-12 text-gray-500">Cargando...</div>
  if (!acta) return null

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-100 to-purple-100 rounded-xl flex items-center justify-center shadow-sm">
            <FileText className="text-violet-600" size={20} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-800">{acta.name}</h1>
              {acta.tipo && (
                <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${getTipoBadge(acta.tipo)}`}>
                  {getTipoLabel(acta.tipo)}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">Detalle del acta de inventario</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {acta.tipo && (
            <button onClick={() => setShowPreview(true)} className="btn-secondary">
              <Eye size={16} /> Vista Previa
            </button>
          )}
          {canEdit && <><Link href={`/actas/${params.id}/edit`} className="btn-primary">
            <Edit size={16} /> Editar
          </Link>
          <button onClick={handleDelete} className="btn-secondary !text-red-600 !border-red-200 hover:!bg-red-50">
            <Trash2 size={16} /> Eliminar
          </button></>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card p-6 space-y-3">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <span className="w-1 h-5 bg-fii rounded-full inline-block" />
            Información del Acta
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Nombre</p>
              <p className="font-medium text-gray-800">{acta.name}</p>
            </div>
            <div>
              <p className="text-gray-500">Fecha</p>
              <p className="font-medium text-gray-800">{formatDate(acta.fecha)}</p>
            </div>
            <div>
              <p className="text-gray-500">Responsable</p>
              <p className="font-medium text-gray-800">{acta.responsable || 'Sin responsable'}</p>
            </div>
            <div>
              <p className="text-gray-500">Activos asociados</p>
              <p className="font-medium text-gray-800">{items.length} activo(s)</p>
            </div>
          </div>
          {acta.notas && (
            <div>
              <p className="text-gray-500 text-sm">Notas</p>
              <p className="text-gray-700 text-sm">{acta.notas}</p>
            </div>
          )}
          <div className="text-xs text-gray-400 pt-2 border-t border-gray-100">
            <p>Creado: {new Date(acta.created_at).toLocaleString('es-ES')}</p>
          </div>
        </div>

        <div className="card p-6 space-y-3">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <span className="w-1 h-5 bg-fii rounded-full inline-block" />
            {acta.tipo ? 'Datos de la Plantilla' : 'Archivo Digitalizado'}
          </h2>
          {acta.tipo && acta.template_data ? (
            <div className="grid grid-cols-2 gap-3 text-sm">
              {Object.entries(acta.template_data).map(([key, value]) => (
                <div key={key}>
                  <p className="text-gray-400 text-xs uppercase">{key.replace(/_/g, ' ')}</p>
                  <p className="font-medium text-gray-800">{String(value || '-')}</p>
                </div>
              ))}
              <div className="col-span-2 pt-3 border-t border-gray-100 flex gap-2">
                {acta.file_url ? (
                  <a href={acta.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-fii hover:underline">
                    <Download size={16} /> Descargar PDF
                  </a>
                ) : (
                  <button onClick={handleRegeneratePDF} className="flex items-center gap-2 text-sm text-fii hover:underline">
                    <Download size={16} /> Generar PDF
                  </button>
                )}
              </div>
            </div>
          ) : acta.file_url ? (
            <div className="flex items-center gap-3 p-4 bg-violet-50 rounded-xl border border-violet-100">
              <div className="p-2.5 bg-violet-100 rounded-lg"><FileText size={24} className="text-violet-600" /></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-violet-700">Archivo adjunto</p>
                <p className="text-xs text-violet-500">{acta.file_type?.split('/')[1] || 'documento'}</p>
              </div>
              <a href={acta.file_url} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-white rounded-lg text-violet-600 transition-colors">
                <ExternalLink size={18} />
              </a>
            </div>
          ) : (
            <p className="text-sm text-gray-400">Sin archivo adjunto</p>
          )}
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('items')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'items' ? 'bg-fii text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          <FileText size={16} className="inline mr-1.5" /> Activos Asociados ({items.length})
        </button>
        <button onClick={() => setTab('history')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'history' ? 'bg-fii text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          <History size={16} className="inline mr-1.5" /> Historial de Cambios ({history.length})
        </button>
      </div>

      {tab === 'items' ? (
        <div className="card">
          {items.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <FileText className="mx-auto text-gray-300 mb-3" size={40} />
              <p className="text-gray-500 font-medium">No hay activos asociados a esta acta</p>
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                  <span className="w-1 h-5 bg-fii rounded-full inline-block" />
                  Activos Asociados
                  <span className="ml-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-fii/10 text-fii font-medium text-xs">{items.length} activo(s)</span>
                </h2>
              </div>
              <div className="overflow-x-auto scrollbar-thin">
                <div className="text-xs text-gray-400 px-4 py-1.5 bg-gray-50 italic flex items-center gap-1.5">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                  Desplázate horizontalmente para ver más columnas
                </div>
                <table className="w-full text-sm whitespace-nowrap min-w-[1200px]">
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
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item: ActaItemJoined, idx: number) => (
                      <tr key={item.id} className={`border-t border-gray-100 hover:bg-sky-50/50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                        <td className="table-cell font-mono"><Link href={`/items/${item.id}`} className="text-fii hover:underline">{item.item}</Link></td>
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
            </>
          )}
        </div>
      ) : (
        <div className="card p-6">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-amber-500 rounded-full inline-block" />
            Historial de Modificaciones del Acta
          </h2>
          {history.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <History className="mx-auto text-gray-300 mb-3" size={40} />
              <p className="font-medium">Sin cambios registrados</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((entry, idx) => (
                <div key={entry.id} className="relative flex gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  {idx < history.length - 1 && <div className="absolute left-7 top-14 bottom-0 w-px bg-gray-200" />}
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border-2 ${
                    actionColors[entry.action] ? actionColors[entry.action].split(' ').slice(-1)[0] : 'bg-gray-100 border-gray-300'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      entry.action === 'create' ? 'bg-green-500' :
                      entry.action === 'update' ? 'bg-blue-500' :
                      entry.action === 'add_items' ? 'bg-violet-500' :
                      entry.action === 'remove_items' ? 'bg-orange-500' :
                      'bg-gray-500'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`badge capitalize text-xs ${actionColors[entry.action] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                        {entry.action === 'create' ? 'Creada' : entry.action === 'update' ? 'Modificada' : entry.action === 'add_items' ? 'Items agregados' : entry.action === 'remove_items' ? 'Items removidos' : entry.action}
                      </span>
                      <span className="text-xs text-gray-400">{new Date(entry.created_at).toLocaleString('es-ES')}</span>
                      <span className="text-xs text-gray-400 ml-auto">{entry.user_name || 'Sistema'}</span>
                    </div>
                    {entry.changes && Object.keys(entry.changes).length > 0 && (
                      <div className="mt-2 text-xs text-gray-600 bg-white rounded-lg p-2 border border-gray-100">
                        {Object.entries(entry.changes).map(([key, val]) => (
                          <div key={key} className="flex gap-2 py-0.5">
                            <span className="font-medium text-gray-500">{key}:</span>
                            <span className="text-gray-400">{String((val as any).new ?? '')}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Preview modal */}
      {showPreview && acta.tipo && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={() => setShowPreview(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-[210mm] w-full my-8" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-4 border-b border-gray-200 rounded-t-2xl">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <Eye size={18} /> Vista Previa
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
              <ActaTemplate tipo={acta.tipo as ActaTipo} data={acta.template_data || {}} items={items} preview />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
