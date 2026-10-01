export interface AccessibilitySettings {
  theme: 'light' | 'dark' | 'warm_sepia' | 'high_contrast_dark' | 'high_contrast_light';
  fontSizeScale: 'normal' | 'large' | 'extra_large';
  highContrast: boolean;
  dyslexiaFont: boolean;
  reducedMotion: boolean;
  ttsVoiceRate: number; // 0.8, 1.0, 1.2
  lineSpacing: 'normal' | 'spacious';
}

const STORAGE_KEY = 'kalguru_accessibility_settings_v1';

export const DEFAULT_ACCESSIBILITY_SETTINGS: AccessibilitySettings = {
  theme: 'light',
  fontSizeScale: 'normal',
  highContrast: false,
  dyslexiaFont: false,
  reducedMotion: false,
  ttsVoiceRate: 1.0,
  lineSpacing: 'normal'
};

export const loadAccessibilitySettings = (): AccessibilitySettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_ACCESSIBILITY_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.error('Failed to load accessibility settings:', e);
  }
  return { ...DEFAULT_ACCESSIBILITY_SETTINGS };
};

export const applyAccessibilityToDOM = (settings: AccessibilitySettings): void => {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const body = document.body;

  // 1. Font Size Scaling (Affects rem scaling)
  if (settings.fontSizeScale === 'large') {
    root.style.fontSize = '18px';
  } else if (settings.fontSizeScale === 'extra_large') {
    root.style.fontSize = '20px';
  } else {
    root.style.fontSize = '16px';
  }

  // 2. Line Spacing
  if (settings.lineSpacing === 'spacious') {
    root.classList.add('line-spacing-spacious');
    body.classList.add('line-spacing-spacious');
  } else {
    root.classList.remove('line-spacing-spacious');
    body.classList.remove('line-spacing-spacious');
  }

  // 3. Theme application
  root.classList.remove('dark', 'theme-sepia', 'high-contrast', 'high-contrast-dark', 'high-contrast-light');
  body.classList.remove('dark', 'theme-sepia', 'high-contrast', 'high-contrast-dark', 'high-contrast-light');

  if (settings.theme === 'dark') {
    root.classList.add('dark');
    body.classList.add('dark');
  } else if (settings.theme === 'warm_sepia') {
    root.classList.add('theme-sepia');
    body.classList.add('theme-sepia');
  } else if (settings.theme === 'high_contrast_dark') {
    root.classList.add('dark', 'high-contrast', 'high-contrast-dark');
    body.classList.add('dark', 'high-contrast', 'high-contrast-dark');
  } else if (settings.theme === 'high_contrast_light') {
    root.classList.add('high-contrast', 'high-contrast-light');
    body.classList.add('high-contrast', 'high-contrast-light');
  }

  // 4. High Contrast general toggle
  if (settings.highContrast) {
    root.classList.add('high-contrast');
    body.classList.add('high-contrast');
  }

  // 5. Dyslexia / High Readability font
  if (settings.dyslexiaFont) {
    root.classList.add('font-dyslexia');
    body.classList.add('font-dyslexia');
  } else {
    root.classList.remove('font-dyslexia');
    body.classList.remove('font-dyslexia');
  }

  // 6. Reduced Motion
  if (settings.reducedMotion) {
    root.classList.add('reduce-motion');
    body.classList.add('reduce-motion');
  } else {
    root.classList.remove('reduce-motion');
    body.classList.remove('reduce-motion');
  }

  // Dispatch custom event for React components to re-render if needed
  window.dispatchEvent(new CustomEvent('kalguru_accessibility_changed', { detail: settings }));
};

export const saveAccessibilitySettings = (settings: AccessibilitySettings): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    applyAccessibilityToDOM(settings);
  } catch (e) {
    console.error('Failed to save accessibility settings:', e);
  }
};

/**
 * Helper to speak Thai or English text with configured TTS rate
 */
export const speakAccessibilityText = (text: string, customRate?: number): boolean => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return false;
  }

  try {
    window.speechSynthesis.cancel(); // Stop any pending speech
    const settings = loadAccessibilitySettings();
    const rate = customRate !== undefined ? customRate : settings.ttsVoiceRate || 1.0;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.lang = 'th-TH'; // Default to Thai

    // Try finding Thai voice
    const voices = window.speechSynthesis.getVoices();
    const thaiVoice = voices.find(v => v.lang.includes('th') || v.lang.includes('TH'));
    if (thaiVoice) {
      utterance.voice = thaiVoice;
    }

    window.speechSynthesis.speak(utterance);
    return true;
  } catch (e) {
    console.error('TTS speech synthesis error:', e);
    return false;
  }
};
