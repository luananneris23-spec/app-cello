import { useState, useRef, useCallback, useEffect } from 'react'

// ─── Síntese de áudio com timbre de cordas ───────────────────────────────────
function createCelloTone(ctx, freq, duration = 1.2, gain = 0.4) {
  const t = ctx.currentTime
  const osc1 = ctx.createOscillator()
  const osc2 = ctx.createOscillator()
  const osc3 = ctx.createOscillator()
  const gainNode = ctx.createGain()
  const filter = ctx.createBiquadFilter()

  // Timbre de cordas: fundamental + harmônicos
  osc1.type = 'sawtooth'; osc1.frequency.value = freq
  osc2.type = 'sawtooth'; osc2.frequency.value = freq * 2
  osc3.type = 'sawtooth'; osc3.frequency.value = freq * 3

  const g1 = ctx.createGain(); g1.gain.value = 0.6
  const g2 = ctx.createGain(); g2.gain.value = 0.25
  const g3 = ctx.createGain(); g3.gain.value = 0.1

  osc1.connect(g1); osc2.connect(g2); osc3.connect(g3)
  g1.connect(filter); g2.connect(filter); g3.connect(filter)

  filter.type = 'lowpass'
  filter.frequency.value = freq * 6
  filter.Q.value = 1.2
  filter.connect(gainNode)
  gainNode.connect(ctx.destination)

  // Envelope ADSR
  gainNode.gain.setValueAtTime(0, t)
  gainNode.gain.linearRampToValueAtTime(gain, t + 0.04)
  gainNode.gain.setValueAtTime(gain, t + 0.1)
  gainNode.gain.exponentialRampToValueAtTime(gain * 0.7, t + 0.3)
  gainNode.gain.exponentialRampToValueAtTime(0.001, t + duration)

  osc1.start(t); osc2.start(t); osc3.start(t)
  osc1.stop(t + duration + 0.1)
  osc2.stop(t + duration + 0.1)
  osc3.stop(t + duration + 0.1)
}

// Frequências: A4 = 440Hz
const NOTE_FREQ = {
  C2: 65.41, D2: 73.42, E2: 82.41, F2: 87.31, G2: 98.00, A2: 110.00, B2: 123.47,
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, 'F#3': 185.00, G3: 196.00,
  'G#3': 207.65, A3: 220.00, 'A#3': 233.08, B3: 246.94,
  C4: 261.63, 'C#4': 277.18, D4: 293.66, 'D#4': 311.13, E4: 329.63, F4: 349.23,
  'F#4': 369.99, G4: 392.00, 'G#4': 415.30, A4: 440.00, 'A#4': 466.16, B4: 493.88,
  C5: 523.25
}

function noteToFreq(note, octave = 4) {
  const key = `${note}${octave}`
  if (NOTE_FREQ[key]) return NOTE_FREQ[key]
  // Calcular via semitons
  const NOTES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
  const idx = NOTES.indexOf(note)
  if (idx === -1) return 440
  return 440 * Math.pow(2, (idx + (octave - 4) * 12 - 9) / 12)
}

// ─── Dados musicais ───────────────────────────────────────────────────────────
const INTERVALS = [
  { name: 'Uníssono',        semitones: 0,  abbr: 'P1',  example: 'Mesma nota' },
  { name: '2ª menor',        semitones: 1,  abbr: 'm2',  example: 'Mi→Fá' },
  { name: '2ª maior',        semitones: 2,  abbr: 'M2',  example: 'Dó→Ré' },
  { name: '3ª menor',        semitones: 3,  abbr: 'm3',  example: 'Lá→Dó' },
  { name: '3ª maior',        semitones: 4,  abbr: 'M3',  example: 'Dó→Mi' },
  { name: '4ª justa',        semitones: 5,  abbr: 'P4',  example: 'Sol→Dó' },
  { name: 'Trítono',         semitones: 6,  abbr: 'TT',  example: 'Fá→Si' },
  { name: '5ª justa',        semitones: 7,  abbr: 'P5',  example: 'Dó→Sol' },
  { name: '6ª menor',        semitones: 8,  abbr: 'm6',  example: 'Mi→Dó' },
  { name: '6ª maior',        semitones: 9,  abbr: 'M6',  example: 'Dó→Lá' },
  { name: '7ª menor',        semitones: 10, abbr: 'm7',  example: 'Sol→Fá' },
  { name: '7ª maior',        semitones: 11, abbr: 'M7',  example: 'Dó→Si' },
  { name: 'Oitava',          semitones: 12, abbr: 'P8',  example: 'Dó→Dó' },
]

const CHROMATIC = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
const NOTE_PT = { C:'Dó', 'C#':'Dó♯', D:'Ré', 'D#':'Ré♯', E:'Mi', F:'Fá', 'F#':'Fá♯', G:'Sol', 'G#':'Sol♯', A:'Lá', 'A#':'Lá♯', B:'Si' }

