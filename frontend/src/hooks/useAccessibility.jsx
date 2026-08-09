/**
 * useAccessibility.js
 * EduShieldAI — Accessibility Context & Hook
 *
 * Provides a React Context that stores and manages all accessibility
 * preferences for the platform. Designed to comply with WCAG 2.1 AA/AAA
 * and to accommodate neurodivergent students (dyslexia, ADHD, low vision).
 *
 * Features:
 *  ─ Font family toggle   (Standard / OpenDyslexic)
 *  ─ Font size scale       (5 steps: xs → xl bump)
 *  ─ Line spacing scale    (3 steps: normal / relaxed / loose)
 *  ─ Letter spacing        (3 steps)
 *  ─ High contrast mode    (standard / high-contrast / dyslexia warm)
 *  ─ Text-to-Speech (TTS)  (enable/disable, speech rate, voice selection,
 *                           speak/stop helpers using Web Speech API)
 *  ─ Reduced motion        (mirrors prefers-reduced-motion; can be forced)
 *  ─ Persistence           (all prefs saved to localStorage, auto-restored)
 *  ─ DOM sync              (applies data-theme + CSS vars directly on <html>
 *                           so Tailwind theme-variant selectors work)
 *
 * Usage:
 *   // 1. Wrap your app (in main.jsx or App.jsx):
 *   <AccessibilityProvider>
 *     <App />
 *   </AccessibilityProvider>
 *
 *   // 2. Consume in any component:
 *   const { fontSize, increaseFontSize, tts, speak } = useAccessibility();
 *
 *   // 3. Trigger TTS on any text:
 *   <button onClick={() => speak(questionText)}>Read Aloud</button>
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS & DEFAULTS
// ─────────────────────────────────────────────────────────────────────────────

/** Storage key for persisting preferences */
const STORAGE_KEY = 'edushield_a11y_prefs';

/**
 * Available visual theme variants.
 * Matches the data-theme values referenced in tailwind.config.js & index.css.
 */
export const THEMES = {
  DEFAULT:       'default',
  HIGH_CONTRAST: 'high-contrast',
  DYSLEXIA:      'dyslexia',
};

/**
 * Font size scale steps.
 * Each step maps to a CSS font-size multiplier applied on <html> via
 * --a11y-font-scale custom property, consumed in index.css.
 *
 * Step 0 = 100% (base), Step 4 = 150% (largest).
 */
export const FONT_SIZE_STEPS = [
  { label: 'Default',      scale: 1.00 },
  { label: 'Large',        scale: 1.125 },
  { label: 'Larger',       scale: 1.25 },
  { label: 'Extra Large',  scale: 1.375 },
  { label: 'Maximum',      scale: 1.50 },
];

/**
 * Line spacing scale steps.
 * Maps to --a11y-line-height on <html>.
 */
export const LINE_SPACING_STEPS = [
  { label: 'Normal',  value: 1.75 },
  { label: 'Relaxed', value: 2.0  },
  { label: 'Loose',   value: 2.25 },
];

/**
 * Letter spacing steps.
 * Maps to --a11y-letter-spacing on <html>.
 */
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
  // Visual
  theme:          THEMES.DEFAULT,
  fontSizeStep:   0,                // index into FONT_SIZE_STEPS
  lineSpacingStep: 0,               // index into LINE_SPACING_STEPS
  letterSpacingStep: 0,             // index into LETTER_SPACING_STEPS
  useDyslexicFont: false,           // toggle OpenDyslexic

  // Motion
  reduceMotion: false,              // overrides prefers-reduced-motion

  // TTS
  ttsEnabled:   false,
  speechRate:   DEFAULT_SPEECH_RATE,
  speechPitch:  DEFAULT_SPEECH_PITCH,
  speechVoiceURI: null,            // null = browser default
};

// ─────────────────────────────────────────────────────────────────────────────
// CONTEXT
// ─────────────────────────────────────────────────────────────────────────────

const AccessibilityContext = createContext(null);

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Safely read stored preferences from localStorage.
 * Falls back to DEFAULT_STATE if parsing fails or key is absent.
 */
function loadPrefs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STATE;
  }
}

