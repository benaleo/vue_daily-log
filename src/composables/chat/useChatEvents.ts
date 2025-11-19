import { ref } from 'vue'

// Global event emitter for chat events
const chatEvents = {
  refreshRooms: ref<(() => void) | null>(null),
  
  setRefreshCallback(callback: () => void) {
    this.refreshRooms.value = callback
  },
  
  clearRefreshCallback() {
    this.refreshRooms.value = null
  },
  
  triggerRefresh() {
    this.refreshRooms.value?.()
  }
}

export function useChatEvents() {
  return chatEvents
}
