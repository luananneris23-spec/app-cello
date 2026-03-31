import { useState, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { DOTZAUER_EXERCISES } from '../data/musicData'

const EXERCISE_PAGES = {
  1: { book: 'book1', page: 4 }, 2: { book: 'book1', page: 6 },
  3: { book: 'book1', page: 8 }, 5: { book: 'book1', page: 14 },
  8: { book: 'book1', page: 22 }, 12: { book: 'book1', page: 34 },
}

const EXERCISE_NOTATION = {
  1: {
    pattern: 'Dó · Ré · Mi · Fá | Sol · Lá · Si · Dó | Dó · Si · Lá · Sol | Fá · Mi · Ré · Dó',
    bowing: 'Arco completo por nota (4 tempos). Descida = arco; subida = arco.',
    fingerPattern: '0-1-2-3 na corda Ré · 0-1-2-3 na corda Lá',
    svgNotes: [
      { note: 'Dó', finger: 0, string: 'Ré' }, { note: 'Ré', finger: 1, string: 'Ré' },
      { note: 'Mi', finger: 2, string: 'Ré' }, { note: 'Fá', finger: 3, string: 'Ré' },
      { note: 'Sol', finger: 0, string: 'Lá' }, { note: 'Lá', finger: 1, string: 'Lá' },
      { note: 'Si', finger: 2, string: 'Lá' }, { note: 'Dó', finger: 3, string: 'Lá' },
    ]
  },
  2: {
    pattern: 'Sol · Lá · Si · Dó | Ré · Mi · Fá♯ · Sol | Sol · Fá♯ · Mi · Ré | Dó · Si · Lá · Sol',
    bowing: 'Détaché: cada nota com arco separado, movimento claro e articulado.',
    fingerPattern: '0-1-2-3 corda Sol · 0-1-2-3 corda Ré | F♯ = dedo 2 estendido',
    svgNotes: [
      { note: 'Sol', finger: 0, string: 'Sol' }, { note: 'Lá', finger: 1, string: 'Sol' },
      { note: 'Si', finger: 2, string: 'Sol' }, { note: 'Dó', finger: 3, string: 'Sol' },
      { note: 'Ré', finger: 0, string: 'Ré' }, { note: 'Mi', finger: 1, string: 'Ré' },
      { note: 'Fá♯', finger: 2, string: 'Ré' }, { note: 'Sol', finger: 3, string: 'Ré' },
    ]
  },
  3: {
    pattern: 'Ré-Mi | Fá♯-Sol | Lá-Si | Dó♯-Ré || Ré-Dó♯ | Si-Lá | Sol-Fá♯ | Mi-Ré',
    bowing: 'Slur 2-2: par de notas por arco. Ligado suave, sem marcação entre notas.',
    fingerPattern: '0-1 / 2-3 / 0-1 / 2-3 · Dó♯ = dedo 2, posição alta',
    svgNotes: [
      { note: 'Ré', finger: 0, string: 'Ré' }, { note: 'Mi', finger: 1, string: 'Ré' },
      { note: 'Fá♯', finger: 2, string: 'Ré' }, { note: 'Sol', finger: 3, string: 'Ré' },
      { note: 'Lá', finger: 0, string: 'Lá' }, { note: 'Si', finger: 1, string: 'Lá' },
      { note: 'Dó♯', finger: 2, string: 'Lá' }, { note: 'Ré', finger: 3, string: 'Lá' },
    ]
  },
}

function beepFn(ctx, time, isFirst) {
  const osc = ctx.createOscillator(); const g = ctx.createGain()
  osc.connect(g); g.connect(ctx.destination)
  osc.type = 'triangle'; osc.frequency.value = isFirst ? 1000 : 650
  g.gain.setValueAtTime(isFirst ? 0.3 : 0.15, time)
  g.gain.exponentialRampToValueAtTime(0.001, time + 0.06)
  osc.start(time); osc.stop(time + 0.07)
}

const PHASE_COLORS = { 1: '#8B6914', 2: '#2D5A8E', 3: '#5C2D91', 4: '#1A5C1A' }
const TECHNIQUE_LABELS = {
  notas_longas: 'Notas Longas', arco_completo: 'Arco Completo', legato: 'Legato',
  detache: 'Détaché', troca_arco: 'Troca de Arco', ligado: 'Ligado',
  slur_2: 'Slur 2', slur_4: 'Slur 4', cordas_dobradas: 'Cordas Duplas',
  duplo_som: 'Duplo Som', mudanca_posicao: 'Mudança de Pos.', polegar: 'Polegar',
  dinamica: 'Dinâmica', expressividade: 'Expressividade',
  crescendo_decrescendo: 'Cresc./Decresc.'
}

export default function Dotzauer() {
  const [selected, setSelected] = useState(null)
  const [bpm, setBpm] = useState(50)
  const [playing, setPlaying] = useState(false)
  const [beat, setBeat] = useState(0)
  const [phaseFilter, setPhaseFilter] = useState('all')
  const [activeTab, setActiveTab] = useState('instructions')

  const audioCtxRef = useRef(null)
  const timerRef = useRef(null)
  const nextNoteRef = useRef(0)
  const beatRef = useRef(0)
  const bpmRef = useRef(bpm)

  const filtered = DOTZAUER_EXERCISES.filter(e =>
    phaseFilter === 'all' || e.phase === Number(phaseFilter.replace('phase', ''))
  )

  const schedule = useCallback(() => {
    if (!audioCtxRef.current) return
    const ctx = audioCtxRef.current
    const spb = 60 / bpmRef.current
    const beats = selected?.timeSignature?.includes('3') ? 3 : 4
    while (nextNoteRef.current < ctx.currentTime + 0.1) {
      beepFn(ctx, nextNoteRef.current, beatRef.current === 0)
      setBeat(beatRef.current)
      beatRef.current = (beatRef.current + 1) % beats
      nextNoteRef.current += spb
    }
    timerRef.current = setTimeout(schedule, 25)
  }, [selected])

  const startMetro = useCallback(() => {
    if (!audioCtxRef.current)
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
    beatRef.current = 0
    nextNoteRef.current = audioCtxRef.current.currentTime + 0.05
    setPlaying(true); schedule()
  }, [schedule])

  const stopMetro = useCallback(() => {
    clearTimeout(timerRef.current); setPlaying(false); setBeat(0)
  }, [])

  const selectExercise = (ex) => {
    stopMetro(); setSelected(ex)
    setBpm(ex.bpmRange[0]); bpmRef.current = ex.bpmRange[0]
    setActiveTab('instructions')
  }

  const notation = selected ? EXERCISE_NOTATION[selected.number] : null
  const exPage = selected ? EXERCISE_PAGES[selected.number] : null

  return (
    <div style={{ padding: '2.5rem 2rem', maxWidth: 1200 }}>
      <div style={{ marginBottom: '2rem' }}>
        <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '0.75rem',
          letterSpacing: '0.2em', textTransform: 'uppercase', color: '#c9a227' }}>
          Método Fundamental
        </span>
        <h1 style={{ marginTop: '0.2rem' }}>Dotzauer — 113 Estudos</h1>
        <p style={{ fontStyle: 'italic', color: '#a0958a', marginTop: '0.3rem' }}>
          O método clássico que forma violoncelistas há dois séculos · Domínio público desde 1860
        </p>
      </div>

      <div style={{ padding: '1rem 1.25rem', background: 'rgba(201,162,39,0.04)',
        border: '1px solid rgba(201,162,39,0.15)', borderRadius: '6px', marginBottom: '1.5rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '0.9rem', color: '#e6c45a', marginBottom: '0.25rem' }}>
            Partituras em Domínio Público — IMSLP
          </div>
          <p style={{ fontSize: '0.82rem', color: '#a0958a', fontFamily: 'Cormorant Garamond, serif',
            lineHeight: 1.6, margin: 0 }}>
            Friedrich Dotzauer (1783–1860). Publicado c.1836. Domínio público mundial.
            Fonte: IMSLP / Petrucci Music Library — acesso gratuito e legal.
          </p>
        </div>
        <a href="https://imslp.org/wiki/113_Etudes_for_Cello_(Dotzauer,_Friedrich)"
          target="_blank" rel="noopener noreferrer"
          className="btn btn-secondary" style={{ flexShrink: 0, textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          ↗ Baixar PDFs no IMSLP
        </a>
      </div>

      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[
          { val: 'all', label: 'Todos' }, { val: 'phase1', label: 'Fase I (1–34)' },
          { val: 'phase2', label: 'Fase II (35–62)' }, { val: 'phase3', label: 'Fase III (63–85)' },
          { val: 'phase4', label: 'Fase IV (86–113)' },
        ].map(f => (
          <button key={f.val} onClick={() => setPhaseFilter(f.val)}
            className={`btn ${phaseFilter === f.val ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '0.35rem 0.9rem', fontSize: '0.8rem' }}>
            {f.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1.35fr' : '1fr', gap: '1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {filtered.map(ex => (
            <div key={ex.id} onClick={() => selectExercise(ex)} className="card"
              style={{ padding: '1.1rem 1.25rem', cursor: 'pointer',
                borderLeft: `3px solid ${PHASE_COLORS[ex.phase] || '#8B6914'}`,
                background: selected?.id === ex.id ? 'rgba(201,162,39,0.1)' : undefined }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '0.72rem',
                      color: '#8B6914', letterSpacing: '0.1em' }}>Nº {ex.number}</span>
                    <span className="badge badge-gold" style={{ fontSize: '0.6rem' }}>Fase {ex.phase}</span>
                    {EXERCISE_NOTATION[ex.number] && (
                      <span style={{ fontSize: '0.6rem', padding: '0.12rem 0.45rem', borderRadius: '2px',
                        background: 'rgba(76,175,80,0.12)', color: '#4CAF50',
                        border: '0.5px solid rgba(76,175,80,0.25)' }}>♩ Notação</span>
                    )}
                  </div>
                  <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '0.95rem', color: '#e6c45a', marginBottom: '0.15rem' }}>
                    {ex.title}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#c9a227', fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic' }}>
                    {ex.focus}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '0.75rem' }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#8B6914' }}>
                    {ex.bpmRange[0]}–{ex.bpmRange[1]}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#8B6914' }}>{ex.timeSignature}</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.5rem' }}>
                {ex.techniques.map(t => (
                  <span key={t} style={{ fontSize: '0.62rem', padding: '0.12rem 0.45rem', borderRadius: '2px',
                    background: 'rgba(201,162,39,0.06)', color: '#a0958a',
                    border: '0.5px solid rgba(201,162,39,0.12)', fontFamily: 'Cormorant Garamond, serif' }}>
                    {TECHNIQUE_LABELS[t] || t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {selected && (
          <div style={{ position: 'sticky', top: '1.5rem', alignSelf: 'start' }}>
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(201,162,39,0.15)', marginBottom: '1rem' }}>
              {[
                { key: 'instructions', label: '◧ Instruções' },
                { key: 'notation', label: '♩ Notação', disabled: !notation },
                { key: 'sheet', label: '📄 Partitura' },
              ].map(tab => (
                <button key={tab.key} onClick={() => !tab.disabled && setActiveTab(tab.key)}
                  style={{ padding: '0.55rem 0.9rem', border: 'none', cursor: tab.disabled ? 'default' : 'pointer',
                    background: 'transparent', fontSize: '0.8rem', fontFamily: 'Cormorant Garamond, serif',
                    color: activeTab === tab.key ? '#e6c45a' : tab.disabled ? 'rgba(160,149,138,0.3)' : '#8B6914',
                    borderBottom: `2px solid ${activeTab === tab.key ? '#c9a227' : 'transparent'}`,
                    transition: 'all 0.15s' }}>
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'instructions' && (
              <div className="card animate-fade-in" style={{ padding: '1.5rem' }}>
                <div style={{ marginBottom: '1rem', paddingBottom: '0.85rem', borderBottom: '1px solid rgba(201,162,39,0.1)' }}>
                  <div style={{ fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase',
                    color: '#8B6914', marginBottom: '0.2rem', fontFamily: 'Playfair Display, serif' }}>
                    Exercício {selected.number}
                  </div>
                  <h3 style={{ fontSize: '1.05rem', marginBottom: '0.5rem' }}>{selected.title}</h3>
                  <p style={{ fontSize: '0.88rem', color: '#a0958a', fontFamily: 'Cormorant Garamond, serif', lineHeight: 1.7, margin: 0 }}>
                    {selected.description}
                  </p>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase',
                    color: '#8B6914', marginBottom: '0.5rem', fontFamily: 'Playfair Display, serif' }}>
                    Metrônomo
                  </div>
                  <div style={{ textAlign: 'center', marginBottom: '0.6rem' }}>
                    <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '2.75rem',
                      color: '#e6c45a', lineHeight: 1, fontWeight: 700 }}>{bpm}</div>
                    <div style={{ fontSize: '0.65rem', color: '#8B6914', letterSpacing: '0.1em', textTransform: 'uppercase' }}>BPM</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'center', marginBottom: '0.6rem' }}>
                    {Array.from({ length: selected.timeSignature?.includes('3') ? 3 : 4 }).map((_, i) => (
                      <div key={i} style={{ width: 24, height: 24, borderRadius: '50%',
                        background: playing && beat === i ? (i === 0 ? '#c9a227' : '#8B6914') : 'rgba(201,162,39,0.06)',
                        border: `1.5px solid ${playing && beat === i ? '#e6c45a' : 'rgba(201,162,39,0.12)'}`,
                        transition: 'all 0.06s' }}/>
                    ))}
                  </div>
                  <input type="range" min={selected.bpmRange[0]} max={selected.bpmRange[1]} value={bpm}
                    onChange={e => { setBpm(Number(e.target.value)); bpmRef.current = Number(e.target.value) }}
                    style={{ width: '100%', marginBottom: '0.4rem' }}/>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem',
                    color: '#8B6914', marginBottom: '0.6rem', fontFamily: 'Cormorant Garamond, serif' }}>
                    <span>{selected.bpmRange[0]} BPM</span><span>{selected.bpmRange[1]} BPM</span>
                  </div>
                  <button onClick={playing ? stopMetro : startMetro}
                    className={`btn ${playing ? 'btn-danger' : 'btn-primary'}`}
                    style={{ width: '100%', justifyContent: 'center' }}>
                    {playing ? '⏹ Parar' : '▶ Iniciar Metrônomo'}
                  </button>
                </div>

                <hr className="gold-rule"/>

                <div style={{ fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase',
                  color: '#8B6914', marginBottom: '0.5rem', fontFamily: 'Playfair Display, serif' }}>
                  Sequência de Estudo
                </div>
                {selected.instructions.map((inst, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    <span style={{ color: '#c9a227', fontFamily: 'Playfair Display, serif', fontSize: '0.72rem', flexShrink: 0 }}>{i + 1}.</span>
                    <span style={{ fontSize: '0.83rem', color: '#a0958a', fontFamily: 'Cormorant Garamond, serif', lineHeight: 1.55 }}>{inst}</span>
                  </div>
                ))}

                {selected.scaleRef && (
                  <Link to={`/scales/${selected.scaleRef}`} className="btn btn-secondary"
                    style={{ marginTop: '1rem', width: '100%', justifyContent: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    🎵 Praticar escala relacionada
                  </Link>
                )}
              </div>
            )}

            {activeTab === 'notation' && notation && (
              <div className="card animate-fade-in" style={{ padding: '1.5rem' }}>
                <div style={{ fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase',
                  color: '#8B6914', marginBottom: '0.85rem', fontFamily: 'Playfair Display, serif' }}>
                  Notação e Digitação — Exercício {selected.number}
                </div>
                {[
                  { label: 'Sequência de Notas', content: notation.pattern, mono: true },
                  { label: 'Golpe de Arco', content: notation.bowing },
                  { label: 'Digitação', content: notation.fingerPattern },
                ].map(block => (
                  <div key={block.label} style={{ padding: '0.75rem 1rem', background: 'rgba(201,162,39,0.04)',
                    borderLeft: '3px solid rgba(201,162,39,0.25)', borderRadius: '0 4px 4px 0', marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '0.62rem', color: '#8B6914', marginBottom: '0.25rem',
                      fontFamily: 'Playfair Display, serif', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{block.label}</div>
                    <div style={{ fontFamily: block.mono ? 'monospace' : 'Cormorant Garamond, serif',
                      fontSize: block.mono ? '0.9rem' : '0.88rem', color: block.mono ? '#e6c45a' : '#c8bfb4',
                      lineHeight: 1.6 }}>{block.content}</div>
                  </div>
                ))}
                <div style={{ fontSize: '0.65rem', color: '#8B6914', marginBottom: '0.5rem',
                  fontFamily: 'Playfair Display, serif', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Progressão de Notas e Dedos
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  {notation.svgNotes.map((n, i) => (
                    <div key={i} style={{ textAlign: 'center' }}>
                      <div style={{ width: 38, height: 38, borderRadius: '50%',
                        background: 'rgba(201,162,39,0.1)', border: '1.5px solid rgba(201,162,39,0.25)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'Playfair Display, serif', fontSize: '0.78rem', color: '#e6c45a', marginBottom: '0.2rem' }}>
                        {n.note}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: '#c9a227', fontFamily: 'monospace' }}>{n.finger === 0 ? '0' : n.finger}</div>
                      <div style={{ fontSize: '0.6rem', color: '#8B6914', fontFamily: 'Cormorant Garamond, serif' }}>{n.string}</div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: '0.65rem 1rem', background: 'rgba(139,26,26,0.08)',
                  border: '0.5px solid rgba(139,26,26,0.2)', borderRadius: '4px', fontSize: '0.78rem',
                  color: '#a0958a', fontFamily: 'Cormorant Garamond, serif', lineHeight: 1.6 }}>
                  Esta é uma representação pedagógica simplificada.
                  Para a partitura completa, acesse a aba "Partitura".
                </div>
              </div>
            )}

            {activeTab === 'sheet' && (
              <div className="card animate-fade-in" style={{ padding: '1.5rem' }}>
                <div style={{ fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase',
                  color: '#8B6914', marginBottom: '0.85rem', fontFamily: 'Playfair Display, serif' }}>
                  Partitura Original — IMSLP
                </div>
                <p style={{ fontSize: '0.88rem', color: '#a0958a', fontFamily: 'Cormorant Garamond, serif',
                  lineHeight: 1.7, marginBottom: '1rem' }}>
                  O exercício <strong style={{ color: '#e6c45a' }}>Nº {selected.number}</strong> está no{' '}
                  <strong style={{ color: '#e6c45a' }}>
                    Livro {exPage ? { book1: '1 (Nº 1–34)', book2: '2 (Nº 35–62)', book3: '3 (Nº 63–85)', book4: '4 (Nº 86–113)' }[exPage.book] || '1' : '1'}
                  </strong>
                  {exPage ? `, p. ${exPage.page} aprox.` : ''}.
                </p>
                {[
                  { label: 'Livro 1 — Exercícios 1–34', book: 'book1', range: [1,34] },
                  { label: 'Livro 2 — Exercícios 35–62', book: 'book2', range: [35,62] },
                  { label: 'Livro 3 — Exercícios 63–85', book: 'book3', range: [63,85] },
                  { label: 'Livro 4 — Exercícios 86–113', book: 'book4', range: [86,113] },
                ].map(link => {
                  const isCurrent = selected.number >= link.range[0] && selected.number <= link.range[1]
                  return (
                    <a key={link.label}
                      href="https://imslp.org/wiki/113_Etudes_for_Cello_(Dotzauer,_Friedrich)"
                      target="_blank" rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '0.65rem 0.85rem', marginBottom: '0.4rem', borderRadius: '4px',
                        background: isCurrent ? 'rgba(201,162,39,0.1)' : 'rgba(201,162,39,0.03)',
                        border: `0.5px solid ${isCurrent ? 'rgba(201,162,39,0.35)' : 'rgba(201,162,39,0.12)'}`,
                        textDecoration: 'none', transition: 'all 0.15s' }}>
                      <span style={{ fontSize: '0.85rem', color: '#c8bfb4', fontFamily: 'Cormorant Garamond, serif' }}>
                        {link.label}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {isCurrent && <span style={{ fontSize: '0.62rem', padding: '0.12rem 0.45rem',
                          borderRadius: '2px', background: 'rgba(201,162,39,0.2)', color: '#c9a227',
                          fontFamily: 'Playfair Display, serif' }}>Este exercício</span>}
                        <span style={{ color: '#c9a227' }}>↗</span>
                      </div>
                    </a>
                  )
                })}
                <div style={{ marginTop: '0.75rem', padding: '0.75rem 1rem', background: 'rgba(201,162,39,0.04)',
                  border: '0.5px solid rgba(201,162,39,0.15)', borderRadius: '4px', fontSize: '0.8rem',
                  color: '#8B6914', fontFamily: 'Cormorant Garamond, serif', lineHeight: 1.6 }}>
                  <strong style={{ color: '#c9a227', fontFamily: 'Playfair Display, serif',
                    fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>IMSLP: </strong>
                  International Music Score Library Project — partituras em domínio público, gratuitas e legais.
                  Dotzauer (falecido 1860) está em domínio público em todo o mundo.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
