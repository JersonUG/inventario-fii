'use client'

import { ACTA_TIPOS, ActaTipo } from '@/types/acta-templates'

interface Props {
  tipo: ActaTipo
  data: Record<string, string>
  items: any[]
  preview?: boolean
}

export default function ActaTemplate({ tipo, data, items, preview }: Props) {
  const tipoLabel = ACTA_TIPOS.find(t => t.value === tipo)?.label || tipo
  const d = (k: string) => data[k] || '____________________'

  // Today's date for the first paragraph (auto)
  const now = new Date()
  const todayDay = now.getDate()
  const todayMonth = now.toLocaleDateString('es-ES', { month: 'long' })
  const todayYear = now.getFullYear()

  // EL/LA helper — returns the appropriate article based on content
  const el_la = (text: string) => {
    const upper = (text || '').toUpperCase()
    if (upper.startsWith('LA ') || upper.startsWith('LCDA') || upper.startsWith('LCDA.') || upper.startsWith('ING.') || upper.startsWith('AB.') || upper.startsWith('ABG') || upper.startsWith('DRA') || upper.startsWith('DRA.') || upper.startsWith('MGS') || upper.startsWith('MGS.') || upper.startsWith('MBA') || upper.startsWith('ECON') || upper.startsWith('ECON.')) return ''
    if (upper.startsWith('ING.') || upper.startsWith('ING ')) return ''
    return ' '
  }

  const rows = items.map((item, i) => (
    <tr key={item.id || i}>
      <td style={tdStyle}>{i + 1}</td>
      <td style={tdStyle}>{item.cod_inv || '-'}</td>
      <td style={tdStyle}>{item.cod_esbye || '-'}</td>
      <td style={tdStyle}>{item.cuenta || '-'}</td>
      <td style={tdStyle}>{item.cant || 1}</td>
      <td style={tdStyle}>{item.descripcion || '-'}</td>
      <td style={tdStyle}>{item.marca || '-'}</td>
      <td style={tdStyle}>{item.modelo || '-'}</td>
      <td style={tdStyle}>{item.serie || '-'}</td>
      <td style={tdStyle}>{item.fecha_adquisicion || '-'}</td>
      <td style={tdStyle}>{item.estado || '-'}</td>
    </tr>
  ))

  const getSubtitle = () => {
    const base = `ACTA DE CONSTATACIÓN FÍSICA Y ENTREGA RECEPCIÓN DE BIENES DE USUARIO FINAL ENTRE ${d('NOMBRE_ADMINISTRADOR')}, ${d('CARGO_ADMINISTRADOR')} Y ${d('NOMBRE_USUARIO_FINAL')}, ${d('CARGO_USUARIO_FINAL')}, CON FECHA DE CORTE AL ${d('FECHA_DIA')} DE ${d('FECHA_MES')} DE ${d('FECHA_ANIO')}`
    return base
  }

  const getAntecedentes = () => {
    switch (tipo) {
      case 'ENTREGA_ADMIN':
        return `Mediante ${d('DOCUMENTO_REFERENCIA')} suscrito por ${d('AUTORIDAD_DOCUMENTO')}, se comunica la aceptación de la renuncia de ${d('NOMBRE_USUARIO_FINAL')}, quien se desempeñaba como ${d('CARGO_USUARIO')}, efectiva a partir del ${d('FECHA_EFECTIVA')}. En tal virtud, ${d('NOMBRE_ADMINISTRADOR')} procede a realizar la entrega recepción de los bienes asignados a dicho usuario.`
      case 'ASIGNACION_USUARIO':
        return `Mediante ${d('DOCUMENTO_REFERENCIA')} suscrito por ${d('AUTORIDAD_DOCUMENTO')}, se autoriza la entrega de bienes a ${d('NOMBRE_USUARIO_FINAL')}, ${d('CARGO_USUARIO_FINAL')}, para el cumplimiento de sus funciones en ${d('UBICACION_BIENES')}. En tal virtud, ${d('NOMBRE_ADMINISTRADOR')} deja constancia de la entrega de los bienes detallados en la cláusula tercera.`
      case 'RECEPCION_BODEGA':
        return `Mediante ${d('DOCUMENTO_REFERENCIA')} suscrito por ${d('AUTORIDAD_DOCUMENTO')}, se dispone la recepción de los bienes detallados en la cláusula tercera, provenientes de ${d('NOMBRE_ENTREGA')} / ${d('AREA_ORIGEN')}, a la Bodega de la Facultad de Ingeniería Industrial.`
      case 'CONSTATACION_FISICA':
        return `En cumplimiento a lo dispuesto por ${d('AUTORIDAD_DOCUMENTO')}, se realiza la constatación física de los bienes asignados a ${d('NOMBRE_USUARIO_FINAL')}, ${d('CARGO_USUARIO_FINAL')}, con la finalidad de verificar su estado y ubicación actual en ${d('UBICACION_BIENES')}.`
      case 'ENTREGA_RECEPCION_CONSTATACION':
        return `Mediante ${d('DOCUMENTO_REFERENCIA')} suscrito por ${d('AUTORIDAD_DOCUMENTO')}, ${d('NOMBRE_USUARIO_FINAL')}, ${d('CARGO_USUARIO_FINAL')}, realiza la entrega de los bienes detallados en la cláusula tercera a la Administración de la Facultad de Ingeniería Industrial, con la finalidad de verificar su estado y ubicación actual.`
    }
  }

  const getTerceraDescripcion = () => {
    switch (tipo) {
      case 'ENTREGA_ADMIN':
        return `Con los antecedentes expuestos en la cláusula anterior, se procede a detallar los bienes que ${d('NOMBRE_USUARIO_FINAL')} entrega a la Administración de la Facultad de Ingeniería Industrial, ubicados en ${d('UBICACION_BIENES')}.`
      case 'ASIGNACION_USUARIO':
        return `Con los antecedentes expuestos en la cláusula anterior, se procede a detallar los bienes que la Administración de la Facultad de Ingeniería Industrial entrega a ${d('NOMBRE_USUARIO_FINAL')}, ubicados en ${d('UBICACION_BIENES')}.`
      case 'RECEPCION_BODEGA':
        return `Con los antecedentes expuestos en la cláusula anterior, se procede a detallar los bienes recibidos en la Bodega de la Facultad de Ingeniería Industrial, provenientes de ${d('UBICACION_BIENES')}.`
      case 'CONSTATACION_FISICA':
        return `Con los antecedentes expuestos en la cláusula anterior, se procede a detallar los bienes constatados físicamente en ${d('UBICACION_BIENES')}, pertenecientes a ${d('NOMBRE_USUARIO_FINAL')}.`
      case 'ENTREGA_RECEPCION_CONSTATACION':
        return `Con los antecedentes expuestos en la cláusula anterior, se procede a detallar los bienes que se entregan, reciben y constatan, ubicados en ${d('UBICACION_BIENES')}.`
    }
  }

  const getQuinta = () => {
    switch (tipo) {
      case 'ENTREGA_ADMIN':
        return `Para constancia de lo actuado, suscriben la presente acta en 3 ejemplares de igual tenor y efecto, ${d('NOMBRE_USUARIO_FINAL')} como ENTREGA, y ${d('NOMBRE_ADMINISTRADOR')} como RECIBE.`
      case 'ASIGNACION_USUARIO':
        return `Para constancia de lo actuado, suscriben la presente acta en 3 ejemplares de igual tenor y efecto, ${d('NOMBRE_ADMINISTRADOR')} como ENTREGA, y ${d('NOMBRE_USUARIO_FINAL')} como RECIBE.`
      case 'RECEPCION_BODEGA':
        return `Para constancia de lo actuado, suscriben la presente acta en 3 ejemplares de igual tenor y efecto, ${d('NOMBRE_ENTREGA')} como ENTREGA, y ${d('NOMBRE_ADMINISTRADOR')} como RECIBE.`
      case 'CONSTATACION_FISICA':
        return `Para constancia de lo actuado, suscriben la presente acta en 3 ejemplares de igual tenor y efecto, ${d('NOMBRE_ADMINISTRADOR')} y ${d('NOMBRE_USUARIO_FINAL')}.`
      case 'ENTREGA_RECEPCION_CONSTATACION':
        return `Para constancia de lo actuado, suscriben la presente acta en 3 ejemplares de igual tenor y efecto, ${d('NOMBRE_ADMINISTRADOR')} como ENTREGA CONFORME y ${d('NOMBRE_USUARIO_FINAL')} como RECIBE CONFORME.`
    }
  }

  const getFirmas = () => {
    switch (tipo) {
      case 'ENTREGA_ADMIN':
        return (
          <>
            <tr><td style={tdStyle}><b>{d('NOMBRE_USUARIO_FINAL')} / {d('CARGO_USUARIO_FINAL')}</b><br /><span style={{fontSize: '11px'}}>Entrega Conforme</span></td><td style={{width: 40}}></td><td style={tdStyle}><b>{d('NOMBRE_ADMINISTRADOR')} / {d('CARGO_ADMINISTRADOR')}</b><br /><span style={{fontSize: '11px'}}>Recibe Conforme</span></td></tr>
          </>
        )
      case 'ASIGNACION_USUARIO':
        return (
          <>
            <tr><td style={tdStyle}><b>{d('NOMBRE_ADMINISTRADOR')} / ADMINISTRADOR / FII</b><br /><span style={{fontSize: '11px'}}>Entrega Conforme</span></td><td style={{width: 40}}></td><td style={tdStyle}><b>{d('NOMBRE_USUARIO_FINAL')} / {d('CARGO_USUARIO_FINAL')}</b><br /><span style={{fontSize: '11px'}}>Recibe Conforme</span></td></tr>
          </>
        )
      case 'RECEPCION_BODEGA':
        return (
          <>
            <tr><td style={tdStyle}><b>{d('NOMBRE_ENTREGA')} / {d('CARGO_ENTREGA')}</b><br /><span style={{fontSize: '11px'}}>Entrega Conforme</span></td><td style={{width: 40}}></td><td style={tdStyle}><b>{d('NOMBRE_ADMINISTRADOR')} / {d('CARGO_ADMINISTRADOR')}</b><br /><span style={{fontSize: '11px'}}>Recibe Conforme</span></td></tr>
          </>
        )
      case 'CONSTATACION_FISICA':
        return (
          <>
            <tr><td style={tdStyle}><b>{d('NOMBRE_ADMINISTRADOR')} / ADMINISTRADOR / FII</b><br /><span style={{fontSize: '11px'}}>Constató</span></td><td style={{width: 40}}></td><td style={tdStyle}><b>{d('NOMBRE_USUARIO_FINAL')} / {d('CARGO_USUARIO_FINAL')}</b><br /><span style={{fontSize: '11px'}}>Constató</span></td></tr>
          </>
        )
      case 'ENTREGA_RECEPCION_CONSTATACION':
        return (
          <>
            <tr><td style={tdStyle} colSpan={3}><b>{d('NOMBRE_ADMINISTRADOR')} / {d('CARGO_ADMINISTRADOR')}</b></td></tr>
          </>
        )
    }
  }

  const docStyle: React.CSSProperties = {
    fontFamily: 'Times New Roman, Times, serif',
    fontSize: '12px',
    lineHeight: '1.5',
    color: '#000',
    background: '#fff',
    maxWidth: '210mm',
    margin: '0 auto',
  }

  const pStyle: React.CSSProperties = {
    margin: '0 0 10px 0',
    textAlign: 'justify',
  }

  const thStyle: React.CSSProperties = {
    border: '1px solid #000',
    padding: '4px 6px',
    fontSize: '10px',
    fontWeight: 'bold',
    textAlign: 'center',
    background: '#f0f0f0',
  }

  return (
    <div id="acta-preview" style={docStyle}>
      <div style={{ padding: '40px 60px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <img src="/images/1.png" alt="" style={{ height: 70 }} />
        <img src="/images/2.png" alt="" style={{ height: 70 }} />
      </div>

      <div style={{ border: '2px solid #000', borderRadius: 12, padding: '14px 20px', marginBottom: 16, textAlign: 'center' }}>
        <p style={{ margin: '0 0 4px 0', fontWeight: 'bold', fontSize: '14px' }}>
          ACTA No. {d('NUMERO_ACTA')}
        </p>
        <p style={{ margin: 0, fontWeight: 'bold', fontSize: '12px' }}>
          {getSubtitle()}
        </p>
      </div>

      <p style={pStyle}>
        En la ciudad de Guayaquil, a los {todayDay} días del mes de {todayMonth} del año {todayYear}, se suscribe la presente Acta de constatación física y entrega recepción de Bienes de Usuario Final entre {d('NOMBRE_ADMINISTRADOR')} en calidad de {d('CARGO_ADMINISTRADOR')} y {d('NOMBRE_USUARIO_FINAL')} en calidad de {d('CARGO_USUARIO_FINAL')}.
      </p>

      <p style={{ ...pStyle, fontWeight: 'bold' }}>
        PRIMERA. - ANTECEDENTES. {getAntecedentes()}
      </p>

      <p style={{ ...pStyle, fontWeight: 'bold' }}>SEGUNDA.- BASE LEGAL.-</p>
      <p style={pStyle}>
        <b>En cumplimiento a lo que dispone el Reglamento General Sustitutivo para la Administración, Utilización, Manejo y Control de los Bienes e Inventarios del Sector Público, </b>
        en sus Artículos:
      </p>
      <p style={pStyle}>
        Artículo 7.- <b>Obligatoriedad</b>.- Este Reglamento rige para todos los servidores/as y las personas que, en cualquier forma o a cualquier título, trabajen, presten servicios o ejerzan un cargo, función o dignidad en el sector público; así como para las personas jurídicas de derecho privado que dispongan de recursos públicos, de conformidad a lo señalado en la Ley Orgánica de la Contraloría General del Estado, en lo que fuere aplicable, a cuyo cargo se encuentre la administración, custodia, uso y cuidado de los bienes e inventarios del Estado.
      </p>
      <p style={pStyle}>
        Por tanto, no habrá servidor/a o persona alguna que por razón de su cargo, función o jerarquía se encuentre exento/a del cumplimiento de las disposiciones del presente Reglamento de conformidad a lo previsto en el artículo 233 de la Constitución de la República del Ecuador.
      </p>
      <p style={pStyle}>
        Artículo 19.- <b>Custodio Administrativo</b>. - Será el/la responsable de mantener actualizados los registros de ingresos, egresos y traspasos de los bienes y/o inventarios en el Área donde presta sus servicios, conforme a las necesidades de los Usuarios Finales.
      </p>
      <p style={pStyle}>
        Artículo 20.- <b>Usuario Final</b>. - Será el responsable del cuidado, buen uso, custodia y conservación de los bienes e inventarios a él asignados para el desempeño de sus funciones y los que por delegación expresa se agreguen a su cuidado, conforme a las disposiciones legales y reglamentarias correspondientes.
      </p>
      <p style={pStyle}>Artículo 44.-</p>
      <p style={pStyle}>
        a) Dejar constancia obligatoria en un acta de entrega recepción el momento en que se efectúa la entrega de bienes por parte del Proveedor al Guardalmacén, o quien haga sus veces, con el fin de controlar, registrar y custodiar los bienes entregados.
      </p>
      <p style={pStyle}>
        b) El Guardalmacén, o quien haga sus veces entregará los registros de bienes y/o inventarios al titular de cada Área, para, su control y custodia; y, una copia de los mismos los entregará al Custodio Administrativo del Área.
      </p>
      <p style={pStyle}>
        c) El Guardalmacén, o quien haga sus veces, entregará al Custodio Administrativo o al Usuario Final los bienes necesarios para las labores inherentes a su cargo o función, de lo cual levantará un acta de entrega recepción en la que constarán las especificaciones y características de aquellos.
      </p>
      <p style={pStyle}>
        d) Cuando se produzca la renuncia, separación, destitución, comisión de servicios o traslado administrativo de un Usuario Final se realizará la entrega recepción de los bienes asignados a éste al Custodio Administrativo de la unidad.
      </p>

      <p style={{ ...pStyle, fontWeight: 'bold' }}>
        TERCERA. - DESCRIPCIÓN DE LOS BIENES. {getTerceraDescripcion()}
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 10, fontSize: '10px' }}>
        <thead>
          <tr>
            <th style={thStyle}>ITEM</th>
            <th style={thStyle}>COD. INV.</th>
            <th style={thStyle}>CÓD. ESBYE</th>
            <th style={thStyle}>CUENTA</th>
            <th style={thStyle}>CANT</th>
            <th style={thStyle}>DESCRIPCIÓN</th>
            <th style={thStyle}>MARCA</th>
            <th style={thStyle}>MODELO</th>
            <th style={thStyle}>SERIE</th>
            <th style={thStyle}>FECHA ADQ.</th>
            <th style={thStyle}>ESTADO</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr><td colSpan={11} style={{ ...tdStyle, textAlign: 'center' }}>Sin bienes registrados</td></tr>
          ) : rows}
        </tbody>
      </table>

      <p style={{ ...pStyle, fontWeight: 'bold' }}>
        CUARTA. - OBLIGACIÓN. - Se deja constancia que el custodio administrativo actualizará dentro de su matriz de control interno los bienes descritos en la cláusula tercera.
      </p>

      <p style={{ ...pStyle, fontWeight: 'bold' }}>
        QUINTA. - ACEPTACIÓN. {getQuinta()}
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 20 }}>
        <tbody>
          {getFirmas()}
        </tbody>
      </table>

      </div>

      <div style={{ width: '20.99cm', height: '2.01cm', margin: '-0.5px auto 0' }}>
        <img src="/images/pie-pagina.jpg" alt=""
          style={{ width: '100%', height: '100%', display: 'block' }} />
      </div>
    </div>
  )
}

const tdStyle: React.CSSProperties = {
  border: '1px solid #000',
  padding: '3px 5px',
  fontSize: '10px',
  verticalAlign: 'top',
}
