import React from 'react';
import { Volume2, VolumeX, RotateCcw, ShieldCheck, Minus, Code2, X } from 'lucide-react';
import { VoiceSettings } from '../types';

interface AssistantHeaderProps {
  onReset: () => void;
  voiceSettings: VoiceSettings;
  onToggleMute: () => void;
  onMinimize?: () => void;
  onClose?: () => void;
  onOpenEmbedGuide?: () => void;
  qaScore?: number;
}

export const AssistantHeader: React.FC<AssistantHeaderProps> = ({
  onReset,
  voiceSettings,
  onToggleMute,
  onMinimize,
  onClose,
  onOpenEmbedGuide,
  qaScore = 98,
}) => {
  return (
    <header
      id="visionone-assistant-header"
      className="px-3.5 py-2 bg-[#111A3A]/92 backdrop-blur-xl text-white flex items-center justify-between border-b border-white/15 select-none shadow-xs shrink-0"
    >
      {/* Brand & Identity */}
      <div className="flex items-center gap-2">
        {/* VisionONE Access Emblem */}
        <div className="relative w-6 h-6 rounded-lg bg-white/15 backdrop-blur-md flex items-center justify-center p-1 border border-white/20 shadow-inner shrink-0">
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
          <span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 border border-[#111A3A]" />
        </div>

        <div>
          <h1 className="text-xs font-bold tracking-tight text-white font-['Sora'] leading-tight">
            VisionONE Access AI
          </h1>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-[9px] font-medium text-[#E5F0FE]/90 font-['Inter']">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Voice AI
            </span>
            <span className="text-[9px] text-white/30">•</span>
            <span className="text-[9px] text-[#35A6F7] font-['IBM_Plex_Mono'] flex items-center gap-0.5" title="Critic Agent QA Verified">
              <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" /> QA {qaScore}%
            </span>
          </div>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-0.5 text-white/85">
        {onOpenEmbedGuide && (
          <button
            onClick={onOpenEmbedGuide}
            className="p-1 rounded-md hover:text-white hover:bg-white/15 transition-colors cursor-pointer text-[#35A6F7]"
            title="WordPress HFCM Embed Code & Settings"
            aria-label="WordPress HFCM Embed Code"
          >
            <Code2 className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          onClick={onToggleMute}
          className="p-1 rounded-md hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
          title={voiceSettings.isMuted ? 'Unmute voice responses' : 'Mute voice responses'}
          aria-label={voiceSettings.isMuted ? 'Unmute voice' : 'Mute voice'}
        >
          {voiceSettings.isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-300" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>

        <button
          onClick={onReset}
          className="p-1 rounded-md hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
          title="Restart conversation"
          aria-label="Restart conversation"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {onMinimize && (
          <button
            onClick={onMinimize}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
            title="Minimize to floating button"
            aria-label="Minimize to floating button"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
        )}

        {onClose && (
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:text-white hover:bg-red-500/25 transition-colors cursor-pointer text-white/80 hover:text-red-200"
            title="Close Assistant"
            aria-label="Close Assistant"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </header>
  );
};
