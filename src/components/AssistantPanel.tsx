import React, { useState } from 'react';
import { VoiceState, ChatMessage, VoiceSettings } from '../types';
import { AssistantHeader } from './AssistantHeader';
import { VoiceOrb } from './VoiceOrb';
import { TextInputFallback } from './TextInputFallback';
import { ConversationTranscript } from './ConversationTranscript';
import { Sparkles, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';

interface AssistantPanelProps {
  voiceState: VoiceState;
  messages: ChatMessage[];
  voiceSettings: VoiceSettings;
  micAmplitude: number;
  activePlayingText: string | null;
  suggestedQuestions: string[];
  onReset: () => void;
  onToggleMute: () => void;
  onToggleMic: () => void;
  onRetry: () => void;
  onSendText: (text: string) => void;
  onSelectQuestion: (question: string) => void;
  onPlayVoice: (text: string) => void;
  onOpenCta: (type: 'demo' | 'contact' | 'quote') => void;
  micDisabled?: boolean;
}

export const AssistantPanel: React.FC<AssistantPanelProps> = ({
  voiceState,
  messages,
  voiceSettings,
  micAmplitude,
  activePlayingText,
  suggestedQuestions,
  onReset,
  onToggleMute,
  onToggleMic,
  onRetry,
  onSendText,
  onSelectQuestion,
  onPlayVoice,
  onOpenCta,
  micDisabled = false,
}) => {
  const [isTranscriptExpanded, setIsTranscriptExpanded] = useState(false);

  return (
    <div
      id="visionone-assistant-panel"
      className="relative flex flex-col w-full h-full max-w-[370px] max-h-[560px] bg-white/98 backdrop-blur-xl rounded-2xl shadow-xl border border-[#E5F0FE] overflow-hidden transition-all duration-300 select-none text-[#111A3A]"
    >
      {/* Header */}
      <AssistantHeader
        onReset={onReset}
        voiceSettings={voiceSettings}
        onToggleMute={onToggleMute}
      />

      {/* Sub-tagline Bar */}
      <div className="px-3.5 py-1 bg-[#E5F0FE]/50 border-b border-[#1D8DE6]/10 flex items-center justify-between shrink-0">
        <span className="text-[10px] font-medium text-[#111A3A]/80 tracking-tight font-['Inter'] truncate">
          Complete Business Visibility Guide
        </span>
        <button
          onClick={() => setIsTranscriptExpanded(!isTranscriptExpanded)}
          className="shrink-0 text-[9px] font-semibold text-[#1D8DE6] hover:text-[#111A3A] flex items-center gap-0.5 cursor-pointer font-['Sora'] ml-2"
          aria-label="Toggle transcript size"
        >
          <MessageSquare className="w-2.5 h-2.5" />
          <span>{isTranscriptExpanded ? 'Show Orb' : 'Full Chat'}</span>
          {isTranscriptExpanded ? <ChevronDown className="w-2.5 h-2.5" /> : <ChevronUp className="w-2.5 h-2.5" />}
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
        {/* Voice Orb Area (collapsible if user switches to full transcript) */}
        {!isTranscriptExpanded && (
          <div className="transition-all duration-200 flex flex-col items-center justify-center shrink-0 pt-1 pb-0.5">
            <VoiceOrb
              state={voiceState}
              amplitude={micAmplitude}
              onRetry={onRetry}
              onClick={onToggleMic}
            />
          </div>
        )}

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

        {/* Unified Input Dock (Text Input + Integrated Mic Button + Send Button) */}
        <TextInputFallback
          onSend={onSendText}
          voiceState={voiceState}
          onToggleMic={onToggleMic}
          disabled={voiceState === 'thinking'}
          micDisabled={micDisabled}
        />
      </div>

      {/* Compact Footer */}
      <footer className="px-3.5 py-1.5 bg-[#F8FAFC] border-t border-[#E5F0FE] flex items-center justify-between text-[10px] text-[#111A3A]/60 font-['Inter'] shrink-0">
        <span className="flex items-center gap-1">
          <Sparkles className="w-2.5 h-2.5 text-[#1D8DE6]" />
          <span>VisionONE Access</span>
        </span>
        <button
          onClick={() => onOpenCta('demo')}
          className="text-[10px] font-semibold text-[#1D8DE6] hover:text-[#111A3A] transition cursor-pointer font-['Sora']"
        >
          Book a Demo →
        </button>
      </footer>
    </div>
  );
};
