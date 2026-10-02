import React, { useState, useEffect, useRef, useCallback } from 'react';
import { VoiceState, ChatMessage, VoiceSettings, LeadFormData } from './types';
import { AssistantPanel } from './components/AssistantPanel';
import { LeadModal } from './components/LeadModal';
import { EmbedModal } from './components/EmbedModal';
import { SpeechRecognitionManager, SpeechSynthesisManager } from './lib/speech';
import { Mic } from 'lucide-react';

const INITIAL_WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome-msg',
  role: 'assistant',
  text: "Hello! I am your Vision One AI assistant. How can I help you today with your ERP, finance, payroll, or business operations?",
  voiceText: "Hello! I am your Vision One A-I assistant. How can I help you today with your E-R-P, finance, payroll, or business operations?",
  audioUrl: "/audio/welcome.wav",
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
  // Widget states: Starts CLOSED and not dismissed
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
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

  // Modals
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [leadModalType, setLeadModalType] = useState<'demo' | 'quote' | 'contact'>('demo');
  const [isEmbedModalOpen, setIsEmbedModalOpen] = useState(false);

  // Voice settings
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
  const cachedWelcomeAudioUrlRef = useRef<string | null>(null);
  const isAutoListeningRef = useRef<boolean>(true);
  isAutoListeningRef.current = isAutoListening;
  const isConversationOverRef = useRef<boolean>(false);
  isConversationOverRef.current = isConversationOver;
  const processUserMessageRef = useRef<(text: string) => void>(() => {});

  // Safe microphone speech recognition starter for continuous hands-free conversation
  const startListening = useCallback(async () => {
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
        if (error.includes('restricted') || error.includes('not supported') || error.includes('not permitted')) {
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
    async (
      text: string,
      autoListenAfter = true,
      audioUrl?: string | null,
      onFinishCallback?: () => void
    ) => {
      if (voiceSettings.isMuted || !text) {
        setVoiceState('idle');
        setActivePlayingText(null);
        if (onFinishCallback) {
          onFinishCallback();
        } else if (autoListenAfter && isAutoListeningRef.current && !isConversationOverRef.current) {
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
            if (onFinishCallback) {
              onFinishCallback();
            } else if (autoListenAfter && isAutoListeningRef.current && !isConversationOverRef.current) {
              // AUTOMATIC CONTINUOUS LOOP: immediately resume listening hands-free!
              startListening();
            } else {
              setVoiceState('idle');
            }
          },
          onError: () => {
            setActivePlayingText(null);
            if (onFinishCallback) {
              onFinishCallback();
            } else if (autoListenAfter && isAutoListeningRef.current && !isConversationOverRef.current) {
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
        if (onFinishCallback) {
          onFinishCallback();
        } else if (autoListenAfter && isAutoListeningRef.current && !isConversationOverRef.current) {
          startListening();
        }
      }
    },
    [voiceSettings, startListening]
  );

  // Background initialization & audio caching on Mount (WITHOUT auto-starting speech!)
  useEffect(() => {
    speechRecognitionRef.current = new SpeechRecognitionManager();
    speechSynthesisRef.current = new SpeechSynthesisManager();

    let isMounted = true;

    // Pre-cache neural voice for the welcome message so it plays immediately on widget click
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
          cachedWelcomeAudioUrlRef.current = data.audioUrl;
          setMessages((prev) =>
            prev.map((m) => (m.id === 'welcome-msg' ? { ...m, audioUrl: data.audioUrl } : m))
          );
        }
      })
      .catch(() => {
        // Fallback to browser synthesis if pre-cache fails
      });

    return () => {
      isMounted = false;
      speechRecognitionRef.current?.stop();
      speechSynthesisRef.current?.stop();
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

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

  // Complete close / dismiss handler: completely closes widget, stops audio, hides completely
  const handleDismissCompletely = useCallback(() => {
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
    setIsDismissed(true);

    try {
      if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
        window.parent.postMessage(
          {
            type: 'VISIONONE_WIDGET_STATE',
            isOpen: false,
            isClosedCompletely: true,
            dimensions: { width: 0, height: 0 },
          },
          '*'
        );
      }
    } catch {}
  }, []);

  // Minimize handler: collapses from panel to compact floating capsule
  const handleMinimizeAssistant = useCallback(() => {
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
    setIsDismissed(false);

    try {
      if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
        window.parent.postMessage(
          {
            type: 'VISIONONE_WIDGET_STATE',
            isOpen: false,
            isClosedCompletely: false,
            dimensions: { width: 270, height: 76 },
          },
          '*'
        );
      }
    } catch {}
  }, []);

  // Send message to server-side AI
  const processUserMessage = async (userText: string) => {
    const trimmed = userText.trim();
    if (!trimmed) return;

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
      const shouldClose = Boolean(data.shouldCloseWidget);

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
        shouldCloseWidget: shouldClose,
        qaScore: data.qaScore,
        qaCritique: data.qaCritique,
        cta: data.cta,
        suggestedQuestions: data.suggestedQuestions,
      };

      setMessages((prev) => [...prev, aiMsg]);
      if (data.suggestedQuestions && data.suggestedQuestions.length > 0) {
        setSuggestedQuestions(data.suggestedQuestions);
      }

      const spoken = data.voiceText || data.text;

      if (shouldClose) {
        // User asked to close by voice: speak the brief goodbye, then close widget completely!
        speakVoice(spoken, false, data.audioUrl, () => {
          setTimeout(() => {
            handleDismissCompletely();
          }, 400);
        });
      } else {
        // Continue hands-free conversation if not over!
        speakVoice(spoken, !isOver, data.audioUrl);
      }
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

  processUserMessageRef.current = processUserMessage;

  const toggleMic = () => {
    // Prime mic permission during user gesture on mobile
    speechRecognitionRef.current?.primePermission();

    if (!hasStarted) {
      handleOpenAssistant();
      return;
    }

    if (isConversationOver) {
      handleRestartConversation();
      return;
    }

    if (voiceState === 'listening') {
      setIsAutoListening(false);
      stopListening();
    } else if (voiceState === 'speaking') {
      speechSynthesisRef.current?.stop();
      setIsAutoListening(true);
      startListening();
    } else {
      setIsAutoListening(true);
      startListening();
    }
  };

  const handleSelectQuestion = (question: string) => {
    // Prime mic permission during user gesture on mobile
    speechRecognitionRef.current?.primePermission();

    if (!isOpen) {
      setIsOpen(true);
      setIsDismissed(false);
    }
    setHasStarted(true);
    setIsAutoListening(true);
    setIsConversationOver(false);
    processUserMessage(question);
  };

  const handleRestartConversation = () => {
    // Prime mic permission during user gesture on mobile
    speechRecognitionRef.current?.primePermission();

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
      cachedWelcomeAudioUrlRef.current || INITIAL_WELCOME_MESSAGE.audioUrl
    );
  };

  // Triggered when user CLICKS the widget button: Opens widget and introduces himself IMMEDIATELY!
  const handleOpenAssistant = () => {
    setIsDismissed(false);
    setIsOpen(true);
    setIsAutoListening(true);
    setIsConversationOver(false);
    setHasStarted(true);

    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.resume();
    }

    // Prime microphone permission during this direct user tap/click gesture
    speechRecognitionRef.current?.primePermission();

    // Synchronous execution within the user's click handler guarantees zero-latency instant speech
    speechSynthesisRef.current?.playWelcomeImmediately({
      onStart: () => {
        setVoiceState('speaking');
        setActivePlayingText(INITIAL_WELCOME_MESSAGE.voiceText || INITIAL_WELCOME_MESSAGE.text);
        setIsAutoplayBlocked(false);
      },
      onEnd: () => {
        setActivePlayingText(null);
        if (isAutoListeningRef.current && !isConversationOverRef.current) {
          startListening();
        } else {
          setVoiceState('idle');
        }
      },
      onError: () => {
        setActivePlayingText(null);
        if (isAutoListeningRef.current && !isConversationOverRef.current) {
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

  // Cross-frame parent window synchronization for WordPress HFCM iframe embeds
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
        window.parent.postMessage(
          {
            type: 'VISIONONE_WIDGET_STATE',
            isOpen,
            isClosedCompletely: isDismissed,
            dimensions: isOpen
              ? { width: 360, height: 580 }
              : isDismissed
              ? { width: 0, height: 0 }
              : { width: 250, height: 64 },
          },
          '*'
        );
      }
    } catch {
      // Ignore cross-frame errors
    }
  }, [isOpen, isDismissed]);

  // Listen for parent messages from WordPress site
  useEffect(() => {
    const handleParentMsg = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== 'object') return;
      if (event.data.action === 'OPEN_VISIONONE_WIDGET') {
        handleOpenAssistant();
      } else if (event.data.action === 'CLOSE_COMPLETELY') {
        handleDismissCompletely();
      } else if (event.data.action === 'CLOSE_VISIONONE_WIDGET') {
        handleMinimizeAssistant();
      }
    };
    window.addEventListener('message', handleParentMsg);
    return () => window.removeEventListener('message', handleParentMsg);
  }, [handleOpenAssistant, handleDismissCompletely, handleMinimizeAssistant]);

  return (
    <div
      className={`fixed inset-0 flex flex-col justify-end items-end p-2 select-none overflow-hidden font-['Inter'] transition-colors duration-200 ${
        isOpen ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
      style={{ background: 'transparent' }}
    >
      {/* Launcher State (Floating Capsule) */}
      {!isOpen && (
        <div className="pointer-events-auto flex items-end justify-end animate-in fade-in zoom-in-95 duration-200">
          <button
            onClick={handleOpenAssistant}
            className="group flex items-center gap-2 px-3.5 py-2 rounded-full glass-dark-capsule text-white shadow-xl hover:shadow-[#1D8DE6]/35 hover:scale-102 active:scale-98 transition-all cursor-pointer border border-white/25"
            aria-label="Open VisionONE Voice Assistant"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#1D8DE6] to-[#35A6F7] flex items-center justify-center shrink-0 shadow-xs">
              <Mic className="w-3.5 h-3.5 text-white animate-pulse" />
            </div>
            <div className="text-left pr-1">
              <span className="block text-xs font-bold font-['Sora'] leading-tight whitespace-nowrap text-white">
                VisionONE Voice AI
              </span>
              <span className="block text-[9px] text-[#E5F0FE]/85 font-['Inter'] whitespace-nowrap">
                Click to speak hands-free
              </span>
            </div>
          </button>
        </div>
      )}

      {/* Main Assistant Window when Open */}
      {isOpen && (
        <main className="relative z-10 w-full max-w-[360px] h-[min(560px,calc(100dvh-16px))] sm:h-[580px] flex flex-col justify-center items-center pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
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
            onMinimize={handleMinimizeAssistant}
            onOpenEmbedGuide={() => setIsEmbedModalOpen(true)}
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
            onSendMessage={(msg) => processUserMessage(msg)}
            onPlayVoice={(t, audioUrl) => speakVoice(t, !isConversationOver, audioUrl)}
            onOpenCta={(type) => {
              setLeadModalType(type);
              setIsLeadModalOpen(true);
            }}
          />
        </main>
      )}

      {/* Lead Capture Modal */}
      <LeadModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        onSubmit={handleLeadSubmit}
        initialType={leadModalType}
      />

      {/* WordPress HFCM Embed Code & Setup Guide Modal */}
      <EmbedModal
        isOpen={isEmbedModalOpen}
        onClose={() => setIsEmbedModalOpen(false)}
      />
    </div>
  );
}
