'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import AutocompleteInput from '@/components/AutocompleteInput'
import toast from 'react-hot-toast'

export default function EditItemPage() {
  const params = useParams()
  const router = useRouter()
  const [form, setForm] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('items').select('*').eq('id', params.id).single().then(({ data, error }) => {
      if (error || !data) { toast.error('Ítem no encontrado'); router.push('/items') }
      else { setForm(data); setLoading(false) }
    })
  }, [params.id, router])

  const update = (field: string, value: any) => setForm((prev: any) => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const user = (await supabase.auth.getUser()).data.user
    if (!user) { toast.error('Debes iniciar sesión'); setSaving(false); return }

    const { error } = await supabase.from('items').update({ ...form, valor: form.valor ? parseFloat(form.valor) : null }).eq('id', params.id)
    if (error) { toast.error('Error al actualizar'); setSaving(false) }
    else { toast.success('Ítem actualizado'); router.push('/items') }
  }

  if (loading) return <div className="text-center py-12 text-gray-500">Cargando...</div>

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-fii to-fii-light rounded-xl flex items-center justify-center shadow-lg shadow-fii/20">
          <ArrowLeft className="text-white" size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Editar Ítem #{form.item}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Modificar datos del activo patrimonial</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[{label:'ITEM',key:'item',type:'number'},{label:'COD. INV',key:'cod_inv'},{label:'COD. ESBYE',key:'cod_esbye'},
            {label:'CUENTA',key:'cuenta'},{label:'CANT',key:'cant',type:'number'},{label:'MARCA',key:'marca',auto:true},
            {label:'MODELO',key:'modelo',auto:true},{label:'SERIE',key:'serie'},{label:'FECHA ADQ.',key:'fecha_adquisicion',type:'date'},
            {label:'ESTADO',key:'estado'},{label:'VALOR ($)',key:'valor',type:'number',step:'0.01'},{label:'UBICACIÓN',key:'ubicacion',auto:true},
            {label:'No. ACTA',key:'no_acta'},{label:'MES',key:'mes'}
          ].map(f => (
            <div key={f.key}>
              {f.auto ? (
                <AutocompleteInput label={f.label} value={form[f.key] ?? ''} onChange={(v) => update(f.key, v)} column={f.key} />
              ) : (
                <>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                  <input type={f.type || 'text'} value={form[f.key] ?? ''} step={f.step}
                    onChange={(e) => update(f.key, e.target.value)}
                    className="input-field" />
                </>
              )}
            </div>
          ))}
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">DESCRIPCIÓN</label>
          <textarea value={form.descripcion || ''} onChange={(e) => update('descripcion', e.target.value)} rows={3}
            className="input-field" />
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">OBSERVACIONES</label>
          <textarea value={form.observaciones || ''} onChange={(e) => update('observaciones', e.target.value)} rows={2}
            className="input-field" />
        </div>

        <div className="mt-6 flex gap-3">
          <button type="submit" disabled={saving} className="btn-primary !px-6 !py-2.5">
            <Save size={16} /> {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
          <Link href="/items" className="btn-secondary">Cancelar</Link>
        </div>
      </form>
    </div>
  )
}
