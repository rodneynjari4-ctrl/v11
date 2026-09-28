/**
 * Speech Recognition and High-Definition Neural Speech Synthesis for VisionONE Access AI
 * Features server-side Gemini 3.1 Flash Neural TTS (ultra-realistic human voice)
 * with robust browser speech fallback and fail-safe watchdog timers.
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

// Known female voice identifiers to strictly filter out for browser fallback
const FEMALE_VOICE_PATTERNS = [
  'female', 'samantha', 'karen', 'jenny', 'victoria', 'zira', 'susan', 'cynthia',
  'moira', 'fiona', 'tessa', 'stephanie', 'hazel', 'aria', 'ava', 'allison',
  'serena', 'helena', 'yuri', 'marina', 'alva', 'clara', 'lisa', 'amy', 'emma',
  'monica', 'veena', 'priya', 'alice', 'sara', 'sarah', 'kendra', 'joanna', 'kathy',
  'amber', 'ana', 'ashley', 'cora', 'elizabeth', 'heather', 'jane', 'jessica', 'julie',
  'kate', 'laura', 'linda', 'maria', 'michelle', 'nicole', 'rachel', 'rebecca', 'sofia',
  'zoe', 'zuzana', 'lucy', 'sonia', 'natasha', 'katja', 'evelyn', 'dora', 'chiara'
];

// Preferred warm, natural male browser voices
const WARM_MALE_VOICE_PRIORITY = [
  'microsoft guy online (natural)',
  'microsoft christopher online (natural)',
  'microsoft ryan online (natural)',
  'microsoft andrew online (natural)',
  'microsoft brian online (natural)',
  'daniel (enhanced)',
  'oliver (enhanced)',
  'evan (enhanced)',
  'google us english',
  'google uk english male',
  'daniel',
  'alex',
  'microsoft david',
  'fred'
];

/**
 * Normalizes text specifically for speech so that acronyms, business terms,
 * and currency sound completely naturalistic and authentic.
 */
