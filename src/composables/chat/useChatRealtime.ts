import { ref } from "vue";
import { supabase } from "@/services/supabase";
import { chatService } from "@/services/chatService";
import { toast } from "vue-sonner";

// Singleton state within module scope
let subscription: any = null;
let userTopic: any = null;
const currentUserId = ref<string | null>(null);

export function useChatRealtime() {
  let onRoomsChange: (() => Promise<void> | void) | null = null;

  const stop = () => {
    try {
      if (subscription) {
        supabase.removeChannel(subscription);
        subscription = null;
      }
      if (userTopic) {
        supabase.removeChannel(userTopic);
        userTopic = null;
      }
    } catch {}
  };

  const start = (
    userId: string | null | undefined,
    opts?: { onRoomsChange?: () => Promise<void> | void }
  ) => {
    // Reset existing
    stop();

    if (!userId) {
      currentUserId.value = null;
      return;
    }
    currentUserId.value = userId;
    onRoomsChange = opts?.onRoomsChange ?? null;

    // Postgres changes for rooms list refresh
    subscription = supabase
      .channel("rooms_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_rooms",
          filter: `chat_room_users.user_id=eq.${userId}`,
        },
        () => {
          onRoomsChange?.();
        }
      )
      .subscribe();

    // Broadcast per-user channel for new_message
    userTopic = supabase
      .channel(`user_${userId}`)
      .on("broadcast", { event: "new_message" }, async (payload: any) => {
        try {
          await onRoomsChange?.();
          const roomId = payload?.payload.roomId
          if (roomId) {
            const room = await chatService.getChatRoomByRoomId(roomId as string);
            if (!room) {
              toast.success("New message received");
            } else {
              toast.success("New message from " + (room.last_message_sender_name || "someone"));
            }
          } else {
            toast.success("New message received");
          }
        } catch (_) {}
      })
      .subscribe();
  };

  return { start, stop };
}
