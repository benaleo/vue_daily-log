import { supabase } from './supabase'

export interface FollowerFollowing {
  from_id: string;
  from: {
    id: string;
    email: string;
    name: string;
    avatar_url: string;
  };
  with: {
    id: string;
    email: string;
    name: string;
    avatar_url: string;
  }
  created_at?: string
};

export const userFollowers = {
  async getFollowerCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('user_followers')
      .select('*', { count: 'exact', head: true })
      .eq('with_id', userId)
    
    if (error) throw error
    return count || 0
  },

  async getFollowingCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('user_followers')
      .select('*', { count: 'exact', head: true })
      .eq('from_id', userId)
    
    if (error) throw error
    return count || 0
  },

  async getFollowers(userId: string) {
    const { data, error } = await supabase
      .from('user_followers')
      .select(`
        from_id,
        from:from_id!inner (
          id,
          email,
          raw_user_meta_data->>'name' as name,
          raw_user_meta_data->>'avatar_url' as avatar_url
        )`)
      .eq('with_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return (data as unknown as FollowerFollowing[] | null)?.map(item => ({
      id: item.from_id,
      email: item.from.email,
      name: item.from.name,
      avatar_url: item.from.avatar_url
    })) || [];
  },

  async getFollowing(userId: string) {
    const { data, error } = await supabase
      .from('user_followers')
      .select(`
        with_id,
        with:with_id!inner (
          id,
          email,
          raw_user_meta_data->>'name' as name,
          raw_user_meta_data->>'avatar_url' as avatar_url
        )`)
      .eq('from_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error

    return (data as unknown as FollowerFollowing[] | null)?.map(item => ({
      id: item.with.id,
      email: item.with.email,
      name: item.with.name,
      avatar_url: item.with.avatar_url
    })) || []
  },

  async follow(userId: string, targetUserId: string) {
    const { data, error } = await supabase
      .from('user_followers')
      .insert([
        { from_id: userId, with_id: targetUserId }
      ])
      .select()
    
    if (error) throw error
    return data?.[0]
  },

  async unfollow(userId: string, targetUserId: string) {
    const { error } = await supabase
      .from('user_followers')
      .delete()
      .eq('from_id', userId)
      .eq('with_id', targetUserId)
    
    if (error) throw error
    return true
  },

  async isFollowing(userId: string, targetUserId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('user_followers')
      .select('*')
      .eq('from_id', userId)
      .eq('with_id', targetUserId)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows returned
    return !!data
  }
}
