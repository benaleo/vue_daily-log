import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { toast } from 'vue-sonner'
import { chatRoomService } from '@/services/chatRoomService'
import { useUser } from '@/composables/useUser'

export function useCreateChatRoom() {
  const router = useRouter()
  const { t } = useI18n()
  const { getCurrentUser } = useUser()
  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  const createPrivateChat = async (toUserId: string) => {
    try {
      isLoading.value = true
      error.value = null
      
      const currentUser = await getCurrentUser()
      
      if (!currentUser?.id) {
        toast.error(t('auth.please_login'))
        return null
      }

      const result = await chatRoomService.findOrCreatePrivateRoom({
        fromId: currentUser.id,
        toId: toUserId,
      })
      
      if (!result?.room?.id) {
        throw new Error('Failed to create or find chat room')
      }

      return result.room.id
    } catch (err) {
      console.error('Error creating chat room:', err)
      error.value = err instanceof Error ? err : new Error('Unknown error occurred')
      toast.error(t('chat.create_room_error'))
      return null
    } finally {
      isLoading.value = false
    }
  }

  const navigateToChatRoom = (roomId: string) => {
    if (!roomId) return
    
    getCurrentUser().then(currentUser => {
      if (currentUser?.id) {
        router.push(`/chat/${currentUser.id}/${roomId}?type=PRIVATE`)
      }
    })
  }

  return {
    createPrivateChat,
    navigateToChatRoom,
    isLoading,
    error
  }
}