/**
 * Applies all accessibility preferences to the <html> element via:
 *  - data-theme attribute (consumed by Tailwind theme selectors in index.css)
 *  - CSS custom properties (--a11y-*)
 *  - Font-family class toggle
 */
function syncDOMAttributes(prefs) {
  const html = document.documentElement;

  // Theme
  html.setAttribute('data-theme', prefs.theme);

  // Font scale → CSS custom property
  const scale = FONT_SIZE_STEPS[prefs.fontSizeStep]?.scale ?? 1;
  html.style.setProperty('--a11y-font-scale', String(scale));

  // Line height → CSS custom property
  const lh = LINE_SPACING_STEPS[prefs.lineSpacingStep]?.value ?? 1.75;
  html.style.setProperty('--a11y-line-height', String(lh));

  // Letter spacing → CSS custom property
  const ls = LETTER_SPACING_STEPS[prefs.letterSpacingStep]?.value ?? '0em';
  html.style.setProperty('--a11y-letter-spacing', ls);

  // Dyslexic font → class toggle on <html>
  html.classList.toggle('font-dyslexic', prefs.useDyslexicFont);

  // Reduced motion → class toggle on <html>
  html.classList.toggle('reduce-motion', prefs.reduceMotion);
}

// ─────────────────────────────────────────────────────────────────────────────
// PROVIDER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * AccessibilityProvider
 *
 * Mount once at the app root. Provides the full accessibility context
 * to all descendant components.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children
 */
