import { supabase } from './supabase'

export interface Banner {
  id: number
  name: string
  url: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface CreateBannerDto {
  name: string
  url: string
}

export interface UpdateBannerDto {
  name?: string
  url?: string
}

export const bannerService = {
  async getAll() {
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
    
    return { data, error }
  },

  async getById(id: number) {
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()
    
    return { data, error }
  },

  async create(banner: CreateBannerDto) {
    const { data, error } = await supabase
      .from('banners')
      .insert(banner)
      .select()
      .single()
    
    return { data, error }
  },

  async update(id: number, banner: UpdateBannerDto) {
    const { data, error } = await supabase
      .from('banners')
      .update(banner)
      .eq('id', id)
      .select()
      .single()
    
    return { data, error }
  },

  async delete(id: number) {
    // Soft delete
    const { data, error } = await supabase
      .from('banners')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    return { data, error }
  },

  async hardDelete(id: number) {
    // Hard delete - permanent
    const { error } = await supabase
      .from('banners')
      .delete()
      .eq('id', id)
    
    return { error }
  }
}
