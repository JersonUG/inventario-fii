export default function BrandHeader() {
  return (
    <div className="bg-gradient-to-r from-ug via-ug-light to-ug text-white px-6 py-2 shadow-md relative">
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-fii-light to-transparent opacity-70" />
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img src="/images/logo-ug.png" alt="UG" className="h-12 w-auto object-contain drop-shadow-lg" />
          </div>
          <div className="leading-tight border-l border-fii/40 pl-4">
            <p className="text-lg font-bold tracking-wider text-white/90" style={{ fontFamily: 'Georgia, serif' }}>
              UNIVERSIDAD DE GUAYAQUIL
            </p>
            <p className="text-sm text-fii-light font-semibold tracking-wide" style={{ fontFamily: 'Georgia, serif' }}>
              Facultad de Ingeniería Industrial
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] text-fii-light uppercase tracking-widest">Sistema de Gestión</p>
            <p className="text-xs text-white/70 font-medium">Inventario Patrimonial</p>
          </div>
          <div className="w-px h-8 bg-fii/40" />
          <img src="/images/logo-facultad.png" alt="FII" className="h-12 w-auto object-contain drop-shadow-lg" />
        </div>
      </div>
    </div>
  )
}
