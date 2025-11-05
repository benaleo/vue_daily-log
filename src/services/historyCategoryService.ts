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
    const { data, error } = await supabase
      .from('history_categories')
      .select('*')
      .is('deleted_at', null)
      .order('name', { ascending: true })
    
    return { data, error }
  },

  async getById(id: number) {
    const { data, error } = await supabase
      .from('history_categories')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()
    
    return { data, error }
  },

  async create(category: CreateHistoryCategoryDto) {
    const { data, error } = await supabase
      .from('history_categories')
      .insert(category)
      .select()
      .single()
    
    return { data, error }
  },

  async update(id: number, category: UpdateHistoryCategoryDto) {
    const { data, error } = await supabase
      .from('history_categories')
      .update(category)
      .eq('id', id)
      .select()
      .single()
    
    return { data, error }
  },

  async delete(id: number) {
    // Soft delete
    const { data, error } = await supabase
      .from('history_categories')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    return { data, error }
  }
}
