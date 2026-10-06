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

// Robotic synth voice identifiers to heavily penalize
const ROBOTIC_VOICE_PATTERNS = [
  'espeak', 'kal', 'synth', 'robot', 'bad', 'whisper', 'croak', 'desktop'
];

// Preferred warm, natural male browser voices
const WARM_MALE_VOICE_PRIORITY = [
  'microsoft christopher online (natural)',
  'microsoft guy online (natural)',
  'microsoft ryan online (natural)',
  'microsoft brian online (natural)',
  'microsoft andrew online (natural)',
  'daniel (enhanced)',
  'oliver (enhanced)',
  'evan (enhanced)',
  'google us english',
  'google uk english male',
  'daniel',
  'alex',
  'microsoft david'
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
  text = text.replace(/\bVisionOne\b/g, 'Vision One');
  text = text.replace(/\bAI\b/g, 'A-I');
  text = text.replace(/\bPayBill\b/g, 'Pay Bill');
  text = text.replace(/\bSTK Push\b/g, 'S-T-K Push');
  text = text.replace(/\bSTK\b/g, 'S-T-K');
  text = text.replace(/\bVAT\b/g, 'V-A-T');
  text = text.replace(/\bP&L\b/g, 'P and L');
  text = text.replace(/\bAPI\b/g, 'A-P-I');
  text = text.replace(/\betc\./gi, 'and so on');
  text = text.replace(/\be\.g\./gi, 'for example');
  text = text.replace(/\bi\.e\./gi, 'that is');

  return text.replace(/\s+/g, ' ').trim();
}

export function isMobileDevice(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 1 && /Macintosh/i.test(navigator.userAgent));
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = (reader.result as string) || '';
      const base64 = dataUrl.split(',')[1] || '';
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * SpeechRecognitionManager
 * Universal Dual-Engine Voice Input System:
 * - Engine A: MediaRecorder + Web Audio VAD + Server-Side Gemini Transcribe (100% universal across all iOS Safari, Android Chrome, and Iframes)
 * - Engine B: Web Speech API (webkitSpeechRecognition) for instant real-time live preview where supported
 */
export class SpeechRecognitionManager {
  private recognition: any = null;
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private dummyGain: GainNode | null = null;
  private dataArray: Uint8Array | null = null;
  private vadInterval: ReturnType<typeof setInterval> | null = null;

  private isListening = false;
  private shouldBeListening = false;
  private isSpeakingOrThinking = false;
  private lastTranscript = '';
  private isSubmitted = false;
  private speechDetected = false;
  private silenceTimer: ReturnType<typeof setTimeout> | null = null;
  private watchdogTimer: ReturnType<typeof setInterval> | null = null;

  private onResultCallback: ((text: string, isFinal: boolean) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;
  private onStartCallback: (() => void) | null = null;
  private onEndCallback: (() => void) | null = null;

  private hasRequestedMicPermission = false;
  private recordedMimeType = 'audio/webm';
  private maxUtteranceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.detectSupportedMime();
    this.startWatchdog();
  }

