'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
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
        <Link href="/items" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={20} /></Link>
        <h1 className="text-2xl font-bold text-gray-800">Editar Ítem #{form.item}</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[{label:'ITEM',key:'item',type:'number'},{label:'COD. INV',key:'cod_inv'},{label:'COD. ESBYE',key:'cod_esbye'},
            {label:'CUENTA',key:'cuenta'},{label:'CANT',key:'cant',type:'number'},{label:'MARCA',key:'marca'},
            {label:'MODELO',key:'modelo'},{label:'SERIE',key:'serie'},{label:'FECHA ADQ.',key:'fecha_adquisicion',type:'date'},
            {label:'ESTADO',key:'estado'},{label:'VALOR ($)',key:'valor',type:'number',step:'0.01'},{label:'UBICACIÓN',key:'ubicacion'},
            {label:'No. ACTA',key:'no_acta'},{label:'MES',key:'mes'}
          ].map(f => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
              <input type={f.type || 'text'} value={form[f.key] ?? ''} step={f.step}
                onChange={(e) => update(f.key, e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          ))}
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">DESCRIPCIÓN</label>
          <textarea value={form.descripcion || ''} onChange={(e) => update('descripcion', e.target.value)} rows={3}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">OBSERVACIONES</label>
          <textarea value={form.observaciones || ''} onChange={(e) => update('observaciones', e.target.value)} rows={2}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>

        <div className="mt-6 flex gap-3">
          <button type="submit" disabled={saving} className="flex items-center gap-2 bg-sky-600 text-white px-6 py-2.5 rounded-lg hover:bg-sky-700 disabled:opacity-50">
            <Save size={16} /> {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
          <Link href="/items" className="px-6 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50">Cancelar</Link>
        </div>
      </form>
    </div>
  )
}
