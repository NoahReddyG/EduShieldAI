import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Camera, CameraOff, Clock, Send, AlertTriangle,
  Users, Eye, EyeOff, Wand2, CheckCircle2, Circle,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import TrustScoreBadge from '../components/TrustScoreBadge';
import AccessibilityToolbar from '../components/AccessibilityToolbar';
import TextSimplifierModal from '../components/TextSimplifierModal';
import { getStoredUser } from '../services/authService';
import { logAnomaly, closeSession } from '../services/proctoringService';
import { getTestById, saveTestResult } from '../services/testService';
import { useAccessibility } from '../hooks/useAccessibility';

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src; s.crossOrigin = 'anonymous';
    s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });
}

const COOLDOWN_MS = { GAZE_OFFSCREEN: 5000, MULTIPLE_FACES: 8000, NO_FACE_DETECTED: 6000 };
const PENALTY = { GAZE_OFFSCREEN: 2.5, MULTIPLE_FACES: 15.0, NO_FACE_DETECTED: 5.0 };
const ANOMALY_LABELS = {
  GAZE_OFFSCREEN: { label: 'Gaze Off-Screen', color: '#f59e0b', icon: Eye },
  MULTIPLE_FACES: { label: 'Multiple Faces', color: '#ef4444', icon: Users },
  NO_FACE_DETECTED: { label: 'No Face Detected', color: '#f59e0b', icon: EyeOff },
};

