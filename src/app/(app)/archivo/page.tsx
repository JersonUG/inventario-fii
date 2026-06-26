'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRealtime } from '@/hooks/useRealtime'
import { useAuth } from '@/contexts/AuthContext'
import { Folder, FileText, Upload, Plus, ChevronDown, ChevronRight, Download, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface ActaRecord {
  id: string
  name: string
  fecha: string
  file_url: string
  file_type: string
}

interface ArchivoFolder {
  id: string
  year: string
}

export default function ArchivoPage() {
  const { profile } = useAuth()
  const canEdit = profile?.rol === 'ADMINISTRADOR' || profile?.rol === 'OPERADOR'
  const [actas, setActas] = useState<ActaRecord[]>([])
  const [folders, setFolders] = useState<ArchivoFolder[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedYear, setExpandedYear] = useState<string | null>(null)
  const [newFolderYear, setNewFolderYear] = useState('')
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [uploadingYear, setUploadingYear] = useState<string | null>(null)
  const [downloadingZip, setDownloadingZip] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadActas = async () => {
    const { data } = await supabase.from('actas').select('id,name,fecha,file_url,file_type').order('fecha', { ascending: false })
    setActas(data || [])
  }

  const loadFolders = async () => {
    const { data } = await supabase.from('archivo_folders').select('*').order('year', { ascending: false })
    setFolders(data || [])
  }

  useRealtime('actas', loadActas)
  useRealtime('archivo_folders', loadFolders)

  useEffect(() => {
    Promise.all([loadActas(), loadFolders()]).finally(() => setLoading(false))
  }, [])

  const actaYears = [...new Set(actas.map(a => a.fecha?.substring(0, 4)).filter(Boolean))]
  const folderYears = folders.map(f => f.year)
  const displayYears = [...new Set([...actaYears, ...folderYears])].sort((a, b) => b.localeCompare(a))

  const getActasByYear = (year: string) => actas.filter(a => a.fecha?.startsWith(year))

  const addNewFolder = async () => {
    const y = newFolderYear.trim()
    if (!y || !/^\d{4}$/.test(y)) { toast.error('Ingresa un año válido (ej: 2027)'); return }
    if (displayYears.includes(y)) { toast.error('Esa carpeta ya existe'); return }

    const { error } = await supabase.from('archivo_folders').insert([{ year: y }]).select().single()
    if (error) { toast.error('Error al crear carpeta: ' + error.message); return }

    setNewFolderYear('')
    setShowNewFolder(false)
    toast.success(`Carpeta ${y} creada`)
  }

  const deleteFolder = async (year: string) => {
    if (!confirm(`¿Eliminar carpeta ${year}? Los documentos permanecerán en el archivo.`)) return
    const { error } = await supabase.from('archivo_folders').delete().eq('year', year)
    if (error) { toast.error('Error al eliminar carpeta: ' + error.message); return }
    toast.success(`Carpeta ${year} eliminada`)
  }

  const handleDeleteDocument = async (acta: ActaRecord) => {
    if (!confirm(`¿Eliminar "${acta.name}"? También se borrará del almacenamiento.`)) return

    const storagePath = acta.file_url?.split('/public/actas/')[1]
    if (storagePath) {
      const { error: storageError } = await supabase.storage.from('actas').remove([storagePath])
      if (storageError) { toast.error('Error al borrar archivo: ' + storageError.message); return }
    }

    const { error } = await supabase.from('actas').delete().eq('id', acta.id)
    if (error) { toast.error('Error al eliminar: ' + error.message); return }
    toast.success('Documento eliminado')
  }

  const handleDownloadZip = async (year: string) => {
    setDownloadingZip(year)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) { toast.error('Sesión expirada'); setDownloadingZip(null); return }

      const res = await fetch('/api/export/archivo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ year }),
      })

      if (!res.ok) { const err = await res.json(); toast.error(err.error || 'Error'); setDownloadingZip(null); return }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = `Archivo_${year}.zip`
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      toast.success('ZIP descargado')
    } catch (e: any) { toast.error('Error: ' + e.message) }
    setDownloadingZip(null)
  }

  const handleUpload = async (year: string, file: File) => {
    if (!file) return
    setUploadingYear(year)
    const path = `archivo/${year}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`

    const { error: uploadError } = await supabase.storage.from('actas').upload(path, file)
    if (uploadError) { toast.error('Error al subir archivo: ' + uploadError.message); setUploadingYear(null); return }

    const { data: { publicUrl } } = supabase.storage.from('actas').getPublicUrl(path)

    const { error: insertError } = await supabase.from('actas').insert([{
      name: `[ARCHIVO] ${file.name.replace(/\.[^/.]+$/, '')}`,
      fecha: `${year}-01-01`,
      file_url: publicUrl,
      file_type: file.type || 'application/pdf',
      notas: `Subido al archivo histórico - Carpeta ${year}`,
    }])

    if (insertError) { toast.error('Error al registrar: ' + insertError.message); setUploadingYear(null); return }

    toast.success('PDF subido al archivo histórico')
    setUploadingYear(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Archivo Histórico de Actas</h1>
          <p className="text-sm text-gray-500 mt-0.5">Documentos organizados por año</p>
        </div>
        {canEdit && (
          <button onClick={() => setShowNewFolder(!showNewFolder)} className="btn-secondary">
            <Plus size={16} /> Añadir Nueva Carpeta
          </button>
        )}
      </div>

      {showNewFolder && (
        <div className="card p-4 mb-6 flex items-center gap-3">
          <input type="text" value={newFolderYear} onChange={e => setNewFolderYear(e.target.value)}
            placeholder="Ej: 2027" maxLength={4}
            className="input-field w-40 font-mono text-center" />
          <button onClick={addNewFolder} className="btn-primary">Crear Carpeta</button>
          <button onClick={() => { setShowNewFolder(false); setNewFolderYear('') }} className="btn-secondary">Cancelar</button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-gray-500">Cargando archivo...</div>
      ) : displayYears.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Folder className="mx-auto text-gray-300 mb-3" size={48} />
          <p className="font-medium">Sin documentos archivados</p>
          <p className="text-sm mt-1">Las actas registradas aparecerán organizadas por año</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {displayYears.map(year => {
            const yearActas = getActasByYear(year)
            const isCustomFolder = folderYears.includes(year) && !actaYears.includes(year)
            return (
              <div key={year} className="card overflow-hidden group">
                <button onClick={() => setExpandedYear(expandedYear === year ? null : year)}
                  className="w-full p-5 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left">
                  <div className="p-3 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl">
                    <Folder size={28} className="text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-gray-800">{year}</h3>
                    <p className="text-sm text-gray-500">{yearActas.length} documento(s)</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleDownloadZip(year) }} disabled={downloadingZip === year}
                    className="p-1.5 hover:bg-gray-200 rounded text-gray-400 hover:text-fii opacity-0 group-hover:opacity-100 transition-all mr-1 shrink-0" title="Descargar carpeta completa (ZIP)">
                    <Download size={16} />
                  </button>
                  {expandedYear === year ? <ChevronDown size={20} className="text-gray-400 shrink-0" /> : <ChevronRight size={20} className="text-gray-400 shrink-0" />}
                </button>

                {expandedYear === year && (
                  <div className="border-t border-gray-100">
                    {canEdit && isCustomFolder && (
                      <div className="px-3 pt-3">
                        <button onClick={() => deleteFolder(year)}
                          className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors">
                          <Trash2 size={12} /> Eliminar carpeta
                        </button>
                      </div>
                    )}
                    <div className="p-3 max-h-80 overflow-y-auto space-y-2">
                      {yearActas.length === 0 && (
                        <p className="text-sm text-gray-400 text-center py-4">Sin documentos en este año</p>
                      )}
                      {yearActas.map(acta => (
                        <div key={acta.id} className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group">
                          <FileText size={16} className="text-gray-400 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-700 truncate">{acta.name}</p>
                            <p className="text-xs text-gray-400">{acta.fecha}</p>
                          </div>
                          {acta.file_url && (
                            <a href={acta.file_url} target="_blank" rel="noopener noreferrer"
                              className="p-1.5 hover:bg-white rounded text-fii opacity-0 group-hover:opacity-100 transition-all" title="Descargar PDF">
                              <Download size={14} />
                            </a>
                          )}
                          {canEdit && (
                            <button onClick={() => handleDeleteDocument(acta)}
                              className="p-1.5 hover:bg-white rounded text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all" title="Eliminar documento">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    {canEdit && (
                      <div className="border-t border-gray-100 p-3">
                        <input type="file" accept=".pdf" ref={fileInputRef} className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleUpload(year, file)
                            e.target.value = ''
                          }} />
                        <button onClick={() => fileInputRef.current?.click()} disabled={uploadingYear === year}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-fii hover:text-fii hover:bg-fii/5 transition-all disabled:opacity-50">
                          <Upload size={14} /> {uploadingYear === year ? 'Subiendo...' : 'Subir PDF'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
