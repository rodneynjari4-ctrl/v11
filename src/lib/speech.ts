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
  'monica', 'veena', 'priya', 'alice', 'sara', 'sarah', 'kendra', 'joanna', 'kathy',
  'amber', 'ana', 'ashley', 'cora', 'elizabeth', 'heather', 'jane', 'jessica', 'julie',
  'kate', 'laura', 'linda', 'maria', 'michelle', 'nicole', 'rachel', 'rebecca', 'sofia',
  'zoe', 'zuzana', 'lucy', 'sonia', 'natasha', 'katja', 'evelyn', 'dora', 'chiara'
];

// Preferred warm, high-fidelity natural/neural male voice rank order across platforms
const WARM_MALE_VOICE_PRIORITY = [
  // Edge / Windows Neural Online Voices (Remarkably human & fluid)
  'microsoft guy online (natural)',
  'microsoft christopher online (natural)',
  'microsoft ryan online (natural)',
  'microsoft andrew online (natural)',
  'microsoft brian online (natural)',
  'microsoft steffan online (natural)',
  // Apple macOS & iOS Enhanced Neural Voices
  'daniel (enhanced)',
  'oliver (enhanced)',
  'evan (enhanced)',
  'nathan (enhanced)',
  'jamie (enhanced)',
  'tom (enhanced)',
  // Chrome / Android High-Quality Voices
  'google us english',
  'google uk english male',
  'google english (united states)',
  // High quality standard platform male voices
  'daniel', // macOS/iOS warm UK male
  'alex',   // macOS warm natural male
  'oliver',
  'arthur',
  'microsoft david',
  'microsoft mark',
  'microsoft george',
  'fred',
  'aaron',
  'nathan'
];

/**
 * Normalizes text specifically for speech synthesis engines so that
 * acronyms, business terms, tax compliance names, and currency sound completely
 * naturalistic and are pronounced with proper human diction.
 */
