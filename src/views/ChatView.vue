<script lang="ts" setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useChatRooms } from '@/composables/chat/useChatRooms'
import { toast } from 'vue-sonner'
import useUser from '@/composables/useUser'
import MainLayout from '@/layouts/MainLayout.vue'
import { supabase } from '@/services/supabase'

// Initialize composables inside setup
const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const { user } = useUser()

const { 
  rooms, 
  loading, 
  error: roomsError,
  searchQuery, 
  handleSearch,
  refresh: refreshRooms 
} = useChatRooms()

// Set up real-time subscription for room updates
let subscription: any = null

// Watch for user changes to set up subscription
watch(() => user.value?.id, (newUserId) => {
  // Clean up existing subscription
  if (subscription) {
    supabase.removeChannel(subscription)
    subscription = null
  }

  // Set up new subscription if user is logged in
  if (newUserId) {
    setupRealtimeUpdates()
  }
}, { immediate: true })

// Set up real-time updates
const setupRealtimeUpdates = () => {
  if (!user.value?.id) return

  subscription = supabase
    .channel('rooms_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'chat_rooms',
        filter: `chat_room_users.user_id=eq.${user.value.id}`
      },
      () => {
        refreshRooms()
      }
    )
    .subscribe()
}

// Clean up on unmount
onUnmounted(() => {
  if (subscription) {
    supabase.removeChannel(subscription)
  }
})

onUnmounted(() => {
  if (subscription) {
    supabase.removeChannel(subscription)
  }
})

const selectRoom = (room: any) => {
  router.push({
    name: 'chat-room',
    params: { roomId: room.id },
    query: { type: room.room_type.toLowerCase() }
  })
}

const createNewChat = () => {
  toast.info(t('chat.coming_soon'))
}

const getInitials = (name: string) => {
  if (!name) return '??'
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
  const now = new Date()
  
  // If today, show time
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  
  // If yesterday, show 'Yesterday'
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) {
    return t('time.yesterday')
  }
  
  // If within the last week, show day name
  const lastWeek = new Date(now)
  lastWeek.setDate(lastWeek.getDate() - 7)
  if (date > lastWeek) {
    return date.toLocaleDateString([], { weekday: 'short' })
  }
  
  // Otherwise, show date
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

const getOtherUser = (room: any) => {
  if (!room.users || !user.value) return null
  return room.users.find((u: any) => u.id !== user.value?.id) || null
}

const getRoomDisplayName = (room: any) => {
  if (room.room_type === 'PRIVATE') {
    const otherUser = getOtherUser(room)
    return otherUser?.full_name || otherUser?.email || t('chat.unknown_user')
  }
  return room.name
}

const getRoomAvatar = (room: any) => {
  if (room.room_type === 'PRIVATE') {
    const otherUser = getOtherUser(room)
    return otherUser?.avatar_url || ''
  }
  return room.avatar
}
</script>


<template>
  <MainLayout title="Chat">
    <div class="h-full flex flex-col bg-white dark:bg-gray-900">
      <div class="p-4 border-b dark:border-gray-700">
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-bold dark:text-white">{{ $t('chat.messages') }}</h1>
          <button
            @click="createNewChat"
            class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            :title="$t('chat.new_chat')"
          >
            <svg class="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
        
        <div class="mt-4 relative">
          <input
            v-model="searchQuery"
            @input="handleSearch"
            type="text"
            :placeholder="$t('chat.search_placeholder')"
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
    
    <div v-else-if="roomsError" class="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <svg
        class="h-12 w-12 text-red-500 mb-4"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <h3 class="text-lg font-medium text-gray-900 dark:text-white">{{ $t('chat.load_error') }}</h3>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ $t('chat.load_error_message') }}</p>
      <button
        @click="refreshRooms"
        class="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        {{ $t('common.retry') }}
      </button>
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
        class="p-4 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors flex items-center"
        :class="{ 'bg-blue-50 dark:bg-gray-800': route.params.roomId === room.id }"
      >
        <!-- Avatar -->
        <div class="relative flex-shrink-0">
          <div v-if="getRoomAvatar(room)" class="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
            <img :src="getRoomAvatar(room)" :alt="getRoomDisplayName(room)" class="w-full h-full object-cover" />
          </div>
          <div v-else class="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
            {{ getInitials(getRoomDisplayName(room)) }}
          </div>
          <div class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
        </div>
        
        <!-- Room info -->
        <div class="ml-3 flex-1 min-w-0">
          <div class="flex items-center justify-between">
            <h3 class="font-medium text-gray-900 dark:text-white truncate">
              {{ getRoomDisplayName(room) }}
            </h3>
            <span class="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-2">
              {{ formatTime(room.last_message_at || room.created_at) }}
            </span>
          </div>
          
          <div class="flex items-center justify-between mt-1">
            <p class="text-sm text-gray-500 dark:text-gray-400 truncate">
              {{ room.last_message || $t('chat.no_messages') }}
            </p>
            <span v-if="room.unread_count" class="bg-blue-500 text-white text-xs font-medium rounded-full h-5 w-5 flex items-center justify-center">
              {{ room.unread_count > 9 ? '9+' : room.unread_count }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</MainLayout>
</template>