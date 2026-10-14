import { useState, useEffect, useCallback } from 'react'
import { apiGet, apiPost } from '../utils/api'
import './MedicationDashboardCard.css'

export default function MedicationDashboardCard({
  text = {},
  onOpenMedications,
  onAddMedicine,
  onDoseTaken,
}) {
  const [summary, setSummary] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [feedback, setFeedback] = useState('')

  const ui = text.medicationsPage || {}

  const fetchSummary = useCallback(async () => {
    try {
      const res = await apiGet('/medications/today')
      setSummary(res)
    } catch (err) {
      console.debug('Could not load today medication summary for dashboard:', err)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchSummary()
    }, 0)
    const interval = setInterval(fetchSummary, 30000)
    return () => {
      window.clearTimeout(timer)
      clearInterval(interval)
    }
  }, [fetchSummary])

  const handleQuickMarkTaken = async (e, dose) => {
    e.stopPropagation()
    if (!dose || actionLoading) return

    try {
      setActionLoading(true)
      await apiPost(`/medications/${dose.medication_id}/taken`, {
        scheduled_time: dose.scheduled_datetime,
        time: dose.time,
      })
      setFeedback(`✓ ${dose.name} marked as taken`)
      setTimeout(() => setFeedback(''), 3500)
      await fetchSummary()
      if (onDoseTaken) onDoseTaken()
    } catch (err) {
      console.error('Quick mark taken failed:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const nextDose = summary?.next_dose || null
  const pendingCount = summary?.pending_doses ?? 0
  const totalCount = summary?.total_doses ?? 0
  const takenCount = summary?.taken_doses ?? 0

  return (
    <article
      className="card med-dashboard-card"
      onClick={onOpenMedications}
      tabIndex={0}
      role="region"
      aria-label={text.medications || 'Medication Reminders'}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onOpenMedications()
        }
      }}
    >
      <div className="card-visual">
        <img
          src="/illustrations/medications.svg"
          alt=""
          className="card-illustration"
        />
      </div>

      <div className="med-dash-header-row">
        <h2 className="card-title">
          {text.medications || 'Medications'}
        </h2>
        {pendingCount > 0 ? (
          <span className="med-dash-pending-badge">
            {pendingCount} {ui.pendingBadge || 'Pending'}
          </span>
        ) : (
          <span className="med-dash-completed-badge">
            ✓ {ui.allDosesTaken || 'All Doses Taken'}
          </span>
        )}
      </div>

      <p className="card-description">
        {text.medicationsDescription || 'Keep track of daily medicines, schedules, and alerts.'}
      </p>

      {/* Progress & Next Dose Snapshot */}
      <div className="med-dash-snapshot">
        <div className="med-dash-stats-bar">
          <div className="med-dash-stat-item">
            <span className="med-dash-stat-label">{text.todaysMedications || "Today's Schedule"}</span>
            <span className="med-dash-stat-value">
              <strong>{takenCount}</strong> / {totalCount} {ui.doses || 'doses'}
            </span>
          </div>

          <div className="med-dash-adherence-pill">
            {summary ? `${summary.adherence_percentage}% ${ui.adherence || 'Adherence'}` : '...'}
          </div>
        </div>

        {/* Next Upcoming Reminder */}
        {nextDose ? (
          <div className="med-dash-next-reminder" onClick={(e) => e.stopPropagation()}>
            <div className="med-dash-next-info">
              <span className="med-dash-next-label">
                ⏰ {text.nextReminder || 'Next Reminder'}:
              </span>
              <div className="med-dash-next-title">
                <strong>{nextDose.name}</strong> ({nextDose.dosage})
              </div>
              <div className="med-dash-next-sub">
                <span className="med-dash-time-tag">at {nextDose.time}</span>
                <span className="med-dash-food-tag">{nextDose.food_timing || 'As directed'}</span>
              </div>
            </div>

            <button
              type="button"
              className="med-dash-quick-taken-btn"
              onClick={(e) => handleQuickMarkTaken(e, nextDose)}
              disabled={actionLoading}
              title={`Mark ${nextDose.name} as taken`}
            >
              ✓ {text.markAsTaken || 'Mark as Taken'}
            </button>
          </div>
        ) : totalCount > 0 ? (
          <div className="med-dash-all-done-banner">
            <span aria-hidden="true">🎉</span>
            <span>{ui.noMoreDosesToday || 'All scheduled doses for today are completed!'}</span>
          </div>
        ) : (
          <div className="med-dash-empty-banner">
            <span>💊 {ui.noMedicinesScheduled || 'No medicines scheduled for today.'}</span>
          </div>
        )}
      </div>

      {feedback && (
        <div className="med-dash-feedback" role="status">
          {feedback}
        </div>
      )}

      {/* Quick Action Buttons Row */}
      <div className="med-dash-actions-row" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="card-button med-dash-open-btn"
          onClick={onOpenMedications}
        >
          {text.openMedications || 'Open Medications'}
        </button>

        <button
          type="button"
          className="med-dash-add-quick-btn"
          onClick={(e) => {
            e.stopPropagation()
            if (onAddMedicine) onAddMedicine()
          }}
          title={text.addMedicine || 'Add Medicine'}
        >
          + {text.addMedicine || 'Add Medicine'}
        </button>
      </div>
    </article>
  )
}
