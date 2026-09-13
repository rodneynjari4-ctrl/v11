/**
 * Speech Recognition and Speech Synthesis utilities for VisionONE Access AI
 * Configured specifically for a reliable, warm male voice experience
 * and fully safe for iframe / WordPress embeds.
 */

interface IWindow extends Window {
  webkitSpeechRecognition?: any;
  SpeechRecognition?: any;
  webkitAudioContext?: typeof AudioContext;
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const win = window as unknown as IWindow;
  return Boolean(win.SpeechRecognition || win.webkitSpeechRecognition);
}

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function isSecureContextOrLocal(): boolean {
  if (typeof window === 'undefined') return false;
  return window.isSecureContext || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
}

// Known female voice identifiers to strictly filter out
const FEMALE_VOICE_PATTERNS = [
  'female', 'samantha', 'karen', 'jenny', 'victoria', 'zira', 'susan', 'cynthia',
  'moira', 'fiona', 'tessa', 'stephanie', 'hazel', 'aria', 'ava', 'allison',
  'serena', 'helena', 'yuri', 'marina', 'alva', 'clara', 'lisa', 'amy', 'emma',
  'monica', 'veena', 'priya', 'alice', 'sara', 'sarah', 'kendra', 'joanna', 'kathy'
];

// Preferred warm, natural male voice rank order
const WARM_MALE_VOICE_PRIORITY = [
  'microsoft guy online (natural)',
  'microsoft christopher online (natural)',
  'microsoft ryan online (natural)',
  'microsoft eric online (natural)',
  'microsoft steffan online (natural)',
  'google uk english male',
  'google us english male',
  'daniel', // macOS/iOS warm UK male
  'alex',   // macOS warm US male
  'oliver', // macOS natural male
  'arthur',
  'microsoft david',
  'microsoft mark',
  'microsoft george',
  'fred',
  'aaron',
  'tom',
  'nathan'
];

export class SpeechRecognitionManager {
  private recognition: any = null;
  private isListening = false;
  private onResultCallback?: (text: string, isFinal: boolean) => void;
  private onErrorCallback?: (error: string) => void;
  private onEndCallback?: () => void;
  private onStartCallback?: () => void;
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  
  // Buffering and silence detection to prevent lost user utterances
  private lastTranscript = '';
  private isSubmitted = false;
  private silenceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.initRecognition();
  }

  private initRecognition() {
    if (typeof window === 'undefined') return;
    const win = window as unknown as IWindow;
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      return;
    }

    try {
      this.recognition = new SpeechRecognitionClass();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onstart = () => {
        this.isListening = true;
        this.lastTranscript = '';
        this.isSubmitted = false;
        this.onStartCallback?.();
      };

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const currentText = (finalTranscript || interimTranscript).trim();
        if (currentText) {
          this.lastTranscript = currentText;
        }

        if (this.silenceTimer) {
          clearTimeout(this.silenceTimer);
          this.silenceTimer = null;
        }

        if (finalTranscript && currentText && !this.isSubmitted) {
          this.isSubmitted = true;
          this.onResultCallback?.(currentText, true);
        } else if (currentText) {
          this.onResultCallback?.(currentText, false);

          // Auto-finalize on pause
          this.silenceTimer = setTimeout(() => {
            if (!this.isSubmitted && this.lastTranscript.trim()) {
              this.isSubmitted = true;
              this.onResultCallback?.(this.lastTranscript.trim(), true);
              this.stop();
            }
          }, 1300);
        }
      };

      this.recognition.onerror = (event: any) => {
        if (this.silenceTimer) {
          clearTimeout(this.silenceTimer);
          this.silenceTimer = null;
        }

        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          this.onErrorCallback?.('Microphone access is restricted by your browser or iframe embed. You can type below.');
        } else if (event.error === 'no-speech') {
          if (this.lastTranscript.trim() && !this.isSubmitted) {
            this.isSubmitted = true;
            this.onResultCallback?.(this.lastTranscript.trim(), true);
          } else {
            this.onEndCallback?.();
          }
        } else if (event.error !== 'aborted') {
          this.onErrorCallback?.(event.error);
        }
        this.isListening = false;
      };

      this.recognition.onend = () => {
        if (this.silenceTimer) {
          clearTimeout(this.silenceTimer);
          this.silenceTimer = null;
        }

        if (this.lastTranscript.trim() && !this.isSubmitted) {
          this.isSubmitted = true;
          this.onResultCallback?.(this.lastTranscript.trim(), true);
        }

        this.isListening = false;
        this.onEndCallback?.();
      };
    } catch (err) {
      console.warn('SpeechRecognition initialization notice:', err);
    }
  }

  public async requestMicrophonePermission(): Promise<boolean> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return false;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaStream = stream;
      this.setupAudioAnalyser(stream);
      return true;
    } catch (err) {
      console.warn('Microphone permission request rejected or restricted:', err);
      return false;
    }
  }

  private setupAudioAnalyser(stream: MediaStream) {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 128;
      source.connect(this.analyser);
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    } catch (e) {
      console.warn('Audio analyzer skipped:', e);
    }
  }

  public getMicAmplitude(): number {
    if (!this.analyser || !this.dataArray || !this.isListening) {
      return 0;
    }
    try {
      this.analyser.getByteFrequencyData(this.dataArray);
      let sum = 0;
      for (let i = 0; i < this.dataArray.length; i++) {
        sum += this.dataArray[i];
      }
      const avg = sum / this.dataArray.length;
      return Math.min(1, avg / 80);
    } catch (e) {
      return 0;
    }
  }

  public start(
    onResult: (text: string, isFinal: boolean) => void,
    onError: (error: string) => void,
    onStart?: () => void,
    onEnd?: () => void
  ) {
    if (!this.recognition) {
      onError('Microphone speech input is restricted or unsupported in this browser environment. You can type below.');
      return;
    }

    this.lastTranscript = '';
    this.isSubmitted = false;
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }

    this.onResultCallback = onResult;
    this.onErrorCallback = onError;
    this.onStartCallback = onStart;
    this.onEndCallback = onEnd;

    try {
      this.recognition.start();
    } catch (err: any) {
      if (err.name === 'InvalidStateError') {
        try {
          this.recognition.stop();
        } catch {}
        setTimeout(() => {
          try {
            this.recognition.start();
          } catch {
            onError('Could not start microphone. You can type your message below.');
          }
        }, 150);
      } else {
        onError('Microphone input is restricted in this embed. You can type your question below.');
      }
    }
  }

  public stop() {
    this.isListening = false;
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {}
    }
  }

  public abort() {
    this.isListening = false;
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch {}
    }
  }

  public getListening(): boolean {
    return this.isListening;
  }
}

