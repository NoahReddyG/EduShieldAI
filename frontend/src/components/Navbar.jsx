import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, LogOut, User, LayoutDashboard } from 'lucide-react';
import { getStoredUser, logout } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import TrustScoreBadge from './TrustScoreBadge';

export default function Navbar({ trustScore = null, examTitle = null }) {
  const user = getStoredUser();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isExamPage = location.pathname.startsWith('/exam');

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px',
      height: '60px',
      background: 'rgba(15, 17, 23, 0.85)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--color-border)',
      WebkitBackdropFilter: 'blur(20px)',
    }}>
      {/* Brand */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
        <div style={{
          width: 34, height: 34,
          background: 'linear-gradient(135deg, var(--color-primary), #a78bfa)',
          borderRadius: '10px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 16px rgba(124,111,255,0.35)',
        }}>
          <ShieldCheck size={18} color="white" />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-on-surface)', lineHeight: 1.1 }}>
            EduShield
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--color-primary)', letterSpacing: '0.12em', textTransform: 'uppercase', lineHeight: 1 }}>
            AI Proctor
          </div>
        </div>
      </Link>

      {/* Center — exam title on exam page */}
      {examTitle && isExamPage && (
        <div style={{
          position: 'absolute', left: '50%', transform: 'translateX(-50%)',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <span style={{
            fontSize: '0.82rem', color: 'var(--color-on-surface-muted)',
            fontWeight: 500, maxWidth: 260,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {examTitle}
          </span>
          <span style={{
            background: 'rgba(34,197,94,0.15)', color: '#22c55e',
            border: '1px solid rgba(34,197,94,0.3)',
            borderRadius: '999px', padding: '2px 8px',
            fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}>
            Live
          </span>
        </div>
      )}

      {/* Center-right: Dashboard link */}
      {user && !location.pathname.startsWith('/exam') && (
        <Link
          to={user.role === 'FACULTY' ? '/teacher' : '/student'}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px 14px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--color-border)',
            borderRadius: '999px',
            color: 'var(--color-on-surface-muted)',
            fontSize: '0.78rem', fontWeight: 500,
            textDecoration: 'none', transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,111,255,0.1)'; e.currentTarget.style.color = 'var(--color-primary)'; e.currentTarget.style.borderColor = 'rgba(124,111,255,0.3)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = 'var(--color-on-surface-muted)'; e.currentTarget.style.borderColor = 'var(--color-border)'; }}
        >
          <LayoutDashboard size={13} />
          Dashboard
        </Link>
      )}

      {/* Right — trust score + user */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {trustScore !== null && isExamPage && (
          <TrustScoreBadge score={trustScore} compact />
        )}

        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '4px 12px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--color-border)',
              borderRadius: '999px',
              fontSize: '0.78rem', color: 'var(--color-on-surface-muted)',
            }}>
              <User size={13} />
              <span style={{ color: 'var(--color-on-surface)', fontWeight: 500 }}>
                {user.email.split('@')[0]}
              </span>
              <span style={{
                background: user.role === 'FACULTY' ? 'rgba(124,111,255,0.2)' : 'rgba(34,197,94,0.15)',
                color: user.role === 'FACULTY' ? 'var(--color-primary)' : '#22c55e',
                borderRadius: '999px', padding: '1px 7px',
                fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}>
                {user.role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 34, height: 34,
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: '8px',
                color: 'var(--color-danger)',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.18)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
            >
              <LogOut size={15} />
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
