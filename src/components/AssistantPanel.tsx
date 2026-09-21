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
  onReset: () => void;
  onClose?: () => void;
  onToggleMute: () => void;
  onToggleMic: () => void;
  onRetry: () => void;
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
  hasStarted = false,
  liveTranscript = '',
  onReset,
  onClose,
  onToggleMute,
  onToggleMic,
  onRetry,
  onSelectQuestion,
  onPlayVoice,
  onOpenCta,
  micDisabled = false,
}) => {
  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
  const lastAssistantMessage = [...messages].reverse().find((m) => m.role === 'assistant');

  return (
    <div
      id="visionone-assistant-panel"
      className="relative flex flex-col w-full h-full bg-white rounded-none sm:rounded-2xl shadow-xl border-0 sm:border sm:border-slate-200/90 overflow-hidden transition-all duration-300 select-none text-[#111A3A]"
    >
      {/* Universal Header with Close Button */}
      <AssistantHeader
        onReset={onReset}
        voiceSettings={voiceSettings}
        onToggleMute={onToggleMute}
        onClose={onClose}
      />

      {/* Sub-header status bar - Dedicated to Voice AI */}
      <div className="px-3.5 py-1.5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5">
          <Mic className="w-3.5 h-3.5 text-[#1D8DE6]" />
          <span className="text-[11px] font-semibold text-[#111A3A] font-['Sora']">
            Hands-Free Voice AI
          </span>
          <span className="text-[9px] font-medium px-1.5 py-0.2 rounded-sm bg-emerald-100 text-emerald-800">
            {!hasStarted ? 'Ready' : 'Active'}
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
          onToggleMic={onToggleMic}
          onRetry={onRetry}
          onPlayVoice={onPlayVoice}
          onSelectQuestion={onSelectQuestion}
          onOpenCta={onOpenCta}
          micDisabled={micDisabled}
        />
      </div>

      {/* Responsive Clean Footer */}
      <footer className="px-3.5 py-1.5 sm:py-2 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-[10px] text-[#111A3A]/60 font-['Inter'] shrink-0 pb-[max(env(safe-area-inset-bottom),0.5rem)]">
        <span className="flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-[#1D8DE6]" />
          <span className="font-medium">VisionONE Voice Access</span>
        </span>
        <span className="text-[9px] text-[#111A3A]/50">
          Continuous Automatic Turn-Taking
        </span>
      </footer>
    </div>
  );
};
