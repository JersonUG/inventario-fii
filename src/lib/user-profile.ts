import { supabase } from './supabase'

export type UserProfile = {
  id: string
  user_id: string
  email: string
  rol: 'ADMINISTRADOR' | 'OPERADOR' | 'CONSULTA'
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  let { data } = await supabase.from('user_profiles').select('*').eq('user_id', user.id).single()
  if (!data) {
    const { data: newProfile } = await supabase.from('user_profiles').insert([{
      user_id: user.id, email: user.email || '', rol: 'CONSULTA',
    }]).select().single()
    data = newProfile
  }
  return data as UserProfile | null
}
