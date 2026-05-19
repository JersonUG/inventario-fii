'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeftRight, Save, Search } from 'lucide-react'
import toast from 'react-hot-toast'

function TransferPageContent() {
  const searchParams = useSearchParams()
  const preselectedIds = searchParams.get('ids')?.split(',').filter(Boolean) || []

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
      let query = supabase.from('items').select('*').eq('is_active', true).order('item', { ascending: true }).limit(200)
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

    const { error } = await supabase.from('items').update(updates).in('id', selected)
    if (error) { toast.error('Error en traslado'); setSaving(false) }
    else {
      toast.success(`Traslado realizado: ${selected.length} ítem(s) actualizado(s)`)
      setSelected([]); setNewLocation(''); setNewPropietario(''); setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6"><ArrowLeftRight className="text-blue-900" size={24} /><h1 className="text-2xl font-bold text-gray-800">Traslados</h1></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar ítems..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div className="overflow-y-auto max-h-[500px] space-y-1">
            {items.map((item: any) => (
              <label key={item.id} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                selected.includes(item.id) ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'
              }`}>
                <input type="checkbox" checked={selected.includes(item.id)} onChange={() => toggleSelect(item.id)} className="rounded" />
                <span className="text-xs font-mono text-gray-500 w-16">{item.item}</span>
                <span className="text-sm flex-1 truncate">{item.descripcion}</span>
                <span className="text-xs text-gray-400 w-24 truncate">{item.ubicacion || '-'}</span>
              </label>
            ))}
            {!loading && items.length === 0 && <p className="text-center text-gray-400 py-8">Sin resultados</p>}
          </div>
          <p className="text-sm text-gray-500 mt-2">{selected.length} seleccionado(s)</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Configurar Traslado</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
              <div className="flex gap-2">
                <button onClick={() => setTransferType('ubicacion')} className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${
                  transferType === 'ubicacion' ? 'bg-blue-900 text-white border-blue-900' : 'border-gray-200 hover:bg-gray-50'
                }`}>Ubicación</button>
                <button onClick={() => setTransferType('propiedad')} className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${
                  transferType === 'propiedad' ? 'bg-blue-900 text-white border-blue-900' : 'border-gray-200 hover:bg-gray-50'
                }`}>Propiedad</button>
              </div>
            </div>
            {transferType === 'ubicacion' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nueva ubicación</label>
                <input type="text" value={newLocation} onChange={(e) => setNewLocation(e.target.value)} placeholder="Ej: Edificio A, Piso 2"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-500">Nuevo responsable:</p>
                {['Laboratorio', 'Aula', 'Docente'].map(t => (
                  <label key={t} className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input type="radio" name="propietarioType" value={t} onChange={() => setNewPropietario(t)} className="accent-blue-900" />
                    <span className="text-sm">{t}</span>
                  </label>
                ))}
                <input type="text" value={newPropietario} onChange={(e) => setNewPropietario(e.target.value)} placeholder="Nombre del docente / aula"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none mt-2" />
              </div>
            )}
            <button onClick={handleTransfer} disabled={saving || selected.length === 0}
              className="w-full flex items-center justify-center gap-2 bg-sky-600 text-white py-2.5 rounded-lg hover:bg-sky-700 disabled:opacity-50 text-sm">
              <Save size={16} /> {saving ? 'Procesando...' : `Trasladar ${selected.length} ítem(s)`}
            </button>
          </div>
        </div>
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
