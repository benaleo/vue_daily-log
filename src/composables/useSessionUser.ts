import { ref, computed, onMounted } from 'vue'
import { supabase, authService, type SessionUser } from '@/services/supabase'

const defaultSessionUser: SessionUser = {
  token: '',
  session: null,
  user_id: '',
  name: '',
  email: '',
  avatar_url: '',
  role: 'USER',
  is_public: false,
}

const sessionUser = ref<SessionUser>({ ...defaultSessionUser })
const isLoading = ref(false)
const error = ref<Error | null>(null)
let initialized = false
let inflight: Promise<SessionUser | null> | null = null

async function fetchSession(): Promise<SessionUser | null> {
  try {
    isLoading.value = true
    const { sessionUser: s } = await authService.getSession()
    sessionUser.value = s
    return s
  } catch (e) {
    error.value = e as Error
    return null
  } finally {
    isLoading.value = false
  }
}

async function ensureSession(): Promise<SessionUser | null> {
  if (sessionUser.value.user_id) return sessionUser.value
  if (inflight) return inflight
  inflight = fetchSession().finally(() => { inflight = null })
  return inflight
}

function initAuthListener() {
  if (initialized) return
  initialized = true
  supabase.auth.onAuthStateChange(async () => {
    await fetchSession()
  })
}

export function useSessionUser() {
  onMounted(() => {
    initAuthListener()
  })

  return {
    sessionUser,
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    ensureSession,
    refresh: fetchSession,
    isAuthenticated: computed(() => !!sessionUser.value.user_id),
  }
}

export default useSessionUser
