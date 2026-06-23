'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Edit, History, Package, MapPin, FileText, User, Calendar, Hash, DollarSign } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { CLASIFICACION_OPTIONS } from '@/types/database'

export default function ItemDetailPage() {
  const { profile } = useAuth()
  const params = useParams()
  const router = useRouter()
  const canEdit = profile?.rol !== 'CONSULTA'
  const [item, setItem] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [actas, setActas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'info' | 'history'>('info')

  useEffect(() => {
    const load = async () => {
      const { data: itemData } = await supabase.from('items').select('*').eq('id', params.id).single()
      if (!itemData) { router.push('/items'); return }
      setItem(itemData)

      const { data: histData } = await supabase.from('item_history').select('*').eq('item_id', params.id).order('created_at', { ascending: false })
      setHistory(histData || [])

      const { data: rels } = await supabase.from('acta_items').select('acta_id').eq('item_id', params.id)
      if (rels && rels.length > 0) {
        const ids = rels.map(r => r.acta_id)
        const { data: actaData } = await supabase.from('actas').select('id,name,fecha').in('id', ids).order('created_at', { ascending: false })
        setActas(actaData || [])
      }

      setLoading(false)
    }
    load()
  }, [params.id, router])

  const formatValor = (v: number | null) => v != null ? `$${v.toFixed(2)}` : '-'
  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('es-ES') : '-'
  const actionColors: Record<string, string> = {
    create: 'bg-green-100 text-green-700 border-green-200',
    update: 'bg-blue-100 text-blue-700 border-blue-200',
    baja: 'bg-orange-100 text-orange-700 border-orange-200',
    delete: 'bg-red-100 text-red-700 border-red-200',
    transfer: 'bg-purple-100 text-purple-700 border-purple-200',
  }

  if (loading) return <div className="text-center py-12 text-gray-500">Cargando...</div>
  if (!item) return null

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-fii to-fii-light rounded-xl flex items-center justify-center shadow-lg shadow-fii/20">
            <Package className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Ítem #{item.item}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{item.descripcion}</p>
          </div>
        </div>
        {canEdit && <Link href={`/items/${item.id}/edit`} className="btn-primary"><Edit size={16} /> Editar</Link>}
      </div>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('info')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'info' ? 'bg-fii text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          <Package size={16} className="inline mr-1.5" /> Información
        </button>
        <button onClick={() => setTab('history')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'history' ? 'bg-fii text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          <History size={16} className="inline mr-1.5" /> Historial de Cambios {history.length > 0 && <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-full text-xs">{history.length}</span>}
        </button>
      </div>

      {tab === 'info' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card p-6">
            <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-fii rounded-full inline-block" />
              Datos del Activo
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-gray-500 text-xs flex items-center gap-1"><Hash size={12} /> ITEM</p>
                <p className="font-semibold text-gray-800 mt-1">{item.item}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-gray-500 text-xs">COD. INV</p>
                <p className="font-semibold text-gray-800 mt-1 font-mono">{item.cod_inv || '-'}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-gray-500 text-xs">COD. ESBYE</p>
                <p className="font-semibold text-gray-800 mt-1 font-mono">{item.cod_esbye || '-'}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-gray-500 text-xs">CUENTA</p>
                <p className="font-semibold text-gray-800 mt-1">{item.cuenta || '-'}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-gray-500 text-xs">CANT</p>
                <p className="font-semibold text-gray-800 mt-1">{item.cant || 1}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-gray-500 text-xs">MARCA</p>
                <p className="font-semibold text-gray-800 mt-1">{item.marca || '-'}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-gray-500 text-xs">MODELO</p>
                <p className="font-semibold text-gray-800 mt-1">{item.modelo || '-'}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-gray-500 text-xs">SERIE</p>
                <p className="font-semibold text-gray-800 mt-1 font-mono">{item.serie || '-'}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-gray-500 text-xs flex items-center gap-1"><Calendar size={12} /> FECHA ADQ.</p>
                <p className="font-semibold text-gray-800 mt-1">{formatDate(item.fecha_adquisicion)}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-gray-500 text-xs">ESTADO</p>
                <p className="mt-1">
                  <span className={`badge ${
                    item.estado === 'Bueno' ? 'bg-emerald-100 text-emerald-700' :
                    item.estado === 'Regular' ? 'bg-amber-100 text-amber-700' :
                    item.estado === 'Malo' ? 'bg-red-100 text-red-700' :
                    item.estado === 'Para Baja' ? 'bg-rose-100 text-rose-700' :
                    item.estado === 'Dado de Baja' ? 'bg-gray-300 text-gray-700 line-through' :
                    'bg-gray-100 text-gray-600'
                  }`}>{item.estado}</span>
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-gray-500 text-xs flex items-center gap-1"><DollarSign size={12} /> VALOR</p>
                <p className="font-semibold text-gray-800 mt-1">{formatValor(item.valor)}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-gray-500 text-xs flex items-center gap-1"><MapPin size={12} /> UBICACIÓN</p>
                <p className="font-semibold text-gray-800 mt-1">{item.ubicacion || '-'}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-gray-500 text-xs">No. ACTA</p>
                <p className="font-semibold text-gray-800 mt-1">{item.no_acta || '-'}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-gray-500 text-xs">COLORES / NOTAS</p>
                <p className="font-semibold text-gray-800 mt-1">{item.mes || '-'}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl sm:col-span-2">
                <p className="text-gray-500 text-xs">CLASIFICACIÓN</p>
                <p className="mt-1">
                  <span className={`badge ${(() => {
                    const opt = CLASIFICACION_OPTIONS.find(o => o.value === item.clasificacion_activo)
                    return opt ? opt.color : 'bg-gray-100 text-gray-600'
                  })()}`}>
                    {CLASIFICACION_OPTIONS.find(o => o.value === item.clasificacion_activo)?.label || item.clasificacion_activo}
                  </span>
                </p>
              </div>
            </div>
            {item.observaciones && (
              <div className="mt-4 p-3 bg-gray-50 rounded-xl">
                <p className="text-gray-500 text-xs">OBSERVACIONES</p>
                <p className="text-gray-700 mt-1 text-sm">{item.observaciones}</p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="card p-6">
              <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span className="w-1 h-5 bg-violet-500 rounded-full inline-block" />
                Actas Asociadas
              </h2>
              {actas.length === 0 ? (
                <p className="text-sm text-gray-400">Sin actas asociadas</p>
              ) : (
                <div className="space-y-2">
                  {actas.map(a => (
                    <Link key={a.id} href={`/actas/${a.id}`} className="block p-3 bg-violet-50 rounded-xl border border-violet-100 hover:bg-violet-100 transition-colors">
                      <p className="text-sm font-medium text-violet-700">{a.name}</p>
                      <p className="text-xs text-violet-500 mt-0.5">{formatDate(a.fecha)}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <div className="card p-6">
              <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span className="w-1 h-5 bg-amber-500 rounded-full inline-block" />
                Metadatos
              </h2>
              <div className="text-sm space-y-2">
                <p className="text-gray-500">Creado: <span className="text-gray-700">{new Date(item.created_at).toLocaleString('es-ES')}</span></p>
                <p className="text-gray-500">Actualizado: <span className="text-gray-700">{new Date(item.updated_at).toLocaleString('es-ES')}</span></p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card p-6">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-amber-500 rounded-full inline-block" />
            Línea de Tiempo — Historial de Cambios
          </h2>
          {history.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <History className="mx-auto text-gray-300 mb-3" size={40} />
              <p className="font-medium">Sin cambios registrados</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((entry, idx) => (
                <div key={entry.id} className="relative flex gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  {idx < history.length - 1 && <div className="absolute left-7 top-14 bottom-0 w-px bg-gray-200" />}
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border-2 ${
                    entry.action === 'create' ? 'bg-green-100 border-green-300' :
                    entry.action === 'update' ? 'bg-blue-100 border-blue-300' :
                    entry.action === 'baja' ? 'bg-orange-100 border-orange-300' :
                    entry.action === 'delete' ? 'bg-red-100 border-red-300' :
                    entry.action === 'transfer' ? 'bg-purple-100 border-purple-300' :
                    'bg-gray-100 border-gray-300'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      entry.action === 'create' ? 'bg-green-500' :
                      entry.action === 'update' ? 'bg-blue-500' :
                      entry.action === 'baja' ? 'bg-orange-500' :
                      entry.action === 'delete' ? 'bg-red-500' :
                      entry.action === 'transfer' ? 'bg-purple-500' :
                      'bg-gray-500'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`badge capitalize text-xs ${actionColors[entry.action] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                        {entry.action === 'create' ? 'Creado' : entry.action === 'update' ? 'Modificado' : entry.action === 'baja' ? 'Dado de baja' : entry.action === 'transfer' ? 'Traslado' : entry.action}
                      </span>
                      <span className="text-xs text-gray-400">{new Date(entry.created_at).toLocaleString('es-ES')}</span>
                      <span className="text-xs text-gray-400 ml-auto">{entry.user_name || 'Sistema'}</span>
                    </div>
                    {entry.changes && Object.keys(entry.changes).length > 0 && (
                      <div className="mt-2 text-xs text-gray-600 bg-white rounded-lg p-2 border border-gray-100">
                        {Object.entries(entry.changes).map(([key, val]) => (
                          <div key={key} className="flex gap-2 py-0.5">
                            <span className="font-medium text-gray-500 w-24 flex-shrink-0">{key}:</span>
                            <span className="text-gray-400 line-through mr-1">{String((val as any).old ?? '')}</span>
                            <span className="text-emerald-600 font-medium">→ {String((val as any).new ?? '')}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {entry.action === 'transfer' && (
                      <div className="mt-1 text-xs text-purple-600 bg-purple-50 rounded-lg p-2 border border-purple-100">
                        Traslado registrado
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
