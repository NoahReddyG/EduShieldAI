import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, GraduationCap, UserCog, Mail, Lock, ArrowRight, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { login } from '../services/authService';
import { initializeTests } from '../services/testService';

const ROLES = [
  {
    id: 'STUDENT',
    label: 'Student',
    description: 'Take proctored exams with AI assistance',
    icon: GraduationCap,
    email: 'student@university.edu',
    color: '#22c55e',
    glow: 'rgba(34,197,94,0.3)',
    bg: 'rgba(34,197,94,0.07)',
    border: 'rgba(34,197,94,0.25)',
    dest: '/student',
  },
  {
    id: 'FACULTY',
    label: 'Faculty',
    description: 'Assign tests and review integrity reports',
    icon: UserCog,
    email: 'professor@admin.com',
    color: '#7c6fff',
    glow: 'rgba(124,111,255,0.3)',
    bg: 'rgba(124,111,255,0.07)',
    border: 'rgba(124,111,255,0.25)',
    dest: '/teacher',
  },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState('STUDENT');
  const [email, setEmail] = useState('student@university.edu');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRoleSelect = (role) => {
    setSelectedRole(role.id);
    setEmail(role.email);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    initializeTests();

    try {
      const user = await login(email, password);
      const dest = user.role === 'FACULTY' ? '/teacher' : '/student';
      navigate(dest);
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const activeRole = ROLES.find(r => r.id === selectedRole);

  return (
    <div style={{
      minHeight: '100svh', background: 'var(--color-surface)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', position: 'relative', overflow: 'hidden',
    }}>
      {/* Ambient blobs */}
      <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,111,255,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{
        width: '100%', maxWidth: '460px',
        background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(24px)',
        border: '1px solid var(--color-border)', borderRadius: '24px',
        padding: '40px', boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
        position: 'relative', zIndex: 1, animation: 'fadeSlideUp 0.5s ease',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg, var(--color-primary), #a78bfa)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 32px rgba(124,111,255,0.5)' }}>
            <ShieldCheck size={28} color="white" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-on-surface)', letterSpacing: '-0.01em' }}>
              EduShield <span style={{ background: 'linear-gradient(135deg, var(--color-primary), #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI</span>
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--color-on-surface-muted)' }}>Privacy-first intelligent proctoring</p>
          </div>
        </div>

        {/* Role selector */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-on-surface-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px', fontWeight: 600 }}>I am a...</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {ROLES.map(role => {
              const Icon = role.icon;
              const isActive = selectedRole === role.id;
              return (
                <button key={role.id} onClick={() => handleRoleSelect(role)} style={{
                  padding: '14px 12px', borderRadius: '12px',
                  border: `1px solid ${isActive ? role.border : 'var(--color-border)'}`,
                  background: isActive ? role.bg : 'rgba(255,255,255,0.02)',
                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease',
                  boxShadow: isActive ? `0 0 20px ${role.glow}` : 'none',
                }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}>
                  <Icon size={20} color={isActive ? role.color : 'var(--color-on-surface-muted)'} style={{ marginBottom: '6px' }} />
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: isActive ? role.color : 'var(--color-on-surface)' }}>{role.label}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-on-surface-muted)', marginTop: '2px', lineHeight: 1.3 }}>{role.description}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Email */}
          <div style={{ position: 'relative' }}>
            <Mail size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-on-surface-muted)', pointerEvents: 'none' }} />
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" required
              style={{ width: '100%', padding: '12px 14px 12px 40px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)', borderRadius: '10px', color: 'var(--color-on-surface)', fontSize: '0.9rem', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = 'var(--color-border-focus)'}
              onBlur={e => e.target.style.borderColor = 'var(--color-border)'} />
          </div>

          {/* Password */}
          <div style={{ position: 'relative' }}>
            <Lock size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-on-surface-muted)', pointerEvents: 'none' }} />
            <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required
              style={{ width: '100%', padding: '12px 40px 12px 40px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)', borderRadius: '10px', color: 'var(--color-on-surface)', fontSize: '0.9rem', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = 'var(--color-border-focus)'}
              onBlur={e => e.target.style.borderColor = 'var(--color-border)'} />
            <button type="button" onClick={() => setShowPassword(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-on-surface-muted)', padding: '4px' }}>
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', color: '#ef4444', fontSize: '0.82rem', animation: 'fadeIn 0.2s ease' }}>
              <AlertCircle size={14} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          {/* Submit */}
          <button type="submit" disabled={loading} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            padding: '13px',
            background: 'linear-gradient(135deg, var(--color-primary), #a78bfa)',
            border: 'none', borderRadius: '12px', color: '#fff', fontWeight: 700, fontSize: '0.92rem',
            cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.8 : 1,
            boxShadow: '0 4px 20px rgba(124,111,255,0.4)', transition: 'all 0.2s', marginTop: '4px',
          }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.boxShadow = '0 6px 28px rgba(124,111,255,0.6)'; }}
            onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(124,111,255,0.4)'}>
            {loading ? <Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} /> : <ArrowRight size={17} />}
            {loading ? 'Signing in...' : `Sign in as ${activeRole?.label}`}
          </button>
        </form>

        <div style={{ marginTop: '20px', padding: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--color-border)', borderRadius: '10px', fontSize: '0.75rem', color: 'var(--color-on-surface-muted)', textAlign: 'center' }}>
          Demo mode — any password accepted · Role determined by selection
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input::placeholder { color: var(--color-on-surface-muted); }
      `}</style>
    </div>
  );
}
