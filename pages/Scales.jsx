import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../App'
import { SCALES_CURRICULUM, PRACTICE_PHASES } from '../data/musicData'

export default function Scales() {
  const { user, supabase } = useAuth()
  const [progress, setProgress] = useState({})
  const [filter, setFilter] = useState('all') // all | phase1 | phase2 | phase3 | phase4
  const [typeFilter, setTypeFilter] = useState('all') // all | maior | menor_natural | menor_harmonica | menor_melodica

  useEffect(() => {
    if (!user) return
    supabase.from('scale_progress').select('*').eq('user_id', user.id)
      .then(({ data }) => {
        if (data) {
          const map = {}
          data.forEach(d => { map[d.scale_name] = d })
          setProgress(map)
        }
      })
  }, [user, supabase])

  const filtered = SCALES_CURRICULUM.filter(s => {
    const phaseMatch = filter === 'all' || `phase${s.phase}` === filter
    const typeMatch = typeFilter === 'all' || s.type === typeFilter
    return phaseMatch && typeMatch
  })

  return (
    <div style={{ padding: '2.5rem 2rem', maxWidth: 1100 }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '0.75rem',
          letterSpacing: '0.2em', textTransform: 'uppercase', color: '#c9a227' }}>
          Repertório
        </span>
        <h1 style={{ marginTop: '0.2rem' }}>Escalas</h1>
        <p style={{ fontStyle: 'italic', color: '#a0958a', marginTop: '0.3rem' }}>
          Da mais simples à mais exigente — ordenadas por dificuldade pedagógica
        </p>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {[
            { val: 'all', label: 'Todas' },
            { val: 'phase1', label: 'Fase I' },
            { val: 'phase2', label: 'Fase II' },
            { val: 'phase3', label: 'Fase III' },
            { val: 'phase4', label: 'Fase IV' },
          ].map(f => (
            <button key={f.val} onClick={() => setFilter(f.val)}
              className={`btn ${filter === f.val ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '0.35rem 0.9rem', fontSize: '0.8rem' }}>
              {f.label}
            </button>
          ))}
        </div>
        <div style={{ width: 1, background: 'rgba(201,162,39,0.2)', margin: '0 0.25rem' }}/>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {[
            { val: 'all', label: 'Todos tipos' },
            { val: 'maior', label: 'Maior' },
            { val: 'menor_natural', label: 'Menor Natural' },
            { val: 'menor_harmonica', label: 'Menor Harmônica' },
            { val: 'menor_melodica', label: 'Menor Melódica' },
          ].map(f => (
            <button key={f.val} onClick={() => setTypeFilter(f.val)}
              className={`btn ${typeFilter === f.val ? 'btn-secondary' : 'btn-ghost'}`}
              style={{ padding: '0.35rem 0.9rem', fontSize: '0.8rem' }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Escalas grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        {filtered.map(scale => {
          const prog = progress[scale.name] || {}
          const bestScore = prog.best_score || 0
          const sessions = prog.sessions_count || 0
          const completed = prog.completed || false
          const phaseData = PRACTICE_PHASES[scale.phase - 1]

          return (
            <Link key={scale.id} to={`/scales/${scale.id}`} style={{ textDecoration: 'none' }}>
              <div className="card" style={{
                padding: '1.4rem', cursor: 'pointer', height: '100%',
                borderLeft: `3px solid ${phaseData?.color || '#8B6914'}`,
                opacity: 1
              }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.1rem',
                      color: '#e6c45a', fontWeight: 600 }}>{scale.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#a0958a', marginTop: '0.15rem',
                      fontFamily: 'Cormorant Garamond, serif' }}>
                      {scale.type.replace('_', ' ').replace('menor', 'Menor').replace('maior', 'Maior')}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <DifficultyDots level={scale.difficulty} />
                    {completed && <div style={{ fontSize: '0.7rem', color: '#4CAF50', marginTop: '0.25rem' }}>✓ Completa</div>}
                  </div>
                </div>

                {/* Fase e posição */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                  <span className="badge badge-gold" style={{ fontSize: '0.65rem' }}>
                    Fase {scale.phase}
                  </span>
                  <span className="badge badge-silver" style={{ fontSize: '0.65rem' }}>
                    {scale.positions}
                  </span>
                </div>

                {/* Descrição curta */}
                <p style={{ fontSize: '0.82rem', color: '#a0958a', lineHeight: 1.5,
                  fontFamily: 'Cormorant Garamond, serif', marginBottom: '0.75rem',
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  overflow: 'hidden' }}>
                  {scale.description}
                </p>

                {/* Progress */}
                {sessions > 0 && (
                  <div style={{ marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between',
                      fontSize: '0.7rem', color: '#8B6914', marginBottom: '0.25rem',
                      fontFamily: 'Cormorant Garamond, serif' }}>
                      <span>Progresso</span>
                      <span>{bestScore}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${bestScore}%` }}/>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between',
                  fontSize: '0.72rem', color: '#8B6914', marginTop: 'auto',
                  fontFamily: 'Cormorant Garamond, serif' }}>
                  <span>{sessions > 0 ? `${sessions} sessões` : 'Não praticada'}</span>
                  <span style={{ color: '#c9a227' }}>Praticar →</span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#a0958a',
          fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic' }}>
          Nenhuma escala encontrada com os filtros selecionados.
        </div>
      )}
    </div>
  )
}

function DifficultyDots({ level }) {
  return (
    <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} style={{
          width: 6, height: 6, borderRadius: '50%',
          background: i < Math.ceil(level / 2) ? '#c9a227' : 'rgba(201,162,39,0.15)'
        }}/>
      ))}
    </div>
  )
}
