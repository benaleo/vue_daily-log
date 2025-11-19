<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useUserSearch } from '@/composables/useUserSearch'
import { useChatRooms } from '@/composables/chat/useChatRooms'
import { toast } from 'vue-sonner'

interface User {
  id: string
  name: string
  email?: string
  avatar_url: string | null
}

interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()


const emit = defineEmits(['update:modelValue'])
const router = useRouter()
const { t } = useI18n()
const searchQuery = ref('')
const { createRoom } = useChatRooms() as { createRoom: (data: {
  name: string
  type: 'PRIVATE' | 'CHANNEL'
  userIds: string[]
}) => Promise<any> }

const { 
  searchResults, 
  isLoading, 
  error, 
  hasMore, 
  searchUsers, 
  resetSearch: resetUserSearch, 
  loadMore 
} = useUserSearch()

// Debounce search
let searchTimeout: number | null = null
watch(searchQuery, (newQuery) => {
  if (searchTimeout) clearTimeout(searchTimeout)
  
  if (newQuery.length >= 3) {
    searchTimeout = setTimeout(() => {
      searchUsers(newQuery, 1)
    }, 300)
  } else {
    resetUserSearch()
  }
})

const resetSearch = () => {
  searchQuery.value = ''
  resetUserSearch()
}

const closeDrawer = () => {
  isOpen.value = false
  resetSearch()
}

const handleSelectUser = async (user: User) => {
  try {
    const room = await createRoom({
      name: `${user.name}'s Chat`,
      type: 'PRIVATE',
      userIds: [user.id],
    })
    
    if (room) {
      router.push({
        name: 'chat-room',
        params: { roomId: room.id },
        query: { type: 'PRIVATE' }
      })
      closeDrawer()
    }
  } catch (error) {
    console.error('Error creating chat room:', error)
    toast.error(t('chat.create_room_error'))
  }
}

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})
</script>

<template>
  <!-- Drawer Overlay -->
  <div 
    v-if="isOpen"
    class="fixed inset-0 z-50 bg-black bg-opacity-50 transition-opacity duration-300"
    @click="closeDrawer"
  ></div>

  <!-- Drawer Content -->
  <aside 
    class="fixed top-0 right-0 z-50 w-full max-w-md h-screen bg-white shadow-lg transform transition-transform duration-300 ease-in-out"
    :class="{ 'translate-x-0': isOpen, 'translate-x-full': !isOpen }"
    @click.stop
  >
    <div class="p-4 h-full flex flex-col">
      <!-- Header -->
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-bold text-gray-900">{{ $t('chat.new_chat') }}</h2>
        <button 
          @click="closeDrawer"
          class="text-gray-500 hover:text-gray-700"
          :aria-label="$t('common.close')"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Search Input -->
      <div class="relative mb-6">
        <div class="relative">
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="$t('chat.search_people_placeholder')"
            class="w-full px-4 py-2 pl-10 pr-10 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            @keyup.enter="searchUsers(searchQuery, 1)"
          >
          <!-- Search Icon -->
          <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <!-- Clear Button -->
          <button
            v-if="searchQuery"
            @click="resetSearch"
            class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
            :aria-label="$t('common.clear')"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p v-if="searchQuery.length > 0 && searchQuery.length < 3" class="mt-1 text-xs text-gray-500">
          {{ $t('chat.type_min_chars', { count: 3 }) }}
        </p>
      </div>

      <!-- Search Results -->
      <div class="flex-1 overflow-y-auto">
        <div v-if="isLoading && searchResults.length === 0" class="flex justify-center py-4">
          <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>

        <div v-else-if="searchResults.length > 0" class="space-y-3">
          <div 
            v-for="user in searchResults as User[]" 
            :key="user.id"
            @click="handleSelectUser(user)"
            class="flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
          >
            <img 
              :src="user.avatar_url || '/img.jpg'" 
              :alt="user.name"
              class="w-10 h-10 rounded-full object-cover mr-3"
            >
            <div class="flex-1">
              <div class="text-sm font-medium text-gray-900">{{ user.name }}</div>
              <div v-if="user.email" class="text-xs text-gray-500">{{ user.email }}</div>
            </div>
          </div>
          
          <div v-if="error" class="p-4 text-red-600 text-sm">
            {{ error }}
          </div>

          <!-- Load More Button -->
          <div v-if="hasMore" class="flex justify-center pt-2">
            <button
              @click="() => loadMore(searchQuery)"
              :disabled="isLoading"
              class="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
            >
              {{ isLoading ? $t('common.loading') : $t('common.load_more') }}
            </button>
          </div>
        </div>

        <div v-else-if="searchQuery.length >= 3 && !isLoading" class="text-center py-8 text-gray-500">
          {{ $t('chat.no_results', { query: searchQuery }) }}
        </div>

        <div v-else class="text-center py-8 text-gray-400">
          <svg class="mx-auto h-12 w-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p>{{ $t('chat.search_people_instructions') }}</p>
          <p class="text-sm mt-1">{{ $t('chat.type_min_chars', { count: 3 }) }}</p>
        </div>
      </div>
    </div>
  </aside>
</template>
