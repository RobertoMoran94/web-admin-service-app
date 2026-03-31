import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { UserRole } from '../types'

type AuthMode = 'signin' | 'signup'

// ── Small reusable input ──────────────────────────────────────────────────────
function Field({
  label, type = 'text', value, onChange, placeholder, autoComplete,
}: {
  label: string; type?: string; value: string
  onChange: (v: string) => void; placeholder?: string; autoComplete?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type} value={value} placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm
                   focus:outline-none focus:ring-2 focus:ring-brand-500 transition-shadow"
      />
    </div>
  )
}

// ── Google logo SVG ───────────────────────────────────────────────────────────
function GoogleLogo() {
  return (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

// ── Spinner ───────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <svg className="animate-spin w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const { userDoc, loading, error, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth()
  const navigate = useNavigate()

  const [mode,        setMode]        = useState<AuthMode>('signin')
  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [confirmPwd,  setConfirmPwd]  = useState('')
  const [displayName, setDisplayName] = useState('')
  const [busy,        setBusy]        = useState(false)
  const [localError,  setLocalError]  = useState<string | null>(null)

  // Redirect to dashboard once auth resolves and user has access
  useEffect(() => {
    if (!loading && userDoc) {
      const hasAccess =
        userDoc.role === UserRole.ADMIN ||
        userDoc.role === UserRole.BUSINESS_OWNER
      if (hasAccess) navigate('/overview', { replace: true })
    }
  }, [loading, userDoc, navigate])

  const switchMode = (m: AuthMode) => {
    setMode(m)
    setLocalError(null)
    setEmail('')
    setPassword('')
    setConfirmPwd('')
    setDisplayName('')
  }

  const handleGoogle = async () => {
    setBusy(true)
    try { await signInWithGoogle() }
    finally { setBusy(false) }
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)
    if (!email || !password) { setLocalError('Please fill in all fields.'); return }
    setBusy(true)
    try { await signInWithEmail(email, password) }
    catch { /* error already set in useAuth */ }
    finally { setBusy(false) }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)
    if (!displayName.trim()) { setLocalError('Please enter your name.'); return }
    if (!email)              { setLocalError('Please enter your email.'); return }
    if (password.length < 6) { setLocalError('Password must be at least 6 characters.'); return }
    if (password !== confirmPwd) { setLocalError('Passwords do not match.'); return }
    setBusy(true)
    try { await signUpWithEmail(email, password, displayName.trim()) }
    catch { /* error already set in useAuth */ }
    finally { setBusy(false) }
  }

  const shownError = localError || error
  const isBusy     = busy || loading
  const noAccess   = !loading && userDoc &&
    userDoc.role !== UserRole.ADMIN &&
    userDoc.role !== UserRole.BUSINESS_OWNER

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">

        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-500 mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Business Portal</h1>
          <p className="mt-1 text-sm text-gray-500">Booking Service — Management dashboard</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">

          {/* Mode tabs */}
          <div className="flex rounded-xl bg-gray-100 p-1 mb-6">
            {(['signin', 'signup'] as AuthMode[]).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  mode === m
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {m === 'signin' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>

          {/* Access denied */}
          {noAccess && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-700">
                <strong>Access denied.</strong> Your account does not have portal access.
                Contact an admin to request access.
              </p>
            </div>
          )}

          {/* Error */}
          {shownError && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-700">{shownError}</p>
            </div>
          )}

          {/* Google button (both modes) */}
          <button
            onClick={handleGoogle}
            disabled={isBusy}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl
                       border border-gray-300 bg-white text-sm font-medium text-gray-700
                       hover:bg-gray-50 active:bg-gray-100
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors shadow-sm"
          >
            {isBusy ? <Spinner /> : <GoogleLogo />}
            {mode === 'signin' ? 'Continue with Google' : 'Sign up with Google'}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Sign in form */}
          {mode === 'signin' && (
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <Field label="Email" type="email" value={email} onChange={setEmail}
                placeholder="you@example.com" autoComplete="email" />
              <Field label="Password" type="password" value={password} onChange={setPassword}
                placeholder="••••••••" autoComplete="current-password" />
              <button
                type="submit" disabled={isBusy}
                className="w-full py-2.5 bg-brand-500 text-white text-sm font-medium rounded-xl
                           hover:bg-brand-600 disabled:opacity-50 transition-colors shadow-sm"
              >
                {isBusy ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          )}

          {/* Sign up form */}
          {mode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <Field label="Full name" value={displayName} onChange={setDisplayName}
                placeholder="Jane Smith" autoComplete="name" />
              <Field label="Email" type="email" value={email} onChange={setEmail}
                placeholder="you@example.com" autoComplete="email" />
              <Field label="Password" type="password" value={password} onChange={setPassword}
                placeholder="Min 6 characters" autoComplete="new-password" />
              <Field label="Confirm password" type="password" value={confirmPwd} onChange={setConfirmPwd}
                placeholder="Repeat password" autoComplete="new-password" />
              <button
                type="submit" disabled={isBusy}
                className="w-full py-2.5 bg-brand-500 text-white text-sm font-medium rounded-xl
                           hover:bg-brand-600 disabled:opacity-50 transition-colors shadow-sm"
              >
                {isBusy ? 'Creating account…' : 'Create account'}
              </button>
              <p className="text-xs text-center text-gray-400">
                By creating an account you agree to our Terms of Service.
              </p>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          Booking Service &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
