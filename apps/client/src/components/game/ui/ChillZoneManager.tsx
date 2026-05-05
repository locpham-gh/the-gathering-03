import { useEffect, useRef } from "react";
import { useLocalParticipant } from "@livekit/components-react";
import type { Zone } from "../core/zones";

// Lofi/chill playlist — royalty-free tracks from pixabay
const CHILL_TRACKS = [
  "https://cdn.pixabay.com/audio/2022/10/31/audio_24bab6e9fd.mp3",
  "https://cdn.pixabay.com/audio/2023/10/10/audio_bc4b03db00.mp3",
  "https://cdn.pixabay.com/audio/2022/02/07/audio_db8b14f5e4.mp3",
];

let sharedAudio: HTMLAudioElement | null = null;
let currentTrackIdx = 0;

function getOrCreateAudio(): HTMLAudioElement {
  if (!sharedAudio) {
    sharedAudio = new Audio();
    sharedAudio.loop = false;
    sharedAudio.volume = 0.35;
    sharedAudio.onended = () => {
      currentTrackIdx = (currentTrackIdx + 1) % CHILL_TRACKS.length;
      if (sharedAudio) {
        sharedAudio.src = CHILL_TRACKS[currentTrackIdx];
        sharedAudio.play().catch(() => {});
      }
    };
  }
  return sharedAudio;
}

interface ChillZoneManagerProps {
  currentZone: Zone | null;
}

export function ChillZoneManager({ currentZone }: ChillZoneManagerProps) {
  const { localParticipant } = useLocalParticipant();
  const wasInChill = useRef(false);
  const prevMicState = useRef(true);
  const prevCamState = useRef(true);
  const isInChill = currentZone?.id === "chill";

  useEffect(() => {
    if (!localParticipant) return;

    if (isInChill && !wasInChill.current) {
      // Entering chill zone — save current states then disable
      prevMicState.current = localParticipant.isMicrophoneEnabled;
      prevCamState.current = localParticipant.isCameraEnabled;
      localParticipant.setMicrophoneEnabled(false);
      localParticipant.setCameraEnabled(false);

      // Start music
      const audio = getOrCreateAudio();
      audio.src = CHILL_TRACKS[currentTrackIdx];
      audio.play().catch(() => {});

      wasInChill.current = true;
    } else if (!isInChill && wasInChill.current) {
      // Leaving chill zone — restore previous mic/cam state
      localParticipant.setMicrophoneEnabled(prevMicState.current);
      localParticipant.setCameraEnabled(prevCamState.current);

      // Fade out and stop music
      const audio = getOrCreateAudio();
      const fadeOut = setInterval(() => {
        if (audio.volume > 0.03) {
          audio.volume = Math.max(0, audio.volume - 0.03);
        } else {
          audio.pause();
          audio.volume = 0.35;
          clearInterval(fadeOut);
        }
      }, 80);

      wasInChill.current = false;
    }
  }, [isInChill, localParticipant]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sharedAudio) {
        sharedAudio.pause();
      }
    };
  }, []);

  return null;
}
