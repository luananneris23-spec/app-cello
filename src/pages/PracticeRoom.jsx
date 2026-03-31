import { useState, useEffect, useRef, useCallback } from 'react'
import { SCALES_CURRICULUM, getScaleData, NOTE_NAMES_PT } from '../data/musicData'

// ─── Síntese ─────────────────────────────────────────────────────────────────
function createTone(ctx, freq, time, duration = 0.8, type = 'sawtooth', gainVal = 0.3) {
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'; filter.frequency.value = freq * 5
  osc.connect(filter); filter.connect(g); g.connect(ctx.destination)
  osc.type = type; osc.frequency.value = freq
  g.gain.setValueAtTime(0, time)
  g.gain.linearRampToValueAtTime(gainVal, time + 0.03)
  g.gain.exponentialRampToValueAtTime(gainVal * 0.6, time + 0.2)
  g.gain.exponentialRampToValueAtTime(0.001, time + duration)
  osc.start(time); osc.stop(time + duration + 0.05)
}

function beep(ctx, time, isFirst) {
  const osc = ctx.createOscillator(); const g = ctx.createGain()
  osc.connect(g); g.connect(ctx.destination)
  osc.type = 'square'; osc.frequency.value = isFirst ? 1200 : 750
  g.gain.setValueAtTime(isFirst ? 0.35 : 0.18, time)
  g.gain.exponentialRampToValueAtTime(0.001, time + 0.06)
  osc.start(time); osc.stop(time + 0.07)
}

// Autocorrelação p/ pitch
function autoCorrelate(buf, sr) {
  let rms = 0
  for (let i = 0; i < buf.length; i++) rms += buf[i] * buf[i]
  if (Math.sqrt(rms / buf.length) < 0.012) return -1
  const c = new Array(buf.length).fill(0)
  for (let i = 0; i < buf.length / 2; i++)
    for (let j = 0; j < buf.length - i; j++) c[i] += buf[j] * buf[j + i]
  let d = 0; while (c[d] > c[d + 1]) d++
  let mx = -1, mp = -1
  for (let i = d; i < buf.length; i++) if (c[i] > mx) { mx = c[i]; mp = i }
  return sr / mp
}

const CHROMATIC = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
function freqToNote(freq) {
  if (!freq || freq <= 0) return null
  const semitones = 12 * Math.log2(freq / 440)
  const noteIdx = Math.round(semitones)
  const cents = (semitones - noteIdx) * 100
  return { note: CHROMATIC[((noteIdx % 12) + 12) % 12], cents: Math.round(cents), freq: Math.round(freq * 10) / 10 }
}

function noteToFreq(note, octave = 3) {
  const idx = CHROMATIC.indexOf(note)
  return 440 * Math.pow(2, (idx + (octave - 4) * 12 - 9) / 12)
}

