-- ESQUEMA DE BASE DE DATOS - SISTEMA DE INVENTARIO FII
-- Ejecutar en Supabase > SQL Editor

CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item INTEGER NOT NULL,
  cod_inv TEXT DEFAULT '',
  cod_esbye TEXT DEFAULT '',
  cuenta TEXT DEFAULT '',
  cant INTEGER DEFAULT 1,
  descripcion TEXT DEFAULT '',
  marca TEXT DEFAULT '',
  modelo TEXT DEFAULT '',
  serie TEXT DEFAULT '',
  fecha_adquisicion DATE,
  estado TEXT DEFAULT '',
  valor NUMERIC(12,2),
  ubicacion TEXT DEFAULT '',
  observaciones TEXT DEFAULT '',
  no_acta TEXT DEFAULT '',
  mes TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_items_is_active ON items(is_active);
CREATE INDEX idx_items_cod_inv ON items(cod_inv);
CREATE INDEX idx_items_ubicacion ON items(ubicacion);
CREATE INDEX idx_items_estado ON items(estado);
CREATE INDEX idx_items_cuenta ON items(cuenta);
CREATE INDEX idx_items_serie ON items(serie);

CREATE TABLE IF NOT EXISTS item_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  changes JSONB DEFAULT '{}',
  user_id TEXT DEFAULT '',
  user_name TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_item_history_item ON item_history(item_id);
CREATE INDEX idx_item_history_created ON item_history(created_at DESC);

CREATE TABLE IF NOT EXISTS actas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  responsable TEXT DEFAULT '',
  file_url TEXT DEFAULT '',
  file_type TEXT DEFAULT '',
  notas TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_actas_name ON actas(name);
CREATE INDEX idx_actas_fecha ON actas(fecha DESC);
CREATE INDEX idx_actas_responsable ON actas(responsable);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_items_updated
  BEFORE UPDATE ON items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Políticas de seguridad (acceso público para desarrollo)
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE actas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all read items" ON items FOR SELECT USING (true);
CREATE POLICY "Allow all read history" ON item_history FOR SELECT USING (true);
CREATE POLICY "Allow all read actas" ON actas FOR SELECT USING (true);
CREATE POLICY "Allow auth insert items" ON items FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow auth update items" ON items FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow auth delete items" ON items FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow auth insert history" ON item_history FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow auth insert actas" ON actas FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow auth update actas" ON actas FOR UPDATE USING (auth.role() = 'authenticated');
