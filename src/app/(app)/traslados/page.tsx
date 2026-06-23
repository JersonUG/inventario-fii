'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeftRight, Save, Search } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

function TransferPageContent() {
  const { profile } = useAuth()
  const searchParams = useSearchParams()
  const preselectedIds = searchParams.get('ids')?.split(',').filter(Boolean) || []
  const canEdit = profile?.rol === 'ADMINISTRADOR' || profile?.rol === 'OPERADOR'

  const [items, setItems] = useState<any[]>([])
  const [selected, setSelected] = useState<string[]>(preselectedIds)
  const [searchTerm, setSearchTerm] = useState('')
  const [transferType, setTransferType] = useState<'ubicacion' | 'propiedad'>('ubicacion')
  const [newLocation, setNewLocation] = useState('')
  const [newPropietario, setNewPropietario] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      let query = supabase.from('items').select('*').eq('clasificacion_activo', 'ACTIVO').order('item', { ascending: true }).limit(200)
      if (searchTerm) query = query.or(`cod_inv.ilike.%${searchTerm}%,descripcion.ilike.%${searchTerm}%,serie.ilike.%${searchTerm}%`)
      const { data } = await query
      if (data) setItems(data)
      setLoading(false)
    }
    load()
  }, [searchTerm])

  const toggleSelect = (id: string) => setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])

  const handleTransfer = async () => {
    if (selected.length === 0) { toast.error('Selecciona al menos un ítem'); return }
    let updates: Record<string, any> = {}
    if (transferType === 'ubicacion') {
      if (!newLocation) { toast.error('Indica la nueva ubicación'); return }
      updates.ubicacion = newLocation
    } else {
      if (!newPropietario) { toast.error('Indica el nuevo docente/aula/lab'); return }
      updates.ubicacion = newPropietario
    }

    setSaving(true)
    const user = (await supabase.auth.getUser()).data.user
    if (!user) { toast.error('Debes iniciar sesión'); setSaving(false); return }

    const selectedItems = items.filter(i => selected.includes(i.id))

    const { error } = await supabase.from('items').update(updates).in('id', selected)
    if (error) { toast.error('Error en traslado'); setSaving(false); return }

    const historyEntries = selectedItems.map(item => ({
      item_id: item.id,
      action: 'transfer',
      changes: { ubicacion: { old: item.ubicacion, new: updates.ubicacion } },
      user_id: user.id,
      user_name: user.email || 'Sistema',
    }))
    await supabase.from('item_history').insert(historyEntries)

    await supabase.from('transfer_log').insert(
      selectedItems.map(item => ({
        item_id: item.id, user_id: user.id, user_name: user.email || 'Sistema',
        transfer_type: transferType,
        from_value: item.ubicacion || '', to_value: updates.ubicacion || '',
      }))
    )

    toast.success(`Traslado realizado: ${selected.length} ítem(s) actualizado(s)`)
    setSelected([]); setNewLocation(''); setNewPropietario(''); setSaving(false)
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-fii to-fii-light rounded-xl flex items-center justify-center shadow-lg shadow-fii/20">
          <ArrowLeftRight className="text-white" size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Traslados</h1>
          <p className="text-sm text-gray-500 mt-0.5">Transferencia masiva de ubicación o responsable</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar ítems por código, descripción o serie..."
              className="input-field pl-9" />
          </div>
          <div className="overflow-y-auto max-h-[500px] space-y-1">
            {items.map((item: any) => (
              <label key={item.id} className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all duration-200 ${
                selected.includes(item.id) ? 'bg-emerald-50 border border-emerald-200 shadow-sm' : 'hover:bg-gray-50 border border-transparent'
              }`}>
                <input type="checkbox" checked={selected.includes(item.id)} onChange={() => toggleSelect(item.id)} className="rounded accent-emerald-600" />
                <span className="text-xs font-mono text-gray-500 w-16">{item.item}</span>
                <span className="text-sm flex-1 truncate font-medium text-gray-800">{item.descripcion}</span>
                <span className="text-xs text-gray-400 w-24 truncate">{item.ubicacion || '-'}</span>
              </label>
            ))}
            {!loading && items.length === 0 && <p className="text-center text-gray-400 py-8">Sin resultados</p>}
          </div>
          <p className="text-sm text-gray-500 mt-3 font-medium">{selected.length} ítem(s) seleccionado(s)</p>
        </div>

        {canEdit ? (
        <div className="card p-6">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-fii rounded-full inline-block" />
            Configurar Traslado
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de traslado</label>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setTransferType('ubicacion')} className={`py-2.5 text-sm font-medium rounded-xl border transition-all duration-200 ${
                  transferType === 'ubicacion' ? 'bg-gradient-to-r from-fii to-fii-light text-white border-fii shadow-md' : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}>Ubicación</button>
                <button onClick={() => setTransferType('propiedad')} className={`py-2.5 text-sm font-medium rounded-xl border transition-all duration-200 ${
                  transferType === 'propiedad' ? 'bg-gradient-to-r from-fii to-fii-light text-white border-fii shadow-md' : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}>Propiedad</button>
              </div>
            </div>
            {transferType === 'ubicacion' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nueva ubicación</label>
                <input type="text" value={newLocation} onChange={(e) => setNewLocation(e.target.value)} placeholder="Ej: Edificio A, Piso 2"
                  className="input-field" />
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-500 font-medium">Nuevo responsable:</p>
                {['Laboratorio', 'Aula', 'Docente'].map(t => (
                  <label key={t} className="flex items-center gap-2 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                    <input type="radio" name="propietarioType" value={t} onChange={() => setNewPropietario(t)} className="accent-emerald-600" />
                    <span className="text-sm font-medium text-gray-700">{t}</span>
                  </label>
                ))}
                <input type="text" value={newPropietario} onChange={(e) => setNewPropietario(e.target.value)} placeholder="Nombre del docente / aula"
                  className="input-field mt-2" />
              </div>
            )}
            <button onClick={handleTransfer} disabled={saving || selected.length === 0}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-fii to-fii-light text-white py-2.5 rounded-xl hover:from-fii-dark hover:to-fii disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md hover:shadow-lg transition-all duration-200">
              <Save size={16} /> {saving ? 'Procesando...' : `Trasladar ${selected.length} ítem(s)`}
            </button>
          </div>
        </div>
        ) : (
          <div className="card p-6 text-center text-gray-500">
            <p className="text-sm font-medium">Modo solo lectura — No puedes realizar traslados</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function TransferPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-gray-500">Cargando...</div>}>
      <TransferPageContent />
    </Suspense>
  )
}
