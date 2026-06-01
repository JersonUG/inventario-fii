'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

interface Props {
  label: string
  value: string
  onChange: (val: string) => void
  column: string
}

export default function AutocompleteInput({ label, value, onChange, column }: Props) {
  const [options, setOptions] = useState<string[]>([])
  const [filtered, setFiltered] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const [focusedIdx, setFocusedIdx] = useState(-1)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.rpc('get_distinct_values', { col_name: column }).then(({ data }) => {
      if (data) setOptions(data.map((d: any) => d.val).filter(Boolean).sort((a: string, b: string) => a.localeCompare(b, 'es', { sensitivity: 'base' })))
    })
  }, [column])

  useEffect(() => {
    if (value) {
      const q = value.toLocaleLowerCase('es')
      setFiltered(options.filter(o => o.toLocaleLowerCase('es').includes(q)))
    } else {
      setFiltered(options)
    }
    setFocusedIdx(-1)
  }, [value, options])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type="text" value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (!open || !filtered.length) return
          if (e.key === 'ArrowDown') { e.preventDefault(); setFocusedIdx(i => Math.min(i + 1, filtered.length - 1)) }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setFocusedIdx(i => Math.max(i - 1, 0)) }
          else if (e.key === 'Enter' && focusedIdx >= 0) { e.preventDefault(); onChange(filtered[focusedIdx]); setOpen(false) }
          else if (e.key === 'Escape') setOpen(false)
        }}
        className="input-field" />
      {open && filtered.length > 0 && (
        <ul className="absolute z-20 top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filtered.map((opt, i) => (
            <li key={opt} onClick={() => { onChange(opt); setOpen(false) }}
              className={`px-4 py-2 text-sm cursor-pointer transition-colors ${i === focusedIdx ? 'bg-fii/10 text-fii' : 'hover:bg-gray-100'}`}>
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
