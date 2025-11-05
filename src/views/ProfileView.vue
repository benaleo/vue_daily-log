<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import { authService } from '@/services/supabase'

const router = useRouter()

const user = ref({
  name: '',
  email: '',
  avatar: ''
})

const showEditProfile = ref(false)
const showEditPassword = ref(false)

const editName = ref('')
const editAvatar = ref('')

const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

const errorMessage = ref('')
const successMessage = ref('')

onMounted(async () => {
  await loadUserData()
})

const loadUserData = async () => {
  const { session } = await authService.getSession()
  if (session?.user) {
    user.value = {
      name: session.user.user_metadata?.name || 'User',
      email: session.user.email || '',
      avatar: session.user.user_metadata?.avatar_url || 'https://via.placeholder.com/120/6366f1/ffffff?text=User'
    }
  }
}

const openEditProfile = () => {
  editName.value = user.value.name
  editAvatar.value = user.value.avatar
  showEditProfile.value = true
  errorMessage.value = ''
  successMessage.value = ''
}

const saveProfile = async () => {
  try {
    const { error } = await authService.updateProfile(editName.value, editAvatar.value)
    if (error) throw error
    
    successMessage.value = 'Profile berhasil diupdate'
    await loadUserData()
    
    setTimeout(() => {
      showEditProfile.value = false
      successMessage.value = ''
    }, 1500)
  } catch (error: any) {
    errorMessage.value = error.message || 'Gagal update profile'
  }
}

const openEditPassword = () => {
  oldPassword.value = ''
  newPassword.value = ''
  confirmPassword.value = ''
  showEditPassword.value = true
  errorMessage.value = ''
  successMessage.value = ''
}

const savePassword = async () => {
  errorMessage.value = ''
  
  if (!oldPassword.value || !newPassword.value || !confirmPassword.value) {
    errorMessage.value = 'Semua field harus diisi'
    return
  }
  
  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = 'Password baru dan konfirmasi tidak sama'
    return
  }
  
  if (newPassword.value.length < 6) {
    errorMessage.value = 'Password minimal 6 karakter'
    return
  }

  try {
    // Note: Supabase doesn't verify old password, you'd need custom logic for that
    const { error } = await authService.updatePassword(newPassword.value)
    if (error) throw error
    
    successMessage.value = 'Password berhasil diubah'
    
    setTimeout(() => {
      showEditPassword.value = false
      successMessage.value = ''
    }, 1500)
  } catch (error: any) {
    errorMessage.value = error.message || 'Gagal ubah password'
  }
}

const handleLogout = async () => {
  if (confirm('Apakah Anda yakin ingin logout?')) {
    await authService.logout()
    router.push('/login')
  }
}
</script>

<template>
  <MainLayout title="Profile">
    <div class="p-4 space-y-4">
      <!-- User Card -->
      <div class="bg-white rounded-lg shadow p-6 border border-gray-200">
        <div class="flex flex-col items-center">
          <img 
            :src="user.avatar" 
            :alt="user.name"
            class="w-24 h-24 rounded-full object-cover border-4 border-blue-100"
          >
          <h2 class="mt-4 text-xl font-bold text-gray-900">{{ user.name }}</h2>
          <p class="text-gray-600 mt-1">{{ user.email }}</p>
        </div>
      </div>

      <!-- Edit Profile Button -->
      <button 
        @click="openEditProfile"
        class="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
        Edit Profile
      </button>

      <!-- Edit Password Button -->
      <button 
        @click="openEditPassword"
        class="w-full py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium flex items-center justify-center gap-2"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        Edit Password
      </button>

      <!-- Logout Button -->
      <button 
        @click="handleLogout"
        class="fixed bottom-20 left-4 right-4 max-w-md mx-auto py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center justify-center gap-2"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        Logout
      </button>
    </div>

    <!-- Edit Profile Modal -->
    <Teleport to="body">
      <div 
        v-if="showEditProfile"
        class="fixed inset-0 z-[100] bg-black bg-opacity-50 flex items-center justify-center p-4"
        @click.self="showEditProfile = false"
      >
        <div class="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
          <div class="flex justify-between items-center">
            <h2 class="text-xl font-bold text-gray-900">Edit Profile</h2>
            <button @click="showEditProfile = false" class="text-gray-500 hover:text-gray-700">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div v-if="errorMessage" class="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
            {{ errorMessage }}
          </div>

          <div v-if="successMessage" class="bg-green-50 text-green-600 p-3 rounded-lg text-sm">
            {{ successMessage }}
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Name</label>
            <input 
              v-model="editName"
              type="text" 
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Avatar URL</label>
            <input 
              v-model="editAvatar"
              type="url" 
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://example.com/avatar.jpg"
            >
          </div>

          <div class="flex gap-3 pt-4">
            <button 
              @click="showEditProfile = false"
              class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Batal
            </button>
            <button 
              @click="saveProfile"
              class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Simpan
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Edit Password Modal -->
    <Teleport to="body">
      <div 
        v-if="showEditPassword"
        class="fixed inset-0 z-[100] bg-black bg-opacity-50 flex items-center justify-center p-4"
        @click.self="showEditPassword = false"
      >
        <div class="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
          <div class="flex justify-between items-center">
            <h2 class="text-xl font-bold text-gray-900">Edit Password</h2>
            <button @click="showEditPassword = false" class="text-gray-500 hover:text-gray-700">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div v-if="errorMessage" class="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
            {{ errorMessage }}
          </div>

          <div v-if="successMessage" class="bg-green-50 text-green-600 p-3 rounded-lg text-sm">
            {{ successMessage }}
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Password Lama</label>
            <input 
              v-model="oldPassword"
              type="password" 
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Password Baru</label>
            <input 
              v-model="newPassword"
              type="password" 
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Konfirmasi Password Baru</label>
            <input 
              v-model="confirmPassword"
              type="password" 
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
          </div>

          <div class="flex gap-3 pt-4">
            <button 
              @click="showEditPassword = false"
              class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Batal
            </button>
            <button 
              @click="savePassword"
              class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Simpan
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </MainLayout>
</template>
