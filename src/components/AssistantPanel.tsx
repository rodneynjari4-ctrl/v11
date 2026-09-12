import React, { useState } from 'react';
import { VoiceState, ChatMessage, VoiceSettings } from '../types';
import { AssistantHeader } from './AssistantHeader';
import { VoiceOrb } from './VoiceOrb';
import { MicrophoneButton } from './MicrophoneButton';
import { TextInputFallback } from './TextInputFallback';
import { ConversationTranscript } from './ConversationTranscript';
import { Sparkles, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';

interface AssistantPanelProps {
  voiceState: VoiceState;
  messages: ChatMessage[];
  voiceSettings: VoiceSettings;
  micAmplitude: number;
  isTextInputOpen: boolean;
  activePlayingText: string | null;
  suggestedQuestions: string[];
  onReset: () => void;
  onToggleMute: () => void;
  onToggleMic: () => void;
  onRetry: () => void;
  onToggleTextInput: () => void;
  onSendText: (text: string) => void;
  onSelectQuestion: (question: string) => void;
  onPlayVoice: (text: string) => void;
  onOpenCta: (type: 'demo' | 'contact' | 'quote') => void;
}

export const AssistantPanel: React.FC<AssistantPanelProps> = ({
  voiceState,
  messages,
  voiceSettings,
  micAmplitude,
  isTextInputOpen,
  activePlayingText,
  suggestedQuestions,
  onReset,
  onToggleMute,
  onToggleMic,
  onRetry,
  onToggleTextInput,
  onSendText,
  onSelectQuestion,
  onPlayVoice,
  onOpenCta,
}) => {
  const [isTranscriptExpanded, setIsTranscriptExpanded] = useState(false);

  return (
    <div
      id="visionone-assistant-panel"
      className="relative flex flex-col w-full h-full max-w-[460px] max-h-[720px] bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-[#E5F0FE] overflow-hidden transition-all duration-300 select-none text-[#111A3A]"
    >
      {/* Header */}
      <AssistantHeader
        onReset={onReset}
        voiceSettings={voiceSettings}
        onToggleMute={onToggleMute}
      />

      {/* Sub-tagline Bar */}
      <div className="px-5 py-2 bg-[#E5F0FE]/40 border-b border-[#1D8DE6]/10 flex items-center justify-between">
        <span className="text-[11px] font-medium text-[#111A3A]/80 tracking-tight font-['Inter'] truncate">
          Your intelligent guide to complete business visibility.
        </span>
        <button
          onClick={() => setIsTranscriptExpanded(!isTranscriptExpanded)}
          className="shrink-0 text-[10px] font-semibold text-[#1D8DE6] hover:text-[#111A3A] flex items-center gap-1 cursor-pointer font-['Sora']"
          aria-label="Toggle transcript size"
        >
          <MessageSquare className="w-3 h-3" />
          <span>{isTranscriptExpanded ? 'Compact' : 'Transcript'}</span>
          {isTranscriptExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
        {/* If transcript is not forced full, show Voice Orb prominently */}
        <div
          className={`transition-all duration-300 flex flex-col items-center justify-center shrink-0 ${
            isTranscriptExpanded ? 'hidden' : 'py-2'
          }`}
        >
          <VoiceOrb
            state={voiceState}
            amplitude={micAmplitude}
            onRetry={onRetry}
            onClick={onToggleMic}
          />

          {/* Central Microphone Button */}
          <MicrophoneButton
            state={voiceState}
            onToggle={onToggleMic}
          />
        </div>

        {/* Conversation Transcript Section */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <ConversationTranscript
            messages={messages}
            onPlayVoice={onPlayVoice}
            onSelectQuestion={onSelectQuestion}
            onOpenCta={onOpenCta}
            activePlayingText={activePlayingText}
            suggestedQuestions={suggestedQuestions}
            isThinking={voiceState === 'thinking'}
          />
        </div>

        {/* Text Input Fallback (Collapsible) */}
        <TextInputFallback
          isOpen={isTextInputOpen}
          onToggle={onToggleTextInput}
          onSend={onSendText}
          disabled={voiceState === 'thinking'}
        />
      </div>

      {/* Footer Branding */}
      <footer className="px-5 py-2.5 bg-[#F8FAFC] border-t border-[#E5F0FE] flex items-center justify-between text-[11px] text-[#111A3A]/60 font-['Inter']">
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-[#1D8DE6]" />
          <span>Powered by <strong>VisionONE Access</strong></span>
        </span>
        <button
          onClick={() => onOpenCta('demo')}
          className="text-[11px] font-semibold text-[#1D8DE6] hover:text-[#111A3A] transition cursor-pointer font-['Sora']"
        >
          Book a Demo →
        </button>
      </footer>
    </div>
  );
};