export function normalizeTextForNaturalSpeech(rawText: string): string {
  if (!rawText) return '';

  let text = rawText;

  // 1. Remove markdown formatting, asterisks, hashes, backticks, brackets
  text = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1'); // markdown links -> title text
  text = text.replace(/[*_#`~>]/g, ' '); // markdown emphasis & headers
  text = text.replace(/\{[^}]+\}/g, ' '); // json or code braces
  text = text.replace(/https?:\/\/\S+/gi, 'our website'); // replace raw urls with natural phrase

  // 2. Normalize list markers and bullet points to smooth conversational flow
  text = text.replace(/^\s*[-•*]\s+/gm, ' ');
  text = text.replace(/^\s*\d+\.\s+/gm, ' '); // remove "1. ", "2. " which make TTS say "one dot"

  // 3. Normalize common symbols to spoken natural words
  text = text.replace(/&/g, ' and ');
  text = text.replace(/%/g, ' percent ');
  text = text.replace(/@/g, ' at ');
  text = text.replace(/\+/g, ' plus ');
  text = text.replace(/\$/g, ' dollars ');
  text = text.replace(/\b(KES|Ksh|KSh)\b/g, 'Kenyan Shillings');

  // 4. Handle slashes in compound domain phrases (e.g. "HR/Payroll" -> "H-R and Payroll")
  text = text.replace(/([a-zA-Z]+)\s*\/\s*([a-zA-Z]+)/g, '$1 and $2');

  // 5. Kenyan & East African Enterprise Domain Terms (CRITICAL FOR PROPER PRONUNCIATION)
  // eTIMS -> pronounced "ee-Tims" (otherwise synthesizers say "eh-tims" or spell "e-t-i-m-s")
  text = text.replace(/\b(eTIMS|e-TIMS|ETIMS|etims)\b/g, 'ee-Tims');

  // M-PESA / M-Pesa -> pronounced "Em-Pesa" (otherwise synthesizers say "M minus P E S A" or stumble)
  text = text.replace(/\b(M-PESA|M-Pesa|mpesa|Mpesa|M-pesa)\b/g, 'Em-Pesa');

  // ERP -> pronounced "E-R-P" (otherwise synthesizers pronounce it as "urp" like burp!)
  text = text.replace(/\bERP\b/g, 'E-R-P');
  text = text.replace(/\bERPs\b/g, 'E-R-Ps');

  // KRA -> "K-R-A"
  text = text.replace(/\bKRA\b/g, 'K-R-A');

  // PAYE -> "P-A-Y-E" (otherwise synthesizers say "pay")
  text = text.replace(/\bPAYE\b/g, 'P-A-Y-E');

  // NSSF -> "N-S-S-F"
  text = text.replace(/\bNSSF\b/g, 'N-S-S-F');

  // NHIF -> "N-H-I-F"
  text = text.replace(/\bNHIF\b/g, 'N-H-I-F');

  // SHIF -> "Shif"
  text = text.replace(/\bSHIF\b/g, 'Shif');

  // STK Push -> "S-T-K Push"
  text = text.replace(/\bSTK\b/g, 'S-T-K');

  // PayBill -> "Pay Bill"
  text = text.replace(/\b(PayBill|Paybill)\b/g, 'Pay Bill');

  // P&L -> "Profit and Loss"
  text = text.replace(/\b(P\s*and\s*L|P&L|P\/L)\b/gi, 'Profit and Loss');

  // VisionONE -> "Vision One" (split compound name so TTS inflection is smooth and natural)
  text = text.replace(/VisionONE/g, 'Vision One');

  // 6. Common Tech, Accounting & Business Acronyms
  text = text.replace(/\bHR\b/g, 'H-R');
  text = text.replace(/\bAI\b/g, 'A-I');
  text = text.replace(/\bUI\b/g, 'U-I');
  text = text.replace(/\bUX\b/g, 'U-X');
  text = text.replace(/\bAPIs\b/g, 'A-P-Is');
  text = text.replace(/\bAPI\b/g, 'A-P-I');
  text = text.replace(/\bROI\b/g, 'R-O-I');
  text = text.replace(/\bKPIs\b/g, 'K-P-Is');
  text = text.replace(/\bKPI\b/g, 'K-P-I');
  text = text.replace(/\bCEO\b/g, 'C-E-O');
  text = text.replace(/\bCFO\b/g, 'C-F-O');
  text = text.replace(/\bCOO\b/g, 'C-O-O');
  text = text.replace(/\bCTO\b/g, 'C-T-O');
  text = text.replace(/\bVAT\b/g, 'V-A-T');
  text = text.replace(/\bSaaS\b/g, 'Sass');
  text = text.replace(/\bBOM\b/g, 'Bill of Materials');
  text = text.replace(/\bPOs\b/g, 'purchase orders');
  text = text.replace(/\bPO\b/g, 'purchase order');
  text = text.replace(/\be\.g\.,?\b/gi, 'for example,');
  text = text.replace(/\bi\.e\.,?\b/gi, 'that is,');
  text = text.replace(/\betc\.\b/gi, 'and so on.');
  text = text.replace(/\b(vs\.|vs)\b/gi, 'versus');
  text = text.replace(/\bw\/\b/gi, 'with');
  text = text.replace(/\bw\/o\b/gi, 'without');

  // 7. Punctuation & Cadence Tuning for Natural Breathing & Inflection:
  // Convert colons, semicolons, and dashes to commas so the voice pauses naturally
  text = text.replace(/[:;]/g, ',');
  text = text.replace(/\s*—\s*|\s*--\s*/g, ', ');
  text = text.replace(/\s*-\s+/g, ', ');

  // Clean parentheses: "(something)" -> ", something,"
  text = text.replace(/\(([^)]+)\)/g, ', $1,');

  // Clean multiple commas and extra spaces
  text = text.replace(/,+/g, ',');
  text = text.replace(/\s+,/g, ',');
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}

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
   * Deterministically locks a natural, warm baritone male voice with preference
   * for modern high-definition Neural and Natural browser speech models.
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

      // 1. Strict filter against female voices
      if (FEMALE_VOICE_PATTERNS.some((fem) => lowerName.includes(fem))) {
        score -= 10000;
      }

      // 2. Huge bonus for modern Neural / Natural / Enhanced voices
      if (
        lowerName.includes('online (natural)') ||
        lowerName.includes('natural') ||
        lowerName.includes('neural') ||
        lowerName.includes('enhanced') ||
        lowerName.includes('premium')
      ) {
        score += 3500;
      }

      // 3. Priority list bonus
      for (let i = 0; i < WARM_MALE_VOICE_PRIORITY.length; i++) {
        if (lowerName.includes(WARM_MALE_VOICE_PRIORITY[i])) {
          score += 2500 - i * 40;
          break;
        }
      }

      // 4. Male indicator bonus
      if (lowerName.includes('male') && !lowerName.includes('female')) {
        score += 400;
      }

      // 5. English accent preference
      if (voice.lang === 'en-US' || voice.lang === 'en-GB') {
        score += 100;
      } else if (voice.lang.startsWith('en')) {
        score += 50;
      }

      if (score > bestScore) {
        bestScore = score;
        bestVoice = voice;
      }
    }

    return bestVoice || pool[0] || null;
  }

  public getWarmVoice(): SpeechSynthesisVoice | null {
    return this.warmMaleVoice;
  }

  public getActiveVoiceName(): string {
    return this.warmMaleVoice ? this.warmMaleVoice.name : 'System Default Male';
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

    // Run comprehensive phonetic and natural speech pre-processing
    const spokenText = normalizeTextForNaturalSpeech(text);

    if (!spokenText) {
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
      const utterance = new SpeechSynthesisUtterance(spokenText);
      // Native pitch (1.0) preserves acoustic warmth and prevents digital distortion
      utterance.pitch = options.pitch !== undefined ? Math.min(1.05, Math.max(0.96, options.pitch)) : 1.0;
      // 0.98 rate gives deliberate, highly articulate enterprise diction
      utterance.rate = options.rate !== undefined ? Math.min(1.1, Math.max(0.9, options.rate)) : 0.98;
      utterance.volume = 1.0;
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
        // Prevents Chrome 15s pause bug during speech
        this.chromeKeepAliveInterval = setInterval(() => {
          if (window.speechSynthesis?.speaking && window.speechSynthesis?.paused) {
            window.speechSynthesis.resume();
          }
        }, 2000);
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
