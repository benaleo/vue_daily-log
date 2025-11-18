// Import the Supabase client from our implementation
import { supabase } from '@/lib/supabase';

// Re-export the Supabase clients
export { supabase };

export const authService = {
  // Update the signUp function in authService
async signUp(email: string, password: string, name: string) {
  try {
    // Use the standard signUp method
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
          email_confirm: true // Skip email confirmation in development
        }
      }
    });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Signup error:', error);
    return {
      data: null,
      error: {
        message: error instanceof Error ? error.message : 'An unknown error occurred',
        details: error
      }
    };
  }
},

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  },

  async logout() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  async getUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  },

  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession()

    // add session role name from public.users
    if (session?.user) {
      const { data, error } = await this.getRole(session.user.id)
      if (error) throw error
      session.user.role = data?.role || 'UNKNOWN'
    }
    return { session, error }
  },

  async getRole(id: string) {
    const { data, error } = await supabase.from('users').select('role').eq('id', id).single()
    return { data, error }
  },

  async updateProfile(name: string, avatarUrl?: string) {
    const { data, error } = await supabase.auth.updateUser({
      data: {
        name,
        avatar_url: avatarUrl
      }
    })
    return { data, error }
  },

  async updatePassword(newPassword: string) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    })
    return { data, error }
  }
}
