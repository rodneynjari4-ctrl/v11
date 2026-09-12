/**
 * Speech Recognition and Speech Synthesis utilities for VisionONE Access AI
 * Configured specifically for a reliable, warm male voice experience.
 */

interface IWindow extends Window {
  webkitSpeechRecognition?: any;
  SpeechRecognition?: any;
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const win = window as unknown as IWindow;
  return Boolean(win.SpeechRecognition || win.webkitSpeechRecognition);
}

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
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

        // Clear existing silence timer
        if (this.silenceTimer) {
          clearTimeout(this.silenceTimer);
          this.silenceTimer = null;
        }

        if (finalTranscript && currentText && !this.isSubmitted) {
          this.isSubmitted = true;
          this.onResultCallback?.(currentText, true);
        } else if (currentText) {
          this.onResultCallback?.(currentText, false);

          // If user pauses after speaking, auto-finalize after 1.4s of silence
          this.silenceTimer = setTimeout(() => {
            if (!this.isSubmitted && this.lastTranscript.trim()) {
              this.isSubmitted = true;
              this.onResultCallback?.(this.lastTranscript.trim(), true);
              this.stop();
            }
          }, 1400);
        }
      };

      this.recognition.onerror = (event: any) => {
        if (this.silenceTimer) {
          clearTimeout(this.silenceTimer);
          this.silenceTimer = null;
        }

        if (event.error === 'not-allowed') {
          this.onErrorCallback?.('Microphone access was denied. Please allow microphone permissions or use text chat.');
        } else if (event.error === 'no-speech') {
          // If we have some captured transcript, submit it instead of erroring
          if (this.lastTranscript.trim() && !this.isSubmitted) {
            this.isSubmitted = true;
            this.onResultCallback?.(this.lastTranscript.trim(), true);
          } else {
            this.onEndCallback?.();
          }
        } else if (event.error !== 'aborted') {
          this.onErrorCallback?.(`Recognition notice: ${event.error}`);
        }
        this.isListening = false;
      };

      this.recognition.onend = () => {
        if (this.silenceTimer) {
          clearTimeout(this.silenceTimer);
          this.silenceTimer = null;
        }

        // Fallback: If onend fired with an uncommitted transcript, submit it now
        if (this.lastTranscript.trim() && !this.isSubmitted) {
          this.isSubmitted = true;
          this.onResultCallback?.(this.lastTranscript.trim(), true);
        }

        this.isListening = false;
        this.onEndCallback?.();
      };
    } catch (err) {
      console.error('Failed to initialize SpeechRecognition:', err);
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
      console.warn('Microphone permission request failed:', err);
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
      console.warn('Audio analyzer initialization skipped:', e);
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
      onError('Speech recognition is not supported in this browser. Please use modern Chrome, Edge, or Safari.');
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
        this.recognition.stop();
        setTimeout(() => {
          try {
            this.recognition.start();
          } catch {
            // Handled
          }
        }, 150);
      } else {
        onError('Unable to start speech input. Please check microphone access.');
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
      } catch {
        // Handled
      }
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
      } catch {
        // Handled
      }
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
   * Deterministically finds and locks the best warm male voice on this device
   */
  private selectWarmMaleVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
    if (!voices || voices.length === 0) return null;

    // Filter to English voices
    const englishVoices = voices.filter((v) => v.lang.startsWith('en'));
    const candidatePool = englishVoices.length > 0 ? englishVoices : voices;

    let bestVoice: SpeechSynthesisVoice | null = null;
    let bestScore = -Infinity;

    for (const voice of candidatePool) {
      const lowerName = voice.name.toLowerCase();
      let score = 0;

      // 1. Heavy penalty if known female voice
      const isFemale = FEMALE_VOICE_PATTERNS.some((fem) => lowerName.includes(fem));
      if (isFemale) {
        score -= 5000;
      }

      // 2. Priority check against top-tier warm male voices
      for (let i = 0; i < WARM_MALE_VOICE_PRIORITY.length; i++) {
        const priorityName = WARM_MALE_VOICE_PRIORITY[i];
        if (lowerName.includes(priorityName)) {
          score += 1000 - i * 30;
          break;
        }
      }

      // 3. Positive signal for male indicators
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

    return bestVoice || candidatePool[0] || null;
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
      } catch {
        // Handled
      }
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

    // Cancel any current utterance immediately to ensure snappy responsiveness
    this.stop();

    // Clean text of markdown, asterisks, URLs, and code brackets
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

    // If voices not initialized yet, try fetching again
    if (!this.warmMaleVoice) {
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        this.warmMaleVoice = this.selectWarmMaleVoice(voices);
      }
    }

    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(cleanText);

      // Warm male voice acoustics: slightly deeper pitch (0.94) and natural cadence (1.0)
      utterance.pitch = options.pitch ?? 0.94;
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

        // Chrome SpeechSynthesis keep-alive fix (prevents audio cutting off on long phrases)
        if (this.chromeKeepAliveInterval) {
          clearInterval(this.chromeKeepAliveInterval);
        }
        this.chromeKeepAliveInterval = setInterval(() => {
          if (window.speechSynthesis.speaking && window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }
        }, 3000);
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