  private detectSupportedMime(): string {
    if (typeof MediaRecorder === 'undefined') {
      this.recordedMimeType = 'audio/webm';
      return this.recordedMimeType;
    }
    const candidates = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/aac',
      'audio/ogg'
    ];
    for (const c of candidates) {
      if (MediaRecorder.isTypeSupported(c)) {
        this.recordedMimeType = c;
        return c;
      }
    }
    this.recordedMimeType = '';
    return '';
  }

  private startWatchdog() {
    if (this.watchdogTimer) {
      clearInterval(this.watchdogTimer);
    }
    // Check every 2 seconds: if hands-free listening is desired but inactive, revive immediately
    this.watchdogTimer = setInterval(() => {
      if (this.shouldBeListening && !this.isSpeakingOrThinking && !this.isListening) {
        this.safeStartAllEngines();
      }
    }, 2000);
  }

  public async primePermission(): Promise<boolean> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return false;
    }

    try {
      // Resume existing or create audio context within user gesture
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        if (!this.audioContext || this.audioContext.state === 'closed') {
          this.audioContext = new AudioCtx();
        }
        if (this.audioContext.state === 'suspended') {
          await this.audioContext.resume().catch(() => {});
        }
      }

      if (this.mediaStream && this.mediaStream.active && this.mediaStream.getAudioTracks().length > 0) {
        this.hasRequestedMicPermission = true;
        this.setupAudioAnalyser(this.mediaStream);
        return true;
      }

      this.hasRequestedMicPermission = true;
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      this.mediaStream = stream;
      this.setupAudioAnalyser(stream);
      return true;
    } catch (err) {
      console.warn('Microphone permission priming notice:', err);
      return false;
    }
  }

  private setupAudioAnalyser(stream: MediaStream) {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.audioContext || this.audioContext.state === 'closed') {
        this.audioContext = new AudioCtx();
      }
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {});
      }

      // Disconnect existing nodes if re-initializing
      if (this.sourceNode) {
        try { this.sourceNode.disconnect(); } catch {}
      }
      if (this.dummyGain) {
        try { this.dummyGain.disconnect(); } catch {}
      }
      if (this.analyser) {
        try { this.analyser.disconnect(); } catch {}
      }

      this.sourceNode = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.3;
      this.sourceNode.connect(this.analyser);

      // WebKit keep-alive: route through silent gain to destination so iOS doesn't sleep the audio graph
      this.dummyGain = this.audioContext.createGain();
      this.dummyGain.gain.value = 0;
      this.analyser.connect(this.dummyGain);
      this.dummyGain.connect(this.audioContext.destination);

      this.dataArray = new Uint8Array(this.analyser.fftSize);
    } catch (e) {
      console.warn('Audio analyzer setup notice:', e);
    }
  }

  private async startMediaRecording(): Promise<boolean> {
    try {
      // Ensure active microphone stream exists
      if (!this.mediaStream || !this.mediaStream.active || this.mediaStream.getAudioTracks().length === 0) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
        });
        this.mediaStream = stream;
        this.setupAudioAnalyser(stream);
      } else {
        // Enable tracks if they were muted during agent speech
        this.mediaStream.getAudioTracks().forEach(t => { t.enabled = true; });
        this.setupAudioAnalyser(this.mediaStream);
      }

      this.audioChunks = [];
      this.speechDetected = false;

      const mimeType = this.detectSupportedMime();
      const options = mimeType ? { mimeType } : undefined;

      try {
        this.mediaRecorder = new MediaRecorder(this.mediaStream, options);
      } catch (mimeErr) {
        // Fallback to browser default MediaRecorder if specific MIME failed
        this.mediaRecorder = new MediaRecorder(this.mediaStream);
      }

      this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(100); // 100ms timeslices for prompt audio chunk collection

      // Safety timeout: auto-submit after 12 seconds of continuous talking so user is never stuck
      if (this.maxUtteranceTimer) {
        clearTimeout(this.maxUtteranceTimer);
      }
      this.maxUtteranceTimer = setTimeout(() => {
        if (this.isListening && !this.isSpeakingOrThinking && !this.isSubmitted) {
          this.submitNow();
        }
      }, 12000);

      // Voice Activity Detection (VAD) via real time-domain RMS
      if (this.vadInterval) {
        clearInterval(this.vadInterval);
      }

      this.vadInterval = setInterval(() => {
        if (!this.isListening || this.isSpeakingOrThinking) return;

        const amp = this.getMicAmplitude();

        // Speech threshold: amp > 0.025 indicates active human voice on phone or desktop
        if (amp > 0.025) {
          this.speechDetected = true;
          if (this.silenceTimer) {
            clearTimeout(this.silenceTimer);
            this.silenceTimer = null;
          }
        } else if (this.speechDetected && amp <= 0.018) {
          // User paused speaking: auto-submit after 1.1s of silence
          if (!this.silenceTimer) {
            this.silenceTimer = setTimeout(() => {
              if (this.speechDetected && !this.isSubmitted && !this.isSpeakingOrThinking) {
                this.submitNow();
              }
            }, 1100);
          }
        }
      }, 80);

      return true;
    } catch (err: any) {
      console.warn('MediaRecorder start notice:', err?.message);
      return false;
    }
  }

  private startWebSpeechRecognition() {
    if (typeof window === 'undefined') return;
    const win = window as unknown as IWindow;
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) return;

    try {
      if (this.recognition) {
        try { this.recognition.abort(); } catch {}
      }

      const rec = new SpeechRecognitionClass();
      const mobile = isMobileDevice();

      rec.continuous = !mobile;
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      rec.lang = (typeof navigator !== 'undefined' && navigator.language) || 'en-US';

      rec.onresult = (event: any) => {
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
          this.speechDetected = true;
          this.lastTranscript = currentText;
          this.onResultCallback?.(currentText, false);

          if (this.silenceTimer) {
            clearTimeout(this.silenceTimer);
            this.silenceTimer = null;
          }

          this.silenceTimer = setTimeout(() => {
            if (!this.isSubmitted && this.lastTranscript.trim() && !this.isSpeakingOrThinking) {
              this.submitNow();
            }
          }, 1100);
        }
      };

      rec.onerror = (_e: any) => {
        // Handled silently by MediaRecorder engine fallback
      };

      rec.onend = () => {
        if (this.lastTranscript.trim() && !this.isSubmitted && !this.isSpeakingOrThinking) {
          this.submitNow();
        }
      };

      this.recognition = rec;
      rec.start();
    } catch {
      // Ignored: MediaRecorder handles recording reliably
    }
  }

  private async safeStartAllEngines() {
    if (!this.shouldBeListening || this.isSpeakingOrThinking) return;

    this.isListening = true;
    this.isSubmitted = false;
    this.speechDetected = false;
    this.onStartCallback?.();

    await this.startMediaRecording();
    this.startWebSpeechRecognition();
  }

  public getMicAmplitude(): number {
    if (!this.analyser || !this.dataArray || !this.isListening || this.isSpeakingOrThinking) {
      return 0;
    }
    try {
      // Use time-domain waveform data to calculate true RMS audio amplitude
      this.analyser.getByteTimeDomainData(this.dataArray);
      let sumSquares = 0;
      for (let i = 0; i < this.dataArray.length; i++) {
        const normalized = (this.dataArray[i] - 128) / 128;
        sumSquares += normalized * normalized;
      }
      const rms = Math.sqrt(sumSquares / this.dataArray.length);
      // Scale RMS (typically 0.01 - 0.25) to a clean 0.0 - 1.0 range
      return Math.min(1, Math.max(0, rms * 4.5));
    } catch {
      return 0;
    }
  }

  public async submitNow(): Promise<boolean> {
    if (this.isSubmitted || this.isSpeakingOrThinking) return false;
    this.isSubmitted = true;

    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    if (this.maxUtteranceTimer) {
      clearTimeout(this.maxUtteranceTimer);
      this.maxUtteranceTimer = null;
    }

    const liveText = this.lastTranscript.trim();

    // 1. If Web Speech API already captured the text (e.g. on Desktop Chrome), use it immediately!
    if (liveText) {
      this.lastTranscript = '';
      this.pauseListeningForAgentTurn();
      this.onResultCallback?.(liveText, true);
      return true;
    }

    // 2. Otherwise (e.g. on iOS Safari / mobile browsers), flush & stop MediaRecorder and transcribe with Gemini!
    try {
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        const recorder = this.mediaRecorder;
        await new Promise<void>((resolve) => {
          recorder.onstop = () => resolve();
          try {
            if (recorder.state === 'recording') {
              recorder.requestData();
            }
            recorder.stop();
          } catch {
            resolve();
          }
        });
      }

      // Now that audio is fully flushed into this.audioChunks, transition listening state
      this.pauseListeningForAgentTurn();

      if (this.audioChunks.length === 0) {
        this.resumeListeningAfterAgentTurn();
        return false;
      }

      const effectiveMime = this.recordedMimeType || this.mediaRecorder?.mimeType || 'audio/mp4';
      const audioBlob = new Blob(this.audioChunks, { type: effectiveMime });
      this.audioChunks = [];

      // Accept any recorded speech chunk (> 150 bytes)
      if (audioBlob.size < 150) {
        this.resumeListeningAfterAgentTurn();
        return false;
      }

      const base64Audio = await blobToBase64(audioBlob);

      const res = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audio: base64Audio,
          mimeType: effectiveMime,
        }),
      });

      if (!res.ok) {
        throw new Error('Transcribe failed');
      }

      const data = await res.json();
      const transcribedText = (data.text || '').trim();

      if (transcribedText) {
        this.onResultCallback?.(transcribedText, true);
        return true;
      } else {
        // Empty transcription (e.g. background hiss), smoothly resume listening
        this.resumeListeningAfterAgentTurn();
        return false;
      }
    } catch (err: any) {
      console.warn('Audio transcribe fallback notice:', err?.message);
      this.resumeListeningAfterAgentTurn();
      return false;
    }
  }

  public pauseListeningForAgentTurn() {
    this.isSpeakingOrThinking = true;
    this.isListening = false;

    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    if (this.maxUtteranceTimer) {
      clearTimeout(this.maxUtteranceTimer);
      this.maxUtteranceTimer = null;
    }
    if (this.vadInterval) {
      clearInterval(this.vadInterval);
      this.vadInterval = null;
    }

    try {
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }
    } catch {}

    // Disable audio tracks temporarily so microphone doesn't pick up speaker sound
    if (this.mediaStream) {
      this.mediaStream.getAudioTracks().forEach(t => { t.enabled = false; });
    }

    try {
      this.recognition?.abort();
    } catch {}
  }

  public resumeListeningAfterAgentTurn() {
    this.isSpeakingOrThinking = false;
    this.shouldBeListening = true;
    this.isSubmitted = false;
    this.lastTranscript = '';
    this.speechDetected = false;
    this.safeStartAllEngines();
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
    this.speechDetected = false;

    this.onResultCallback = onResult;
    this.onErrorCallback = onError;
    this.onStartCallback = onStart;
    this.onEndCallback = onEnd;

    this.safeStartAllEngines();
  }

  public stop() {
    this.shouldBeListening = false;
    this.isListening = false;
    this.isSpeakingOrThinking = false;

    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    if (this.vadInterval) {
      clearInterval(this.vadInterval);
      this.vadInterval = null;
    }
    if (this.watchdogTimer) {
      clearInterval(this.watchdogTimer);
      this.watchdogTimer = null;
    }

    try {
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }
    } catch {}

    try {
      this.recognition?.abort();
    } catch {}

    if (this.mediaStream) {
      try {
        this.mediaStream.getTracks().forEach((track) => track.stop());
      } catch {}
      this.mediaStream = null;
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
  private preloadedWelcomeAudio: HTMLAudioElement | null = null;

  constructor() {
    this.initBrowserVoices();
    this.initPreloadedAudio();
  }

  private initPreloadedAudio() {
    if (typeof window !== 'undefined') {
      try {
        const audio = new Audio('/audio/welcome.wav');
        audio.preload = 'auto';
        this.preloadedWelcomeAudio = audio;
      } catch (err) {
        console.warn('Could not pre-instantiate welcome audio:', err);
      }
    }
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

      // Strictly penalize female voices for this persona
      if (FEMALE_VOICE_PATTERNS.some((fem) => lowerName.includes(fem))) {
        score -= 10000;
      }

      // Penalize robotic synth voices
      if (ROBOTIC_VOICE_PATTERNS.some((rob) => lowerName.includes(rob))) {
        score -= 5000;
      }

      // Heavily prioritize natural neural online voices
      if (
        lowerName.includes('online (natural)') ||
        lowerName.includes('natural') ||
        lowerName.includes('neural') ||
        lowerName.includes('enhanced')
      ) {
        score += 4500;
      }

      // Match against prioritized natural male list
      for (let i = 0; i < WARM_MALE_VOICE_PRIORITY.length; i++) {
        if (lowerName.includes(WARM_MALE_VOICE_PRIORITY[i])) {
          score += 3000 - i * 50;
          break;
        }
      }

      if (lowerName.includes('male') && !lowerName.includes('female')) {
        score += 500;
      }

      if (voice.lang === 'en-US' || voice.lang === 'en-GB') {
        score += 150;
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
        const audio = this.currentAudio;
        audio.onplay = null;
        audio.onended = null;
        audio.onerror = null;
        audio.pause();
        audio.currentTime = 0;
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
   * Plays the intro welcome greeting with zero-latency audio or browser fallback.
   */
  public playWelcomeImmediately(options: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: any) => void;
    onAutoplayBlocked?: () => void;
  } = {}): void {
    this.stop();
    this.voiceMode = 'neural';
    this.isSpeakingState = true;

    const welcomeText = "Hello! I am your Vision One AI assistant. How can I help you today with your ERP, finance, payroll, or business operations?";
    const audio = new Audio('/audio/welcome.wav');
    this.currentAudio = audio;
    audio.currentTime = 0;
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
      this.watchdogTimer = setTimeout(() => {
        if (!isFinished) {
          cleanup();
          options.onEnd?.();
        }
      }, 14000);
    };

    audio.onended = () => {
      cleanup();
      options.onEnd?.();
    };

    audio.onerror = () => {
      if (isFinished) return;
      cleanup();
      this.playBrowserSpeech(welcomeText, options);
    };

    try {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          if (isFinished) return;
          console.warn('Welcome audio instant play notice:', err);
          cleanup();
          this.playBrowserSpeech(welcomeText, options);
        });
      }
    } catch (err) {
      if (!isFinished) {
        cleanup();
        this.playBrowserSpeech(welcomeText, options);
      }
    }
  }

  /**
   * Speaks text using ultra-realistic Gemini Neural Audio if available,
   * with automatic fallback to high-quality browser speech synthesis.
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

    // 2. Fallback to enhanced natural browser SpeechSynthesis directly (zero lag)
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

      audio.onerror = () => {
        if (isFinished) return;
        cleanup();
        this.playBrowserSpeech(spokenText, options);
        resolve();
      };

      audio.play().catch((playErr: any) => {
        if (isFinished) return;
        console.warn('Audio play notice, switching to browser speech:', playErr?.message);
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

    // Refresh voices if not found initially
    if (!this.warmMaleVoice) {
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        this.warmMaleVoice = this.selectWarmMaleVoice(voices);
      }
    }

    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.pitch = options.pitch !== undefined ? Math.min(1.04, Math.max(0.96, options.pitch)) : 1.0;
    utterance.rate = options.rate !== undefined ? Math.min(1.06, Math.max(0.98, options.rate)) : 1.02;
    utterance.volume = 1.0;
    utterance.lang = 'en-US';

    if (this.warmMaleVoice) {
      utterance.voice = this.warmMaleVoice;
    }

    let isFinished = false;
    let hasStarted = false;
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
      hasStarted = true;
      options.onStart?.();

      const estimatedSec = Math.max(2.5, spokenText.split(' ').length * 0.42);
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

    const doSpeak = () => {
      try {
        window.speechSynthesis.speak(utterance);
        window.speechSynthesis.resume();

        setTimeout(() => {
          if (!isFinished && !hasStarted && this.isSpeakingState) {
            options.onStart?.();
          }
        }, 250);
      } catch {
        cleanup();
        options.onEnd?.();
      }
    };

    // If already speaking, cancel with a tiny 30ms breather so Chromium does not cancel the new speak
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
      setTimeout(doSpeak, 30);
    } else {
      doSpeak();
    }
  }
}
