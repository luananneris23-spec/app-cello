import { useState } from 'react'
import { useAuth } from '../App'

export default function Auth() {
  const { supabase } = useAuth()
  const [mode, setMode] = useState('login') // login | signup
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError(null); setMessage(null)
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { name } }
        })
        if (error) throw error
        setMessage('Verifique seu e-mail para confirmar o cadastro.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(160deg, #120c0c 0%, #1e1414 50%, #0e0a0a 100%)',
      padding: '2rem'
    }}>
      {/* Ornamental background */}
      <div style={{
        position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none'
      }}>
        <div style={{
          position: 'absolute', top: '10%', left: '5%', fontSize: '12rem',
          color: 'rgba(201,162,39,0.02)', fontFamily: 'serif', lineHeight: 1,
          userSelect: 'none'
        }}>𝄞</div>
        <div style={{
          position: 'absolute', bottom: '5%', right: '5%', fontSize: '10rem',
          color: 'rgba(201,162,39,0.03)', fontFamily: 'serif', lineHeight: 1,
          userSelect: 'none'
        }}>𝄢</div>
      </div>

      <div style={{ width: '100%', maxWidth: 400, position: 'relative' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <CelloLogo />
          <h1 style={{
            fontFamily: 'Playfair Display, serif', fontSize: '2.2rem',
            color: '#e6c45a', margin: '1rem 0 0.25rem', fontWeight: 600
          }}>Arco & Alma</h1>
          <p style={{
            fontFamily: 'Cormorant Garamond, serif', fontSize: '1rem',
            color: '#a0958a', fontStyle: 'italic', letterSpacing: '0.05em'
          }}>Alfabetização Musical para Violoncelo</p>
          <div style={{
            margin: '1rem auto 0', width: 80, height: 1,
            background: 'linear-gradient(to right, transparent, #c9a227, transparent)'
          }}/>
        </div>

        {/* Form card */}
        <div className="card" style={{ padding: '2.25rem' }}>
          <div style={{ display: 'flex', marginBottom: '1.75rem', gap: '0' }}>
            {['login', 'signup'].map(m => (
              <button key={m} onClick={() => setMode(m)}
                style={{
                  flex: 1, padding: '0.55rem', border: 'none', cursor: 'pointer',
                  fontFamily: 'Playfair Display, serif', fontSize: '0.9rem',
                  fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
                  transition: 'all 0.2s',
                  background: mode === m ? 'rgba(201,162,39,0.15)' : 'transparent',
                  color: mode === m ? '#e6c45a' : '#a0958a',
                  borderBottom: mode === m ? '2px solid #c9a227' : '2px solid rgba(201,162,39,0.1)',
                }}>
                {m === 'login' ? 'Entrar' : 'Cadastrar'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {mode === 'signup' && (
              <div>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem',
                  fontFamily: 'Playfair Display, serif', letterSpacing: '0.1em',
                  textTransform: 'uppercase', color: '#a0958a' }}>Nome</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="Seu nome" required />
              </div>
            )}
            <div>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem',
                fontFamily: 'Playfair Display, serif', letterSpacing: '0.1em',
                textTransform: 'uppercase', color: '#a0958a' }}>E-mail</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com" required />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem',
                fontFamily: 'Playfair Display, serif', letterSpacing: '0.1em',
                textTransform: 'uppercase', color: '#a0958a' }}>Senha</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required minLength={6} />
            </div>

            {error && (
              <div style={{ background: 'rgba(139,26,26,0.2)', border: '1px solid rgba(196,57,58,0.3)',
                borderRadius: '4px', padding: '0.65rem 0.9rem', fontSize: '0.875rem', color: '#c4393a' }}>
                {error}
              </div>
            )}
            {message && (
              <div style={{ background: 'rgba(201,162,39,0.1)', border: '1px solid rgba(201,162,39,0.3)',
                borderRadius: '4px', padding: '0.65rem 0.9rem', fontSize: '0.875rem', color: '#e6c45a' }}>
                {message}
              </div>
            )}

            <button type="submit" className="btn btn-primary"
              style={{ marginTop: '0.5rem', justifyContent: 'center', padding: '0.8rem' }}
              disabled={loading}>
              {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8rem',
          color: 'rgba(160,149,138,0.5)', fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic' }}>
          "A música expressa o que não pode ser dito e sobre o que é impossível permanecer em silêncio."
        </p>
      </div>
    </div>
  )
}

function CelloLogo() {
  return (
    <svg width="56" height="72" viewBox="0 0 56 72" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ margin: '0 auto', display: 'block' }}>
      <ellipse cx="28" cy="46" rx="20" ry="23" stroke="#c9a227" strokeWidth="1.5" fill="rgba(201,162,39,0.05)"/>
      <ellipse cx="28" cy="46" rx="12" ry="14" stroke="rgba(201,162,39,0.3)" strokeWidth="0.75" fill="none"/>
      <path d="M28 23 L28 6" stroke="#c9a227" strokeWidth="2" strokeLinecap="round"/>
      <path d="M20 30 Q28 25 36 30" stroke="#c9a227" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
      <path d="M15 46 Q28 40 41 46" stroke="#c9a227" strokeWidth="1" fill="none"/>
      <path d="M22 6 Q28 2 34 6" stroke="#c9a227" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
      <circle cx="28" cy="66" r="2.5" fill="#c9a227"/>
      <line x1="28" y1="63" x2="28" y2="69" stroke="#8B6914" strokeWidth="1"/>
    </svg>
  )
}
