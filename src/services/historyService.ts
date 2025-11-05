import { supabase } from './supabase'

export type HistoryType = 'INCOME' | 'SPEND'

export interface History {
  id: number
  name: string
  category_id: number
  image_url: string | null
  type: HistoryType
  amount: number
  created_at: string
  updated_at: string
  deleted_at: string | null
  category?: {
    id: number
    name: string
  }
}

export interface CreateHistoryDto {
  name: string
  category_id: number
  image_url?: string | null
  type: HistoryType
  amount: number
}

export interface UpdateHistoryDto {
  name?: string
  category_id?: number
  image_url?: string | null
  type?: HistoryType
  amount?: number
}

export interface HistoryFilters {
  name?: string
  type?: HistoryType | ''
  category_id?: number | ''
  date_start?: string
  date_end?: string
}

export const historyService = {
  async getAll(filters?: HistoryFilters) {
    let query = supabase
      .from('histories')
      .select(`
        *,
        category:history_categories(id, name)
      `)
      .is('deleted_at', null)

    // Apply filters
    if (filters?.name) {
      query = query.ilike('name', `%${filters.name}%`)
    }

    if (filters?.type) {
      query = query.eq('type', filters.type)
    }

    if (filters?.category_id) {
      query = query.eq('category_id', filters.category_id)
    }

    if (filters?.date_start) {
      query = query.gte('created_at', filters.date_start)
    }

    if (filters?.date_end) {
      query = query.lte('created_at', filters.date_end)
    }

    query = query.order('created_at', { ascending: false })

    const { data, error } = await query
    
    return { data, error }
  },

  async getById(id: number) {
    const { data, error } = await supabase
      .from('histories')
      .select(`
        *,
        category:history_categories(id, name)
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single()
    
    return { data, error }
  },

  async create(history: CreateHistoryDto) {
    const { data, error } = await supabase
      .from('histories')
      .insert(history)
      .select(`
        *,
        category:history_categories(id, name)
      `)
      .single()
    
    return { data, error }
  },

  async update(id: number, history: UpdateHistoryDto) {
    const { data, error } = await supabase
      .from('histories')
      .update(history)
      .eq('id', id)
      .select(`
        *,
        category:history_categories(id, name)
      `)
      .single()
    
    return { data, error }
  },

  async delete(id: number) {
    // Soft delete
    const { data, error } = await supabase
      .from('histories')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    return { data, error }
  }
}
