import React, { useState, useEffect, useRef } from "react";
import { CHARACTER_CONFIG } from "../core/config";
import { Mic, MicOff, Video, VideoOff, User, CheckCircle } from "lucide-react";

interface PreJoinScreenProps {
  user: { displayName: string; avatarUrl?: string };
  onJoin: (data: { displayName: string; characterId: string; videoEnabled: boolean; audioEnabled: boolean }) => void;
}

export const PreJoinScreen: React.FC<PreJoinScreenProps> = ({ user, onJoin }) => {
  const [displayName, setDisplayName] = useState(user.displayName);
  const [selectedCharacter, setSelectedCharacter] = useState(CHARACTER_CONFIG.available[0].id);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (videoEnabled) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(stream => {
          streamRef.current = stream;
          if (videoRef.current) videoRef.current.srcObject = stream;
        })
        .catch(err => {
          console.error("Error accessing camera:", err);
          setVideoEnabled(false);
        });
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) videoRef.current.srcObject = null;
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [videoEnabled]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900 overflow-y-auto py-10">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full mx-4 overflow-hidden flex flex-col md:flex-row h-auto md:h-[600px]">
        
        {/* Left Side: Media Preview */}
        <div className="w-full md:w-1/2 bg-slate-100 relative flex flex-col items-center justify-center p-8 border-b md:border-b-0 md:border-r border-slate-200">
          <div className="w-full aspect-video bg-slate-800 rounded-2xl overflow-hidden relative shadow-inner">
            {videoEnabled ? (
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover mirror"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                <div className="w-20 h-20 bg-slate-700 rounded-full flex items-center justify-center mb-4">
                  <VideoOff size={40} />
                </div>
                <p className="font-medium">Camera is turned off</p>
              </div>
            )}

            {/* Overlay Controls */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4">
              <button 
                onClick={() => setAudioEnabled(!audioEnabled)}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  audioEnabled ? "bg-teal-500 text-white shadow-lg shadow-teal-500/30" : "bg-red-500 text-white shadow-lg shadow-red-500/30"
                }`}
              >
                {audioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
              </button>
              <button 
                onClick={() => setVideoEnabled(!videoEnabled)}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  videoEnabled ? "bg-teal-500 text-white shadow-lg shadow-teal-500/30" : "bg-red-500 text-white shadow-lg shadow-red-500/30"
                }`}
              >
                {videoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
              </button>
            </div>
          </div>
          
          <div className="mt-8 w-full">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Display Name</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <User size={20} />
              </div>
              <input 
                type="text" 
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-teal-500 transition-all font-bold text-slate-700"
                placeholder="How should we call you?"
              />
            </div>
          </div>
        </div>

        {/* Right Side: Character & Confirm */}
        <div className="w-full md:w-1/2 p-8 flex flex-col h-full overflow-y-auto">
          <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-2">
             Prepare to Join 
             <span className="text-teal-500 inline-block animate-pulse">🚀</span>
          </h2>

          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 px-1">Select Your Character</label>
            <div className="grid grid-cols-4 gap-4 mb-8">
              {CHARACTER_CONFIG.available.map((char) => (
                <button
                  key={char.id}
                  onClick={() => setSelectedCharacter(char.id)}
                  className={`relative flex flex-col items-center p-3 rounded-2xl border-2 transition-all duration-200 ${
                    selectedCharacter === char.id 
                      ? "border-teal-500 bg-teal-50 shadow-md" 
                      : "border-slate-100 hover:border-slate-300 bg-slate-50"
                  }`}
                >
                  <div className="w-8 h-12 relative overflow-hidden flex items-center justify-center">
                    <div 
                      className="absolute"
                      style={{
                        width: '16px',
                        height: '32px',
                        backgroundImage: `url(/sprites/${char.id}_16x16.png)`,
                        backgroundPosition: `-48px 0px`,
                        imageRendering: 'pixelated',
                        transform: 'scale(2.5)',
                        transformOrigin: 'center'
                      }}
                    />
                  </div>
                  {selectedCharacter === char.id && (
                    <div className="absolute -top-2 -right-2 text-teal-600 bg-white rounded-full">
                      <CheckCircle size={18} fill="currentColor" className="text-white fill-teal-600" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={() => onJoin({ displayName, characterId: selectedCharacter, videoEnabled, audioEnabled })}
            className="w-full py-5 bg-teal-500 hover:bg-teal-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-teal-500/20 transition-all flex items-center justify-center gap-3 active:scale-95 mt-auto"
          >
            Enter Workspace
          </button>
        </div>

      </div>
    </div>
  );
};
