import { ref, onMounted, onUnmounted, watch } from 'vue'
import { chatService, type ChatRoom } from '@/services/chatService'
import useUser from '../useUser'
import { authService } from '@/services/supabase'

export function useChatRooms() {
  const { user } = useUser()
  const rooms = ref<ChatRoom[]>([])
  const loading = ref(false)
  const error = ref<Error | null>(null)
  const searchQuery = ref('')
  let searchTimeout: number

  const fetchRooms = async () => {
    const {sessionUser} = await authService.getSession()
    if (!sessionUser) {
      loading.value = false
      return
    }
    
    try {
      error.value = null
      loading.value = true
      const result = await chatService.getChatRooms(sessionUser.user_id, searchQuery.value)
      // Only include rooms with non-empty message history
      rooms.value = (result || []).filter(r => !!(r.last_message && r.last_message.trim()) || !!r.last_message_at)
    } catch (err) {
      console.error('Error fetching chat rooms:', err)
      error.value = err instanceof Error ? err : new Error('Failed to fetch chat rooms')
      rooms.value = []
      throw error.value
    } finally {
      loading.value = false
    }
  }

  // Watch for user changes
  watch(() => user.value?.id, (newVal) => {
    if (newVal) {
      fetchRooms()
    } else {
      rooms.value = []
      loading.value = false
    }
  }, { immediate: true })

  // Debounce search
  const handleSearch = () => {
    clearTimeout(searchTimeout)
    searchTimeout = window.setTimeout(fetchRooms, 300)
  }

  onUnmounted(() => {
    clearTimeout(searchTimeout)
  })

  return {
    rooms,
    loading,
    error,
    searchQuery,
    handleSearch,
    refresh: fetchRooms
  }
}
