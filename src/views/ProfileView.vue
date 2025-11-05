<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import { authService } from '@/services/supabase'
import { useImageUpload } from '@/composables/useImageUpload'
import { useBanners } from '@/composables/useBanners'
import { useOptionHistoryCategories } from '@/composables/useOptionHistoryCategories'
import { bannerService, type Banner } from '@/services/bannerService'
import { historyCategoryService, type HistoryCategory } from '@/services/historyCategoryService'
import BannerForm from '@/components/forms/BannerForm.vue'

const router = useRouter()

const user = ref({
  name: '',
  email: '',
  avatar: ''
})

const showEditProfile = ref(false)
const showEditPassword = ref(false)
const showBannerSettings = ref(false)
const showCategorySettings = ref(false)
const showBannerForm = ref(false)
const showCategoryForm = ref(false)
const selectedBanner = ref<Banner | null>(null)
const selectedCategory = ref<HistoryCategory | null>(null)
const categoryName = ref('')

const editName = ref('')
const editAvatar = ref('')
const avatarFile = ref<File | null>(null)
const avatarPreview = ref<string | null>(null)

const { uploading, uploadImage } = useImageUpload()
const { banners, fetchBanners: loadBanners } = useBanners()
const { categories, fetchCategories: loadCategories } = useOptionHistoryCategories()

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
      avatar: session.user.user_metadata?.avatar_url || '/img.jpg'
    }
  }
}

const openEditProfile = () => {
  editName.value = user.value.name
  editAvatar.value = user.value.avatar
  avatarFile.value = null
  avatarPreview.value = user.value.avatar
  showEditProfile.value = true
  errorMessage.value = ''
  successMessage.value = ''
}

const handleAvatarChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (file) {
    avatarFile.value = file
    
    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      avatarPreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

const saveProfile = async () => {
  try {
    let finalAvatarUrl = editAvatar.value
    
    // Upload avatar if file selected
    if (avatarFile.value) {
      const { session } = await authService.getSession()
      const email = session?.user?.email || 'anonymous'
      
      const result = await uploadImage(avatarFile.value, email, 'avatar')
      finalAvatarUrl = result.url
    }
    
    const { error } = await authService.updateProfile(editName.value, finalAvatarUrl)
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

// Banner Management
const openBannerSettings = async () => {
  await loadBanners()
  showBannerSettings.value = true
}

const openBannerCreate = () => {
  selectedBanner.value = null
  showBannerForm.value = true
}

const openBannerEdit = (banner: Banner) => {
  selectedBanner.value = banner
  showBannerForm.value = true
}

const handleBannerSubmit = async (data: { name: string; url: string }) => {
  try {
    if (selectedBanner.value) {
      const { error } = await bannerService.update(selectedBanner.value.id, data)
      if (error) throw error
    } else {
      const { error } = await bannerService.create(data)
      if (error) throw error
    }
    
    await loadBanners()
    showBannerForm.value = false
    selectedBanner.value = null
  } catch (error: any) {
    alert(error.message || 'Gagal menyimpan banner')
  }
}

const handleBannerDelete = async (id: number) => {
  if (!confirm('Yakin ingin menghapus banner ini?')) return
  
  try {
    const { error } = await bannerService.delete(id)
    if (error) throw error
    
    await loadBanners()
  } catch (error: any) {
    alert(error.message || 'Gagal menghapus banner')
  }
}

// Category Management
const openCategorySettings = async () => {
  await loadCategories()
  showCategorySettings.value = true
}

const openCategoryCreate = () => {
  selectedCategory.value = null
  categoryName.value = ''
  showCategoryForm.value = true
}

const openCategoryEdit = (category: HistoryCategory) => {
  selectedCategory.value = category
  categoryName.value = category.name
  showCategoryForm.value = true
}

const handleCategorySubmit = async () => {
  if (!categoryName.value) return
  
  try {
    if (selectedCategory.value) {
      const { error } = await historyCategoryService.update(selectedCategory.value.id, { name: categoryName.value })
      if (error) throw error
    } else {
      const { error } = await historyCategoryService.create({ name: categoryName.value })
      if (error) throw error
    }
    
    await loadCategories()
    showCategoryForm.value = false
    selectedCategory.value = null
    categoryName.value = ''
  } catch (error: any) {
    alert(error.message || 'Gagal menyimpan kategori')
  }
}

const handleCategoryDelete = async (id: number) => {
  if (!confirm('Yakin ingin menghapus kategori ini?')) return
  
  try {
    const { error } = await historyCategoryService.delete(id)
    if (error) throw error
    
    await loadCategories()
  } catch (error: any) {
    alert(error.message || 'Gagal menghapus kategori')
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

      <!-- Settings Section -->
      <div class="pt-4 space-y-3">
        <h3 class="text-lg font-semibold text-gray-900">Pengaturan</h3>
        
        <!-- Banner Settings Button -->
        <button 
          @click="openBannerSettings"
          class="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium flex items-center justify-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Kelola Banner
        </button>

        <!-- Category Settings Button -->
        <button 
          @click="openCategorySettings"
          class="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center justify-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          Kelola Kategori History
        </button>
      </div>

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
            <label class="block text-sm font-medium text-gray-700 mb-2">Upload Avatar</label>
            <input 
              type="file"
              accept="image/*"
              @change="handleAvatarChange"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
          </div>

          <div v-if="avatarPreview" class="mt-3">
            <img 
              :src="avatarPreview" 
              alt="Preview"
              class="w-24 h-24 rounded-full object-cover mx-auto border-4 border-blue-100"
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
              :disabled="uploading"
              class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {{ uploading ? 'Uploading...' : 'Simpan' }}
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

    <!-- Banner Settings Modal -->
    <Teleport to="body">
      <div 
        v-if="showBannerSettings"
        class="fixed inset-0 z-[100] bg-black bg-opacity-50 flex items-center justify-center p-4"
        @click.self="showBannerSettings = false"
      >
        <div class="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div class="flex justify-between items-center">
            <h2 class="text-xl font-bold text-gray-900">Kelola Banner</h2>
            <button @click="showBannerSettings = false" class="text-gray-500 hover:text-gray-700">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <button 
            @click="openBannerCreate"
            class="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            + Tambah Banner
          </button>

          <div class="space-y-3">
            <div 
              v-for="banner in banners" 
              :key="banner.id"
              class="flex gap-3 p-3 border border-gray-200 rounded-lg"
            >
              <img 
                :src="banner.url" 
                :alt="banner.name"
                class="w-16 h-16 rounded object-cover"
              >
              <div class="flex-1 min-w-0">
                <h3 class="font-semibold text-gray-900 truncate">{{ banner.name }}</h3>
              </div>
              <div class="flex gap-2">
                <button
                  @click="openBannerEdit(banner)"
                  class="p-2 text-blue-600 hover:bg-blue-50 rounded"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button
                  @click="handleBannerDelete(banner.id)"
                  class="p-2 text-red-600 hover:bg-red-50 rounded"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            <div v-if="banners.length === 0" class="text-center py-8 text-gray-500">
              Belum ada banner
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Banner Form Modal -->
    <Teleport to="body">
      <div 
        v-if="showBannerForm"
        class="fixed inset-0 z-[110] bg-black bg-opacity-50 flex items-center justify-center p-4"
        @click.self="showBannerForm = false"
      >
        <div class="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div class="flex justify-between items-center">
            <h2 class="text-xl font-bold text-gray-900">{{ selectedBanner ? 'Edit' : 'Tambah' }} Banner</h2>
            <button @click="showBannerForm = false" class="text-gray-500 hover:text-gray-700">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <BannerForm 
            :banner="selectedBanner"
            @submit="handleBannerSubmit"
            @cancel="showBannerForm = false"
          />
        </div>
      </div>
    </Teleport>

    <!-- Category Settings Modal -->
    <Teleport to="body">
      <div 
        v-if="showCategorySettings"
        class="fixed inset-0 z-[100] bg-black bg-opacity-50 flex items-center justify-center p-4"
        @click.self="showCategorySettings = false"
      >
        <div class="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div class="flex justify-between items-center">
            <h2 class="text-xl font-bold text-gray-900">Kelola Kategori History</h2>
            <button @click="showCategorySettings = false" class="text-gray-500 hover:text-gray-700">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <button 
            @click="openCategoryCreate"
            class="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            + Tambah Kategori
          </button>

          <div class="space-y-2">
            <div 
              v-for="category in categories" 
              :key="category.id"
              class="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
            >
              <span class="font-medium text-gray-900">{{ category.name }}</span>
              <div class="flex gap-2">
                <button
                  @click="openCategoryEdit(category)"
                  class="p-2 text-blue-600 hover:bg-blue-50 rounded"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button
                  @click="handleCategoryDelete(category.id)"
                  class="p-2 text-red-600 hover:bg-red-50 rounded"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            <div v-if="categories.length === 0" class="text-center py-8 text-gray-500">
              Belum ada kategori
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Category Form Modal -->
    <Teleport to="body">
      <div 
        v-if="showCategoryForm"
        class="fixed inset-0 z-[110] bg-black bg-opacity-50 flex items-center justify-center p-4"
        @click.self="showCategoryForm = false"
      >
        <div class="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
          <div class="flex justify-between items-center">
            <h2 class="text-xl font-bold text-gray-900">{{ selectedCategory ? 'Edit' : 'Tambah' }} Kategori</h2>
            <button @click="showCategoryForm = false" class="text-gray-500 hover:text-gray-700">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Nama Kategori</label>
            <input 
              v-model="categoryName"
              type="text" 
              placeholder="Masukkan nama kategori..."
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
          </div>

          <div class="flex gap-3 pt-4">
            <button 
              @click="showCategoryForm = false"
              class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Batal
            </button>
            <button 
              @click="handleCategorySubmit"
              class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              :disabled="!categoryName"
            >
              Simpan
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </MainLayout>
</template>
