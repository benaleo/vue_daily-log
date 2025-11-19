import { ref } from 'vue'
import { supabase } from '@/services/supabase'
import useSessionUser from './useSessionUser'

export interface User {
  id: string
  name: string
  avatar_url: string | null
}

export function useUserSearch() {
  const searchResults = ref<User[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const hasMore = ref(true)
  const currentPage = ref(1)
  const pageSize = 5

  const { sessionUser: session } = useSessionUser()

  const searchUsers = async (query: string, page: number = 1) => {
    if (!query.trim() || query.length < 3) {
      searchResults.value = []
      hasMore.value = true
      currentPage.value = 1
      return
    }

    try {
      isLoading.value = true
      error.value = null

      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      const { data, error: searchError, count } = await supabase
        .from('users')
        .select('id, name, avatar_url', { count: 'exact' })
        .ilike('name', `%${query}%`)
        .eq('is_public', true)
        .neq('id', session.value.user_id)
        .range(from, to)

      if (searchError) throw searchError

      if (page === 1) {
        searchResults.value = data || []
      } else {
        searchResults.value = [...searchResults.value, ...(data || [])]
      }

      hasMore.value = (count || 0) > to + 1
      currentPage.value = page
    } catch (err) {
      console.error('Error searching users:', err)
      error.value = 'Failed to search users. Please try again.'
    } finally {
      isLoading.value = false
    }
  }

  const resetSearch = () => {
    searchResults.value = []
    hasMore.value = true
    currentPage.value = 1
    error.value = null
  }

  const loadMore = async (query: string) => {
    if (!isLoading.value && hasMore.value) {
      await searchUsers(query, currentPage.value + 1)
    }
  }

  return {
    searchResults,
    isLoading,
    error,
    hasMore,
    currentPage,
    searchUsers,
    resetSearch,
    loadMore
  }
}
