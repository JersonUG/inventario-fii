export default function BrandHeader() {
  return (
    <div className="bg-gradient-to-r from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white px-6 py-2 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img src="/images/logo-ug.png" alt="UG" className="h-12 w-auto object-contain" />
          <div className="leading-tight">
            <p className="text-lg font-bold tracking-wide" style={{ fontFamily: 'Georgia, serif' }}>
              UNIVERSIDAD DE GUAYAQUIL
            </p>
            <p className="text-sm text-sky-300 font-medium" style={{ fontFamily: 'Georgia, serif' }}>
              Facultad de Ingeniería Industrial
            </p>

          </div>
        </div>

        <div className="hidden sm:flex items-center gap-4">
          <img src="/images/logo-facultad.png" alt="FII" className="h-12 w-auto object-contain" />
        </div>
      </div>
    </div>
  )
}
