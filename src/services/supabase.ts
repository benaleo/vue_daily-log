// Import the Supabase client from our implementation
import { supabase } from '@/lib/supabase';

// Re-export the Supabase clients
export { supabase };

export type SessionUser = {
  token: string
  session: any
  user_id: string
  name: string
  email: string
  avatar_url: string
  role: string
  is_public: boolean
}

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
    try {
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut()
      return { error }
    } catch (error) {
      console.error('Logout error:', error)
      return { 
        error: {
          message: error instanceof Error ? error.message : 'Failed to sign out',
          details: error
        }
      }
    }
  },

  async getUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  },

  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession()

    // add session role name from public.users
    if (session?.user) {
      const { data: user, error } = await supabase.from('users').select('role').eq('id', session?.user?.id).single()
      session.user.role = user?.role || 'USER'
    }

    const sessionUser: SessionUser = {
      token: session?.access_token || '',
      session: session,
      user_id: session?.user?.id || '',
      name: session?.user?.user_metadata?.name || '',
      email: session?.user?.email || '',
      avatar_url: session?.user?.user_metadata?.avatar_url || '',
      role: session?.user?.role || 'USER',
      is_public: session?.user?.user_metadata?.is_public || false
    }

    return { sessionUser, error }
  },


  async updateProfile(name: string, isPublic?: boolean, avatarUrl?: string) {
    const isPublicValue = Boolean(isPublic);
    console.log('Starting updateProfile with:', { name, isPublic: isPublicValue, avatarUrl });

    try {
      // First, update the user's metadata
      const updateData: any = {
        data: {
          name: name,
          is_public: isPublicValue
        }
      };

      // Only add avatar_url if it's provided
      if (avatarUrl) {
        updateData.data.avatar_url = avatarUrl;
      }

      console.log('Sending update data:', JSON.stringify(updateData, null, 2));

      // Update user with metadata
      const { data: userData, error: userError } = await supabase.auth.updateUser(updateData);
      
      if (userError) {
        console.error('Error updating user metadata:', userError);
        return { data: null, error: userError };
      }

      console.log('Successfully updated user metadata:', userData);
      
      return { data: userData, error: null };
      
    } catch (error) {
      console.error('Unexpected error in updateProfile:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error occurred') 
      };
    }
  },

  async updatePassword(newPassword: string) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    })
    return { data, error }
  }
}
