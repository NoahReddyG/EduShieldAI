import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ShieldCheck, ShieldAlert, Clock, AlertTriangle,
  Users, Eye, EyeOff, Download, ArrowLeft,
  TrendingDown, Activity, CheckCircle2, XCircle,
  Loader2, BarChart3, FileQuestion, Circle,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import TrustScoreBadge from '../components/TrustScoreBadge';
import AccessibilityToolbar from '../components/AccessibilityToolbar';
import { getSessionReport } from '../services/reportService';
import { getStoredUser } from '../services/authService';
import { getResultBySessionId } from '../services/testService';

const FLAG_META = {
  GAZE_OFFSCREEN: { label: 'Gaze Off-Screen', icon: Eye, color: '#f59e0b', penalty: 2.5, description: 'Student was not looking at the screen' },
  MULTIPLE_FACES: { label: 'Multiple Faces', icon: Users, color: '#ef4444', penalty: 15.0, description: 'Multiple people detected in frame' },
  NO_FACE_DETECTED: { label: 'No Face Detected', icon: EyeOff, color: '#f97316', penalty: 5.0, description: 'Student left camera field of view' },
  AUDIO_DISTURBANCE: { label: 'Audio Disturbance', icon: Activity, color: '#f59e0b', penalty: 3.0, description: 'Unexpected audio activity detected' },
};

const MOCK_REPORT = {
  session_info: {
    session_id: 999,
    exam_title: 'CS401: Artificial Intelligence — Midterm Assessment',
    student_id: 1,
    trust_score: 78.5,
    status: 'COMPLETED',
    start_time: new Date(Date.now() - 35 * 60000).toISOString(),
    end_time: new Date().toISOString(),
  },
  total_anomalies_flagged: 3,
  anomaly_timeline: [
    { log_id: 1, session_id: 999, flag_type: 'GAZE_OFFSCREEN', confidence_score: 0.82, details: 'Gaze deflected right', timestamp: new Date(Date.now() - 25 * 60000).toISOString() },
    { log_id: 2, session_id: 999, flag_type: 'GAZE_OFFSCREEN', confidence_score: 0.71, details: 'Gaze deflected left', timestamp: new Date(Date.now() - 18 * 60000).toISOString() },
    { log_id: 3, session_id: 999, flag_type: 'NO_FACE_DETECTED', confidence_score: 0.90, details: 'No face detected for 3s', timestamp: new Date(Date.now() - 10 * 60000).toISOString() },
  ],
  integrity_rating: 'PASS',
};

function formatDuration(start, end) {
  if (!start || !end) return '—';
  const ms = new Date(end) - new Date(start);
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return `${mins}m ${secs}s`;
}

