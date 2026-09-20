import React, { useState, useEffect, useRef, useCallback } from 'react';
import { VoiceState, ChatMessage, VoiceSettings, LeadFormData } from './types';
import { AssistantPanel } from './components/AssistantPanel';
import { LeadModal } from './components/LeadModal';
import {
  SpeechRecognitionManager,
  SpeechSynthesisManager,
} from './lib/speech';

const INITIAL_WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome-msg',
  role: 'assistant',
  text: "Hello! I am your VisionONE Access AI guide. I can assist you with ERP, Finance & Accounting, HR & Payroll, Inventory, eTIMS tax compliance, and M-Pesa integration.\n\nWhat business area would you like to explore?",
  voiceText: "Hello! Welcome to Vision One Access. What business area would you like to explore today?",
  timestamp: Date.now(),
  suggestedQuestions: [
    'What modules are in VisionONE ERP?',
    'How does HR & Payroll work?',
    'Explain eTIMS tax compliance',
    'How does M-Pesa integrate?',
    'Can I book a demo?',
  ],
};

export default function App() {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [isAutoListening, setIsAutoListening] = useState<boolean>(true);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_WELCOME_MESSAGE]);
  const [micAmplitude, setMicAmplitude] = useState<number>(0);
  const [activePlayingText, setActivePlayingText] = useState<string | null>(null);
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
  const hasInitializedVoiceRef = useRef<boolean>(false);

  // Initialize Speech Managers on mount
  useEffect(() => {
    speechRecognitionRef.current = new SpeechRecognitionManager();
    speechSynthesisRef.current = new SpeechSynthesisManager();

    return () => {
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

  // Safe microphone speech recognition starter for continuous hands-free conversation
  const startListening = useCallback(async () => {
    // Interruption logic: halt active voice playback immediately
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.stop();
    }

    if (!speechRecognitionRef.current) {
      setVoiceState('idle');
      return;
    }

    const hasPerm = await speechRecognitionRef.current.requestMicrophonePermission();
    if (!hasPerm) {
      setVoiceState('idle');
      const errorMsg: ChatMessage = {
        id: 'mic-denied-' + Date.now(),
        role: 'assistant',
        text: 'Microphone access is needed for the voice assistant. Please allow microphone permissions in your browser.',
        voiceText: 'Microphone access is needed for the voice assistant. Please allow microphone permissions.',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
      return;
    }

    setVoiceState('listening');

    speechRecognitionRef.current.start(
      (text: string, isFinal: boolean) => {
        if (isFinal && text.trim()) {
          speechRecognitionRef.current?.stop();
          processUserMessage(text);
        }
      },
      (error: string) => {
        console.warn('Recognition notice:', error);
        if (!isAutoListeningRef.current) {
          setVoiceState('idle');
        }
      },
      () => {
        setVoiceState('listening');
      },
      () => {
        if (voiceState === 'listening' && !isAutoListeningRef.current) {
          setVoiceState('idle');
        }
      }
    );
  }, []);

  const stopListening = useCallback(() => {
    speechRecognitionRef.current?.stop();
    setVoiceState('idle');
  }, []);

  // Consistent Warm Male Voice Synthesizer with Automatic Turn-Taking
  const speakVoice = useCallback(
    async (text: string, autoListenAfter = true) => {
      if (voiceSettings.isMuted || !text) {
        setVoiceState('idle');
        setActivePlayingText(null);
        if (autoListenAfter && isAutoListeningRef.current) {
          startListening();
        }
        return;
      }

      setVoiceState('speaking');
      setActivePlayingText(text);

      if (speechSynthesisRef.current) {
        speechSynthesisRef.current.speakText(text, {
          rate: voiceSettings.rate,
          pitch: voiceSettings.pitch,
          onStart: () => {
            setVoiceState('speaking');
          },
          onEnd: () => {
            setActivePlayingText(null);
            // AUTOMATIC CONTINUOUS LOOP: immediately resume listening without tapping!
            if (autoListenAfter && isAutoListeningRef.current) {
              startListening();
            } else {
              setVoiceState('idle');
            }
          },
          onError: () => {
            setActivePlayingText(null);
            if (autoListenAfter && isAutoListeningRef.current) {
              startListening();
            } else {
              setVoiceState('idle');
            }
          },
        });
      } else {
        setVoiceState('idle');
        setActivePlayingText(null);
        if (autoListenAfter && isAutoListeningRef.current) {
          startListening();
        }
      }
    },
    [voiceSettings, startListening]
  );

  // Auto-start voice immediately on initial load
  useEffect(() => {
    if (hasInitializedVoiceRef.current) return;
    hasInitializedVoiceRef.current = true;

    const timer = setTimeout(() => {
      speakVoice(
        INITIAL_WELCOME_MESSAGE.voiceText ||
          "Hello! Welcome to Vision One Access. What business area would you like to explore today?",
        true
      );
    }, 450);

    // If browser autoplay policies require a user gesture, the first click/touch unlocks audio immediately
    const unlockAudio = () => {
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('click', unlockAudio);
      if (speechSynthesisRef.current) {
        speechSynthesisRef.current.resume();
      }
    };

    window.addEventListener('pointerdown', unlockAudio, { once: true });
    window.addEventListener('click', unlockAudio, { once: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('click', unlockAudio);
    };
  }, [speakVoice]);

  // Send message to server-side AI
  const processUserMessage = async (userText: string) => {
    const trimmed = userText.trim();
    if (!trimmed) return;

    // Immediately stop any active voice speech or recognition
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.stop();
    }
    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
    }

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

      const aiMsg: ChatMessage = {
        id: 'msg-' + (Date.now() + 1),
        role: 'assistant',
        text: data.text,
        voiceText: data.voiceText,
        timestamp: Date.now(),
        intent: data.intent,
        cta: data.cta,
        suggestedQuestions: data.suggestedQuestions,
      };

      setMessages((prev) => [...prev, aiMsg]);
      if (data.suggestedQuestions && data.suggestedQuestions.length > 0) {
        setSuggestedQuestions(data.suggestedQuestions);
      }

      // Automatically speak the response and then return directly to listening hands-free!
      const spoken = data.voiceText || data.text;
      speakVoice(spoken, true);
    } catch (err) {
      console.warn('Chat request fallback notice:', err);
      setVoiceState('idle');

      const fallbackMsg: ChatMessage = {
        id: 'msg-err-' + Date.now(),
        role: 'assistant',
        text: "VisionONE Access unifies ERP, Finance, HR & Payroll, and Inventory into a single real-time platform. Would you like to explore Finance, HR, or schedule a live demo?",
        voiceText: "VisionONE connects your entire operations. Would you like to explore Finance, HR, or schedule a live demo?",
        timestamp: Date.now(),
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

  // Toggle or interrupt mic
  const toggleMic = () => {
    if (voiceState === 'listening') {
      // User tapped while listening -> Pause automatic listening
      setIsAutoListening(false);
      stopListening();
    } else if (voiceState === 'speaking') {
      // User tapped while AI was speaking -> Interrupt speech and start listening to user immediately!
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
    setIsAutoListening(true);
    processUserMessage(question);
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

      {/* Responsive VisionONE Access AI Container - Direct Voice Interface */}
      <main className="relative z-10 w-full h-full sm:h-[88vh] sm:max-h-[660px] sm:max-w-[380px] flex flex-col justify-center items-center">
        <AssistantPanel
          voiceState={voiceState}
          messages={messages}
          voiceSettings={voiceSettings}
          micAmplitude={micAmplitude}
          activePlayingText={activePlayingText}
          suggestedQuestions={suggestedQuestions}
          onReset={() => {
            speechSynthesisRef.current?.stop();
            speechRecognitionRef.current?.stop();
            setVoiceState('idle');
            setMessages([INITIAL_WELCOME_MESSAGE]);
            setSuggestedQuestions(INITIAL_WELCOME_MESSAGE.suggestedQuestions || []);
            setIsAutoListening(true);
            speakVoice(INITIAL_WELCOME_MESSAGE.voiceText || "Hello! Welcome to Vision One Access.", true);
          }}
          onToggleMute={() => {
            if (!voiceSettings.isMuted) {
              speechSynthesisRef.current?.stop();
              setVoiceState('idle');
            }
            setVoiceSettings((prev) => ({ ...prev, isMuted: !prev.isMuted }));
          }}
          onToggleMic={toggleMic}
          onRetry={startListening}
          onSelectQuestion={handleSelectQuestion}
          onPlayVoice={(t) => speakVoice(t, true)}
          onOpenCta={(type) => {
            setLeadModalType(type);
            setIsLeadModalOpen(true);
          }}
        />
      </main>

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
