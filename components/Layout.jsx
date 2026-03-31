import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../App'
import { useState } from 'react'

const NAV_ITEMS = [
  { to: '/', label: 'Início', icon: <HomeIcon />, exact: true },
  { to: '/scales', label: 'Escalas', icon: <ScalesIcon /> },
  { to: '/practice-room', label: 'Sala de Prática', icon: <RoomIcon /> },
  { to: '/ear-training', label: 'Ear Training', icon: <EarIcon /> },
  { to: '/tuner', label: 'Afinador', icon: <TunerIcon /> },
  { to: '/rhythm', label: 'Metrônomo', icon: <RhythmIcon /> },
  { to: '/dotzauer', label: 'Dotzauer', icon: <BookIcon /> },
  { to: '/theory', label: 'Teoria', icon: <TheoryIcon /> },
  { to: '/recordings', label: 'Gravações', icon: <MicIcon /> },
  { to: '/progress', label: 'Progresso', icon: <ProgressIcon /> },
]

export default function Layout() {
  const { user, supabase } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/auth')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: 240, minHeight: '100vh', background: 'linear-gradient(180deg, #120c0c 0%, #1e1414 100%)',
        borderRight: '1px solid rgba(201,162,39,0.15)', display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, zIndex: 100,
        transform: menuOpen ? 'translateX(0)' : undefined,
        transition: 'transform 0.3s ease'
      }}>
        {/* Logo */}
        <div style={{ padding: '1.75rem 1.5rem 1.25rem', borderBottom: '1px solid rgba(201,162,39,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CelloIcon />
            <div>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.1rem',
                color: '#e6c45a', fontWeight: 700, lineHeight: 1.1 }}>Arco & Alma</div>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '0.7rem',
                color: '#a0958a', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                Violoncelo
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.6rem 0.9rem', borderRadius: '4px',
                fontFamily: 'Cormorant Garamond, serif', fontSize: '0.95rem',
                color: isActive ? '#e6c45a' : '#a0958a',
                background: isActive ? 'rgba(201,162,39,0.1)' : 'transparent',
                borderLeft: isActive ? '2px solid #c9a227' : '2px solid transparent',
                textDecoration: 'none', transition: 'all 0.2s',
                letterSpacing: '0.02em'
              })}
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid rgba(201,162,39,0.1)' }}>
          <div style={{ fontSize: '0.75rem', color: '#a0958a', marginBottom: '0.5rem',
            fontFamily: 'Cormorant Garamond, serif', overflow: 'hidden', textOverflow: 'ellipsis',
            whiteSpace: 'nowrap' }}>{user?.email}</div>
          <button onClick={handleLogout} className="btn btn-ghost"
            style={{ width: '100%', fontSize: '0.8rem', padding: '0.4rem 0.75rem', justifyContent: 'center' }}>
            Sair
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ marginLeft: 240, flex: 1, minHeight: '100vh' }}>
        <Outlet />
      </main>

      {/* Mobile toggle */}
      <button onClick={() => setMenuOpen(!menuOpen)}
        style={{ display: 'none', position: 'fixed', top: '1rem', left: '1rem',
          zIndex: 200, background: 'var(--velvet-mid)', border: '1px solid rgba(201,162,39,0.3)',
          borderRadius: '6px', padding: '0.5rem', color: '#c9a227', cursor: 'pointer' }}
        className="mobile-menu-btn">
        ☰
      </button>

      <style>{`
        @media (max-width: 768px) {
          aside { transform: translateX(-100%); }
          main { margin-left: 0 !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </div>
  )
}

// Violoncelo real no logo
function CelloIcon() {
  return (
    <svg width="30" height="40" viewBox="0 0 30 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Corpo inferior */}
      <ellipse cx="15" cy="28" rx="11" ry="10" fill="rgba(201,162,39,0.08)" stroke="#c9a227" strokeWidth="1.2"/>
      {/* Cintura */}
      <path d="M 7 22 Q 4 24 4 26 Q 4 28 7 28" stroke="#c9a227" strokeWidth="1.1" fill="none"/>
      <path d="M 23 22 Q 26 24 26 26 Q 26 28 23 28" stroke="#c9a227" strokeWidth="1.1" fill="none"/>
      {/* Corpo superior */}
      <ellipse cx="15" cy="19" rx="8.5" ry="7" fill="rgba(201,162,39,0.06)" stroke="#c9a227" strokeWidth="1.1"/>
      {/* Braço/cravelha */}
      <path d="M 15 12 L 15 4" stroke="#c9a227" strokeWidth="1.8" strokeLinecap="round"/>
      {/* Voluta */}
      <path d="M 15 4 Q 12 4 12 6 Q 12 8 14 8 Q 16 8 16 6 Q 16 5 15 4" stroke="#c9a227" strokeWidth="0.9" fill="none"/>
      {/* Cravelhas */}
      <line x1="12" y1="5.5" x2="10" y2="5" stroke="#c9a227" strokeWidth="1" strokeLinecap="round"/>
      <line x1="12" y1="7" x2="10" y2="7.5" stroke="#c9a227" strokeWidth="1" strokeLinecap="round"/>
      <line x1="18" y1="5.5" x2="20" y2="5" stroke="#c9a227" strokeWidth="1" strokeLinecap="round"/>
      <line x1="18" y1="7" x2="20" y2="7.5" stroke="#c9a227" strokeWidth="1" strokeLinecap="round"/>
      {/* Espelho */}
      <rect x="13.5" y="12" width="3" height="14" rx="0.5" fill="rgba(201,162,39,0.2)" stroke="#c9a227" strokeWidth="0.6"/>
      {/* ff holes */}
      <path d="M 10.5 22 Q 10 20.5 10.5 19" stroke="#c9a227" strokeWidth="0.8" fill="none" strokeLinecap="round"/>
      <path d="M 19.5 22 Q 20 20.5 19.5 19" stroke="#c9a227" strokeWidth="0.8" fill="none" strokeLinecap="round"/>
      {/* Cavalete */}
      <path d="M 12 25.5 L 15 24.5 L 18 25.5" stroke="#c9a227" strokeWidth="0.9" fill="none" strokeLinecap="round"/>
      {/* Cordas */}
      {[13.2, 14.2, 15.8, 16.8].map((x, i) => (
        <line key={i} x1={x} y1="12.5" x2={x} y2="37" stroke="#c9a227" strokeWidth="0.45" opacity="0.6"/>
      ))}
      {/* Estandarte */}
      <path d="M 13 37 L 17 37 L 16.5 38.5 L 13.5 38.5 Z" fill="rgba(201,162,39,0.3)" stroke="#c9a227" strokeWidth="0.7"/>
    </svg>
  )
}
function HomeIcon()     { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg> }
function ScalesIcon()   { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 19V6l12-3v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg> }
function RoomIcon()     { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/><circle cx="12" cy="10" r="3"/></svg> }
function EarIcon()      { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 8.5a6 6 0 1 1 11.5 2c-.4 1.3-1.5 2.2-2.5 3-1.3 1-2 2.5-2 4v0a1.5 1.5 0 0 1-3 0v-1"/><path d="M9 17.5a3 3 0 0 0 6 0"/></svg> }
function TunerIcon()    { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="9"/><line x1="12" y1="3" x2="12" y2="7"/><circle cx="12" cy="12" r="2"/><line x1="12" y1="14" x2="15" y2="8"/></svg> }
function RhythmIcon()   { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 3v18h18"/><path d="M7 16l4-8 4 8"/><path d="M9 12h4"/></svg> }
function BookIcon()     { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg> }
function TheoryIcon()   { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12" y2="17"/></svg> }
function MicIcon()      { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg> }
function ProgressIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg> }
