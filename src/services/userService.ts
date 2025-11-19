import { supabase } from './supabase'

export const getUsersByType = async (userId: string, type: 'followers' | 'following', page: number, perPage: number) => {
  try {
    const from = (page - 1) * perPage
    const to = from + perPage - 1

    if (type === 'followers') {
      // Get users who are following the specified user
      const { data, error, count } = await supabase
        .from('user_followers')
        .select(
          `
          to:users!user_followers_from_id_fkey(
            id,
            name,
            email,
            avatar_url
          )
          `,
          { count: 'exact' }
        )
        .eq('with_id', userId)
        .range(from, to)

      if (error) throw error

      return {
        data: data?.map(item => ({
          ...item.to
        })) || [],
        pagination: {
          total: count || 0,
          page,
          perPage,
          hasMore: to < (count || 0) - 1
        }
      }
    } else {
      // Get users who the specified user is following
      const { data, error, count } = await supabase
        .from('user_followers')
        .select(
          `
          from:users!user_followers_with_id_fkey(
            id,
            name,
            email,
            avatar_url
          )
          `,
          { count: 'exact' }
        )
        .eq('from_id', userId)
        .range(from, to)

      if (error) throw error

      return {
        data: data?.map(item => ({
          ...item.from,
        })) || [],
        pagination: {
          total: count || 0,
          page,
          perPage,
          hasMore: to < (count || 0) - 1
        }
      }
    }
  } catch (error) {
    console.error('Error fetching users:', error)
    throw error
  }
}
