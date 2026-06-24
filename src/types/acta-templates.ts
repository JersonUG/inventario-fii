export type ActaTipo = 'ENTREGA_ADMIN' | 'ASIGNACION_USUARIO' | 'RECEPCION_BODEGA' | 'CONSTATACION_FISICA' | 'ENTREGA_RECEPCION_CONSTATACION'

export const ACTA_TIPOS: { value: ActaTipo; label: string }[] = [
  { value: 'ENTREGA_ADMIN', label: 'Entrega a Administración' },
  { value: 'ASIGNACION_USUARIO', label: 'Asignación a Usuario Final' },
  { value: 'RECEPCION_BODEGA', label: 'Recepción de Bienes (Bodega)' },
  { value: 'CONSTATACION_FISICA', label: 'Constatación Física' },
  { value: 'ENTREGA_RECEPCION_CONSTATACION', label: 'Entrega-Recepción y Constatación' },
]

export interface ActaCampo {
  key: string
  label: string
  type?: 'text'
  required?: boolean
}

const FECHA_CAMPOS: ActaCampo[] = [
  { key: 'NUMERO_ACTA', label: 'Nº de Acta', required: true },
  { key: 'FECHA_DIA', label: 'Día', required: true },
  { key: 'FECHA_MES', label: 'Mes', required: true },
  { key: 'FECHA_ANIO', label: 'Año', required: true },
]

const ADMIN_CAMPOS: ActaCampo[] = [
  { key: 'NOMBRE_ADMINISTRADOR', label: 'Nombre del Administrador', required: true },
  { key: 'CARGO_ADMINISTRADOR', label: 'Cargo del Administrador', required: true },
]

const USUARIO_CAMPOS: ActaCampo[] = [
  { key: 'NOMBRE_USUARIO_FINAL', label: 'Nombre del Usuario Final', required: true },
  { key: 'CARGO_USUARIO_FINAL', label: 'Cargo del Usuario Final', required: true },
]

const COMUN_CAMPOS: ActaCampo[] = [
  { key: 'DOCUMENTO_REFERENCIA', label: 'Documento de Referencia' },
  { key: 'AUTORIDAD_DOCUMENTO', label: 'Autoridad del Documento' },
  { key: 'UBICACION_BIENES', label: 'Ubicación de los Bienes' },
]

export interface ActaTemplateDef {
  tipo: ActaTipo
  label: string
  campos: ActaCampo[]
}

export const ACTA_TEMPLATES: Record<ActaTipo, ActaTemplateDef> = {
  ENTREGA_ADMIN: {
    tipo: 'ENTREGA_ADMIN',
    label: 'Entrega a Administración',
    campos: [
      ...FECHA_CAMPOS,
      ...ADMIN_CAMPOS,
      ...USUARIO_CAMPOS,
      { key: 'CARGO_USUARIO', label: 'Cargo del Usuario' },
      ...COMUN_CAMPOS,
      { key: 'TIPO_RENUNCIA', label: 'Tipo de Renuncia' },
      { key: 'FECHA_EFECTIVA', label: 'Fecha Efectiva' },
    ],
  },
  ASIGNACION_USUARIO: {
    tipo: 'ASIGNACION_USUARIO',
    label: 'Asignación a Usuario Final',
    campos: [
      ...FECHA_CAMPOS,
      ...ADMIN_CAMPOS,
      ...USUARIO_CAMPOS,
      { key: 'CARGO_USUARIO', label: 'Cargo del Usuario' },
      ...COMUN_CAMPOS,
      { key: 'FECHA_EFECTIVA', label: 'Fecha Efectiva' },
    ],
  },
  RECEPCION_BODEGA: {
    tipo: 'RECEPCION_BODEGA',
    label: 'Recepción de Bienes (Bodega)',
    campos: [
      ...FECHA_CAMPOS,
      ...ADMIN_CAMPOS,
      { key: 'NOMBRE_ENTREGA', label: 'Nombre de quien Entrega', required: true },
      { key: 'CARGO_ENTREGA', label: 'Cargo de quien Entrega', required: true },
      { key: 'DOCUMENTO_REFERENCIA', label: 'Documento de Referencia' },
      { key: 'AUTORIDAD_DOCUMENTO', label: 'Autoridad del Documento' },
      { key: 'AREA_ORIGEN', label: 'Área de Origen' },
      { key: 'UBICACION_BIENES', label: 'Ubicación de los Bienes' },
    ],
  },
  CONSTATACION_FISICA: {
    tipo: 'CONSTATACION_FISICA',
    label: 'Constatación Física',
    campos: [
      ...FECHA_CAMPOS,
      ...ADMIN_CAMPOS,
      ...USUARIO_CAMPOS,
      { key: 'AUTORIDAD_DOCUMENTO', label: 'Autoridad del Documento' },
      { key: 'UBICACION_BIENES', label: 'Ubicación de los Bienes' },
    ],
  },
  ENTREGA_RECEPCION_CONSTATACION: {
    tipo: 'ENTREGA_RECEPCION_CONSTATACION',
    label: 'Entrega-Recepción y Constatación',
    campos: [
      ...FECHA_CAMPOS,
      ...ADMIN_CAMPOS,
      ...USUARIO_CAMPOS,
      { key: 'CARGO_USUARIO', label: 'Cargo del Usuario' },
      ...COMUN_CAMPOS,
    ],
  },
}
