'use client'

import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

export function useRealtime(table: string, onRefresh: () => void) {
  const onRefreshRef = useRef(onRefresh)
  onRefreshRef.current = onRefresh

  useEffect(() => {
    const channel = supabase
      .channel(`realtime-${table}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table },
        () => onRefreshRef.current()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [table])
}
