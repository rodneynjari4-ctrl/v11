import React from 'react';
import { VoiceState, ChatMessage } from '../types';
import { VoiceOrb } from './VoiceOrb';
import { Mic, Square, Loader2, Volume2, Sparkles, ArrowRight, Play } from 'lucide-react';

interface VoiceModeViewProps {
  voiceState: VoiceState;
  micAmplitude: number;
  lastAssistantMessage?: ChatMessage;
  lastUserMessage?: ChatMessage;
  suggestedQuestions: string[];
  activePlayingText: string | null;
  onToggleMic: () => void;
  onRetry: () => void;
  onPlayVoice: (text: string) => void;
  onSelectQuestion: (question: string) => void;
  onOpenCta: (type: 'demo' | 'contact' | 'quote') => void;
  micDisabled?: boolean;
}

export const VoiceModeView: React.FC<VoiceModeViewProps> = ({
  voiceState,
  micAmplitude,
  lastAssistantMessage,
  lastUserMessage,
  suggestedQuestions,
  activePlayingText,
  onToggleMic,
  onRetry,
  onPlayVoice,
  onSelectQuestion,
  onOpenCta,
  micDisabled = false,
}) => {
  const isListening = voiceState === 'listening';
  const isSpeaking = voiceState === 'speaking';
  const isThinking = voiceState === 'thinking';

  const getStatusLabel = () => {
    if (isListening) return 'Listening continuously... speak freely';
    if (isThinking) return 'Analyzing question and preparing response...';
    if (isSpeaking) return 'Speaking response aloud (tap to pause)';
    return 'Hands-free mode active — speak anytime';
  };

  const getStatusBadge = () => {
    if (isListening) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-700 text-xs font-semibold animate-pulse">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          Listening Automatically (Hands-Free)
        </span>
      );
    }
    if (isThinking) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1D8DE6]/10 border border-[#1D8DE6]/30 text-[#1D8DE6] text-xs font-semibold">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Consulting VisionONE ERP...
        </span>
      );
    }
    if (isSpeaking) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-700 text-xs font-semibold">
          <Volume2 className="w-3.5 h-3.5 animate-bounce" />
          Speaking Spoken Answer
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E5F0FE] border border-[#1D8DE6]/20 text-[#111A3A] text-xs font-medium">
        <Sparkles className="w-3 h-3 text-[#1D8DE6]" />
        Hands-Free Auto-Voice Active
      </span>
    );
  };

  return (
    <div
      id="visionone-voice-view"
      className="flex-1 flex flex-col justify-between items-center px-4 py-3 sm:py-4 overflow-y-auto min-h-0 bg-gradient-to-b from-[#F8FAFC] to-white select-none text-[#111A3A]"
    >
      {/* Top Status & Hands-free Mode indicator */}
      <div className="flex flex-col items-center gap-1.5 shrink-0 pt-1">
        {getStatusBadge()}
        <p className="text-[11px] text-[#111A3A]/70 font-['Inter'] text-center">
          {getStatusLabel()}
        </p>
      </div>

      {/* Central Voice Orb & Ambient Visualizer */}
      <div className="my-auto flex flex-col items-center justify-center py-2 relative w-full">
        <VoiceOrb
          state={voiceState}
          amplitude={micAmplitude}
          onRetry={onRetry}
          onClick={onToggleMic}
        />

        {/* Live Conversation Transcript Card (Shows latest query and response) */}
        <div className="w-full max-w-sm mt-3 space-y-2">
          {lastUserMessage && (
            <div className="bg-[#1D8DE6]/10 border border-[#1D8DE6]/20 rounded-xl px-3 py-1.5 text-xs text-[#111A3A] flex items-center justify-between">
              <span className="text-[10px] font-semibold text-[#1D8DE6] uppercase tracking-wider font-['Sora'] mr-2 shrink-0">
                You asked:
              </span>
              <span className="font-['Inter'] truncate text-right font-medium">{lastUserMessage.text}</span>
            </div>
          )}

          {lastAssistantMessage && (
            <div className="bg-white rounded-xl p-3 border border-[#E5F0FE] shadow-xs space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-[#111A3A]/60">
                <span className="font-bold flex items-center gap-1 text-[#1D8DE6] font-['Sora']">
                  <Sparkles className="w-3 h-3" /> Voice Response:
                </span>
                {onPlayVoice && (
                  <button
                    onClick={() => onPlayVoice(lastAssistantMessage.voiceText || lastAssistantMessage.text)}
                    className="flex items-center gap-1 text-[#1D8DE6] hover:underline cursor-pointer font-medium"
                    title="Replay spoken answer"
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>Replay Audio</span>
                  </button>
                )}
              </div>
              <p className="text-xs font-['Inter'] text-[#111A3A] leading-relaxed line-clamp-3">
                {lastAssistantMessage.voiceText || lastAssistantMessage.text}
              </p>

              {lastAssistantMessage.cta && (
                <button
                  onClick={() => onOpenCta(lastAssistantMessage.cta!.type)}
                  className="w-full mt-1.5 py-1.5 px-3 rounded-lg bg-[#111A3A] hover:bg-[#1D8DE6] text-white text-xs font-semibold flex items-center justify-center gap-1 transition shadow-xs"
                >
                  <span>{lastAssistantMessage.cta.label}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Primary Voice Controls (Status & Quick Topic Chips) */}
      <div className="w-full flex flex-col items-center gap-2.5 pt-2 shrink-0">
        <div className="flex items-center gap-3">
          {/* Hands-free Toggle / Interrupt Button */}
          <button
            type="button"
            onClick={onToggleMic}
            disabled={micDisabled || isThinking}
            aria-label={isListening ? 'Pause listening' : isSpeaking ? 'Interrupt speaking' : 'Resume listening'}
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 cursor-pointer active:scale-95 focus:outline-none focus:ring-4 ${
              isListening
                ? 'bg-emerald-600 text-white shadow-emerald-600/40 ring-emerald-300 animate-pulse'
                : isSpeaking
                ? 'bg-[#111A3A] text-white shadow-[#111A3A]/30 ring-[#1D8DE6]/40 hover:bg-[#1D8DE6]'
                : 'bg-gradient-to-tr from-[#1D8DE6] to-[#35A6F7] text-white shadow-[#1D8DE6]/30 ring-[#1D8DE6]/30 hover:scale-105'
            }`}
          >
            {isThinking ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : isListening ? (
              <Mic className="w-6 h-6 sm:w-7 sm:h-7 animate-pulse" />
            ) : isSpeaking ? (
              <Square className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-current ml-0.5" />
            )}
          </button>
        </div>

        {/* Quick Voice Topics (Tap any to speak question aloud instantly) */}
        {suggestedQuestions.length > 0 && (
          <div className="w-full flex flex-col items-center gap-1">
            <span className="text-[10px] text-[#111A3A]/60 font-['Inter']">
              Or tap any topic to ask aloud:
            </span>
            <div className="w-full flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 justify-start sm:justify-center">
              {suggestedQuestions.slice(0, 3).map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelectQuestion(q)}
                  className="shrink-0 text-[10px] font-medium font-['Inter'] px-2.5 py-1 rounded-full bg-white hover:bg-[#E5F0FE] text-[#111A3A] border border-[#1D8DE6]/25 shadow-2xs hover:border-[#1D8DE6] transition-all cursor-pointer whitespace-nowrap"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
