import React from 'react';
import { VoiceState, ChatMessage, VoiceSettings } from '../types';
import { AssistantHeader } from './AssistantHeader';
import { VoiceModeView } from './VoiceModeView';
import { Sparkles, Mic, ChevronRight } from 'lucide-react';

interface AssistantPanelProps {
  voiceState: VoiceState;
  messages: ChatMessage[];
  voiceSettings: VoiceSettings;
  micAmplitude: number;
  activePlayingText: string | null;
  suggestedQuestions: string[];
  hasStarted?: boolean;
  liveTranscript?: string;
  isConversationOver?: boolean;
  isAutoplayBlocked?: boolean;
  onReset: () => void;
  onClose?: () => void;
  onMinimize?: () => void;
  onOpenEmbedGuide?: () => void;
  onToggleMute: () => void;
  onToggleMic: () => void;
  onRetry: () => void;
  onSelectQuestion: (question: string) => void;
  onPlayVoice: (text: string, audioUrl?: string) => void;
  onSubmitTranscript?: () => void;
  onSendMessage?: (msg: string) => void;
  onOpenCta: (type: 'demo' | 'contact' | 'quote') => void;
  onRestartConversation?: () => void;
  micDisabled?: boolean;
}

export const AssistantPanel: React.FC<AssistantPanelProps> = ({
  voiceState,
  messages,
  voiceSettings,
  micAmplitude,
  activePlayingText,
  suggestedQuestions,
  hasStarted = false,
  liveTranscript = '',
  isConversationOver = false,
  isAutoplayBlocked = false,
  onReset,
  onClose,
  onMinimize,
  onOpenEmbedGuide,
  onToggleMute,
  onToggleMic,
  onRetry,
  onSelectQuestion,
  onSendMessage,
  onPlayVoice,
  onSubmitTranscript,
  onOpenCta,
  onRestartConversation,
  micDisabled = false,
}) => {
  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
  const lastAssistantMessage = [...messages].reverse().find((m) => m.role === 'assistant');
  const currentQaScore = lastAssistantMessage?.qaScore || 98;

  return (
    <div
      id="visionone-assistant-panel"
      className="glass-panel relative flex flex-col w-full h-full rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 select-none text-[#111A3A]"
    >
      {/* Universal Header with Close Button and Critic QA Score */}
      <AssistantHeader
        onReset={onReset}
        voiceSettings={voiceSettings}
        onToggleMute={onToggleMute}
        onMinimize={onMinimize}
        onClose={onClose}
        onOpenEmbedGuide={onOpenEmbedGuide}
        qaScore={currentQaScore}
      />

      {/* Sub-header status bar - Dedicated to Voice AI */}
      <div className="px-3.5 py-1.5 bg-white/40 backdrop-blur-md border-b border-white/20 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5">
          <Mic className="w-3.5 h-3.5 text-[#1D8DE6]" />
          <span className="text-[11px] font-semibold text-[#111A3A] font-['Sora']">
            Hands-Free Voice AI
          </span>
          <span className={`text-[8px] font-semibold px-1.5 py-0.2 rounded-full ${
            isConversationOver
              ? 'bg-blue-100/80 text-blue-800'
              : !hasStarted
              ? 'bg-amber-100/80 text-amber-800'
              : 'bg-emerald-100/80 text-emerald-800'
          }`}>
            {isConversationOver ? 'Concluded' : !hasStarted ? 'Intro' : 'Active'}
          </span>
        </div>

        <button
          onClick={() => onOpenCta('demo')}
          className="text-[10px] font-bold text-[#1D8DE6] hover:text-[#111A3A] flex items-center gap-0.5 cursor-pointer font-['Sora'] shrink-0"
        >
          <span>Schedule Demo</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Direct Voice View */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
        <VoiceModeView
          voiceState={voiceState}
          micAmplitude={micAmplitude}
          lastAssistantMessage={lastAssistantMessage}
          lastUserMessage={lastUserMessage}
          suggestedQuestions={suggestedQuestions}
          activePlayingText={activePlayingText}
          hasStarted={hasStarted}
          liveTranscript={liveTranscript}
          isConversationOver={isConversationOver}
          isAutoplayBlocked={isAutoplayBlocked}
          onToggleMic={onToggleMic}
          onRetry={onRetry}
          onPlayVoice={onPlayVoice}
          onSubmitTranscript={onSubmitTranscript}
          onSelectQuestion={onSelectQuestion}
          onSendMessage={onSendMessage}
          onOpenCta={onOpenCta}
          onClose={onClose}
          onRestartConversation={onRestartConversation}
          micDisabled={micDisabled}
        />
      </div>

      {/* Responsive Clean Footer */}
      <footer className="px-3 py-1.5 bg-white/30 backdrop-blur-md border-t border-white/20 flex items-center justify-between text-[9px] text-[#111A3A]/60 font-['Inter'] shrink-0 pb-[max(env(safe-area-inset-bottom),0.35rem)]">
        <span className="flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-[#1D8DE6]" />
          <span className="font-semibold text-[#111A3A]/80">VisionONE Voice</span>
        </span>
        <span className="text-[9px] text-[#111A3A]/50">
          Continuous Hands-Free Turn-Taking
        </span>
      </footer>
    </div>
  );
};
