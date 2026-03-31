import { useState, useEffect, useRef, useCallback } from 'react'
import { CELLO_OPEN_STRINGS, NOTE_NAMES_PT, CHROMATIC_NOTES } from '../data/musicData'

// Autocorrelação para detecção de pitch
function autoCorrelate(buf, sampleRate) {
  const SIZE = buf.length
  let rms = 0
  for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i]
  rms = Math.sqrt(rms / SIZE)
  if (rms < 0.015) return -1

  let r1 = 0, r2 = SIZE - 1
  const thres = 0.2
  for (let i = 0; i < SIZE / 2; i++) if (Math.abs(buf[i]) < thres) { r1 = i; break }
  for (let i = 1; i < SIZE / 2; i++) if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break }
  const buf2 = buf.slice(r1, r2)
  const c = new Array(buf2.length).fill(0)
  for (let i = 0; i < buf2.length; i++)
    for (let j = 0; j < buf2.length - i; j++)
      c[i] += buf2[j] * buf2[j + i]
  let d = 0
  while (c[d] > c[d + 1]) d++
  let maxval = -1, maxpos = -1
  for (let i = d; i < buf2.length; i++) {
    if (c[i] > maxval) { maxval = c[i]; maxpos = i }
  }
  let T0 = maxpos
  const x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1]
  const a = (x1 + x3 - 2 * x2) / 2, b = (x3 - x1) / 2
  if (a) T0 = T0 - b / (2 * a)
  return sampleRate / T0
}

function freqToNote(freq) {
  if (!freq || freq <= 0) return null
  const A4 = 440
  const semitones = 12 * Math.log2(freq / A4)
  const noteIdx = Math.round(semitones)
  const cents = (semitones - noteIdx) * 100
  const octave = Math.floor((noteIdx + 69) / 12) - 1
  const noteInScale = ((noteIdx % 12) + 12) % 12
  return {
    note: CHROMATIC_NOTES[noteInScale],
    notePt: NOTE_NAMES_PT[CHROMATIC_NOTES[noteInScale]],
    octave,
    cents: Math.round(cents),
    freq: Math.round(freq * 10) / 10
  }
}