export default function ExamPage() {
  const navigate = useNavigate();
  const { testId } = useParams();
  const user = getStoredUser();
  const { speak } = useAccessibility();

  const [test, setTest] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [notFound, setNotFound] = useState(false);

  const [trustScore, setTrustScore] = useState(100);
  const [timeLeft, setTimeLeft] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [anomalyLog, setAnomalyLog] = useState([]);

  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [mediapipeReady, setMediapipeReady] = useState(false);
  const [currentAnomalyType, setCurrentAnomalyType] = useState(null);

  const [simplifierOpen, setSimplifierOpen] = useState(false);
  const [selectedText, setSelectedText] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const sessionRef = useRef(null);
  const trustRef = useRef(100);
  const cooldownRef = useRef({});
  const faceMeshRef = useRef(null);
  const cameraRef = useRef(null);
  const anomalyTimerRef = useRef(null);
  const submittedRef = useRef(false);

  useEffect(() => {
    if (!user) { navigate('/'); return; }

    const loaded = getTestById(testId);
    if (!loaded) { setNotFound(true); return; }
    setTest(loaded);
    setTimeLeft((loaded.duration || 30) * 60);

    try {
      const stored = JSON.parse(localStorage.getItem(`edushield_active_session_${testId}`) || 'null');
      if (stored?.sessionId) {
        setSessionId(stored.sessionId);
        sessionRef.current = stored.sessionId;
        setTrustScore(100);
        trustRef.current = 100;
      }
    } catch {
      const fallback = Date.now();
      setSessionId(fallback);
      sessionRef.current = fallback;
    }
    
  }, [testId]);

  useEffect(() => {
    if (!test || submitted || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { handleSubmit(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
    
  }, [test, submitted]);

  useEffect(() => {
    if (!test) return;
    let cancelled = false;

    const setup = async () => {
      try {
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js');
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
        if (cancelled || !window.FaceMesh || !window.Camera) return;

        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }

        videoRef.current.srcObject = stream;
        setCameraReady(true);

        const mesh = new window.FaceMesh({
          locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}`,
        });
        mesh.setOptions({ maxNumFaces: 3, refineLandmarks: false, minDetectionConfidence: 0.55, minTrackingConfidence: 0.55 });
        mesh.onResults(handleFaceResults);
        faceMeshRef.current = mesh;

        const cam = new window.Camera(videoRef.current, {
          onFrame: async () => {
            if (faceMeshRef.current && videoRef.current?.readyState >= 2) {
              await faceMeshRef.current.send({ image: videoRef.current });
            }
          },
          width: 320, height: 240,
        });
        cam.start();
        cameraRef.current = cam;
        setMediapipeReady(true);
      } catch (err) {
        console.error('Camera/MediaPipe error:', err);
        setCameraError(err.message || 'Camera access denied');
      }
    };

    setup();
    return () => {
      cancelled = true;
      cameraRef.current?.stop?.();
      faceMeshRef.current?.close?.();
      videoRef.current?.srcObject?.getTracks().forEach(t => t.stop());
    };
    
  }, [test]);

  const handleFaceResults = useCallback((results) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 240;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const faces = results.multiFaceLandmarks || [];
    faces.forEach(landmarks => {
      const pts = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
        397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];
      ctx.beginPath();
      pts.forEach((idx, i) => {
        const lm = landmarks[idx];
        if (i === 0) ctx.moveTo(lm.x * canvas.width, lm.y * canvas.height);
        else ctx.lineTo(lm.x * canvas.width, lm.y * canvas.height);
      });
      ctx.closePath();
      ctx.strokeStyle = faces.length > 1 ? '#ef4444' : '#7c6fff';
      ctx.lineWidth = 2;
      ctx.shadowColor = ctx.strokeStyle;
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0;
      [33, 263, 1, 61, 291].forEach(idx => {
        const lm = landmarks[idx];
        ctx.beginPath();
        ctx.arc(lm.x * canvas.width, lm.y * canvas.height, 2, 0, 2 * Math.PI);
        ctx.fillStyle = '#22d3ee'; ctx.fill();
      });
    });

    if (submittedRef.current) return;
    const now = Date.now();
    if (faces.length === 0) {
      triggerAnomaly('NO_FACE_DETECTED', 0.9, 'No face in frame', now);
    } else if (faces.length > 1) {
      triggerAnomaly('MULTIPLE_FACES', 1.0, `${faces.length} faces detected`, now);
    } else {
      const nose = faces[0][1];
      const dist = Math.abs(nose.x - 0.5);
      if (dist > 0.28) {
        const conf = Math.min(1.0, (dist - 0.28) / 0.2 + 0.7);
        triggerAnomaly('GAZE_OFFSCREEN', conf, `Gaze deflected ${nose.x < 0.5 ? 'left' : 'right'}`, now);
      } else {
        setCurrentAnomalyType(null);
      }
    }
  }, []);

  const triggerAnomaly = useCallback(async (flagType, confidence, details, now) => {
    const last = cooldownRef.current[flagType] || 0;
    if (now - last < (COOLDOWN_MS[flagType] || 5000)) return;
    cooldownRef.current[flagType] = now;
    setCurrentAnomalyType(flagType);
    clearTimeout(anomalyTimerRef.current);
    anomalyTimerRef.current = setTimeout(() => setCurrentAnomalyType(null), 2500);

    const sid = sessionRef.current;
    if (!sid) return;
    try {
      await logAnomaly(sid, flagType, confidence, details);
    } catch { /* offline fallback */ }

    const deduction = (PENALTY[flagType] || 2.0) * confidence;
    const next = Math.max(0, trustRef.current - deduction);
    trustRef.current = next;
    setTrustScore(next);
    setAnomalyLog(prev => [...prev, { id: Date.now(), type: flagType, confidence, details, time: new Date().toLocaleTimeString() }]);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (submittedRef.current || submitting) return;
    submittedRef.current = true;
    setSubmitted(true);
    setSubmitting(true);

    const finalScore = trustRef.current;
    const sid = sessionRef.current;

    try { await closeSession(sid, 'COMPLETED'); } catch { /* offline */ }

    if (test) {
      const questions = test.questions || [];
      
      const answerReview = questions.map(q => {
        const chosen = answers[q.id];
        const isAnswered = chosen !== undefined;
        const isCorrect = isAnswered && chosen === q.correct;
        return {
          questionId: q.id,
          questionText: q.text,
          options: q.options,
          correctIndex: q.correct,
          chosenIndex: chosen ?? null,
          isCorrect,
          isAnswered,
        };
      });
      const correctAnswers = answerReview.filter(a => a.isCorrect).length;
      const totalQuestions = questions.length;
      const attemptedQuestions = answerReview.filter(a => a.isAnswered).length;

      saveTestResult({
        testId: test.id,
        sessionId: sid,
        studentEmail: user?.email || 'student@university.edu',
        studentId: user?.user_id || 1,
        trustScore: finalScore,
        status: finalScore < 60 ? 'FLAGGED' : 'COMPLETED',
        examTitle: test.title,
        anomalyCount: anomalyLog.length,
        answers,
        
        correctAnswers,
        totalQuestions,
        attemptedQuestions,
        answerReview,
      });
      
      localStorage.removeItem(`edushield_active_session_${test.id}`);
    }

    cameraRef.current?.stop?.();
    setSubmitting(false);
    navigate(`/report/${sid}`);
  }, [submitting, test, user, answers, anomalyLog.length, navigate]);

  const formatTime = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const handleTextSelection = () => {
    const sel = window.getSelection()?.toString().trim();
    if (sel && sel.length > 20) setSelectedText(sel);
  };

  const handleSimplify = () => {
    const sel = window.getSelection()?.toString().trim();
    if (sel && sel.length > 20) setSelectedText(sel);
    setSimplifierOpen(true);
  };

  if (notFound) {
    return (
      <div style={{ minHeight: '100svh', background: 'var(--color-surface)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
        <AlertTriangle size={40} color="#ef4444" />
        <div style={{ color: '#ef4444', fontWeight: 600 }}>Test not found</div>
        <button onClick={() => navigate('/student')} style={{ padding: '8px 20px', background: 'var(--color-primary)', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (!test) {
    return (
      <div style={{ minHeight: '100svh', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--color-on-surface-muted)' }}>Loading exam...</div>
      </div>
    );
  }

  const questions = test.questions || [];
  const isLowTime = timeLeft < 300;
  const isFlagged = trustScore < 60;
  const activeAnomaly = currentAnomalyType && ANOMALY_LABELS[currentAnomalyType];

  return (
    <div style={{ height: '100svh', background: 'var(--color-surface)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Navbar trustScore={trustScore} examTitle={test.title} />

      {/* Flagged banner */}
      {isFlagged && (
        <div style={{
          background: 'rgba(239,68,68,0.12)', borderBottom: '1px solid rgba(239,68,68,0.3)',
          padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
          color: '#ef4444', fontWeight: 700, fontSize: '0.85rem',
          animation: 'flagPulse 2s ease-in-out infinite',
        }}>
          <AlertTriangle size={16} />
          SESSION FLAGGED — Trust score dropped below 60%
        </div>
      )}

      {/* Anomaly toast */}
      {activeAnomaly && (
        <div style={{
          position: 'fixed', top: '70px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 80,
          background: `${activeAnomaly.color}18`, border: `1px solid ${activeAnomaly.color}50`,
          color: activeAnomaly.color, padding: '8px 20px', borderRadius: '999px',
          display: 'flex', alignItems: 'center', gap: '8px',
          fontSize: '0.82rem', fontWeight: 700, backdropFilter: 'blur(12px)',
          animation: 'anomalySlide 0.3s ease',
          boxShadow: `0 4px 20px ${activeAnomaly.color}30`,
        }}>
          <AlertTriangle size={14} />
          {activeAnomaly.label} Detected
        </div>
      )}

      {/* Main layout: content | proctoring sidebar */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 340px', minHeight: 0, overflow: 'hidden' }}>

        {/* ── LEFT: exam content ─────────────────────────────────────────── */}
        <div style={{ overflowY: 'auto', overflowX: 'hidden', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>

          {/* Timer bar */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px',
            background: 'rgba(255,255,255,0.02)', border: '1px solid var(--color-border)', borderRadius: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-on-surface-muted)', fontSize: '0.85rem' }}>
              <Clock size={15} color={isLowTime ? '#ef4444' : 'var(--color-on-surface-muted)'} style={{ animation: isLowTime ? 'pulse 1s infinite' : 'none' }} />
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: '1rem', color: isLowTime ? '#ef4444' : 'var(--color-on-surface)' }}>
                {formatTime(timeLeft)}
              </span>
              <span>remaining</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--color-on-surface-muted)' }}>
                {Object.keys(answers).length}/{questions.length} answered
              </span>
              <button onClick={handleSubmit} disabled={submitting} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px',
                background: 'linear-gradient(135deg, var(--color-primary), #a78bfa)',
                border: 'none', borderRadius: '8px',
                color: '#fff', fontWeight: 600, fontSize: '0.82rem',
                cursor: submitting ? 'wait' : 'pointer',
                boxShadow: '0 2px 12px rgba(124,111,255,0.4)',
              }}>
                <Send size={13} />
                {submitting ? 'Submitting...' : 'Submit Test'}
              </button>
            </div>
          </div>

          {/* Reading passage */}
          {test.passage && (
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--color-border)', borderRadius: '14px', overflow: 'hidden' }}>
              <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)' }}>
                <span style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--color-on-surface)' }}>📖 Reading Passage</span>
                <button onClick={handleSimplify} style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  padding: '5px 12px',
                  background: 'rgba(124,111,255,0.12)', border: '1px solid rgba(124,111,255,0.3)',
                  borderRadius: '999px', color: 'var(--color-primary)', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer',
                }}>
                  <Wand2 size={11} /> Simplify with AI
                </button>
              </div>
              <p onMouseUp={handleTextSelection} style={{ padding: '16px 20px', margin: 0, fontSize: '0.9rem', lineHeight: 'var(--a11y-line-height, 1.8)', color: 'var(--color-on-surface)', userSelect: 'text', cursor: 'text' }}>
                {test.passage}
              </p>
              <div style={{ padding: '8px 20px', background: 'rgba(124,111,255,0.05)', borderTop: '1px solid var(--color-border)', fontSize: '0.7rem', color: 'var(--color-on-surface-muted)', fontStyle: 'italic' }}>
                Tip: Highlight text, then click "Simplify with AI" for dyslexia-friendly formatting
              </div>
            </div>
          )}

          {/* Questions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {questions.map((q, qi) => (
              <div key={q.id || qi} style={{
                background: 'rgba(255,255,255,0.02)',
                border: `1px solid ${answers[q.id] !== undefined ? 'rgba(124,111,255,0.3)' : 'var(--color-border)'}`,
                borderRadius: '14px', overflow: 'hidden', transition: 'border-color 0.2s',
              }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--color-border)', background: answers[q.id] !== undefined ? 'rgba(124,111,255,0.05)' : 'rgba(255,255,255,0.01)' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                      background: answers[q.id] !== undefined ? 'var(--color-primary)' : 'rgba(255,255,255,0.06)',
                      color: answers[q.id] !== undefined ? '#fff' : 'var(--color-on-surface-muted)',
                      fontSize: '0.72rem', fontWeight: 700,
                    }}>{qi + 1}</span>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-on-surface)', fontWeight: 500, lineHeight: 1.5 }}>
                      {q.text}
                    </p>
                  </div>
                </div>
                <div style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(q.options || []).map((opt, oi) => {
                    const isSelected = answers[q.id] === oi;
                    return (
                      <button key={oi} onClick={() => setAnswers(a => ({ ...a, [q.id]: oi }))} style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '10px 14px',
                        border: `1px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        borderRadius: '10px',
                        background: isSelected ? 'rgba(124,111,255,0.1)' : 'transparent',
                        cursor: 'pointer', color: isSelected ? 'var(--color-primary)' : 'var(--color-on-surface)',
                        fontSize: '0.86rem', textAlign: 'left', transition: 'all 0.15s',
                      }}
                        onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}>
                        {isSelected ? <CheckCircle2 size={16} color="var(--color-primary)" style={{ flexShrink: 0 }} /> : <Circle size={16} color="var(--color-on-surface-muted)" style={{ flexShrink: 0 }} />}
                        <span>{String.fromCharCode(65 + oi)}. {opt}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT: proctoring sidebar ──────────────────────────────────── */}
        <div style={{ borderLeft: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.01)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px 16px' }}>

          {/* Camera */}
          <div style={{
            border: `2px solid ${isFlagged ? 'rgba(239,68,68,0.5)' : currentAnomalyType ? '#f59e0b' : 'rgba(124,111,255,0.3)'}`,
            borderRadius: '14px', overflow: 'hidden', position: 'relative', background: '#000', aspectRatio: '4/3',
            boxShadow: isFlagged ? '0 0 20px rgba(239,68,68,0.3)' : '0 0 16px rgba(124,111,255,0.15)',
          }}>
            <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', display: cameraReady ? 'block' : 'none', transform: 'scaleX(-1)' }} />
            <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', transform: 'scaleX(-1)' }} />
            {!cameraReady && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--color-on-surface-muted)' }}>
                {cameraError ? <><CameraOff size={32} color="#ef4444" /><span style={{ fontSize: '0.75rem', color: '#ef4444', textAlign: 'center', padding: '0 12px' }}>{cameraError}</span></> : <><Camera size={32} /><span style={{ fontSize: '0.75rem' }}>Starting camera...</span></>}
              </div>
            )}
            {cameraReady && <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.7)', borderRadius: '999px', padding: '3px 10px', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.68rem', fontWeight: 700, color: '#22c55e' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'liveDot 1.5s ease-in-out infinite' }} />LIVE
            </div>}
            {cameraReady && !mediapipeReady && <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.75)', borderRadius: '999px', padding: '3px 10px', fontSize: '0.65rem', color: '#f59e0b', whiteSpace: 'nowrap' }}>Loading face detection...</div>}
          </div>

          {/* Trust score */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--color-border)', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-on-surface-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px', fontWeight: 600 }}>Integrity Score</div>
            <TrustScoreBadge score={trustScore} />
          </div>

          {/* Anomaly log */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--color-border)', borderRadius: '14px', overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-on-surface)' }}>Anomaly Log</span>
              <span style={{ background: anomalyLog.length > 0 ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)', color: anomalyLog.length > 0 ? '#ef4444' : '#22c55e', borderRadius: '999px', padding: '1px 8px', fontSize: '0.7rem', fontWeight: 700 }}>
                {anomalyLog.length} events
              </span>
            </div>
            <div style={{ maxHeight: '160px', overflowY: 'auto' }}>
              {anomalyLog.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--color-on-surface-muted)', fontSize: '0.75rem' }}>✓ No anomalies detected</div>
              ) : anomalyLog.slice(-5).reverse().map(ev => {
                const meta = ANOMALY_LABELS[ev.type] || { label: ev.type, color: '#f59e0b' };
                return (
                  <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', borderBottom: '1px solid var(--color-border)', fontSize: '0.72rem' }}>
                    <span style={{ color: meta.color, flexShrink: 0 }}>●</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: 'var(--color-on-surface)', fontWeight: 600 }}>{meta.label}</div>
                      <div style={{ color: 'var(--color-on-surface-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.details}</div>
                    </div>
                    <span style={{ color: 'var(--color-on-surface-muted)', flexShrink: 0 }}>{ev.time}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Proctoring rules */}
          <div style={{ background: 'rgba(124,111,255,0.05)', border: '1px solid rgba(124,111,255,0.2)', borderRadius: '12px', padding: '14px', fontSize: '0.72rem', color: 'var(--color-on-surface-muted)', lineHeight: 1.6 }}>
            <div style={{ fontWeight: 600, color: 'var(--color-primary)', marginBottom: '6px' }}>📋 Proctoring Rules</div>
            <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li>Keep face visible in camera at all times</li>
              <li>Only one person allowed in frame</li>
              <li>Do not look away for more than 5 seconds</li>
              <li>Trust score deductions are automatic</li>
            </ul>
          </div>
        </div>
      </div>

      <AccessibilityToolbar onSimplifyRequest={handleSimplify} />

      <TextSimplifierModal
        isOpen={simplifierOpen}
        onClose={() => setSimplifierOpen(false)}
        selectedText={selectedText}
      />

      <style>{`
        @keyframes flagPulse { 0%,100% { opacity:.9; } 50% { opacity:1; } }
        @keyframes anomalySlide { from { opacity:0; transform:translateX(-50%) translateY(-10px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }
        @keyframes liveDot { 0%,100% { opacity:1; } 50% { opacity:.4; } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.5; } }
      `}</style>
    </div>
  );
}
