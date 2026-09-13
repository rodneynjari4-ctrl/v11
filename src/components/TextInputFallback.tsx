import React, { useState, useRef } from 'react';
import { Send } from 'lucide-react';
import { VoiceState } from '../types';
import { MicrophoneButton } from './MicrophoneButton';

interface TextInputFallbackProps {
  onSend: (text: string) => void;
  voiceState: VoiceState;
  onToggleMic: () => void;
  disabled?: boolean;
  micDisabled?: boolean;
}

export const TextInputFallback: React.FC<TextInputFallbackProps> = ({
  onSend,
  voiceState,
  onToggleMic,
  disabled = false,
  micDisabled = false,
}) => {
  const [inputText, setInputText] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setInputText('');
  };

  return (
    <div className="px-3 pb-2 pt-1">
      <form
        onSubmit={handleSend}
        className="flex items-center gap-1.5 p-1 bg-white rounded-2xl border border-[#1D8DE6]/25 shadow-xs focus-within:border-[#1D8DE6] focus-within:ring-2 focus-within:ring-[#1D8DE6]/15 transition-all"
      >
        {/* Microphone Button integrated inside input bar */}
        <MicrophoneButton
          state={voiceState}
          onToggle={onToggleMic}
          disabled={micDisabled || disabled}
        />

        {/* Text Input */}
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={voiceState === 'listening' ? 'Listening to speech...' : 'Type your question...'}
          disabled={disabled}
          className="flex-1 px-2 py-1 text-xs text-[#111A3A] placeholder-[#111A3A]/45 outline-none bg-transparent font-['Inter'] min-w-0"
        />

        {/* Send Button */}
        <button
          type="submit"
          disabled={!inputText.trim() || disabled}
          className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#1D8DE6] text-white hover:bg-[#111A3A] disabled:opacity-30 transition-colors cursor-pointer shrink-0"
          aria-label="Send message"
          title="Send message"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
