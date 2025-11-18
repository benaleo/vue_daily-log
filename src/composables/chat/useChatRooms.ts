import { ref, onMounted, onUnmounted } from 'vue'
import { chatService, type ChatRoom } from '@/services/chatService'
import useUser from '../useUser'

export function useChatRooms() {
  const { user } = useUser()
  const rooms = ref<ChatRoom[]>([])
  const loading = ref(true)
  const searchQuery = ref('')
  let searchTimeout: number

  const fetchRooms = async () => {
    if (!user.value?.id) return
    
    try {
      loading.value = true
      rooms.value = await chatService.getChatRooms(user.value.id, searchQuery.value)
    } catch (error) {
      console.error('Error fetching chat rooms:', error)
    } finally {
      loading.value = false
    }
  }

  // Debounce search
  const handleSearch = () => {
    clearTimeout(searchTimeout)
    searchTimeout = window.setTimeout(fetchRooms, 300)
  }

  onMounted(() => {
    if (user.value?.id) {
      fetchRooms()
    }
  })

  onUnmounted(() => {
    clearTimeout(searchTimeout)
  })

  return {
    rooms,
    loading,
    searchQuery,
    handleSearch,
    refresh: fetchRooms
  }
}
