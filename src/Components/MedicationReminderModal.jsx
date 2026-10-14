import { useState, useEffect, useRef } from 'react'
import './MedicationReminderModal.css'

// Gentle elder-friendly audio chime synthesized via Web Audio API
function playGentleChime() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) return
    const ctx = new AudioContextClass()

    const now = ctx.currentTime
    const osc1 = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    const gainNode = ctx.createGain()

    // Harmonic soft chime (D5 and A5)
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(587.33, now) // D5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.3) // A5

    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(880, now + 0.15) // A5

    gainNode.gain.setValueAtTime(0, now)
    gainNode.gain.linearRampToValueAtTime(0.18, now + 0.08)
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 1.2)

    osc1.connect(gainNode)
    osc2.connect(gainNode)
    gainNode.connect(ctx.destination)

    osc1.start(now)
    osc2.start(now + 0.1)
    osc1.stop(now + 1.2)
    osc2.stop(now + 1.2)
  } catch {
    // Ignore audio autoplay restrictions gracefully
  }
}

function showSystemNotification(dose, language = 'en-IN') {
  if (typeof window === 'undefined' || !('Notification' in window)) return false
  if (Notification.permission !== 'granted') return false

  const title = `💊 Medication Due: ${dose.name} (${dose.dosage})`
  const body = `${dose.food_timing ? dose.food_timing + ' • ' : ''}${dose.purpose || 'Time to take your scheduled dose.'}`

  try {
    const notif = new Notification(title, {
      body,
      icon: '/favicon.svg',
      lang: language,
      tag: `med-reminder-${dose.medication_id}-${dose.time}`,
      renotify: true,
      requireInteraction: true,
    })
    notif.onclick = () => {
      window.focus()
      notif.close()
    }
    return true
  } catch {
    return false
  }
}

function speakDosePrompt(dose, language = 'en-IN') {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  try {
    window.speechSynthesis.cancel()
    const text = `Time to take your medicine. ${dose.name}, ${dose.dosage}. ${dose.food_timing || ''}.`
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = language
    utterance.rate = 0.88
    utterance.pitch = 1
    window.speechSynthesis.speak(utterance)
  } catch {
    // Graceful fallback
  }
}

export default function MedicationReminderModal({
  dose,
  text,
  language = 'en-IN',
  onMarkTaken,
  onSnooze,
  onSkip,
  onClose,
}) {
  const [selectedMinutes, setSelectedMinutes] = useState(10)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSnoozePicker, setShowSnoozePicker] = useState(false)
  const hasAlertedRef = useRef(false)

  const ui = text?.medicationsPage || {}

  useEffect(() => {
    if (!dose || hasAlertedRef.current) return
    hasAlertedRef.current = true

    // Trigger gentle sound & notification
    playGentleChime()
    showSystemNotification(dose, language)
    speakDosePrompt(dose, language)
  }, [dose, language])

  if (!dose) return null

  const handleTaken = async () => {
    try {
      setIsSubmitting(true)
      await onMarkTaken(dose)
    } finally {
      setIsSubmitting(false)
      onClose()
    }
  }

  const handleSnooze = async (minutes) => {
    try {
      setIsSubmitting(true)
      await onSnooze(dose, minutes)
    } finally {
      setIsSubmitting(false)
      onClose()
    }
  }

  const handleSkip = async () => {
    try {
      setIsSubmitting(true)
      await onSkip(dose)
    } finally {
      setIsSubmitting(false)
      onClose()
    }
  }

  return (
    <div className="med-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="med-reminder-title">
      <div className="med-modal-container">
        <header className="med-modal-header">
          <div className="med-modal-icon-badge" aria-hidden="true">
            💊
          </div>
          <div>
            <span className="med-modal-eyebrow">{ui.popupTitle || 'Medication Reminder Due'}</span>
            <h2 id="med-reminder-title" className="med-modal-title">
              {dose.name}
            </h2>
          </div>
        </header>

        <div className="med-modal-body">
          <div className="med-modal-details-grid">
            <div className="med-modal-detail-card">
              <span className="med-modal-label">{ui.formDosage || 'Dosage'}</span>
              <strong className="med-modal-value">{dose.dosage}</strong>
            </div>

            <div className="med-modal-detail-card">
              <span className="med-modal-label">{ui.scheduledTime || 'Scheduled Time'}</span>
              <strong className="med-modal-value">⏰ {dose.time}</strong>
            </div>

            <div className="med-modal-detail-card med-modal-detail-card--highlight">
              <span className="med-modal-label">{ui.formFoodTiming || 'Food Timing'}</span>
              <strong className="med-modal-value">
                {ui.foodTimings?.[dose.food_timing] || dose.food_timing || 'No Preference'}
              </strong>
            </div>

            {dose.medicine_type && (
              <div className="med-modal-detail-card">
                <span className="med-modal-label">{ui.formType || 'Medicine Type'}</span>
                <strong className="med-modal-value">
                  {ui.types?.[dose.medicine_type] || dose.medicine_type}
                </strong>
              </div>
            )}
          </div>

          {dose.purpose && (
            <div className="med-modal-purpose-banner">
              <span className="med-modal-purpose-icon">💡</span>
              <p>
                <strong>{ui.formPurpose || 'Purpose'}:</strong> {dose.purpose}
              </p>
            </div>
          )}

          <p className="med-modal-gentle-tip">
            {ui.popupSubtitle || 'Please take your prescribed dose with water.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="med-modal-actions">
          <button
            type="button"
            className="med-btn med-btn--take"
            onClick={handleTaken}
            disabled={isSubmitting}
            autoFocus
          >
            <span aria-hidden="true">✓</span> {ui.quickMarkTaken || 'Mark as Taken'}
          </button>

          {!showSnoozePicker ? (
            <button
              type="button"
              className="med-btn med-btn--snooze"
              onClick={() => setShowSnoozePicker(true)}
              disabled={isSubmitting}
            >
              <span aria-hidden="true">⏰</span> {ui.quickSnooze || 'Remind Me Later'}
            </button>
          ) : (
            <div className="med-snooze-options-row">
              <span className="med-snooze-label">{ui.snoozeOptions || 'Snooze for:'}</span>
              <div className="med-snooze-chips">
                <button
                  type="button"
                  className={`med-snooze-chip ${selectedMinutes === 5 ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedMinutes(5)
                    handleSnooze(5)
                  }}
                  disabled={isSubmitting}
                >
                  {ui.minutes5 || '5 Min'}
                </button>
                <button
                  type="button"
                  className={`med-snooze-chip ${selectedMinutes === 10 ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedMinutes(10)
                    handleSnooze(10)
                  }}
                  disabled={isSubmitting}
                >
                  {ui.minutes10 || '10 Min'}
                </button>
                <button
                  type="button"
                  className={`med-snooze-chip ${selectedMinutes === 30 ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedMinutes(30)
                    handleSnooze(30)
                  }}
                  disabled={isSubmitting}
                >
                  {ui.minutes30 || '30 Min'}
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            className="med-btn med-btn--skip"
            onClick={handleSkip}
            disabled={isSubmitting}
          >
            {ui.quickSkip || 'Skip Dose'}
          </button>
        </div>
      </div>
    </div>
  )
}
