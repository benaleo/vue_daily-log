<script lang="ts" setup>
import { ref, computed, onMounted, nextTick, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useChatRoom } from "@/composables/chat/useChatRoomMessages";
import { useSessionUser } from "@/composables/useSessionUser";
import MainLayout from "@/layouts/MainLayout.vue";
import { Send } from "lucide-vue-next";
import { supabase } from "@/services/supabase";
import { groupMessagesByDate } from "@/lib/helpers/dateGrouping";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { sessionUser, ensureSession } = useSessionUser();
const showMenu = ref(false);
const messagesEndRef = ref<HTMLElement | null>(null);

// Group messages by date
const groupedMessages = computed(() => groupMessagesByDate(messages.value));

// Initialize chat room
const {
  room,
  messages,
  loading,
  newMessage,
  otherUser,
  sendMessage,
  scrollToBottom,
  forceScrollToBottom,
  error,
} = useChatRoom(computed(() => sessionUser.value.user_id));

// Get current user when component mounts
onMounted(async () => {
  if (!sessionUser.value.user_id) {
    await ensureSession();
  }
  // Scroll to bottom when component is mounted
  await nextTick();
  forceScrollToBottom();
});

// Watch for changes in messages and scroll to bottom
watch(
  () => messages.value,
  async () => {
    await nextTick();
    scrollToBottom();
  },
  { deep: true }
);

// Watch for loading state to scroll to bottom when messages are loaded
watch(
  () => loading.value,
  async (newLoading) => {
    if (!newLoading && messages.value.length > 0) {
      await nextTick();
      forceScrollToBottom();
    }
  }
);

const handleSendMessage = async () => {
  const message = newMessage.value.trim();
  if (!message) return;

  // Ensure user is logged in
  if (!sessionUser.value.user_id) {
    const current = await ensureSession();
    if (!current?.user_id) {
      console.error("User not authenticated");
      router.push("/login");
      return;
    }
  }

  try {
    await sendMessage();
    // Broadcast to recipient topic so their list updates and they get notified
    try {
      if (otherUser.value?.id && room.value?.id) {
        const channel = supabase.channel(`user_${otherUser.value.id}`);
        await channel.subscribe((status) => {
          if (status === "SUBSCRIBED") {
            channel.send({
              type: "broadcast",
              event: "new_message",
              payload: {
                roomId: room.value?.id,
                fromId: sessionUser.value.user_id,
                preview: message,
              },
            });
            // best-effort cleanup
            try {
              channel.unsubscribe();
            } catch {}
          }
        });
      }
    } catch (e) {
      console.warn("Broadcast to recipient failed (non-fatal):", e);
    }
    newMessage.value = "";
    // Reset textarea height
    const textarea = document.querySelector("textarea");
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = "44px";
    }
    await nextTick();
    forceScrollToBottom();
  } catch (error) {
    console.error("Failed to send message:", error);
  }
};

// Removed handleKeyDown as we're now using direct event handlers in the template

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
};

const formatTime = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const handleTextareaInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement;
  target.style.height = "auto";
  target.style.height = target.scrollHeight + "px";
};

const handleTextareaKeydown = (event: KeyboardEvent) => {
  const target = event.target as HTMLTextAreaElement;
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    handleSendMessage();
  } else if (event.key === "Enter" && event.shiftKey) {
    // Allow Shift+Enter for new line
    // The default behavior will add a new line
  } else {
    // Auto-resize for other inputs
    target.style.height = "auto";
    target.style.height = target.scrollHeight + "px";
  }
};
</script>

