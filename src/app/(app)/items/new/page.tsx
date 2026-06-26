'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import AutocompleteInput from '@/components/AutocompleteInput'
import { CLASIFICACION_OPTIONS } from '@/types/database'
import toast from 'react-hot-toast'

export default function NewItemPage() {
  const { profile } = useAuth()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [loadingNext, setLoadingNext] = useState(true)
  const [form, setForm] = useState({
    item: 0, cod_inv: '', cod_esbye: '', cuenta: '', cant: 1, descripcion: '',
    marca: '', modelo: '', serie: '', fecha_adquisicion: '', estado: '',
    valor: '', ubicacion: '', observaciones: '', no_acta: '', servidor_asignado: '',
    clasificacion_activo: 'ACTIVO', responsable_actual: '', ubicacion_especifica: ''
  })

  useEffect(() => {
    supabase.from('items').select('item').order('item', { ascending: false }).limit(1).maybeSingle().then(({ data, error }) => {
      const maxItem = (!error && data?.item) ? data.item : 0
      setForm(prev => ({ ...prev, item: maxItem + 1 }))
      setLoadingNext(false)
    })
  }, [])

  const update = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const user = (await supabase.auth.getUser()).data.user
    if (!user) { toast.error('Debes iniciar sesión'); setSaving(false); return }

    const { data: newItem, error } = await supabase.from('items').insert([{
      ...form, valor: form.valor ? parseFloat(form.valor) : null,
      fecha_adquisicion: form.fecha_adquisicion || null, cant: parseInt(form.cant.toString()) || 1
    }]).select('id,item').single()

    if (error) { toast.error('Error: ' + error.message); setSaving(false); return }

    await supabase.from('item_history').insert([{
      item_id: newItem.id, action: 'create', changes: { item: { new: newItem.item }, descripcion: { new: form.descripcion } },
      user_id: user.id, user_name: user.email || 'Sistema',
    }])

    toast.success('Ítem creado'); router.push('/items')
  }

  if (!profile) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fii"></div></div>
  if (profile.rol === 'CONSULTA') { router.replace('/items'); return null }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button type="button" onClick={() => router.back()} className="w-10 h-10 bg-gradient-to-br from-fii to-fii-light rounded-xl flex items-center justify-center shadow-lg shadow-fii/20 hover:shadow-xl transition-shadow cursor-pointer">
          <ArrowLeft className="text-white" size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Nuevo Ítem</h1>
          <p className="text-sm text-gray-500 mt-0.5">Registrar un nuevo activo patrimonial</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ITEM</label>
            <div className="relative">
              <input type="number" value={form.item} readOnly
                className="input-field font-mono bg-gray-50 text-gray-600 cursor-not-allowed border-gray-200" tabIndex={-1} />
              {loadingNext && (
                <div className="absolute inset-0 bg-white/80 rounded-lg flex items-center justify-center">
                  <span className="text-xs text-gray-400 animate-pulse">Calculando...</span>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">Número asignado automáticamente</p>
          </div>
          {[{label:'COD. INV',key:'cod_inv'},{label:'COD. ESBYE',key:'cod_esbye'},
            {label:'CUENTA',key:'cuenta'},{label:'CANT',key:'cant',type:'number'},{label:'MARCA',key:'marca',auto:true},
            {label:'MODELO',key:'modelo',auto:true},{label:'SERIE',key:'serie'},{label:'FECHA ADQ.',key:'fecha_adquisicion',type:'date'},
            {label:'ESTADO',key:'estado'},{label:'CLASIFICACIÓN',key:'clasificacion_activo',select:true},{label:'VALOR ($)',key:'valor',type:'number',step:'0.01'},{label:'UBICACIÓN',key:'ubicacion',auto:true},
            {label:'No. ACTA',key:'no_acta'},{label:'SERVIDOR ASIGNADO',key:'servidor_asignado'}
          ].map(f => (
            <div key={f.key}>
              {f.auto ? (
                <AutocompleteInput label={f.label} value={form[f.key as keyof typeof form] as string} onChange={(v) => update(f.key, v)} column={f.key} />
              ) : f.select ? (
                <>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                  <select value={form[f.key as keyof typeof form] as string} onChange={(e) => update(f.key, e.target.value)} className="input-field">
                    {CLASIFICACION_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </>
              ) : (
                <>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                  <input type={f.type || 'text'} value={form[f.key as keyof typeof form] as string} step={f.step}
                    onChange={(e) => update(f.key, f.type === 'number' && f.step ? e.target.value : e.target.value)}
                    className="input-field" />
                </>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">DESCRIPCIÓN</label>
          <textarea value={form.descripcion} onChange={(e) => update('descripcion', e.target.value)} rows={3}
            className="input-field" />
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">OBSERVACIONES</label>
          <textarea value={form.observaciones} onChange={(e) => update('observaciones', e.target.value)} rows={2}
            className="input-field" />
        </div>

        <div className="mt-6 flex gap-3">
          <button type="submit" disabled={saving || loadingNext} className="btn-primary !px-6 !py-2.5">
            <Save size={16} /> {saving ? 'Guardando...' : 'Guardar'}
          </button>
          <Link href="/items" className="btn-secondary">Cancelar</Link>
        </div>
      </form>
    </div>
  )
}
