import { supabase } from "@/services/supabase";
import { v4 as uuidv4 } from "uuid";

export interface ChatUser {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  user_id: string; // alias of from_id for UI compatibility
  from_id?: string;
  to_id?: string;
  content: string;
  created_at: string;
  user?: ChatUser;
}

export interface ChatRoom {
  id: string;
  name: string;
  avatar: string | null;
  description: string | null;
  room_type: "PRIVATE" | "CHANNEL";
  last_message_at: string | null;
  created_at: string;
  unread_count?: number;
  last_message?: string;
  users?: ChatUser[];
}

export interface ChatRoomUser {
  id: string,
  user_id: string,
  is_admin: boolean
}

export const chatService = {
  async getChatRooms(userId: string, search = ""): Promise<ChatRoom[]> {
    // Fetch rooms where the user is a member, include latest message
    let query = supabase
      .from("chat_rooms")
      .select(
        [
          "id",
          "name",
          "avatar",
          "description",
          "room_type",
          "last_message_at",
          "created_at",
          "members:chat_room_users!inner(user:users(id,name,avatar_url))",
          "messages:chat_messages(id, content, created_at)",
        ].join(", ")
      )
      .in("members.user.id", [userId])
      .order("last_message_at", { ascending: false, nullsFirst: false });

    // Basic search on room name if provided
    if (search && search.trim()) {
      query = query.ilike("name", `%${search.trim()}%`);
    }

    const { data, error } = await query
      // order and limit on nested messages to get only the latest one
      .order("created_at", { foreignTable: "messages", ascending: false })
      .limit(1, { foreignTable: "messages" });

    if (error) throw error;

    const rooms = ((data as any[]) || []).map((r: any) => {
      const last =
        Array.isArray(r.messages) && r.messages.length > 0
          ? r.messages[0]
          : null;
      const mapped: ChatRoom = {
        id: r.id,
        name: r.name,
        avatar: r.avatar ?? null,
        description: r.description ?? null,
        room_type: r.room_type,
        last_message_at: r.last_message_at ?? null,
        created_at: r.created_at,
        last_message: last?.content ?? undefined,
      };
      return mapped;
    });

    return rooms;
  },



  async getChatRoomByRoomId(
    roomId: string,
  ): Promise<ChatRoom | null> {
    // Fetch a single room with its users; ensure the requesting user is a member
    const { data, error } = await supabase
      .from("chat_rooms")
      .select(
        [
          "id",
          "name",
          "avatar",
          "description",
          "room_type",
          "last_message_at",
          "created_at",
          "members:chat_room_users(user:users!chat_room_users_user_id_fkey(id, email, name, avatar_url))",
        ].join(", ")
      )
      .eq("id", roomId)
      .single();

    if (error) throw error;
    if (!data) return null;

    const row: any = data as any;
    const users: ChatUser[] = (row.members || [])
      .map((m: any) => m.user)
      .filter(Boolean)
      .map((u: any) => ({
        id: u.id,
        email: u.email,
        full_name: u.name,
        avatar_url: u.avatar_url || undefined,
      }));

    const room: ChatRoom = {
      id: row.id,
      name: row.name,
      avatar: row.avatar ?? null,
      description: row.description ?? null,
      room_type: row.room_type,
      last_message_at: row.last_message_at ?? null,
      created_at: row.created_at,
      users,
    };

    return room;
  },

  async getChatRoomPrivateMessages(
    toId: string,
    fromId: string
  ): Promise<ChatRoom | null> {
    // Fetch a single room with its users; ensure the requesting user is a member
    const { data, error } = await supabase
      .from("chat_rooms")
      .select(
        [
          "id",
          "name",
          "avatar",
          "description",
          "room_type",
          "last_message_at",
          "created_at",
          "members:chat_room_users(user:users!chat_room_users_user_id_fkey(id, email, name, avatar_url))",
        ].join(", ")
      )
      .eq("room_type", "PRIVATE")
      .in("members.user.id", [fromId, toId])
      .single();

    if (error) throw error;
    if (!data) return null;

    const row: any = data as any;
    const users: ChatUser[] = (row.members || [])
      .map((m: any) => m.user)
      .filter(Boolean)
      .map((u: any) => ({
        id: u.id,
        email: u.email,
        full_name: u.name,
        avatar_url: u.avatar_url || undefined,
      }));

    const room: ChatRoom = {
      id: row.id,
      name: row.name,
      avatar: row.avatar ?? null,
      description: row.description ?? null,
      room_type: row.room_type,
      last_message_at: row.last_message_at ?? null,
      created_at: row.created_at,
      users,
    };

    return room;
  },

  async getChatRoomUsersByRoomId(roomId: string): Promise<ChatRoomUser[]>{
    const {data, error} = await supabase
    .from("chat_room_users")
    .select("*")
    .eq("room_id", roomId);

    if(error) throw error;

    // map
    const mapped = (data || []).map((m: any) => ({
      ...m,
    })) as ChatRoomUser[];

    return mapped;
  },

  async getChatMessages(roomId: string): Promise<ChatMessage[]> {
    console.log('get chat message from roomid', roomId)
    const { data, error } = await supabase
      .from("chat_messages")
      .select(
        // Ensure we always return user_id for UI and keep original ids
        "id, room_id, from_id, to_id, content, created_at"
      )
      .eq("room_id", roomId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    console.log('size data', data.length)

    // Map from_id -> user_id for UI compatibility
    const mapped = (data || []).map((m: any) => ({
      ...m,
      user_id: m.from_id,
    })) as ChatMessage[];

    console.log("mapped chat", mapped);

    return mapped;
  },

  async sendMessagePrivate(
    roomId: string,
    fromId: string,
    content: string,
    type: string
  ): Promise<void> {
    try {
      const chatRoom = await chatService.getChatRoomByRoomId(roomId)
      if(!chatRoom) throw console.error();
      
      const chatRoomUsers = await chatService.getChatRoomUsersByRoomId(chatRoom?.id);
      if (!chatRoomUsers || chatRoomUsers.length < 2) {
        const error = new Error("Invalid chat room participants");
        console.error(error.message, { roomUsers: chatRoom });
        throw error;
      }

      const fromUser = chatRoomUsers.find(u => u.user_id === fromId)?.id;
      const toUser = chatRoomUsers.find(u => u.user_id !== fromId)?.id;

      if (!fromUser || !toUser) {
        const error = new Error("User not found in chat room");
        console.error(error.message, { fromUser, toUser });
        throw error;
      }

      // Insert the new message
      const { data: messageData, error: messageError } = await supabase
        .from("chat_messages")
        .insert({
          id: uuidv4(),
          room_id: chatRoom.id,
          from_id: fromUser,
          to_id: toUser,
          content: content,
          type: "TEXT",
          is_read: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select();

      console.log("Message insert result:", { messageData, messageError });

      if (messageError) {
        console.error("Error inserting message:", messageError);
        throw messageError;
      }

      console.log("Message sent successfully");
    } catch (error) {
      console.error("Error in chatService.sendMessage:", error);
      throw error;
    }

    // Update the room's last_message_at
    const { error: roomError } = await supabase
      .from("chat_rooms")
      .update({
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", roomId);

    if (roomError) throw roomError;
  },

  async markMessagesAsRead(toId: string, fromId: string): Promise<void> {
    const room = await this.getChatRoomByRoomId(toId);
    if (!room) return;

    const { error } = await supabase
      .from("chat_messages")
      .update({ is_read: true })
      .eq("room_id", room.id)
      .eq("to_id", fromId)
      .eq("is_read", false);

    if (error) throw error;
  },
};
