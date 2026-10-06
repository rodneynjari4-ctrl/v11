import React, { useState } from 'react';
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
  onStopSpeaking?: () => void;
  onStopListening?: () => void;
  onSelectQuestion: (question: string) => void;
  onSendMessage?: (msg: string) => void;
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
  onStopSpeaking,
  onStopListening,
  onSelectQuestion,
  onSendMessage,
  onOpenCta,
  onClose,
  onRestartConversation,
  micDisabled = false,
}) => {
  const [typedMessage, setTypedMessage] = useState('');
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
        <span className="glass-pill inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[#111A3A]/80 text-[10px] font-semibold shadow-2xs">
          <CheckCircle className="w-3 h-3 text-slate-500" />
          Session Finished
        </span>
      );
    }
    if (isAutoplayBlocked) {
      return (
        <span className="glass-pill inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-amber-800 text-[10px] font-semibold border-amber-300 animate-pulse">
          <Volume2 className="w-3 h-3 text-amber-600" />
          Tap to Enable Voice
        </span>
      );
    }
    if (!hasStarted && voiceState === 'idle') {
      return (
        <span className="glass-pill inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[#1D8DE6] text-[10px] font-semibold shadow-2xs">
          <Sparkles className="w-3 h-3 text-[#1D8DE6]" />
          Starting Voice AI...
        </span>
      );
    }
    if (isListening) {
      return (
        <span className="glass-pill inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-emerald-800 text-[10px] font-semibold border-emerald-300/80 animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          Listening (Hands-Free)
        </span>
      );
    }
    if (isThinking) {
      return (
        <span className="glass-pill inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[#1D8DE6] text-[10px] font-semibold">
          <Loader2 className="w-3 h-3 animate-spin" />
          Consulting Intelligence...
        </span>
      );
    }
    if (isSpeaking) {
      return (
        <span className="glass-pill inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[#1D8DE6] text-[10px] font-semibold border-[#1D8DE6]/30">
          <Volume2 className="w-3 h-3 animate-bounce" />
          Speaking Spoken Answer
        </span>
      );
    }
    return (
      <span className="glass-pill inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[#111A3A] text-[10px] font-medium">
        <Sparkles className="w-2.5 h-2.5 text-[#1D8DE6]" />
        Hands-Free Auto-Voice Active
      </span>
    );
  };

  return (
    <div
      id="visionone-voice-view"
      className="flex-1 flex flex-col justify-between items-center px-3 py-2 sm:py-2.5 overflow-y-auto min-h-0 bg-transparent text-[#111A3A]"
    >
      {/* Top Status & Hands-free Mode indicator */}
      <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
        {getStatusBadge()}
        <p className="text-[10px] text-[#111A3A]/70 font-['Inter'] text-center">
          {getStatusLabel()}
        </p>
      </div>

      {/* Central Voice Orb & Ambient Visualizer */}
      <div className="my-auto flex flex-col items-center justify-center py-1 relative w-full">
        <VoiceOrb
          state={voiceState}
          amplitude={micAmplitude}
          onRetry={onRetry}
          onClick={
            isSpeaking
              ? (onStopSpeaking || onToggleMic)
              : isListening
              ? (onSubmitTranscript || onToggleMic)
              : onToggleMic
          }
          hasStarted={hasStarted}
        />

        {/* Mobile Real-Time Live Audio Wave Equalizer (Confirms mic is picking up voice on mobile) */}
        {isListening && (
          <div className="flex items-center justify-center gap-1.5 h-6 mt-1 animate-in fade-in duration-200">
            {[0.4, 0.7, 1.2, 0.6, 1.1, 0.5, 0.9].map((scale, i) => {
              const barHeight = Math.max(4, Math.min(22, 5 + micAmplitude * 32 * scale));
              return (
                <span
                  key={i}
                  className="w-1 rounded-full bg-gradient-to-t from-[#1D8DE6] to-[#35A6F7] transition-all duration-75 shadow-xs"
                  style={{ height: `${barHeight}px` }}
                />
              );
            })}
            <span className="text-[9px] text-[#1D8DE6] font-semibold ml-1 font-['Sora']">
              {micAmplitude > 0.05 ? 'Hearing voice' : 'Listening...'}
            </span>
          </div>
        )}

        {/* Live Conversation Transcript Card */}
        <div className="w-full max-w-[340px] mt-2 space-y-1.5 px-0.5">
          {/* Live speech feedback while user is actively talking */}
          {liveTranscript && isListening && (
            <div className="glass-card rounded-xl p-2.5 text-xs text-[#111A3A] flex flex-col gap-1.5 shadow-sm border-[#1D8DE6]/50 animate-pulse">
              <div className="flex items-center justify-between text-[10px] text-[#1D8DE6] font-semibold font-['Sora']">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  Hearing you speak:
                </span>
                {onSubmitTranscript && (
                  <button
                    onClick={onSubmitTranscript}
                    className="px-2.5 py-1 rounded-full bg-[#1D8DE6] hover:bg-[#111A3A] text-white text-[10px] font-semibold transition cursor-pointer flex items-center gap-1 shadow-xs active:scale-95"
                    title="Send message immediately"
                  >
                    <span>Send</span>
                    <ArrowRight className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
              <p className="font-['Inter'] font-medium text-[#111A3A] italic leading-snug text-[11px]">
                "{liveTranscript}"
              </p>
            </div>
          )}

          {lastUserMessage && !liveTranscript && (
            <div className="bg-[#1D8DE6]/90 backdrop-blur-md text-white rounded-xl px-3 py-1.5 text-[11px] flex items-center justify-between shadow-2xs border border-white/20">
              <span className="text-[9px] font-bold uppercase tracking-wider font-['Sora'] mr-2 shrink-0 opacity-90">
                You:
              </span>
              <span className="font-['Inter'] truncate text-right font-medium">{lastUserMessage.text}</span>
            </div>
          )}

          {lastAssistantMessage && (
            <div className="glass-card rounded-2xl p-2.5 border border-white/70 shadow-xs space-y-1 max-h-32 overflow-y-auto">
              <div className="flex items-center justify-between text-[10px] text-[#111A3A]/70">
                <span className="font-bold flex items-center gap-1 text-[#1D8DE6] font-['Sora']">
                  <Sparkles className="w-2.5 h-2.5" /> Assistant:
                </span>
                <div className="flex items-center gap-1.5">
                  {lastAssistantMessage.qaScore && (
                    <span
                      className="inline-flex items-center gap-0.5 text-[8px] font-medium text-emerald-700 bg-emerald-50/80 border border-emerald-200/60 px-1 py-0.2 rounded-sm font-['IBM_Plex_Mono']"
                      title={lastAssistantMessage.qaCritique || "QA Critic Verified"}
                    >
                      <ShieldCheck className="w-2 h-2 text-emerald-500" />
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
                      className="flex items-center gap-0.5 text-[#1D8DE6] hover:underline cursor-pointer font-medium text-[9px]"
                      title="Replay spoken answer"
                    >
                      <Volume2 className="w-2.5 h-2.5" />
                      <span>Replay</span>
                    </button>
                  )}
                </div>
              </div>
              <p className="text-[11px] font-['Inter'] text-[#111A3A] leading-relaxed">
                {lastAssistantMessage.voiceText || lastAssistantMessage.text}
              </p>

              {lastAssistantMessage.cta && (
                <button
                  onClick={() => onOpenCta(lastAssistantMessage.cta!.type)}
                  className="w-full mt-1.5 py-1.5 px-3 rounded-lg bg-[#111A3A] hover:bg-[#1D8DE6] text-white text-[10px] font-semibold flex items-center justify-center gap-1 transition shadow-xs cursor-pointer active:scale-95"
                >
                  <span>{lastAssistantMessage.cta.label}</span>
                  <ArrowRight className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Primary Mobile Voice Controls */}
      <div className="w-full flex flex-col items-center gap-1.5 pt-0.5 shrink-0">
        {!isConversationOver ? (
          <div className="flex flex-col items-center gap-1 w-full">
            {/* Primary Action Button */}
            <div className="flex items-center justify-center gap-3">
              {/* Secondary Stop/Cancel button when listening */}
              {isListening && (
                <button
                  type="button"
                  onClick={onStopListening || onToggleMic}
                  className="w-11 h-11 rounded-full flex items-center justify-center bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 shadow-sm transition-all cursor-pointer active:scale-95"
                  title="Cancel & Stop Listening"
                  aria-label="Cancel & Stop Listening"
                >
                  <Square className="w-4 h-4 fill-current" />
                </button>
              )}

              <button
                type="button"
                onClick={
                  isSpeaking
                    ? (onStopSpeaking || onToggleMic)
                    : isListening
                    ? (onSubmitTranscript || onToggleMic)
                    : onToggleMic
                }
                disabled={micDisabled || isThinking}
                aria-label={
                  !hasStarted
                    ? 'Tap to speak'
                    : isListening
                    ? 'Send recorded voice'
                    : isSpeaking
                    ? 'Stop speaking'
                    : 'Tap to speak'
                }
                className={`w-13 h-13 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 cursor-pointer active:scale-95 focus:outline-none focus:ring-4 ${
                  !hasStarted && voiceState === 'idle'
                    ? 'bg-gradient-to-tr from-[#111A3A] via-[#1D8DE6] to-[#35A6F7] text-white shadow-[#1D8DE6]/35 ring-4 ring-[#1D8DE6]/30 hover:scale-105 animate-pulse'
                    : isListening
                    ? 'bg-emerald-600 text-white shadow-emerald-600/40 ring-4 ring-emerald-300 animate-pulse'
                    : isSpeaking
                    ? 'bg-rose-600 text-white shadow-rose-600/35 ring-4 ring-rose-300 hover:bg-rose-700'
                    : 'bg-gradient-to-tr from-[#1D8DE6] to-[#35A6F7] text-white shadow-[#1D8DE6]/30 ring-4 ring-[#1D8DE6]/25 hover:scale-105'
                }`}
              >
                {isThinking ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : isListening ? (
                  <ArrowRight className="w-6 h-6 text-white stroke-[2.5]" />
                ) : isSpeaking ? (
                  <Square className="w-5 h-5 fill-current" />
                ) : (
                  <Mic className="w-6 h-6" />
                )}
              </button>
            </div>

            {/* Clear Mobile Status & Action Instruction */}
            <div className="text-center">
              <span className="text-[10px] font-semibold text-[#111A3A] font-['Sora'] tracking-tight block">
                {!hasStarted && voiceState === 'idle'
                  ? 'Tap to Speak'
                  : isListening
                  ? 'Tap Send (or Stop to cancel)'
                  : isSpeaking
                  ? 'Stop Speaking'
                  : isThinking
                  ? 'Thinking...'
                  : 'Tap to Speak'}
              </span>
            </div>
          </div>
        ) : (
          /* When conversation is over, provide explicit restart action */
          <div className="flex items-center justify-center py-1">
            {onRestartConversation && (
              <button
                onClick={onRestartConversation}
                className="px-5 py-2.5 rounded-full bg-[#1D8DE6] hover:bg-[#111A3A] text-white text-xs font-semibold font-['Sora'] shadow-md flex items-center gap-1.5 transition cursor-pointer active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Start New Conversation</span>
              </button>
            )}
          </div>
        )}

        {/* Quick Voice Topics */}
        {suggestedQuestions.length > 0 && !isConversationOver && (
          <div className="w-full flex flex-col items-center gap-0.5 mt-0.5">
            <span className="text-[9px] text-[#111A3A]/60 font-['Inter']">
              Quick topics:
            </span>
            <div className="w-full flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 justify-start sm:justify-center px-1">
              {suggestedQuestions.slice(0, 3).map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelectQuestion(q)}
                  className="glass-pill shrink-0 text-[10px] font-medium font-['Inter'] px-2.5 py-1 rounded-full hover:bg-white text-[#111A3A] hover:border-[#1D8DE6] transition-all cursor-pointer whitespace-nowrap shadow-2xs active:scale-95"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Universal Text Input Fallback (for noisy environments or mobile typing) */}
        {!isConversationOver && onSendMessage && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (typedMessage.trim() && !isThinking) {
                onSendMessage(typedMessage.trim());
                setTypedMessage('');
              }
            }}
            className="w-full mt-1 flex items-center gap-1.5 px-0.5 select-text pointer-events-auto"
          >
            <input
              type="text"
              inputMode="text"
              value={typedMessage}
              onChange={(e) => setTypedMessage(e.target.value)}
              placeholder={isListening ? "Listening... or type here" : "Ask by voice or type..."}
              className="flex-1 bg-white/95 border border-slate-300 rounded-full px-3 py-1.5 text-xs font-['Inter'] text-[#111A3A] placeholder:text-[#111A3A]/50 focus:outline-none focus:border-[#1D8DE6] shadow-2xs transition select-text pointer-events-auto"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="sentences"
            />
            <button
              type="submit"
              disabled={!typedMessage.trim() || isThinking}
              className="w-7 h-7 rounded-full bg-[#1D8DE6] hover:bg-[#111A3A] text-white flex items-center justify-center shrink-0 disabled:opacity-35 disabled:cursor-not-allowed shadow-2xs cursor-pointer active:scale-95 transition"
              title="Send text message"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
