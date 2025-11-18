import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { authService } from '@/services/supabase'

export async function authGuard(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  const { sessionUser } = await authService.getSession()

  // Jika route memerlukan auth
  if (to.meta.requiresAuth) {
    if (!sessionUser) {
      // Tidak ada session, redirect ke login
      next('/login')
    } else {
      // Ada session, lanjutkan
      next()
    }
  }
  // Jika route untuk guest (login/register)
  else if (to.meta.requiresGuest) {
    if (sessionUser) {
      // Sudah login, redirect ke home
      next('/home')
    } else {
      // Belum login, lanjutkan
      next()
    }
  }
  // Route lainnya
  else {
    next()
  }
}
