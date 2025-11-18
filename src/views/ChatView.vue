<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useChatRooms } from '@/composables/chat/useChatRooms'
import { chatWebSocket } from '@/lib/supabase/websocket'
import { toast } from 'vue-sonner'
import useUser from '@/composables/useUser'
import MainLayout from '@/layouts/MainLayout.vue'

// Initialize composables inside setup
const router = useRouter()
const { t } = useI18n()
const { user } = useUser()
const selectedRoomId = ref<string | null>(null)

const { 
  rooms, 
  loading, 
  searchQuery, 
  handleSearch,
  refresh: refreshRooms 
} = useChatRooms()

onMounted(() => {
  if (!user.value?.id) return
  
  const unsubscribe = chatWebSocket.subscribeToRooms(user.value.id, (payload) => {
    refreshRooms()
    if (payload.eventType === 'INSERT') {
      toast.success(t('chat.new_message', { room: payload.new.name }))
    }
  })

  onUnmounted(() => {
    unsubscribe()
  })
})

const selectRoom = (room: any) => {
  selectedRoomId.value = room.id
  // You can navigate to the specific chat room or open a chat panel
  // router.push(`/chat/${room.id}`)
}

const createNewChat = () => {
  toast.info(t('chat.coming_soon'))
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

const formatTime = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
</script>


<template>
  <MainLayout title="Chat">
    <div class="h-full flex flex-col bg-white dark:bg-gray-900">
    <div class="p-4 border-b dark:border-gray-700">
      <h1 class="text-2xl font-bold dark:text-white">Messages</h1>
      <div class="mt-4 relative">
        <input
          v-model="searchQuery"
          @input="handleSearch"
          type="text"
          placeholder="Search"
          class="w-full p-2 pl-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <svg
          class="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </div>
    </div>

    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>

    <div v-else-if="!rooms.length" class="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <svg
        class="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4"
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
      <h3 class="text-lg font-medium text-gray-900 dark:text-white">{{ $t('chat.no_conversations') }}</h3>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ $t('chat.start_conversation') }}</p>
      <button
        @click="createNewChat"
        class="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <svg
          class="-ml-1 mr-2 h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M5 12h14" />
          <path d="M12 5v14" />
        </svg>
        {{ $t('chat.new_chat') }}
      </button>
    </div>

    <div v-else class="flex-1 overflow-y-auto">
      <div
        v-for="room in rooms"
        :key="room.id"
        @click="selectRoom(room)"
        class="p-4 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
        :class="{ 'bg-blue-50 dark:bg-gray-800': selectedRoomId === room.id }"
      >
        <div class="flex items-center space-x-3">
          <div class="flex-shrink-0">
            <div class="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <span class="text-gray-600 dark:text-gray-300 font-medium">{{ getInitials(room.name) }}</span>
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ room.name }}</p>
            <p class="text-sm text-gray-500 dark:text-gray-400 truncate">{{ room.last_message || $t('chat.no_messages') }}</p>
          </div>
          <div class="flex flex-col items-end">
            <span class="text-xs text-gray-500 dark:text-gray-400">{{ room.last_message_at ? formatTime(room.last_message_at) : '' }}</span>
            <span
              v-if="room.unread_count"
              class="mt-1 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
            >
              {{ room.unread_count }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
  </MainLayout>
</template>