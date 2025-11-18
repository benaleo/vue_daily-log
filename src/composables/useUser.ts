import { ref, computed } from 'vue'
import { supabase } from '@/services/supabase'

export interface UserProfile {
  id: string
  email?: string
  full_name?: string
  avatar_url?: string
  updated_at?: string
  // Add other user properties as needed
}

export function useUser() {
  const user = ref<UserProfile | null>(null)
  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  // Get the current user
  const getCurrentUser = async () => {
    try {
      isLoading.value = true
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      
      if (authError) throw authError
      if (!authUser) return null

      // Get additional user data from profiles table if needed
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (profileError) throw profileError
      
      user.value = { ...authUser, ...profile }
      return user.value
    } catch (err) {
      error.value = err as Error
      console.error('Error getting user:', err)
      return null
    } finally {
      isLoading.value = false
    }
  }

  // Sign out the current user
  const signOut = async () => {
    try {
      isLoading.value = true
      const { error: signOutError } = await supabase.auth.signOut()
      if (signOutError) throw signOutError
      user.value = null
    } catch (err) {
      error.value = err as Error
      console.error('Error signing out:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Check if user is authenticated
  const isAuthenticated = computed(() => !!user.value)

  return {
    user,
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    isAuthenticated,
    getCurrentUser,
    signOut
  }
}

export default useUser