const SCALE_TYPES = [
  { name: 'Maior',           intervals: [0,2,4,5,7,9,11,12] },
  { name: 'Menor natural',   intervals: [0,2,3,5,7,8,10,12] },
  { name: 'Menor harmônica', intervals: [0,2,3,5,7,8,11,12] },
  { name: 'Pentatônica M',   intervals: [0,2,4,7,9,12] },
  { name: 'Pentatônica m',   intervals: [0,3,5,7,10,12] },
]

const CHORD_TYPES = [
  { name: 'Maior',           intervals: [0,4,7],    abbr: '' },
  { name: 'Menor',           intervals: [0,3,7],    abbr: 'm' },
  { name: 'Diminuto',        intervals: [0,3,6],    abbr: 'dim' },
  { name: 'Aumentado',       intervals: [0,4,8],    abbr: 'aug' },
  { name: 'Dom. 7ª',         intervals: [0,4,7,10], abbr: '7' },
  { name: 'Maior 7ª',        intervals: [0,4,7,11], abbr: 'maj7' },
]

// ─── Modos de treino ──────────────────────────────────────────────────────────
const MODES = [
  { key: 'intervals',  label: 'Intervalos',      icon: '↕' },
  { key: 'notes',      label: 'Notas',           icon: '♩' },
  { key: 'scales',     label: 'Escalas',         icon: '♫' },
  { key: 'chords',     label: 'Acordes',         icon: '⋮' },
  { key: 'melody',     label: 'Ditado Melódico', icon: '〜' },
  { key: 'rhythm',     label: 'Ritmo',           icon: '♪' },
]

