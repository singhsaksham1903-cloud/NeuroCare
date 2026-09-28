import { useEffect, useState } from 'react'

import './CaregiverLinks.css'
import VoiceReadAloud from '../Components/VoiceReadAloud'

import {
  apiDelete,
  apiGet,
  apiPost,
  apiPut,
} from '../utils/api'


/* --------------------------------------------
   Connection Icons
   -------------------------------------------- */

function ConnectionIcon({ type = 'connection' }) {
  if (type === 'mail') {
    return (
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect
          x="10"
          y="15"
          width="44"
          height="34"
          rx="7"
          stroke="currentColor"
          strokeWidth="4"
        />

        <path
          d="M12 20L32 36L52 20"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  if (type === 'approved') {
    return (
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle
          cx="32"
          cy="32"
          r="22"
          stroke="currentColor"
          strokeWidth="4"
        />

        <path
          d="M21 32.5L28 39L43 24"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  if (type === 'pending') {
    return (
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle
          cx="32"
          cy="32"
          r="22"
          stroke="currentColor"
          strokeWidth="4"
        />

        <path
          d="M32 20V32L40 38"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  if (type === 'rejected') {
    return (
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle
          cx="32"
          cy="32"
          r="22"
          stroke="currentColor"
          strokeWidth="4"
        />

        <path
          d="M24 24L40 40"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
        />

        <path
          d="M40 24L24 40"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
    )
  }

  if (type === 'shield') {
    return (
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M32 9L50 16V29C50 41 42.5 50.5 32 55C21.5 50.5 14 41 14 29V16L32 9Z"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinejoin="round"
        />

        <path
          d="M23 32L29 38L42 24"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle
        cx="23"
        cy="23"
        r="8"
        stroke="currentColor"
        strokeWidth="4"
      />

      <circle
        cx="41"
        cy="41"
        r="8"
        stroke="currentColor"
        strokeWidth="4"
      />

      <path
        d="M29 29L35 35"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />

      <path
        d="M17 33C13 34 10 37 10 42"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />

      <path
        d="M47 31C50 33 52 36 52 40"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  )
}


function CaregiverLinks({
  user,
  onBack,
  text,
  language = 'en-IN',
  readAloudLabel = 'Read Aloud',
  stopReadingLabel = 'Stop Reading',
}) {
  const [links, setLinks] = useState([])

  const [elderlyEmail, setElderlyEmail] =
    useState('')

  const [loading, setLoading] =
    useState(true)

  const [submitting, setSubmitting] =
    useState(false)

  const [error, setError] =
    useState('')

  const [success, setSuccess] =
    useState('')


  const isCaregiver =
    user?.role === 'caregiver'

  const isElderly =
    user?.role === 'elderly'


  /* --------------------------------------------
     Load connections
     -------------------------------------------- */

  const loadLinks = async () => {
    try {
      setLoading(true)
      setError('')

      const data = await apiGet(
        '/caregiver-links',
      )

      setLinks(
        Array.isArray(data)
          ? data
          : [],
      )
    } catch (err) {
      setError(
        err.message ||
        text.loadError,
      )
    } finally {
      setLoading(false)
    }
  }


  useEffect(() => {
    loadLinks()
  }, [])


  /* --------------------------------------------
     Send request
     -------------------------------------------- */

  const handleSendRequest = async (
    event,
  ) => {
    event.preventDefault()

    const trimmedEmail =
      elderlyEmail.trim()

    if (!trimmedEmail) {
      setError(
        text.emailValidation,
      )
      setSuccess('')
      return
    }

    try {
      setSubmitting(true)
      setError('')
      setSuccess('')

      await apiPost(
        '/caregiver-links',
        {
          elderly_email:
            trimmedEmail,
        },
      )

      setElderlyEmail('')

      setSuccess(
        text.requestSent,
      )

      await loadLinks()
    } catch (err) {
      setError(
        err.message ||
        text.sendError,
      )
    } finally {
      setSubmitting(false)
    }
  }


  /* --------------------------------------------
     Approve / reject request
     -------------------------------------------- */

  const handleDecision = async (
    linkId,
    status,
  ) => {
    try {
      setSubmitting(true)
      setError('')
      setSuccess('')

      await apiPut(
        `/caregiver-links/${linkId}`,
        {
          status,
        },
      )

      setSuccess(
        status === 'approved'
          ? text.requestApproved
          : text.requestRejected,
      )

      await loadLinks()
    } catch (err) {
      setError(
        err.message ||
        text.updateError,
      )
    } finally {
      setSubmitting(false)
    }
  }


  /* --------------------------------------------
     Remove connection
     -------------------------------------------- */

  const handleDelete = async (
    linkId,
  ) => {
    try {
      setSubmitting(true)
      setError('')
      setSuccess('')

      await apiDelete(
        `/caregiver-links/${linkId}`,
      )

      setSuccess(
        text.connectionRemoved,
      )

      await loadLinks()
    } catch (err) {
      setError(
        err.message ||
        text.removeError,
      )
    } finally {
      setSubmitting(false)
    }
  }


  /* --------------------------------------------
     Status helpers
     -------------------------------------------- */

  const getStatusLabel = (
    status,
  ) => {
    if (status === 'approved') {
      return text.statusApproved
    }

    if (status === 'rejected') {
      return text.statusRejected
    }

    return text.statusPending
  }


  const getStatusDescription = (
    status,
    link,
  ) => {
    if (status === 'approved') {
      return isCaregiver
        ? `${text.connectedWith} ${link.elderly_name}.`
        : `${link.caregiver_name} ${text.connectedToYourAccount}`
    }

    if (status === 'rejected') {
      return isCaregiver
        ? `${link.elderly_name} ${text.rejectedRequest}`
        : `${text.youRejected} ${link.caregiver_name}'s ${text.request}`
    }

    return isCaregiver
      ? `${text.waitingFor} ${link.elderly_name} ${text.toRespond}.`
      : `${link.caregiver_name} ${text.requestingToConnect}`
  }


  const getStatusIconType = (
    status,
  ) => {
    if (status === 'approved') {
      return 'approved'
    }

    if (status === 'rejected') {
      return 'rejected'
    }

    return 'pending'
  }


  return (
    <div className="caregiver-links-page">

      {/* ----------------------------------------
          Header
          ---------------------------------------- */}

      <header className="caregiver-links-header">

        <button
          type="button"
          className="caregiver-links-back-button"
          onClick={onBack}
        >
          <span
            className="caregiver-links-back-icon"
            aria-hidden="true"
          >
            ←
          </span>

          {text.backToDashboard}
        </button>


        <div className="caregiver-links-title-area">

          <div
            className="caregiver-links-icon"
            aria-hidden="true"
          >
            <ConnectionIcon />
          </div>


          <div>

            <span className="caregiver-links-eyebrow">
              {text.connections}
            </span>

            <h1>
              {isCaregiver
                ? text.caregiverConnections
                : text.caregiverRequests}
            </h1>

            <p>
              {isCaregiver
                ? text.caregiverConnectionsDescription
                : text.caregiverRequestsDescription}
            </p>

            <VoiceReadAloud
              text={
                isCaregiver
                  ? `${text.caregiverConnections}. ${text.caregiverConnectionsDescription}`
                  : `${text.caregiverRequests}. ${text.caregiverRequestsDescription}`
              }
              language={language}
              label={readAloudLabel}
              stopLabel={stopReadingLabel}
            />

          </div>

        </div>

      </header>


      {/* ----------------------------------------
          Messages
          ---------------------------------------- */}

      {error && (
        <div
          className="caregiver-links-message caregiver-links-message--error"
          role="alert"
        >
          {error}
        </div>
      )}


      {success && (
        <div
          className="caregiver-links-message caregiver-links-message--success"
          role="status"
        >
          {success}
        </div>
      )}


      <main className="caregiver-links-content">

        {/* ----------------------------------------
            Caregiver: Send Request
            ---------------------------------------- */}

        {isCaregiver && (
          <section className="caregiver-links-card">

            <div className="caregiver-links-card-heading">

              <div
                className="caregiver-links-card-icon caregiver-links-card-icon--rose"
                aria-hidden="true"
              >
                <ConnectionIcon type="mail" />
              </div>

              <div>
                <span className="caregiver-links-section-label">
                  {text.newConnection}
                </span>

                <h2>
                  {text.connectWithElderly}
                </h2>

                <p>
                  {text.connectWithElderlyDescription}
                </p>
              </div>

            </div>


            <form
              className="caregiver-links-form"
              onSubmit={handleSendRequest}
            >

              <label
                htmlFor="elderly-email"
                className="caregiver-links-label"
              >
                {text.elderlyUserEmail}
              </label>


              <div className="caregiver-links-form-row">

                <input
                  id="elderly-email"
                  type="email"
                  value={elderlyEmail}
                  onChange={(event) =>
                    setElderlyEmail(
                      event.target.value,
                    )
                  }
                  placeholder="elderly@example.com"
                  className="caregiver-links-input"
                  disabled={submitting}
                />


                <button
                  type="submit"
                  className="caregiver-links-primary-button"
                  disabled={submitting}
                >
                  {submitting
                    ? text.sending
                    : text.sendRequest}
                </button>

              </div>

            </form>

          </section>
        )}


        {/* ----------------------------------------
            Connection List
            ---------------------------------------- */}

        <section className="caregiver-links-card">

          <div className="caregiver-links-list-heading">

            <div>
              <span className="caregiver-links-section-label">
                {isCaregiver
                  ? text.yourRequests
                  : text.incomingRequests}
              </span>

              <h2>
                {text.connectionStatus}
              </h2>

              <p>
                {isCaregiver
                  ? text.caregiverConnectionsDescription
                  : text.caregiverRequestsDescription}
              </p>
            </div>


            <button
              type="button"
              className="caregiver-links-refresh-button"
              onClick={loadLinks}
              disabled={loading}
            >
              <span
                className="caregiver-links-refresh-icon"
                aria-hidden="true"
              >
                ↻
              </span>

              {loading
                ? text.loading
                : text.refresh}
            </button>

          </div>


          {loading && (
            <div className="caregiver-links-empty">

              <div
                className="caregiver-links-empty-icon"
                aria-hidden="true"
              >
                <ConnectionIcon type="pending" />
              </div>

              <h3>
                {text.loadingConnections}
              </h3>

              <p>
                Please wait while your connections are loaded.
              </p>

            </div>
          )}


          {!loading &&
            links.length === 0 && (
              <div className="caregiver-links-empty">

                <div
                  className="caregiver-links-empty-icon"
                  aria-hidden="true"
                >
                  <ConnectionIcon />
                </div>

                <h3>
                  {isCaregiver
                    ? text.noCaregiverConnections
                    : text.noCaregiverRequests}
                </h3>

                <p>
                  {isCaregiver
                    ? text.noConnectionsDescription
                    : text.noRequestsDescription}
                </p>

              </div>
            )}


          {!loading &&
            links.length > 0 && (
              <div className="caregiver-links-list">

                {links.map((link) => (
                  <article
                    key={link.id}
                    className={`caregiver-links-item caregiver-links-item--${link.status}`}
                  >

                    <div className="caregiver-links-item-main">

                      <div
                        className="caregiver-links-item-icon"
                        aria-hidden="true"
                      >
                        <ConnectionIcon
                          type={
                            getStatusIconType(
                              link.status,
                            )
                          }
                        />
                      </div>


                      <div className="caregiver-links-item-details">

                        <span className="caregiver-links-item-title">
                          {isCaregiver
                            ? link.elderly_name
                            : link.caregiver_name}
                        </span>


                        <p>
                          {
                            getStatusDescription(
                              link.status,
                              link,
                            )
                          }
                        </p>


                        <p className="caregiver-links-email">
                          <strong>
                            {text.email}:
                          </strong>{' '}

                          {isCaregiver
                            ? link.elderly_email
                            : link.caregiver_email}
                        </p>

                      </div>

                    </div>


                    <div className="caregiver-links-item-actions">

                      <span
                        className={`caregiver-links-status caregiver-links-status--${link.status}`}
                      >
                        {getStatusLabel(
                          link.status,
                        )}
                      </span>


                      {isElderly &&
                        link.status ===
                        'pending' && (
                          <div className="caregiver-links-decision-actions">

                            <button
                              type="button"
                              className="caregiver-links-approve-button"
                              onClick={() =>
                                handleDecision(
                                  link.id,
                                  'approved',
                                )
                              }
                              disabled={submitting}
                            >
                              {text.approve}
                            </button>

                            <button
                              type="button"
                              className="caregiver-links-reject-button"
                              onClick={() =>
                                handleDecision(
                                  link.id,
                                  'rejected',
                                )
                              }
                              disabled={submitting}
                            >
                              {text.reject}
                            </button>

                          </div>
                        )}


                      {(link.status ===
                        'approved' ||
                        link.status ===
                        'rejected') && (
                          <button
                            type="button"
                            className="caregiver-links-remove-button"
                            onClick={() =>
                              handleDelete(
                                link.id,
                              )
                            }
                            disabled={submitting}
                          >
                            {text.remove}
                          </button>
                        )}

                    </div>

                  </article>
                ))}

              </div>
            )}

        </section>


        {/* ----------------------------------------
            Privacy Information
            ---------------------------------------- */}

        <section className="caregiver-links-info">

          <div
            className="caregiver-links-info-icon"
            aria-hidden="true"
          >
            <ConnectionIcon type="shield" />
          </div>


          <div>

            <span className="caregiver-links-info-label">
              Privacy
            </span>

            <h3>
              {text.dataProtected}
            </h3>

            <p>
              {text.dataProtectedDescription}
            </p>

          </div>

        </section>

      </main>

    </div>
  )
}


export default CaregiverLinks