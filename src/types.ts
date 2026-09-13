export type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error';

export type AssistantMode = 'widget' | 'panel' | 'fullscreen' | 'embed';

export type InteractionMode = 'start' | 'text' | 'voice';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  voiceText?: string;
  timestamp: number;
  intent?: string;
  suggestedQuestions?: string[];
  cta?: {
    type: 'demo' | 'contact' | 'quote';
    label: string;
    description?: string;
  };
}

export interface LeadFormData {
  name: string;
  email: string;
  phone: string;
  companyName: string;
  industry?: string;
  employeeCount?: string;
  modulesInterested: string[];
  notes?: string;
}

export interface VoiceSettings {
  isMuted: boolean;
  rate: number;
  pitch: number;
  voiceName?: string;
  continuousMode: boolean;
}
