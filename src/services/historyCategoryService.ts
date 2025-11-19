import { supabase } from './supabase'

export interface HistoryCategory {
  id: number
  name: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface CreateHistoryCategoryDto {
  name: string
}

export interface UpdateHistoryCategoryDto {
  name?: string
}

export const historyCategoryService = {
  async getAll() {
    const user = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('history_categories')
      .select('*')
      .is('deleted_at', null)
      .eq('user_id', user.data.user?.id || '')

      .order('name', { ascending: true })
    
    return { data, error }
  },

  async getById(id: number) {
    const user = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('history_categories')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .eq('user_id', user.data.user?.id || '')
      .single()
    
    return { data, error }
  },

  async create(category: CreateHistoryCategoryDto) {
    const user = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('history_categories')
      .insert({ ...category, user_id: user.data.user?.id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .select()
      .single()
    
    return { data, error }
  },

  async update(id: number, category: UpdateHistoryCategoryDto) {
    const user = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('history_categories')
      .update({ ...category, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.data.user?.id || '')
      .select()
      .single()
    
    return { data, error }
  },

  async delete(id: number) {
    const user = await supabase.auth.getUser()
    // Soft delete
    const { data, error } = await supabase
      .from('history_categories')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.data.user?.id || '')
      .select()
      .single()
    
    return { data, error }
  }
}
