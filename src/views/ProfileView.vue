<script setup lang="ts">
import { ref, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import MainLayout from "@/layouts/MainLayout.vue";
import { userFollowers } from "@/services/userFollowersService";
import { useGetUserProfile } from "@/composables/useGetUserProfile";
import { toast } from "vue-sonner";
import UserListPopup from "@/components/UserListPopup.vue";
import { useUser } from "@/composables/useUser";
import { chatRoomService } from "@/services/chatRoomService";

const router = useRouter();
const route = useRoute();

const {
  user,
  loading,
  error,
  isCurrentUser,
  fetchUserProfile,
  fetchCurrentUser,
  toggleFollow,
} = useGetUserProfile();

const stats = ref({
  followers: 0,
  following: 0,
});

const showPopup = ref(false);
const popupType = ref<"followers" | "following">("followers");

const openPopup = (type: "followers" | "following") => {
  popupType.value = type;
  showPopup.value = true;
};

const closePopup = () => {
  showPopup.value = false;
};

const loadUserData = async () => {
  try {
    const userId = route.query.id?.toString();

    // If no ID in URL, fetch current user
    if (!userId) {
      await fetchCurrentUser();
    } else {
      // Load user by ID using the composable
      await fetchUserProfile(userId);
    }
  } catch (err) {
    console.error("Error loading user data:", err);
    toast.error("Failed to load user profile");
    router.push("/");
  }
};

const loadUserStats = async () => {
  try {
    loading.value = true;
    const userId = route.query.id?.toString() || user.value?.id;

    if (!userId) return;

    const [followers, following] = await Promise.all([
      userFollowers.getFollowerCount(userId),
      userFollowers.getFollowingCount(userId),
    ]);

    stats.value = {
      followers,
      following,
    };
  } catch (err) {
    console.error("Error loading user stats:", err);
    toast.error("Failed to load user statistics");
  } finally {
    loading.value = false;
  }
};

const handleFollow = async () => {
  if (!user.value) return;

  try {
    const result = await toggleFollow();
    if (result?.success) {
      // Update follower count
      if (result.action === "follow") {
        stats.value.followers++;
        toast.success(`You are now following ${user.value.name}`);
      } else {
        stats.value.followers = Math.max(0, stats.value.followers - 1);
        toast.success(`You have unfollowed ${user.value.name}`);
      }
    }
  } catch (err) {
    console.error("Error updating follow status:", err);
    toast.error("Failed to update follow status");
  }
};

const handleMessage = async () => {
  const { user: currentUser, getCurrentUser } = useUser();
  
  // Ensure current user is loaded
  const currentUserData = await getCurrentUser();
  
  if (!currentUserData?.id || !user.value?.id) {
    toast.error("Please log in to send messages");
    return;
  }

  try {
    const result = await chatRoomService.findOrCreatePrivateRoom({
      fromId: currentUserData.id,
      toId: user.value.id,
    });

    if (result?.room?.id) {
      router.push(`/chat/${currentUserData.id}/${result.room.id}?type=PRIVATE`);
    } else {
      throw new Error('Failed to create or find chat room');
    }
  } catch (error) {
    console.error("Error starting chat:", error);
    toast.error("Failed to start chat. Please try again.");
  }
};

// Watch for route changes to load different user profiles
watch(
  () => route.query.id,
  async () => {
    await loadUserData();
    await loadUserStats();
  },
  { immediate: true }
);

const copyToClipboard = (text: string) => {
  if (typeof window !== "undefined") {
    navigator.clipboard.writeText(text);
    toast.success("Email copied to clipboard!");
  }
};
</script>

<template>
  <MainLayout title="Profile">
    <div class="p-4">
      <!-- Action Buttons -->
      <div v-if="!isCurrentUser && user" class="flex gap-3 mb-6">
        <button
          @click="handleFollow"
          :class="[
            'px-6 py-2 rounded-lg font-medium transition-colors',
            user.isFollowing
              ? 'bg-white text-gray-900 border border-gray-300 hover:bg-gray-50'
              : 'bg-blue-600 text-white hover:bg-blue-700',
          ]"
        >
          {{ user.isFollowing ? "Following" : "Follow" }}
        </button>
        <button
          @click="handleMessage"
          class="flex-1 flex items-center justify-center gap-2 bg-white border border-blue-600 text-blue-600 hover:bg-blue-50 font-medium py-2 px-4 rounded-lg transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          Message
        </button>
      </div>

      <!-- User Card -->
      <div class="bg-white rounded-lg shadow p-6 border border-gray-200">
        <div class="flex flex-col items-center">
          <img
            :src="user?.avatar_url || '/img.jpg'"
            :alt="user?.name || 'User'"
            class="w-24 h-24 rounded-full object-cover border-4 border-blue-100"
          />
          <h2 class="mt-4 text-xl font-bold text-gray-900">{{ user?.name }}</h2>
          <div
            v-if="
              (isCurrentUser && user?.email) || (!isCurrentUser && user?.email)
            "
            class="group flex items-center gap-2 mt-1"
          >
            <p
              class="text-gray-600 group-hover:text-blue-500 transition-colors duration-300 group-hover:font-bold"
            >
              {{ user?.email }}
            </p>
            <button
              v-if="isCurrentUser"
              @click="copyToClipboard(user.email)"
              class="text-gray-400 hover:text-blue-500 transition-colors cursor-pointer group-hover:text-blue-500"
              title="Copy email"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                />
              </svg>
            </button>
          </div>
          <!-- <p v-if="user?.role" class="text-sm text-gray-500 mt-1">Role: {{ user.role }}</p> -->

          <!-- Follow Stats -->
          <div class="w-full mt-6">
            <div class="grid grid-cols-2 gap-4">
              <!-- Followers -->
              <button
                @click="openPopup('followers')"
                class="w-full bg-gray-50 rounded-lg p-4 text-center border border-gray-100 hover:border-blue-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-200"
                :disabled="loading"
              >
                <div v-if="loading" class="animate-pulse">
                  <div class="h-6 w-3/4 bg-gray-200 rounded mx-auto mb-1"></div>
                  <div class="h-4 w-1/2 bg-gray-200 rounded mx-auto"></div>
                </div>
                <template v-else>
                  <p class="text-2xl font-bold text-gray-900">
                    {{ stats.followers.toLocaleString() }}
                  </p>
                  <p class="text-sm text-gray-500">Followers</p>
                </template>
              </button>

              <!-- Following -->
              <button
                @click="openPopup('following')"
                class="w-full bg-gray-50 rounded-lg p-4 text-center border border-gray-100 hover:border-blue-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-200"
                :disabled="loading"
              >
                <div v-if="loading" class="animate-pulse">
                  <div class="h-6 w-3/4 bg-gray-200 rounded mx-auto mb-1"></div>
                  <div class="h-4 w-1/2 bg-gray-200 rounded mx-auto"></div>
                </div>
                <template v-else>
                  <p class="text-2xl font-bold text-gray-900">
                    {{ stats.following.toLocaleString() }}
                  </p>
                  <p class="text-sm text-gray-500">Following</p>
                </template>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- User List Popup -->
    <UserListPopup
      v-if="user"
      :is-open="showPopup"
      :user-id="user.id"
      :type="popupType"
      @close="closePopup"
    />
  </MainLayout>
</template>
