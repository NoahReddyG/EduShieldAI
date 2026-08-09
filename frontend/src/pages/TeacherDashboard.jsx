import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Trash2, BookOpen, Users, CheckCircle2, Clock,
  ChevronDown, ChevronUp, ExternalLink, BarChart3, Loader2,
  ClipboardList, PenLine, AlertTriangle, TrendingUp, FileText,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import AccessibilityToolbar from '../components/AccessibilityToolbar';
import TrustScoreBadge from '../components/TrustScoreBadge';
import { getStoredUser } from '../services/authService';
import {
  createTest, getTeacherTests, getAllTests, getTestResults,
  getTrustLabel, getTrustColor,
} from '../services/testService';

const CARD = {
  background: 'rgba(255,255,255,0.02)',
  border: '1px solid var(--color-border)',
  borderRadius: '16px',
  overflow: 'hidden',
};

const INPUT_STYLE = {
  width: '100%',
  padding: '10px 14px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid var(--color-border)',
  borderRadius: '10px',
  color: 'var(--color-on-surface)',
  fontSize: '0.88rem',
  outline: 'none',
  transition: 'border-color 0.2s',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
};

const LABEL_STYLE = {
  display: 'block',
  fontSize: '0.72rem',
  color: 'var(--color-on-surface-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  fontWeight: 600,
  marginBottom: '6px',
};

const DEFAULT_QUESTION = {
  text: '',
  options: ['', '', '', ''],
  correct: 0,
};

