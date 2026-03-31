import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../App'
import { SCALES_CURRICULUM, PRACTICE_PHASES, DOTZAUER_EXERCISES } from '../data/musicData'

export default function Progress() {
  const { user, supabase } = useAuth()
  const [scaleProgress, setScaleProgress] = useState([])
  const [sessions, setSessions] = useState([])
  const [achievements, setAchievements] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase.from('scale_progress').select('*').eq('user_id', user.id),
      supabase.from('practice_sessions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('achievements').select('*').eq('user_id', user.id),
    ]).then(([sp, sess, ach]) => {
      setScaleProgress(sp.data || [])
      setSessions(sess.data || [])
      setAchievements(ach.data || [])
      setLoading(false)
    })
  }, [user, supabase])

  const progressMap = {}
  scaleProgress.forEach(p => { progressMap[p.scale_name] = p })

  const totalSessions = sessions.length
  const totalMinutes = Math.round(sessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0) / 60)
  const completedScales = scaleProgress.filter(s => s.completed).length
  const unlockedScales = scaleProgress.filter(s => s.unlocked).length

  // Sessões por semana (últimas 8 semanas)
  const weeklyData = getWeeklyData(sessions)

  // Fase atual
  const currentPhaseIdx = scaleProgress.length < 4 ? 0
    : scaleProgress.length < 8 ? 1
    : scaleProgress.length < 12 ? 2 : 3

  const ACHIEVEMENTS_DEF = [
    { key: 'first_session', label: 'Primeira Prática', icon: '🎵', desc: 'Completou a primeira sessão' },
    { key: 'week_streak', label: 'Semana Dedicada', icon: '🔥', desc: '7 dias consecutivos de prática' },
    { key: 'first_scale', label: 'Primeira Escala', icon: '⭐', desc: 'Completou uma escala pela primeira vez' },
    { key: '10_scales', label: 'Repertório', icon: '🏆', desc: 'Praticou 10 escalas diferentes' },
    { key: '100_sessions', label: 'Centurião', icon: '💎', desc: '100 sessões de prática' },
    { key: 'dotzauer_1', label: 'Dotzauer I', icon: '📖', desc: 'Completou a Fase I do Dotzauer' },
    { key: 'tuner_master', label: 'Ouvido Afinado', icon: '🎯', desc: '50 sessões com afinador' },
    { key: '10h_practice', label: 'Dez Horas', icon: '⏱', desc: '10 horas acumuladas de prática' },
  ]

  const achievedKeys = new Set(achievements.map(a => a.achievement_key))

  if (loading) {
    return (
      <div style={{ padding: '2.5rem 2rem', textAlign: 'center', color: '#8B6914',
        fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic' }}>
        Carregando seu progresso...
      </div>
    )
  }

  return (
    <div style={{ padding: '2.5rem 2rem', maxWidth: 1000 }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '0.75rem',
          letterSpacing: '0.2em', textTransform: 'uppercase', color: '#c9a227' }}>Sua Jornada</span>
        <h1 style={{ marginTop: '0.2rem' }}>Progresso</h1>
        <p style={{ fontStyle: 'italic', color: '#a0958a', marginTop: '0.3rem' }}>
          A constância supera o talento — cada minuto praticado conta
        </p>
      </div>

      {/* Stats overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Sessões Totais', value: totalSessions, icon: '📅' },
          { label: 'Minutos Totais', value: totalMinutes, icon: '⏱' },
          { label: 'Escalas Praticadas', value: unlockedScales, icon: '🎵' },
          { label: 'Escalas Completas', value: completedScales, icon: '✓' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>{s.icon}</div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '2.2rem',
              color: '#e6c45a', lineHeight: 1, fontWeight: 700 }}>{s.value}</div>
            <div style={{ fontSize: '0.72rem', color: '#a0958a', marginTop: '0.3rem',
              fontFamily: 'Cormorant Garamond, serif', textTransform: 'uppercase',
              letterSpacing: '0.06em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Gráfico semanal */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '0.75rem',
          letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8B6914',
          marginBottom: '1rem' }}>Prática Semanal (últimas 8 semanas)</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', height: 80 }}>
          {weeklyData.map((w, i) => {
            const maxMin = Math.max(...weeklyData.map(d => d.minutes), 1)
            const h = Math.max(4, (w.minutes / maxMin) * 72)
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: '0.25rem' }}>
                <div style={{ fontSize: '0.6rem', color: '#8B6914',
                  fontFamily: 'monospace' }}>{w.minutes}m</div>
                <div style={{
                  width: '100%', height: h, borderRadius: '3px 3px 0 0',
                  background: i === weeklyData.length - 1
                    ? 'linear-gradient(to top, #8B6914, #c9a227)'
                    : 'rgba(201,162,39,0.25)',
                  transition: 'height 0.5s ease'
                }}/>
                <div style={{ fontSize: '0.6rem', color: '#8B6914',
                  fontFamily: 'Cormorant Garamond, serif' }}>{w.label}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Fases */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '0.75rem',
          letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8B6914',
          marginBottom: '1rem' }}>Fases de Desenvolvimento</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {PRACTICE_PHASES.map((phase, i) => {
            const phaseScales = SCALES_CURRICULUM.filter(s => s.phase === i + 1)
            const practicedInPhase = phaseScales.filter(s => progressMap[s.name]).length
            const pct = Math.round((practicedInPhase / phaseScales.length) * 100)
            const isCurrent = i === currentPhaseIdx
            return (
              <div key={phase.id} className="card" style={{ padding: '1.1rem 1.4rem',
                borderLeft: `3px solid ${isCurrent ? phase.color : 'rgba(201,162,39,0.15)'}`,
                opacity: i > currentPhaseIdx + 1 ? 0.5 : 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div>
                    <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '0.95rem',
                      color: '#e6c45a' }}>{phase.name}</span>
                    {isCurrent && <span className="badge badge-gold" style={{ marginLeft: '0.5rem',
                      fontSize: '0.6rem' }}>Atual</span>}
                  </div>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.85rem',
                    color: '#8B6914' }}>{practicedInPhase}/{phaseScales.length}</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${pct}%`,
                    background: `linear-gradient(to right, ${phase.color}88, ${phase.color})` }}/>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Escalas praticadas */}
      {scaleProgress.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '0.75rem',
            letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8B6914',
            marginBottom: '1rem' }}>Escalas Praticadas</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
            {scaleProgress.map(sp => {
              const scale = SCALES_CURRICULUM.find(s => s.name === sp.scale_name)
              return (
                <div key={sp.id} className="card" style={{ padding: '1rem' }}>
                  <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '0.9rem',
                    color: '#e6c45a', marginBottom: '0.3rem' }}>{sp.scale_name}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                    fontSize: '0.75rem', color: '#8B6914', marginBottom: '0.4rem',
                    fontFamily: 'Cormorant Garamond, serif' }}>
                    <span>{sp.sessions_count} sessões</span>
                    <span>{sp.bpm_achieved} BPM max</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${sp.best_score || 0}%` }}/>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Conquistas */}
      <div>
        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '0.75rem',
          letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8B6914',
          marginBottom: '1rem' }}>Conquistas</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
          {ACHIEVEMENTS_DEF.map(ach => {
            const earned = achievedKeys.has(ach.key)
            return (
              <div key={ach.key} className="card" style={{ padding: '1rem',
                opacity: earned ? 1 : 0.4,
                background: earned ? 'rgba(201,162,39,0.08)' : undefined }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>{ach.icon}</div>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '0.9rem',
                  color: earned ? '#e6c45a' : '#a0958a', marginBottom: '0.2rem' }}>{ach.label}</div>
                <div style={{ fontSize: '0.78rem', color: '#8B6914',
                  fontFamily: 'Cormorant Garamond, serif' }}>{ach.desc}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Sessões recentes */}
      {sessions.length > 0 && (
        <div style={{ marginTop: '1.5rem' }}>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '0.75rem',
            letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8B6914',
            marginBottom: '1rem' }}>Sessões Recentes</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {sessions.slice(0, 8).map(s => (
              <div key={s.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.65rem 1rem', background: 'rgba(201,162,39,0.04)',
                border: '1px solid rgba(201,162,39,0.1)', borderRadius: '4px'
              }}>
                <div>
                  <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '0.9rem',
                    color: '#c8bfb4' }}>
                    {s.scale_name || s.exercise_name || s.session_type}
                  </span>
                  {s.bpm && <span style={{ fontSize: '0.75rem', color: '#8B6914',
                    marginLeft: '0.5rem', fontFamily: 'monospace' }}>@ {s.bpm} BPM</span>}
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  {s.duration_seconds > 0 && (
                    <span style={{ fontSize: '0.75rem', color: '#8B6914',
                      fontFamily: 'monospace' }}>
                      {Math.round(s.duration_seconds / 60)}min
                    </span>
                  )}
                  <span style={{ fontSize: '0.72rem', color: '#8B6914',
                    fontFamily: 'Cormorant Garamond, serif' }}>
                    {new Date(s.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function getWeeklyData(sessions) {
  const weeks = []
  for (let i = 7; i >= 0; i--) {
    const start = new Date()
    start.setDate(start.getDate() - (i + 1) * 7)
    const end = new Date()
    end.setDate(end.getDate() - i * 7)
    const weekSessions = sessions.filter(s => {
      const d = new Date(s.created_at)
      return d >= start && d < end
    })
    const minutes = Math.round(weekSessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0) / 60)
    weeks.push({
      minutes,
      label: `S${8 - i}`
    })
  }
  return weeks
}
