import type { Metadata } from "next"
import "./globals.css"
import { Toaster } from "react-hot-toast"

export const metadata: Metadata = {
  title: "Inventario FII",
  description: "Sistema de Gestión de Inventario - Facultad de Ingeniería Industrial",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Toaster position="top-right" />
        {children}
        <script dangerouslySetInnerHTML={{
          __html: `document.addEventListener('input',function(e){var t=e.target;if((t.tagName==='INPUT'||t.tagName==='TEXTAREA')&&t.closest('.uppercase-mode')){if(t.type!=='number'){var s=t.selectionStart,n=t.selectionEnd,u=t.value.toUpperCase();if(u!==t.value){t.value=u;if(typeof s==='number')t.setSelectionRange(s,n)}}}})`
        }} />
      </body>
    </html>
  )
}
