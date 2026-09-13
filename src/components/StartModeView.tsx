import React from 'react';
import { MessageSquare, Mic, Sparkles, ShieldCheck, ArrowRight, Layers, DollarSign, Calculator, HelpCircle } from 'lucide-react';

interface StartModeViewProps {
  onSelectTextChat: () => void;
  onSelectVoiceChat: () => void;
  onSelectQuestion: (question: string) => void;
  onOpenCta: (type: 'demo' | 'contact' | 'quote') => void;
}

const FEATURED_QUESTIONS = [
  'What modules are in VisionONE ERP?',
  'How does HR & Payroll work?',
  'Explain eTIMS tax compliance',
  'How does M-Pesa integrate?',
];

export const StartModeView: React.FC<StartModeViewProps> = ({
  onSelectTextChat,
  onSelectVoiceChat,
  onSelectQuestion,
  onOpenCta,
}) => {
  return (
    <div
      id="visionone-start-view"
      className="flex-1 flex flex-col justify-between p-3.5 sm:p-5 overflow-y-auto min-h-0 bg-gradient-to-b from-[#F8FAFC] to-white select-none"
    >
      {/* Welcome Hero Area */}
      <div className="flex flex-col items-center text-center pt-1 pb-2">
        {/* Emblem / Badge */}
        <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-[#111A3A] to-[#1D8DE6] p-2 flex items-center justify-center shadow-md mb-2.5">
          <svg viewBox="0 0 40 40" fill="none" className="w-full h-full">
            <path
              d="M8 20C8 13.3726 13.3726 8 20 8C26.6274 8 32 13.3726 32 20C32 26.6274 26.6274 32 20 32"
              stroke="#35A6F7"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <circle cx="20" cy="20" r="4.5" fill="#FFFFFF" />
            <path
              d="M20 12V20L25 25"
              stroke="#FFFFFF"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white shadow-xs animate-pulse" />
        </div>

        <h2 className="text-base sm:text-lg font-bold font-['Sora'] text-[#111A3A] tracking-tight">
          VisionONE Access AI
        </h2>
        <p className="text-xs text-[#111A3A]/70 font-['Inter'] mt-0.5 max-w-[280px]">
          One Platform. Complete Business Visibility.
        </p>

        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mt-2 rounded-full bg-[#E5F0FE] text-[#1D8DE6] text-[10px] font-semibold font-['Inter']">
          <Sparkles className="w-3 h-3" />
          <span>Intelligent Enterprise Guide</span>
        </div>
      </div>

      {/* Main Choice Section: The Two Buttons */}
      <div className="my-auto py-2 space-y-2.5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#111A3A]/60 text-center font-['Inter']">
          Choose how you'd like to start
        </p>

        <div className="grid grid-cols-1 gap-2.5">
          {/* Button 1: Voice Chat */}
          <button
            id="btn-start-voice-chat"
            type="button"
            onClick={onSelectVoiceChat}
            className="group relative w-full min-h-[56px] p-3 rounded-xl bg-gradient-to-r from-[#111A3A] to-[#1D8DE6] text-white shadow-sm hover:shadow-md active:scale-[0.98] transition-all duration-200 flex items-center justify-between text-left cursor-pointer border border-white/10"
            aria-label="Start Voice Chat"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center shrink-0 group-hover:bg-white/25 transition-colors">
                <Mic className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold font-['Sora'] tracking-tight text-white">
                    Voice Chat
                  </span>
                  <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded-sm bg-[#35A6F7] text-[#111A3A]">
                    Hands-free
                  </span>
                </div>
                <p className="text-[11px] text-white/80 font-['Inter'] truncate">
                  Speak naturally with real-time spoken voice responses
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-white/70 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
          </button>

          {/* Button 2: Text Chat */}
          <button
            id="btn-start-text-chat"
            type="button"
            onClick={onSelectTextChat}
            className="group relative w-full min-h-[56px] p-3 rounded-xl bg-white hover:bg-[#F0F7FF] text-[#111A3A] shadow-2xs hover:shadow-xs active:scale-[0.98] transition-all duration-200 flex items-center justify-between text-left cursor-pointer border-2 border-[#1D8DE6]/30 hover:border-[#1D8DE6]"
            aria-label="Start Text Chat"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-[#E5F0FE] text-[#1D8DE6] flex items-center justify-center shrink-0 group-hover:bg-[#1D8DE6] group-hover:text-white transition-colors">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold font-['Sora'] tracking-tight text-[#111A3A]">
                    Text Chat
                  </span>
                  <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded-sm bg-[#E5F0FE] text-[#1D8DE6]">
                    Instant
                  </span>
                </div>
                <p className="text-[11px] text-[#111A3A]/70 font-['Inter'] truncate">
                  Type questions, browse topics & explore ERP modules
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#1D8DE6] group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
          </button>
        </div>
      </div>

      {/* Quick Explore Topics */}
      <div className="pt-2 border-t border-[#E5F0FE] space-y-1.5">
        <p className="text-[10px] font-medium text-[#111A3A]/60 flex items-center gap-1 font-['Inter']">
          <HelpCircle className="w-3 h-3 text-[#1D8DE6]" />
          <span>Or tap a topic to start asking:</span>
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {FEATURED_QUESTIONS.map((question) => (
            <button
              key={question}
              onClick={() => onSelectQuestion(question)}
              className="text-left text-[10px] font-medium font-['Inter'] px-2.5 py-1.5 rounded-lg bg-[#F8FAFC] hover:bg-[#E5F0FE] text-[#111A3A] border border-[#E5F0FE] hover:border-[#1D8DE6]/50 transition-all cursor-pointer truncate"
              title={question}
            >
              {question}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Consultation Link */}
      <div className="pt-2 text-center">
        <button
          onClick={() => onOpenCta('demo')}
          className="text-[11px] font-semibold text-[#1D8DE6] hover:text-[#111A3A] transition cursor-pointer font-['Sora'] inline-flex items-center gap-1"
        >
          <span>Schedule a tailored 30-min demo</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
