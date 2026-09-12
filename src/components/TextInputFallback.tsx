import React, { useState, useRef, useEffect } from 'react';
import { Send, Keyboard, X } from 'lucide-react';

interface TextInputFallbackProps {
  isOpen: boolean;
  onToggle: () => void;
  onSend: (text: string) => void;
  disabled?: boolean;
}

export const TextInputFallback: React.FC<TextInputFallbackProps> = ({
  isOpen,
  onToggle,
  onSend,
  disabled = false,
}) => {
  const [inputText, setInputText] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || disabled) return;
    onSend(inputText.trim());
    setInputText('');
  };

  if (!isOpen) {
    return (
      <div className="flex justify-center pb-2">
        <button
          type="button"
          onClick={onToggle}
          className="text-[11px] font-medium text-[#1D8DE6] hover:text-[#111A3A] transition-colors flex items-center gap-1 px-3 py-1 rounded-full hover:bg-[#E5F0FE]/70 cursor-pointer font-['Inter']"
        >
          <Keyboard className="w-3.5 h-3.5" />
          <span>Type instead</span>
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 pb-3 pt-1 animate-fadeIn">
      <form
        onSubmit={handleSend}
        className="flex items-center gap-1.5 p-1.5 bg-white rounded-2xl border border-[#1D8DE6]/30 shadow-sm focus-within:border-[#1D8DE6] focus-within:ring-2 focus-within:ring-[#1D8DE6]/20 transition-all"
      >
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask VisionONE anything..."
          disabled={disabled}
          className="flex-1 px-3 py-1.5 text-xs text-[#111A3A] placeholder-[#111A3A]/40 outline-none bg-transparent font-['Inter']"
        />

        <button
          type="submit"
          disabled={!inputText.trim() || disabled}
          className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#1D8DE6] text-white hover:bg-[#35A6F7] disabled:opacity-40 transition-colors cursor-pointer shrink-0"
          aria-label="Send text message"
        >
          <Send className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={onToggle}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-[#111A3A]/50 hover:text-[#111A3A] hover:bg-[#E5F0FE] transition-colors cursor-pointer shrink-0"
          aria-label="Close text input"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
