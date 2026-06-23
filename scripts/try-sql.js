async function main() {
  const url = 'https://pivjjwymjutxqdjvmjdt.supabase.co/pg'
  const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpdmpqd3ltanV0eHFkanZtamR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMTIzNjMsImV4cCI6MjA5NDY4ODM2M30.pWEZcElSqKW6l6xqbsGi0QP4z0_OePT6uLolvk9VtN0'
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'apikey': key, 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: "ALTER TABLE items ADD COLUMN IF NOT EXISTS clasificacion_activo TEXT NOT NULL DEFAULT 'ACTIVO'" })
    })
    console.log('Status:', r.status, await r.text())
  } catch (e) { console.log('Error:', e.message) }
}
main()
