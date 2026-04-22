import React, { memo } from "react";
import { CHARACTER_CONFIG } from "./config";

interface CharacterSelectorProps {
  onSelect: (characterId: string) => void;
}

const CharacterSelectorComponent: React.FC<CharacterSelectorProps> = ({ onSelect }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80">
      <div className="bg-white p-8 rounded-none border-2 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] max-w-2xl w-full">
        <h2 className="text-3xl font-bold text-slate-900 mb-2 uppercase tracking-tight">
          Select Your Character
        </h2>
        <p className="text-slate-500 mb-8 font-medium">
          Choose an avatar to represent you in the workspace.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          {CHARACTER_CONFIG.available.map((char) => (
            <button
              key={char.id}
              onClick={() => onSelect(char.id)}
              className="group relative flex flex-col items-center p-6 border-2 border-slate-200 hover:border-teal-500 hover:bg-teal-50 transition-colors duration-200"
            >
              {/* Sprite Preview Container */}
              <div className="w-16 h-32 mb-4 relative overflow-hidden flex items-center justify-center">
                <div 
                  className="absolute [will-change:transform]"
                  style={{
                    width: '16px',
                    height: '32px',
                    backgroundImage: `url(/sprites/${char.id}_16x16.png)`,
                    backgroundPosition: `-48px 0px`, // 4th frame (index 3)
                    imageRendering: 'pixelated',
                    transform: 'scale(4)',
                    transformOrigin: 'center'
                  }}
                />
              </div>
              
              <span className="text-lg font-bold text-slate-700 group-hover:text-teal-700 uppercase tracking-wider">
                {char.name}
              </span>

              {/* Hover effect overlay */}
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-teal-500 pointer-events-none" />
            </button>
          ))}
        </div>

        <div className="flex justify-end">
          <p className="text-xs text-slate-400 italic">
            * More characters coming soon
          </p>
        </div>
      </div>
    </div>
  );
};

export const CharacterSelector = memo(CharacterSelectorComponent);
