import React from 'react';
import { Mic, Square, VolumeX } from 'lucide-react';
import { VoiceState } from '../types';

interface MicrophoneButtonProps {
  state: VoiceState;
  onToggle: () => void;
  disabled?: boolean;
}

export const MicrophoneButton: React.FC<MicrophoneButtonProps> = ({
  state,
  onToggle,
  disabled = false,
}) => {
  const isListening = state === 'listening';
  const isSpeaking = state === 'speaking';
  const isThinking = state === 'thinking';

  const getButtonLabel = () => {
    if (isListening) return 'Stop';
    if (isSpeaking) return 'Interrupt';
    if (isThinking) return 'Processing...';
    return 'Tap to speak';
  };

  const getAriaLabel = () => {
    if (isListening) return 'Stop listening';
    if (isSpeaking) return 'Interrupt AI speech and speak';
    return 'Start speaking with VisionONE AI';
  };

  return (
    <div className="flex flex-col items-center justify-center my-2">
      <button
        id="visionone-mic-button"
        type="button"
        onClick={onToggle}
        disabled={disabled || isThinking}
        aria-label={getAriaLabel()}
        className={`group relative flex items-center justify-center rounded-full transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-[#1D8DE6]/30 cursor-pointer ${
          isListening
            ? 'w-16 h-16 bg-red-500 text-white shadow-lg shadow-red-500/30 scale-105'
            : isSpeaking
            ? 'w-16 h-16 bg-[#111A3A] text-white shadow-lg shadow-[#111A3A]/30 hover:bg-[#1D8DE6]'
            : 'w-16 h-16 bg-gradient-to-tr from-[#1D8DE6] to-[#35A6F7] text-white shadow-lg shadow-[#1D8DE6]/35 hover:scale-105 hover:shadow-xl'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {/* Animated breathing pulse ring for active listening */}
        {isListening && (
          <span className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping opacity-75 pointer-events-none" />
        )}

        {/* Pulse glow for speaking */}
        {isSpeaking && (
          <span className="absolute -inset-1 rounded-full bg-[#1D8DE6]/20 animate-pulse pointer-events-none" />
        )}

        {/* Icon */}
        {isListening ? (
          <Square className="w-6 h-6 fill-current animate-pulse" />
        ) : isSpeaking ? (
          <VolumeX className="w-6 h-6" />
        ) : (
          <Mic className="w-7 h-7 transition-transform group-hover:scale-110" />
        )}
      </button>

      {/* Button Sub-Label */}
      <span
        className={`mt-2 text-xs font-semibold tracking-wide transition-colors font-['Sora'] ${
          isListening
            ? 'text-red-600 animate-pulse'
            : isSpeaking
            ? 'text-[#111A3A]'
            : 'text-[#111A3A]/80 group-hover:text-[#1D8DE6]'
        }`}
      >
        {getButtonLabel()}
      </span>
    </div>
  );
};
