import { supabase } from '@/services/supabase'

interface SubscriptionCallback {
  (payload: any): void
}

export const chatWebSocket = {
  // Membership changes for a user's rooms
  subscribeToUserRoomMembership(userId: string, callback: SubscriptionCallback) {
    console.log('[WS] subscribeToUserRoomMembership start', { userId })
    const channel = supabase
      .channel(`membership_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_room_users',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[WS] membership change', payload)
          callback(payload)
        }
      )
      .subscribe((status) => {
        console.log('[WS] membership status', status)
      })

    return () => {
      try { channel.unsubscribe() } catch {}
    }
  },

  // Room-specific message inserts
  subscribeToRoomMessages(roomId: string, callback: SubscriptionCallback) {
    console.log('[WS] subscribeToRoomMessages start', { roomId })
    const channel = supabase
      .channel(`room_${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          console.log('[WS] room message insert', payload)
          callback(payload)
        }
      )
      .subscribe((status) => {
        console.log('[WS] room status', status)
      })

    return () => {
      try { channel.unsubscribe() } catch {}
    }
  },

  // User broadcast channel for cross-room signals (e.g., new_message)
  subscribeToUserTopic(userId: string, callback: SubscriptionCallback) {
    console.log('[WS] subscribeToUserTopic start', { userId })
    const channel = supabase
      .channel(`user_${userId}`)
      .on('broadcast', { event: 'new_message' }, (payload) => {
        console.log('[WS] user topic new_message', payload)
        callback(payload)
      })
      .subscribe((status) => {
        console.log('[WS] user topic status', status)
      })

    return () => {
      try { channel.unsubscribe() } catch {}
    }
  },
}
