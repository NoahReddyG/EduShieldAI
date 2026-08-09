/**
 * StudentDashboard.jsx
 * Student exam lobby — shows assigned tests with Start/View Results CTAs.
 * Students must explicitly click "Start Test" to enter the proctored environment.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Clock, Play, BarChart3, CheckCircle2,
  ShieldCheck, Loader2, AlertTriangle, FileText,
  ChevronRight, Info,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import AccessibilityToolbar from '../components/AccessibilityToolbar';
import TrustScoreBadge from '../components/TrustScoreBadge';
import { getStoredUser } from '../services/authService';
import { createSession } from '../services/proctoringService';
import {
  getAllTests, getStudentResult, getStudentAllResults,
  getTrustLabel, getTrustColor, initializeTests,
} from '../services/testService';

// Accent palettes for test cards (rotates through)
const ACCENTS = [
  { primary: '#7c6fff', glow: 'rgba(124,111,255,0.25)', bg: 'rgba(124,111,255,0.06)', border: 'rgba(124,111,255,0.2)' },
  { primary: '#22d3ee', glow: 'rgba(34,211,238,0.2)', bg: 'rgba(34,211,238,0.05)', border: 'rgba(34,211,238,0.18)' },
  { primary: '#a78bfa', glow: 'rgba(167,139,250,0.22)', bg: 'rgba(167,139,250,0.05)', border: 'rgba(167,139,250,0.18)' },
  { primary: '#34d399', glow: 'rgba(52,211,153,0.22)', bg: 'rgba(52,211,153,0.05)', border: 'rgba(52,211,153,0.18)' },
];

function TestStatusBadge({ result }) {
  if (!result) {
    return (
      <span style={{
        padding: '3px 10px', borderRadius: '999px',
        background: 'rgba(255,255,255,0.06)', border: '1px solid var(--color-border)',
        color: 'var(--color-on-surface-muted)', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.04em',
      }}>
        Not Started
      </span>
    );
  }
  const color = getTrustColor(result.trustScore);
  return (
    <span style={{
      padding: '3px 10px', borderRadius: '999px',
      background: `${color}15`, border: `1px solid ${color}35`,
      color, fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.04em',
      display: 'flex', alignItems: 'center', gap: '4px',
    }}>
      <CheckCircle2 size={10} />
      Completed · {Math.round(result.trustScore)}%
    </span>
  );
}

export default function StudentDashboard() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const [tests, setTests] = useState([]);
  const [startingTestId, setStartingTestId] = useState(null);
  const [results, setResults] = useState([]);
  const [showInstructions, setShowInstructions] = useState(null); // testId

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    initializeTests();
    const available = getAllTests().filter(t => t.status === 'active');
    setTests(available);
    setResults(getStudentAllResults(user.email));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getResultForTest = (testId) =>
    results.find(r => r.testId === testId) || null;

  const handleStartTest = async (test) => {
    setStartingTestId(test.id);
    try {
      // Create backend proctoring session
      const session = await createSession(user.user_id || 1, test.title);
      // Store session mapping for exam page
      localStorage.setItem(`edushield_active_session_${test.id}`, JSON.stringify({
        testId: test.id,
        sessionId: session.session_id,
        startTime: new Date().toISOString(),
      }));
      navigate(`/exam/${test.id}`);
    } catch (err) {
      console.warn('Session creation failed, proceeding offline:', err);
      // Offline fallback
      const demoSessionId = Date.now();
      localStorage.setItem(`edushield_active_session_${test.id}`, JSON.stringify({
        testId: test.id,
        sessionId: demoSessionId,
        startTime: new Date().toISOString(),
      }));
      navigate(`/exam/${test.id}`);
    }
  };

  // Stats
  const completed = results.length;
  const pending = tests.filter(t => !getResultForTest(t.id)).length;
  const avgScore = completed > 0
    ? Math.round(results.reduce((s, r) => s + r.trustScore, 0) / completed)
    : null;

  return (
    <div style={{ minHeight: '100svh', background: 'var(--color-surface)', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <div style={{ flex: 1, maxWidth: 960, width: '100%', margin: '0 auto', padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* Welcome header */}
        <div style={{
          padding: '24px 28px',
          background: 'linear-gradient(135deg, rgba(124,111,255,0.1), rgba(34,211,238,0.05))',
          border: '1px solid rgba(124,111,255,0.2)',
          borderRadius: '20px',
          display: 'flex', alignItems: 'center', gap: '20px',
          flexWrap: 'wrap',
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: '16px', flexShrink: 0,
            background: 'linear-gradient(135deg, var(--color-primary), #a78bfa)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 24px rgba(124,111,255,0.4)',
          }}>
            <ShieldCheck size={24} color="#fff" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-on-surface)' }}>
              Welcome back, <span style={{ background: 'linear-gradient(135deg, var(--color-primary), #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {user?.email?.split('@')[0]}
              </span>
            </h1>
            <p style={{ margin: '4px 0 0', color: 'var(--color-on-surface-muted)', fontSize: '0.85rem' }}>
              Your assigned tests are listed below. Click "Start Test" when you're ready.
            </p>
          </div>
          {/* Mini stats */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {[
              { label: 'Pending', value: pending, color: '#f59e0b' },
              { label: 'Completed', value: completed, color: '#22c55e' },
              ...(avgScore !== null ? [{ label: 'Avg Score', value: `${avgScore}%`, color: getTrustColor(avgScore) }] : []),
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--color-on-surface-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Test lobby heading */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--color-on-surface)' }}>
            Assigned Tests
            <span style={{ marginLeft: '8px', fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-on-surface-muted)' }}>
              ({tests.length} available)
            </span>
          </h2>
        </div>

        {/* Test cards */}
        {tests.length === 0 ? (
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--color-border)',
            borderRadius: '16px',
            padding: '56px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
            color: 'var(--color-on-surface-muted)',
          }}>
            <BookOpen size={40} style={{ opacity: 0.35 }} />
            <div style={{ fontWeight: 600 }}>No tests assigned yet</div>
            <div style={{ fontSize: '0.82rem' }}>Your teacher hasn't assigned any tests yet. Check back later.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {tests.map((test, idx) => {
              const accent = ACCENTS[idx % ACCENTS.length];
              const result = getResultForTest(test.id);
              const isCompleted = !!result;
              const isStarting = startingTestId === test.id;
              const showInstr = showInstructions === test.id;

              return (
                <div key={test.id} style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isCompleted ? 'rgba(34,197,94,0.2)' : accent.border}`,
                  borderRadius: '16px',
                  overflow: 'hidden',
                  transition: 'box-shadow 0.2s',
                  boxShadow: isCompleted ? 'none' : `0 0 0 0 ${accent.glow}`,
                }}
                  onMouseEnter={e => { if (!isCompleted) e.currentTarget.style.boxShadow = `0 4px 24px ${accent.glow}`; }}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>

                  {/* Card header stripe */}
                  <div style={{
                    height: 4,
                    background: isCompleted
                      ? `linear-gradient(90deg, ${getTrustColor(result.trustScore)}, ${getTrustColor(result.trustScore)}88)`
                      : `linear-gradient(90deg, ${accent.primary}, ${accent.primary}66)`,
                  }} />

                  <div style={{ padding: '20px 22px' }}>
                    {/* Top row */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '14px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                          <TestStatusBadge result={result} />
                        </div>
                        <h3 style={{ margin: '6px 0 2px', fontSize: '1rem', fontWeight: 700, color: 'var(--color-on-surface)', lineHeight: 1.3 }}>
                          {test.title}
                        </h3>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-on-surface-muted)' }}>
                          {test.topic}
                        </div>
                      </div>

                      {/* Completed: show mini score */}
                      {isCompleted && (
                        <TrustScoreBadge score={result.trustScore} compact />
                      )}
                    </div>

                    {/* Metadata row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '14px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', color: 'var(--color-on-surface-muted)' }}>
                        <Clock size={13} color={accent.primary} />
                        {test.duration} minutes
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', color: 'var(--color-on-surface-muted)' }}>
                        <FileText size={13} color={accent.primary} />
                        {test.questions?.length || 0} questions
                      </span>
                      {test.createdBy && (
                        <span style={{ fontSize: '0.78rem', color: 'var(--color-on-surface-muted)' }}>
                          by {test.createdBy.split('@')[0]}
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    {test.description && (
                      <p style={{
                        margin: '0 0 14px',
                        fontSize: '0.82rem', color: 'var(--color-on-surface-muted)',
                        lineHeight: 1.6,
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}>
                        {test.description}
                      </p>
                    )}

                    {/* Instructions collapsible */}
                    {test.instructions && (
                      <div style={{ marginBottom: '14px' }}>
                        <button
                          onClick={() => setShowInstructions(showInstr ? null : test.id)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '5px',
                            background: 'none', border: 'none',
                            color: accent.primary, fontSize: '0.75rem', fontWeight: 600,
                            cursor: 'pointer', padding: 0,
                          }}>
                          <Info size={12} />
                          {showInstr ? 'Hide' : 'Show'} Instructions
                          <ChevronRight size={12} style={{ transform: showInstr ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                        </button>
                        {showInstr && (
                          <div style={{
                            marginTop: '8px', padding: '12px 14px',
                            background: accent.bg,
                            border: `1px solid ${accent.border}`,
                            borderRadius: '8px',
                            fontSize: '0.8rem', color: 'var(--color-on-surface)',
                            lineHeight: 1.6, animation: 'fadeIn 0.2s ease',
                          }}>
                            {test.instructions}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {isCompleted ? (
                        <button
                          onClick={() => navigate(`/report/${result.sessionId}`)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '10px 20px',
                            background: 'rgba(34,197,94,0.1)',
                            border: '1px solid rgba(34,197,94,0.3)',
                            borderRadius: '10px',
                            color: '#22c55e', fontWeight: 600, fontSize: '0.85rem',
                            cursor: 'pointer',
                          }}>
                          <BarChart3 size={15} />
                          View My Results
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStartTest(test)}
                          disabled={isStarting}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '10px 22px',
                            background: `linear-gradient(135deg, ${accent.primary}, ${accent.primary}cc)`,
                            border: 'none', borderRadius: '10px',
                            color: '#fff', fontWeight: 700, fontSize: '0.88rem',
                            cursor: isStarting ? 'wait' : 'pointer',
                            opacity: isStarting ? 0.8 : 1,
                            boxShadow: `0 4px 16px ${accent.glow}`,
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={e => { if (!isStarting) e.currentTarget.style.boxShadow = `0 6px 24px ${accent.glow}`; }}
                          onMouseLeave={e => e.currentTarget.style.boxShadow = `0 4px 16px ${accent.glow}`}>
                          {isStarting
                            ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                            : <Play size={15} style={{ fill: 'white' }} />}
                          {isStarting ? 'Preparing...' : 'Start Test'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Proctor notice for non-started tests */}
                  {!isCompleted && (
                    <div style={{
                      padding: '10px 22px',
                      borderTop: '1px solid var(--color-border)',
                      background: 'rgba(124,111,255,0.03)',
                      display: 'flex', alignItems: 'center', gap: '8px',
                      fontSize: '0.7rem', color: 'var(--color-on-surface-muted)',
                    }}>
                      <ShieldCheck size={12} color={accent.primary} />
                      Camera access required · On-device face detection · Privacy-preserving proctoring
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Completed exams summary */}
        {results.length > 0 && (
          <div>
            <h2 style={{ margin: '0 0 12px', fontSize: '1rem', fontWeight: 700, color: 'var(--color-on-surface)' }}>
              Your Past Results
            </h2>
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--color-border)',
              borderRadius: '14px', overflow: 'hidden',
            }}>
              {results.map((r, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '16px',
                  padding: '14px 18px',
                  borderBottom: i < results.length - 1 ? '1px solid var(--color-border)' : 'none',
                  transition: 'background 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <TrustScoreBadge score={r.trustScore} compact />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--color-on-surface)', marginBottom: '2px' }}>
                      {r.examTitle}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-muted)' }}>
                      {r.completedAt ? new Date(r.completedAt).toLocaleString() : '—'} · {r.anomalyCount || 0} anomalies
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/report/${r.sessionId}`)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '5px',
                      padding: '6px 14px',
                      background: 'rgba(124,111,255,0.1)',
                      border: '1px solid rgba(124,111,255,0.25)',
                      borderRadius: '8px',
                      color: 'var(--color-primary)', fontSize: '0.75rem', fontWeight: 600,
                      cursor: 'pointer', flexShrink: 0,
                    }}>
                    <BarChart3 size={12} /> View Report
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <AccessibilityToolbar />

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
