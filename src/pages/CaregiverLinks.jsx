import { useEffect, useState } from 'react'

import './CaregiverLinks.css'
import VoiceReadAloud from '../Components/VoiceReadAloud'

import {
  apiDelete,
  apiGet,
  apiPost,
  apiPut,
} from '../utils/api'

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


  return (
    <div className="caregiver-links-page">

      {/* Header */}
      <header className="caregiver-links-header">

        <button
          type="button"
          className="caregiver-links-back-button"
          onClick={onBack}
        >
          ← {text.backToDashboard}
        </button>


        <div className="caregiver-links-title-area">

          <div className="caregiver-links-icon">
            🤝
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


      {/* Messages */}
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


      {/* Caregiver: Send Request */}
      {isCaregiver && (
        <section className="caregiver-links-card">

          <div className="caregiver-links-card-heading">

            <div className="caregiver-links-card-icon">
              ✉️
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


      {/* Connection list */}
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
          </div>

          <button
            type="button"
            className="caregiver-links-refresh-button"
            onClick={loadLinks}
            disabled={loading}
          >
            {loading
              ? text.loading
              : text.refresh}
          </button>

        </div>


        {loading && (
          <div className="caregiver-links-empty">

            <div className="caregiver-links-empty-icon">
              ⏳
            </div>

            <p>
              {text.loadingConnections}
            </p>

          </div>
        )}


        {!loading &&
          links.length === 0 && (
            <div className="caregiver-links-empty">

              <div className="caregiver-links-empty-icon">
                {isCaregiver
                  ? '🤝'
                  : '📩'}
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
                  className="caregiver-links-item"
                >

                  <div className="caregiver-links-item-main">

                    <div className="caregiver-links-item-icon">
                      {link.status === 'approved'
                        ? '✅'
                        : link.status === 'pending'
                          ? '🕐'
                          : '↩️'}
                    </div>


                    <div>

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

                      <p>
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
                        <>
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
                        </>
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


      {/* Information */}
      <section className="caregiver-links-info">

        <div className="caregiver-links-info-icon">
          🔐
        </div>

        <div>
          <h3>
            {text.dataProtected}
          </h3>

          <p>
            {text.dataProtectedDescription}
          </p>
        </div>

      </section>

    </div>
  )
}


export default CaregiverLinks