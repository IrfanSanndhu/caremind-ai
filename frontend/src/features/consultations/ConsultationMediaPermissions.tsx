import { useEffect, useRef } from 'react';
import { RoomEvent } from 'livekit-client';
import { useRoomContext } from '@livekit/components-react';

/**
 * Prompts for mic/camera access when the user joins a call, without publishing
 * live tracks. Devices stay off until the user toggles them in call controls.
 */
export function ConsultationMediaPermissions() {
  const room = useRoomContext();
  const requested = useRef(false);

  useEffect(() => {
    const requestAccess = async () => {
      if (requested.current) return;
      requested.current = true;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        stream.getTracks().forEach((track) => track.stop());
      } catch {
        // Denied or unavailable — user can retry from the mic/camera controls.
      }
    };

    if (room.state === 'connected') {
      void requestAccess();
      return;
    }

    room.on(RoomEvent.Connected, requestAccess);
    return () => {
      room.off(RoomEvent.Connected, requestAccess);
    };
  }, [room]);

  return null;
}
