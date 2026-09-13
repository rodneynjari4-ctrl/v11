import React from 'react';
import { VoiceState, ChatMessage, VoiceSettings, InteractionMode } from '../types';
import { AssistantHeader } from './AssistantHeader';
import { StartModeView } from './StartModeView';
import { VoiceModeView } from './VoiceModeView';
import { TextInputFallback } from './TextInputFallback';
import { ConversationTranscript } from './ConversationTranscript';
import { Sparkles, MessageSquare, Mic, Home, ChevronRight } from 'lucide-react';

interface AssistantPanelProps {
  voiceState: VoiceState;
  messages: ChatMessage[];
  voiceSettings: VoiceSettings;
  interactionMode: InteractionMode;
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
  onSelectTextChat: () => void;
  onSelectVoiceChat: () => void;
  onSetInteractionMode: (mode: InteractionMode) => void;
  micDisabled?: boolean;
}

export const AssistantPanel: React.FC<AssistantPanelProps> = ({
  voiceState,
  messages,
  voiceSettings,
  interactionMode,
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
  onSelectTextChat,
  onSelectVoiceChat,
  onSetInteractionMode,
  micDisabled = false,
}) => {
  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
  const lastAssistantMessage = [...messages].reverse().find((m) => m.role === 'assistant');

  return (
    <div
      id="visionone-assistant-panel"
      className="relative flex flex-col w-full h-full bg-white rounded-none sm:rounded-2xl shadow-xl border-0 sm:border sm:border-slate-200/90 overflow-hidden transition-all duration-300 select-none text-[#111A3A]"
    >
      {/* Universal Header */}
      <AssistantHeader
        onReset={onReset}
        voiceSettings={voiceSettings}
        onToggleMute={onToggleMute}
      />

      {/* Mode Navigation & Sub-tagline Bar (Visible in Text or Voice mode, or as selector) */}
      {interactionMode !== 'start' ? (
        <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between shrink-0 gap-2">
          {/* Back to Start Button */}
          <button
            onClick={() => onSetInteractionMode('start')}
            className="text-[11px] font-semibold text-[#111A3A]/70 hover:text-[#1D8DE6] flex items-center gap-1 cursor-pointer font-['Sora'] py-0.5 px-1.5 rounded-md hover:bg-white transition"
            title="Back to start selection"
            aria-label="Back to start"
          >
            <Home className="w-3 h-3" />
            <span className="hidden xs:inline">Start</span>
          </button>

          {/* Two Buttons: Text Chat & Voice Chat Mode Switcher */}
          <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 shadow-2xs">
            <button
              id="tab-text-chat"
              type="button"
              onClick={() => onSetInteractionMode('text')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer font-['Sora'] ${
                interactionMode === 'text'
                  ? 'bg-gradient-to-r from-[#1D8DE6] to-[#35A6F7] text-white shadow-xs'
                  : 'text-[#111A3A]/70 hover:text-[#111A3A] hover:bg-slate-50'
              }`}
              aria-label="Switch to Text Chat"
            >
              <MessageSquare className="w-3 h-3" />
              <span>Text Chat</span>
            </button>

            <button
              id="tab-voice-chat"
              type="button"
              onClick={() => {
                onSetInteractionMode('voice');
                if (voiceState !== 'listening' && voiceState !== 'speaking') {
                  onToggleMic();
                }
              }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer font-['Sora'] ${
                interactionMode === 'voice'
                  ? 'bg-gradient-to-r from-[#111A3A] to-[#15234D] text-white shadow-xs'
                  : 'text-[#111A3A]/70 hover:text-[#111A3A] hover:bg-slate-50'
              }`}
              aria-label="Switch to Voice Chat"
            >
              <Mic className="w-3 h-3 text-emerald-400" />
              <span>Voice Chat</span>
            </button>
          </div>

          {/* Demo Action */}
          <button
            onClick={() => onOpenCta('demo')}
            className="text-[10px] font-bold text-[#1D8DE6] hover:text-[#111A3A] flex items-center gap-0.5 cursor-pointer font-['Sora'] shrink-0"
          >
            <span>Demo</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div className="px-3.5 py-1 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between shrink-0">
          <span className="text-[10px] font-medium text-[#111A3A]/75 tracking-tight font-['Inter'] truncate">
            Intelligent ERP & Business Visibility Guide
          </span>
          <span className="text-[9px] font-semibold text-[#1D8DE6] font-['Sora']">
            VisionONE
          </span>
        </div>
      )}

      {/* Main Mode Body */}
      {interactionMode === 'start' && (
        <StartModeView
          onSelectTextChat={onSelectTextChat}
          onSelectVoiceChat={onSelectVoiceChat}
          onSelectQuestion={onSelectQuestion}
          onOpenCta={onOpenCta}
        />
      )}

      {interactionMode === 'voice' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          <VoiceModeView
            voiceState={voiceState}
            micAmplitude={micAmplitude}
            lastAssistantMessage={lastAssistantMessage}
            lastUserMessage={lastUserMessage}
            suggestedQuestions={suggestedQuestions}
            activePlayingText={activePlayingText}
            onToggleMic={onToggleMic}
            onRetry={onRetry}
            onPlayVoice={onPlayVoice}
            onSelectQuestion={onSelectQuestion}
            onSwitchToTextChat={() => onSetInteractionMode('text')}
            onOpenCta={onOpenCta}
            micDisabled={micDisabled}
          />

          {/* Collapsed Text Input Dock at bottom of Voice Mode so users can also type */}
          <TextInputFallback
            onSend={onSendText}
            voiceState={voiceState}
            onToggleMic={onToggleMic}
            disabled={voiceState === 'thinking'}
            micDisabled={micDisabled}
          />
        </div>
      )}

      {interactionMode === 'text' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          {/* Full Conversation Transcript */}
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
      )}

      {/* Responsive Footer */}
      <footer className="px-3.5 py-1.5 sm:py-2 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-[10px] text-[#111A3A]/60 font-['Inter'] shrink-0 pb-[max(env(safe-area-inset-bottom),0.5rem)]">
        <span className="flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-[#1D8DE6]" />
          <span className="font-medium">VisionONE Access</span>
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