function formatTimestamp(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function ReportPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const user = getStoredUser();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const backDest = user?.role === 'FACULTY' ? '/teacher' : '/student';
  const backLabel = user?.role === 'FACULTY' ? 'Back to Dashboard' : 'Back to My Tests';

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const data = await getSessionReport(sessionId);
        setReport(data);
      } catch (err) {
        
        const local = getResultBySessionId(sessionId);
        if (local) {
          
          setReport({
            session_info: {
              session_id: local.sessionId,
              exam_title: local.examTitle,
              student_id: local.studentId || 1,
              trust_score: local.trustScore,
              status: local.status,
              start_time: new Date(local.completedAt || Date.now()).toISOString(),
              end_time: new Date(local.completedAt || Date.now()).toISOString(),
            },
            total_anomalies_flagged: local.anomalyCount || 0,
            anomaly_timeline: [],
            integrity_rating: local.trustScore >= 60 ? 'PASS' : 'FAIL',
            
            correctAnswers: local.correctAnswers ?? null,
            totalQuestions: local.totalQuestions ?? null,
            attemptedQuestions: local.attemptedQuestions ?? null,
            answerReview: local.answerReview ?? [],
          });
        } else if (sessionId === '999' || err.response?.status === 404) {
          setReport(MOCK_REPORT);
        } else {
          setError(err.response?.data?.detail || 'Failed to load report.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [sessionId]);

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div style={{ minHeight: '100svh', background: 'var(--color-surface)', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
          <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-primary)' }} />
          <div style={{ color: 'var(--color-on-surface-muted)' }}>Loading integrity report...</div>
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100svh', background: 'var(--color-surface)', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
          <XCircle size={40} color="#ef4444" />
          <div style={{ color: '#ef4444' }}>{error}</div>
          <button onClick={() => navigate('/')} style={{ padding: '8px 20px', background: 'var(--color-primary)', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer' }}>
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const { session_info: session, total_anomalies_flagged, anomaly_timeline, integrity_rating,
    correctAnswers, totalQuestions, attemptedQuestions, answerReview } = report;
  const isPassed = integrity_rating === 'PASS';
  const trustScore = session?.trust_score ?? 100;
  const duration = formatDuration(session?.start_time, session?.end_time);

  const examScorePct = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : null;
  const examScoreColor = examScorePct === null ? 'var(--color-on-surface-muted)'
    : examScorePct >= 70 ? '#22c55e' : examScorePct >= 50 ? '#f59e0b' : '#ef4444';

  const byType = (anomaly_timeline || []).reduce((acc, a) => {
    acc[a.flag_type] = (acc[a.flag_type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{ minHeight: '100svh', background: 'var(--color-surface)', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <div style={{ flex: 1, overflowY: 'auto', padding: '28px 24px', maxWidth: '900px', width: '100%', margin: '0 auto' }}>

        {/* Back + print actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <button
            onClick={() => navigate(backDest)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 14px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              color: 'var(--color-on-surface-muted)', fontSize: '0.82rem',
              cursor: 'pointer',
            }}>
            <ArrowLeft size={14} />
            {backLabel}
          </button>
          <button
            onClick={handlePrint}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px',
              background: 'rgba(124,111,255,0.12)',
              border: '1px solid rgba(124,111,255,0.3)',
              borderRadius: '8px',
              color: 'var(--color-primary)', fontSize: '0.82rem', fontWeight: 600,
              cursor: 'pointer',
            }}>
            <Download size={14} />
            Download / Print Report
          </button>
        </div>

        {/* Hero: Status banner */}
        <div style={{
          background: isPassed
            ? 'linear-gradient(135deg, rgba(34,197,94,0.12), rgba(16,185,129,0.06))'
            : 'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(220,38,38,0.06))',
          border: `1px solid ${isPassed ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
          borderRadius: '20px',
          padding: '28px',
          marginBottom: '20px',
          display: 'flex', alignItems: 'center', gap: '24px',
          flexWrap: 'wrap',
        }}>
          {/* Trust score gauge */}
          <TrustScoreBadge score={trustScore} />

          {/* Summary */}
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '4px 14px',
              borderRadius: '999px',
              background: isPassed ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
              color: isPassed ? '#22c55e' : '#ef4444',
              fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
              marginBottom: '10px',
            }}>
              {isPassed ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
              {isPassed ? 'INTEGRITY PASSED' : 'FLAGGED FOR REVIEW'}
            </div>
            <h1 style={{ margin: '0 0 4px', fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-on-surface)', lineHeight: 1.3 }}>
              {session?.exam_title || 'Exam Report'}
            </h1>
            <div style={{ color: 'var(--color-on-surface-muted)', fontSize: '0.82rem' }}>
              Session ID: #{session?.session_id} · Student ID: #{session?.student_id}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '20px' }}>
          {[
            {
              label: 'Exam Score',
              value: correctAnswers !== null
                ? `${correctAnswers}/${totalQuestions}`
                : '—',
              sub: examScorePct !== null ? `${examScorePct}% · ${attemptedQuestions}/${totalQuestions} attempted` : null,
              icon: FileQuestion,
              color: examScoreColor,
            },
            { label: 'Final Trust Score', value: `${Math.round(trustScore)}%`, icon: BarChart3, color: trustScore >= 70 ? '#22c55e' : '#ef4444' },
            { label: 'Total Anomalies', value: total_anomalies_flagged, icon: AlertTriangle, color: total_anomalies_flagged > 0 ? '#f59e0b' : '#22c55e' },
            { label: 'Exam Duration', value: duration, icon: Clock, color: 'var(--color-on-surface-muted)' },
            { label: 'Session Status', value: session?.status || '—', icon: Activity, color: isPassed ? '#22c55e' : '#ef4444' },
          ].map(stat => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--color-border)',
                borderRadius: '12px', padding: '16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <Icon size={14} color={stat.color} />
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-on-surface-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>
                    {stat.label}
                  </span>
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: stat.color }}>
                  {stat.value}
                </div>
                {stat.sub && (
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-on-surface-muted)', marginTop: '2px' }}>
                    {stat.sub}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Answer Review ─────────────────────────────────────────────── */}
        {answerReview && answerReview.length > 0 && (
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--color-border)',
            borderRadius: '14px', overflow: 'hidden',
            marginBottom: '20px',
          }}>
            <div style={{
              padding: '12px 18px', borderBottom: '1px solid var(--color-border)',
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'rgba(255,255,255,0.01)',
            }}>
              <FileQuestion size={15} color="var(--color-primary)" />
              <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-on-surface)' }}>
                Answer Review
              </span>
              <span style={{
                marginLeft: 'auto', fontWeight: 700,
                background: examScorePct !== null
                  ? `${examScoreColor}18` : 'rgba(255,255,255,0.06)',
                border: `1px solid ${examScorePct !== null ? examScoreColor + '40' : 'var(--color-border)'}`,
                color: examScoreColor,
                borderRadius: '999px', padding: '1px 10px',
                fontSize: '0.75rem',
              }}>
                {correctAnswers !== null ? `${correctAnswers} / ${totalQuestions} correct` : '—'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {answerReview.map((item, idx) => (
                <div key={item.questionId} style={{
                  padding: '16px 18px',
                  borderBottom: idx < answerReview.length - 1 ? '1px solid var(--color-border)' : 'none',
                }}>
                  {/* Question */}
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                      background: item.isCorrect ? 'rgba(34,197,94,0.15)'
                        : !item.isAnswered ? 'rgba(255,255,255,0.06)'
                        : 'rgba(239,68,68,0.15)',
                      color: item.isCorrect ? '#22c55e'
                        : !item.isAnswered ? 'var(--color-on-surface-muted)'
                        : '#ef4444',
                      fontSize: '0.72rem', fontWeight: 700,
                    }}>{idx + 1}</span>
                    <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--color-on-surface)', fontWeight: 500, lineHeight: 1.5, flex: 1 }}>
                      {item.questionText}
                    </p>
                    <span style={{
                      flexShrink: 0,
                      padding: '2px 10px', borderRadius: '999px',
                      fontSize: '0.7rem', fontWeight: 700,
                      background: item.isCorrect ? 'rgba(34,197,94,0.12)'
                        : !item.isAnswered ? 'rgba(255,255,255,0.06)'
                        : 'rgba(239,68,68,0.12)',
                      color: item.isCorrect ? '#22c55e'
                        : !item.isAnswered ? 'var(--color-on-surface-muted)'
                        : '#ef4444',
                      border: `1px solid ${item.isCorrect ? 'rgba(34,197,94,0.3)' : !item.isAnswered ? 'var(--color-border)' : 'rgba(239,68,68,0.3)'}`,
                    }}>
                      {item.isCorrect ? '✓ Correct' : !item.isAnswered ? '— Skipped' : '✗ Wrong'}
                    </span>
                  </div>

                  {/* Options */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '34px' }}>
                    {(item.options || []).map((opt, oi) => {
                      const isChosen = item.chosenIndex === oi;
                      const isCorrectOpt = item.correctIndex === oi;
                      let bg = 'transparent';
                      let border = 'var(--color-border)';
                      let color = 'var(--color-on-surface-muted)';
                      let icon = null;

                      if (isCorrectOpt) {
                        bg = 'rgba(34,197,94,0.08)';
                        border = 'rgba(34,197,94,0.35)';
                        color = '#22c55e';
                        icon = <CheckCircle2 size={13} color="#22c55e" style={{ flexShrink: 0 }} />;
                      }
                      if (isChosen && !isCorrectOpt) {
                        bg = 'rgba(239,68,68,0.08)';
                        border = 'rgba(239,68,68,0.35)';
                        color = '#ef4444';
                        icon = <XCircle size={13} color="#ef4444" style={{ flexShrink: 0 }} />;
                      }
                      if (!isChosen && !isCorrectOpt) {
                        icon = <Circle size={13} color="var(--color-on-surface-muted)" style={{ flexShrink: 0, opacity: 0.5 }} />;
                      }

                      return (
                        <div key={oi} style={{
                          display: 'flex', alignItems: 'center', gap: '8px',
                          padding: '7px 12px',
                          border: `1px solid ${border}`,
                          borderRadius: '8px',
                          background: bg,
                          color,
                          fontSize: '0.82rem',
                          fontWeight: isCorrectOpt || isChosen ? 600 : 400,
                          transition: 'all 0.15s',
                        }}>
                          {icon}
                          <span>{String.fromCharCode(65 + oi)}. {opt}</span>
                          {isCorrectOpt && isChosen && (
                            <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: '#22c55e', fontWeight: 700 }}>Your answer ✓</span>
                          )}
                          {isCorrectOpt && !isChosen && (
                            <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: '#22c55e', fontWeight: 700 }}>Correct answer</span>
                          )}
                          {isChosen && !isCorrectOpt && (
                            <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: '#ef4444', fontWeight: 700 }}>Your answer</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Anomaly breakdown by type */}
        {Object.keys(byType).length > 0 && (
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--color-border)',
            borderRadius: '14px', overflow: 'hidden',
            marginBottom: '20px',
          }}>
            <div style={{
              padding: '12px 18px', borderBottom: '1px solid var(--color-border)',
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'rgba(255,255,255,0.01)',
            }}>
              <TrendingDown size={15} color="var(--color-danger)" />
              <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-on-surface)' }}>
                Penalty Breakdown
              </span>
            </div>
            <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {Object.entries(byType).map(([type, count]) => {
                const meta = FLAG_META[type] || { label: type, color: '#f59e0b', penalty: 2.5 };
                const Icon = meta.icon || AlertTriangle;
                const totalPenalty = meta.penalty * count;
                return (
                  <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Icon size={15} color={meta.color} style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.82rem', color: 'var(--color-on-surface)', fontWeight: 500 }}>{meta.label}</span>
                        <span style={{ fontSize: '0.78rem', color: meta.color, fontWeight: 600 }}>
                          {count}× · -{totalPenalty.toFixed(1)} pts
                        </span>
                      </div>
                      <div style={{ height: 4, background: 'var(--color-border)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', width: `${Math.min(100, totalPenalty)}%`,
                          background: meta.color, borderRadius: '2px',
                          transition: 'width 0.6s ease',
                        }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Anomaly timeline */}
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid var(--color-border)',
          borderRadius: '14px', overflow: 'hidden',
        }}>
          <div style={{
            padding: '12px 18px', borderBottom: '1px solid var(--color-border)',
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'rgba(255,255,255,0.01)',
          }}>
            <Activity size={15} color="var(--color-primary)" />
            <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-on-surface)' }}>
              Anomaly Timeline
            </span>
            <span style={{
              marginLeft: 'auto',
              background: 'rgba(255,255,255,0.06)',
              borderRadius: '999px', padding: '1px 10px',
              fontSize: '0.72rem', color: 'var(--color-on-surface-muted)',
            }}>
              {anomaly_timeline?.length || 0} events
            </span>
          </div>

          {(!anomaly_timeline || anomaly_timeline.length === 0) ? (
            <div style={{
              padding: '32px', textAlign: 'center',
              color: '#22c55e', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
            }}>
              <CheckCircle2 size={32} />
              <div style={{ fontWeight: 600 }}>No anomalies detected</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--color-on-surface-muted)' }}>This exam session maintained perfect integrity throughout.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {anomaly_timeline.map((anomaly, idx) => {
                const meta = FLAG_META[anomaly.flag_type] || { label: anomaly.flag_type, color: '#f59e0b', penalty: 2.5, description: '' };
                const Icon = meta.icon || AlertTriangle;
                const deduction = (meta.penalty * anomaly.confidence_score).toFixed(2);
                return (
                  <div key={anomaly.log_id || idx} style={{
                    display: 'flex', gap: '14px', padding: '14px 18px',
                    borderBottom: idx < anomaly_timeline.length - 1 ? '1px solid var(--color-border)' : 'none',
                    alignItems: 'flex-start',
                    transition: 'background 0.15s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    {/* Timeline dot */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, flexShrink: 0, paddingTop: 2 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: `${meta.color}18`,
                        border: `1px solid ${meta.color}40`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Icon size={13} color={meta.color} />
                      </div>
                      {idx < anomaly_timeline.length - 1 && (
                        <div style={{ width: 1, height: '100%', minHeight: 20, background: 'var(--color-border)', marginTop: 4 }} />
                      )}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem', color: meta.color }}>{meta.label}</span>
                        <span style={{
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: '0.75rem', color: 'var(--color-on-surface-muted)',
                        }}>
                          {formatTimestamp(anomaly.timestamp)}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-on-surface-muted)', marginBottom: '6px' }}>
                        {anomaly.details || meta.description}
                      </div>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: '999px',
                          background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)',
                          fontSize: '0.7rem', color: 'var(--color-on-surface-muted)',
                        }}>
                          Confidence: {(anomaly.confidence_score * 100).toFixed(0)}%
                        </span>
                        <span style={{
                          padding: '2px 8px', borderRadius: '999px',
                          background: `${meta.color}12`, border: `1px solid ${meta.color}30`,
                          fontSize: '0.7rem', color: meta.color, fontWeight: 600,
                        }}>
                          -{deduction} trust pts
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer note */}
        <div style={{
          marginTop: '20px', padding: '14px 18px',
          background: 'rgba(124,111,255,0.05)',
          border: '1px solid rgba(124,111,255,0.15)',
          borderRadius: '12px',
          fontSize: '0.78rem', color: 'var(--color-on-surface-muted)', lineHeight: 1.6,
        }}>
          <strong style={{ color: 'var(--color-primary)' }}>EduShield AI Privacy Notice:</strong>{' '}
          This report was generated using on-device face detection. No video recordings were transmitted or stored. 
          Anomaly data is processed locally and only metadata is sent to our secure servers.
        </div>
      </div>

      <AccessibilityToolbar />

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media print {
          nav, .accessibility-toolbar { display: none !important; }
          body { background: white !important; color: black !important; }
        }
      `}</style>
    </div>
  );
}