export default function Tuner() {
  const [active, setActive] = useState(false)
  const [detected, setDetected] = useState(null)
  const [history, setHistory] = useState([])
  const [targetString, setTargetString] = useState(null)

  const audioCtxRef = useRef(null)
  const analyserRef = useRef(null)
  const streamRef = useRef(null)
  const rafRef = useRef(null)

  const startTuner = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
      analyserRef.current = audioCtxRef.current.createAnalyser()
      analyserRef.current.fftSize = 2048
      const src = audioCtxRef.current.createMediaStreamSource(stream)
      src.connect(analyserRef.current)
      setActive(true)
      tick()
    } catch {
      alert('Microfone necessário para o afinador. Autorize o acesso.')
    }
  }, [])

  const tick = useCallback(() => {
    if (!analyserRef.current) return
    const buf = new Float32Array(analyserRef.current.fftSize)
    analyserRef.current.getFloatTimeDomainData(buf)
    const freq = autoCorrelate(buf, audioCtxRef.current.sampleRate)
    if (freq > 0) {
      const note = freqToNote(freq)
      if (note) {
        setDetected(note)
        setHistory(h => [...h.slice(-30), note.cents])
      }
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [])

  const stopTuner = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    audioCtxRef.current?.close()
    setActive(false)
    setDetected(null)
    setHistory([])
  }, [])

  useEffect(() => () => stopTuner(), [stopTuner])

  // Cores baseadas nos cents
  const tuningColor = detected
    ? Math.abs(detected.cents) < 5 ? '#4CAF50'
      : Math.abs(detected.cents) < 15 ? '#FFC107'
      : '#F44336'
    : '#c9a227'

  const needleAngle = detected ? Math.max(-45, Math.min(45, detected.cents * 0.9)) : 0
  const inTune = detected && Math.abs(detected.cents) < 5

  return (
    <div style={{ padding: '2.5rem 2rem', maxWidth: 800, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '0.75rem',
          letterSpacing: '0.2em', textTransform: 'uppercase', color: '#c9a227' }}>
          Instrumento
        </span>
        <h1 style={{ marginTop: '0.2rem' }}>Afinador Cromático</h1>
        <p style={{ fontStyle: 'italic', color: '#a0958a', marginTop: '0.3rem' }}>
          Afine cada corda com precisão — o fundamento de tudo
        </p>
      </div>

      {/* Cordas do Violoncelo */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase',
          color: '#8B6914', marginBottom: '0.75rem', fontFamily: 'Playfair Display, serif' }}>
          Cordas Soltas — Violoncelo
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
          {CELLO_OPEN_STRINGS.map(str => (
            <button key={str.note} onClick={() => setTargetString(targetString?.note === str.note ? null : str)}
              style={{
                padding: '1rem 0.5rem', border: 'none', borderRadius: '6px', cursor: 'pointer',
                background: targetString?.note === str.note
                  ? 'rgba(201,162,39,0.2)' : 'rgba(201,162,39,0.05)',
                borderTop: `3px solid ${targetString?.note === str.note ? '#c9a227' : 'rgba(201,162,39,0.2)'}`,
                transition: 'all 0.2s'
              }}>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem',
                color: targetString?.note === str.note ? '#e6c45a' : '#c9a227', lineHeight: 1 }}>
                {str.name}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#a0958a', marginTop: '0.2rem',
                fontFamily: 'Cormorant Garamond, serif' }}>{str.string} corda</div>
              <div style={{ fontSize: '0.65rem', color: '#8B6914', fontFamily: 'monospace' }}>
                {str.freq} Hz
              </div>
            </button>
          ))}
        </div>
        {targetString && (
          <div style={{ marginTop: '0.75rem', padding: '0.65rem 1rem',
            background: 'rgba(201,162,39,0.06)', borderRadius: '4px',
            fontSize: '0.85rem', color: '#a0958a', fontStyle: 'italic' }}>
            🎯 Afinando para <strong style={{ color: '#e6c45a' }}>{targetString.name} ({targetString.note})</strong> — {targetString.freq} Hz
          </div>
        )}
      </div>

      {/* Afinador visual */}
      <div className="card" style={{ padding: '2.5rem', textAlign: 'center', marginBottom: '1.5rem' }}>
        {/* Nota detectada */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{
            fontFamily: 'Playfair Display, serif', fontSize: '5rem', lineHeight: 1,
            color: detected ? tuningColor : 'rgba(201,162,39,0.3)',
            transition: 'color 0.15s', fontWeight: 700
          }}>
            {detected ? detected.notePt : '—'}
          </div>
          {detected && (
            <div style={{ fontSize: '0.9rem', color: '#a0958a', marginTop: '0.5rem',
              fontFamily: 'Cormorant Garamond, serif' }}>
              {detected.note}{detected.octave} · {detected.freq} Hz
            </div>
          )}
          {inTune && (
            <div style={{ color: '#4CAF50', fontSize: '0.85rem', marginTop: '0.4rem',
              fontFamily: 'Playfair Display, serif', letterSpacing: '0.1em' }}>
              ✓ AFINADO
            </div>
          )}
        </div>

        {/* Medidor de agulha */}
        <div style={{ position: 'relative', margin: '0 auto', width: 260, height: 130 }}>
          {/* Arco do medidor */}
          <svg width="260" height="130" viewBox="0 0 260 130">
            {/* Arco de fundo */}
            <path d="M 30 120 A 100 100 0 0 1 230 120" stroke="rgba(201,162,39,0.1)" strokeWidth="20" fill="none"/>
            {/* Zona verde (centro) */}
            <path d="M 115 120 A 100 100 0 0 1 145 120" stroke="rgba(76,175,80,0.4)" strokeWidth="20" fill="none"/>
            {/* Zona amarela */}
            <path d="M 90 120 A 100 100 0 0 1 115 120" stroke="rgba(255,193,7,0.2)" strokeWidth="20" fill="none"/>
            <path d="M 145 120 A 100 100 0 0 1 170 120" stroke="rgba(255,193,7,0.2)" strokeWidth="20" fill="none"/>
            {/* Marcações */}
            {[-45,-30,-15,0,15,30,45].map((angle, i) => {
              const rad = (angle - 90) * Math.PI / 180
              const x1 = 130 + 85 * Math.cos(rad)
              const y1 = 120 + 85 * Math.sin(rad)
              const x2 = 130 + 100 * Math.cos(rad)
              const y2 = 120 + 100 * Math.sin(rad)
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={angle === 0 ? '#4CAF50' : 'rgba(201,162,39,0.3)'} strokeWidth={angle === 0 ? 2 : 1}/>
            })}
            {/* Agulha */}
            <line
              x1="130" y1="120"
              x2={130 + 75 * Math.cos((needleAngle - 90) * Math.PI / 180)}
              y2={120 + 75 * Math.sin((needleAngle - 90) * Math.PI / 180)}
              stroke={detected ? tuningColor : 'rgba(201,162,39,0.3)'}
              strokeWidth="2.5" strokeLinecap="round"
              style={{ transition: 'all 0.08s ease' }}
            />
            <circle cx="130" cy="120" r="5" fill={detected ? tuningColor : 'rgba(201,162,39,0.3)'}/>
            {/* Labels */}
            <text x="20" y="118" fill="rgba(160,149,138,0.7)" fontSize="10" fontFamily="monospace">♭</text>
            <text x="235" y="118" fill="rgba(160,149,138,0.7)" fontSize="10" fontFamily="monospace">♯</text>
            <text x="122" y="115" fill="rgba(76,175,80,0.8)" fontSize="10" fontFamily="monospace">0</text>
          </svg>
        </div>

        {/* Cents display */}
        {detected && (
          <div style={{
            marginTop: '0.5rem', fontFamily: 'monospace', fontSize: '1.1rem',
            color: tuningColor, transition: 'color 0.15s'
          }}>
            {detected.cents > 0 ? '+' : ''}{detected.cents} cents
          </div>
        )}

        {/* Histograma */}
        {history.length > 2 && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px',
            height: 36, marginTop: '1rem', justifyContent: 'center' }}>
            {history.slice(-24).map((c, i) => {
              const h = Math.min(36, Math.abs(c) * 0.7 + 4)
              const col = Math.abs(c) < 5 ? '#4CAF50' : Math.abs(c) < 15 ? '#FFC107' : '#F44336'
              return <div key={i} style={{ width: 6, height: h, background: col,
                opacity: 0.3 + (i / 24) * 0.7, borderRadius: '2px 2px 0 0', transition: 'all 0.1s' }}/>
            })}
          </div>
        )}

        {/* Botão */}
        <button onClick={active ? stopTuner : startTuner}
          className={`btn ${active ? 'btn-danger' : 'btn-primary'}`}
          style={{ marginTop: '1.5rem', padding: '0.85rem 2.5rem', fontSize: '0.9rem' }}>
          {active ? '⏹ Parar Afinador' : '🎙 Iniciar Afinador'}
        </button>
        {!active && <p style={{ fontSize: '0.78rem', color: '#8B6914', marginTop: '0.75rem',
          fontFamily: 'Cormorant Garamond, serif' }}>
          Requer acesso ao microfone
        </p>}
      </div>

      {/* Dicas */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '0.9rem',
          color: '#e6c45a', marginBottom: '1rem' }}>Como usar o afinador</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {[
            'Afine sempre antes de qualquer sessão de prática',
            'Comece pelas cordas: Lá (I) → Ré (II) → Sol (III) → Dó (IV)',
            'Toque a corda solta com arco médio e observe a agulha',
            'A agulha no centro (verde) = afinado. Acima = agudo (♯), abaixo = grave (♭)',
            'Ajuste a cravelha suavemente enquanto toca a corda'
          ].map((tip, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <span style={{ color: '#c9a227', fontFamily: 'Playfair Display, serif',
                fontSize: '0.85rem', flexShrink: 0 }}>{i + 1}.</span>
              <span style={{ fontSize: '0.9rem', color: '#a0958a',
                fontFamily: 'Cormorant Garamond, serif' }}>{tip}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