export function normalizeTextForNaturalSpeech(rawText: string): string {
  if (!rawText) return '';

  let text = rawText;

  // 1. Remove markdown formatting, asterisks, hashes, backticks, brackets
  text = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
  text = text.replace(/[*_#`~>]/g, ' ');
  text = text.replace(/\{[^}]+\}/g, ' ');
  text = text.replace(/https?:\/\/\S+/gi, 'our website');

  // 2. Remove list numbers & bullets
  text = text.replace(/^\s*[-•*]\s+/gm, ' ');
  text = text.replace(/^\s*\d+\.\s+/gm, ' ');

  // 3. Normalize common symbols
  text = text.replace(/&/g, ' and ');
  text = text.replace(/%/g, ' percent ');
  text = text.replace(/@/g, ' at ');
  text = text.replace(/\+/g, ' plus ');
  text = text.replace(/\$/g, ' dollars ');
  text = text.replace(/\b(KES|Ksh|KSh)\b/g, 'Kenyan Shillings');

  // 4. Domain-specific phonetic replacements
  text = text.replace(/\bHR\/Payroll\b/gi, 'H-R and Payroll');
  text = text.replace(/\bHR\b/g, 'H-R');
  text = text.replace(/\bERP\b/g, 'E-R-P');
  text = text.replace(/\b(M-Pesa|MPesa|M-PESA|MPESA)\b/g, 'Em-Pesa');
  text = text.replace(/\beTIMS\b/g, 'ee-Tims');
  text = text.replace(/\bETIMS\b/g, 'ee-Tims');
  text = text.replace(/\bKRA\b/g, 'K-R-A');
  text = text.replace(/\bVisionONE\b/g, 'Vision One');
  text = text.replace(/\bPayBill\b/g, 'Pay Bill');
  text = text.replace(/\bSTK Push\b/g, 'S-T-K Push');
  text = text.replace(/\bVAT\b/g, 'V-A-T');
  text = text.replace(/\bP&L\b/g, 'P and L');
  text = text.replace(/\bAPI\b/g, 'A-P-I');

  return text.replace(/\s+/g, ' ').trim();
}

/**
 * SpeechRecognitionManager
 * Truly hands-free speech-to-text with auto-recovery, silence detection,
 * automatic turn recycling, and watchdog revival for continuous conversation.
 */
export class SpeechRecognitionManager {
  private recognition: any = null;
  private isListening = false;
  private shouldBeListening = false;
  private isSpeakingOrThinking = false;
  private lastTranscript = '';
  private isSubmitted = false;
  private silenceTimer: ReturnType<typeof setTimeout> | null = null;
  private restartTimer: ReturnType<typeof setTimeout> | null = null;
  private watchdogTimer: ReturnType<typeof setInterval> | null = null;

  private onResultCallback: ((text: string, isFinal: boolean) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;
  private onStartCallback: (() => void) | null = null;
  private onEndCallback: (() => void) | null = null;

  // Audio Analyser for microphone input amplitude
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private mediaStream: MediaStream | null = null;
  private hasRequestedMicPermission = false;

  constructor() {
    this.startWatchdog();
  }

  private startWatchdog() {
    if (this.watchdogTimer) {
      clearInterval(this.watchdogTimer);
    }
    // Check every 1.5 seconds: if hands-free listening is intended but inactive, revive immediately!
    this.watchdogTimer = setInterval(() => {
      if (this.shouldBeListening && !this.isSpeakingOrThinking && !this.isListening) {
        this.safeStartRecognition();
      }
    }, 1500);
  }

  private createRecognitionInstance(): any {
    if (typeof window === 'undefined') return null;
    const win = window as unknown as IWindow;
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      return null;
    }

    try {
      const rec = new SpeechRecognitionClass();
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      rec.lang = 'en-US';

      rec.onstart = () => {
        this.isListening = true;
        this.onStartCallback?.();
      };

      rec.onresult = (event: any) => {
        // Discard any incoming sound while AI is actively speaking or thinking
        if (this.isSpeakingOrThinking) return;

        let accumulatedFinal = '';
        let interimText = '';

        for (let i = 0; i < event.results.length; ++i) {
          const res = event.results[i];
          if (res.isFinal) {
            accumulatedFinal += res[0].transcript + ' ';
          } else {
            interimText += res[0].transcript;
          }
        }

        const currentText = (accumulatedFinal + interimText).trim();
        if (currentText) {
          this.lastTranscript = currentText;
          // Send live interim transcript so user sees they are heard immediately
          this.onResultCallback?.(currentText, false);

          if (this.silenceTimer) {
            clearTimeout(this.silenceTimer);
            this.silenceTimer = null;
          }

          // Hands-free natural silence detector: 1.5s of silence auto-submits hands-free!
          this.silenceTimer = setTimeout(() => {
            if (!this.isSubmitted && this.lastTranscript.trim() && !this.isSpeakingOrThinking) {
              this.isSubmitted = true;
              const textToSend = this.lastTranscript.trim();
              this.pauseListeningForAgentTurn();
              this.onResultCallback?.(textToSend, true);
            }
          }, 1500);
        }
      };

      rec.onerror = (event: any) => {
        if (event.error === 'no-speech') {
          // Expected in continuous mode when user is pauses or listens. Auto-restart handles it.
          return;
        }

        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          this.shouldBeListening = false;
          this.isListening = false;
          this.onErrorCallback?.('Microphone access is restricted. Please enable microphone permissions in your browser settings.');
          return;
        }

        if (event.error === 'aborted') {
          // Normal when pausing between turns
          return;
        }
      };

      rec.onend = () => {
        this.isListening = false;
        if (this.silenceTimer) {
          clearTimeout(this.silenceTimer);
          this.silenceTimer = null;
        }

        // HANDS-FREE INFINITE LOOP: If we should be listening, revive immediately!
        if (this.shouldBeListening && !this.isSpeakingOrThinking) {
          this.scheduleQuickRestart();
        } else {
          this.onEndCallback?.();
        }
      };

      return rec;
    } catch (err) {
      console.warn('SpeechRecognition initialization error:', err);
      return null;
    }
  }

  private scheduleQuickRestart() {
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
    }
    this.restartTimer = setTimeout(() => {
      if (this.shouldBeListening && !this.isListening && !this.isSpeakingOrThinking) {
        this.safeStartRecognition();
      }
    }, 60);
  }

  private safeStartRecognition() {
    if (!this.shouldBeListening || this.isSpeakingOrThinking) return;

    try {
      if (!this.recognition) {
        this.recognition = this.createRecognitionInstance();
      }
      this.recognition?.start();
    } catch (err: any) {
      // If recognition is in invalid state or already closing, recreate fresh instance
      try {
        this.recognition?.abort();
      } catch {}
      this.recognition = this.createRecognitionInstance();
      setTimeout(() => {
        if (this.shouldBeListening && !this.isSpeakingOrThinking) {
          try {
            this.recognition?.start();
          } catch {}
        }
      }, 100);
    }
  }

  public async initMicrophoneAudio(): Promise<boolean> {
    if (this.hasRequestedMicPermission && this.mediaStream) return true;
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return false;
    }
    try {
      this.hasRequestedMicPermission = true;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaStream = stream;
      this.setupAudioAnalyser(stream);
      return true;
    } catch (err) {
      console.warn('Microphone permission notice:', err);
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
      console.warn('Audio analyzer setup notice:', e);
    }
  }

  public getMicAmplitude(): number {
    if (!this.analyser || !this.dataArray || !this.isListening || this.isSpeakingOrThinking) {
      return 0;
    }
    try {
      this.analyser.getByteFrequencyData(this.dataArray);
      let sum = 0;
      for (let i = 0; i < this.dataArray.length; i++) {
        sum += this.dataArray[i];
      }
      const avg = sum / this.dataArray.length;
      return Math.min(1, avg / 75);
    } catch {
      return 0;
    }
  }

  public submitNow(): boolean {
    if (this.lastTranscript.trim() && !this.isSubmitted && !this.isSpeakingOrThinking) {
      this.isSubmitted = true;
      const completedText = this.lastTranscript.trim();
      if (this.silenceTimer) {
        clearTimeout(this.silenceTimer);
        this.silenceTimer = null;
      }
      this.pauseListeningForAgentTurn();
      this.onResultCallback?.(completedText, true);
      return true;
    }
    return false;
  }

  public pauseListeningForAgentTurn() {
    this.isSpeakingOrThinking = true;
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }
    try {
      this.recognition?.abort();
    } catch {}
    this.isListening = false;
  }

  public resumeListeningAfterAgentTurn() {
    this.isSpeakingOrThinking = false;
    this.shouldBeListening = true;
    this.isSubmitted = false;
    this.lastTranscript = '';
    try {
      this.recognition?.abort();
    } catch {}
    this.recognition = this.createRecognitionInstance();
    try {
      this.recognition?.start();
    } catch {
      setTimeout(() => {
        if (this.shouldBeListening && !this.isSpeakingOrThinking) {
          try {
            this.recognition?.start();
          } catch {}
        }
      }, 50);
    }
  }

  public start(
    onResult: (text: string, isFinal: boolean) => void,
    onError: (error: string) => void,
    onStart?: () => void,
    onEnd?: () => void
  ) {
    this.shouldBeListening = true;
    this.isSpeakingOrThinking = false;
    this.lastTranscript = '';
    this.isSubmitted = false;

    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }

    this.onResultCallback = onResult;
    this.onErrorCallback = onError;
    this.onStartCallback = onStart;
    this.onEndCallback = onEnd;

    // Lazily trigger persistent mic stream for amplitude visualizer in background
    if (!this.mediaStream) {
      this.initMicrophoneAudio().catch(() => {});
    }

    this.safeStartRecognition();
  }

  public stop() {
    this.shouldBeListening = false;
    this.isListening = false;
    this.isSpeakingOrThinking = false;
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }
    if (this.watchdogTimer) {
      clearInterval(this.watchdogTimer);
      this.watchdogTimer = null;
    }
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch {}
    }
  }

  public getListening(): boolean {
    return this.isListening && !this.isSpeakingOrThinking;
  }
}

