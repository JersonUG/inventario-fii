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
  mes: string
  is_active: boolean
  created_at: string
  updated_at: string
}

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
