import {
  AccessToken,
  RoomServiceClient,
  VideoGrant,
} from 'livekit-server-sdk';
import { env } from '../../config/env.js';
import type { LiveKitAdapter, LiveKitRoomInfo, LiveKitParticipantInfo } from '../../types/adapters.js';

export function createLiveKitAdapter(): LiveKitAdapter {
  const roomService = new RoomServiceClient(
    env.LIVEKIT_URL,
    env.LIVEKIT_API_KEY,
    env.LIVEKIT_API_SECRET,
  );

  return {
    createRoomToken({
      roomName,
      participantIdentity,
      participantName,
      canPublish,
      canSubscribe,
      metadata,
    }) {
      const token = new AccessToken(env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET, {
        identity: participantIdentity,
        name: participantName,
        metadata,
        ttl: '4h',
      });

      const grant: VideoGrant = {
        roomJoin: true,
        room: roomName,
        canPublish,
        canSubscribe,
        canPublishData: true,
      };

      token.addGrant(grant);
      // toJwt() is sync in livekit-server-sdk v2 when no async operations are needed
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (token as any).toJwt() as string;
    },

    async createRoom(roomName) {
      const room = await roomService.createRoom({ name: roomName });
      return {
        sid: room.sid,
        name: room.name,
        numParticipants: room.numParticipants,
        creationTime: room.creationTime,
      } satisfies LiveKitRoomInfo;
    },

    async deleteRoom(roomName) {
      await roomService.deleteRoom(roomName);
    },

    async listParticipants(roomName) {
      const participants = await roomService.listParticipants(roomName);
      return participants.map((p) => ({
        sid: p.sid,
        identity: p.identity,
        name: p.name,
        metadata: p.metadata,
      })) satisfies LiveKitParticipantInfo[];
    },
  };
}