/**
 * SpeechSynthesisManager
 * Plays Gemini 3.1 Flash Neural Audio (ultra-realistic, human baritone tone)
 * with robust HTML5 Audio handling, safety watchdogs, and browser speech fallback.
 */
export class SpeechSynthesisManager {
  private currentAudio: HTMLAudioElement | null = null;
  private isSpeakingState = false;
  private warmMaleVoice: SpeechSynthesisVoice | null = null;
  private watchdogTimer: ReturnType<typeof setTimeout> | null = null;
  private voiceMode: 'neural' | 'browser' = 'neural';

  constructor() {
    this.initBrowserVoices();
  }

  private initBrowserVoices() {
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

  private selectWarmMaleVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
    if (!voices || voices.length === 0) return null;

    const englishVoices = voices.filter((v) => v.lang.startsWith('en'));
    const pool = englishVoices.length > 0 ? englishVoices : voices;

    let bestVoice: SpeechSynthesisVoice | null = null;
    let bestScore = -Infinity;

    for (const voice of pool) {
      const lowerName = voice.name.toLowerCase();
      let score = 0;

      if (FEMALE_VOICE_PATTERNS.some((fem) => lowerName.includes(fem))) {
        score -= 10000;
      }

      if (
        lowerName.includes('online (natural)') ||
        lowerName.includes('natural') ||
        lowerName.includes('neural') ||
        lowerName.includes('enhanced')
      ) {
        score += 3500;
      }

      for (let i = 0; i < WARM_MALE_VOICE_PRIORITY.length; i++) {
        if (lowerName.includes(WARM_MALE_VOICE_PRIORITY[i])) {
          score += 2500 - i * 40;
          break;
        }
      }

      if (lowerName.includes('male') && !lowerName.includes('female')) {
        score += 400;
      }

      if (voice.lang === 'en-US' || voice.lang === 'en-GB') {
        score += 100;
      }

      if (score > bestScore) {
        bestScore = score;
        bestVoice = voice;
      }
    }

    return bestVoice || pool[0] || null;
  }

