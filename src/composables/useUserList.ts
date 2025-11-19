import { ref } from 'vue'
import { getUsersByType } from '@/services/userService'

export function useUserList() {
  const users = ref<any[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const hasMore = ref(true)
  const page = ref(1)
  const perPage = 10

  const fetchUsers = async (userId: string, type: 'followers' | 'following') => {
    if (loading.value) return

    loading.value = true
    error.value = null

    try {
      const response = await getUsersByType(userId, type, page.value, perPage)
      users.value = [...users.value, ...response.data]
      hasMore.value = response.data.length === perPage
      page.value++
    } catch (err: any) {
      error.value = err.message || 'Failed to load users'
    } finally {
      loading.value = false
    }
  }

  const resetPagination = () => {
    users.value = []
    page.value = 1
    hasMore.value = true
  }

  return {
    users,
    loading,
    error,
    hasMore,
    fetchUsers,
    resetPagination
  }
}
