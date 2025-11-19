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
      
      const { sessionUser, error: authError } = await authService.getSession()
      
      if (authError || !sessionUser) {
        throw new Error('No authenticated user')
      }
      
      const { user_id, name, email, avatar_url, role } = sessionUser
      
      // First try to get user from profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('id, email, name, avatar_url, role')
        .eq('id', user_id)
        .single()
      
      if (profileError || !profileData) {
        // If no profile found, use auth data
        user.value = {
          id: user_id,
          name: name || 'unknown',
          email: email || '',
          avatar_url: avatar_url || '/img.jpg',
          role: role || 'USER'
        }
      } else {
        // Use profile data from database
        user.value = {
          id: profileData.id,
          name: profileData.name || 'unknown',
          email: profileData.email || '',
          avatar_url: profileData.avatar_url || '/img.jpg',
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
      const { sessionUser } = await authService.getSession()
      const currentUserId = sessionUser?.user_id
      
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
      const { sessionUser } = await authService.getSession()
      const currentUserId = sessionUser?.user_id
      
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
