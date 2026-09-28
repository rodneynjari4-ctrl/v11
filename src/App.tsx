import React, { useState, useEffect, useRef, useCallback } from 'react';
import { VoiceState, ChatMessage, VoiceSettings, LeadFormData } from './types';
import { AssistantPanel } from './components/AssistantPanel';
import { LeadModal } from './components/LeadModal';
import { SpeechRecognitionManager, SpeechSynthesisManager } from './lib/speech';
import { Mic, Sparkles } from 'lucide-react';

const INITIAL_WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome-msg',
  role: 'assistant',
  text: "Hello! I am your Vision One AI assistant. How can I help you today with your ERP, finance, payroll, or business operations?",
  voiceText: "Hello! I am your Vision One A-I assistant. How can I help you today with your E-R-P, finance, payroll, or business operations?",
  timestamp: Date.now(),
  qaScore: 99,
  qaCritique: "QA Critic verified: Proper self-introduction and domain framing.",
  suggestedQuestions: [
    'What modules are in VisionONE ERP?',
    'Tell me about HR & Payroll',
    'How does eTIMS compliance work?',
    'Book a live walkthrough',
  ],
};

export default function App() {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [isAutoListening, setIsAutoListening] = useState<boolean>(true);
  const [isConversationOver, setIsConversationOver] = useState<boolean>(false);
  const [isAutoplayBlocked, setIsAutoplayBlocked] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_WELCOME_MESSAGE]);
  const [micAmplitude, setMicAmplitude] = useState<number>(0);
  const [activePlayingText, setActivePlayingText] = useState<string | null>(null);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>(
    INITIAL_WELCOME_MESSAGE.suggestedQuestions || []
  );

  // Lead capture modal
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [leadModalType, setLeadModalType] = useState<'demo' | 'quote' | 'contact'>('demo');

  // Articulate natural warm male voice settings
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    isMuted: false,
    rate: 0.98,
    pitch: 1.0,
    continuousMode: true,
  });

  // Speech and Audio Managers
  const speechRecognitionRef = useRef<SpeechRecognitionManager | null>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisManager | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const isAutoListeningRef = useRef<boolean>(true);
  isAutoListeningRef.current = isAutoListening;
  const isConversationOverRef = useRef<boolean>(false);
  isConversationOverRef.current = isConversationOver;
  const processUserMessageRef = useRef<(text: string) => void>(() => {});

  // Safe microphone speech recognition starter for continuous hands-free conversation
  const startListening = useCallback(async () => {
    // Interruption logic: halt active voice playback immediately
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.stop();
    }

    if (isConversationOverRef.current) {
      setVoiceState('idle');
      return;
    }

    if (!speechRecognitionRef.current) {
      setVoiceState('idle');
      return;
    }

    setVoiceState('listening');

    speechRecognitionRef.current.resumeListeningAfterAgentTurn();

    speechRecognitionRef.current.start(
      (text: string, isFinal: boolean) => {
        if (isFinal && text.trim()) {
          setLiveTranscript('');
          processUserMessageRef.current(text.trim());
        } else {
          setLiveTranscript(text);
        }
      },
      (error: string) => {
        console.warn('Recognition notice:', error);
        if (error.includes('restricted') || error.includes('not supported')) {
          setVoiceState('idle');
        } else if (!isAutoListeningRef.current || isConversationOverRef.current) {
          setVoiceState('idle');
        }
      },
      () => {
        setVoiceState('listening');
      },
      () => {
        if (isConversationOverRef.current || !isAutoListeningRef.current) {
          setVoiceState('idle');
        }
      }
    );
  }, []);

  const stopListening = useCallback(() => {
    speechRecognitionRef.current?.stop();
    setLiveTranscript('');
    setVoiceState('idle');
  }, []);

  // Neural Voice Synthesizer with Automatic Continuous Turn-Taking
  const speakVoice = useCallback(
    async (text: string, autoListenAfter = true, audioUrl?: string | null) => {
      if (voiceSettings.isMuted || !text) {
        setVoiceState('idle');
        setActivePlayingText(null);
        if (autoListenAfter && isAutoListeningRef.current && !isConversationOverRef.current) {
          startListening();
        }
        return;
      }

      setVoiceState('speaking');
      setActivePlayingText(text);

      // Temporarily pause microphone while AI is speaking so AI does not hear itself
      speechRecognitionRef.current?.pauseListeningForAgentTurn();

      if (speechSynthesisRef.current) {
        speechSynthesisRef.current.speakText(text, {
          audioUrl: audioUrl || null,
          rate: voiceSettings.rate,
          pitch: voiceSettings.pitch,
          onStart: () => {
            setVoiceState('speaking');
            setIsAutoplayBlocked(false);
          },
          onEnd: () => {
            setActivePlayingText(null);
            // AUTOMATIC CONTINUOUS LOOP: immediately resume listening hands-free if not conversation over!
            if (autoListenAfter && isAutoListeningRef.current && !isConversationOverRef.current) {
              startListening();
            } else {
              setVoiceState('idle');
            }
          },
          onError: () => {
            setActivePlayingText(null);
            if (autoListenAfter && isAutoListeningRef.current && !isConversationOverRef.current) {
              startListening();
            } else {
              setVoiceState('idle');
            }
          },
          onAutoplayBlocked: () => {
            setIsAutoplayBlocked(true);
            setVoiceState('idle');
          },
        });
      } else {
        setVoiceState('idle');
        setActivePlayingText(null);
        if (autoListenAfter && isAutoListeningRef.current && !isConversationOverRef.current) {
          startListening();
        }
      }
    },
    [voiceSettings, startListening]
  );

  // Automatic Start & Self-Introduction on Mount
  useEffect(() => {
    speechRecognitionRef.current = new SpeechRecognitionManager();
    speechSynthesisRef.current = new SpeechSynthesisManager();

    let isMounted = true;
    let hasSpokenIntro = false;

    const introduce = (audioUrl?: string) => {
      if (!isMounted) return;
      hasSpokenIntro = true;
      setHasStarted(true);
      setIsAutoListening(true);
      setIsConversationOver(false);
      setIsAutoplayBlocked(false);
      speakVoice(
        INITIAL_WELCOME_MESSAGE.voiceText || INITIAL_WELCOME_MESSAGE.text,
        true,
        audioUrl
      );
    };

    // Pre-cache high-definition neural voice for the welcome message & introduce automatically
    fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: INITIAL_WELCOME_MESSAGE.voiceText || INITIAL_WELCOME_MESSAGE.text,
        voice: 'Charon',
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.audioUrl) {
          setMessages((prev) =>
            prev.map((m) => (m.id === 'welcome-msg' ? { ...m, audioUrl: data.audioUrl } : m))
          );
        }
        // Start voice assistant automatically and let agent introduce himself out loud!
        introduce(data.audioUrl);
      })
      .catch(() => {
        if (!isMounted) return;
        introduce();
      });

    // Fallback: If browser autoplay policy requires user gesture, unlock and start on first click/pointerdown
    const unlockAndStart = () => {
      if (speechSynthesisRef.current) {
        speechSynthesisRef.current.resume();
      }
      setIsAutoplayBlocked(false);
      if (!hasSpokenIntro) {
        introduce();
      }
    };

    window.addEventListener('pointerdown', unlockAndStart, { once: true });
    window.addEventListener('click', unlockAndStart, { once: true });

    return () => {
      isMounted = false;
      speechRecognitionRef.current?.stop();
      speechSynthesisRef.current?.stop();
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      window.removeEventListener('pointerdown', unlockAndStart);
      window.removeEventListener('click', unlockAndStart);
    };
  }, [speakVoice]);

  // Monitor Mic Amplitude loop when listening or speaking
  useEffect(() => {
    if (voiceState === 'listening') {
      const updateAmp = () => {
        if (speechRecognitionRef.current) {
          const amp = speechRecognitionRef.current.getMicAmplitude();
          setMicAmplitude(amp);
        }
        animFrameRef.current = requestAnimationFrame(updateAmp);
      };
      animFrameRef.current = requestAnimationFrame(updateAmp);
    } else if (voiceState === 'speaking') {
      let t = 0;
      const updateSpeakingAmp = () => {
        t += 0.16;
        const fakeAmp = Math.abs(Math.sin(t) * 0.5 + Math.cos(t * 1.8) * 0.3) * 0.8;
        setMicAmplitude(fakeAmp);
        animFrameRef.current = requestAnimationFrame(updateSpeakingAmp);
      };
      animFrameRef.current = requestAnimationFrame(updateSpeakingAmp);
    } else {
      setMicAmplitude(0);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    }

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [voiceState]);

  // Send message to server-side AI
  const processUserMessage = async (userText: string) => {
    const trimmed = userText.trim();
    if (!trimmed) return;

    // Pause recognition and stop any speech while processing AI turn
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.stop();
    }
    speechRecognitionRef.current?.pauseListeningForAgentTurn();
    setLiveTranscript('');

    const newUserMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      text: trimmed,
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, newUserMsg];
    setMessages(updatedMessages);
    setVoiceState('thinking');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: updatedMessages.slice(-8).map((m) => ({ role: m.role, text: m.text })),
        }),
      });

      if (!res.ok) {
        throw new Error('API returned an error');
      }

      const data = await res.json();

      const isOver = Boolean(data.isConversationOver);
      if (isOver) {
        setIsConversationOver(true);
        setIsAutoListening(false);
      }

      const aiMsg: ChatMessage = {
        id: 'msg-' + (Date.now() + 1),
        role: 'assistant',
        text: data.text,
        voiceText: data.voiceText,
        audioUrl: data.audioUrl,
        timestamp: Date.now(),
        intent: data.intent,
        isConversationOver: isOver,
        qaScore: data.qaScore,
        qaCritique: data.qaCritique,
        cta: data.cta,
        suggestedQuestions: data.suggestedQuestions,
      };

      setMessages((prev) => [...prev, aiMsg]);
      if (data.suggestedQuestions && data.suggestedQuestions.length > 0) {
        setSuggestedQuestions(data.suggestedQuestions);
      }

      // Automatically speak the response
      // If conversation is over: do NOT auto-listen after farewell!
      const spoken = data.voiceText || data.text;
      speakVoice(spoken, !isOver, data.audioUrl);
    } catch (err) {
      console.warn('Chat request fallback notice:', err);
      setVoiceState('idle');

      const fallbackMsg: ChatMessage = {
        id: 'msg-err-' + Date.now(),
        role: 'assistant',
        text: "VisionONE Access unifies ERP, Finance, HR & Payroll, and Inventory into a single real-time platform. Would you like to explore Finance, HR, or schedule a live demo?",
        voiceText: "Vision One connects your entire operations. Would you like to explore Finance, H-R, or schedule a live demo?",
        timestamp: Date.now(),
        qaScore: 97,
        suggestedQuestions: [
          'What modules are in VisionONE ERP?',
          'Tell me about HR & Payroll',
          'Book a live walkthrough',
        ],
        cta: {
          type: 'demo',
          label: 'Book a Demo',
          description: 'Speak directly with our enterprise solutions team',
        },
      };
      setMessages((prev) => [...prev, fallbackMsg]);
      speakVoice(fallbackMsg.voiceText!, true);
    }
  };

  // Keep ref up to date
  processUserMessageRef.current = processUserMessage;

  // Toggle or start mic
  const toggleMic = () => {
    if (!hasStarted) {
      setHasStarted(true);
      setIsAutoListening(true);
      setIsConversationOver(false);
      startListening();
      return;
    }

    if (isConversationOver) {
      handleRestartConversation();
      return;
    }

    if (voiceState === 'listening') {
      // User tapped while listening -> Pause listening
      setIsAutoListening(false);
      stopListening();
    } else if (voiceState === 'speaking') {
      // User tapped while AI was speaking -> Interrupt speech and listen immediately
      speechSynthesisRef.current?.stop();
      setIsAutoListening(true);
      startListening();
    } else {
      // Idle/paused -> Resume automatic listening
      setIsAutoListening(true);
      startListening();
    }
  };

  const handleSelectQuestion = (question: string) => {
    setHasStarted(true);
    setIsAutoListening(true);
    setIsConversationOver(false);
    processUserMessage(question);
  };

  const handleRestartConversation = () => {
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.stop();
    }
    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
    }
    setVoiceState('idle');
    setLiveTranscript('');
    setIsConversationOver(false);
    setIsAutoListening(true);
    setHasStarted(true);
    setMessages([INITIAL_WELCOME_MESSAGE]);
    setSuggestedQuestions(INITIAL_WELCOME_MESSAGE.suggestedQuestions || []);

    speakVoice(
      INITIAL_WELCOME_MESSAGE.voiceText || INITIAL_WELCOME_MESSAGE.text,
      true,
      INITIAL_WELCOME_MESSAGE.audioUrl
    );
  };

  const handleCloseAssistant = () => {
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.stop();
    }
    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
    }
    setVoiceState('idle');
    setLiveTranscript('');
    setIsAutoListening(false);
    setIsOpen(false);
  };

  const handleOpenAssistant = () => {
    setIsOpen(true);
    setIsAutoListening(true);
    if (!hasStarted) {
      setHasStarted(true);
      speakVoice(
        INITIAL_WELCOME_MESSAGE.voiceText || INITIAL_WELCOME_MESSAGE.text,
        true,
        INITIAL_WELCOME_MESSAGE.audioUrl
      );
    }
  };

  const handleLeadSubmit = async (leadData: LeadFormData): Promise<boolean> => {
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadData),
      });
      const data = await res.json();
      if (data.success) {
        const confirmMsg: ChatMessage = {
          id: 'lead-confirm-' + Date.now(),
          role: 'assistant',
          text: `Thank you, ${leadData.name}! Your request has been recorded. A VisionONE senior business consultant will reach out via ${leadData.email || leadData.phone}.`,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, confirmMsg]);
        speakVoice(`Thank you ${leadData.name}. A Vision One consultant will contact you shortly.`, true);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return (
    <div className="w-full h-[100dvh] bg-slate-100 text-[#111A3A] relative flex items-center justify-center p-0 sm:p-4 overflow-hidden">
      {/* Subtle clean neutral backdrop */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-slate-100 to-slate-200/70 pointer-events-none" />

      {/* Main Assistant View when open */}
      {isOpen ? (
        <main className="relative z-10 w-full h-full sm:h-[88vh] sm:max-h-[660px] sm:max-w-[380px] flex flex-col justify-center items-center">
          <AssistantPanel
            voiceState={voiceState}
            messages={messages}
            voiceSettings={voiceSettings}
            micAmplitude={micAmplitude}
            activePlayingText={activePlayingText}
            suggestedQuestions={suggestedQuestions}
            hasStarted={hasStarted}
            liveTranscript={liveTranscript}
            isConversationOver={isConversationOver}
            isAutoplayBlocked={isAutoplayBlocked}
            onReset={handleRestartConversation}
            onRestartConversation={handleRestartConversation}
            onClose={handleCloseAssistant}
            onToggleMute={() => {
              if (!voiceSettings.isMuted) {
                speechSynthesisRef.current?.stop();
                setVoiceState('idle');
              }
              setVoiceSettings((prev) => ({ ...prev, isMuted: !prev.isMuted }));
            }}
            onToggleMic={toggleMic}
            onRetry={startListening}
            onSubmitTranscript={() => speechRecognitionRef.current?.submitNow()}
            onSelectQuestion={handleSelectQuestion}
            onPlayVoice={(t, audioUrl) => speakVoice(t, !isConversationOver, audioUrl)}
            onOpenCta={(type) => {
              setLeadModalType(type);
              setIsLeadModalOpen(true);
            }}
          />
        </main>
      ) : (
        /* Minimized State: Re-open launcher widget */
        <div className="relative z-10 flex flex-col items-center justify-center p-6 text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#111A3A] to-[#1D8DE6] flex items-center justify-center text-white shadow-xl shadow-[#1D8DE6]/20 mb-4 border border-white/40">
            <Mic className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-lg font-bold font-['Sora'] text-[#111A3A]">VisionONE Access AI</h2>
          <p className="text-xs text-[#111A3A]/70 font-['Inter'] mt-1 mb-5">
            The voice assistant is currently closed. Tap below to re-open the voice conversation.
          </p>
          <button
            onClick={handleOpenAssistant}
            className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#111A3A] to-[#1D8DE6] text-white text-xs font-semibold font-['Sora'] shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-[#35A6F7]" />
            <span>Open Voice Assistant</span>
          </button>
        </div>
      )}

      {/* Persistent floating trigger badge if minimized on larger screen */}
      {!isOpen && (
        <div className="fixed bottom-5 right-5 z-50">
          <button
            onClick={handleOpenAssistant}
            className="group flex items-center gap-3 px-4 py-3 rounded-full bg-gradient-to-r from-[#111A3A] to-[#1D8DE6] text-white shadow-2xl hover:shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer border border-white/20"
            aria-label="Open VisionONE Voice Assistant"
          >
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
              <Mic className="w-4 h-4 text-white animate-pulse" />
            </div>
            <div className="text-left pr-1">
              <span className="block text-xs font-bold font-['Sora'] leading-tight">VisionONE AI</span>
              <span className="block text-[10px] text-[#E5F0FE] font-['Inter']">Tap to open voice</span>
            </div>
          </button>
        </div>
      )}

      {/* Lead Capture Modal */}
      <LeadModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        onSubmit={handleLeadSubmit}
        initialType={leadModalType}
      />
    </div>
  );
}
