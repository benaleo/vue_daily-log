import { authService, supabase } from '@/services/supabase'
import { ref } from 'vue'

export interface UserProfile {
  id: string
  email: string
  name: string
  avatar_url?: string
  role?: string
  isFollowing?: boolean
}

export function useGetUserProfile() {
  const user = ref<UserProfile | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const isCurrentUser = ref(false)
  const isFollowing = ref(false)

  const fetchCurrentUser = async () => {
    try {
      loading.value = true
      error.value = null
      
      const { session, error: authError } = await authService.getSession()
      
      if (authError || !session?.user) {
        throw new Error('No authenticated user')
      }
      
      const { user: authUser } = session
      
      // First try to get user from profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('id, email, name, avatar_url, role')
        .eq('id', authUser.id)
        .single()
      
      if (profileError || !profileData) {
        // If no profile found, use auth data
        user.value = {
          id: authUser.id,
          name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
          email: authUser.email || '',
          avatar_url: authUser.user_metadata?.avatar_url || '/img.jpg',
          role: authUser.role || 'USER'
        }
      } else {
        // Use profile data from database
        user.value = {
          id: profileData.id,
          name: profileData.name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
          email: profileData.email || authUser.email || '',
          avatar_url: profileData.avatar_url || authUser.user_metadata?.avatar_url || '/img.jpg',
          role: profileData.role || 'USER'
        }
      }
      
      isCurrentUser.value = true
      return user.value
      
    } catch (err) {
      console.error('Error fetching current user:', err)
      error.value = 'Failed to load user profile'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchUserProfile = async (userId: string) => {
    try {
      loading.value = true
      error.value = null
      const currentUserId = await supabase.auth.getSession().then((session) => session.data.session?.user.id)
      
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('id, email, name, avatar_url, role')
        .eq('id', userId)
        .single()
      
      if (profileError) throw profileError
      
      user.value = profileData
      isCurrentUser.value = currentUserId === userId
      
      // Check if current user is following this profile
      if (currentUserId && currentUserId !== userId) {
        const { data: followData, error: followError } = await supabase
          .from('user_followers')
          .select('*')
          .eq('from_id', currentUserId)
          .eq('with_id', userId)
          .maybeSingle()

        user.value = { 
          ...user.value, 
          isFollowing: !followError && followData !== null 
        }
      }
      
      return user.value
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch user profile'
      throw err
    } finally {
      loading.value = false
    }
  }

  const toggleFollow = async () => {
    if (!user.value) return
    
    try {
      loading.value = true
      const currentUserId = await supabase.auth.getSession().then((session) => session.data.session?.user.id)
      
      if (user.value.isFollowing) {
        // Unfollow
        const { error: unfollowError } = await supabase
          .from('user_followers')
          .delete()
          .eq('from_id', currentUserId)
          .eq('with_id', user.value.id)
          
        if (!unfollowError) {
          user.value = { ...user.value, isFollowing: false }
          return { success: true, action: 'unfollow' }
        }
      } else {
        // Follow
        const { error: followError } = await supabase
          .from('user_followers')
          .insert([
            { from_id: currentUserId, with_id: user.value.id }
          ])
          
        if (!followError) {
          user.value = { ...user.value, isFollowing: true }
          return { success: true, action: 'follow' }
        }
      }
    } catch (err) {
      console.error('Error toggling follow:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    user,
    loading,
    error,
    isCurrentUser,
    fetchUserProfile,
    fetchCurrentUser,
    toggleFollow
  }
}
