import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

/** Storage key for persisting preferences */
const STORAGE_KEY = 'edushield_a11y_prefs';

export const THEMES = {
  DEFAULT:       'default',
  HIGH_CONTRAST: 'high-contrast',
  DYSLEXIA:      'dyslexia',
};

export const FONT_SIZE_STEPS = [
  { label: 'Default',      scale: 1.00 },
  { label: 'Large',        scale: 1.125 },
  { label: 'Larger',       scale: 1.25 },
  { label: 'Extra Large',  scale: 1.375 },
  { label: 'Maximum',      scale: 1.50 },
];

export const LINE_SPACING_STEPS = [
  { label: 'Normal',  value: 1.75 },
  { label: 'Relaxed', value: 2.0  },
  { label: 'Loose',   value: 2.25 },
];

export const LETTER_SPACING_STEPS = [
  { label: 'Default',  value: '0em'   },
  { label: 'Wide',     value: '0.05em' },
  { label: 'Wider',    value: '0.12em' },
  { label: 'Widest',   value: '0.20em' },
];

/** Default speech rate for TTS (1.0 = normal, 0.5 = slow, 2.0 = fast) */
const DEFAULT_SPEECH_RATE  = 1.0;
const DEFAULT_SPEECH_PITCH = 1.0;

/** Default accessibility state (source of truth for first-load) */
const DEFAULT_STATE = {
  
  theme:          THEMES.DEFAULT,
  fontSizeStep:   0,                
  lineSpacingStep: 0,               
  letterSpacingStep: 0,             
  useDyslexicFont: false,           

  reduceMotion: false,              

  ttsEnabled:   false,
  speechRate:   DEFAULT_SPEECH_RATE,
  speechPitch:  DEFAULT_SPEECH_PITCH,
  speechVoiceURI: null,            
};

const AccessibilityContext = createContext(null);

function loadPrefs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STATE;
  }
}

function syncDOMAttributes(prefs) {
  const html = document.documentElement;

  html.setAttribute('data-theme', prefs.theme);

  const scale = FONT_SIZE_STEPS[prefs.fontSizeStep]?.scale ?? 1;
  html.style.setProperty('--a11y-font-scale', String(scale));

  const lh = LINE_SPACING_STEPS[prefs.lineSpacingStep]?.value ?? 1.75;
  html.style.setProperty('--a11y-line-height', String(lh));

  const ls = LETTER_SPACING_STEPS[prefs.letterSpacingStep]?.value ?? '0em';
  html.style.setProperty('--a11y-letter-spacing', ls);

  html.classList.toggle('font-dyslexic', prefs.useDyslexicFont);

  html.classList.toggle('reduce-motion', prefs.reduceMotion);
}

