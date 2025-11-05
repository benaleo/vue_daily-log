import { ref } from 'vue'
import { bannerService, type Banner } from '@/services/bannerService'

export function useBanners() {
  const banners = ref<Banner[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchBanners = async () => {
    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await bannerService.getAll()
      
      if (fetchError) throw fetchError
      
      banners.value = data || []
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch banners'
      banners.value = []
    } finally {
      loading.value = false
    }
  }

  const refresh = () => {
    return fetchBanners()
  }

  return {
    banners,
    loading,
    error,
    fetchBanners,
    refresh
  }
}
