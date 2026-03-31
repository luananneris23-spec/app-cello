import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../App'
import { PRACTICE_PHASES, SCALES_CURRICULUM } from '../data/musicData'

export default function Dashboard() {
  const { user, supabase } = useAuth()
  const [profile, setProfile] = useState(null)
  const [recentSessions, setRecentSessions] = useState([])
  const [scaleProgress, setScaleProgress] = useState([])
  const [todayMinutes, setTodayMinutes] = useState(0)
  const [streak, setStreak] = useState(0)

  const greeting = getGreeting()

  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('practice_sessions').select('*').eq('user_id', user.id)
        .order('created_at', { ascending: false }).limit(5),
      supabase.from('scale_progress').select('*').eq('user_id', user.id)
    ]).then(([prof, sessions, scales]) => {
      if (!prof.error) setProfile(prof.data)
      if (!sessions.error) {
        setRecentSessions(sessions.data || [])
        const today = new Date().toDateString()
        const todaySecs = (sessions.data || [])
          .filter(s => new Date(s.created_at).toDateString() === today)
          .reduce((acc, s) => acc + (s.duration_seconds || 0), 0)
        setTodayMinutes(Math.round(todaySecs / 60))
      }
      if (!scales.error) setScaleProgress(scales.data || [])
    })
  }, [user, supabase])

  const unlockedScales = scaleProgress.filter(s => s.unlocked).length
  const completedScales = scaleProgress.filter(s => s.completed).length

  const quickActions = [
    { label: 'Afinar Violoncelo', desc: 'Afinador cromático', to: '/tuner', color: '#8B6914', icon: TunerIcon },
    { label: 'Praticar Escalas', desc: 'Com metrônomo e afinador', to: '/scales', color: '#2D5A8E', icon: ScaleIcon },
    { label: 'Exercício Dotzauer', desc: 'Método fundamental', to: '/dotzauer', color: '#5C2D91', icon: BookIcon },
    { label: 'Gravar Sessão', desc: 'Ouvir e comparar', to: '/recordings', color: '#1A5C1A', icon: MicIcon },
  ]

  return (
    <div style={{ padding: '2.5rem 2rem', maxWidth: 1200 }}>
      {/* Header */}
      <div className="animate-fade-in" style={{ marginBottom: '2.5rem' }}>
        <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '0.8rem',
          letterSpacing: '0.2em', textTransform: 'uppercase', color: '#c9a227' }}>
          {greeting}
        </span>
        <h1 style={{ marginTop: '0.25rem', fontSize: 'clamp(1.75rem, 3vw, 2.75rem)', lineHeight: 1.1 }}>
          {profile?.name || user?.email?.split('@')[0] || 'Músico'}
        </h1>
        <p style={{ marginTop: '0.5rem', fontStyle: 'italic', color: '#a0958a' }}>
          Cada nota praticada é um passo em direção à maestria.
        </p>
      </div>

      {/* Stats */}
      <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '1rem', marginBottom: '2.5rem' }}>
        {[
          { label: 'Minutos Hoje', value: todayMinutes, suffix: 'min', icon: '⏱' },
          { label: 'Escalas Desbloqueadas', value: unlockedScales, suffix: `/${SCALES_CURRICULUM.length}`, icon: '🎵' },
          { label: 'Escalas Completas', value: completedScales, suffix: '', icon: '✓' },
          { label: 'Sessões Totais', value: recentSessions.length, suffix: '+', icon: '📖' },
        ].map(stat => (
          <div key={stat.label} className="card" style={{ textAlign: 'center', padding: '1.25rem' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>{stat.icon}</div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '2rem',
              color: '#e6c45a', lineHeight: 1, fontWeight: 700 }}>
              {stat.value}<span style={{ fontSize: '1rem', color: '#a0958a' }}>{stat.suffix}</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#a0958a', marginTop: '0.35rem',
              fontFamily: 'Cormorant Garamond, serif', letterSpacing: '0.08em',
              textTransform: 'uppercase' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '0.75rem',
          letterSpacing: '0.18em', textTransform: 'uppercase', color: '#8B6914',
          marginBottom: '1rem' }}>Ações Rápidas</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {quickActions.map(action => (
            <Link key={action.label} to={action.to} style={{ textDecoration: 'none' }}>
              <div className="card" style={{
                padding: '1.4rem', cursor: 'pointer', borderLeft: `3px solid ${action.color}`,
                transition: 'all 0.2s'
              }}>
                <action.icon color={action.color} />
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1rem',
                  color: '#e6c45a', marginTop: '0.75rem', marginBottom: '0.2rem' }}>
                  {action.label}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#a0958a',
                  fontFamily: 'Cormorant Garamond, serif' }}>{action.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Fases */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '0.75rem',
          letterSpacing: '0.18em', textTransform: 'uppercase', color: '#8B6914',
          marginBottom: '1rem' }}>Jornada de Aprendizado</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {PRACTICE_PHASES.map((phase, i) => (
            <div key={phase.id} className="card" style={{
              padding: '1.1rem 1.4rem', display: 'flex', alignItems: 'center', gap: '1rem'
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: `${phase.color}30`, border: `1.5px solid ${phase.color}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Playfair Display, serif', fontSize: '0.9rem',
                color: phase.color, flexShrink: 0, fontWeight: 700
              }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '0.95rem',
                  color: '#e6c45a' }}>{phase.name}</div>
                <div style={{ fontSize: '0.8rem', color: '#a0958a',
                  fontFamily: 'Cormorant Garamond, serif' }}>{phase.duration} · {phase.subtitle}</div>
              </div>
              <Link to="/scales" style={{ textDecoration: 'none' }}>
                <span className="badge badge-gold" style={{ fontSize: '0.7rem' }}>Ver →</span>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Citação */}
      <div style={{
        padding: '1.75rem', borderLeft: '3px solid rgba(201,162,39,0.4)',
        background: 'rgba(201,162,39,0.03)', borderRadius: '0 6px 6px 0', marginTop: '1rem'
      }}>
        <p style={{ fontFamily: 'IM Fell English, serif', fontSize: '1.1rem',
          color: '#c8bfb4', fontStyle: 'italic', lineHeight: 1.7 }}>
          "A técnica é o veículo da expressão. Cuide dela como cuida do seu instrumento."
        </p>
        <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#8B6914',
          letterSpacing: '0.12em', textTransform: 'uppercase',
          fontFamily: 'Playfair Display, serif' }}>— Método Dotzauer</div>
      </div>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia —'
  if (h < 18) return 'Boa tarde —'
  return 'Boa noite —'
}

function TunerIcon({ color }) {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
    <circle cx="12" cy="12" r="9"/><line x1="12" y1="3" x2="12" y2="7"/>
    <circle cx="12" cy="12" r="2"/><line x1="12" y1="14" x2="15" y2="8"/>
  </svg>
}
function ScaleIcon({ color }) {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
    <path d="M9 19V6l12-3v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
  </svg>
}
function BookIcon({ color }) {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
    <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
    <line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="16" y2="11"/>
  </svg>
}
function MicIcon({ color }) {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
    <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
    <path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/>
    <line x1="8" y1="23" x2="16" y2="23"/>
  </svg>
}