export function AccessibilityProvider({ children }) {
  
  const [prefs, setPrefs] = useState(loadPrefs);

  const [voices, setVoices] = useState([]);

  const utteranceRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      
    }
    syncDOMAttributes(prefs);
  }, [prefs]);

  useEffect(() => {
    if (!('speechSynthesis' in window)) return;

    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices();
      if (available.length > 0) setVoices(available);
    };

    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e) => {
      
      setPrefs((prev) => {
        if (prev.reduceMotion !== e.matches) {

          return prev._reduceMotionManual ? prev : { ...prev, reduceMotion: e.matches };
        }
        return prev;
      });
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const updatePref = useCallback((key, value) => {
    setPrefs((prev) => ({ ...prev, [key]: value }));
  }, []);

  const setTheme = useCallback((theme) => {
    if (!Object.values(THEMES).includes(theme)) {
      console.warn(`[useAccessibility] Unknown theme: "${theme}"`);
      return;
    }
    updatePref('theme', theme);
  }, [updatePref]);

  const increaseFontSize = useCallback(() => {
    setPrefs((prev) => ({
      ...prev,
      fontSizeStep: Math.min(prev.fontSizeStep + 1, FONT_SIZE_STEPS.length - 1),
    }));
  }, []);

  const decreaseFontSize = useCallback(() => {
    setPrefs((prev) => ({
      ...prev,
      fontSizeStep: Math.max(prev.fontSizeStep - 1, 0),
    }));
  }, []);

  const resetFontSize = useCallback(() => updatePref('fontSizeStep', 0), [updatePref]);

  const setLineSpacing = useCallback((step) => {
    const clamped = Math.max(0, Math.min(step, LINE_SPACING_STEPS.length - 1));
    updatePref('lineSpacingStep', clamped);
  }, [updatePref]);

  const cycleLineSpacing = useCallback(() => {
    setPrefs((prev) => ({
      ...prev,
      lineSpacingStep: (prev.lineSpacingStep + 1) % LINE_SPACING_STEPS.length,
    }));
  }, []);

  const setLetterSpacing = useCallback((step) => {
    const clamped = Math.max(0, Math.min(step, LETTER_SPACING_STEPS.length - 1));
    updatePref('letterSpacingStep', clamped);
  }, [updatePref]);

  const cycleLetterSpacing = useCallback(() => {
    setPrefs((prev) => ({
      ...prev,
      letterSpacingStep: (prev.letterSpacingStep + 1) % LETTER_SPACING_STEPS.length,
    }));
  }, []);

  const toggleDyslexicFont = useCallback(() => {
    setPrefs((prev) => ({ ...prev, useDyslexicFont: !prev.useDyslexicFont }));
  }, []);

  const toggleReduceMotion = useCallback(() => {
    setPrefs((prev) => ({
      ...prev,
      reduceMotion: !prev.reduceMotion,
      _reduceMotionManual: true,  
    }));
  }, []);

  const toggleTTS = useCallback(() => {
    setPrefs((prev) => {
      if (prev.ttsEnabled && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      return { ...prev, ttsEnabled: !prev.ttsEnabled };
    });
  }, []);

  const setSpeechRate = useCallback((rate) => {
    
    const clamped = Math.max(0.5, Math.min(2.0, rate));
    updatePref('speechRate', clamped);
  }, [updatePref]);

  const setSpeechPitch = useCallback((pitch) => {
    const clamped = Math.max(0.5, Math.min(2.0, pitch));
    updatePref('speechPitch', clamped);
  }, [updatePref]);

  const setSpeechVoice = useCallback((voiceURI) => {
    updatePref('speechVoiceURI', voiceURI);
  }, [updatePref]);

  const speak = useCallback((text, options = {}) => {
    if (!('speechSynthesis' in window)) {
      console.warn('[useAccessibility] Web Speech API not supported.');
      return;
    }
    if (!prefs.ttsEnabled && !options.force) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate  = options.rate  ?? prefs.speechRate;
    utterance.pitch = options.pitch ?? prefs.speechPitch;

    const voiceURI = options.voiceURI ?? prefs.speechVoiceURI;
    if (voiceURI) {
      const voice = voices.find((v) => v.voiceURI === voiceURI);
      if (voice) utterance.voice = voice;
    }

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [prefs.ttsEnabled, prefs.speechRate, prefs.speechPitch, prefs.speechVoiceURI, voices]);

  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const isSpeaking = typeof window !== 'undefined' && 'speechSynthesis' in window
    ? window.speechSynthesis.speaking
    : false;

  const resetAll = useCallback(() => {
    stopSpeaking();
    setPrefs(DEFAULT_STATE);
  }, [stopSpeaking]);

  const currentFontStep   = FONT_SIZE_STEPS[prefs.fontSizeStep];
  const currentLineSpacing = LINE_SPACING_STEPS[prefs.lineSpacingStep];
  const currentLetterSpacing = LETTER_SPACING_STEPS[prefs.letterSpacingStep];
  const canIncreaseFontSize = prefs.fontSizeStep < FONT_SIZE_STEPS.length - 1;
  const canDecreaseFontSize = prefs.fontSizeStep > 0;

  const value = useMemo(() => ({
    
    theme:              prefs.theme,
    fontSizeStep:       prefs.fontSizeStep,
    lineSpacingStep:    prefs.lineSpacingStep,
    letterSpacingStep:  prefs.letterSpacingStep,
    useDyslexicFont:    prefs.useDyslexicFont,
    reduceMotion:       prefs.reduceMotion,
    ttsEnabled:         prefs.ttsEnabled,
    speechRate:         prefs.speechRate,
    speechPitch:        prefs.speechPitch,
    speechVoiceURI:     prefs.speechVoiceURI,

    currentFontStep,
    currentLineSpacing,
    currentLetterSpacing,
    canIncreaseFontSize,
    canDecreaseFontSize,
    availableVoices:    voices,
    isSpeaking,

    setTheme,

    increaseFontSize,
    decreaseFontSize,
    resetFontSize,

    setLineSpacing,
    cycleLineSpacing,

    setLetterSpacing,
    cycleLetterSpacing,

    toggleDyslexicFont,

    toggleReduceMotion,

    toggleTTS,
    setSpeechRate,
    setSpeechPitch,
    setSpeechVoice,
    speak,
    stopSpeaking,

    resetAll,

    THEMES,
    FONT_SIZE_STEPS,
    LINE_SPACING_STEPS,
    LETTER_SPACING_STEPS,
  }), [
    prefs,
    voices,
    isSpeaking,
    currentFontStep,
    currentLineSpacing,
    currentLetterSpacing,
    canIncreaseFontSize,
    canDecreaseFontSize,
    setTheme,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
    setLineSpacing,
    cycleLineSpacing,
    setLetterSpacing,
    cycleLetterSpacing,
    toggleDyslexicFont,
    toggleReduceMotion,
    toggleTTS,
    setSpeechRate,
    setSpeechPitch,
    setSpeechVoice,
    speak,
    stopSpeaking,
    resetAll,
  ]);

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext);
  if (ctx === null) {
    throw new Error(
      '[useAccessibility] Must be used inside <AccessibilityProvider>. ' +
      'Wrap your app root with <AccessibilityProvider>.'
    );
  }
  return ctx;
}

export default useAccessibility;
