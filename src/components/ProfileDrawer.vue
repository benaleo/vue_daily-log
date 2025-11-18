<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '@/services/supabase'
import { useImageUpload } from '@/composables/useImageUpload'
import { useBanners } from '@/composables/useBanners'
import { useOptionHistoryCategories } from '@/composables/useOptionHistoryCategories'
import { bannerService, type Banner } from '@/services/bannerService'
import { historyCategoryService, type HistoryCategory } from '@/services/historyCategoryService'
import BannerForm from '@/components/forms/BannerForm.vue'
import { toast } from 'vue-sonner'
import ConfirmAlert from '@/components/ConfirmAlert.vue'

const router = useRouter()
const isOpen = defineModel<boolean>('modelValue', { required: true })

const user = ref({
  name: '',
  email: '',
  avatar: '',
  role: ''
})

const showEditProfile = ref(false)
const showEditPassword = ref(false)
const showBannerSettings = ref(false)
const showCategorySettings = ref(false)
const showBannerForm = ref(false)
const showCategoryForm = ref(false)
const showLogoutConfirm = ref(false)
const showBannerDeleteConfirm = ref(false)
const showCategoryDeleteConfirm = ref(false)
const itemToDelete = ref<number | null>(null)
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

const loadUserData = async () => {
  const { session } = await authService.getSession()
  if (session?.user) {
    user.value = {
      name: session.user.user_metadata?.name || 'User',
      email: session.user.email || '',
      avatar: session.user.user_metadata?.avatar_url || '/img.jpg',
      role: session.user.role || 'UNKNOWN'
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
    
    if (avatarFile.value) {
      const { session } = await authService.getSession()
      const email = session?.user?.email || 'anonymous'
      
      const result = await uploadImage(avatarFile.value, email, 'avatar')
      finalAvatarUrl = result.url
    }
    
    const { error } = await authService.updateProfile(editName.value, finalAvatarUrl)
    if (error) throw error
    
    successMessage.value = 'Profile updated successfully'
    await loadUserData()
    
    setTimeout(() => {
      showEditProfile.value = false
      successMessage.value = ''
    }, 1500)

    toast.success(successMessage.value)
  } catch (error: any) {
    errorMessage.value = error.message || 'Failed to update profile'
    toast.error(errorMessage.value)
  } finally {
    showEditProfile.value = false
    successMessage.value = ''
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
    errorMessage.value = 'All fields must be filled'
    return
  }
  
  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = 'New password and confirmation do not match'
    return
  }
  
  if (newPassword.value.length < 6) {
    errorMessage.value = 'New password must be at least 6 characters long'
    return
  }

  try {
    const { error } = await authService.updatePassword(newPassword.value)
    if (error) throw error
    
    successMessage.value = 'Password updated successfully'
    
    setTimeout(() => {
      showEditPassword.value = false
      successMessage.value = ''
    }, 1500)
    toast.success(successMessage.value)
  } catch (error: any) {
    errorMessage.value = error.message || 'Failed to change password'
    toast.error(errorMessage.value)
  } finally {
    showEditPassword.value = false
    successMessage.value = ''
  }
}

const handleLogout = async () => {
  showLogoutConfirm.value = true
}

const confirmLogout = async () => {
  await authService.logout()
  router.push('/login')
  toast.success('Logout successfully')
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
      toast.success('Banner updated successfully')
    } else {
      const { error } = await bannerService.create(data)
      if (error) throw error
      toast.success('Banner created successfully')
    }
    
    await loadBanners()
    showBannerForm.value = false
    selectedBanner.value = null
  } catch (error: any) {
    toast.error(error.message || 'Failed to save banner')
  } finally {
    showBannerForm.value = false
    selectedBanner.value = null
  }
}

const handleBannerDelete = (id: number) => {
  itemToDelete.value = id
  showBannerDeleteConfirm.value = true
}

const confirmBannerDelete = async () => {
  if (!itemToDelete.value) return
  
  try {
    const { error } = await bannerService.delete(itemToDelete.value)
    if (error) throw error
    
    await loadBanners()
    toast.success('Banner deleted successfully')
  } catch (error: any) {
    toast.error(error.message || 'Failed to delete banner')
  } finally {
    showBannerDeleteConfirm.value = false
    itemToDelete.value = null
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
      toast.success('Category updated successfully')
    } else {
      const { error } = await historyCategoryService.create({ name: categoryName.value })
      if (error) throw error
      toast.success('Category created successfully')
    }
    
    await loadCategories()
    showCategoryForm.value = false
    selectedCategory.value = null
    categoryName.value = ''
  } catch (error: any) {
    toast.error(error.message || 'Failed to save category')
  } finally {
    showCategoryForm.value = false
    selectedCategory.value = null
    categoryName.value = ''
  }
}

const handleCategoryDelete = (id: number) => {
  itemToDelete.value = id
  showCategoryDeleteConfirm.value = true
}

