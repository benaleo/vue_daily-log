import { ref, computed, onMounted, onUnmounted, nextTick, watch, type Ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { chatService, type ChatRoom, type ChatMessage, type ChatUser } from '@/services/chatService'
import { supabase } from '@/services/supabase'
import { useUser } from '@/composables/useUser'
import { toast } from 'vue-sonner'

export function useChatRoom(userIdRef?: Ref<string | undefined>) {
  const { t } = useI18n()
  const router = useRouter()
  const route = useRoute()
  const { user: userFromHook } = useUser()
  const userId = computed(() => userIdRef?.value ?? userFromHook.value?.id)

  const room = ref<ChatRoom | null>(null)
  const messages = ref<ChatMessage[]>([])
  const loading = ref(true)
  const error = ref<Error | null>(null)
  const newMessage = ref('')
  const otherUser = computed<ChatUser | null>(() => {
    if (!room.value?.users || !userId.value) return null
    return room.value.users.find(u => u.id !== userId.value) || null
  })

  const roomId = computed(() => route.params.roomId as string)
  const fromId = computed(() => userId.value as string)
  const isPrivate = computed(() => (route.query.type as string) === 'PRIVATE')

  const fetchRoom = async () => {
    if (!userId.value) {
      loading.value = false;
      return;
    }
    
    try {
      loading.value = true
      error.value = null
      const roomData = await chatService.getChatRoomByRoomId(roomId.value)
      
      if (!roomData) {
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

  const markMessagesAsRead = async () => {
    if (!fromId.value || !roomId.value) return
    
    try {
      await chatService.markMessagesAsRead(roomId.value, fromId.value)
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

  // Expose a method to scroll to bottom that can be called from components
  const forceScrollToBottom = () => {
    setTimeout(() => {
      const container = document.querySelector('.messages-container')
      if (container) {
        container.scrollTop = container.scrollHeight
      }
    }, 100)
  }

  const fetchMessages = async () => {
    if (!roomId.value) {
      loading.value = false;
      return;
    }
    // Only fetch for private rooms if requested
    if (!isPrivate.value) return
    
    try {
      const room = await chatService.getChatRoomByRoomId(roomId.value)
      if(room) {
        const fetchedMessages = await chatService.getChatMessages(room?.id);
      messages.value = fetchedMessages || [];
      
      if (fetchedMessages) {
        await markMessagesAsRead();
      }
    }
    } catch (err) {
      console.error('Error in fetchMessages:', err);
      error.value = err as Error;
    } finally {
      loading.value = false;
      // Scroll to bottom after loading is complete and messages are rendered
      await nextTick();
      scrollToBottom();
    }
  }

  const sendMessage = async (contentOverride?: string) => {
    const content = contentOverride || newMessage.value.trim()
    
    if (!content) {
      toast.error('Please enter a message')
      return
    }
    if (!fromId.value) {
      toast.error('Please log in to send messages')
      return
    }
    if (!roomId.value) {
      toast.error('Please select a chat room')
      return
    }

    if (!contentOverride) {
      newMessage.value = ''
    }

    try {
      await chatService.sendMessagePrivate(roomId.value, fromId.value, content, "PRIVATE")
      await fetchMessages()
    } catch (err) {
      console.error('Error in sendMessage:', err)
      error.value = err as Error
      // Re-add the message to the input if sending failed
      newMessage.value = content
    }
  }

  // Set up real-time subscription
  let subscription: any = null
  
  const teardownRealtime = () => {
    if (subscription) {
      try { supabase.removeChannel(subscription) } catch {}
      subscription = null
    }
  }

  const setupRealtime = () => {
    teardownRealtime()
    if (!roomId.value) return
    // Subscribe only for private chats if requested
    if (!isPrivate.value) return
    
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
        () => {
          fetchMessages()
        }
      )
      .subscribe()
  }

  onMounted(async () => {
    // If userId already available, proceed; otherwise wait for watcher
    if (userId.value) {
      await fetchRoom()
      setupRealtime()
    }
  })

  onUnmounted(() => {
    teardownRealtime()
  })

  // Function to manually trigger room fetch
  const fetchRoomMessages = async () => {
    if (roomId.value) {
      await fetchRoom();
    }
  };

  // React when userId becomes ready
  watch(userId, async (newId) => {
    if (newId && roomId.value) {
      await fetchRoom()
      setupRealtime()
    }
  })

  // React to room changes or query type changes
  watch([() => route.params.roomId as string | undefined, () => route.query.type as string | undefined], async () => {
    if (roomId.value && userId.value) {
      await fetchRoom()
      setupRealtime()
    }
  })

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
    forceScrollToBottom,
    fetchRoom: fetchRoomMessages
  }
}