  public isSpeaking(): boolean {
    return this.isSpeakingState;
  }

  public getVoiceMode(): 'neural' | 'browser' {
    return this.voiceMode;
  }

  public resume() {
    if (typeof window !== 'undefined' && window.speechSynthesis?.paused) {
      try {
        window.speechSynthesis.resume();
      } catch {}
    }
  }

  public stop() {
    this.isSpeakingState = false;

    if (this.watchdogTimer) {
      clearTimeout(this.watchdogTimer);
      this.watchdogTimer = null;
    }

    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
        this.currentAudio.src = '';
      } catch {}
      this.currentAudio = null;
    }

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
  }

  /**
   * Speaks text using ultra-realistic Gemini Neural Audio if available,
   * with automatic fallback to browser speech synthesis.
   */
  public async speakText(
    text: string,
    options: {
      audioUrl?: string | null;
      rate?: number;
      pitch?: number;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
      onAutoplayBlocked?: () => void;
    } = {}
  ): Promise<void> {
    this.stop();

    const spokenText = normalizeTextForNaturalSpeech(text);
    if (!spokenText) {
      options.onEnd?.();
      return;
    }

    // 1. If high-definition Neural Audio URL is provided, play via HTML5 Audio
    if (options.audioUrl) {
      try {
        await this.playNeuralAudio(options.audioUrl, spokenText, options);
        return;
      } catch (err) {
        console.warn('Neural audio playback issue, falling back to browser speech:', err);
      }
    }

    // 2. Fetch neural audio on demand if not provided
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: spokenText, voice: 'Charon' }),
      });
      const data = await res.json();
      if (data.audioUrl) {
        await this.playNeuralAudio(data.audioUrl, spokenText, options);
        return;
      }
    } catch (ttsErr) {
      console.warn('On-demand TTS fetch notice:', ttsErr);
    }

    // 3. Fallback to enhanced browser SpeechSynthesis
    this.playBrowserSpeech(spokenText, options);
  }

  private playNeuralAudio(
    audioUrl: string,
    spokenText: string,
    options: {
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
      onAutoplayBlocked?: () => void;
    }
  ): Promise<void> {
    return new Promise((resolve) => {
      this.voiceMode = 'neural';
      this.isSpeakingState = true;

      const audio = new Audio(audioUrl);
      this.currentAudio = audio;
      audio.volume = 1.0;

      let isFinished = false;
      const cleanup = () => {
        if (isFinished) return;
        isFinished = true;
        this.isSpeakingState = false;
        if (this.watchdogTimer) {
          clearTimeout(this.watchdogTimer);
          this.watchdogTimer = null;
        }
        if (this.currentAudio === audio) {
          this.currentAudio = null;
        }
      };

      audio.onplay = () => {
        options.onStart?.();

        // Safety watchdog: ensure state advances even if audio events miss
        const durationSec = audio.duration && !isNaN(audio.duration) ? audio.duration : Math.max(3, spokenText.split(' ').length * 0.45);
        this.watchdogTimer = setTimeout(() => {
          if (!isFinished) {
            cleanup();
            options.onEnd?.();
            resolve();
          }
        }, Math.ceil(durationSec * 1000) + 1500);
      };

      audio.onended = () => {
        cleanup();
        options.onEnd?.();
        resolve();
      };

      audio.onerror = (e) => {
        cleanup();
        options.onError?.(e);
        // Fall back to browser speech if audio element fails
        this.playBrowserSpeech(spokenText, options);
        resolve();
      };

      audio.play().catch((playErr: any) => {
        console.warn('Audio play autoplay policy notice:', playErr);
        if (playErr?.name === 'NotAllowedError') {
          options.onAutoplayBlocked?.();
        }
        cleanup();
        this.playBrowserSpeech(spokenText, options);
        resolve();
      });
    });
  }

  private playBrowserSpeech(
    spokenText: string,
    options: {
      rate?: number;
      pitch?: number;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
    }
  ) {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      options.onEnd?.();
      return;
    }

    this.voiceMode = 'browser';
    this.isSpeakingState = true;

    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.pitch = options.pitch !== undefined ? Math.min(1.05, Math.max(0.96, options.pitch)) : 1.0;
    utterance.rate = options.rate !== undefined ? Math.min(1.05, Math.max(0.92, options.rate)) : 0.98;
    utterance.volume = 1.0;
    utterance.lang = 'en-US';

    if (this.warmMaleVoice) {
      utterance.voice = this.warmMaleVoice;
    }

    let isFinished = false;
    const cleanup = () => {
      if (isFinished) return;
      isFinished = true;
      this.isSpeakingState = false;
      if (this.watchdogTimer) {
        clearTimeout(this.watchdogTimer);
        this.watchdogTimer = null;
      }
    };

    utterance.onstart = () => {
      options.onStart?.();

      // Browser TTS watchdog: guarantee completion within 12 seconds max
      const estimatedSec = Math.max(2.5, spokenText.split(' ').length * 0.45);
      this.watchdogTimer = setTimeout(() => {
        if (!isFinished) {
          cleanup();
          try {
            window.speechSynthesis.cancel();
          } catch {}
          options.onEnd?.();
        }
      }, Math.ceil(estimatedSec * 1000) + 1200);
    };

    utterance.onend = () => {
      cleanup();
      options.onEnd?.();
    };

    utterance.onerror = (e) => {
      cleanup();
      if (e.error !== 'canceled' && e.error !== 'interrupted') {
        options.onError?.(e);
      }
      options.onEnd?.();
    };

    try {
      window.speechSynthesis.speak(utterance);
    } catch {
      cleanup();
      options.onEnd?.();
    }
  }
}
