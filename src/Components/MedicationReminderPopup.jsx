import { useState, useEffect, useRef, useCallback } from 'react'
import { apiGet, apiPost } from '../utils/api'
import VoiceReadAloud from './VoiceReadAloud'
import './MedicationReminderPopup.css'

// Gentle 2-tone melodic chime via Web Audio API
function playGentleChime() {
  if (typeof window === 'undefined') return
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
    }

    const now = ctx.currentTime

    // Tone 1: C5 (523.25 Hz)
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(523.25, now)
    gain1.gain.setValueAtTime(0, now)
    gain1.gain.linearRampToValueAtTime(0.18, now + 0.05)
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(now)
    osc1.stop(now + 0.6)

    // Tone 2: E5 (659.25 Hz) slightly delayed for a pleasant harmonized chime
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(659.25, now + 0.18)
    gain2.gain.setValueAtTime(0, now + 0.18)
    gain2.gain.linearRampToValueAtTime(0.2, now + 0.23)
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.9)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(now + 0.18)
    osc2.stop(now + 0.9)
  } catch (err) {
    // Audio synthesis is non-critical fallback
    console.debug('Gentle chime skipped:', err)
  }
}

// Browser notification helper
async function showBrowserNotification(dose, language) {
  if (typeof window === 'undefined' || !('Notification' in window)) return false
  if (Notification.permission !== 'granted') return false

  const title = `💊 Time for ${dose.name} (${dose.dosage})`
  const body = `Scheduled: ${dose.time} • ${dose.food_timing || 'As directed'}${dose.purpose ? ` • ${dose.purpose}` : ''}`
  const tag = `med-reminder-${dose.medication_id}-${dose.time}`

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration()
      if (reg) {
        await reg.showNotification(title, {
          body,
          icon: '/favicon.svg',
          tag,
          renotify: true,
          requireInteraction: true,
          lang: language || 'en-IN',
        })
        return true
      }
    }
  } catch {
    // Fall back to standard Notification
  }

  try {
    const notif = new Notification(title, {
      body,
      icon: '/favicon.svg',
      tag,
      renotify: true,
      lang: language || 'en-IN',
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

export default function MedicationReminderPopup({
  user,
  language = 'en-IN',
  text = {},
  onDoseUpdated,
}) {
  const [activeDose, setActiveDose] = useState(null)
  const [snoozeOpen, setSnoozeOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const notifiedSetRef = useRef(new Set())
  const lastCheckMinuteRef = useRef('')

  const ui = text.medicationsPage || {}

  // Check today's doses against current local time
  const checkForDueDoses = useCallback(async () => {
    if (!user || user.role !== 'elderly') return

    try {
      const res = await apiGet('/medications/today')
      if (!res || !Array.isArray(res.doses)) return

      const now = new Date()
      const currentHours = String(now.getHours()).padStart(2, '0')
      const currentMins = String(now.getMinutes()).padStart(2, '0')
      const currentTimeStr = `${currentHours}:${currentMins}`
      const currentMinuteKey = `${now.toISOString().split('T')[0]}_${currentTimeStr}`

      if (lastCheckMinuteRef.current === currentMinuteKey && activeDose) {
        return
      }
      lastCheckMinuteRef.current = currentMinuteKey

      // Find doses that are due now (within the past 20 minutes) and still pending or snoozed
      const nowTotalMins = now.getHours() * 60 + now.getMinutes()

      for (const dose of res.doses) {
        if (dose.status !== 'pending' && dose.status !== 'snoozed') continue

        const [doseH, doseM] = (dose.time || '00:00').split(':').map(Number)
        const doseTotalMins = doseH * 60 + doseM
        const diffMins = nowTotalMins - doseTotalMins

        // Trigger if current time is equal to or within 20 mins after scheduled time
        if (diffMins >= 0 && diffMins <= 20) {
          const doseKey = `${dose.medication_id}_${dose.time}_${now.toISOString().split('T')[0]}`

          if (!notifiedSetRef.current.has(doseKey)) {
            notifiedSetRef.current.add(doseKey)
            setActiveDose(dose)
            setSnoozeOpen(false)

            // 1. Play gentle audio chime
            playGentleChime()

            // 2. Trigger browser notification
            showBrowserNotification(dose, language)

            break
          }
        }
      }
    } catch (err) {
      console.debug('Error checking medication schedule:', err)
    }
  }, [user, activeDose, language])

  useEffect(() => {
    // Initial check on mount
    const timer = setTimeout(() => {
      void checkForDueDoses()
    }, 1500)
    // Recurring periodic check every 15 seconds
    const interval = setInterval(() => {
      void checkForDueDoses()
    }, 15000)

    return () => {
      clearTimeout(timer)
      clearInterval(interval)
    }
  }, [checkForDueDoses])

  const handleMarkTaken = async () => {
    if (!activeDose) return
    try {
      setActionLoading(true)
      await apiPost(`/medications/${activeDose.medication_id}/taken`, {
        scheduled_time: activeDose.scheduled_datetime,
        time: activeDose.time,
      })
      setActiveDose(null)
      if (onDoseUpdated) onDoseUpdated()
    } catch (err) {
      console.error('Failed to mark taken:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleSkip = async () => {
    if (!activeDose) return
    try {
      setActionLoading(true)
      await apiPost(`/medications/${activeDose.medication_id}/skip`, {
        scheduled_time: activeDose.scheduled_datetime,
        time: activeDose.time,
        reason: 'Skipped from alert popup',
      })
      setActiveDose(null)
      if (onDoseUpdated) onDoseUpdated()
    } catch (err) {
      console.error('Failed to skip dose:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleSnooze = async (minutes) => {
    if (!activeDose) return
    try {
      setActionLoading(true)
      await apiPost(`/medications/${activeDose.medication_id}/snooze`, {
        scheduled_time: activeDose.scheduled_datetime,
        time: activeDose.time,
        minutes,
      })
      setActiveDose(null)
      if (onDoseUpdated) onDoseUpdated()
    } catch (err) {
      console.error('Failed to snooze dose:', err)
    } finally {
      setActionLoading(false)
    }
  }

  if (!activeDose) return null

  const speechText = `
    Medication reminder. It is time to take ${activeDose.name}, ${activeDose.dosage}. 
    Instruction: ${activeDose.food_timing || 'As directed'}.
  `

  return (
    <div
      className="med-alert-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="med-alert-title"
    >
      <div className="med-alert-card">
        {/* Header with pill icon and read aloud */}
        <div className="med-alert-top">
          <div className="med-alert-badge">
            <span className="med-alert-icon" aria-hidden="true">🔔</span>
            <span className="med-alert-label">
              {ui.reminderDue || 'Medication Reminder Due'}
            </span>
          </div>

          <VoiceReadAloud
            text={speechText}
            language={language}
            label={text.readAloud || 'Read Aloud'}
            stopLabel={text.stopReading || 'Stop Reading'}
          />
        </div>

        {/* Medicine Details Card */}
        <div className="med-alert-body">
          <div className="med-alert-avatar" aria-hidden="true">
            💊
          </div>
          <div className="med-alert-details">
            <h2 id="med-alert-title" className="med-alert-name">
              {activeDose.name}
            </h2>
            <div className="med-alert-meta-row">
              <span className="med-alert-dosage">
                {activeDose.dosage}
              </span>
              <span className="med-alert-type">
                {activeDose.medicine_type || 'Tablet'}
              </span>
              <span className="med-alert-time">
                ⏰ {activeDose.time}
              </span>
            </div>

            {/* Food Instruction */}
            <div className="med-alert-instruction">
              <span className="med-alert-inst-icon" aria-hidden="true">🍽️</span>
              <strong>{activeDose.food_timing || 'No Food Restriction'}</strong>
            </div>

            {activeDose.purpose && (
              <p className="med-alert-purpose">
                <em>{activeDose.purpose}</em>
              </p>
            )}
          </div>
        </div>

        {/* Actions Grid */}
        <div className="med-alert-actions">
          {/* Primary: Mark as Taken */}
          <button
            type="button"
            className="med-alert-btn med-alert-btn--taken"
            onClick={handleMarkTaken}
            disabled={actionLoading}
            autoFocus
          >
            <span aria-hidden="true">✓</span> {ui.markAsTaken || 'Mark as Taken'}
          </button>

          {/* Remind Me Later (Snooze) */}
          <div className="med-alert-snooze-wrapper">
            {!snoozeOpen ? (
              <button
                type="button"
                className="med-alert-btn med-alert-btn--snooze"
                onClick={() => setSnoozeOpen(true)}
                disabled={actionLoading}
              >
                <span aria-hidden="true">⏰</span> {ui.remindMeLater || 'Remind Me Later'}
              </button>
            ) : (
              <div className="med-alert-snooze-options">
                <span className="med-alert-snooze-label">{ui.snoozePrompt || 'Snooze for:'}</span>
                <div className="med-alert-snooze-btns">
                  <button
                    type="button"
                    className="med-alert-snooze-opt"
                    onClick={() => handleSnooze(5)}
                    disabled={actionLoading}
                  >
                    5 min
                  </button>
                  <button
                    type="button"
                    className="med-alert-snooze-opt"
                    onClick={() => handleSnooze(10)}
                    disabled={actionLoading}
                  >
                    10 min
                  </button>
                  <button
                    type="button"
                    className="med-alert-snooze-opt"
                    onClick={() => handleSnooze(30)}
                    disabled={actionLoading}
                  >
                    30 min
                  </button>
                  <button
                    type="button"
                    className="med-alert-snooze-cancel"
                    onClick={() => setSnoozeOpen(false)}
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Skip Dose */}
          <button
            type="button"
            className="med-alert-btn med-alert-btn--skip"
            onClick={handleSkip}
            disabled={actionLoading}
          >
            {ui.skipDose || 'Skip Dose'}
          </button>
        </div>
      </div>
    </div>
  )
}
