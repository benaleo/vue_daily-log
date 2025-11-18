import { supabase } from '@/services/supabase'

export interface ChatRoom {
  id: string
  name: string
  avatar: string | null
  description: string | null
  room_type: 'PRIVATE' | 'CHANNEL'
  last_message_at: string | null
  unread_count?: number
  last_message?: string
}

export const chatService = {
  async getChatRooms(userId: string, search = ''): Promise<ChatRoom[]> {
    let query = supabase
      .from('chat_rooms')
      .select(`
        *,
        chat_room_users!inner(
          user_id
        ),
        chat_messages!chat_messages_room_id_fkey(
          content,
          created_at
        )
      `)
      .eq('chat_room_users.user_id', userId)
      .order('last_message_at', { ascending: false })

    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    const { data, error } = await query

    if (error) throw error

    return (data || []).map((room: any) => ({
      ...room,
      last_message: room.chat_messages?.[0]?.content,
      last_message_at: room.chat_messages?.[0]?.created_at || room.created_at
    }))
  }
}