// ─── Utilitários ──────────────────────────────────────────────────────────────
function getRandom(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function addSemitones(noteIdx, semitones) { return (noteIdx + semitones + 120) % 12 }

function generateInterval(activeIntervals) {
  const pool = INTERVALS.filter(i => activeIntervals.includes(i.semitones))
  if (!pool.length) return null
  const interval = getRandom(pool)
  const rootIdx = Math.floor(Math.random() * 12)
  const rootOct = 3
  const targetIdx = addSemitones(rootIdx, interval.semitones)
  const targetOct = interval.semitones >= 12 ? rootOct + 1 : rootOct
  return { interval, rootNote: CHROMATIC[rootIdx], rootOct, targetNote: CHROMATIC[targetIdx], targetOct }
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function EarTraining() {
  const [mode, setMode] = useState('intervals')
  const [activeIntervals, setActiveIntervals] = useState([2,3,4,5,7,9,12])
  const [question, setQuestion] = useState(null)
  const [answered, setAnswered] = useState(null) // null | 'correct' | 'wrong'
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [streak, setStreak] = useState(0)
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const [direction, setDirection] = useState('ascending') // ascending | descending | both | harmonic
  const [melodyNotes, setMelodyNotes] = useState([])
  const [melodyAnswers, setMelodyAnswers] = useState([])
  const [rythmPattern, setRythmPattern] = useState([])
  const [rythmAnswer, setRythmAnswer] = useState([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [level, setLevel] = useState(1) // 1=iniciante, 2=intermediário, 3=avançado
  const [history, setHistory] = useState([])

  const audioCtxRef = useRef(null)

  const getCtx = useCallback(() => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }
    if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume()
    return audioCtxRef.current
  }, [])

  // ─── Tocar notas ────────────────────────────────────────────────────────────
  const playNote = useCallback((note, octave = 3, delay = 0, duration = 1.2) => {
    const ctx = getCtx()
    const freq = noteToFreq(note, octave)
    setTimeout(() => createCelloTone(ctx, freq, duration), delay * 1000)
  }, [getCtx])

  const playInterval = useCallback((q) => {
    if (!q) return
    setIsPlaying(true)
    const ctx = getCtx()
    const rootFreq = noteToFreq(q.rootNote, q.rootOct)
    const targetFreq = noteToFreq(q.targetNote, q.targetOct)

    const dir = direction === 'both' ? (Math.random() > 0.5 ? 'ascending' : 'descending') : direction

    if (direction === 'harmonic') {
      setTimeout(() => {
        createCelloTone(ctx, rootFreq, 1.5)
        createCelloTone(ctx, targetFreq, 1.5, 0.25)
      }, 0)
    } else if (dir === 'ascending') {
      createCelloTone(ctx, rootFreq, 1.0)
      setTimeout(() => createCelloTone(ctx, targetFreq, 1.2), 800)
    } else {
      createCelloTone(ctx, targetFreq, 1.0)
      setTimeout(() => createCelloTone(ctx, rootFreq, 1.2), 800)
    }
    setTimeout(() => setIsPlaying(false), 2200)
  }, [getCtx, direction])

  const playScale = useCallback((rootNote, scaleType) => {
    const ctx = getCtx()
    setIsPlaying(true)
    const rootIdx = CHROMATIC.indexOf(rootNote)
    scaleType.intervals.forEach((semi, i) => {
      const noteIdx = addSemitones(rootIdx, semi)
      const oct = semi >= 12 ? 4 : 3
      const freq = noteToFreq(CHROMATIC[noteIdx], oct)
      setTimeout(() => createCelloTone(ctx, freq, 0.8), i * 500)
    })
    setTimeout(() => setIsPlaying(false), scaleType.intervals.length * 500 + 500)
  }, [getCtx])

  const playChord = useCallback((rootNote, chordType) => {
    const ctx = getCtx()
    setIsPlaying(true)
    const rootIdx = CHROMATIC.indexOf(rootNote)
    // Broken chord primeiro, depois harmônico
    chordType.intervals.forEach((semi, i) => {
      const noteIdx = addSemitones(rootIdx, semi)
      const freq = noteToFreq(CHROMATIC[noteIdx], 3)
      setTimeout(() => createCelloTone(ctx, freq, 1.5, 0.35), i * 150)
    })
    setTimeout(() => {
      chordType.intervals.forEach(semi => {
        const noteIdx = addSemitones(rootIdx, semi)
        createCelloTone(ctx, noteToFreq(CHROMATIC[noteIdx], 3), 2.0, 0.3)
      })
    }, chordType.intervals.length * 150 + 200)
    setTimeout(() => setIsPlaying(false), chordType.intervals.length * 150 + 2500)
  }, [getCtx])

  const playMelody = useCallback((notes) => {
    const ctx = getCtx()
    setIsPlaying(true)
    notes.forEach((n, i) => {
      const freq = noteToFreq(n.note, n.octave)
      setTimeout(() => createCelloTone(ctx, freq, 0.7), i * 700)
    })
    setTimeout(() => setIsPlaying(false), notes.length * 700 + 500)
  }, [getCtx])

  // ─── Gerar pergunta ──────────────────────────────────────────────────────────
  const generateQuestion = useCallback(() => {
    setAnswered(null)
    setSelectedAnswer(null)

    if (mode === 'intervals') {
      const q = generateInterval(activeIntervals)
      if (!q) return
      setQuestion(q)
      setTimeout(() => playInterval(q), 200)

    } else if (mode === 'notes') {
      const octave = level === 1 ? 3 : level === 2 ? getRandom([2, 3]) : getRandom([2, 3, 4])
      const noteIdx = Math.floor(Math.random() * (level === 1 ? 7 : 12))
      const naturalNotes = ['C','D','E','F','G','A','B']
      const note = level === 1 ? naturalNotes[noteIdx] : CHROMATIC[noteIdx]
      setQuestion({ type: 'note', note, octave })
      setTimeout(() => playNote(note, octave, 0, 1.5), 200)

    } else if (mode === 'scales') {
      const pool = level === 1
        ? SCALE_TYPES.slice(0, 2)
        : level === 2 ? SCALE_TYPES.slice(0, 4) : SCALE_TYPES
      const scaleType = getRandom(pool)
      const rootNote = getRandom(level === 1 ? ['C','G','D'] : CHROMATIC)
      setQuestion({ type: 'scale', scaleType, rootNote })
      setTimeout(() => playScale(rootNote, scaleType), 200)

    } else if (mode === 'chords') {
      const pool = level === 1
        ? CHORD_TYPES.slice(0, 2)
        : level === 2 ? CHORD_TYPES.slice(0, 4) : CHORD_TYPES
      const chordType = getRandom(pool)
      const rootNote = getRandom(CHROMATIC)
      setQuestion({ type: 'chord', chordType, rootNote })
      setTimeout(() => playChord(rootNote, chordType), 200)

    } else if (mode === 'melody') {
      const length = level === 1 ? 3 : level === 2 ? 4 : 5
      const scale = [0,2,4,5,7,9,11]
      const notes = Array.from({ length }, () => {
        const semi = getRandom(scale)
        const noteIdx = addSemitones(CHROMATIC.indexOf('C'), semi)
        return { note: CHROMATIC[noteIdx], octave: 3 }
      })
      setMelodyNotes(notes)
      setMelodyAnswers(Array(length).fill(null))
      setQuestion({ type: 'melody', notes, length })
      setTimeout(() => playMelody(notes), 200)

    } else if (mode === 'rhythm') {
      const patterns = [
        [1,0,1,0,1,0,1,0], // Semínimas
        [1,1,0,1,1,0,1,0], // Colcheias variadas
        [1,0,0,0,1,0,1,0], // Mínima + semínimas
        [1,1,1,1,1,1,1,0], // Colcheias contínuas
        [1,0,1,1,0,1,0,0], // Síncope
      ]
      const pattern = level === 1 ? patterns[0] : getRandom(patterns)
      setRythmPattern(pattern)
      setRythmAnswer(Array(8).fill(null))
      setQuestion({ type: 'rhythm', pattern })
      playRhythm(pattern)
    }
  }, [mode, activeIntervals, level, playInterval, playNote, playScale, playChord, playMelody])

  const playRhythm = useCallback((pattern) => {
    const ctx = getCtx()
    setIsPlaying(true)
    const bpm = 80
    const spb = 60000 / bpm / 2 // colcheia
    pattern.forEach((beat, i) => {
      if (beat) {
        setTimeout(() => {
          const freq = 880
          const osc = ctx.createOscillator()
          const g = ctx.createGain()
          osc.connect(g); g.connect(ctx.destination)
          osc.type = 'sine'; osc.frequency.value = i === 0 ? freq * 1.5 : freq
          g.gain.setValueAtTime(0.4, ctx.currentTime)
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)
          osc.start(); osc.stop(ctx.currentTime + 0.15)
        }, i * spb)
      }
    })
    setTimeout(() => setIsPlaying(false), pattern.length * spb + 500)
  }, [getCtx])

  // Inicializar ao mudar modo
  useEffect(() => {
    setQuestion(null)
    setAnswered(null)
    setSelectedAnswer(null)
    setMelodyNotes([])
    setMelodyAnswers([])
    setRythmAnswer([])
  }, [mode])

  // ─── Checar resposta ─────────────────────────────────────────────────────────
  const checkAnswer = useCallback((answer) => {
    if (answered || !question) return
    setSelectedAnswer(answer)

    let correct = false
    if (mode === 'intervals') correct = answer === question.interval.semitones
    else if (mode === 'notes') correct = answer === question.note
    else if (mode === 'scales') correct = answer === question.scaleType.name
    else if (mode === 'chords') correct = answer === question.chordType.name

    setAnswered(correct ? 'correct' : 'wrong')
    setScore(s => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }))
    setStreak(s => correct ? s + 1 : 0)

    const entry = {
      mode, correct,
      question: mode === 'intervals' ? question.interval.name
        : mode === 'notes' ? question.note
        : mode === 'scales' ? question.scaleType.name
        : mode === 'chords' ? question.chordType.name : '?',
      answer,
      time: new Date()
    }
    setHistory(h => [entry, ...h].slice(0, 20))

    if (correct) {
      setTimeout(() => generateQuestion(), 1000)
    }
  }, [answered, question, mode, generateQuestion])

  // ─── Respostas possíveis ──────────────────────────────────────────────────────
  const getAnswers = useCallback(() => {
    if (!question) return []
    if (mode === 'intervals') {
      const pool = INTERVALS.filter(i => activeIntervals.includes(i.semitones))
      // Garantir que a resposta correta está incluída
      const others = pool.filter(i => i.semitones !== question.interval.semitones)
      const shuffled = [question.interval, ...others.sort(() => Math.random() - 0.5).slice(0, Math.min(5, others.length))]
      return shuffled.sort(() => Math.random() - 0.5)
    }
    if (mode === 'notes') {
      const pool = level === 1 ? ['C','D','E','F','G','A','B'] : CHROMATIC
      const others = pool.filter(n => n !== question.note)
      return [question.note, ...others.sort(() => Math.random() - 0.5).slice(0, 5)].sort(() => Math.random() - 0.5)
    }
    if (mode === 'scales') {
      const pool = level === 1 ? SCALE_TYPES.slice(0, 2) : level === 2 ? SCALE_TYPES.slice(0, 4) : SCALE_TYPES
      return pool.map(s => s.name)
    }
    if (mode === 'chords') {
      const pool = level === 1 ? CHORD_TYPES.slice(0, 2) : level === 2 ? CHORD_TYPES.slice(0, 4) : CHORD_TYPES
      return pool.map(c => c.name)
    }
    return []
  }, [question, mode, activeIntervals, level])

  const accuracy = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '2rem', maxWidth: 960, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '0.72rem',
          letterSpacing: '0.22em', textTransform: 'uppercase', color: '#c9a227' }}>
          Treino Auditivo
        </span>
        <h1 style={{ marginTop: '0.2rem', fontSize: '2rem' }}>Ear Training</h1>
        <p style={{ fontStyle: 'italic', color: '#a0958a', marginTop: '0.25rem', fontSize: '0.95rem' }}>
          O ouvido musical é o coração de tudo — treine diariamente
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Corretas', value: score.correct, color: '#4CAF50' },
          { label: 'Total', value: score.total, color: '#c9a227' },
          { label: 'Precisão', value: `${accuracy}%`, color: accuracy >= 80 ? '#4CAF50' : accuracy >= 60 ? '#FFC107' : '#F44336' },
          { label: 'Sequência', value: streak, color: streak >= 5 ? '#c9a227' : '#a0958a' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '0.9rem', textAlign: 'center' }}>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.75rem',
              color: s.color, lineHeight: 1, fontWeight: 700 }}>{s.value}</div>
            <div style={{ fontSize: '0.68rem', color: '#8B6914', marginTop: '0.25rem',
              letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'Playfair Display, serif' }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '1.25rem' }}>
        {/* Sidebar — modos */}
        <div>
          <div style={{ fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase',
            color: '#8B6914', marginBottom: '0.6rem', fontFamily: 'Playfair Display, serif' }}>
            Exercícios
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            {MODES.map(m => (
              <button key={m.key} onClick={() => setMode(m.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.6rem',
                  padding: '0.6rem 0.85rem', borderRadius: '4px', border: 'none',
                  background: mode === m.key ? 'rgba(201,162,39,0.12)' : 'transparent',
                  borderLeft: `2px solid ${mode === m.key ? '#c9a227' : 'transparent'}`,
                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                  fontFamily: 'Cormorant Garamond, serif', fontSize: '0.95rem',
                  color: mode === m.key ? '#e6c45a' : '#a0958a',
                }}>
                <span style={{ fontSize: '1rem', width: 18, textAlign: 'center' }}>{m.icon}</span>
                {m.label}
              </button>
            ))}
          </div>

          {/* Nível */}
          <div style={{ marginTop: '1.25rem' }}>
            <div style={{ fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase',
              color: '#8B6914', marginBottom: '0.6rem', fontFamily: 'Playfair Display, serif' }}>
              Nível
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              {[
                { n: 1, label: 'Iniciante' },
                { n: 2, label: 'Intermediário' },
                { n: 3, label: 'Avançado' },
              ].map(l => (
                <button key={l.n} onClick={() => setLevel(l.n)}
                  style={{
                    padding: '0.45rem 0.85rem', borderRadius: '4px', border: 'none',
                    background: level === l.n ? 'rgba(201,162,39,0.1)' : 'transparent',
                    cursor: 'pointer', textAlign: 'left', fontFamily: 'Cormorant Garamond, serif',
                    fontSize: '0.88rem', color: level === l.n ? '#e6c45a' : '#8B6914', transition: 'all 0.15s'
                  }}>
                  {['I','II','III'][l.n - 1]} — {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Configuração de intervalos */}
          {mode === 'intervals' && (
            <div style={{ marginTop: '1.25rem' }}>
              <div style={{ fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase',
                color: '#8B6914', marginBottom: '0.6rem', fontFamily: 'Playfair Display, serif' }}>
                Intervalos ativos
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                {INTERVALS.map(i => (
                  <label key={i.semitones}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer',
                      fontSize: '0.82rem', color: activeIntervals.includes(i.semitones) ? '#c9a227' : '#8B6914',
                      fontFamily: 'Cormorant Garamond, serif', padding: '0.15rem 0' }}>
                    <input type="checkbox"
                      checked={activeIntervals.includes(i.semitones)}
                      onChange={e => {
                        if (e.target.checked) setActiveIntervals(a => [...a, i.semitones])
                        else setActiveIntervals(a => a.filter(x => x !== i.semitones))
                      }}
                      style={{ accentColor: '#c9a227', width: 12, height: 12 }}
                    />
                    <span style={{ fontFamily: 'monospace', fontSize: '0.7rem',
                      color: '#8B6914', minWidth: 26 }}>{i.abbr}</span>
                    {i.name}
                  </label>
                ))}
              </div>

              <div style={{ marginTop: '0.75rem' }}>
                <div style={{ fontSize: '0.65rem', color: '#8B6914', marginBottom: '0.35rem',
                  fontFamily: 'Playfair Display, serif', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Direção
                </div>
                {['ascending','descending','both','harmonic'].map(d => (
                  <button key={d} onClick={() => setDirection(d)}
                    style={{
                      display: 'block', width: '100%', padding: '0.3rem 0.5rem',
                      marginBottom: '0.15rem', border: 'none', cursor: 'pointer',
                      background: direction === d ? 'rgba(201,162,39,0.1)' : 'transparent',
                      color: direction === d ? '#c9a227' : '#8B6914',
                      fontFamily: 'Cormorant Garamond, serif', fontSize: '0.82rem',
                      textAlign: 'left', borderRadius: '3px', transition: 'all 0.15s'
                    }}>
                    {{ ascending: '↑ Ascendente', descending: '↓ Descendente',
                       both: '↕ Ambas', harmonic: '⟷ Harmônico' }[d]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Área principal */}
        <div>
          <div className="card" style={{ padding: '2rem', minHeight: 320 }}>
            {/* Instrução do modo */}
            <ModeIntro mode={mode} />

            {/* Botão de começar / reproduzir */}
            {!question ? (
              <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <button onClick={generateQuestion}
                  className="btn btn-primary"
                  style={{ padding: '0.85rem 2.5rem', fontSize: '1rem' }}>
                  ▶ Começar Treino
                </button>
              </div>
            ) : (
              <>
                {/* Display da pergunta */}
                <QuestionDisplay
                  mode={mode} question={question} isPlaying={isPlaying}
                  melodyNotes={melodyNotes} melodyAnswers={melodyAnswers}
                  rythmPattern={rythmPattern} rythmAnswer={rythmAnswer}
                  onPlayAgain={() => {
                    if (mode === 'intervals') playInterval(question)
                    else if (mode === 'notes') playNote(question.note, question.octave)
                    else if (mode === 'scales') playScale(question.rootNote, question.scaleType)
                    else if (mode === 'chords') playChord(question.rootNote, question.chordType)
                    else if (mode === 'melody') playMelody(question.notes)
                    else if (mode === 'rhythm') playRhythm(question.pattern)
                  }}
                />

                {/* Feedback */}
                {answered && (
                  <div style={{
                    textAlign: 'center', padding: '0.85rem', borderRadius: '6px',
                    marginBottom: '1rem',
                    background: answered === 'correct'
                      ? 'rgba(76,175,80,0.12)' : 'rgba(244,67,54,0.12)',
                    border: `1px solid ${answered === 'correct' ? 'rgba(76,175,80,0.3)' : 'rgba(244,67,54,0.3)'}`
                  }}>
                    <div style={{
                      fontFamily: 'Playfair Display, serif', fontSize: '1rem',
                      color: answered === 'correct' ? '#4CAF50' : '#F44336'
                    }}>
                      {answered === 'correct' ? '✓ Correto!' : '✗ Incorreto'}
                    </div>
                    {answered === 'wrong' && question && (
                      <div style={{ fontSize: '0.85rem', color: '#a0958a', marginTop: '0.25rem',
                        fontFamily: 'Cormorant Garamond, serif' }}>
                        Era: <strong style={{ color: '#e6c45a' }}>
                          {mode === 'intervals' ? question.interval.name
                            : mode === 'notes' ? NOTE_PT[question.note]
                            : mode === 'scales' ? question.scaleType.name
                            : mode === 'chords' ? question.chordType.name : '?'}
                        </strong>
                      </div>
                    )}
                  </div>
                )}

                {/* Botões de resposta */}
                {(mode === 'intervals' || mode === 'notes' || mode === 'scales' || mode === 'chords') && (
                  <AnswerButtons
                    answers={getAnswers()} mode={mode}
                    selectedAnswer={selectedAnswer} answered={answered}
                    correctAnswer={
                      mode === 'intervals' ? question.interval.semitones
                      : mode === 'notes' ? question.note
                      : mode === 'scales' ? question.scaleType.name
                      : question.chordType.name
                    }
                    onAnswer={checkAnswer}
                  />
                )}

                {/* Ditado rítmico */}
                {mode === 'rhythm' && (
                  <RhythmAnswer
                    pattern={rythmPattern} answer={rythmAnswer}
                    onChange={setRythmAnswer}
                    onCheck={() => {
                      const correct = rythmPattern.every((b, i) => rythmAnswer[i] === b)
                      setAnswered(correct ? 'correct' : 'wrong')
                      setScore(s => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }))
                      setStreak(s => correct ? s + 1 : 0)
                      if (correct) setTimeout(() => generateQuestion(), 1000)
                    }}
                  />
                )}

                {/* Ditado melódico */}
                {mode === 'melody' && (
                  <MelodyAnswer
                    notes={melodyNotes} answers={melodyAnswers}
                    onChange={setMelodyAnswers}
                    onCheck={() => {
                      const correct = melodyNotes.every((n, i) => melodyAnswers[i] === n.note)
                      setAnswered(correct ? 'correct' : 'wrong')
                      setScore(s => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }))
                      setStreak(s => correct ? s + 1 : 0)
                      if (correct) setTimeout(() => generateQuestion(), 1000)
                    }}
                    onPlay={i => playNote(melodyNotes[i].note, melodyNotes[i].octave)}
                  />
                )}

                {/* Próxima pergunta */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginTop: '1rem' }}>
                  {answered && (
                    <button onClick={generateQuestion} className="btn btn-primary"
                      style={{ padding: '0.6rem 1.5rem' }}>
                      Próxima →
                    </button>
                  )}
                  <button onClick={generateQuestion} className="btn btn-ghost"
                    style={{ padding: '0.6rem 1.25rem' }}>
                    Pular
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Histório */}
          {history.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <div style={{ fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase',
                color: '#8B6914', marginBottom: '0.6rem', fontFamily: 'Playfair Display, serif' }}>
                Últimas respostas
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                {history.slice(0, 15).map((h, i) => (
                  <div key={i} style={{
                    padding: '0.25rem 0.65rem', borderRadius: '2rem',
                    background: h.correct ? 'rgba(76,175,80,0.12)' : 'rgba(244,67,54,0.08)',
                    border: `0.5px solid ${h.correct ? 'rgba(76,175,80,0.3)' : 'rgba(244,67,54,0.2)'}`,
                    fontSize: '0.75rem', color: h.correct ? '#4CAF50' : '#F44336',
                    fontFamily: 'Cormorant Garamond, serif'
                  }}>
                    {h.correct ? '✓' : '✗'} {h.question}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Referência de intervalos */}
          {mode === 'intervals' && (
            <div className="card" style={{ padding: '1.25rem', marginTop: '1rem' }}>
              <div style={{ fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase',
                color: '#8B6914', marginBottom: '0.75rem', fontFamily: 'Playfair Display, serif' }}>
                Referência — Intervalos
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.4rem' }}>
                {INTERVALS.map(i => (
                  <div key={i.semitones} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '0.4rem 0.65rem', background: 'rgba(201,162,39,0.04)',
                    border: '0.5px solid rgba(201,162,39,0.12)', borderRadius: '3px'
                  }}>
                    <div>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.7rem',
                        color: '#8B6914', marginRight: '0.4rem' }}>{i.abbr}</span>
                      <span style={{ fontSize: '0.82rem', color: '#c8bfb4',
                        fontFamily: 'Cormorant Garamond, serif' }}>{i.name}</span>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: '#8B6914',
                      fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic' }}>
                      {i.semitones}st
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Sub-componentes ─────────────────────────────────────────────────────────

function ModeIntro({ mode }) {
  const intros = {
    intervals: 'Ouça dois sons em sequência e identifique o intervalo entre eles.',
    notes: 'Ouça uma nota e diga qual é. Desenvolve o ouvido absoluto.',
    scales: 'Ouça uma escala completa e identifique seu tipo.',
    chords: 'Ouça o acorde (arpejado e harmônico) e identifique.',
    melody: 'Ouça a melodia e transcreva as notas na ordem correta.',
    rhythm: 'Ouça o ritmo e reproduza o padrão marcando os tempos.',
  }
  return (
    <div style={{ padding: '0.65rem 1rem', background: 'rgba(201,162,39,0.05)',
      borderRadius: '4px', marginBottom: '1.25rem',
      borderLeft: '2px solid rgba(201,162,39,0.3)' }}>
      <p style={{ fontSize: '0.88rem', color: '#a0958a', fontStyle: 'italic',
        fontFamily: 'Cormorant Garamond, serif', margin: 0, lineHeight: 1.6 }}>
        {intros[mode]}
      </p>
    </div>
  )
}

function QuestionDisplay({ mode, question, isPlaying, onPlayAgain }) {
  const NOTE_PT = { C:'Dó', 'C#':'Dó♯', D:'Ré', 'D#':'Ré♯', E:'Mi', F:'Fá', 'F#':'Fá♯', G:'Sol', 'G#':'Sol♯', A:'Lá', 'A#':'Lá♯', B:'Si' }
  return (
    <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
      {/* Ícone animado de som */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 72, height: 72, borderRadius: '50%',
          background: isPlaying ? 'rgba(201,162,39,0.2)' : 'rgba(201,162,39,0.07)',
          border: `2px solid ${isPlaying ? '#c9a227' : 'rgba(201,162,39,0.2)'}`,
          animation: isPlaying ? 'pulse-gold 0.8s ease-in-out infinite' : 'none',
          transition: 'all 0.3s', fontSize: '1.75rem', cursor: 'pointer',
        }} onClick={onPlayAgain} title="Ouvir novamente">
          {isPlaying ? '♫' : '↺'}
        </div>
        <div style={{ fontSize: '0.72rem', color: '#8B6914', marginTop: '0.4rem',
          fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic' }}>
          {isPlaying ? 'tocando...' : 'clique para ouvir novamente'}
        </div>
      </div>

      {mode === 'intervals' && (
        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '0.95rem',
          color: '#8B6914', fontStyle: 'italic' }}>
          Qual é o intervalo?
        </div>
      )}
      {mode === 'notes' && (
        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '0.95rem',
          color: '#8B6914', fontStyle: 'italic' }}>
          Qual nota você ouviu?
        </div>
      )}
      {mode === 'scales' && (
        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '0.95rem',
          color: '#8B6914', fontStyle: 'italic' }}>
          Qual tipo de escala?
        </div>
      )}
      {mode === 'chords' && (
        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '0.95rem',
          color: '#8B6914', fontStyle: 'italic' }}>
          Qual tipo de acorde?
        </div>
      )}
    </div>
  )
}

function AnswerButtons({ answers, mode, selectedAnswer, answered, correctAnswer, onAnswer }) {
  const NOTE_PT = { C:'Dó', 'C#':'Dó♯', D:'Ré', 'D#':'Ré♯', E:'Mi', F:'Fá', 'F#':'Fá♯', G:'Sol', 'G#':'Sol♯', A:'Lá', 'A#':'Lá♯', B:'Si' }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem', marginBottom: '1rem' }}>
      {answers.map((ans, i) => {
        const isSelected = selectedAnswer === ans
        const isCorrect = ans === correctAnswer
        const showCorrect = answered && isCorrect
        const showWrong = answered && isSelected && !isCorrect
        const label = mode === 'intervals'
          ? (typeof ans === 'number' ? INTERVALS.find(i => i.semitones === ans)?.name : ans)
          : mode === 'notes' ? (NOTE_PT[ans] || ans)
          : ans

        return (
          <button key={i} onClick={() => onAnswer(ans)} disabled={!!answered}
            style={{
              padding: '0.65rem 0.5rem', borderRadius: '4px', border: 'none', cursor: answered ? 'default' : 'pointer',
              fontFamily: 'Cormorant Garamond, serif', fontSize: '0.92rem', transition: 'all 0.15s',
              background: showCorrect ? 'rgba(76,175,80,0.2)' : showWrong ? 'rgba(244,67,54,0.15)' : 'rgba(201,162,39,0.05)',
              color: showCorrect ? '#4CAF50' : showWrong ? '#F44336' : '#c8bfb4',
              border: `1px solid ${showCorrect ? 'rgba(76,175,80,0.4)' : showWrong ? 'rgba(244,67,54,0.3)' : 'rgba(201,162,39,0.15)'}`,
            }}>
            {label}
          </button>
        )
      })}
    </div>
  )
}

