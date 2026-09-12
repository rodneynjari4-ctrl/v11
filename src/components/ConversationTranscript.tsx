import React, { useEffect, useRef } from 'react';
import { ChatMessage } from '../types';
import { Volume2, VolumeX, Sparkles, User, ArrowRight } from 'lucide-react';

interface ConversationTranscriptProps {
  messages: ChatMessage[];
  onPlayVoice?: (text: string) => void;
  onSelectQuestion?: (question: string) => void;
  onOpenCta?: (type: 'demo' | 'contact' | 'quote') => void;
  activePlayingText?: string | null;
  suggestedQuestions?: string[];
  isThinking?: boolean;
}

export const ConversationTranscript: React.FC<ConversationTranscriptProps> = ({
  messages,
  onPlayVoice,
  onSelectQuestion,
  onOpenCta,
  activePlayingText,
  suggestedQuestions = [],
  isThinking = false,
}) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  return (
    <div id="visionone-transcript" className="flex flex-col flex-1 min-h-0 bg-transparent">
      {/* Scrollable Message List */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-2 space-y-3 scroll-smooth"
        role="log"
        aria-live="polite"
      >
        {messages.map((message) => {
          const isUser = message.role === 'user';
          const isPlaying = activePlayingText === (message.voiceText || message.text);

          return (
            <div
              key={message.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} group animate-fadeIn`}
            >
              <div
                className={`max-w-[86%] rounded-2xl p-3 text-xs leading-relaxed shadow-sm transition-all ${
                  isUser
                    ? 'bg-gradient-to-r from-[#1D8DE6] to-[#35A6F7] text-white rounded-br-none'
                    : 'bg-white/90 backdrop-blur-md border border-[#E5F0FE] text-[#111A3A] rounded-bl-none'
                }`}
              >
                {/* Speaker indicator & Play speech button */}
                <div className="flex items-center justify-between gap-2 mb-1 opacity-75 text-[10px]">
                  <span className="font-semibold flex items-center gap-1 font-['Sora']">
                    {isUser ? (
                      <>
                        <User className="w-2.5 h-2.5" /> You
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-2.5 h-2.5 text-[#1D8DE6]" /> VisionONE AI
                      </>
                    )}
                  </span>
                  {!isUser && onPlayVoice && (
                    <button
                      onClick={() => onPlayVoice(message.voiceText || message.text)}
                      className={`hover:text-[#1D8DE6] p-0.5 rounded transition ${
                        isPlaying ? 'text-[#1D8DE6] animate-pulse' : 'text-[#111A3A]/60'
                      }`}
                      title={isPlaying ? 'Currently playing' : 'Listen again'}
                      aria-label="Listen to response again"
                    >
                      {isPlaying ? <Volume2 className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                    </button>
                  )}
                </div>

                {/* Message Body */}
                <p className="font-['Inter'] whitespace-pre-wrap">{message.text}</p>

                {/* Interactive CTA button if applicable */}
                {message.cta && onOpenCta && (
                  <div className="mt-2.5 pt-2 border-t border-[#E5F0FE]/80 flex flex-col gap-1.5">
                    <button
                      onClick={() => onOpenCta(message.cta!.type)}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-[#111A3A] hover:bg-[#1D8DE6] shadow-sm transition-all cursor-pointer"
                    >
                      <span>{message.cta.label}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    {message.cta.description && (
                      <span className="text-[10px] text-[#111A3A]/60 text-center">
                        {message.cta.description}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Timestamp */}
              <span className="text-[9px] text-[#111A3A]/40 mt-0.5 px-1 font-mono">
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}

        {/* Thinking skeleton bubble */}
        {isThinking && (
          <div className="flex flex-col items-start animate-pulse">
            <div className="bg-white/80 border border-[#E5F0FE] rounded-2xl rounded-bl-none px-3.5 py-2.5 text-xs text-[#111A3A]/70 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#1D8DE6] animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-[#35A6F7] animate-bounce delay-150" />
              <span className="w-2 h-2 rounded-full bg-[#111A3A] animate-bounce delay-300" />
              <span className="text-[11px] font-['Inter'] ml-1">VisionONE AI is consulting knowledge...</span>
            </div>
          </div>
        )}
      </div>

      {/* Suggested Follow-up Quick Chips */}
      {suggestedQuestions.length > 0 && onSelectQuestion && (
        <div className="px-4 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar border-t border-[#E5F0FE]/50">
          {suggestedQuestions.map((question, idx) => (
            <button
              key={idx}
              onClick={() => onSelectQuestion(question)}
              className="shrink-0 text-[11px] font-medium font-['Inter'] px-2.5 py-1 rounded-full bg-white hover:bg-[#E5F0FE] text-[#111A3A] border border-[#1D8DE6]/20 shadow-xs hover:border-[#1D8DE6] transition-all cursor-pointer whitespace-nowrap"
            >
              {question}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
