import React from 'react';
import { VoiceState, ChatMessage } from '../types';
import { VoiceOrb } from './VoiceOrb';
import {
  Mic,
  Square,
  Loader2,
  Volume2,
  Sparkles,
  ArrowRight,
  CheckCircle,
  RotateCcw,
  X,
  ShieldCheck,
} from 'lucide-react';

interface VoiceModeViewProps {
  voiceState: VoiceState;
  micAmplitude: number;
  lastAssistantMessage?: ChatMessage;
  lastUserMessage?: ChatMessage;
  suggestedQuestions: string[];
  activePlayingText: string | null;
  hasStarted?: boolean;
  liveTranscript?: string;
  isConversationOver?: boolean;
  isAutoplayBlocked?: boolean;
  onToggleMic: () => void;
  onRetry: () => void;
  onPlayVoice: (text: string, audioUrl?: string) => void;
  onSubmitTranscript?: () => void;
  onSelectQuestion: (question: string) => void;
  onOpenCta: (type: 'demo' | 'contact' | 'quote') => void;
  onClose?: () => void;
  onRestartConversation?: () => void;
  micDisabled?: boolean;
}

export const VoiceModeView: React.FC<VoiceModeViewProps> = ({
  voiceState,
  micAmplitude,
  lastAssistantMessage,
  lastUserMessage,
  suggestedQuestions,
  activePlayingText,
  hasStarted = false,
  liveTranscript = '',
  isConversationOver = false,
  isAutoplayBlocked = false,
  onToggleMic,
  onRetry,
  onPlayVoice,
  onSubmitTranscript,
  onSelectQuestion,
  onOpenCta,
  onClose,
  onRestartConversation,
  micDisabled = false,
}) => {
  const isListening = voiceState === 'listening';
  const isSpeaking = voiceState === 'speaking';
  const isThinking = voiceState === 'thinking';

  const getStatusLabel = () => {
    if (isConversationOver) {
      return 'Session complete. Tap Start New Conversation to continue.';
    }
    if (isAutoplayBlocked) {
      return 'Browser requires a tap to enable audio & speech';
    }
    if (!hasStarted && voiceState === 'idle') {
      return 'Tap to begin voice conversation';
    }
    if (isListening) {
      return liveTranscript
        ? 'Hearing your voice... pause when finished'
        : 'Listening hands-free... speak anytime';
    }
    if (isThinking) return 'Evaluating with QA Critic & synthesizing speech...';
    if (isSpeaking) return 'Speaking neural audio response';
    return 'Hands-free mode active — speak anytime';
  };

  const getStatusBadge = () => {
    if (isConversationOver) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold shadow-2xs">
          <CheckCircle className="w-3.5 h-3.5 text-slate-500" />
          Session Finished
        </span>
      );
    }
    if (isAutoplayBlocked) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-300 text-amber-800 text-xs font-semibold animate-pulse">
          <Volume2 className="w-3.5 h-3.5 text-amber-600" />
          Tap to Enable Voice
        </span>
      );
    }
    if (!hasStarted && voiceState === 'idle') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E5F0FE] border border-[#1D8DE6]/40 text-[#1D8DE6] text-xs font-semibold shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-[#1D8DE6]" />
          Starting Voice AI...
        </span>
      );
    }
    if (isListening) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-700 text-xs font-semibold animate-pulse">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          Listening (Hands-Free)
        </span>
      );
    }
    if (isThinking) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1D8DE6]/10 border border-[#1D8DE6]/30 text-[#1D8DE6] text-xs font-semibold">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Critic QA & Voice Synthesis...
        </span>
      );
    }
    if (isSpeaking) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-700 text-xs font-semibold">
          <Volume2 className="w-3.5 h-3.5 animate-bounce" />
          Speaking Neural Voice
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
          hasStarted={hasStarted}
        />

        {/* Live Conversation Transcript Card */}
        <div className="w-full max-w-sm mt-3 space-y-2">
          {/* Live speech feedback while user is actively talking */}
          {liveTranscript && isListening && (
            <div className="bg-[#E5F0FE] border border-[#1D8DE6]/40 rounded-xl p-2.5 text-xs text-[#111A3A] flex flex-col gap-1.5 shadow-xs animate-pulse">
              <div className="flex items-center justify-between text-[10px] text-[#1D8DE6] font-semibold font-['Sora']">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  Hearing you:
                </span>
                {onSubmitTranscript ? (
                  <button
                    onClick={onSubmitTranscript}
                    className="px-2 py-0.5 rounded-full bg-[#1D8DE6] hover:bg-[#111A3A] text-white text-[9px] font-semibold transition cursor-pointer flex items-center gap-1"
                    title="Send message immediately"
                  >
                    <span>Done speaking</span>
                    <ArrowRight className="w-2.5 h-2.5" />
                  </button>
                ) : (
                  <span className="text-[9px] text-[#111A3A]/60 font-normal font-['Inter']">
                    Pause when finished
                  </span>
                )}
              </div>
              <p className="font-['Inter'] font-medium text-[#111A3A] italic leading-snug">
                "{liveTranscript}"
              </p>
            </div>
          )}

          {lastUserMessage && !liveTranscript && (
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
                <div className="flex items-center gap-2">
                  {lastAssistantMessage.qaScore && (
                    <span
                      className="inline-flex items-center gap-0.5 text-[9px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-sm font-['IBM_Plex_Mono']"
                      title={lastAssistantMessage.qaCritique || "QA Critic Verified"}
                    >
                      <ShieldCheck className="w-2.5 h-2.5 text-emerald-500" />
                      {lastAssistantMessage.qaScore}% QA
                    </span>
                  )}
                  {onPlayVoice && (
                    <button
                      onClick={() =>
                        onPlayVoice(
                          lastAssistantMessage.voiceText || lastAssistantMessage.text,
                          lastAssistantMessage.audioUrl
                        )
                      }
                      className="flex items-center gap-1 text-[#1D8DE6] hover:underline cursor-pointer font-medium"
                      title="Replay spoken answer"
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>Replay</span>
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs font-['Inter'] text-[#111A3A] leading-relaxed line-clamp-3">
                {lastAssistantMessage.voiceText || lastAssistantMessage.text}
              </p>

              {lastAssistantMessage.cta && (
                <button
                  onClick={() => onOpenCta(lastAssistantMessage.cta!.type)}
                  className="w-full mt-1.5 py-1.5 px-3 rounded-lg bg-[#111A3A] hover:bg-[#1D8DE6] text-white text-xs font-semibold flex items-center justify-center gap-1 transition shadow-xs cursor-pointer"
                >
                  <span>{lastAssistantMessage.cta.label}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Primary Voice Controls */}
      <div className="w-full flex flex-col items-center gap-2 pt-1 shrink-0">
        {!isConversationOver ? (
          <div className="flex flex-col items-center gap-1">
            {/* Hands-free Toggle / Start Mic Button */}
            <button
              type="button"
              onClick={onToggleMic}
              disabled={micDisabled || isThinking}
              aria-label={
                !hasStarted
                  ? 'Tap to speak'
                  : isListening
                  ? 'Pause listening'
                  : isSpeaking
                  ? 'Interrupt speaking'
                  : 'Resume listening'
              }
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 cursor-pointer active:scale-95 focus:outline-none focus:ring-4 ${
                !hasStarted && voiceState === 'idle'
                  ? 'bg-gradient-to-tr from-[#111A3A] via-[#1D8DE6] to-[#35A6F7] text-white shadow-[#1D8DE6]/40 ring-4 ring-[#1D8DE6]/30 hover:scale-105 animate-pulse'
                  : isListening
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
                <Mic className="w-6 h-6 sm:w-7 sm:h-7" />
              )}
            </button>

            <span className="text-[10px] font-semibold text-[#111A3A]/70 font-['Sora'] tracking-tight">
              {!hasStarted && voiceState === 'idle'
                ? 'Tap to Speak'
                : isListening
                ? 'Listening...'
                : isSpeaking
                ? 'Tap to Pause'
                : isThinking
                ? 'Thinking...'
                : 'Tap to Speak'}
            </span>
          </div>
        ) : (
          /* When conversation is over, provide explicit restart action */
          <div className="flex items-center justify-center">
            {onRestartConversation && (
              <button
                onClick={onRestartConversation}
                className="px-5 py-2.5 rounded-full bg-[#1D8DE6] hover:bg-[#111A3A] text-white text-xs font-semibold font-['Sora'] shadow-md flex items-center gap-2 transition cursor-pointer active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Start New Conversation</span>
              </button>
            )}
          </div>
        )}

        {/* Quick Voice Topics */}
        {suggestedQuestions.length > 0 && !isConversationOver && (
          <div className="w-full flex flex-col items-center gap-1 mt-1">
            <span className="text-[10px] text-[#111A3A]/60 font-['Inter']">
              Or tap any topic to ask:
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
