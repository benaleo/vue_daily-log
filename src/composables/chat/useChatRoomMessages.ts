import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { chatService, type ChatRoom, type ChatMessage, type ChatUser } from '@/services/chatService'
import { supabase } from '@/services/supabase'
import { useUser } from '@/composables/useUser'

export function useChatRoom() {
  const { t } = useI18n()
  const router = useRouter()
  const route = useRoute()
  const { user } = useUser()

  const room = ref<ChatRoom | null>(null)
  const messages = ref<ChatMessage[]>([])
  const loading = ref(true)
  const error = ref<Error | null>(null)
  const newMessage = ref('')
  const otherUser = computed<ChatUser | null>(() => {
    if (!room.value?.users || !user.value) return null
    return room.value.users.find(u => u.id !== user.value?.id) || null
  })

  const roomId = computed(() => route.params.roomId as string)

  const fetchRoom = async () => {
    if (!user.value?.id) {
      loading.value = false;
      return;
    }
    
    try {
      loading.value = true
      error.value = null
      
      const roomData = await chatService.getChatRoom(roomId.value, user.value.id)
      
      if (!roomData) {
        console.log('No room found, redirecting to chat list')
        router.push('/chat')
        return
      }
      
      room.value = roomData
      await fetchMessages()
    } catch (err) {
      console.error('Error in fetchRoom:', err)
      error.value = err as Error
      loading.value = false
    }
  }

  const fetchMessages = async () => {
    if (!roomId.value) {
      loading.value = false;
      return;
    }
    
    try {
      const fetchedMessages = await chatService.getChatMessages(roomId.value);
      messages.value = fetchedMessages || [];
      
      if (fetchedMessages) {
        await markMessagesAsRead();
        await nextTick();
        scrollToBottom();
      }
    } catch (err) {
      console.error('Error in fetchMessages:', err);
      error.value = err as Error;
    } finally {
      loading.value = false;
    }
  }

  const sendMessage = async () => {
    if (!newMessage.value.trim() || !user.value?.id || !roomId.value) return

    const content = newMessage.value.trim()
    newMessage.value = ''

    try {
      await chatService.sendMessage(roomId.value, user.value.id, content)
      await fetchMessages()
    } catch (err) {
      console.error('Error sending message:', err)
      // Optionally show error to user
    }
  }

  const markMessagesAsRead = async () => {
    if (!user.value?.id || !roomId.value) return
    
    try {
      await chatService.markMessagesAsRead(roomId.value, user.value.id)
    } catch (err) {
      console.error('Error marking messages as read:', err)
    }
  }

  const scrollToBottom = () => {
    nextTick(() => {
      const container = document.querySelector('.messages-container')
      if (container) {
        container.scrollTop = container.scrollHeight
      }
    })
  }

  // Set up real-time subscription
  let subscription: any = null
  
  const setupRealtime = () => {
    if (!roomId.value) return
    
    subscription = supabase
      .channel(`room_${roomId.value}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId.value}`
        },
        (payload) => {
          fetchMessages()
        }
      )
      .subscribe()
  }

  onMounted(async () => {
    await fetchRoom()
    setupRealtime()
  })

  onUnmounted(() => {
    if (subscription) {
      supabase.removeChannel(subscription)
    }
  })

  // Function to manually trigger room fetch
  const fetchRoomMessages = async () => {
    if (roomId.value) {
      await fetchRoom();
    }
  };

  // Initial fetch when the composable is used
  onMounted(() => {
    if (roomId.value) {
      fetchRoom();
    }
  });

  // Watch for route changes to handle page reloads
  watch(() => route.params.roomId as string | undefined, (newRoomId: string | undefined) => {
    if (newRoomId) {
      fetchRoom();
    }
  });

  return {
    room,
    messages,
    loading,
    error,
    newMessage,
    otherUser,
    sendMessage,
    scrollToBottom,
    fetchRoom: fetchRoomMessages
  }
}
