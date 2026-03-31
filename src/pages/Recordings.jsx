import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../App'

export default function Recordings() {
  const { user, supabase } = useAuth()
  const [recordings, setRecordings] = useState([])
  const [recording, setRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState(null)
  const [liveUrl, setLiveUrl] = useState(null)
  const [title, setTitle] = useState('')
  const [duration, setDuration] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showCompare, setShowCompare] = useState(null)
  const [waveformData, setWaveformData] = useState([])

  const mediaRecRef = useRef(null)
  const streamRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  const analyserRef = useRef(null)
  const audioCtxRef = useRef(null)
  const rafRef = useRef(null)

  useEffect(() => {
    if (!user) return
    loadRecordings()
  }, [user])

  const loadRecordings = async () => {
    setLoading(true)
    const { data } = await supabase.from('recordings')
      .select('*').eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setRecordings(data || [])
    setLoading(false)
  }

  const startRecording = useCallback(async () => {
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true })

      // AudioContext para visualização
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
      analyserRef.current = audioCtxRef.current.createAnalyser()
      analyserRef.current.fftSize = 128
      const src = audioCtxRef.current.createMediaStreamSource(streamRef.current)
      src.connect(analyserRef.current)

      chunksRef.current = []
      mediaRecRef.current = new MediaRecorder(streamRef.current)
      mediaRecRef.current.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mediaRecRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        setLiveUrl(URL.createObjectURL(blob))
        cancelAnimationFrame(rafRef.current)
        setWaveformData([])
      }
      mediaRecRef.current.start()
      setRecording(true)
      setDuration(0)
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000)

      // Waveform visual
      const drawWave = () => {
        const buf = new Uint8Array(analyserRef.current.frequencyBinCount)
        analyserRef.current.getByteFrequencyData(buf)
        setWaveformData(Array.from(buf).slice(0, 32))
        rafRef.current = requestAnimationFrame(drawWave)
      }
      drawWave()
    } catch { alert('Permissão de microfone necessária') }
  }, [])

  const stopRecording = useCallback(() => {
    mediaRecRef.current?.stop()
    streamRef.current?.getTracks().forEach(t => t.stop())
    clearInterval(timerRef.current)
    setRecording(false)
  }, [])

  const saveRecording = async () => {
    if (!audioBlob || !user) return
    setSaving(true)
    try {
      const path = `${user.id}/${Date.now()}.webm`
      const { error: upErr } = await supabase.storage
        .from('recordings').upload(path, audioBlob)
      if (upErr) throw upErr

      await supabase.from('recordings').insert({
        user_id: user.id,
        title: title || `Gravação ${new Date().toLocaleDateString('pt-BR')}`,
        storage_path: path,
        duration_seconds: duration
      })
      setAudioBlob(null); setLiveUrl(null); setTitle(''); setDuration(0)
      await loadRecordings()
    } catch (err) {
      alert('Erro ao salvar: ' + err.message)
    }
    setSaving(false)
  }

  const deleteRecording = async (id, path) => {
    if (!confirm('Apagar esta gravação?')) return
    await supabase.storage.from('recordings').remove([path])
    await supabase.from('recordings').delete().eq('id', id)
    setRecordings(r => r.filter(rec => rec.id !== id))
  }

  const getAudioUrl = async (path) => {
    const { data } = await supabase.storage.from('recordings').createSignedUrl(path, 3600)
    return data?.signedUrl
  }

  const formatTime = s => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`
  const formatDate = d => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <div style={{ padding: '2.5rem 2rem', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '0.75rem',
          letterSpacing: '0.2em', textTransform: 'uppercase', color: '#c9a227' }}>Ouça-se</span>
        <h1 style={{ marginTop: '0.2rem' }}>Gravações</h1>
        <p style={{ fontStyle: 'italic', color: '#a0958a', marginTop: '0.3rem' }}>
          Gravar e ouvir é a forma mais honesta de avaliar seu progresso
        </p>
      </div>

      {/* Gravador */}
      <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase',
          color: '#8B6914', marginBottom: '1.25rem', fontFamily: 'Playfair Display, serif' }}>
          Nova Gravação
        </div>

        {/* Waveform visual */}
        {recording && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px',
            height: 48, marginBottom: '1rem', justifyContent: 'center' }}>
            {waveformData.map((v, i) => (
              <div key={i} style={{
                width: 8, borderRadius: '3px 3px 0 0',
                height: Math.max(4, (v / 255) * 48),
                background: `rgba(201,162,39,${0.3 + (v / 255) * 0.7})`,
                transition: 'height 0.06s'
              }}/>
            ))}
            {waveformData.length === 0 && Array.from({length: 16}).map((_, i) => (
              <div key={i} style={{ width: 8, height: 4, borderRadius: '3px 3px 0 0',
                background: 'rgba(201,162,39,0.2)' }}/>
            ))}
          </div>
        )}

        {/* Timer */}
        {recording && (
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '2.5rem', color: '#e6c45a',
              lineHeight: 1 }}>{formatTime(duration)}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '0.4rem', marginTop: '0.25rem' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F44336',
                animation: 'pulse-gold 1s ease-in-out infinite' }}/>
              <span style={{ fontSize: '0.75rem', color: '#F44336',
                fontFamily: 'Playfair Display, serif', letterSpacing: '0.1em' }}>GRAVANDO</span>
            </div>
          </div>
        )}

        {/* Botão de gravar */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '1.25rem' }}>
          <button onClick={recording ? stopRecording : startRecording}
            className={`btn ${recording ? 'btn-danger' : 'btn-primary'}`}
            style={{ padding: '0.85rem 2.5rem', fontSize: '1rem', minWidth: 180,
              justifyContent: 'center' }}>
            {recording ? '⏹ Parar' : '🎙 Gravar'}
          </button>
        </div>

        {/* Preview e salvar */}
        {liveUrl && !recording && (
          <div style={{ borderTop: '1px solid rgba(201,162,39,0.1)', paddingTop: '1.25rem' }}>
            <div style={{ fontSize: '0.8rem', color: '#8B6914', marginBottom: '0.5rem',
              fontFamily: 'Cormorant Garamond, serif' }}>Prévia — {formatTime(duration)}</div>
            <audio src={liveUrl} controls style={{ width: '100%', marginBottom: '1rem' }}/>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <input value={title} onChange={e => setTitle(e.target.value)}
                placeholder="Nome da gravação (opcional)" style={{ flex: 1 }}/>
              <button onClick={saveRecording} disabled={saving}
                className="btn btn-primary" style={{ flexShrink: 0 }}>
                {saving ? 'Salvando...' : '💾 Salvar'}
              </button>
              <button onClick={() => { setLiveUrl(null); setAudioBlob(null) }}
                className="btn btn-ghost" style={{ flexShrink: 0 }}>
                Descartar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lista de gravações */}
      <div>
        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '0.75rem',
          letterSpacing: '0.18em', textTransform: 'uppercase', color: '#8B6914',
          marginBottom: '1rem' }}>
          Gravações Salvas ({recordings.length})
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#8B6914',
            fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic' }}>
            Carregando...
          </div>
        ) : recordings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#a0958a',
            fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic' }}>
            Nenhuma gravação salva ainda.<br/>Grave sua primeira execução acima!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recordings.map(rec => (
              <RecordingItem key={rec.id} rec={rec}
                onDelete={() => deleteRecording(rec.id, rec.storage_path)}
                getUrl={getAudioUrl} formatTime={formatTime} formatDate={formatDate} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function RecordingItem({ rec, onDelete, getUrl, formatTime, formatDate }) {
  const [url, setUrl] = useState(null)
  const [expanded, setExpanded] = useState(false)

  const expand = async () => {
    if (!expanded && !url) {
      const u = await getUrl(rec.storage_path)
      setUrl(u)
    }
    setExpanded(e => !e)
  }

  return (
    <div className="card" style={{ padding: '1rem 1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1rem',
            color: '#e6c45a', marginBottom: '0.15rem' }}>{rec.title}</div>
          <div style={{ fontSize: '0.78rem', color: '#8B6914',
            fontFamily: 'Cormorant Garamond, serif' }}>
            {formatDate(rec.created_at)}
            {rec.duration_seconds ? ` · ${formatTime(rec.duration_seconds)}` : ''}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button onClick={expand} className="btn btn-secondary"
            style={{ padding: '0.35rem 0.8rem', fontSize: '0.8rem' }}>
            {expanded ? 'Fechar' : '▶ Ouvir'}
          </button>
          <button onClick={onDelete} className="btn btn-ghost"
            style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', color: '#c4393a',
              borderColor: 'rgba(196,57,58,0.3)' }}>
            🗑
          </button>
        </div>
      </div>
      {expanded && url && (
        <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem',
          borderTop: '1px solid rgba(201,162,39,0.1)' }}>
          <audio src={url} controls style={{ width: '100%' }}/>
        </div>
      )}
    </div>
  )
}
