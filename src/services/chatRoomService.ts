import { supabase } from './supabase'
import { v4 as uuidv4 } from 'uuid'

interface ChatRoomUser {
  id: string;
  user_id: string;
  room_id: string;
  created_at: string;
  created_by: string;
}

interface ChatRoom {
  id: string;
  room_type: string;
  creator_id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  users?: ChatRoomUser[];
}

interface CreatePrivateRoomParams {
  fromId: string;
  toId: string;
}

interface ExistingRoomResult {
  room: ChatRoom & {
    users: Array<{ user_id: string }>;
  };
}

export const chatRoomService = {
  /**
   * Find or create a private chat room between two users
   * @param params Object containing fromId and toId
   * @returns The chat room and room user records
   */
  async findOrCreatePrivateRoom(params: CreatePrivateRoomParams): Promise<{
    room: any
    users: any[]
  } | null> {
    const { fromId, toId } = params
    
    // First, find all private rooms that have both users
    const { data: existingRooms, error: findError } = await supabase
      .from('chat_room_users')
      .select(`
        room:chat_rooms!inner(
          *,
          users:chat_room_users(
            user_id
          )
        )
      `)
      .eq('room.room_type', 'PRIVATE')
      .in('user_id', [fromId, toId])
      .is('room.deleted_at', null)

    if (findError) {
      console.error('Error finding private room:', findError)
      throw findError
    }

    // Check if there's a room with both users
    if (existingRooms && existingRooms.length > 0) {
      // Group rooms by room_id and count users
      const roomUserCounts = (existingRooms as unknown as ExistingRoomResult[]).reduce<Record<string, number>>((acc, { room }) => {
        const roomId = room.id;
        acc[roomId] = (acc[roomId] || 0) + 1;
        return acc;
      }, {});

      // Find a room that has both users (count = 2)
      const roomWithBothUsers = (existingRooms as unknown as ExistingRoomResult[]).find(
        ({ room }) => roomUserCounts[room.id] === 2
      )?.room;

      if (roomWithBothUsers) {
        // Get the room with users
        const { data: roomUsers, error: usersError } = await supabase
          .from('chat_room_users')
          .select('*')
          .eq('room_id', roomWithBothUsers.id)

        if (usersError) {
          console.error('Error fetching room users:', usersError)
          throw usersError
        }

        return {
          room: roomWithBothUsers,
          users: roomUsers || []
        }
      }
    }

    // If no existing room, create a new one
    const { data: newRoom, error: createError } = await supabase
      .from('chat_rooms')
      .insert({
        id: uuidv4(),
        room_type: 'PRIVATE',
        creator_id: fromId,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (createError || !newRoom) {
      console.error('Error creating private room:', createError)
      throw createError || new Error('Failed to create private room')
    }

    // Add both users to the room
    const usersToAdd = [
      { id: uuidv4(), room_id: newRoom.id, user_id: fromId, created_by: fromId },
      { id: uuidv4(), room_id: newRoom.id, user_id: toId, created_by: fromId }
    ]

    const { data: roomUsers, error: usersError } = await supabase
      .from('chat_room_users')
      .insert(usersToAdd)
      .select()

    if (usersError) {
      console.error('Error adding users to room:', usersError)
      throw usersError
    }

    return {
      room: newRoom,
      users: roomUsers || []
    }
  },

  /**
   * Get a private chat room between two users
   * @param fromId User ID of the first user
   * @param toId User ID of the second user
   * @returns The chat room if it exists, null otherwise
   */
  async getPrivateRoom(fromId: string, toId: string): Promise<any | null> {
    const { data: rooms, error } = await supabase
      .from('chat_rooms')
      .select(`
        *,
        chat_room_users!inner(
          user_id
        )
      `)
      .eq('room_type', 'PRIVATE')
      .eq('chat_room_users.user_id', fromId)
      .or(`chat_room_users.user_id.eq.${toId}`)
      .is('deleted_at', null)

    if (error) {
      console.error('Error getting private room:', error)
      throw error
    }

    if (!rooms || rooms.length === 0) {
      return null
    }

    // Find a room that has both users
    const room = rooms.find(room => {
      const userIds = room.chat_room_users.map((u: any) => u.user_id)
      return userIds.includes(fromId) && userIds.includes(toId)
    })

    return room || null
  }
}

export default chatRoomService
