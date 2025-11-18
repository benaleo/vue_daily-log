import { supabase } from '@/services/supabase'

export interface ChatUser {
  id: string
  email: string
  full_name: string
  avatar_url?: string
}

export interface ChatMessage {
  id: string
  room_id: string
  user_id: string
  content: string
  created_at: string
  user: ChatUser
}

export interface ChatRoom {
  id: string
  name: string
  avatar: string | null
  description: string | null
  room_type: 'PRIVATE' | 'CHANNEL'
  last_message_at: string | null
  created_at: string
  unread_count?: number
  last_message?: string
  users?: ChatUser[]
}

export const chatService = {
  async getChatRooms(userId: string, search = ''): Promise<ChatRoom[]> {
    const { data, error } = await supabase
      .rpc('get_user_chat_rooms', { user_id: userId, search_query: search })

    if (error) throw error
    return data || []
  },

  async getChatRoom(roomId: string, userId: string): Promise<ChatRoom | null> {
    const { data, error } = await supabase
      .rpc('get_chat_room_with_users', { 
        p_room_id: roomId,
        p_user_id: userId
      })
      .single()

    if (error) throw error
    return data as unknown as ChatRoom | null
  },

  async getChatMessages(roomId: string): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from('chat_messages')
      .select(/* sql */`
        *,
        user:user_id (
          id,
          email,
          raw_user_meta_data->>'full_name' as full_name,
          raw_user_meta_data->'avatar_url' as avatar_url
        )
      `)
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return (data || []) as unknown as ChatMessage[]
  },

  async sendMessage(roomId: string, userId: string, content: string): Promise<void> {
    const { error } = await supabase
      .from('chat_messages')
      .insert({
        room_id: roomId,
        user_id: userId,
        content
      })

    if (error) throw error
  },

  async markMessagesAsRead(roomId: string, userId: string): Promise<void> {
    const { error } = await supabase.rpc('mark_messages_as_read', {
      p_room_id: roomId,
      p_user_id: userId
    })

    if (error) throw error
  }
}
