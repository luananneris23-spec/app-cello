import { useState } from 'react'
import { MUSIC_CONCEPTS } from '../data/musicData'

const SECTIONS = [
  { key: 'scales',   label: 'Escalas', icon: '♫' },
  { key: 'tonality', label: 'Tonalidade', icon: '𝄞' },
  { key: 'rhythm',   label: 'Ritmo', icon: '♩' },
  { key: 'bowing',   label: 'Arco e Som', icon: '𝄒' },
  { key: 'tuning',   label: 'Afinação', icon: '◎' },
]

export default function Theory() {
  const [active, setActive] = useState('scales')
  const concept = MUSIC_CONCEPTS[active]

  return (
    <div style={{ padding: '2.5rem 2rem', maxWidth: 960, margin: '0 auto' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '0.75rem',
          letterSpacing: '0.2em', textTransform: 'uppercase', color: '#c9a227' }}>
          Fundamentos
        </span>
        <h1 style={{ marginTop: '0.2rem' }}>Teoria Musical</h1>
        <p style={{ fontStyle: 'italic', color: '#a0958a', marginTop: '0.3rem' }}>
          Compreender é o primeiro passo para executar com intenção
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '1.5rem' }}>
        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          {SECTIONS.map(s => (
            <button key={s.key} onClick={() => setActive(s.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                padding: '0.65rem 1rem', borderRadius: '4px',
                background: active === s.key ? 'rgba(201,162,39,0.12)' : 'transparent',
                border: 'none', borderLeft: `2px solid ${active === s.key ? '#c9a227' : 'transparent'}`,
                cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                fontFamily: 'Cormorant Garamond, serif', fontSize: '1rem',
                color: active === s.key ? '#e6c45a' : '#a0958a',
              }}>
              <span style={{ fontSize: '1.1rem', opacity: 0.8 }}>{s.icon}</span>
              {s.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="card animate-fade-in" style={{ padding: '2rem' }}>
          <div style={{ marginBottom: '1.75rem' }}>
            <h2 style={{ marginBottom: '0.25rem' }}>{concept.title}</h2>
            <p style={{ fontStyle: 'italic', color: '#8B6914', fontSize: '0.95rem' }}>
              {concept.subtitle}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            {concept.sections.map((sec, i) => (
              <TheorySection key={i} section={sec} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function TheorySection({ section }) {
  return (
    <div>
      <h3 style={{ fontSize: '1.15rem', color: '#e6c45a', marginBottom: '0.6rem',
        fontFamily: 'Playfair Display, serif' }}>{section.title}</h3>
      <p style={{ color: '#c8bfb4', lineHeight: 1.8, fontFamily: 'Cormorant Garamond, serif',
        fontSize: '1.05rem' }}>{section.content}</p>

      {section.pattern && (
        <div style={{ margin: '0.75rem 0', padding: '0.75rem 1rem',
          background: 'rgba(201,162,39,0.06)', borderRadius: '4px',
          borderLeft: '3px solid rgba(201,162,39,0.3)' }}>
          <div style={{ fontSize: '0.7rem', color: '#8B6914', letterSpacing: '0.12em',
            textTransform: 'uppercase', fontFamily: 'Playfair Display, serif', marginBottom: '0.25rem' }}>
            Padrão de Intervalos
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '1.05rem', color: '#e6c45a',
            letterSpacing: '0.08em' }}>{section.pattern}</div>
        </div>
      )}

      {section.example && (
        <div style={{ margin: '0.5rem 0', padding: '0.65rem 1rem',
          background: 'rgba(201,162,39,0.04)', borderRadius: '4px',
          fontFamily: 'Cormorant Garamond, serif', fontSize: '0.95rem',
          color: '#a0958a', fontStyle: 'italic' }}>
          <strong style={{ color: '#8B6914', fontStyle: 'normal',
            fontFamily: 'Playfair Display, serif', fontSize: '0.75rem',
            letterSpacing: '0.1em', textTransform: 'uppercase' }}>Exemplo: </strong>
          {section.example}
        </div>
      )}

      {section.rule && (
        <div style={{ margin: '0.75rem 0', padding: '0.75rem 1rem',
          background: 'rgba(139,26,26,0.12)', borderRadius: '4px',
          borderLeft: '3px solid rgba(139,26,26,0.4)' }}>
          <span style={{ fontSize: '0.75rem', color: '#c4393a', fontFamily: 'Playfair Display, serif',
            letterSpacing: '0.1em', textTransform: 'uppercase' }}>Regra: </span>
          <span style={{ color: '#c8bfb4', fontFamily: 'Cormorant Garamond, serif',
            fontSize: '0.95rem' }}>{section.rule}</span>
        </div>
      )}

      {section.degrees && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.75rem' }}>
          {section.degrees.map((d, i) => (
            <div key={i} style={{ padding: '0.75rem', background: 'rgba(201,162,39,0.05)',
              border: '1px solid rgba(201,162,39,0.15)', borderRadius: '4px' }}>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '0.9rem',
                color: '#e6c45a', marginBottom: '0.2rem' }}>{d.degree}</div>
              <div style={{ fontSize: '0.82rem', color: '#a0958a',
                fontFamily: 'Cormorant Garamond, serif' }}>{d.description}</div>
            </div>
          ))}
        </div>
      )}

      {section.factors && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.75rem' }}>
          {section.factors.map((f, i) => (
            <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start',
              padding: '0.85rem', background: 'rgba(201,162,39,0.04)',
              border: '1px solid rgba(201,162,39,0.12)', borderRadius: '4px' }}>
              <div style={{ fontSize: '1.5rem', lineHeight: 1, minWidth: 32,
                textAlign: 'center', color: '#c9a227' }}>{f.icon}</div>
              <div>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '0.95rem',
                  color: '#e6c45a', marginBottom: '0.2rem' }}>{f.name}</div>
                <div style={{ fontSize: '0.85rem', color: '#a0958a',
                  fontFamily: 'Cormorant Garamond, serif', lineHeight: 1.6 }}>{f.description}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {section.steps && (
        <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {section.steps.map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                background: 'rgba(201,162,39,0.15)', border: '1px solid rgba(201,162,39,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Playfair Display, serif', fontSize: '0.7rem', color: '#c9a227'
              }}>{i + 1}</div>
              <span style={{ fontSize: '0.9rem', color: '#c8bfb4',
                fontFamily: 'Cormorant Garamond, serif', lineHeight: 1.6 }}>{step}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
