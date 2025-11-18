<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg w-full max-w-md max-h-[80vh] flex flex-col">
      <div class="p-4 border-b flex justify-between items-center">
        <h3 class="text-lg font-medium">{{ title }}</h3>
        <button @click="close" class="text-gray-500 hover:text-gray-700">
          &times;
        </button>
      </div>
      
      <div class="overflow-y-auto flex-1">
        <div v-if="loading && users.length === 0" class="p-4 text-center">
          <div class="flex justify-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </div>
        
        <div v-else-if="error" class="p-4 text-red-500 text-center">
          {{ error }}
        </div>
        
        <div v-else-if="users.length === 0" class="p-4 text-center text-gray-500">
          No users found
        </div>
        
        <ul v-else>
          <li v-for="user in users" :key="user.id" class="p-4 border-b hover:bg-gray-50">
            <div class="flex items-center">
              <img :src="user.avatar_url || '/img.jpg'" class="w-10 h-10 rounded-full mr-3" />
              <div>
                <p class="font-medium">{{ user.name }}</p>
                <p class="text-sm text-gray-500">{{ user.email }}</p>
              </div>
            </div>
          </li>
        </ul>

        <div v-if="!loading && hasMore" class="p-4 text-center">
          <button 
            @click="loadMore" 
            :disabled="loading"
            class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {{ loading ? 'Loading...' : 'Load More' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useUserList } from '@/composables/useUserList'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  type: {
    type: String as () => 'followers' | 'following',
    required: true
  }
})

const emit = defineEmits(['close'])

const { users, loading, error, hasMore, fetchUsers, resetPagination } = useUserList()

const title = computed(() => 
  props.type === 'followers' ? 'Followers' : 'Following'
)

const loadUsers = async () => {
  await fetchUsers(props.userId, props.type)
}

const loadMore = async () => {
  await loadUsers()
}

const close = () => {
  emit('close')
  resetPagination()
}

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    resetPagination()
    loadUsers()
  }
}, { immediate: true })
</script>

<style scoped>
.overflow-y-auto {
  scrollbar-width: thin;
  scrollbar-color: #e2e8f0 transparent;
}

.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: #e2e8f0;
  border-radius: 3px;
}
</style>
