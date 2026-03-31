import { useState, useEffect, useRef, useCallback } from 'react'

const TIME_SIGNATURES = [
  { label: '4/4', beats: 4, value: 4 },
  { label: '3/4', beats: 3, value: 4 },
  { label: '2/4', beats: 2, value: 4 },
  { label: '6/8', beats: 6, value: 8 },
  { label: '3/8', beats: 3, value: 8 },
]

const SUBDIVISIONS = [
  { label: 'Semínimas', value: 1 },
  { label: 'Colcheias', value: 2 },
  { label: 'Tercinas', value: 3 },
  { label: 'Semicolcheias', value: 4 },
]

const BPM_PRESETS = [
  { label: 'Larghissimo', bpm: 24 }, { label: 'Grave', bpm: 35 },
  { label: 'Largo', bpm: 46 }, { label: 'Larghetto', bpm: 54 },
  { label: 'Adagio', bpm: 66 }, { label: 'Andante', bpm: 76 },
  { label: 'Moderato', bpm: 92 }, { label: 'Allegretto', bpm: 108 },
  { label: 'Allegro', bpm: 126 }, { label: 'Vivace', bpm: 140 },
  { label: 'Presto', bpm: 168 }, { label: 'Prestissimo', bpm: 200 },
]

export default function Rhythm() {
  const [bpm, setBpm] = useState(60)
  const [playing, setPlaying] = useState(false)
  const [beat, setBeat] = useState(0)
  const [subBeat, setSubBeat] = useState(0)
  const [timeSig, setTimeSig] = useState(TIME_SIGNATURES[0])
  const [subdivision, setSubdivision] = useState(SUBDIVISIONS[0])
  const [accentFirst, setAccentFirst] = useState(true)
  const [tapTimes, setTapTimes] = useState([])

  const audioCtxRef = useRef(null)
  const nextNoteRef = useRef(0)
  const beatCountRef = useRef(0)
  const subCountRef = useRef(0)
  const timerRef = useRef(null)
  const bpmRef = useRef(bpm)
  const timeSigRef = useRef(timeSig)
  const subdivisionRef = useRef(subdivision)
  const accentRef = useRef(accentFirst)

  useEffect(() => { bpmRef.current = bpm }, [bpm])
  useEffect(() => { timeSigRef.current = timeSig }, [timeSig])
  useEffect(() => { subdivisionRef.current = subdivision }, [subdivision])
  useEffect(() => { accentRef.current = accentFirst }, [accentFirst])

  const beep = useCallback((ctx, time, isAccent, isFirstBeat) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'square'
    if (isFirstBeat && accentRef.current) {
      osc.frequency.value = 1200
      gain.gain.setValueAtTime(0.4, time)
    } else if (isAccent) {
      osc.frequency.value = 900
      gain.gain.setValueAtTime(0.25, time)
    } else {
      osc.frequency.value = 600
      gain.gain.setValueAtTime(0.12, time)
    }
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05)
    osc.start(time)
    osc.stop(time + 0.05)
  }, [])

  const scheduler = useCallback(() => {
    if (!audioCtxRef.current) return
    const ctx = audioCtxRef.current
    const secPerBeat = 60 / bpmRef.current / subdivisionRef.current.value
    const lookAhead = 0.1

    while (nextNoteRef.current < ctx.currentTime + lookAhead) {
      const isFirstBeat = subCountRef.current === 0 && beatCountRef.current === 0
      const isNewBeat = subCountRef.current === 0
      beep(ctx, nextNoteRef.current, isNewBeat, isFirstBeat)

      const b = beatCountRef.current
      const s = subCountRef.current
      setBeat(b)
      setSubBeat(s)

      subCountRef.current++
      if (subCountRef.current >= subdivisionRef.current.value) {
        subCountRef.current = 0
        beatCountRef.current = (beatCountRef.current + 1) % timeSigRef.current.beats
      }
      nextNoteRef.current += secPerBeat
    }
    timerRef.current = setTimeout(scheduler, 25)
  }, [beep])

  const startMetronome = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }
    beatCountRef.current = 0
    subCountRef.current = 0
    nextNoteRef.current = audioCtxRef.current.currentTime + 0.05
    setPlaying(true)
    setBeat(0)
    scheduler()
  }, [scheduler])

  const stopMetronome = useCallback(() => {
    clearTimeout(timerRef.current)
    setPlaying(false)
    setBeat(0)
    setSubBeat(0)
  }, [])

  useEffect(() => () => clearTimeout(timerRef.current), [])

  // Tap tempo
  const handleTap = () => {
    const now = Date.now()
    setTapTimes(prev => {
      const recent = [...prev.filter(t => now - t < 3000), now]
      if (recent.length >= 2) {
        const intervals = []
        for (let i = 1; i < recent.length; i++) intervals.push(recent[i] - recent[i-1])
        const avg = intervals.reduce((a,b) => a+b, 0) / intervals.length
        const newBpm = Math.round(60000 / avg)
        if (newBpm >= 20 && newBpm <= 240) setBpm(newBpm)
      }
      return recent
    })
  }

  const currentTempo = BPM_PRESETS.reduce((prev, curr) =>
    Math.abs(curr.bpm - bpm) < Math.abs(prev.bpm - bpm) ? curr : prev)

  return (
    <div style={{ padding: '2.5rem 2rem', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '0.75rem',
          letterSpacing: '0.2em', textTransform: 'uppercase', color: '#c9a227' }}>
          Ritmo
        </span>
        <h1 style={{ marginTop: '0.2rem' }}>Metrônomo</h1>
        <p style={{ fontStyle: 'italic', color: '#a0958a', marginTop: '0.3rem' }}>
          O pulso é a base — sem ritmo, não há música
        </p>
      </div>

      {/* Pêndulo visual */}
      <div className="card" style={{ padding: '2.5rem', textAlign: 'center', marginBottom: '1.5rem' }}>
        {/* BPM Display */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '5rem',
            color: '#e6c45a', lineHeight: 1, fontWeight: 700 }}>{bpm}</div>
          <div style={{ fontSize: '0.85rem', color: '#c9a227', letterSpacing: '0.15em',
            textTransform: 'uppercase', fontFamily: 'Playfair Display, serif' }}>
            {currentTempo.label}
          </div>
        </div>

        {/* Beats visual */}
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '1.75rem' }}>
          {Array.from({ length: timeSig.beats }).map((_, i) => {
            const isActive = playing && beat === i
            const isFirst = i === 0
            return (
              <div key={i} style={{
                width: 40, height: 40, borderRadius: '50%',
                background: isActive
                  ? isFirst ? '#c9a227' : '#8B6914'
                  : 'rgba(201,162,39,0.08)',
                border: `2px solid ${isActive ? (isFirst ? '#e6c45a' : '#c9a227') : 'rgba(201,162,39,0.2)'}`,
                transition: 'all 0.05s',
                boxShadow: isActive && isFirst ? '0 0 12px rgba(201,162,39,0.5)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Playfair Display, serif', fontSize: '0.8rem',
                color: isActive ? '#1a1209' : '#8B6914', fontWeight: 700
              }}>
                {i + 1}
              </div>
            )
          })}
        </div>

        {/* Slider BPM */}
        <div style={{ padding: '0 1rem', marginBottom: '1.25rem' }}>
          <input type="range" min="20" max="240" value={bpm}
            onChange={e => setBpm(Number(e.target.value))}
            style={{ width: '100%', cursor: 'pointer' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between',
            fontSize: '0.7rem', color: '#8B6914', marginTop: '0.3rem',
            fontFamily: 'Cormorant Garamond, serif' }}>
            <span>20 BPM</span><span>240 BPM</span>
          </div>
        </div>

        {/* Controles ± */}
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '1.25rem' }}>
          {[-10,-5,-1,'+1','+5','+10'].map(delta => {
            const d = typeof delta === 'string' ? parseInt(delta) : delta
            return (
              <button key={delta} onClick={() => setBpm(b => Math.max(20, Math.min(240, b + d)))}
                className="btn btn-ghost"
                style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', minWidth: 40 }}>
                {delta > 0 ? `+${delta}` : delta}
              </button>
            )
          })}
        </div>

        {/* Play/Stop + Tap */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button onClick={playing ? stopMetronome : startMetronome}
            className={`btn ${playing ? 'btn-danger' : 'btn-primary'}`}
            style={{ padding: '0.85rem 2.5rem', fontSize: '1rem', minWidth: 160 }}>
            {playing ? '⏹ Parar' : '▶ Iniciar'}
          </button>
          <button onClick={handleTap}
            className="btn btn-secondary"
            style={{ padding: '0.85rem 1.5rem', fontSize: '0.9rem' }}>
            Tap
          </button>
        </div>
      </div>

      {/* Configurações */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        {/* Compasso */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase',
            color: '#8B6914', marginBottom: '0.75rem', fontFamily: 'Playfair Display, serif' }}>
            Compasso
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {TIME_SIGNATURES.map(ts => (
              <button key={ts.label} onClick={() => setTimeSig(ts)}
                className={`btn ${timeSig.label === ts.label ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding: '0.35rem 0.7rem', fontSize: '0.85rem', fontFamily: 'monospace' }}>
                {ts.label}
              </button>
            ))}
          </div>
        </div>

        {/* Subdivisão */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase',
            color: '#8B6914', marginBottom: '0.75rem', fontFamily: 'Playfair Display, serif' }}>
            Subdivisão
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {SUBDIVISIONS.map(s => (
              <button key={s.label} onClick={() => setSubdivision(s)}
                className={`btn ${subdivision.value === s.value ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem' }}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Opções */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
          <div style={{
            width: 40, height: 22, borderRadius: 11,
            background: accentFirst ? 'rgba(201,162,39,0.4)' : 'rgba(201,162,39,0.1)',
            border: `1px solid ${accentFirst ? '#c9a227' : 'rgba(201,162,39,0.3)'}`,
            position: 'relative', transition: 'all 0.2s', cursor: 'pointer'
          }} onClick={() => setAccentFirst(a => !a)}>
            <div style={{
              position: 'absolute', top: 2, left: accentFirst ? 20 : 2,
              width: 16, height: 16, borderRadius: '50%',
              background: accentFirst ? '#c9a227' : 'rgba(201,162,39,0.4)',
              transition: 'left 0.2s'
            }}/>
          </div>
          <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '0.95rem', color: '#c8bfb4' }}>
            Acento no 1° tempo
          </span>
        </label>
      </div>

      {/* Tempos clássicos */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase',
          color: '#8B6914', marginBottom: '0.75rem', fontFamily: 'Playfair Display, serif' }}>
          Indicações de Andamento
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.4rem' }}>
          {BPM_PRESETS.map(preset => (
            <button key={preset.label} onClick={() => setBpm(preset.bpm)}
              className="btn btn-ghost"
              style={{
                padding: '0.4rem 0.6rem', fontSize: '0.8rem', justifyContent: 'space-between',
                background: Math.abs(bpm - preset.bpm) < 5 ? 'rgba(201,162,39,0.1)' : 'transparent',
                borderColor: Math.abs(bpm - preset.bpm) < 5 ? 'rgba(201,162,39,0.4)' : 'rgba(160,149,138,0.2)'
              }}>
              <span style={{ fontStyle: 'italic', fontFamily: 'Cormorant Garamond, serif' }}>{preset.label}</span>
              <span style={{ fontFamily: 'monospace', color: '#8B6914', fontSize: '0.75rem' }}>{preset.bpm}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
