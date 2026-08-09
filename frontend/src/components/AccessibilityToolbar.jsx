import { useState } from 'react';
import {
  Accessibility, Type, Minus, Plus, RotateCcw,
  Eye, Headphones, Volume2, VolumeX, Wand2, Sun,
  ChevronDown, ChevronUp, AlignLeft
} from 'lucide-react';
import { useAccessibility, THEMES } from '../hooks/useAccessibility';

const BTN = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  gap: '6px',
  padding: '6px 12px',
  borderRadius: '8px',
  border: '1px solid var(--color-border)',
  background: 'rgba(255,255,255,0.04)',
  color: 'var(--color-on-surface)',
  fontSize: '0.78rem', fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  whiteSpace: 'nowrap',
};

const ICON_BTN = {
  ...BTN, padding: '6px 8px', minWidth: 34,
};

const ACTIVE_BTN = {
  background: 'var(--color-primary-muted)',
  border: '1px solid var(--color-primary)',
  color: 'var(--color-primary)',
};

export default function AccessibilityToolbar({ onSimplifyRequest }) {
  const [expanded, setExpanded] = useState(false);
  const {
    theme, setTheme, THEMES: themes,
    fontSizeStep, increaseFontSize, decreaseFontSize, resetFontSize,
    canIncreaseFontSize, canDecreaseFontSize,
    useDyslexicFont, toggleDyslexicFont,
    ttsEnabled, toggleTTS,
    reduceMotion, toggleReduceMotion,
  } = useAccessibility();

  const themeOptions = [
    { value: THEMES.DEFAULT, label: 'Default', icon: '🌙' },
    { value: THEMES.HIGH_CONTRAST, label: 'High Contrast', icon: '◑' },
    { value: THEMES.DYSLEXIA, label: 'Dyslexia', icon: '☀️' },
  ];

  return (
    <div style={{
      position: 'fixed', bottom: '24px', right: '24px',
      zIndex: 100,
      display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px',
    }}>
      {/* Expanded panel */}
      {expanded && (
        <div style={{
          background: 'rgba(15,17,23,0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid var(--color-border)',
          borderRadius: '16px',
          padding: '16px',
          width: '260px',
          display: 'flex', flexDirection: 'column', gap: '14px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          animation: 'slideUp 0.2s ease',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Accessibility size={16} color="var(--color-primary)" />
            <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-on-surface)' }}>
              Accessibility
            </span>
          </div>

          {/* Font size */}
          <div>
            <div style={{ fontSize: '0.68rem', color: 'var(--color-on-surface-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
              Text Size
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button style={{ ...ICON_BTN, opacity: canDecreaseFontSize ? 1 : 0.4 }}
                onClick={decreaseFontSize} disabled={!canDecreaseFontSize}
                onMouseEnter={e => { if (canDecreaseFontSize) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}>
                <Minus size={13} />
              </button>
              <button style={{ ...BTN, flex: 1, justifyContent: 'center' }} onClick={resetFontSize}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}>
                <Type size={13} />
                <span>Reset</span>
              </button>
              <button style={{ ...ICON_BTN, opacity: canIncreaseFontSize ? 1 : 0.4 }}
                onClick={increaseFontSize} disabled={!canIncreaseFontSize}
                onMouseEnter={e => { if (canIncreaseFontSize) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}>
                <Plus size={13} />
              </button>
            </div>
          </div>

          {/* Dyslexic font toggle */}
          <button
            onClick={toggleDyslexicFont}
            style={{ ...BTN, ...(useDyslexicFont ? ACTIVE_BTN : {}), justifyContent: 'space-between', width: '100%' }}
            onMouseEnter={e => { if (!useDyslexicFont) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
            onMouseLeave={e => { if (!useDyslexicFont) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlignLeft size={13} />
              <span>OpenDyslexic Font</span>
            </div>
            <div style={{
              width: 28, height: 16, borderRadius: '999px',
              background: useDyslexicFont ? 'var(--color-primary)' : 'var(--color-border)',
              position: 'relative', transition: 'background 0.2s',
              flexShrink: 0,
            }}>
              <div style={{
                position: 'absolute', top: 2, borderRadius: '50%',
                width: 12, height: 12, background: 'white',
                left: useDyslexicFont ? 14 : 2,
                transition: 'left 0.2s',
              }} />
            </div>
          </button>

          {/* TTS toggle */}
          <button
            onClick={toggleTTS}
            style={{ ...BTN, ...(ttsEnabled ? ACTIVE_BTN : {}), justifyContent: 'space-between', width: '100%' }}
            onMouseEnter={e => { if (!ttsEnabled) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
            onMouseLeave={e => { if (!ttsEnabled) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {ttsEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
              <span>Text-to-Speech</span>
            </div>
            <div style={{
              width: 28, height: 16, borderRadius: '999px',
              background: ttsEnabled ? 'var(--color-primary)' : 'var(--color-border)',
              position: 'relative', transition: 'background 0.2s', flexShrink: 0,
            }}>
              <div style={{
                position: 'absolute', top: 2, borderRadius: '50%',
                width: 12, height: 12, background: 'white',
                left: ttsEnabled ? 14 : 2, transition: 'left 0.2s',
              }} />
            </div>
          </button>

          {/* Contrast theme */}
          <div>
            <div style={{ fontSize: '0.68rem', color: 'var(--color-on-surface-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
              Visual Theme
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {themeOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setTheme(opt.value)}
                  style={{
                    ...BTN,
                    ...(theme === opt.value ? ACTIVE_BTN : {}),
                    justifyContent: 'flex-start', gap: '8px',
                  }}
                  onMouseEnter={e => { if (theme !== opt.value) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                  onMouseLeave={e => { if (theme !== opt.value) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}>
                  <span>{opt.icon}</span>
                  <span>{opt.label}</span>
                  {theme === opt.value && <span style={{ marginLeft: 'auto', fontSize: '0.7rem' }}>✓</span>}
                </button>
              ))}
            </div>
          </div>

          {/* AI Simplifier */}
          {onSimplifyRequest && (
            <button
              onClick={onSimplifyRequest}
              style={{
                ...BTN,
                background: 'linear-gradient(135deg, rgba(124,111,255,0.2), rgba(167,139,250,0.1))',
                border: '1px solid rgba(124,111,255,0.4)',
                color: 'var(--color-primary)',
                justifyContent: 'center', gap: '8px',
                fontWeight: 600,
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'linear-gradient(135deg, rgba(124,111,255,0.3), rgba(167,139,250,0.2))'}
              onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(135deg, rgba(124,111,255,0.2), rgba(167,139,250,0.1))'}>
              <Wand2 size={13} />
              AI Simplify Selected Text
            </button>
          )}
        </div>
      )}

      {/* Toggle FAB */}
      <button
        onClick={() => setExpanded(v => !v)}
        title="Accessibility Settings"
        style={{
          width: 50, height: 50,
          borderRadius: '50%',
          background: expanded
            ? 'var(--color-primary)'
            : 'rgba(124,111,255,0.15)',
          border: `1px solid ${expanded ? 'var(--color-primary)' : 'rgba(124,111,255,0.3)'}`,
          color: expanded ? '#fff' : 'var(--color-primary)',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: expanded
            ? '0 0 24px rgba(124,111,255,0.5)'
            : '0 4px 16px rgba(0,0,0,0.3)',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={e => {
          if (!expanded) e.currentTarget.style.background = 'rgba(124,111,255,0.25)';
        }}
        onMouseLeave={e => {
          if (!expanded) e.currentTarget.style.background = 'rgba(124,111,255,0.15)';
        }}>
        <Accessibility size={20} />
      </button>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
