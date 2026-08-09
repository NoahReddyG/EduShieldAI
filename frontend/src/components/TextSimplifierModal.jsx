/**
 * TextSimplifierModal.jsx
 * Slide-in drawer for AI-powered text simplification.
 * Shows original vs simplified text, bullet points, and TTS read-aloud.
 */
import { useState, useEffect } from 'react';
import { X, Wand2, Volume2, VolumeX, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { simplifyText } from '../services/accessibilityService';
import { useAccessibility } from '../hooks/useAccessibility';

export default function TextSimplifierModal({ isOpen, onClose, selectedText = '' }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const { speak, stopSpeaking, ttsEnabled, toggleTTS } = useAccessibility();

  // Auto-fetch when opened with text
  useEffect(() => {
    if (isOpen && selectedText.trim()) {
      handleSimplify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, selectedText]);

  // Clear on close
  useEffect(() => {
    if (!isOpen) {
      setResult(null);
      setError(null);
    }
  }, [isOpen]);

  const handleSimplify = async () => {
    if (!selectedText.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await simplifyText(selectedText);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to simplify text. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReadAloud = () => {
    if (!result) return;
    speak(result.simplified_text, { force: true });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          animation: 'fadeIn 0.2s ease',
        }}
      />

      {/* Drawer panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 'min(480px, 95vw)',
        zIndex: 201,
        background: 'rgba(15,17,23,0.98)',
        backdropFilter: 'blur(24px)',
        borderLeft: '1px solid var(--color-border)',
        display: 'flex', flexDirection: 'column',
        animation: 'slideIn 0.28s cubic-bezier(0.34,1.56,0.64,1)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: '1px solid var(--color-border)',
          background: 'rgba(124,111,255,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: 36, height: 36,
              background: 'linear-gradient(135deg, var(--color-primary), #a78bfa)',
              borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 16px rgba(124,111,255,0.4)',
            }}>
              <Wand2 size={17} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-on-surface)' }}>
                AI Text Simplifier
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-on-surface-muted)' }}>
                Dyslexia & ADHD friendly reformatting
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)',
            borderRadius: '8px', padding: '6px', cursor: 'pointer',
            color: 'var(--color-on-surface-muted)', transition: 'all 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}>
            <X size={17} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Original text */}
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-on-surface-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px', fontWeight: 600 }}>
              Original Text
            </div>
            <div style={{
              padding: '14px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--color-border)',
              borderRadius: '10px',
              fontSize: '0.88rem',
              color: 'var(--color-on-surface-muted)',
              lineHeight: 1.7,
              maxHeight: '160px', overflowY: 'auto',
            }}>
              {selectedText || <span style={{ fontStyle: 'italic' }}>No text selected. Highlight exam text and click AI Simplify.</span>}
            </div>
          </div>

          {/* Loading state */}
          {loading && (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
              padding: '40px 20px',
            }}>
              <div style={{ position: 'relative' }}>
                <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-primary)' }} />
                <div style={{
                  position: 'absolute', inset: '-6px', borderRadius: '50%',
                  boxShadow: '0 0 20px rgba(124,111,255,0.4)',
                  animation: 'pulse-ring 1.5s ease-in-out infinite',
                }} />
              </div>
              <div style={{ color: 'var(--color-on-surface-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
                Llama 3.1 is simplifying this for you...
              </div>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div style={{
              display: 'flex', gap: '10px', padding: '14px',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: '10px', color: '#ef4444',
              fontSize: '0.85rem',
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Result */}
          {result && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.3s ease' }}>
              {/* Simplified text */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                    ✦ Simplified Version
                  </div>
                  <button
                    onClick={handleReadAloud}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '5px',
                      padding: '4px 10px',
                      background: 'rgba(124,111,255,0.12)',
                      border: '1px solid rgba(124,111,255,0.3)',
                      borderRadius: '999px',
                      color: 'var(--color-primary)',
                      fontSize: '0.72rem', fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,111,255,0.22)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(124,111,255,0.12)'}>
                    <Volume2 size={12} />
                    Read Aloud
                  </button>
                </div>
                <div style={{
                  padding: '16px',
                  background: 'rgba(124,111,255,0.07)',
                  border: '1px solid rgba(124,111,255,0.2)',
                  borderRadius: '10px',
                  fontSize: '0.9rem',
                  color: 'var(--color-on-surface)',
                  lineHeight: 1.8,
                }}>
                  {result.simplified_text}
                </div>
              </div>

              {/* Bullet points */}
              {result.bullet_points?.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-on-surface-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px', fontWeight: 600 }}>
                    Key Takeaways
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {result.bullet_points.map((pt, i) => (
                      <div key={i} style={{
                        display: 'flex', gap: '10px', padding: '10px 12px',
                        background: 'rgba(34,197,94,0.06)',
                        border: '1px solid rgba(34,197,94,0.15)',
                        borderRadius: '8px', fontSize: '0.85rem',
                        color: 'var(--color-on-surface)',
                      }}>
                        <CheckCircle2 size={15} color="#22c55e" style={{ flexShrink: 0, marginTop: 2 }} />
                        <span>{pt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--color-border)',
          display: 'flex', gap: '10px',
        }}>
          <button
            onClick={handleSimplify}
            disabled={loading || !selectedText.trim()}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '10px',
              background: 'linear-gradient(135deg, var(--color-primary), #a78bfa)',
              border: 'none', borderRadius: '10px',
              color: '#fff', fontWeight: 600, fontSize: '0.88rem',
              cursor: loading ? 'wait' : 'pointer',
              opacity: loading || !selectedText.trim() ? 0.6 : 1,
              boxShadow: '0 4px 16px rgba(124,111,255,0.35)',
              transition: 'all 0.2s',
            }}>
            {loading ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Wand2 size={15} />}
            {loading ? 'Simplifying...' : 'Re-Simplify'}
          </button>
          <button onClick={onClose} style={{
            padding: '10px 18px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid var(--color-border)',
            borderRadius: '10px',
            color: 'var(--color-on-surface-muted)',
            cursor: 'pointer', fontWeight: 500, fontSize: '0.88rem',
          }}>
            Close
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse-ring { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }
      `}</style>
    </>
  );
}
