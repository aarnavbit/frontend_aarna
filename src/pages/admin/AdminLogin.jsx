import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, LoaderCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import { adminApi } from '../../api/adminApi'

export function AdminLogin() {
  const [rollnumber, setRollnumber] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await adminApi.login(rollnumber, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem'
    }}>
      <div style={{
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: 'clamp(20px, 5vw, 40px)',
        maxWidth: '440px',
        width: '100%',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex',
            padding: '12px',
            borderRadius: '12px',
            background: 'rgba(99, 102, 241, 0.15)',
            color: '#6366f1',
            marginBottom: '1rem'
          }}>
            <ShieldCheck size={36} />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '700', margin: '0 0 0.5rem 0', color: '#f8fafc' }}>
            Admin Portal
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.925rem', margin: '0 0 1rem 0' }}>
            Sign in with your admin Roll Number to access live applicants data.
          </p>

          {/* Default Credentials Helper */}
          <div style={{
            padding: '10px 14px',
            borderRadius: '8px',
            background: 'rgba(99, 102, 241, 0.12)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            fontSize: '0.825rem',
            color: '#c7d2fe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            textAlign: 'left'
          }}>
            <div>
              <strong style={{ color: '#fff', display: 'block' }}>Default Super Admin Credentials:</strong>
              <span>Roll: <code style={{ color: '#a5b4fc', background: 'rgba(0,0,0,0.3)', padding: '1px 4px', borderRadius: '4px' }}>ADMIN001</code> | Pass: <code style={{ color: '#a5b4fc', background: 'rgba(0,0,0,0.3)', padding: '1px 4px', borderRadius: '4px' }}>adminpassword123</code></span>
            </div>
          </div>
        </div>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 16px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            color: '#fca5a5',
            fontSize: '0.875rem',
            marginBottom: '1.5rem'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#cbd5e1', marginBottom: '6px' }}>
              Roll Number
            </label>
            <input
              type="text"
              value={rollnumber}
              onChange={(e) => setRollnumber(e.target.value)}
              placeholder="e.g. ADMIN001"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck="false"
              required
              style={{
                width: '100%',
                padding: '10px 14px',
                minHeight: '44px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                background: 'rgba(30, 41, 59, 0.6)',
                color: '#fff',
                fontSize: '16px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#cbd5e1', marginBottom: '6px' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
              required
              style={{
                width: '100%',
                padding: '10px 14px',
                minHeight: '44px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                background: 'rgba(30, 41, 59, 0.6)',
                color: '#fff',
                fontSize: '16px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '0.5rem',
              padding: '12px',
              minHeight: '44px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              color: '#fff',
              fontWeight: '600',
              fontSize: '16px',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
              transition: 'opacity 0.2s'
            }}
          >
            {loading ? (
              <>
                <LoaderCircle className="spin" size={18} /> Authenticating...
              </>
            ) : (
              'Sign In to Dashboard'
            )}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => navigate('/')}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              minHeight: '44px',
              padding: '8px 12px'
            }}
          >
            <ArrowLeft size={16} /> Back to main site
          </button>
        </div>
      </div>
    </div>
  )
}