function StatusBadge({ score }) {
  const label = getTrustLabel(score);
  const color = getTrustColor(score);
  return (
    <span style={{
      padding: '2px 10px', borderRadius: '999px',
      background: `${color}15`, border: `1px solid ${color}35`,
      color, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em',
    }}>
      {label}
    </span>
  );
}

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const [activeTab, setActiveTab] = useState('create');
  const [myTests, setMyTests] = useState([]);
  const [expandedTest, setExpandedTest] = useState(null);
  const [creating, setCreating] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(null);

  const [form, setForm] = useState({
    title: '',
    topic: '',
    duration: 30,
    description: '',
    instructions: 'Read all questions carefully. Your face must remain visible to the camera at all times.',
    passage: '',
  });

  const [questions, setQuestions] = useState([
    { id: Date.now(), ...DEFAULT_QUESTION },
  ]);

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    setMyTests(user.role === 'FACULTY' ? getAllTests() : []);
    
  }, []);

  const addQuestion = () => {
    setQuestions(prev => [...prev, { id: Date.now(), ...DEFAULT_QUESTION }]);
  };

  const removeQuestion = (id) => {
    if (questions.length <= 1) return;
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  const updateQuestion = (id, text) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, text } : q));
  };

  const updateOption = (id, idx, value) => {
    setQuestions(prev => prev.map(q => {
      if (q.id !== id) return q;
      const opts = [...q.options];
      opts[idx] = value;
      return { ...q, options: opts };
    }));
  };

  const setCorrect = (id, idx) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, correct: idx } : q));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    if (questions.some(q => !q.text.trim())) {
      alert('Please fill in all question texts.');
      return;
    }

    setCreating(true);
    await new Promise(r => setTimeout(r, 400)); 

    const test = createTest({
      ...form,
      duration: Number(form.duration),
      questions: questions.map((q, i) => ({
        id: i + 1,
        text: q.text,
        options: q.options,
        correct: q.correct,
      })),
      createdBy: user.email,
    });

    setMyTests(getAllTests());
    setCreateSuccess(test.title);
    setCreating(false);
    setActiveTab('results');

    setForm({ title: '', topic: '', duration: 30, description: '', instructions: 'Read all questions carefully. Your face must remain visible to the camera at all times.', passage: '' });
    setQuestions([{ id: Date.now(), ...DEFAULT_QUESTION }]);
  };

  const totalTests = myTests.length;
  const allResults = myTests.flatMap(t => getTestResults(t.id));
  const totalStudents = allResults.length;
  const avgScore = totalStudents > 0
    ? Math.round(allResults.reduce((s, r) => s + r.trustScore, 0) / totalStudents)
    : null;

  return (
    <div style={{ minHeight: '100svh', background: 'var(--color-surface)', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <div style={{ flex: 1, maxWidth: 1100, width: '100%', margin: '0 auto', padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-on-surface)' }}>
              Teacher Dashboard
            </h1>
            <p style={{ margin: '4px 0 0', color: 'var(--color-on-surface-muted)', fontSize: '0.85rem' }}>
              Assign tests, track student integrity, and review results
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {[
            { label: 'Active Tests', value: totalTests, icon: ClipboardList, color: 'var(--color-primary)' },
            { label: 'Submissions', value: totalStudents, icon: Users, color: '#22c55e' },
            { label: 'Avg Trust Score', value: avgScore !== null ? `${avgScore}%` : '—', icon: TrendingUp, color: avgScore >= 70 ? '#22c55e' : '#f59e0b' },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} style={{ ...CARD, padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Icon size={15} color={s.color} />
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-on-surface-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>
                    {s.label}
                  </span>
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: s.color }}>{s.value}</div>
              </div>
            );
          })}
        </div>

        {/* Success banner */}
        {createSuccess && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '14px 18px',
            background: 'rgba(34,197,94,0.1)',
            border: '1px solid rgba(34,197,94,0.3)',
            borderRadius: '12px',
            color: '#22c55e', fontSize: '0.88rem', fontWeight: 600,
            animation: 'fadeIn 0.3s ease',
          }}>
            <CheckCircle2 size={18} />
            Test "{createSuccess}" created and published successfully!
            <button onClick={() => setCreateSuccess(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#22c55e', cursor: 'pointer', fontSize: '1.1rem' }}>×</button>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', padding: '4px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--color-border)', width: 'fit-content' }}>
          {[
            { id: 'create', label: 'Create Test', icon: PenLine },
            { id: 'results', label: 'My Tests & Results', icon: BarChart3 },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                padding: '8px 18px',
                borderRadius: '9px',
                border: 'none',
                background: active ? 'var(--color-primary)' : 'transparent',
                color: active ? '#fff' : 'var(--color-on-surface-muted)',
                fontWeight: active ? 700 : 500,
                fontSize: '0.85rem', cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: active ? '0 2px 12px rgba(124,111,255,0.4)' : 'none',
              }}>
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── TAB: CREATE TEST ──────────────────────────────────────────────── */}
        {activeTab === 'create' && (
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Test details */}
            <div style={CARD}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(124,111,255,0.04)' }}>
                <FileText size={16} color="var(--color-primary)" />
                <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--color-on-surface)' }}>Test Details</span>
              </div>
              <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={LABEL_STYLE}>Test Title *</label>
                  <input
                    style={INPUT_STYLE} required
                    value={form.title} placeholder="e.g., CS401: AI Midterm Examination"
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    onFocus={e => e.target.style.borderColor = 'var(--color-border-focus)'}
                    onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                  />
                </div>
                <div>
                  <label style={LABEL_STYLE}>Topic / Subject *</label>
                  <input
                    style={INPUT_STYLE} required
                    value={form.topic} placeholder="e.g., Artificial Intelligence"
                    onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
                    onFocus={e => e.target.style.borderColor = 'var(--color-border-focus)'}
                    onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                  />
                </div>
                <div>
                  <label style={LABEL_STYLE}>Duration (minutes) *</label>
                  <input
                    style={INPUT_STYLE} type="number" min={5} max={180} required
                    value={form.duration}
                    onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                    onFocus={e => e.target.style.borderColor = 'var(--color-border-focus)'}
                    onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={LABEL_STYLE}>Description</label>
                  <textarea
                    style={{ ...INPUT_STYLE, resize: 'vertical', minHeight: '72px' }}
                    value={form.description} placeholder="Brief overview of what this test covers..."
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    onFocus={e => e.target.style.borderColor = 'var(--color-border-focus)'}
                    onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={LABEL_STYLE}>Student Instructions</label>
                  <textarea
                    style={{ ...INPUT_STYLE, resize: 'vertical', minHeight: '72px' }}
                    value={form.instructions}
                    onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))}
                    onFocus={e => e.target.style.borderColor = 'var(--color-border-focus)'}
                    onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={LABEL_STYLE}>Reading Passage (optional — students can AI-simplify this)</label>
                  <textarea
                    style={{ ...INPUT_STYLE, resize: 'vertical', minHeight: '100px' }}
                    value={form.passage} placeholder="Paste a reading passage for comprehension questions..."
                    onChange={e => setForm(f => ({ ...f, passage: e.target.value }))}
                    onFocus={e => e.target.style.borderColor = 'var(--color-border-focus)'}
                    onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                  />
                </div>
              </div>
            </div>

            {/* Question builder */}
            <div style={CARD}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(124,111,255,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BookOpen size={16} color="var(--color-primary)" />
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--color-on-surface)' }}>
                    Questions ({questions.length})
                  </span>
                </div>
                <button type="button" onClick={addQuestion} style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '6px 14px',
                  background: 'rgba(124,111,255,0.12)',
                  border: '1px solid rgba(124,111,255,0.3)',
                  borderRadius: '8px',
                  color: 'var(--color-primary)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                }}>
                  <Plus size={13} /> Add Question
                </button>
              </div>

              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {questions.map((q, qi) => (
                  <div key={q.id} style={{
                    border: '1px solid var(--color-border)',
                    borderRadius: '12px', overflow: 'hidden',
                    background: 'rgba(255,255,255,0.01)',
                  }}>
                    {/* Q header */}
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: 'rgba(255,255,255,0.02)',
                      borderBottom: '1px solid var(--color-border)',
                    }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 26, height: 26, borderRadius: '50%',
                        background: 'var(--color-primary)', color: '#fff',
                        fontSize: '0.75rem', fontWeight: 700,
                      }}>{qi + 1}</span>
                      <button
                        type="button" onClick={() => removeQuestion(q.id)}
                        disabled={questions.length <= 1}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '4px',
                          padding: '4px 10px',
                          background: questions.length <= 1 ? 'transparent' : 'rgba(239,68,68,0.08)',
                          border: `1px solid ${questions.length <= 1 ? 'transparent' : 'rgba(239,68,68,0.2)'}`,
                          borderRadius: '6px', color: '#ef4444',
                          fontSize: '0.72rem', cursor: questions.length <= 1 ? 'not-allowed' : 'pointer',
                          opacity: questions.length <= 1 ? 0.3 : 1,
                        }}>
                        <Trash2 size={12} /> Remove
                      </button>
                    </div>

                    {/* Q body */}
                    <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <label style={LABEL_STYLE}>Question Text *</label>
                        <textarea
                          required
                          style={{ ...INPUT_STYLE, resize: 'vertical', minHeight: '64px' }}
                          value={q.text}
                          placeholder={`Enter question ${qi + 1} here...`}
                          onChange={e => updateQuestion(q.id, e.target.value)}
                          onFocus={e => e.target.style.borderColor = 'var(--color-border-focus)'}
                          onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                        />
                      </div>
                      <div>
                        <label style={LABEL_STYLE}>Answer Options (click ○ to mark correct)</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {q.options.map((opt, oi) => {
                            const isCorrect = q.correct === oi;
                            return (
                              <div key={oi} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {/* Correct marker */}
                                <button
                                  type="button"
                                  onClick={() => setCorrect(q.id, oi)}
                                  title="Mark as correct answer"
                                  style={{
                                    flexShrink: 0,
                                    width: 28, height: 28, borderRadius: '50%',
                                    border: `2px solid ${isCorrect ? '#22c55e' : 'var(--color-border)'}`,
                                    background: isCorrect ? 'rgba(34,197,94,0.15)' : 'transparent',
                                    cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.15s',
                                  }}>
                                  {isCorrect && <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }} />}
                                </button>
                                {/* Option label */}
                                <span style={{
                                  flexShrink: 0, width: 22, height: 22,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  background: isCorrect ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.05)',
                                  border: `1px solid ${isCorrect ? 'rgba(34,197,94,0.3)' : 'var(--color-border)'}`,
                                  borderRadius: '6px',
                                  fontSize: '0.72rem', fontWeight: 700,
                                  color: isCorrect ? '#22c55e' : 'var(--color-on-surface-muted)',
                                }}>
                                  {String.fromCharCode(65 + oi)}
                                </span>
                                <input
                                  style={{ ...INPUT_STYLE, flex: 1 }}
                                  value={opt}
                                  placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                                  onChange={e => updateOption(q.id, oi, e.target.value)}
                                  onFocus={e => e.target.style.borderColor = 'var(--color-border-focus)'}
                                  onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                                />
                              </div>
                            );
                          })}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--color-on-surface-muted)', marginTop: '6px', fontStyle: 'italic' }}>
                          ✓ Green circle = correct answer for grading reference
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add question inline button */}
                <button type="button" onClick={addQuestion} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  padding: '12px',
                  border: '1px dashed var(--color-border)',
                  borderRadius: '12px',
                  background: 'transparent',
                  color: 'var(--color-on-surface-muted)',
                  fontSize: '0.82rem', cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.color = 'var(--color-primary)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-on-surface-muted)'; }}>
                  <Plus size={15} /> Add Another Question
                </button>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={creating} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '14px',
              background: 'linear-gradient(135deg, var(--color-primary), #a78bfa)',
              border: 'none', borderRadius: '12px',
              color: '#fff', fontWeight: 700, fontSize: '0.95rem',
              cursor: creating ? 'wait' : 'pointer',
              opacity: creating ? 0.8 : 1,
              boxShadow: '0 4px 20px rgba(124,111,255,0.4)',
              alignSelf: 'stretch',
            }}>
              {creating ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 size={18} />}
              {creating ? 'Creating Test...' : 'Create & Publish Test'}
            </button>
          </form>
        )}

        {/* ── TAB: MY TESTS & RESULTS ──────────────────────────────────────── */}
        {activeTab === 'results' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {myTests.length === 0 ? (
              <div style={{
                ...CARD, padding: '48px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
                color: 'var(--color-on-surface-muted)',
              }}>
                <ClipboardList size={40} style={{ opacity: 0.4 }} />
                <div style={{ fontWeight: 600 }}>No tests created yet</div>
                <div style={{ fontSize: '0.82rem', textAlign: 'center' }}>
                  Switch to the "Create Test" tab to assign your first exam.
                </div>
                <button onClick={() => setActiveTab('create')} style={{
                  marginTop: '8px', padding: '8px 20px',
                  background: 'var(--color-primary)', border: 'none',
                  borderRadius: '8px', color: '#fff', fontWeight: 600,
                  cursor: 'pointer', fontSize: '0.85rem',
                }}>
                  Create First Test
                </button>
              </div>
            ) : (
              myTests.map(test => {
                const results = getTestResults(test.id);
                const isExpanded = expandedTest === test.id;
                return (
                  <div key={test.id} style={CARD}>
                    {/* Test header */}
                    <button
                      onClick={() => setExpandedTest(isExpanded ? null : test.id)}
                      style={{
                        width: '100%', padding: '16px 20px',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
                        background: isExpanded ? 'rgba(124,111,255,0.06)' : 'transparent',
                        border: 'none', borderBottom: isExpanded ? '1px solid var(--color-border)' : 'none',
                        cursor: 'pointer', textAlign: 'left',
                      }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1, minWidth: 0 }}>
                        <div style={{
                          width: 42, height: 42, borderRadius: '12px', flexShrink: 0,
                          background: 'linear-gradient(135deg, rgba(124,111,255,0.3), rgba(167,139,250,0.15))',
                          border: '1px solid rgba(124,111,255,0.25)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <BookOpen size={18} color="var(--color-primary)" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-on-surface)', marginBottom: '2px' }}>
                            {test.title}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-muted)' }}>{test.topic}</span>
                            <span style={{ color: 'var(--color-border)' }}>·</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <Clock size={11} />{test.duration} min
                            </span>
                            <span style={{ color: 'var(--color-border)' }}>·</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <Users size={11} />{results.length} student{results.length !== 1 ? 's' : ''}
                            </span>
                            <span style={{ color: 'var(--color-border)' }}>·</span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--color-on-surface-muted)' }}>
                              {new Date(test.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        <span style={{
                          padding: '3px 10px', borderRadius: '999px',
                          background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)',
                          color: '#22c55e', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.05em',
                        }}>
                          ACTIVE
                        </span>
                        {isExpanded ? <ChevronUp size={16} color="var(--color-on-surface-muted)" /> : <ChevronDown size={16} color="var(--color-on-surface-muted)" />}
                      </div>
                    </button>

                    {/* Expanded: results table */}
                    {isExpanded && (
                      <div style={{ padding: '16px 20px' }}>
                        {results.length === 0 ? (
                          <div style={{
                            padding: '32px', textAlign: 'center',
                            color: 'var(--color-on-surface-muted)', fontSize: '0.82rem',
                            border: '1px dashed var(--color-border)', borderRadius: '10px',
                          }}>
                            No student submissions yet for this test.
                          </div>
                        ) : (
                          <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                              <thead>
                                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                                  {['Student', 'Trust Score', 'Status', 'Anomalies', 'Completed', 'Actions'].map(h => (
                                    <th key={h} style={{
                                      padding: '8px 12px', textAlign: 'left',
                                      color: 'var(--color-on-surface-muted)', fontWeight: 600,
                                      fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em',
                                    }}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {results.map((r, i) => (
                                  <tr key={i} style={{
                                    borderBottom: '1px solid var(--color-border)',
                                    transition: 'background 0.1s',
                                  }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                    <td style={{ padding: '10px 12px', color: 'var(--color-on-surface)', fontWeight: 500 }}>
                                      {r.studentEmail}
                                    </td>
                                    <td style={{ padding: '10px 12px' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <div style={{
                                          width: 60, height: 6, background: 'var(--color-border)', borderRadius: '3px', overflow: 'hidden',
                                        }}>
                                          <div style={{
                                            width: `${r.trustScore}%`, height: '100%',
                                            background: getTrustColor(r.trustScore), borderRadius: '3px',
                                          }} />
                                        </div>
                                        <span style={{ fontWeight: 600, color: getTrustColor(r.trustScore) }}>
                                          {Math.round(r.trustScore)}%
                                        </span>
                                      </div>
                                    </td>
                                    <td style={{ padding: '10px 12px' }}>
                                      <StatusBadge score={r.trustScore} />
                                    </td>
                                    <td style={{ padding: '10px 12px', color: r.anomalyCount > 0 ? '#f59e0b' : '#22c55e' }}>
                                      {r.anomalyCount || 0} events
                                    </td>
                                    <td style={{ padding: '10px 12px', color: 'var(--color-on-surface-muted)' }}>
                                      {r.completedAt ? new Date(r.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                                    </td>
                                    <td style={{ padding: '10px 12px' }}>
                                      <button
                                        onClick={() => navigate(`/report/${r.sessionId}`)}
                                        style={{
                                          display: 'flex', alignItems: 'center', gap: '5px',
                                          padding: '4px 10px',
                                          background: 'rgba(124,111,255,0.1)',
                                          border: '1px solid rgba(124,111,255,0.25)',
                                          borderRadius: '6px',
                                          color: 'var(--color-primary)', fontSize: '0.72rem',
                                          fontWeight: 600, cursor: 'pointer',
                                        }}>
                                        <ExternalLink size={11} /> View Report
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      <AccessibilityToolbar />

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input::placeholder, textarea::placeholder { color: var(--color-on-surface-muted); }
      `}</style>
    </div>
  );
}
