import { supabase } from '@/services/supabase'

interface SubscriptionCallback {
  (payload: any): void
}

export const chatWebSocket = {
  subscribeToRooms(userId: string, callback: SubscriptionCallback) {
    const subscription = supabase
      .channel('room_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_rooms',
          filter: `chat_room_users=eq.${userId}`
        },
        (payload) => {
          callback(payload)
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }
}
