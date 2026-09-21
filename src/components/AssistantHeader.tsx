import React from 'react';
import { Volume2, VolumeX, RotateCcw, ShieldCheck, X } from 'lucide-react';
import { VoiceSettings } from '../types';

interface AssistantHeaderProps {
  onReset: () => void;
  voiceSettings: VoiceSettings;
  onToggleMute: () => void;
  onClose?: () => void;
}

export const AssistantHeader: React.FC<AssistantHeaderProps> = ({
  onReset,
  voiceSettings,
  onToggleMute,
  onClose,
}) => {
  return (
    <header
      id="visionone-assistant-header"
      className="px-3.5 py-2.5 bg-[#111A3A] text-white flex items-center justify-between border-b border-white/10 select-none shadow-xs shrink-0"
    >
      {/* Brand & Identity */}
      <div className="flex items-center gap-2.5">
        {/* VisionONE Access Emblem */}
        <div className="relative w-7 h-7 rounded-lg bg-white/10 backdrop-blur-md flex items-center justify-center p-1 border border-white/15 shadow-inner shrink-0">
          <svg viewBox="0 0 40 40" fill="none" className="w-full h-full">
            <path
              d="M8 20C8 13.3726 13.3726 8 20 8C26.6274 8 32 13.3726 32 20C32 26.6274 26.6274 32 20 32"
              stroke="#35A6F7"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <circle cx="20" cy="20" r="4.5" fill="#FFFFFF" />
            <path
              d="M20 12V20L25 25"
              stroke="#FFFFFF"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border-2 border-[#111A3A]" />
        </div>

        <div>
          <h1 className="text-xs sm:text-sm font-bold tracking-tight text-white font-['Sora'] leading-none">
            VisionONE Access AI
          </h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="inline-flex items-center gap-1 text-[9px] font-medium text-[#E5F0FE]/90 font-['Inter']">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              AI Assistant
            </span>
            <span className="text-[9px] text-white/40">•</span>
            <span className="text-[9px] text-[#35A6F7] font-['IBM_Plex_Mono'] flex items-center gap-0.5">
              <ShieldCheck className="w-2.5 h-2.5" /> ERP Verified
            </span>
          </div>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-1 text-white/80">
        <button
          onClick={onToggleMute}
          className="p-1.5 rounded-md hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title={voiceSettings.isMuted ? 'Unmute voice responses' : 'Mute voice responses'}
          aria-label={voiceSettings.isMuted ? 'Unmute voice' : 'Mute voice'}
        >
          {voiceSettings.isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-300" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>

        <button
          onClick={onReset}
          className="p-1.5 rounded-md hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Restart conversation"
          aria-label="Restart conversation"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:text-white hover:bg-white/15 transition-colors cursor-pointer text-white/80 hover:text-white ml-0.5"
            title="Close Assistant"
            aria-label="Close Assistant"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};
