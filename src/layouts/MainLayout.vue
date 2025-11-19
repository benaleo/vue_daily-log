<script setup lang="ts">
import { watch, onUnmounted, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useChatRealtime } from '@/composables/chat/useChatRealtime'
import { useChatRooms } from '@/composables/chat/useChatRooms'
import { useChatEvents } from '@/composables/chat/useChatEvents'
import { authService, supabase } from '@/services/supabase'
import type { Session } from '@supabase/supabase-js'
import AppHeader from '@/components/AppHeader.vue'
import MenuBar from '@/components/MenuBar.vue'

const props = defineProps<{
  title?: string
  backButton?: {
    to: string
  }
  hideHeader?: boolean
}>()

const route = useRoute()

// Initialize chat realtime
const { start: startRealtime, stop: stopRealtime } = useChatRealtime()
const chatEvents = useChatEvents()

// Watch for title changes to update document title
watch(
  () => props.title || route.meta.title,
  (newTitle) => {
    if (newTitle) {
      document.title = `Diary Log${newTitle === 'Home' ? '' : ' - ' + newTitle}`
    }
  },
  { immediate: true }
)

// Initialize realtime on component mount
const authSubscription = ref<{ subscription: { unsubscribe: () => void } }>()

onMounted(async () => {
  const { sessionUser } = await authService.getSession()
  if (sessionUser?.user_id) {
    startRealtime(sessionUser.user_id, { 
      onRoomsChange: () => {
        // Trigger global refresh event
        chatEvents.triggerRefresh()
      }
    })
  }

  // Set up auth state change listener
  const { data } = supabase.auth.onAuthStateChange(
    async (event: string, session: Session | null) => {
      const userId = session?.user?.id
      if (userId) {
        startRealtime(userId, { 
          onRoomsChange: () => {
            // Trigger global refresh event
            chatEvents.triggerRefresh()
          }
        })
      } else {
        stopRealtime()
      }
    }
  )
  
  authSubscription.value = data
})

// Clean up realtime subscriptions when layout is destroyed
onUnmounted(() => {
  stopRealtime()
  // Unsubscribe from auth state changes
  if (authSubscription.value) {
    authSubscription.value.subscription.unsubscribe()
  }
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <div class="w-full max-w-md mx-auto bg-white min-h-screen flex flex-col">
      <AppHeader v-if="!hideHeader" :title="title || 'Diary Log'" :back-button="backButton" />
      
      <main class="flex-1 overflow-y-auto pb-16">
        <slot />
      </main>

      <MenuBar />
    </div>
  </div>
</template>
