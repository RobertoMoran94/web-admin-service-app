import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { UserRole } from '../types'

type AuthMode = 'signin' | 'signup'

// ── Small reusable text input ──────────────────────────────────────────────────
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

// ── Password input with show/hide toggle ──────────────────────────────────────
function PasswordField({
  label, value, onChange, placeholder, autoComplete,
}: {
  label: string; value: string
  onChange: (v: string) => void; placeholder?: string; autoComplete?: string
}) {
  const [visible, setVisible] = useState(false)

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 pr-10 text-sm
                     focus:outline-none focus:ring-2 focus:ring-brand-500 transition-shadow"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          tabIndex={-1}
          className="absolute inset-y-0 right-3 flex items-center text-gray-400
                     hover:text-gray-600 transition-colors"
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? (
            // Eye-off icon
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"
              stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7
                   a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243
                   M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29
                   M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943
                   9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          ) : (
            // Eye icon
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"
              stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943
                   9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>
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
    <svg className="animate-spin w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  )
}

// ── Error banner ──────────────────────────────────────────────────────────────
function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="p-3 rounded-lg bg-red-50 border border-red-200">
      <p className="text-sm text-red-700">{message}</p>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const { userDoc, loading, error: authError, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth()
  const navigate = useNavigate()

  const [mode,        setMode]        = useState<AuthMode>('signin')
  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [confirmPwd,  setConfirmPwd]  = useState('')
  const [displayName, setDisplayName] = useState('')
  const [googleBusy,  setGoogleBusy]  = useState(false)
  const [emailBusy,   setEmailBusy]   = useState(false)
  // Separate error states:
  //   authError  — from useAuth (Google SSO failures, Firestore errors) — shown above Google button
  //   formError  — validation + email/password Firebase errors — shown below the submit button
  const [formError,   setFormError]   = useState<string | null>(null)

  // Redirect once auth resolves and user has access
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
    setFormError(null)
    setEmail('')
    setPassword('')
    setConfirmPwd('')
    setDisplayName('')
  }

  // ── Google ──────────────────────────────────────────────────────────────────
  const handleGoogle = async () => {
    setGoogleBusy(true)
    try { await signInWithGoogle() }
    finally { setGoogleBusy(false) }
  }

  // ── Email sign-in ───────────────────────────────────────────────────────────
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    if (!email)    { setFormError('Please enter your email.'); return }
    if (!password) { setFormError('Please enter your password.'); return }
    setEmailBusy(true)
    try {
      await signInWithEmail(email, password)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Sign-in failed.')
    } finally {
      setEmailBusy(false)
    }
  }

  // ── Email sign-up ───────────────────────────────────────────────────────────
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    if (!displayName.trim())     { setFormError('Please enter your full name.'); return }
    if (!email)                  { setFormError('Please enter your email.'); return }
    if (password.length < 6)     { setFormError('Password must be at least 6 characters.'); return }
    if (password !== confirmPwd) { setFormError('Passwords do not match.'); return }
    setEmailBusy(true)
    try {
      await signUpWithEmail(email, password, displayName.trim())
      // userDoc is set inside signUpWithEmail → useEffect above fires → redirect
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Sign-up failed.')
    } finally {
      setEmailBusy(false)
    }
  }

  const anyBusy  = googleBusy || emailBusy || loading
  const noAccess = !loading && userDoc &&
    userDoc.role !== UserRole.ADMIN &&
    userDoc.role !== UserRole.BUSINESS_OWNER

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">

        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-500 mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24"
              stroke="currentColor" strokeWidth={2}>
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
            <ErrorBanner message="Your account doesn't have portal access. Contact an admin." />
          )}

          {/* Auth-level errors (Google SSO failures, Firestore permission errors) */}
          {authError && <div className="mb-4"><ErrorBanner message={authError} /></div>}

          {/* Google button */}
          <button
            onClick={handleGoogle}
            disabled={anyBusy}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl
                       border border-gray-300 bg-white text-sm font-medium text-gray-700
                       hover:bg-gray-50 active:bg-gray-100
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors shadow-sm"
          >
            {googleBusy ? <Spinner /> : <GoogleLogo />}
            {mode === 'signin' ? 'Continue with Google' : 'Sign up with Google'}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* ── Sign in form ── */}
          {mode === 'signin' && (
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <Field label="Email" type="email" value={email} onChange={setEmail}
                placeholder="you@example.com" autoComplete="email" />
              <PasswordField label="Password" value={password} onChange={setPassword}
                placeholder="••••••••" autoComplete="current-password" />
              <button
                type="submit" disabled={anyBusy}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-brand-500
                           text-white text-sm font-medium rounded-xl
                           hover:bg-brand-600 disabled:opacity-50 transition-colors shadow-sm"
              >
                {emailBusy && <Spinner />}
                {emailBusy ? 'Signing in…' : 'Sign in'}
              </button>
              {/* Form error shown below the submit button */}
              {formError && <ErrorBanner message={formError} />}
            </form>
          )}

          {/* ── Sign up form ── */}
          {mode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <Field label="Full name" value={displayName} onChange={setDisplayName}
                placeholder="Jane Smith" autoComplete="name" />
              <Field label="Email" type="email" value={email} onChange={setEmail}
                placeholder="you@example.com" autoComplete="email" />
              <PasswordField label="Password" value={password} onChange={setPassword}
                placeholder="Min 6 characters" autoComplete="new-password" />
              <PasswordField label="Confirm password" value={confirmPwd} onChange={setConfirmPwd}
                placeholder="Repeat password" autoComplete="new-password" />
              <button
                type="submit" disabled={anyBusy}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-brand-500
                           text-white text-sm font-medium rounded-xl
                           hover:bg-brand-600 disabled:opacity-50 transition-colors shadow-sm"
              >
                {emailBusy && <Spinner />}
                {emailBusy ? 'Creating account…' : 'Create account'}
              </button>
              {/* Form error shown below the submit button */}
              {formError && <ErrorBanner message={formError} />}
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