export default function PracticeRoom() {
  const [selectedScaleId, setSelectedScaleId] = useState('c_maior')
  const [bpm, setBpm] = useState(60)
  const [metroOn, setMetroOn] = useState(false)
  const [tunerOn, setTunerOn] = useState(false)
  const [scalePlayOn, setScalePlayOn] = useState(false)
  const [beat, setBeat] = useState(0)
  const [currentNoteIdx, setCurrentNoteIdx] = useState(-1)
  const [tunerNote, setTunerNote] = useState(null)
  const [tunerCents, setTunerCents] = useState(0)
  const [tunerFreq, setTunerFreq] = useState(null)
  const [sessionTime, setSessionTime] = useState(0)
  const [tapTimes, setTapTimes] = useState([])
  const [scaleSpeed, setScaleSpeed] = useState(1) // notas por beat
  const [scaleOctave, setScaleOctave] = useState(3)
  const [noteHighlight, setNoteHighlight] = useState(-1) // index na escala que está tocando
  const [volume, setVolume] = useState(0.7)

  const audioCtxRef = useRef(null)
  const analyserRef = useRef(null)
  const streamRef = useRef(null)
  const metroTimer = useRef(null)
  const nextBeatRef = useRef(0)
  const beatNumRef = useRef(0)
  const scaleIdxRef = useRef(0)
  const rafRef = useRef(null)
  const sessionTimer = useRef(null)
  const bpmRef = useRef(bpm)
  const metroOnRef = useRef(false)
  const scalePlayOnRef = useRef(false)
  const volumeRef = useRef(volume)
  const scaleDataRef = useRef(null)
  const scaleOctaveRef = useRef(scaleOctave)

  useEffect(() => { bpmRef.current = bpm }, [bpm])
  useEffect(() => { volumeRef.current = volume }, [volume])
  useEffect(() => { scaleOctaveRef.current = scaleOctave }, [scaleOctave])

  const scale = SCALES_CURRICULUM.find(s => s.id === selectedScaleId) || SCALES_CURRICULUM[0]
  const scaleData = getScaleData(scale.root, scale.type)

  useEffect(() => { scaleDataRef.current = scaleData }, [scaleData])

  const getCtx = useCallback(() => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed')
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
    if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume()
    return audioCtxRef.current
  }, [])

  // ─── Metrônomo + Escala scheduler ─────────────────────────────────────────
  const scheduler = useCallback(() => {
    const ctx = getCtx()
    const spb = 60 / bpmRef.current
    while (nextBeatRef.current < ctx.currentTime + 0.12) {
      const t = nextBeatRef.current
      const isFirst = beatNumRef.current === 0

      // Metrônomo
      if (metroOnRef.current) beep(ctx, t, isFirst)

      const b = beatNumRef.current
      setBeat(b)

      // Tocar nota da escala
      if (scalePlayOnRef.current && scaleDataRef.current) {
        const notes = scaleDataRef.current.notes
        const idx = scaleIdxRef.current % notes.length
        const note = notes[idx]
        const freq = noteToFreq(note, scaleOctaveRef.current)
        createTone(ctx, freq, t, spb * 0.85, 'sawtooth', volumeRef.current * 0.4)
        const capturedIdx = idx
        setTimeout(() => setNoteHighlight(capturedIdx), (t - ctx.currentTime) * 1000)
        scaleIdxRef.current = (scaleIdxRef.current + 1) % (notes.length * 2 - 1)
      }

      beatNumRef.current = (beatNumRef.current + 1) % 4
      nextBeatRef.current += spb
    }
    metroTimer.current = setTimeout(scheduler, 25)
  }, [getCtx])

  const startEverything = useCallback(() => {
    const ctx = getCtx()
    beatNumRef.current = 0
    scaleIdxRef.current = 0
    nextBeatRef.current = ctx.currentTime + 0.05
    metroTimer.current = setTimeout(scheduler, 0)

    // Timer de sessão
    sessionTimer.current = setInterval(() => setSessionTime(s => s + 1), 1000)
  }, [getCtx, scheduler])

  const stopEverything = useCallback(() => {
    clearTimeout(metroTimer.current)
    clearInterval(sessionTimer.current)
    setBeat(0); setNoteHighlight(-1)
  }, [])

  const isRunning = metroOn || scalePlayOn

  const toggleMetro = () => {
    if (!isRunning && !metroOn) {
      metroOnRef.current = true
      setMetroOn(true)
      startEverything()
    } else {
      metroOnRef.current = !metroOn
      setMetroOn(m => !m)
      if (!scalePlayOnRef.current && metroOnRef.current === false) stopEverything()
      else if (metroOnRef.current) startEverything()
    }
  }

  const toggleScalePlay = () => {
    if (!isRunning && !scalePlayOn) {
      scalePlayOnRef.current = true
      setScalePlayOn(true)
      startEverything()
    } else {
      scalePlayOnRef.current = !scalePlayOn
      setScalePlayOn(s => !s)
      if (!metroOnRef.current && scalePlayOnRef.current === false) stopEverything()
      else if (scalePlayOnRef.current) startEverything()
    }
  }

  const stopAll = () => {
    metroOnRef.current = false
    scalePlayOnRef.current = false
    setMetroOn(false)
    setScalePlayOn(false)
    stopTuner()
    stopEverything()
    setSessionTime(0)
  }

  useEffect(() => {
    if (isRunning) {
      clearTimeout(metroTimer.current)
      clearInterval(sessionTimer.current)
      const ctx = getCtx()
      beatNumRef.current = 0
      scaleIdxRef.current = 0
      nextBeatRef.current = ctx.currentTime + 0.05
      scheduler()
      sessionTimer.current = setInterval(() => setSessionTime(s => s + 1), 1000)
    }
  }, [bpm])

  // ─── Afinador ────────────────────────────────────────────────────────────────
  const startTuner = useCallback(async () => {
    try {
      const ctx = getCtx()
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true })
      analyserRef.current = ctx.createAnalyser()
      analyserRef.current.fftSize = 2048
      const src = ctx.createMediaStreamSource(streamRef.current)
      src.connect(analyserRef.current)
      setTunerOn(true)
      const tick = () => {
        if (!analyserRef.current) return
        const buf = new Float32Array(analyserRef.current.fftSize)
        analyserRef.current.getFloatTimeDomainData(buf)
        const freq = autoCorrelate(buf, ctx.sampleRate)
        if (freq > 50 && freq < 1200) {
          const n = freqToNote(freq)
          if (n) { setTunerNote(n.note); setTunerCents(n.cents); setTunerFreq(n.freq) }
        }
        rafRef.current = requestAnimationFrame(tick)
      }
      tick()
    } catch { alert('Microfone necessário para o afinador') }
  }, [getCtx])

  const stopTuner = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    analyserRef.current?.disconnect()
    streamRef.current?.getTracks().forEach(t => t.stop())
    analyserRef.current = null; streamRef.current = null
    setTunerOn(false); setTunerNote(null); setTunerCents(0); setTunerFreq(null)
  }, [])

  // Tap tempo
  const handleTap = () => {
    const now = Date.now()
    setTapTimes(prev => {
      const recent = [...prev.filter(t => now - t < 4000), now]
      if (recent.length >= 2) {
        const intervals = recent.slice(1).map((t, i) => t - recent[i])
        const avg = intervals.reduce((a,b) => a+b, 0) / intervals.length
        const newBpm = Math.round(60000 / avg)
        if (newBpm >= 20 && newBpm <= 240) setBpm(newBpm)
      }
      return recent
    })
  }

  useEffect(() => () => {
    stopAll()
    stopTuner()
  }, [])

  const tuningColor = tunerNote
    ? Math.abs(tunerCents) < 5 ? '#4CAF50' : Math.abs(tunerCents) < 15 ? '#FFC107' : '#F44336'
    : '#c9a227'

  const needleAngle = tunerNote ? Math.max(-44, Math.min(44, tunerCents * 0.88)) : 0
  const fmt = s => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`
  const NOTE_PT = { C:'Dó','C#':'Dó♯',D:'Ré','D#':'Ré♯',E:'Mi',F:'Fá','F#':'Fá♯',G:'Sol','G#':'Sol♯',A:'Lá','A#':'Lá♯',B:'Si' }

  return (
    <div style={{ padding: '2rem', maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '0.72rem',
          letterSpacing: '0.22em', textTransform: 'uppercase', color: '#c9a227' }}>
          Estúdio
        </span>
        <h1 style={{ marginTop: '0.2rem', fontSize: '2rem' }}>Sala de Prática Integrada</h1>
        <p style={{ fontStyle: 'italic', color: '#a0958a', marginTop: '0.25rem', fontSize: '0.95rem' }}>
          Metrônomo + afinador + escala — tudo em sincronia
        </p>
      </div>

      {/* Seleção de escala */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase',
              color: '#8B6914', marginBottom: '0.4rem', fontFamily: 'Playfair Display, serif' }}>
              Escala Ativa
            </div>
            <select value={selectedScaleId} onChange={e => {
                setSelectedScaleId(e.target.value)
                scaleIdxRef.current = 0; setNoteHighlight(-1)
              }}
              style={{ fontSize: '1rem', padding: '0.55rem 0.85rem' }}>
              {SCALES_CURRICULUM.map(s => (
                <option key={s.id} value={s.id}>{s.name} — {s.type.replace('_',' ')}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase',
                color: '#8B6914', marginBottom: '0.3rem', fontFamily: 'Playfair Display, serif' }}>Oitava</div>
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                {[2,3,4].map(o => (
                  <button key={o} onClick={() => setScaleOctave(o)}
                    className={`btn ${scaleOctave === o ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.85rem' }}>{o}</button>
                ))}
              </div>
            </div>
            <div style={{ minWidth: 160 }}>
              <div style={{ fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase',
                color: '#8B6914', marginBottom: '0.3rem', fontFamily: 'Playfair Display, serif' }}>
                Volume do Violoncelo
              </div>
              <input type="range" min="0" max="1" step="0.05" value={volume}
                onChange={e => setVolume(Number(e.target.value))}
                style={{ width: '100%' }}/>
            </div>
          </div>
        </div>
      </div>

      {/* Notas da escala — visualizador */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase',
            color: '#8B6914', fontFamily: 'Playfair Display, serif' }}>
            Notas da Escala — {scale.name}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span className="badge badge-gold" style={{ fontSize: '0.65rem' }}>Fase {scale.phase}</span>
            <span className="badge badge-silver" style={{ fontSize: '0.65rem' }}>{scale.positions}</span>
          </div>
        </div>

        {/* Visualizador de notas */}
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {scaleData.notes.map((note, i) => {
            const isTonic = note === scale.root
            const isCurrent = noteHighlight === i
            const tunerMatch = tunerNote === note
            const degreeNames = ['I','II','III','IV','V','VI','VII','VIII']

            return (
              <div key={i} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem',
                transition: 'transform 0.1s'
              }}>
                <div style={{ fontSize: '0.6rem', color: isTonic ? '#c9a227' : '#8B6914',
                  fontFamily: 'Playfair Display, serif', letterSpacing: '0.05em' }}>
                  {degreeNames[i]}
                </div>
                <div style={{
                  width: 52, height: 52, borderRadius: '50%',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  background: isCurrent ? 'rgba(201,162,39,0.35)'
                    : tunerMatch && tunerOn ? 'rgba(76,175,80,0.2)'
                    : isTonic ? 'rgba(201,162,39,0.15)' : 'rgba(201,162,39,0.05)',
                  border: `2px solid ${isCurrent ? '#e6c45a'
                    : tunerMatch && tunerOn ? '#4CAF50'
                    : isTonic ? 'rgba(201,162,39,0.5)' : 'rgba(201,162,39,0.15)'}`,
                  transition: 'all 0.08s',
                  boxShadow: isCurrent ? '0 0 16px rgba(201,162,39,0.4)'
                    : tunerMatch && tunerOn ? '0 0 10px rgba(76,175,80,0.3)' : 'none',
                  transform: isCurrent ? 'scale(1.12)' : 'scale(1)'
                }}>
                  <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1rem',
                    color: isCurrent ? '#e6c45a' : tunerMatch && tunerOn ? '#4CAF50' : '#c9a227',
                    lineHeight: 1.1, fontWeight: isTonic ? 700 : 400 }}>
                    {NOTE_PT[note] || note}
                  </div>
                  <div style={{ fontSize: '0.55rem', color: '#8B6914', fontFamily: 'monospace' }}>
                    {note}{scaleOctave}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Legenda */}
        <div style={{ display: 'flex', gap: '1.25rem', justifyContent: 'center', marginTop: '0.85rem', flexWrap: 'wrap' }}>
          {[
            { color: 'rgba(201,162,39,0.35)', border: '#e6c45a', label: 'Nota em reprodução' },
            { color: 'rgba(76,175,80,0.2)', border: '#4CAF50', label: 'Nota detectada (afinador)' },
            { color: 'rgba(201,162,39,0.15)', border: 'rgba(201,162,39,0.5)', label: 'Tônica (I grau)' },
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%',
                background: l.color, border: `1.5px solid ${l.border}` }}/>
              <span style={{ fontSize: '0.72rem', color: '#8B6914',
                fontFamily: 'Cormorant Garamond, serif' }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Controles principais */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>

        {/* Metrônomo */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase',
              color: '#8B6914', fontFamily: 'Playfair Display, serif' }}>Metrônomo</div>
            <div style={{ width: 8, height: 8, borderRadius: '50%',
              background: metroOn ? '#4CAF50' : 'rgba(201,162,39,0.2)',
              boxShadow: metroOn ? '0 0 6px rgba(76,175,80,0.5)' : 'none' }}/>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '0.85rem' }}>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '3rem',
              color: '#e6c45a', lineHeight: 1, fontWeight: 700 }}>{bpm}</div>
            <div style={{ fontSize: '0.65rem', color: '#8B6914', letterSpacing: '0.12em',
              textTransform: 'uppercase' }}>BPM</div>
          </div>

          {/* Beats */}
          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center', marginBottom: '0.75rem' }}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{
                width: 28, height: 28, borderRadius: '50%',
                background: isRunning && beat === i ? (i === 0 ? '#c9a227' : '#8B6914') : 'rgba(201,162,39,0.06)',
                border: `1.5px solid ${isRunning && beat === i ? '#e6c45a' : 'rgba(201,162,39,0.15)'}`,
                transition: 'all 0.06s', boxShadow: isRunning && beat === i && i === 0 ? '0 0 8px rgba(201,162,39,0.4)' : 'none'
              }}/>
            ))}
          </div>

          <input type="range" min="20" max="200" value={bpm}
            onChange={e => setBpm(Number(e.target.value))}
            style={{ width: '100%', marginBottom: '0.5rem' }}/>

          <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'center', marginBottom: '0.75rem' }}>
            {[-10,-5,'+5','+10'].map(d => (
              <button key={d} onClick={() => setBpm(b => Math.max(20, Math.min(200, b + parseInt(d))))}
                className="btn btn-ghost" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                {d}
              </button>
            ))}
            <button onClick={handleTap} className="btn btn-outline"
              style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', marginLeft: '0.25rem' }}>
              Tap
            </button>
          </div>

          <button onClick={toggleMetro}
            className={`btn ${metroOn ? 'btn-danger' : 'btn-primary'}`}
            style={{ width: '100%', justifyContent: 'center', padding: '0.6rem' }}>
            {metroOn ? '⏹ Pausar' : '▶ Metrônomo'}
          </button>
        </div>

        {/* Escala em reprodução */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase',
              color: '#8B6914', fontFamily: 'Playfair Display, serif' }}>Escala Sonora</div>
            <div style={{ width: 8, height: 8, borderRadius: '50%',
              background: scalePlayOn ? '#c9a227' : 'rgba(201,162,39,0.2)',
              boxShadow: scalePlayOn ? '0 0 6px rgba(201,162,39,0.5)' : 'none' }}/>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.1rem',
              color: '#e6c45a', marginBottom: '0.25rem' }}>{scale.name}</div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '2.2rem',
              color: noteHighlight >= 0 ? '#c9a227' : 'rgba(201,162,39,0.3)',
              lineHeight: 1, transition: 'all 0.08s', fontWeight: 700 }}>
              {noteHighlight >= 0 ? (NOTE_PT[scaleData.notes[noteHighlight]] || scaleData.notes[noteHighlight]) : '—'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#8B6914', fontFamily: 'monospace', marginTop: '0.2rem' }}>
              {noteHighlight >= 0 ? scaleData.notes[noteHighlight] + scaleOctave : ''}
            </div>
          </div>

          <div style={{ fontSize: '0.65rem', color: '#8B6914', marginBottom: '0.4rem',
            fontFamily: 'Playfair Display, serif', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Notas: {scaleData.notes.join(' · ')}
          </div>

          <div style={{ marginBottom: '0.75rem', padding: '0.5rem 0.75rem',
            background: 'rgba(201,162,39,0.04)', borderRadius: '3px', fontSize: '0.78rem',
            color: '#8B6914', fontFamily: 'Cormorant Garamond, serif' }}>
            ◆ Tônica: <strong style={{ color: '#e6c45a' }}>{NOTE_PT[scaleData.tonic]}</strong> ·
            Dominante: <strong style={{ color: '#e6c45a' }}>{NOTE_PT[scaleData.dominant]}</strong>
          </div>

          <button onClick={toggleScalePlay}
            className={`btn ${scalePlayOn ? 'btn-danger' : 'btn-secondary'}`}
            style={{ width: '100%', justifyContent: 'center', padding: '0.6rem' }}>
            {scalePlayOn ? '⏹ Parar Escala' : '♫ Tocar Escala'}
          </button>
        </div>

        {/* Afinador */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.68nm', fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase',
              color: '#8B6914', fontFamily: 'Playfair Display, serif' }}>Afinador</div>
            <div style={{ width: 8, height: 8, borderRadius: '50%',
              background: tunerOn ? '#4CAF50' : 'rgba(201,162,39,0.2)',
              boxShadow: tunerOn ? '0 0 6px rgba(76,175,80,0.5)' : 'none' }}/>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '3.5rem',
              color: tunerNote ? tuningColor : 'rgba(201,162,39,0.3)',
              lineHeight: 1, transition: 'color 0.15s', fontWeight: 700 }}>
              {tunerNote ? (NOTE_PT[tunerNote] || tunerNote) : '—'}
            </div>
            {tunerNote && (
              <>
                <div style={{ fontFamily: 'monospace', fontSize: '0.85rem',
                  color: tuningColor, marginTop: '0.2rem' }}>
                  {tunerCents > 0 ? '+' : ''}{tunerCents} cents · {tunerFreq} Hz
                </div>
                {Math.abs(tunerCents) < 5 && (
                  <div style={{ color: '#4CAF50', fontSize: '0.72rem', marginTop: '0.2rem',
                    fontFamily: 'Playfair Display, serif', letterSpacing: '0.12em' }}>
                    ✓ AFINADO
                  </div>
                )}
              </>
            )}
          </div>

          {/* Mini agulha */}
          <svg width="160" height="80" viewBox="0 0 160 80" style={{ display: 'block', margin: '0 auto 0.5rem' }}>
            <path d="M 18 72 A 65 65 0 0 1 142 72" stroke="rgba(201,162,39,0.1)" strokeWidth="14" fill="none"/>
            <path d="M 75 72 A 65 65 0 0 1 85 72" stroke="rgba(76,175,80,0.5)" strokeWidth="14" fill="none"/>
            <line
              x1="80" y1="72"
              x2={80 + 55 * Math.cos((needleAngle - 90) * Math.PI / 180)}
              y2={72 + 55 * Math.sin((needleAngle - 90) * Math.PI / 180)}
              stroke={tunerNote ? tuningColor : 'rgba(201,162,39,0.3)'}
              strokeWidth="2" strokeLinecap="round"
              style={{ transition: 'all 0.1s' }}
            />
            <circle cx="80" cy="72" r="4" fill={tunerNote ? tuningColor : 'rgba(201,162,39,0.3)'}/>
            <text x="8" y="70" fill="rgba(160,149,138,0.5)" fontSize="9" fontFamily="monospace">♭</text>
            <text x="145" y="70" fill="rgba(160,149,138,0.5)" fontSize="9" fontFamily="monospace">♯</text>
          </svg>

          <button onClick={tunerOn ? stopTuner : startTuner}
            className={`btn ${tunerOn ? 'btn-danger' : 'btn-secondary'}`}
            style={{ width: '100%', justifyContent: 'center', padding: '0.6rem', marginBottom: '0.5rem' }}>
            {tunerOn ? '⏹ Desligar' : '🎙 Afinador'}
          </button>
          {!tunerOn && <p style={{ fontSize: '0.7rem', color: '#8B6914', textAlign: 'center',
            fontStyle: 'italic', fontFamily: 'Cormorant Garamond, serif' }}>Requer microfone</p>}
        </div>
      </div>

      {/* Barra de status + parar tudo */}
      <div className="card" style={{ padding: '1rem 1.5rem', display: 'flex',
        justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '1.5rem', color: '#e6c45a' }}>
            {fmt(sessionTime)}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <StatusPill active={metroOn} label="Metrônomo" color="#4CAF50" />
            <StatusPill active={scalePlayOn} label="Escala" color="#c9a227" />
            <StatusPill active={tunerOn} label="Afinador" color="#4CAF50" />
          </div>
        </div>
        <button onClick={stopAll} className="btn btn-danger"
          style={{ padding: '0.65rem 1.75rem' }}>
          ⏹ Parar Tudo
        </button>
      </div>

      {/* Dicas de uso */}
      <div className="card" style={{ padding: '1.25rem', marginTop: '1.25rem' }}>
        <div style={{ fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase',
          color: '#8B6914', marginBottom: '0.75rem', fontFamily: 'Playfair Display, serif' }}>
          Como usar a Sala de Prática
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
          {[
            { icon: '1', text: 'Escolha a escala e ajuste o BPM ao seu nível atual' },
            { icon: '2', text: 'Ligue o metrônomo e afine o violoncelo com o afinador' },
            { icon: '3', text: 'Ative "Tocar Escala" para ouvir a referência das notas' },
            { icon: '4', text: 'Toque junto — a nota detectada acende no visualizador' },
          ].map(tip => (
            <div key={tip.icon} style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-start' }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                background: 'rgba(201,162,39,0.15)', border: '1px solid rgba(201,162,39,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Playfair Display, serif', fontSize: '0.7rem', color: '#c9a227' }}>
                {tip.icon}
              </div>
              <p style={{ fontSize: '0.85rem', color: '#a0958a',
                fontFamily: 'Cormorant Garamond, serif', lineHeight: 1.55, margin: 0 }}>{tip.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatusPill({ active, label, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem',
      padding: '0.3rem 0.65rem', borderRadius: '2rem',
      background: active ? `${color}18` : 'rgba(201,162,39,0.05)',
      border: `0.5px solid ${active ? color + '55' : 'rgba(201,162,39,0.15)'}` }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%',
        background: active ? color : 'rgba(201,162,39,0.2)',
        boxShadow: active ? `0 0 5px ${color}80` : 'none' }}/>
      <span style={{ fontSize: '0.72rem', color: active ? color : '#8B6914',
        fontFamily: 'Cormorant Garamond, serif', letterSpacing: '0.05em' }}>{label}</span>
    </div>
  )
}
