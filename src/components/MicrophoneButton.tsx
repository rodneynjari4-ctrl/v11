import React from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
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

  const getAriaLabel = () => {
    if (isListening) return 'Stop listening';
    if (isSpeaking) return 'Interrupt speech and speak';
    if (isThinking) return 'Thinking...';
    return 'Start speaking';
  };

  return (
    <button
      id="visionone-mic-button"
      type="button"
      onClick={onToggle}
      disabled={disabled || isThinking}
      aria-label={getAriaLabel()}
      title={isListening ? 'Stop listening' : isSpeaking ? 'Interrupt AI and speak' : 'Speak with VisionONE'}
      className={`relative w-9 h-9 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer shrink-0 focus:outline-none focus:ring-2 focus:ring-[#1D8DE6]/30 active:scale-95 ${
        isListening
          ? 'bg-red-500 text-white shadow-md shadow-red-500/30 animate-pulse'
          : isSpeaking
          ? 'bg-[#111A3A] text-white hover:bg-[#1D8DE6]'
          : 'bg-[#E5F0FE] text-[#1D8DE6] hover:bg-[#1D8DE6] hover:text-white'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      {/* Animated ping ring for active listening */}
      {isListening && (
        <span className="absolute -inset-0.5 rounded-xl border border-red-400 animate-ping opacity-70 pointer-events-none" />
      )}

      {/* Icon */}
      {isThinking ? (
        <Loader2 className="w-4 h-4 sm:w-3.5 sm:h-3.5 animate-spin" />
      ) : isListening ? (
        <Square className="w-3.5 h-3.5 fill-current" />
      ) : (
        <Mic className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
      )}
    </button>
  );
};