function MelodyAnswer({ notes, answers, onChange, onCheck, onPlay }) {
  const NOTE_PT = { C:'Dó', 'C#':'Dó♯', D:'Ré', 'D#':'Ré♯', E:'Mi', F:'Fá', 'F#':'Fá♯', G:'Sol', 'G#':'Sol♯', A:'Lá', 'A#':'Lá♯', B:'Si' }
  const scaleNotes = ['C','D','E','F','G','A','B']
  return (
    <div>
      <div style={{ fontSize: '0.72rem', color: '#8B6914', marginBottom: '0.65rem',
        fontFamily: 'Playfair Display, serif', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        Transcreva as {notes.length} notas:
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {notes.map((_, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <button onClick={() => onPlay(i)}
              style={{ width: 36, height: 36, borderRadius: '50%', border: 'none',
                background: 'rgba(201,162,39,0.08)', cursor: 'pointer', color: '#c9a227',
                fontSize: '0.85rem', display: 'flex', alignItems: 'center',
                justifyContent: 'center', margin: '0 auto 0.35rem' }}>
              {i + 1}
            </button>
            <select value={answers[i] || ''} onChange={e => {
                const next = [...answers]; next[i] = e.target.value; onChange(next)
              }}
              style={{ width: 60, fontSize: '0.82rem', padding: '0.25rem',
                background: '#1a1209', border: '1px solid rgba(201,162,39,0.25)',
                borderRadius: '3px', color: '#e6c45a', fontFamily: 'Cormorant Garamond, serif' }}>
              <option value="">?</option>
              {scaleNotes.map(n => <option key={n} value={n}>{NOTE_PT[n]}</option>)}
            </select>
          </div>
        ))}
      </div>
      <button onClick={onCheck} disabled={answers.some(a => !a)} className="btn btn-primary"
        style={{ padding: '0.55rem 1.5rem' }}>
        Verificar
      </button>
    </div>
  )
}

function RhythmAnswer({ pattern, answer, onChange, onCheck }) {
  return (
    <div>
      <div style={{ fontSize: '0.72rem', color: '#8B6914', marginBottom: '0.65rem',
        fontFamily: 'Playfair Display, serif', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        Marque os tempos que ouviu (8 subdivisões):
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', justifyContent: 'center' }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <button key={i} onClick={() => {
              const next = [...answer]; next[i] = next[i] ? 0 : 1; onChange(next)
            }}
            style={{
              width: 36, height: 36, borderRadius: '4px', border: 'none', cursor: 'pointer',
              background: answer[i] ? 'rgba(201,162,39,0.3)' : 'rgba(201,162,39,0.06)',
              border: `1.5px solid ${answer[i] ? '#c9a227' : 'rgba(201,162,39,0.2)'}`,
              transition: 'all 0.15s', color: '#c9a227', fontSize: '1rem'
            }}>
            {answer[i] ? '♩' : ''}
          </button>
        ))}
      </div>
      <button onClick={onCheck} className="btn btn-primary" style={{ padding: '0.55rem 1.5rem' }}>
        Verificar
      </button>
    </div>
  )
}
