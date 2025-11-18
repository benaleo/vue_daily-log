import { ref } from 'vue'
import { supabase } from '@/services/supabase'
import { authService } from '@/services/supabase'

export interface UserProfile {
  id: string
  name: string
  email: string
  avatar_url: string | null
  role: string
}

export function useGetUserProfile() {
  const user = ref<UserProfile | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const isCurrentUser = ref(false)

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

  const fetchUserProfile = async (userId?: string) => {
    try {
      loading.value = true
      error.value = null
      isCurrentUser.value = false

      // If no userId provided, fetch current user
      if (!userId) {
        return await fetchCurrentUser()
      }

      // Fetch specific user by ID
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('id, email, name, avatar_url, role')
        .eq('id', userId)
        .single()

      if (fetchError) throw fetchError
      
      user.value = {
        id: data.id,
        name: data.name || 'User',
        email: data.email || '',
        avatar_url: data.avatar_url || '/img.jpg',
        role: data.role || 'USER'
      }
      
      return user.value
    } catch (err) {
      console.error('Error fetching user profile:', err)
      error.value = 'Failed to load user profile'
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
    fetchCurrentUser
  }
}
