// Voice recognition, Speech Synthesis & Web Audio Feedback for Thai language AI Nutrition

export interface VoiceRecognitionOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onTranscriptChange?: (transcript: string, isFinal: boolean) => void;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

export class ThaiVoiceRecognizer {
  private recognition: any = null;
  private isListening: boolean = false;
  private options: VoiceRecognitionOptions;

  constructor(options: VoiceRecognitionOptions = {}) {
    this.options = {
      lang: 'th-TH',
      continuous: false,
      interimResults: true,
      ...options
    };
  }

  public isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  private createInstance(): any {
    if (!this.isSupported()) return null;

    try {
      const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const rec = new SpeechRecognitionClass();
      rec.lang = this.options.lang || 'th-TH';
      rec.continuous = this.options.continuous ?? false;
      rec.interimResults = this.options.interimResults ?? true;
      rec.maxAlternatives = 1;

      rec.onstart = () => {
        this.isListening = true;
        this.options.onStart?.();
      };

      rec.onresult = (event: any) => {
        let fullTranscript = '';
        let isFinal = false;

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          if (res && res[0]) {
            fullTranscript += res[0].transcript;
            if (res.isFinal) {
              isFinal = true;
            }
          }
        }

        if (fullTranscript.trim()) {
          this.options.onTranscriptChange?.(fullTranscript.trim(), isFinal);
        }
      };

      rec.onerror = (event: any) => {
        this.isListening = false;
        const errType = event?.error;
        console.warn('Speech recognition warning/error:', errType);
        
        let errorMessage = 'เกิดข้อผิดพลาดในการรับฟังเสียง';
        if (errType === 'not-allowed' || errType === 'permission-denied') {
          errorMessage = 'โปรดอนุญาตการเข้าถึงไมโครโฟนในเบราว์เซอร์เพื่อใช้งานระบบเสียง';
        } else if (errType === 'no-speech') {
          errorMessage = 'ไม่พบเสียงพูด กรุณาแตะไมค์แล้วลองพูดใหม่อีกครั้ง';
        } else if (errType === 'network') {
          errorMessage = 'เกิดปัญหาการเชื่อมต่อเครือข่ายสำหรับระบบแปลงเสียง';
        } else if (errType === 'aborted') {
          // aborted deliberately, ignore
          return;
        }
        this.options.onError?.(errorMessage);
      };

      rec.onend = () => {
        this.isListening = false;
        this.options.onEnd?.();
      };

      return rec;
    } catch (e) {
      console.error('Failed to initialize speech recognition:', e);
      return null;
    }
  }

  public start(): boolean {
    if (!this.isSupported()) return false;

    try {
      // Abort any existing instance cleanly
      if (this.recognition) {
        try {
          this.recognition.abort();
        } catch (e) {}
      }

      this.recognition = this.createInstance();
      if (!this.recognition) return false;

      this.recognition.start();
      return true;
    } catch (e: any) {
      console.warn('Failed to start speech recognition:', e);
      this.isListening = false;
      return false;
    }
  }

  public stop(): void {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }
    this.isListening = false;
  }

  public abort(): void {
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch (e) {}
    }
    this.isListening = false;
  }
}

/**
 * Text to speech (TTS) helper for Thai language
 */
export const speakThai = (text: string, onEnd?: () => void): boolean => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return false;
  }

  try {
    window.speechSynthesis.cancel(); // cancel previous speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'th-TH';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Pick a Thai voice if available
    const voices = window.speechSynthesis.getVoices();
    const thaiVoice = voices.find(v => v.lang.includes('th') || v.lang.includes('TH'));
    if (thaiVoice) {
      utterance.voice = thaiVoice;
    }

    if (onEnd) {
      utterance.onend = onEnd;
      utterance.onerror = () => onEnd();
    }

    window.speechSynthesis.speak(utterance);
    return true;
  } catch (e) {
    console.warn('Speech synthesis error:', e);
    return false;
  }
};

export const stopSpeaking = () => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};

/**
 * Synthesize cheerful chime sound using Web Audio API (Zero external assets, works offline)
 */
export const playSuccessChime = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    // Note 1 (E5 - 659.25Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, ctx.currentTime);
    gain1.gain.setValueAtTime(0.12, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.25);

    // Note 2 (A5 - 880Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.08);
    gain2.gain.setValueAtTime(0.14, ctx.currentTime + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.08);
    osc2.stop(ctx.currentTime + 0.45);
  } catch (e) {}
};

/**
 * Synthesize water drop sound using Web Audio API
 */
export const playWaterDropSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.08);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch (e) {}
};

/**
 * Haptic Vibration feedback (for mobile/tablet)
 */
export const triggerHaptic = (pattern: number | number[] = 30) => {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch (e) {}
};
