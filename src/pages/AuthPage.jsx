import { useState } from 'react'

import {
  loginUser,
  registerUser,
} from '../utils/auth'

import LanguageSelector from '../Components/LanguageSelector'
import translations from '../data/translations'

import './AuthPage.css'


/* --------------------------------------------
   Auth Illustration
   -------------------------------------------- */

function AuthIllustration() {
  return (
    <div
      className="auth-illustration"
      aria-hidden="true"
    >
      <div className="auth-illustration-orbit auth-illustration-orbit--purple" />
      <div className="auth-illustration-orbit auth-illustration-orbit--blue" />
      <div className="auth-illustration-orbit auth-illustration-orbit--peach" />

      <div className="auth-illustration-center">
        <svg
          viewBox="0 0 80 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="40"
            cy="40"
            r="25"
            stroke="currentColor"
            strokeWidth="3.5"
          />

          <path
            d="M30 40C30 34.4772 34.4772 30 40 30C45.5228 30 50 34.4772 50 40C50 45.5228 45.5228 50 40 50"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          <circle
            cx="32"
            cy="28"
            r="3.5"
            fill="currentColor"
          />

          <circle
            cx="50"
            cy="32"
            r="3.5"
            fill="currentColor"
          />

          <circle
            cx="51"
            cy="49"
            r="3.5"
            fill="currentColor"
          />

          <circle
            cx="30"
            cy="52"
            r="3.5"
            fill="currentColor"
          />
        </svg>
      </div>
    </div>
  )
}


function AuthPage({
  onAuthenticated,
}) {
  const [mode, setMode] = useState('login')

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('elderly')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const [language, setLanguage] =
    useState(() => {
      return (
        localStorage.getItem(
          'cognicare-language',
        ) || 'en'
      )
    })


  const text =
    translations[language]?.authPage ||
    translations.en.authPage


  const handleLanguageChange = (
    newLanguage,
  ) => {
    setLanguage(newLanguage)

    localStorage.setItem(
      'cognicare-language',
      newLanguage,
    )
  }


  const handleSubmit = async (event) => {
    event.preventDefault()

    setError('')
    setMessage('')
    setLoading(true)

    try {
      if (mode === 'register') {
        await registerUser(
          fullName,
          email,
          password,
          role,
        )

        setMessage(
          text.accountCreated,
        )

        setMode('login')
        setPassword('')
      } else {
        const user = await loginUser(
          email,
          password,
        )

        onAuthenticated(user)
      }
    } catch (err) {
      setError(
        err.message ||
        text.genericError,
      )
    } finally {
      setLoading(false)
    }
  }


  const switchMode = () => {
    setMode(
      mode === 'login'
        ? 'register'
        : 'login',
    )

    setError('')
    setMessage('')
  }


  return (
    <div className="auth-page">

      <main className="auth-shell">

        {/* ----------------------------------------
            Visual Side
            ---------------------------------------- */}

        <section className="auth-visual-panel">

          <div className="auth-brand">
            <span className="auth-brand-mark">
              C
            </span>

            <span>
              Cognicare NER
            </span>
          </div>


          <div className="auth-visual-content">

            <AuthIllustration />

            <span className="auth-visual-eyebrow">
              Cognitive Care
            </span>

            <h2>
              A simpler way to care,
              <br />
              remember and stay connected.
            </h2>

            <p>
              Designed with gentle visuals,
              simple interactions and
              elderly-friendly accessibility
              in mind.
            </p>

          </div>

        </section>


        {/* ----------------------------------------
            Authentication Card
            ---------------------------------------- */}

        <section className="auth-card">

          <div className="auth-card-top">

            <div className="auth-mobile-brand">
              <span className="auth-mobile-brand-mark">
                C
              </span>

              <span>
                Cognicare NER
              </span>
            </div>


            <div className="auth-header">

              <span className="auth-eyebrow">
                {mode === 'login'
                  ? 'Welcome back'
                  : 'Get started'}
              </span>

              <h1>
                {mode === 'login'
                  ? 'Sign in'
                  : 'Create your account'}
              </h1>

              <p>
                {mode === 'login'
                  ? text.signInSubtitle
                  : text.createAccountSubtitle}
              </p>

            </div>


            <div className="auth-language">

              <LanguageSelector
                language={language}
                onChange={
                  handleLanguageChange
                }
                label={text.language}
              />

            </div>

          </div>


          {/* Messages */}

          {error && (
            <div
              className="auth-message auth-message--error"
              role="alert"
            >
              {error}
            </div>
          )}


          {message && (
            <div
              className="auth-message auth-message--success"
              role="status"
            >
              {message}
            </div>
          )}


          {/* Form */}

          <form
            className="auth-form"
            onSubmit={handleSubmit}
          >

            {mode === 'register' && (
              <label className="auth-field">

                <span>
                  {text.fullName}
                </span>

                <input
                  type="text"
                  value={fullName}
                  onChange={(event) =>
                    setFullName(
                      event.target.value,
                    )
                  }
                  placeholder={
                    text.fullNamePlaceholder
                  }
                  required
                  maxLength={200}
                  autoComplete="name"
                />

              </label>
            )}


            <label className="auth-field">

              <span>
                {text.email}
              </span>

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value,
                  )
                }
                placeholder={
                  text.emailPlaceholder
                }
                required
                autoComplete="email"
              />

            </label>


            <label className="auth-field">

              <span>
                {text.password}
              </span>

              <input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value,
                  )
                }
                placeholder={
                  text.passwordPlaceholder
                }
                required
                minLength={8}
                maxLength={128}
                autoComplete={
                  mode === 'login'
                    ? 'current-password'
                    : 'new-password'
                }
              />

            </label>


            {mode === 'register' && (
              <label className="auth-field">

                <span>
                  {text.accountType}
                </span>

                <select
                  value={role}
                  onChange={(event) =>
                    setRole(
                      event.target.value,
                    )
                  }
                >
                  <option value="elderly">
                    {text.elderlyUser}
                  </option>

                  <option value="caregiver">
                    {text.caregiver}
                  </option>
                </select>

              </label>
            )}


            <button
              type="submit"
              className="auth-submit-button"
              disabled={loading}
            >
              {loading
                ? text.pleaseWait
                : mode === 'login'
                  ? text.signIn
                  : text.createAccount}
            </button>

          </form>


          <div className="auth-divider">
            <span />
            <span>or</span>
            <span />
          </div>


          <button
            type="button"
            className="auth-switch-button"
            onClick={switchMode}
          >
            {mode === 'login'
              ? text.createAccountPrompt
              : text.signInPrompt}
          </button>


          <p className="auth-footer-note">
            Cognicare NER
          </p>

        </section>

      </main>

    </div>
  )
}


export default AuthPage