export class SpeechSynthesisManager {
  private isSpeakingState = false;
  private warmMaleVoice: SpeechSynthesisVoice | null = null;
  private chromeKeepAliveInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.initVoices();
  }

  private initVoices() {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const findVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        this.warmMaleVoice = this.selectWarmMaleVoice(voices);
      }
    };

    findVoice();
    window.speechSynthesis.onvoiceschanged = () => {
      findVoice();
    };
  }

  /**
   * Deterministically locks a natural, warm baritone male voice
   */
  private selectWarmMaleVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
    if (!voices || voices.length === 0) return null;

    const englishVoices = voices.filter((v) => v.lang.startsWith('en'));
    const pool = englishVoices.length > 0 ? englishVoices : voices;

    let bestVoice: SpeechSynthesisVoice | null = null;
    let bestScore = -Infinity;

    for (const voice of pool) {
      const lowerName = voice.name.toLowerCase();
      let score = 0;

      // Filter out female voices
      if (FEMALE_VOICE_PATTERNS.some((fem) => lowerName.includes(fem))) {
        score -= 5000;
      }

      // Priority list
      for (let i = 0; i < WARM_MALE_VOICE_PRIORITY.length; i++) {
        if (lowerName.includes(WARM_MALE_VOICE_PRIORITY[i])) {
          score += 1000 - i * 30;
          break;
        }
      }

      if (lowerName.includes('male') && !lowerName.includes('female')) {
        score += 200;
      }
      if (lowerName.includes('natural') || lowerName.includes('neural')) {
        score += 100;
      }
      if (voice.lang === 'en-US' || voice.lang === 'en-GB') {
        score += 50;
      }

      if (score > bestScore) {
        bestScore = score;
        bestVoice = voice;
      }
    }

    return bestVoice || pool[0] || null;
  }

  public isSpeaking(): boolean {
    if (typeof window === 'undefined') return false;
    return this.isSpeakingState || window.speechSynthesis?.speaking || false;
  }

  public stop() {
    this.isSpeakingState = false;
    if (this.chromeKeepAliveInterval) {
      clearInterval(this.chromeKeepAliveInterval);
      this.chromeKeepAliveInterval = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
  }

  public async speakText(
    text: string,
    options: {
      rate?: number;
      pitch?: number;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
    } = {}
  ): Promise<void> {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      options.onEnd?.();
      return;
    }

    this.stop();

    const cleanText = text
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#/g, '')
      .replace(/`[^`]*`/g, '')
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      .trim();

    if (!cleanText) {
      options.onEnd?.();
      return;
    }

    if (!this.warmMaleVoice) {
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        this.warmMaleVoice = this.selectWarmMaleVoice(voices);
      }
    }

    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.pitch = options.pitch ?? 0.94; // Warm resonant baritone male pitch
      utterance.rate = options.rate ?? 1.0;
      utterance.lang = 'en-US';

      if (this.warmMaleVoice) {
        utterance.voice = this.warmMaleVoice;
      }

      const cleanup = () => {
        this.isSpeakingState = false;
        if (this.chromeKeepAliveInterval) {
          clearInterval(this.chromeKeepAliveInterval);
          this.chromeKeepAliveInterval = null;
        }
      };

      utterance.onstart = () => {
        this.isSpeakingState = true;
        options.onStart?.();

        if (this.chromeKeepAliveInterval) {
          clearInterval(this.chromeKeepAliveInterval);
        }
        this.chromeKeepAliveInterval = setInterval(() => {
          if (window.speechSynthesis?.speaking && window.speechSynthesis?.paused) {
            window.speechSynthesis.resume();
          }
        }, 2500);
      };

      utterance.onend = () => {
        cleanup();
        options.onEnd?.();
        resolve();
      };

      utterance.onerror = (e) => {
        cleanup();
        if (e.error !== 'canceled' && e.error !== 'interrupted') {
          options.onError?.(e);
        }
        options.onEnd?.();
        resolve();
      };

      try {
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        cleanup();
        options.onEnd?.();
        resolve();
      }
    });
  }
}
