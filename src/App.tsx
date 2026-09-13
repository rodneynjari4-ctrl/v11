import React, { useState, useEffect, useRef, useCallback } from 'react';
import { VoiceState, ChatMessage, VoiceSettings, LeadFormData, InteractionMode } from './types';
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
  voiceText: "Hello! I am your VisionONE Access AI guide. What business area would you like to explore today?",
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
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('start');
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_WELCOME_MESSAGE]);
  const [micAmplitude, setMicAmplitude] = useState<number>(0);
  const [activePlayingText, setActivePlayingText] = useState<string | null>(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>(
    INITIAL_WELCOME_MESSAGE.suggestedQuestions || []
  );

  // Lead capture modal
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [leadModalType, setLeadModalType] = useState<'demo' | 'quote' | 'contact'>('demo');

  // Warm resonant baritone male voice settings
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    isMuted: false,
    rate: 1.0,
    pitch: 0.94,
    continuousMode: false,
  });

  // Speech and Audio Managers
  const speechRecognitionRef = useRef<SpeechRecognitionManager | null>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisManager | null>(null);
  const animFrameRef = useRef<number | null>(null);

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

  // Consistent Warm Male Voice Synthesizer
  const speakVoice = useCallback(
    async (text: string) => {
      if (voiceSettings.isMuted || !text) {
        setVoiceState('idle');
        setActivePlayingText(null);
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
            setVoiceState('idle');
            setActivePlayingText(null);
          },
          onError: () => {
            setVoiceState('idle');
            setActivePlayingText(null);
          },
        });
      } else {
        setVoiceState('idle');
        setActivePlayingText(null);
      }
    },
    [voiceSettings]
  );

  // Send message to server-side AI
  const processUserMessage = async (userText: string) => {
    const trimmed = userText.trim();
    if (!trimmed) return;

    // Immediately stop any active voice speech
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.stop();
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

      // Play in consistent warm male voice
      const spoken = data.voiceText || data.text;
      speakVoice(spoken);
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
      speakVoice(fallbackMsg.voiceText!);
    }
  };

  // Safe microphone speech recognition starter (never crashes or locks app in iframes)
  const startListening = async () => {
    // Interruption logic: halt current voice playback immediately
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.stop();
    }

    if (!speechRecognitionRef.current) {
      const notice: ChatMessage = {
        id: 'mic-unavail-' + Date.now(),
        role: 'assistant',
        text: 'Speech recognition is unavailable in this browser. You can type your question below.',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, notice]);
      return;
    }

    const hasPerm = await speechRecognitionRef.current.requestMicrophonePermission();
    if (!hasPerm) {
      // Keep voiceState idle rather than locking into a broken error state!
      setVoiceState('idle');
      const errorMsg: ChatMessage = {
        id: 'mic-denied-' + Date.now(),
        role: 'assistant',
        text: 'Microphone access is restricted by your browser or iframe embed. You can type below or tap any suggested question, and I will speak back to you!',
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
        setVoiceState('idle');
      },
      () => {
        setVoiceState('listening');
      },
      () => {
        if (voiceState === 'listening') {
          setVoiceState('idle');
        }
      }
    );
  };

  const stopListening = () => {
    speechRecognitionRef.current?.stop();
    setVoiceState('idle');
  };

  const toggleMic = () => {
    if (voiceState === 'listening') {
      stopListening();
    } else if (voiceState === 'speaking') {
      speechSynthesisRef.current?.stop();
      startListening();
    } else {
      startListening();
    }
  };

  const handleSelectTextChat = () => {
    setInteractionMode('text');
  };

  const handleSelectVoiceChat = () => {
    setInteractionMode('voice');
    // Speak initial welcome and start listening
    speakVoice(INITIAL_WELCOME_MESSAGE.voiceText || "Hello! What business area would you like to explore today?");
    startListening();
  };

  const handleSelectQuestion = (question: string) => {
    if (interactionMode === 'start') {
      setInteractionMode('text');
    }
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
        speakVoice(`Thank you ${leadData.name}. A VisionONE consultant will contact you shortly.`);
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

      {/* Responsive VisionONE Access AI Container - Slimmer Profile */}
      <main className="relative z-10 w-full h-full sm:h-[88vh] sm:max-h-[660px] sm:max-w-[380px] flex flex-col justify-center items-center">
        <AssistantPanel
          voiceState={voiceState}
          messages={messages}
          voiceSettings={voiceSettings}
          interactionMode={interactionMode}
          micAmplitude={micAmplitude}
          activePlayingText={activePlayingText}
          suggestedQuestions={suggestedQuestions}
          onReset={() => {
            speechSynthesisRef.current?.stop();
            speechRecognitionRef.current?.stop();
            setVoiceState('idle');
            setMessages([INITIAL_WELCOME_MESSAGE]);
            setSuggestedQuestions(INITIAL_WELCOME_MESSAGE.suggestedQuestions || []);
            setInteractionMode('start');
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
          onSendText={processUserMessage}
          onSelectQuestion={handleSelectQuestion}
          onPlayVoice={speakVoice}
          onSelectTextChat={handleSelectTextChat}
          onSelectVoiceChat={handleSelectVoiceChat}
          onSetInteractionMode={setInteractionMode}
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
