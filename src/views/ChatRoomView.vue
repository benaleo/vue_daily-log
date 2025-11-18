<script lang="ts" setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useChatRoom } from '@/composables/chat/useChatRoomMessages'
import useUser from '@/composables/useUser'
import MainLayout from '@/layouts/MainLayout.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { user } = useUser()

const showMenu = ref(false)
const { 
  room, 
  messages, 
  loading, 
  newMessage, 
  otherUser, 
  sendMessage, 
  scrollToBottom,
  error
} = useChatRoom()

const handleSendMessage = async () => {
  if (!newMessage.value.trim()) return
  await sendMessage()
  scrollToBottom()
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSendMessage()
  }
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
  <MainLayout :title="room?.name || 'Chat'">
    <div class="flex flex-col h-full bg-white dark:bg-gray-900">
      <!-- Header -->
      <div class="flex items-center p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-0 z-10">
        <button 
          @click="router.back()" 
          class="mr-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 md:hidden"
        >
          <svg class="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div v-if="otherUser" class="flex items-center flex-1">
          <div class="relative">
            <div v-if="otherUser.avatar_url" class="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
              <img :src="otherUser.avatar_url" :alt="otherUser.full_name" class="w-full h-full object-cover" />
            </div>
            <div v-else class="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
              {{ getInitials(otherUser.full_name || otherUser.email) }}
            </div>
            <div class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
          </div>
          <div class="ml-3">
            <h2 class="font-medium text-gray-900 dark:text-white">{{ otherUser.full_name || otherUser.email }}</h2>
            <p class="text-xs text-gray-500 dark:text-gray-400">Online</p>
          </div>
        </div>
        
        <div class="ml-auto flex items-center">
          <button 
            @click="showMenu = !showMenu" 
            class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 relative"
          >
            <svg class="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
            
            <!-- Dropdown menu -->
            <div 
              v-if="showMenu" 
              class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-20"
              v-click-outside="() => showMenu = false"
            >
              <a href="#" class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                {{ $t('chat.menu.view_profile') }}
              </a>
              <a href="#" class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                {{ $t('chat.menu.clear_chat') }}
              </a>
              <a href="#" class="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700">
                {{ $t('chat.menu.end_chat') }}
              </a>
            </div>
          </button>
        </div>
      </div>
      
      <!-- Messages -->
      <div 
        v-if="loading" 
        class="flex-1 flex items-center justify-center"
      >
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
      
      <div 
        v-else 
        class="flex-1 overflow-y-auto p-4 space-y-4 messages-container"
      >
        <div 
          v-for="message in messages" 
          :key="message.id"
          :class="{
            'flex justify-end': message.user_id === user?.id,
            'flex': message.user_id !== user?.id
          }"
        >
          <div 
            :class="{
              'bg-blue-500 text-white rounded-l-xl rounded-br-xl': message.user_id === user?.id,
              'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-r-xl rounded-bl-xl': message.user_id !== user?.id,
              'max-w-xs md:max-w-md lg:max-w-lg xl:max-w-2xl px-4 py-2': true
            }"
          >
            <p class="text-sm">{{ message.content }}</p>
            <p class="text-xs mt-1 text-right opacity-75">
              {{ formatTime(message.created_at) }}
            </p>
          </div>
        </div>
      </div>
      
      <!-- Message input -->
      <div class="p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-800">
        <form @submit.prevent="handleSendMessage" class="flex items-end space-x-2">
          <button type="button" class="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          
          <div class="flex-1 relative">
            <textarea
              v-model="newMessage"
              @keydown="handleKeyDown"
              :placeholder="$t('chat.type_message')"
              class="w-full px-4 py-2 pr-10 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows="1"
              style="min-height: 44px; max-height: 120px;"
            ></textarea>
            
            <button 
              type="button" 
              @click="handleSendMessage"
              class="absolute right-2 bottom-2 p-1 text-blue-500 hover:text-blue-600 dark:hover:text-blue-400"
              :disabled="!newMessage.trim()"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  </MainLayout>
</template>

<style scoped>
.messages-container {
  scroll-behavior: smooth;
}

/* Custom scrollbar */
.messages-container::-webkit-scrollbar {
  width: 6px;
}

.messages-container::-webkit-scrollbar-track {
  background: transparent;
}

.messages-container::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 20px;
}

.dark .messages-container::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.1);
}
</style>
