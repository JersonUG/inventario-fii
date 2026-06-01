'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Save, Upload, FileText, Download } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'

export default function NewActaPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', fecha: new Date().toISOString().split('T')[0], responsable: '', notas: '' })
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const update = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }))

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      setFile(f)
      if (f.type.startsWith('image/')) setPreview(URL.createObjectURL(f))
      else setPreview(null)
    }
  }

  const generatePDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text('ACTA DE INVENTARIO', 105, 20, { align: 'center' })
    doc.setFontSize(11)
    doc.text('Facultad de Ingeniería Industrial', 105, 30, { align: 'center' })
    doc.text(`Fecha: ${new Date(form.fecha).toLocaleDateString('es-ES')}`, 20, 45)
    doc.text(`Responsable: ${form.responsable || '________________'}`, 20, 55)
    doc.setFontSize(12)
    doc.text('Acta: ' + form.name.toUpperCase(), 20, 70)
    doc.setFontSize(10)
    doc.text('Este documento certifica la revisión y verificación de los activos', 20, 85)
    doc.text('pertenecientes a la Facultad de Ingeniería Industrial.', 20, 93)
    if (form.notas) doc.text('Notas: ' + form.notas, 20, 108)
    doc.save(`Acta_${form.name.replace(/\s+/g, '_')}.pdf`)
    toast.success('PDF generado exitosamente')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const user = (await supabase.auth.getUser()).data.user
    if (!user) { toast.error('Debes iniciar sesión'); setSaving(false); return }

    let fileUrl = ''
    let fileType = ''

    if (file) {
      const ext = file.name.split('.').pop()
      const path = `actas/${Date.now()}_${form.name.replace(/\s+/g, '_')}.${ext}`
      const { error: uploadError } = await supabase.storage.from('actas').upload(path, file)
      if (uploadError) { toast.error('Error al subir archivo'); setSaving(false); return }
      const { data: { publicUrl } } = supabase.storage.from('actas').getPublicUrl(path)
      fileUrl = publicUrl
      fileType = file.type
    }

    const { error } = await supabase.from('actas').insert([{ ...form, file_url: fileUrl, file_type: fileType }])
    if (error) { toast.error('Error al guardar acta'); setSaving(false) }
    else { toast.success('Acta registrada'); router.push('/actas') }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-fii to-fii-light rounded-xl flex items-center justify-center shadow-lg shadow-fii/20">
            <ArrowLeft className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Nueva Acta</h1>
            <p className="text-sm text-gray-500 mt-0.5">Crear y digitalizar un acta de inventario</p>
          </div>
        </div>
        <button onClick={generatePDF} className="btn-primary !bg-gradient-to-r !from-fii !to-fii-light">
          <Download size={16} /> Generar PDF
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
            <span className="w-1 h-5 bg-fii rounded-full inline-block" />
            Datos del Acta
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Acta</label>
            <input type="text" value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Ej: ACTA #001 - LABORATORIO"
              className="input-field" />
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
          <button type="submit" disabled={saving} className="btn-primary !px-6 !py-2.5">
            <Save size={16} /> {saving ? 'Guardando...' : 'Guardar Acta'}
          </button>
        </div>

        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <span className="w-1 h-5 bg-fii rounded-full inline-block" />
            Archivo Digitalizado
          </h2>
          <p className="text-sm text-gray-500">Sube el PDF o imagen del acta escaneada (opcional)</p>
          <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-violet-400 hover:bg-violet-50/50 transition-all duration-200">
            <Upload className="mx-auto text-gray-400 mb-2" size={32} />
            <p className="text-sm text-gray-500 font-medium">{file ? file.name : 'Haz clic para subir un archivo'}</p>
            <p className="text-xs text-gray-400 mt-1">PDF o JPG — Máx 10MB</p>
            <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} className="hidden" />
          </div>
          {preview && <img src={preview} alt="Preview" className="w-full h-48 object-cover rounded-xl border border-gray-200 shadow-sm" />}
          {file && file.type === 'application/pdf' && (
            <div className="flex items-center gap-3 p-3 bg-violet-50 rounded-xl border border-violet-100">
              <div className="p-2 bg-violet-100 rounded-lg"><FileText size={20} className="text-violet-600" /></div>
              <span className="text-sm font-medium text-violet-700">{file.name}</span>
            </div>
          )}
        </div>
      </form>
    </div>
  )
}