export function AccessibilityProvider({ children }) {
  // ── State ────────────────────────────────────────────────────────────
  const [prefs, setPrefs] = useState(loadPrefs);

  // Available TTS voices (populated after browser loads them)
  const [voices, setVoices] = useState([]);

  // Track currently speaking utterance so we can cancel it
  const utteranceRef = useRef(null);

  // ── Persist & sync DOM on every prefs change ─────────────────────────
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // Quota exceeded or private mode — silently swallow
    }
    syncDOMAttributes(prefs);
  }, [prefs]);

  // ── Load TTS voices (async in most browsers) ─────────────────────────
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

  // ── Mirror OS prefers-reduced-motion (unless user has overridden) ─────
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e) => {
      // Only auto-apply if the user has NOT manually overridden the setting
      setPrefs((prev) => {
        if (prev.reduceMotion !== e.matches) {
          // Only update if not explicitly toggled by user; we use a sentinel
          // value to detect user intent: undefined = not touched, else boolean
          return prev._reduceMotionManual ? prev : { ...prev, reduceMotion: e.matches };
        }
        return prev;
      });
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // ── Generic updater ───────────────────────────────────────────────────
  const updatePref = useCallback((key, value) => {
    setPrefs((prev) => ({ ...prev, [key]: value }));
  }, []);

  // ── Theme ─────────────────────────────────────────────────────────────
  const setTheme = useCallback((theme) => {
    if (!Object.values(THEMES).includes(theme)) {
      console.warn(`[useAccessibility] Unknown theme: "${theme}"`);
      return;
    }
    updatePref('theme', theme);
  }, [updatePref]);

  // ── Font Size ─────────────────────────────────────────────────────────
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

  // ── Line Spacing ──────────────────────────────────────────────────────
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

  // ── Letter Spacing ────────────────────────────────────────────────────
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

  // ── Dyslexic Font ─────────────────────────────────────────────────────
  const toggleDyslexicFont = useCallback(() => {
    setPrefs((prev) => ({ ...prev, useDyslexicFont: !prev.useDyslexicFont }));
  }, []);

  // ── Reduced Motion ────────────────────────────────────────────────────
  const toggleReduceMotion = useCallback(() => {
    setPrefs((prev) => ({
      ...prev,
      reduceMotion: !prev.reduceMotion,
      _reduceMotionManual: true,  // mark as user-intent; suppress OS sync
    }));
  }, []);

  // ── TTS — Toggle & Config ─────────────────────────────────────────────
  const toggleTTS = useCallback(() => {
    setPrefs((prev) => {
      if (prev.ttsEnabled && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      return { ...prev, ttsEnabled: !prev.ttsEnabled };
    });
  }, []);

  const setSpeechRate = useCallback((rate) => {
    // Web Speech API: rate 0.1 – 10; practical range 0.5 – 2.0
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

  // ── TTS — speak() ──────────────────────────────────────────────────────
  /**
   * Speak a string aloud using the Web Speech API.
   * Automatically respects ttsEnabled, speechRate, speechPitch, and voice.
   *
   * @param {string} text       — The text to read aloud.
   * @param {object} [options]  — Optional overrides: { rate, pitch, voiceURI }
   * @returns {void}
   */
  const speak = useCallback((text, options = {}) => {
    if (!('speechSynthesis' in window)) {
      console.warn('[useAccessibility] Web Speech API not supported.');
      return;
    }
    if (!prefs.ttsEnabled && !options.force) return;

    // Cancel any in-progress utterance
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate  = options.rate  ?? prefs.speechRate;
    utterance.pitch = options.pitch ?? prefs.speechPitch;

    // Resolve voice
    const voiceURI = options.voiceURI ?? prefs.speechVoiceURI;
    if (voiceURI) {
      const voice = voices.find((v) => v.voiceURI === voiceURI);
      if (voice) utterance.voice = voice;
    }

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [prefs.ttsEnabled, prefs.speechRate, prefs.speechPitch, prefs.speechVoiceURI, voices]);

  // ── TTS — stopSpeaking() ───────────────────────────────────────────────
  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  // ── TTS — isSpeaking ─────────────────────────────────────────────────
  const isSpeaking = typeof window !== 'undefined' && 'speechSynthesis' in window
    ? window.speechSynthesis.speaking
    : false;

  // ── Reset All ─────────────────────────────────────────────────────────
  const resetAll = useCallback(() => {
    stopSpeaking();
    setPrefs(DEFAULT_STATE);
  }, [stopSpeaking]);

  // ── Derived / convenience values ──────────────────────────────────────
  const currentFontStep   = FONT_SIZE_STEPS[prefs.fontSizeStep];
  const currentLineSpacing = LINE_SPACING_STEPS[prefs.lineSpacingStep];
  const currentLetterSpacing = LETTER_SPACING_STEPS[prefs.letterSpacingStep];
  const canIncreaseFontSize = prefs.fontSizeStep < FONT_SIZE_STEPS.length - 1;
  const canDecreaseFontSize = prefs.fontSizeStep > 0;

  // ── Context value (memoized to prevent unnecessary re-renders) ─────────
  const value = useMemo(() => ({
    // ── Current preference values ────────────────────────────────
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

    // ── Derived / computed ────────────────────────────────────────
    currentFontStep,
    currentLineSpacing,
    currentLetterSpacing,
    canIncreaseFontSize,
    canDecreaseFontSize,
    availableVoices:    voices,
    isSpeaking,

    // ── Theme actions ─────────────────────────────────────────────
    setTheme,

    // ── Font size actions ──────────────────────────────────────────
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,

    // ── Line spacing actions ───────────────────────────────────────
    setLineSpacing,
    cycleLineSpacing,

    // ── Letter spacing actions ─────────────────────────────────────
    setLetterSpacing,
    cycleLetterSpacing,

    // ── Dyslexic font action ───────────────────────────────────────
    toggleDyslexicFont,

    // ── Motion action ──────────────────────────────────────────────
    toggleReduceMotion,

    // ── TTS actions ────────────────────────────────────────────────
    toggleTTS,
    setSpeechRate,
    setSpeechPitch,
    setSpeechVoice,
    speak,
    stopSpeaking,

    // ── Global reset ───────────────────────────────────────────────
    resetAll,

    // ── Constants (for UI controls) ───────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// CONSUMER HOOK
// ─────────────────────────────────────────────────────────────────────────────

/**
 * useAccessibility
 *
 * Consume accessibility preferences and actions in any component.
 * Must be used within an <AccessibilityProvider> tree.
 *
 * @returns {AccessibilityContextValue}
 *
 * @example
 * const { theme, setTheme, ttsEnabled, speak, increaseFontSize } = useAccessibility();
 */
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
