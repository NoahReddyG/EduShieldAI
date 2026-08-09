/**
 * TrustScoreBadge.jsx
 * Animated circular SVG gauge displaying the live proctoring trust score.
 * Colour-shifts: green (≥80) → amber (60–79) → red (<60).
 * Pulses a "FLAGGED FOR REVIEW" banner when score < 60.
 */
import { useMemo } from 'react';
import { ShieldAlert, ShieldCheck, ShieldQuestion } from 'lucide-react';

const RADIUS = 40;
const STROKE_W = 7;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function getColor(score) {
  if (score >= 80) return { stroke: '#22c55e', text: '#22c55e', label: 'Secure', icon: ShieldCheck };
  if (score >= 60) return { stroke: '#f59e0b', text: '#f59e0b', label: 'Caution', icon: ShieldQuestion };
  return { stroke: '#ef4444', text: '#ef4444', label: 'Flagged', icon: ShieldAlert };
}

export default function TrustScoreBadge({ score = 100, compact = false }) {
  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));
  const { stroke, text, label, icon: Icon } = useMemo(() => getColor(clampedScore), [clampedScore]);
  const dashOffset = CIRCUMFERENCE * (1 - clampedScore / 100);
  const isFlagged = clampedScore < 60;

  if (compact) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        background: `${stroke}18`,
        border: `1px solid ${stroke}40`,
        borderRadius: '999px',
        padding: '4px 12px',
        fontSize: '0.85rem',
        fontWeight: 600,
        color: text,
      }}>
        <Icon size={14} />
        <span>{clampedScore}%</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      {/* SVG Gauge */}
      <div style={{ position: 'relative', width: 110, height: 110 }}>
        {/* Animated glow ring when flagged */}
        {isFlagged && (
          <div style={{
            position: 'absolute', inset: '-6px',
            borderRadius: '50%',
            background: 'transparent',
            boxShadow: '0 0 20px rgba(239,68,68,0.5)',
            animation: 'pulse-ring 1.5s ease-in-out infinite',
          }} />
        )}
        <svg width="110" height="110" style={{ transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle
            cx="55" cy="55" r={RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={STROKE_W}
          />
          {/* Progress */}
          <circle
            cx="55" cy="55" r={RADIUS}
            fill="none"
            stroke={stroke}
            strokeWidth={STROKE_W}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.4s ease' }}
          />
        </svg>
        {/* Center label */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 2,
        }}>
          <span style={{ fontSize: '1.4rem', fontWeight: 700, color: text, lineHeight: 1 }}>
            {clampedScore}
          </span>
          <span style={{ fontSize: '0.6rem', color: 'var(--color-on-surface-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Trust
          </span>
        </div>
      </div>

      {/* Status label */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '5px 14px',
        borderRadius: '999px',
        background: `${stroke}18`,
        border: `1px solid ${stroke}35`,
        color: text,
        fontSize: '0.78rem',
        fontWeight: 600,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
      }}>
        <Icon size={13} />
        {label}
      </div>

      {/* Flagged warning banner */}
      {isFlagged && (
        <div style={{
          background: 'rgba(239,68,68,0.12)',
          border: '1px solid rgba(239,68,68,0.4)',
          borderRadius: '8px',
          padding: '8px 12px',
          textAlign: 'center',
          color: '#ef4444',
          fontSize: '0.72rem',
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          animation: 'badge-pulse 2s ease-in-out infinite',
        }}>
          ⚠ Flagged for Review
        </div>
      )}

      <style>{`
        @keyframes pulse-ring {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.04); }
        }
        @keyframes badge-pulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
