export interface Item {
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
  ubicacion: string
  observaciones: string
  no_acta: string
  servidor_asignado: string
  is_active: boolean
  is_missing: boolean
  clasificacion_activo: string
  responsable_actual: string
  ubicacion_especifica: string
  created_at: string
  updated_at: string
}

export type ClasificacionActivo = 'ACTIVO' | 'DADO_DE_BAJA' | 'NO_LOCALIZADO' | 'PROXIMO_A_BAJA'

export const CLASIFICACION_OPTIONS: { value: ClasificacionActivo; label: string; color: string }[] = [
  { value: 'ACTIVO', label: 'Activo', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'DADO_DE_BAJA', label: 'Dado de Baja', color: 'bg-red-100 text-red-800' },
  { value: 'NO_LOCALIZADO', label: 'No Localizado', color: 'bg-orange-100 text-orange-800' },
  { value: 'PROXIMO_A_BAJA', label: 'Próximo a Baja', color: 'bg-amber-100 text-amber-800' },
]

export interface ItemHistory {
  id: string
  item_id: string
  action: string
  changes: Record<string, any>
  user_id: string
  user_name: string
  created_at: string
}

export interface Acta {
  id: string
  name: string
  fecha: string
  responsable: string
  file_url: string
  file_type: string
  notas: string
  created_at: string
}

export interface ActaItem {
  id: string
  acta_id: string
  item_id: string
  created_at: string
  updated_at: string
}

export interface ActaHistory {
  id: string
  acta_id: string
  action: string
  changes: Record<string, any>
  user_id: string
  user_name: string
  created_at: string
}

export interface TransferLog {
  id: string
  item_id: string
  from_value: string
  to_value: string
  transfer_type: string
  acta_origen_id: string | null
  acta_destino_id: string | null
  user_id: string
  user_name: string
  created_at: string
}