const confirmCategoryDelete = async () => {
  if (!itemToDelete.value) return
  
  try {
    const { error } = await historyCategoryService.delete(itemToDelete.value)
    if (error) throw error
    
    await loadCategories()
    toast.success('Category deleted successfully')
  } catch (error: any) {
    toast.error(error.message || 'Failed to delete category')
  } finally {
    showCategoryDeleteConfirm.value = false
    itemToDelete.value = null
  }
}

// Close drawer when clicking outside
const closeDrawer = () => {
  isOpen.value = false
}

onMounted(async () => {
  await loadUserData()
})
</script>

<template>
  <div class="">
    <!-- Drawer Overlay -->
    <div 
      v-if="isOpen"
      class="fixed inset-0 z-50 md:left-1/2 md:transform md:-translate-x-1/2 md:max-w-md bg-black bg-opacity-50 transition-opacity duration-300"
      @click="closeDrawer"
    ></div>

    <!-- Drawer Content -->
    <div 
      class="fixed md:absolute top-0 right-0 transform -translate-x-1/2 z-50 min-h-screen w-full max-w-sm bg-white shadow-xl transform transition-transform duration-300 ease-in-out"
      :class="{ 'translate-x-0 opacity-100': isOpen, 'translate-x-full opacity-0': !isOpen }"
    >
      <div class="p-4 h-full overflow-y-auto">
        <!-- Header -->
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-bold text-gray-900">Profile</h2>
          <button @click="closeDrawer" class="text-gray-500 hover:text-gray-700">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- User Card -->
        <div class="bg-gray-50 rounded-lg p-4 mb-4">
          <div class="flex items-center space-x-4">
            <img 
              :src="user.avatar" 
              :alt="user.name"
              class="w-16 h-16 rounded-full object-cover border-2 border-white shadow"
            >
            <div>
              <h3 class="font-semibold text-gray-900">{{ user.name }}</h3>
              <p class="text-sm text-gray-600">{{ user.email }}</p>
            </div>
          </div>
        </div>

        <!-- Menu Items -->
        <nav class="space-y-2">
          <button 
            @click="openEditProfile"
            class="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 text-gray-700"
          >
            <div class="p-2 bg-blue-100 rounded-lg">
              <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <span>Edit Profile</span>
          </button>

          <button 
            @click="openEditPassword"
            class="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 text-gray-700"
          >
            <div class="p-2 bg-purple-100 rounded-lg">
              <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 10-8 0v4h8z" />
              </svg>
            </div>
            <span>Change Password</span>
          </button>

          <button 
            v-if="user.role === 'ADMIN'"
            @click="openBannerSettings"
            class="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 text-gray-700"
          >
            <div class="p-2 bg-green-100 rounded-lg">
              <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span>Manage Banners</span>
          </button>

          <button 
            @click="openCategorySettings"
            class="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 text-gray-700"
          >
            <div class="p-2 bg-yellow-100 rounded-lg">
              <svg class="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <span>Manage Categories</span>
          </button>

          <button 
            @click="handleLogout"
            class="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 text-red-600 mt-4"
          >
            <div class="p-2 bg-red-100 rounded-lg">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <span>Logout</span>
          </button>
        </nav>
      </div>
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

          <div class="space-y-4">
            <div class="flex flex-col items-center">
              <div class="relative">
                <img 
                  :src="avatarPreview || user.avatar" 
                  class="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                >
                <label class="absolute bottom-0 right-0 bg-white p-1.5 rounded-full shadow-md border border-gray-200 cursor-pointer hover:bg-gray-50">
                  <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <input 
                    type="file" 
                    class="hidden" 
                    accept="image/*"
                    @change="handleAvatarChange"
                  >
                </label>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                v-model="editName"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your name"
              >
            </div>
          </div>

          <div class="flex justify-end space-x-3 pt-4">
            <button 
              @click="showEditProfile = false"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button 
              @click="saveProfile"
              class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              :disabled="uploading"
            >
              <span v-if="uploading">Saving...</span>
              <span v-else>Save Changes</span>
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
            <h2 class="text-xl font-bold text-gray-900">Change Password</h2>
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

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <input
                v-model="oldPassword"
                type="password"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter current password"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input
                v-model="newPassword"
                type="password"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter new password"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input
                v-model="confirmPassword"
                type="password"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Confirm new password"
              >
            </div>
          </div>

          <div class="flex justify-end space-x-3 pt-4">
            <button 
              @click="showEditPassword = false"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button 
              @click="savePassword"
              class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Update Password
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
        <div class="bg-white rounded-2xl w-full max-w-md p-6 max-h-[80vh] flex flex-col">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold text-gray-900">Banner Settings</h2>
            <div class="flex space-x-2">
              <button 
                @click="openBannerCreate"
                class="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full"
                title="Add New Banner"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
              <button 
                @click="showBannerSettings = false"
                class="text-gray-500 hover:text-gray-700"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto space-y-3">
            <div v-if="banners.length === 0" class="text-center py-8 text-gray-500">
              No banners found. Add your first banner!
            </div>
            
            <div v-for="banner in banners" :key="banner.id" class="border rounded-lg overflow-hidden">
              <div class="relative aspect-video bg-gray-100">
                <img :src="banner.url" :alt="banner.name" class="w-full h-full object-cover">
              </div>
              <div class="p-3 flex justify-between items-center">
                <span class="font-medium">{{ banner.name }}</span>
                <div class="flex space-x-2">
                  <button 
                    @click="openBannerEdit(banner)"
                    class="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full"
                    title="Edit"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button 
                    @click="handleBannerDelete(banner.id)"
                    class="p-1.5 text-red-600 hover:bg-red-50 rounded-full"
                    title="Delete"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="flex justify-end space-x-3 pt-4 mt-4 border-t">
            <button 
              @click="showBannerSettings = false"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Banner Form Modal -->
    <Teleport to="body">
      <BannerForm
        v-if="showBannerForm"
        v-model:show="showBannerForm"
        :banner="selectedBanner"
        @saved="handleBannerSubmit"
      />
    </Teleport>

    <!-- Category Settings Modal -->
    <Teleport to="body">
      <div 
        v-if="showCategorySettings"
        class="fixed inset-0 z-[100] bg-black bg-opacity-50 flex items-center justify-center p-4"
        @click.self="showCategorySettings = false"
      >
        <div class="bg-white rounded-2xl w-full max-w-md p-6 max-h-[80vh] flex flex-col">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold text-gray-900">Category Settings</h2>
            <div class="flex space-x-2">
              <button 
                @click="openCategoryCreate"
                class="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full"
                title="Add New Category"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
              <button 
                @click="showCategorySettings = false"
                class="text-gray-500 hover:text-gray-700"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto space-y-2">
            <div v-if="categories.length === 0" class="text-center py-8 text-gray-500">
              No categories found. Add your first category!
            </div>
            
            <div 
              v-for="category in categories" 
              :key="category.id" 
              class="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50"
            >
              <span class="font-medium">{{ category.name }}</span>
              <div class="flex space-x-2">
                <button 
                  @click="openCategoryEdit(category)"
                  class="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full"
                  title="Edit"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button 
                  @click="handleCategoryDelete(category.id)"
                  class="p-1.5 text-red-600 hover:bg-red-50 rounded-full"
                  title="Delete"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div class="flex justify-end space-x-3 pt-4 mt-4 border-t">
            <button 
              @click="showCategorySettings = false"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Category Form Modal -->
    <Teleport to="body">
      <div 
        v-if="showCategoryForm"
        class="fixed inset-0 z-[100] bg-black bg-opacity-50 flex items-center justify-center p-4"
        @click.self="showCategoryForm = false"
      >
        <div class="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
          <div class="flex justify-between items-center">
            <h2 class="text-xl font-bold text-gray-900">
              {{ selectedCategory ? 'Edit' : 'Add' }} Category
            </h2>
            <button @click="showCategoryForm = false" class="text-gray-500 hover:text-gray-700">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
              <input
                v-model="categoryName"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter category name"
                @keyup.enter="handleCategorySubmit"
              >
            </div>
          </div>

          <div class="flex justify-end space-x-3 pt-4">
            <button 
              @click="showCategoryForm = false"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button 
              @click="handleCategorySubmit"
              class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              :disabled="!categoryName.trim()"
            >
              {{ selectedCategory ? 'Update' : 'Add' }} Category
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Logout Confirmation -->
    <Teleport to="body">
      <ConfirmAlert
        v-if="showLogoutConfirm"
        title="Logout Confirmation"
        message="Are you sure you want to logout?"
        confirm-text="Logout"
        confirm-variant="danger"
        @confirm="confirmLogout"
        @cancel="showLogoutConfirm = false"
      />
    </Teleport>

    <!-- Banner Delete Confirmation -->
    <Teleport to="body">
      <ConfirmAlert
        v-if="showBannerDeleteConfirm"
        title="Delete Banner"
        message="Are you sure you want to delete this banner? This action cannot be undone."
        confirm-text="Delete"
        confirm-variant="danger"
        @confirm="confirmBannerDelete"
        @cancel="showBannerDeleteConfirm = false"
      />
    </Teleport>

    <!-- Category Delete Confirmation -->
    <Teleport to="body">
      <ConfirmAlert
        v-if="showCategoryDeleteConfirm"
        title="Delete Category"
        message="Are you sure you want to delete this category? This action cannot be undone."
        confirm-text="Delete"
        confirm-variant="danger"
        @confirm="confirmCategoryDelete"
        @cancel="showCategoryDeleteConfirm = false"
      />
    </Teleport>
  </div>
</template>
