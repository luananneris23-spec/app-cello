import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../App'
import { SCALES_CURRICULUM, getScaleData, NOTE_NAMES_PT } from '../data/musicData'

export default function ScalePractice() {
  const { scaleId } = useParams()
  const navigate = useNavigate()
  const { user, supabase } = useAuth()

  const scale = SCALES_CURRICULUM.find(s => s.id === scaleId)
  const scaleData = scale ? getScaleData(scale.root, scale.type) : null

  const [bpm, setBpm] = useState(scale?.bpmGoals?.[0] || 40)
  const [metroPlaying, setMetroPlaying] = useState(false)
  const [beat, setBeat] = useState(0)
  const [recording, setRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState(null)
  const [audioUrl, setAudioUrl] = useState(null)
  const [sessionSeconds, setSessionSeconds] = useState(0)
  const [showTuner, setShowTuner] = useState(false)
  const [tunerNote, setTunerNote] = useState(null)
  const [tunerCents, setTunerCents] = useState(0)
  const [activeNoteIdx, setActiveNoteIdx] = useState(-1)
  const [score, setScore] = useState(null)
  const [sessionSaved, setSessionSaved] = useState(false)

  const audioCtxRef = useRef(null)
  const analyserRef = useRef(null)
  const streamRef = useRef(null)
  const mediaRecRef = useRef(null)
  const chunksRef = useRef([])
  const rafRef = useRef(null)
  const metroTimer = useRef(null)
  const nextNoteRef = useRef(0)
  const beatRef = useRef(0)
  const timerInterval = useRef(null)
  const bpmRef = useRef(bpm)

  useEffect(() => { bpmRef.current = bpm }, [bpm])

  useEffect(() => {
    if (!scale) navigate('/scales')
  }, [scale, navigate])

  // Timer de sessão
  useEffect(() => {
    if (metroPlaying) {
      timerInterval.current = setInterval(() => setSessionSeconds(s => s + 1), 1000)
    } else {
      clearInterval(timerInterval.current)
    }
    return () => clearInterval(timerInterval.current)
  }, [metroPlaying])

  // Metrônomo
  const beep = useCallback((ctx, time, isFirst) => {
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.connect(g); g.connect(ctx.destination)
    osc.type = 'square'
    osc.frequency.value = isFirst ? 1100 : 700
    g.gain.setValueAtTime(isFirst ? 0.35 : 0.2, time)
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.05)
    osc.start(time); osc.stop(time + 0.06)
  }, [])

  const scheduleMetro = useCallback(() => {
    if (!audioCtxRef.current) return
    const ctx = audioCtxRef.current
    const spb = 60 / bpmRef.current
    while (nextNoteRef.current < ctx.currentTime + 0.1) {
      const isFirst = beatRef.current === 0
      beep(ctx, nextNoteRef.current, isFirst)
      const b = beatRef.current
      setBeat(b)
      if (scaleData) setActiveNoteIdx(b % scaleData.notes.length)
      beatRef.current = (beatRef.current + 1) % 4
      nextNoteRef.current += spb
    }
    metroTimer.current = setTimeout(scheduleMetro, 25)
  }, [beep, scaleData])

  const startMetro = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }
    beatRef.current = 0
    nextNoteRef.current = audioCtxRef.current.currentTime + 0.05
    setMetroPlaying(true)
    setBeat(0)
    scheduleMetro()
  }, [scheduleMetro])

  const stopMetro = useCallback(() => {
    clearTimeout(metroTimer.current)
    setMetroPlaying(false)
    setActiveNoteIdx(-1)
    setBeat(0)
  }, [])

  // Afinador
  const CHROMATIC = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
  const freqToNote = (freq) => {
    if (!freq || freq <= 0) return null
    const semitones = 12 * Math.log2(freq / 440)
    const noteIdx = Math.round(semitones)
    const cents = (semitones - noteIdx) * 100
    return { note: CHROMATIC[((noteIdx % 12) + 12) % 12], cents: Math.round(cents) }
  }
  const autoCorrelate = (buf, sr) => {
    let rms = 0
    for (let i = 0; i < buf.length; i++) rms += buf[i] * buf[i]
    if (Math.sqrt(rms / buf.length) < 0.015) return -1
    const c = new Array(buf.length).fill(0)
    for (let i = 0; i < buf.length / 2; i++)
      for (let j = 0; j < buf.length - i; j++) c[i] += buf[j] * buf[j + i]
    let d = 0
    while (c[d] > c[d + 1]) d++
    let mx = -1, mp = -1
    for (let i = d; i < buf.length; i++) if (c[i] > mx) { mx = c[i]; mp = i }
    return sr / mp
  }

  const startTuner = useCallback(async () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
      }
      if (!streamRef.current) {
        streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true })
      }
      analyserRef.current = audioCtxRef.current.createAnalyser()
      analyserRef.current.fftSize = 2048
      const src = audioCtxRef.current.createMediaStreamSource(streamRef.current)
      src.connect(analyserRef.current)
      setShowTuner(true)
      const tick = () => {
        if (!analyserRef.current) return
        const buf = new Float32Array(analyserRef.current.fftSize)
        analyserRef.current.getFloatTimeDomainData(buf)
        const freq = autoCorrelate(buf, audioCtxRef.current.sampleRate)
        if (freq > 0) {
          const n = freqToNote(freq)
          if (n) { setTunerNote(n.note); setTunerCents(n.cents) }
        }
        rafRef.current = requestAnimationFrame(tick)
      }
      tick()
    } catch { alert('Microfone necessário') }
  }, [])

  const stopTuner = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    analyserRef.current?.disconnect()
    setShowTuner(false)
    setTunerNote(null)
  }, [])

  // Gravação
  const startRecording = useCallback(async () => {
    try {
      if (!streamRef.current) {
        streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true })
      }
      chunksRef.current = []
      mediaRecRef.current = new MediaRecorder(streamRef.current)
      mediaRecRef.current.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mediaRecRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
      }
      mediaRecRef.current.start()
      setRecording(true)
    } catch { alert('Microfone necessário') }
  }, [])

  const stopRecording = useCallback(() => {
    mediaRecRef.current?.stop()
    setRecording(false)
  }, [])

  // Salvar sessão
  const saveSession = async () => {
    if (!user || !scale) return
    const { data: progRow } = await supabase.from('scale_progress')
      .select('*').eq('user_id', user.id).eq('scale_name', scale.name).single()

    let recordingUrl = null
    if (audioBlob) {
      const path = `${user.id}/${Date.now()}.webm`
      const { data: up } = await supabase.storage.from('recordings').upload(path, audioBlob)
      if (up) recordingUrl = path
    }

    await supabase.from('practice_sessions').insert({
      user_id: user.id, session_type: 'scale', scale_name: scale.name,
      duration_seconds: sessionSeconds, bpm, recording_url: recordingUrl
    })

    const sc = Math.max(0, Math.min(100, 100 - Math.abs(tunerCents || 0) * 2))
    if (!progRow) {
      await supabase.from('scale_progress').insert({
        user_id: user.id, scale_name: scale.name, scale_type: scale.type,
        difficulty_level: scale.difficulty, bpm_achieved: bpm,
        sessions_count: 1, best_score: sc, unlocked: true
      })
    } else {
      await supabase.from('scale_progress').update({
        sessions_count: (progRow.sessions_count || 0) + 1,
        bpm_achieved: Math.max(progRow.bpm_achieved || 0, bpm),
        best_score: Math.max(progRow.best_score || 0, sc),
        last_practiced_at: new Date().toISOString()
      }).eq('id', progRow.id)
    }
    setScore(sc)
    setSessionSaved(true)
  }

  useEffect(() => () => {
    stopMetro()
    stopTuner()
    streamRef.current?.getTracks().forEach(t => t.stop())
    clearInterval(timerInterval.current)
  }, [])

  if (!scale || !scaleData) return null

  const tuningColor = tunerNote
    ? Math.abs(tunerCents) < 5 ? '#4CAF50' : Math.abs(tunerCents) < 15 ? '#FFC107' : '#F44336'
    : '#c9a227'

  const formatTime = s => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`

  return (
    <div style={{ padding: '2.5rem 2rem', maxWidth: 1000, margin: '0 auto' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <button onClick={() => navigate('/scales')} style={{ background: 'none', border: 'none',
          color: '#8B6914', cursor: 'pointer', fontFamily: 'Cormorant Garamond, serif', fontSize: '0.85rem' }}>
          ← Escalas
        </button>
        <span style={{ color: '#8B6914' }}>/</span>
        <span style={{ color: '#a0958a', fontFamily: 'Cormorant Garamond, serif', fontSize: '0.85rem' }}>{scale.name}</span>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.25rem' }}>{scale.name}</h1>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          <span className="badge badge-gold">Fase {scale.phase}</span>
          <span className="badge badge-silver">{scale.positions}</span>
          <span className="badge badge-silver">Dificuldade {scale.difficulty}/10</span>
        </div>
        <p style={{ fontStyle: 'italic', color: '#a0958a' }}>{scale.description}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Coluna esquerda — notas + dicas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Notas da escala */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase',
              color: '#8B6914', marginBottom: '1rem', fontFamily: 'Playfair Display, serif' }}>
              Notas da Escala
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {scaleData.notes.map((note, i) => (
                <div key={i} style={{
                  width: 44, height: 44, borderRadius: '50%', display: 'flex',
                  flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  background: activeNoteIdx === i ? 'rgba(201,162,39,0.3)' :
                    note === scale.root ? 'rgba(201,162,39,0.15)' : 'rgba(201,162,39,0.05)',
                  border: `1.5px solid ${activeNoteIdx === i ? '#c9a227' :
                    note === scale.root ? 'rgba(201,162,39,0.5)' : 'rgba(201,162,39,0.15)'}`,
                  transition: 'all 0.08s',
                  boxShadow: activeNoteIdx === i ? '0 0 10px rgba(201,162,39,0.3)' : 'none'
                }}>
                  <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '0.85rem',
                    color: activeNoteIdx === i ? '#e6c45a' : '#c9a227', lineHeight: 1.1 }}>
                    {NOTE_NAMES_PT[note] || note}
                  </div>
                  <div style={{ fontSize: '0.55rem', color: '#8B6914', fontFamily: 'monospace' }}>
                    {['I','II','III','IV','V','VI','VII','VIII'][i]}
                  </div>
                </div>
              ))}
            </div>

            <hr className="gold-rule" style={{ margin: '1rem 0' }}/>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8rem' }}>
              {[
                ['Tônica (I)', NOTE_NAMES_PT[scaleData.tonic] || scaleData.tonic],
                ['Dominante (V)', NOTE_NAMES_PT[scaleData.dominant] || scaleData.dominant],
                ['Subdominante (IV)', NOTE_NAMES_PT[scaleData.subdominant] || scaleData.subdominant],
                ['Sensível (VII)', NOTE_NAMES_PT[scaleData.leadingTone] || scaleData.leadingTone],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between',
                  padding: '0.3rem 0.5rem', background: 'rgba(201,162,39,0.04)', borderRadius: '3px' }}>
                  <span style={{ color: '#8B6914', fontFamily: 'Cormorant Garamond, serif' }}>{label}</span>
                  <span style={{ color: '#e6c45a', fontFamily: 'Playfair Display, serif' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Dicas */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase',
              color: '#8B6914', marginBottom: '0.75rem', fontFamily: 'Playfair Display, serif' }}>
              Dicas de Execução
            </div>
            {scale.tips.map((tip, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.6rem', marginBottom: '0.5rem' }}>
                <span style={{ color: '#c9a227', flexShrink: 0 }}>◆</span>
                <span style={{ fontSize: '0.85rem', color: '#a0958a',
                  fontFamily: 'Cormorant Garamond, serif', lineHeight: 1.5 }}>{tip}</span>
              </div>
            ))}
            {scale.dotzauerRef && (
              <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem',
                background: 'rgba(201,162,39,0.06)', borderRadius: '3px',
                fontSize: '0.78rem', color: '#8B6914', fontFamily: 'Cormorant Garamond, serif' }}>
                📖 Dotzauer: {scale.dotzauerRef}
              </div>
            )}
          </div>

          {/* Metas de BPM */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase',
              color: '#8B6914', marginBottom: '0.75rem', fontFamily: 'Playfair Display, serif' }}>
              Metas de Andamento
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {scale.bpmGoals.map((goal, i) => (
                <button key={goal} onClick={() => setBpm(goal)}
                  className={`btn ${bpm === goal ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}>
                  {goal}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Coluna direita — controles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Metrônomo */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase',
              color: '#8B6914', marginBottom: '1rem', fontFamily: 'Playfair Display, serif' }}>
              Metrônomo
            </div>

            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '3.5rem',
                color: '#e6c45a', lineHeight: 1, fontWeight: 700 }}>{bpm}</div>
              <div style={{ fontSize: '0.75rem', color: '#8B6914', letterSpacing: '0.1em',
                textTransform: 'uppercase', fontFamily: 'Playfair Display, serif' }}>BPM</div>
            </div>

            {/* Beats */}
            <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center', marginBottom: '1rem' }}>
              {[0,1,2,3].map(i => (
                <div key={i} style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: metroPlaying && beat === i ? (i === 0 ? '#c9a227' : '#8B6914') : 'rgba(201,162,39,0.08)',
                  border: `1.5px solid ${metroPlaying && beat === i ? '#e6c45a' : 'rgba(201,162,39,0.2)'}`,
                  transition: 'all 0.06s'
                }}/>
              ))}
            </div>

            <input type="range" min="20" max="180" value={bpm}
              onChange={e => setBpm(Number(e.target.value))}
              style={{ width: '100%', marginBottom: '0.75rem' }}/>

            <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center', marginBottom: '1rem' }}>
              {[-5,-1,'+1','+5'].map(d => (
                <button key={d} onClick={() => setBpm(b => Math.max(20, Math.min(200, b + (typeof d === 'string' ? parseInt(d) : d))))}
                  className="btn btn-ghost" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>
                  {d > 0 ? `+${d}` : d}
                </button>
              ))}
            </div>

            <button onClick={metroPlaying ? stopMetro : startMetro}
              className={`btn ${metroPlaying ? 'btn-danger' : 'btn-primary'}`}
              style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}>
              {metroPlaying ? '⏹ Parar' : '▶ Iniciar'} — {formatTime(sessionSeconds)}
            </button>
          </div>

          {/* Afinador integrado */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase',
                color: '#8B6914', fontFamily: 'Playfair Display, serif' }}>Afinador</div>
              <button onClick={showTuner ? stopTuner : startTuner}
                className={`btn ${showTuner ? 'btn-danger' : 'btn-secondary'}`}
                style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem' }}>
                {showTuner ? 'Desligar' : 'Ligar'}
              </button>
            </div>

            {showTuner ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '3rem',
                  color: tuningColor, lineHeight: 1, transition: 'color 0.15s', fontWeight: 700 }}>
                  {tunerNote ? (NOTE_NAMES_PT[tunerNote] || tunerNote) : '—'}
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '1rem',
                  color: tuningColor, marginTop: '0.25rem' }}>
                  {tunerCents > 0 ? '+' : ''}{tunerCents} cents
                </div>
                {Math.abs(tunerCents) < 5 && tunerNote && (
                  <div style={{ color: '#4CAF50', fontSize: '0.8rem', marginTop: '0.25rem',
                    fontFamily: 'Playfair Display, serif', letterSpacing: '0.1em' }}>✓ AFINADO</div>
                )}
                <div style={{ marginTop: '0.75rem', height: 6, borderRadius: 3,
                  background: 'rgba(201,162,39,0.1)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{
                    position: 'absolute', top: 0, height: '100%',
                    width: 8, background: tuningColor, borderRadius: 3, transition: 'left 0.1s',
                    left: `calc(50% + ${Math.max(-45, Math.min(45, tunerCents)) * 0.9}%)`,
                  }}/>
                  <div style={{ position: 'absolute', top: 0, left: '50%', width: 1,
                    height: '100%', background: 'rgba(76,175,80,0.5)' }}/>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '0.82rem', color: '#8B6914', fontStyle: 'italic',
                fontFamily: 'Cormorant Garamond, serif', textAlign: 'center' }}>
                Ative para monitorar a afinação enquanto toca
              </p>
            )}
          </div>

          {/* Gravação */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase',
              color: '#8B6914', marginBottom: '0.75rem', fontFamily: 'Playfair Display, serif' }}>
              Gravação
            </div>

            <button onClick={recording ? stopRecording : startRecording}
              className={`btn ${recording ? 'btn-danger' : 'btn-secondary'}`}
              style={{ width: '100%', justifyContent: 'center', marginBottom: '0.75rem',
                animation: recording ? 'pulse-gold 1.5s ease-in-out infinite' : 'none' }}>
              {recording ? '⏹ Parar Gravação' : '🎙 Gravar Execução'}
            </button>

            {audioUrl && (
              <div>
                <div style={{ fontSize: '0.75rem', color: '#8B6914', marginBottom: '0.4rem',
                  fontFamily: 'Cormorant Garamond, serif' }}>Ouça sua execução:</div>
                <audio src={audioUrl} controls style={{ width: '100%', height: 36 }}/>
              </div>
            )}
          </div>

          {/* Salvar sessão */}
          {sessionSeconds > 10 && !sessionSaved && (
            <button onClick={saveSession} className="btn btn-primary"
              style={{ justifyContent: 'center', padding: '0.85rem' }}>
              💾 Salvar Sessão ({formatTime(sessionSeconds)})
            </button>
          )}
          {sessionSaved && score !== null && (
            <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(201,162,39,0.08)',
              border: '1px solid rgba(201,162,39,0.2)', borderRadius: '6px' }}>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', color: '#e6c45a' }}>
                ✓ Sessão salva
              </div>
              <div style={{ fontSize: '0.85rem', color: '#a0958a', marginTop: '0.3rem',
                fontFamily: 'Cormorant Garamond, serif' }}>
                Progresso registrado com sucesso
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