<template>
  <MainLayout
    :title="room?.name || 'Chat'"
    :hide-header="true"
    class="overflow-hidden"
  >
    <div
      class="fixed left-0 right-0 top-0 bottom-0 max-w-md mx-auto flex flex-col h-screen bg-white dark:bg-gray-900 overflow-hidden"
    >
      <!-- Header -->
      <div
        class="flex items-center p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-0 z-50"
      >
        <button
          @click="router.back()"
          class="mr-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 md:hidden"
        >
          <svg
            class="w-6 h-6 text-gray-600 dark:text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <div v-if="otherUser" class="flex items-center flex-1">
          <div class="relative">
            <div
              v-if="otherUser.avatar_url"
              class="w-10 h-10 rounded-full bg-gray-200 overflow-hidden"
            >
              <img
                :src="otherUser.avatar_url"
                :alt="otherUser.full_name"
                class="w-full h-full object-cover"
              />
            </div>
            <div
              v-else
              class="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium"
            >
              {{ getInitials(otherUser.full_name || "unknown") }}
            </div>
            <div
              class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"
            ></div>
          </div>
          <div class="ml-3">
            <h2 class="font-medium text-gray-900 dark:text-white">
              {{ otherUser.full_name || "unknown" }}
            </h2>
            <p class="text-xs text-gray-500 dark:text-gray-400">Online</p>
          </div>
        </div>

        <div class="ml-auto flex items-center">
          <button
            @click="showMenu = !showMenu"
            class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 relative"
          >
            <svg
              class="w-5 h-5 text-gray-600 dark:text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
              />
            </svg>

            <!-- Dropdown menu -->
            <div
              v-if="showMenu"
              class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-20"
              v-click-outside="() => (showMenu = false)"
            >
              <a
                href="#"
                class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {{ $t("chat.menu.view_profile") }}
              </a>
              <a
                href="#"
                class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {{ $t("chat.menu.clear_chat") }}
              </a>
              <a
                href="#"
                class="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {{ $t("chat.menu.end_chat") }}
              </a>
            </div>
          </button>
        </div>
      </div>

      <!-- Messages -->
      <div v-if="loading" class="flex-1 flex items-center justify-center">
        <div
          class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"
        ></div>
      </div>

      <div
        v-else
        ref="messagesEndRef"
        class="flex-1 overflow-y-auto p-4 space-y-4 messages-container pb-42"
      >
        <div
          v-for="group in groupedMessages"
          :key="group.date"
          class="space-y-4"
        >
          <!-- Date separator -->
          <div class="flex items-center justify-center my-4">
            <div class="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-3 py-1 rounded-full">
              {{ group.label }}
            </div>
          </div>
          
          <!-- Messages for this date -->
          <div
            v-for="message in group.messages"
            :key="message.id"
            :class="{
              'flex justify-end': message.user_id === sessionUser.user_id,
              flex: message.user_id !== sessionUser.user_id,
            }"
          >
            <div
              :class="{
                'bg-blue-500 text-white rounded-l-xl rounded-br-xl':
                  message.user_id === sessionUser.user_id,
                'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-r-xl rounded-bl-xl':
                  message.user_id !== sessionUser.user_id,
                'max-w-xs md:max-w-md lg:max-w-lg xl:max-w-2xl px-4 py-2': true,
              }"
            >
              <p class="text-sm">{{ message.content }}</p>
              <p class="text-xs mt-1 text-right opacity-75">
                {{ formatTime(message.created_at) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Message input -->
      <div
        class="fixed bottom-16 w-full max-w-md p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-800"
      >
        <form
          @submit.prevent="handleSendMessage"
          class="flex items-center space-x-2"
        >
          <button
            type="button"
            class="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-1"
          >
            <svg
              class="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>

          <div class="flex-1 relative">
            <textarea
              ref="messageInput"
              v-model="newMessage"
              @keydown="handleTextareaKeydown"
              @input="handleTextareaInput"
              @keyup.enter.exact.prevent="handleSendMessage"
              :placeholder="$t('chat.type_message')"
              class="w-full px-4 py-2 pr-10 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none overflow-hidden"
              rows="1"
              style="min-height: 44px; max-height: 120px"
            ></textarea>

            <button
              type="submit"
              class="absolute right-4 bottom-1/2 translate-y-1/2 p-1 text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="!newMessage.trim()"
            >
              <Send />
            </button>
          </div>
        </form>
      </div>
    </div>
  </MainLayout>
</template>

<style scoped>
.messages-container {
  scroll-behavior: smooth;
}

/* Custom scrollbar */
.messages-container::-webkit-scrollbar {
  width: 6px;
}

.messages-container::-webkit-scrollbar-track {
  background: transparent;
}

.messages-container::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 20px;
}

.dark .messages-container::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.1);
}
</style>
