import { useState, useEffect, useCallback, useId } from 'react'
import { apiGet, apiPost, apiPut, apiDelete } from '../utils/api'
import VoiceReadAloud from '../Components/VoiceReadAloud'
import './Medications.css'

const EMPTY_MED_FORM = {
  name: '',
  dosage: '',
  medicineType: 'Tablet',
  purpose: '',
  frequency: 'Once Daily',
  startDate: new Date().toISOString().split('T')[0],
  endDate: '',
  reminderTimes: ['09:00'],
  foodTiming: 'After Food',
  specificDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  intervalHours: '',
  isActive: true,
  notes: '',
}

export default function Medications({
  text = {},
  language = 'en-IN',
  user,
  onBack,
  initialTab = 'today',
  openAddModalInitially = false,
}) {
  const [activeTab, setActiveTab] = useState(initialTab)
  const [todaySummary, setTodaySummary] = useState(null)
  const [allMedicines, setAllMedicines] = useState([])
  const [historyData, setHistoryData] = useState(null)
  const [caregiverPerms, setCaregiverPerms] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(openAddModalInitially)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_MED_FORM)
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  // History filters
  const [historyPeriod, setHistoryPeriod] = useState('30d')
  const [historyStatus, setHistoryStatus] = useState('all')

  // Notification status
  const [notificationPermission, setNotificationPermission] = useState(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission
    }
    return 'unsupported'
  })

  const formNameId = useId()
  const formDosageId = useId()
  const formTypeId = useId()
  const formPurposeId = useId()
  const formFrequencyId = useId()
  const formStartDateId = useId()
  const formEndDateId = useId()
  const formFoodTimingId = useId()

  const ui = text.medicationsPage || {}

  // ==========================================
  // Data Loading
  // ==========================================
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const [todayRes, medsRes, historyRes, permsRes] = await Promise.all([
        apiGet('/medications/today'),
        apiGet('/medications'),
        apiGet(`/medications/history?period=${historyPeriod}&status=${historyStatus}`),
        apiGet('/medication-permissions').catch(() => ({ permissions: [] })),
      ])

      setTodaySummary(todayRes)
      setAllMedicines(medsRes.medications || [])
      setHistoryData(historyRes)
      setCaregiverPerms(permsRes.permissions || [])
    } catch (err) {
      console.error('Error loading medications:', err)
      setError(ui.loadError || 'Could not load medications from server.')
    } finally {
      setLoading(false)
    }
  }, [historyPeriod, historyStatus, ui.loadError])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData()
    }, 0)
    return () => {
      window.clearTimeout(timer)
    }
  }, [loadData])

  const showToast = (msg) => {
    setFeedback(msg)
    setTimeout(() => setFeedback(''), 4000)
  }

  // ==========================================
  // Browser Notification Request
  // ==========================================
  const requestNotificationPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    try {
      const res = await Notification.requestPermission()
      setNotificationPermission(res)
      if (res === 'granted') {
        showToast('✓ ' + (ui.alertsActive || 'Notifications enabled.'))
      }
    } catch (err) {
      console.warn('Notification permission request error:', err)
    }
  }

  // ==========================================
  // Action Handlers
  // ==========================================
  const handleMarkTaken = async (dose) => {
    try {
      await apiPost(`/medications/${dose.medication_id}/taken`, {
        scheduled_time: dose.scheduled_datetime,
        time: dose.time,
      })
      showToast(`✓ ${dose.name} (${dose.dosage}) ${ui.takenSuccess || 'logged as taken.'}`)
      await loadData()
    } catch (err) {
      console.error('Failed to mark taken:', err)
      setError('Could not update status. Please try again.')
    }
  }

  const handleSkipDose = async (dose) => {
    try {
      await apiPost(`/medications/${dose.medication_id}/skip`, {
        scheduled_time: dose.scheduled_datetime,
        time: dose.time,
      })
      showToast(`${dose.name} ${ui.skipSuccess || 'marked as skipped.'}`)
      await loadData()
    } catch (err) {
      console.error('Failed to skip dose:', err)
      setError('Could not update status. Please try again.')
    }
  }

  const handleSnoozeDose = async (dose, minutes = 10) => {
    try {
      await apiPost(`/medications/${dose.medication_id}/snooze`, {
        scheduled_time: dose.scheduled_datetime,
        time: dose.time,
        minutes,
      })
      showToast(`⏰ ${dose.name} ${ui.snoozeSuccess || 'snoozed for'} ${minutes} min.`)
      await loadData()
    } catch (err) {
      console.error('Failed to snooze dose:', err)
      setError('Could not snooze reminder.')
    }
  }

  // ==========================================
  // Modal & Form Handlers
  // ==========================================
  const openAddMedicineModal = () => {
    setForm(EMPTY_MED_FORM)
    setEditingId(null)
    setFormError('')
    setIsModalOpen(true)
  }

  const openEditMedicineModal = (med) => {
    setForm({
      name: med.name,
      dosage: med.dosage,
      medicineType: med.medicineType || 'Tablet',
      purpose: med.purpose || '',
      frequency: med.frequency || 'Once Daily',
      startDate: med.startDate || new Date().toISOString().split('T')[0],
      endDate: med.endDate || '',
      reminderTimes: med.reminderTimes && med.reminderTimes.length > 0 ? med.reminderTimes : ['09:00'],
      foodTiming: med.foodTiming || 'After Food',
      specificDays: med.specificDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      intervalHours: med.intervalHours || '',
      isActive: med.isActive !== false,
      notes: med.notes || '',
    })
    setEditingId(med.id)
    setFormError('')
    setIsModalOpen(true)
  }

  const handleAddTime = () => {
    setForm((prev) => ({
      ...prev,
      reminderTimes: [...prev.reminderTimes, '12:00'],
    }))
  }

  const handleRemoveTime = (index) => {
    if (form.reminderTimes.length <= 1) return
    setForm((prev) => ({
      ...prev,
      reminderTimes: prev.reminderTimes.filter((_, i) => i !== index),
    }))
  }

  const handleTimeChange = (index, value) => {
    setForm((prev) => {
      const updated = [...prev.reminderTimes]
      updated[index] = value
      return { ...prev, reminderTimes: updated }
    })
  }

  const handleSaveMedicine = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.dosage.trim()) {
      setFormError('Please provide both medicine name and dosage.')
      return
    }

    try {
      setFormSubmitting(true)
      setFormError('')

      const payload = {
        name: form.name.trim(),
        dosage: form.dosage.trim(),
        medicineType: form.medicineType,
        purpose: form.purpose.trim(),
        frequency: form.frequency,
        startDate: form.startDate,
        endDate: form.endDate ? form.endDate : null,
        reminderTimes: form.reminderTimes,
        foodTiming: form.foodTiming,
        specificDays: form.specificDays,
        intervalHours: form.intervalHours ? Number(form.intervalHours) : null,
        isActive: form.isActive,
        notes: form.notes.trim(),
      }

      if (editingId) {
        await apiPut(`/medications/${editingId}`, payload)
        showToast(ui.updateSuccess || 'Medication updated successfully.')
      } else {
        await apiPost('/medications', payload)
        showToast(ui.saveSuccess || 'Medication saved successfully.')
      }

      setIsModalOpen(false)
      await loadData()
    } catch (err) {
      console.error('Save failed:', err)
      setFormError('Could not save medication. Please check your inputs.')
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleDeleteMedicine = async (id, name) => {
    if (!window.confirm(`${ui.confirmDelete || 'Are you sure you want to delete'} "${name}"?`)) {
      return
    }

    try {
      await apiDelete(`/medications/${id}`)
      showToast(ui.deleteSuccess || 'Medication deleted successfully.')
      await loadData()
    } catch (err) {
      console.error('Delete failed:', err)
      setError('Could not delete medication.')
    }
  }

  // ==========================================
  // Caregiver Permissions Handler
  // ==========================================
  const handleToggleCaregiverPerm = async (caregiverId, field, currentValue) => {
    try {
      const update = {
        caregiverId,
        [field]: !currentValue,
      }
      await apiPost('/medication-permissions', update)
      showToast(ui.caregiverPermissionsUpdated || 'Permissions updated successfully.')

      const permsRes = await apiGet('/medication-permissions')
      setCaregiverPerms(permsRes.permissions || [])
    } catch (err) {
      console.error('Perm toggle failed:', err)
      setError('Could not update caregiver permission.')
    }
  }

  // Voice narration text
  const voiceSpeechText = `
    ${ui.title || 'Medication Reminders'}. 
    ${todaySummary ? `Today you have ${todaySummary.total_doses} scheduled doses. ${todaySummary.taken_doses} taken, ${todaySummary.pending_doses} pending.` : ''}
    ${todaySummary?.next_dose ? `Next dose is ${todaySummary.next_dose.name} at ${todaySummary.next_dose.time}.` : ''}
  `

  return (
    <div className="meds-page">
      {/* Top Header */}
      <header className="meds-header">
        <div className="meds-header-nav">
          <button
            type="button"
            className="meds-back-btn"
            onClick={onBack}
            aria-label={ui.backToDashboard || 'Back to Dashboard'}
          >
            ← {ui.backToDashboard || 'Back to Dashboard'}
          </button>

          <VoiceReadAloud
            text={voiceSpeechText}
            language={language}
            label={text.readAloud || 'Read Aloud'}
            stopLabel={text.stopReading || 'Stop Reading'}
          />
        </div>

        <div className="meds-title-row">
          <div className="meds-title-group">
            <h1 className="meds-main-heading">
              💊 {ui.title || 'Medication Reminder System'}
            </h1>
            <p className="meds-subtitle">
              {ui.subtitle || 'Manage your daily medicines, view reminder schedules, and track adherence history.'}
            </p>
          </div>

          <button
            type="button"
            className="meds-primary-btn"
            onClick={openAddMedicineModal}
          >
            + {ui.addMedicine || 'Add New Medicine'}
          </button>
        </div>
      </header>

      {/* Browser Notification Banner */}
      {notificationPermission !== 'granted' && (
        <aside className="meds-notif-notice" role="region" aria-label="Notification Permission">
          <span className="meds-notif-icon" aria-hidden="true">🔔</span>
          <div className="meds-notif-text">
            <strong>{ui.enableBrowserAlerts || 'Enable Browser Medication Alerts'}</strong>
            <p>{ui.browserNotice || 'Browser notifications allow reminders to alert you even if this tab is in the background.'}</p>
          </div>
          <button
            type="button"
            className="meds-notif-btn"
            onClick={requestNotificationPermission}
          >
            {ui.enableBrowserAlerts || 'Allow Alerts'}
          </button>
        </aside>
      )}

      {/* Feedback Toast */}
      {feedback && (
        <div className="meds-alert-toast" role="status">
          {feedback}
        </div>
      )}

      {error && (
        <div className="meds-error-toast" role="alert">
          ⚠️ {error}
        </div>
      )}

      {/* Tab Navigation */}
      <nav className="meds-tabs-nav" aria-label="Medication Sections">
        <button
          type="button"
          className={`meds-tab-btn ${activeTab === 'today' ? 'active' : ''}`}
          onClick={() => setActiveTab('today')}
        >
          📅 {ui.tabToday || "Today's Schedule"}
          {todaySummary?.pending_doses > 0 && (
            <span className="meds-tab-badge">{todaySummary.pending_doses}</span>
          )}
        </button>

        <button
          type="button"
          className={`meds-tab-btn ${activeTab === 'cabinet' ? 'active' : ''}`}
          onClick={() => setActiveTab('cabinet')}
        >
          💊 {ui.tabMedicines || 'Medicine Cabinet'}
          <span className="meds-tab-count">({allMedicines.length})</span>
        </button>

        <button
          type="button"
          className={`meds-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          📊 {ui.tabHistory || 'Medication History'}
        </button>

        {user?.role === 'elderly' && (
          <button
            type="button"
            className={`meds-tab-btn ${activeTab === 'caregiver' ? 'active' : ''}`}
            onClick={() => setActiveTab('caregiver')}
          >
            🤝 {ui.tabCaregiver || 'Caregiver Access'}
          </button>
        )}
      </nav>

      {/* Main Content Area */}
      {loading ? (
        <div className="meds-loading-view">
          <div className="meds-spinner" aria-hidden="true"></div>
          <p>{ui.loading || 'Loading your medication schedule...'}</p>
        </div>
      ) : (
        <main className="meds-tab-content">
          {/* =======================================================
              TAB 1: TODAY'S SCHEDULE
              ======================================================= */}
          {activeTab === 'today' && (
            <section className="meds-tab-panel" aria-labelledby="today-heading">
              {/* Daily KPI Metric Cards */}
              <div className="meds-kpi-grid">
                <div className="meds-kpi-card">
                  <span className="meds-kpi-label">{ui.totalDosesToday || 'Total Scheduled'}</span>
                  <strong className="meds-kpi-val">{todaySummary?.total_doses || 0}</strong>
                  <span className="meds-kpi-sub">doses for today</span>
                </div>

                <div className="meds-kpi-card meds-kpi-card--green">
                  <span className="meds-kpi-label">{ui.dosesTaken || 'Doses Taken'}</span>
                  <strong className="meds-kpi-val text-green">{todaySummary?.taken_doses || 0}</strong>
                  <span className="meds-kpi-sub">completed</span>
                </div>

                <div className="meds-kpi-card meds-kpi-card--amber">
                  <span className="meds-kpi-label">{ui.dosesPending || 'Pending / Due'}</span>
                  <strong className="meds-kpi-val text-amber">{todaySummary?.pending_doses || 0}</strong>
                  <span className="meds-kpi-sub">need action</span>
                </div>

                <div className="meds-kpi-card meds-kpi-card--highlight">
                  <span className="meds-kpi-label">{ui.adherenceRate || 'Adherence Rate'}</span>
                  <strong className="meds-kpi-val">{todaySummary?.adherence_percentage || 100}%</strong>
                  <span className="meds-kpi-sub">consistency today</span>
                </div>
              </div>

              {/* Doses Timeline List */}
              <div className="meds-doses-container">
                <h2 id="today-heading" className="meds-section-title">
                  {ui.todayOverview || "Today's Medication Overview"}
                </h2>

                {todaySummary?.doses?.length === 0 ? (
                  <div className="meds-empty-box">
                    <p>{ui.noMedicinesScheduled || 'No medications scheduled for today.'}</p>
                    <button
                      type="button"
                      className="meds-secondary-btn"
                      onClick={openAddMedicineModal}
                    >
                      + {ui.addMedicine || 'Add Medicine'}
                    </button>
                  </div>
                ) : (
                  <div className="meds-doses-list">
                    {todaySummary?.doses?.map((dose) => (
                      <article
                        key={dose.id}
                        className={`med-dose-card med-dose-card--${dose.status}`}
                      >
                        <div className="med-dose-time-col">
                          <span className="med-dose-clock">⏰</span>
                          <strong className="med-dose-time-text">{dose.time}</strong>
                        </div>

                        <div className="med-dose-info-col">
                          <div className="med-dose-header-line">
                            <h3 className="med-dose-name">{dose.name}</h3>
                            <span className="med-dose-dosage-tag">{dose.dosage}</span>
                            <span className="med-dose-timing-tag">
                              {ui.foodTimings?.[dose.food_timing] || dose.food_timing}
                            </span>
                          </div>

                          {dose.purpose && (
                            <p className="med-dose-purpose">
                              <strong>{ui.formPurpose || 'Notes'}:</strong> {dose.purpose}
                            </p>
                          )}

                          {dose.taken_time && (
                            <p className="med-dose-taken-timestamp">
                              ✓ {ui.takenAt || 'Taken at'}{' '}
                              {new Date(dose.taken_time).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          )}
                        </div>

                        <div className="med-dose-action-col">
                          <span className={`med-status-pill med-status-pill--${dose.status}`}>
                            {dose.status === 'taken' && `✓ ${ui.filterTaken || 'Taken'}`}
                            {dose.status === 'pending' && `⏳ ${ui.filterPending || 'Pending'}`}
                            {dose.status === 'missed' && `⚠️ ${ui.filterMissed || 'Missed'}`}
                            {dose.status === 'skipped' && `✕ ${ui.filterSkipped || 'Skipped'}`}
                            {dose.status === 'snoozed' && `⏰ ${ui.filterSnoozed || 'Snoozed'}`}
                          </span>

                          {dose.status !== 'taken' && (
                            <div className="med-dose-btns-group">
                              <button
                                type="button"
                                className="med-action-btn med-action-btn--take"
                                onClick={() => handleMarkTaken(dose)}
                              >
                                ✓ {ui.quickMarkTaken || 'Take'}
                              </button>

                              <button
                                type="button"
                                className="med-action-btn med-action-btn--snooze"
                                onClick={() => handleSnoozeDose(dose, 10)}
                              >
                                ⏰ {ui.quickSnooze || '10m'}
                              </button>

                              <button
                                type="button"
                                className="med-action-btn med-action-btn--skip"
                                onClick={() => handleSkipDose(dose)}
                              >
                                {ui.quickSkip || 'Skip'}
                              </button>
                            </div>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* =======================================================
              TAB 2: MEDICINE CABINET (ALL SAVED MEDICINES)
              ======================================================= */}
          {activeTab === 'cabinet' && (
            <section className="meds-tab-panel" aria-labelledby="cabinet-heading">
              <div className="meds-cabinet-header">
                <div>
                  <h2 id="cabinet-heading" className="meds-section-title">
                    {ui.tabMedicines || 'Medicine Cabinet'}
                  </h2>
                  <p className="meds-section-desc">
                    All configured medications, instructions, dosages, and schedules.
                  </p>
                </div>

                <button
                  type="button"
                  className="meds-primary-btn"
                  onClick={openAddMedicineModal}
                >
                  + {ui.addMedicine || 'Add Medicine'}
                </button>
              </div>

              {allMedicines.length === 0 ? (
                <div className="meds-empty-box">
                  <p>{ui.noMedicinesCabinet || 'No medicines added yet.'}</p>
                  <button
                    type="button"
                    className="meds-primary-btn"
                    onClick={openAddMedicineModal}
                  >
                    + {ui.addMedicine || 'Add New Medicine'}
                  </button>
                </div>
              ) : (
                <div className="meds-cabinet-grid">
                  {allMedicines.map((med) => (
                    <article key={med.id} className="med-cabinet-card">
                      <div className="med-cabinet-top">
                        <span className="med-cabinet-type-badge">
                          {ui.types?.[med.medicineType] || med.medicineType || 'Tablet'}
                        </span>
                        <span
                          className={`med-active-badge ${med.isActive ? 'active' : 'inactive'}`}
                        >
                          {med.isActive
                            ? ui.activeStatus || 'Active'
                            : ui.completedStatus || 'Discontinued'}
                        </span>
                      </div>

                      <h3 className="med-cabinet-name">{med.name}</h3>
                      <p className="med-cabinet-dosage">💊 {med.dosage}</p>

                      <div className="med-cabinet-meta">
                        <div className="med-cabinet-meta-row">
                          <span className="med-meta-lbl">{ui.formFrequency || 'Frequency'}:</span>
                          <strong>{ui.frequencies?.[med.frequency] || med.frequency}</strong>
                        </div>

                        <div className="med-cabinet-meta-row">
                          <span className="med-meta-lbl">{ui.formFoodTiming || 'Food'}:</span>
                          <strong>{ui.foodTimings?.[med.foodTiming] || med.foodTiming}</strong>
                        </div>

                        <div className="med-cabinet-meta-row">
                          <span className="med-meta-lbl">{ui.formReminderTimes || 'Times'}:</span>
                          <div className="med-times-chips">
                            {med.reminderTimes?.map((t, idx) => (
                              <span key={idx} className="med-time-chip">
                                ⏰ {t}
                              </span>
                            ))}
                          </div>
                        </div>

                        {med.purpose && (
                          <div className="med-cabinet-meta-row">
                            <span className="med-meta-lbl">{ui.formPurpose || 'Notes'}:</span>
                            <span>{med.purpose}</span>
                          </div>
                        )}
                      </div>

                      <div className="med-cabinet-actions">
                        <button
                          type="button"
                          className="med-cabinet-btn med-cabinet-btn--edit"
                          onClick={() => openEditMedicineModal(med)}
                        >
                          ✏️ {ui.editMedicine || 'Edit'}
                        </button>
                        <button
                          type="button"
                          className="med-cabinet-btn med-cabinet-btn--delete"
                          onClick={() => handleDeleteMedicine(med.id, med.name)}
                        >
                          🗑️ {ui.deleteMedicine || 'Delete'}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* =======================================================
              TAB 3: MEDICATION HISTORY
              ======================================================= */}
          {activeTab === 'history' && (
            <section className="meds-tab-panel" aria-labelledby="history-heading">
              <div className="meds-history-header">
                <div>
                  <h2 id="history-heading" className="meds-section-title">
                    {ui.historyTitle || 'Medication Logs & Adherence History'}
                  </h2>
                  <p className="meds-section-desc">
                    Comprehensive record of taken, skipped, and missed medication doses.
                  </p>
                </div>

                <div className="meds-history-filters">
                  <select
                    className="meds-select"
                    value={historyPeriod}
                    onChange={(e) => setHistoryPeriod(e.target.value)}
                    aria-label="Filter period"
                  >
                    <option value="7d">{ui.period7d || 'Last 7 Days'}</option>
                    <option value="30d">{ui.period30d || 'Last 30 Days'}</option>
                    <option value="all">{ui.periodAll || 'All Time'}</option>
                  </select>

                  <select
                    className="meds-select"
                    value={historyStatus}
                    onChange={(e) => setHistoryStatus(e.target.value)}
                    aria-label="Filter status"
                  >
                    <option value="all">{ui.filterAll || 'All Logs'}</option>
                    <option value="taken">{ui.filterTaken || 'Taken'}</option>
                    <option value="missed">{ui.filterMissed || 'Missed'}</option>
                    <option value="skipped">{ui.filterSkipped || 'Skipped'}</option>
                  </select>
                </div>
              </div>

              {/* History Stats Banner */}
              {historyData?.stats && (
                <div className="meds-history-stats-banner">
                  <div className="meds-history-stat">
                    <span className="meds-stat-title">{ui.adherenceRate || 'Adherence Rate'}</span>
                    <strong className="meds-stat-num text-green">
                      {historyData.stats.adherence_percentage}%
                    </strong>
                  </div>
                  <div className="meds-history-stat">
                    <span className="meds-stat-title">{ui.dosesTaken || 'Taken'}</span>
                    <strong className="meds-stat-num">{historyData.stats.taken}</strong>
                  </div>
                  <div className="meds-history-stat">
                    <span className="meds-stat-title">{ui.dosesMissed || 'Missed'}</span>
                    <strong className="meds-stat-num text-amber">{historyData.stats.missed}</strong>
                  </div>
                  <div className="meds-history-stat">
                    <span className="meds-stat-title">{ui.filterSkipped || 'Skipped'}</span>
                    <strong className="meds-stat-num">{historyData.stats.skipped}</strong>
                  </div>
                </div>
              )}

              {/* Logs Table / List */}
              {historyData?.logs?.length === 0 ? (
                <div className="meds-empty-box">
                  <p>{ui.noHistory || 'No medication logs recorded in this period.'}</p>
                </div>
              ) : (
                <div className="meds-logs-table-wrapper">
                  <table className="meds-logs-table">
                    <thead>
                      <tr>
                        <th>{ui.scheduledFor || 'Scheduled For'}</th>
                        <th>{ui.formName || 'Medicine'}</th>
                        <th>{ui.formDosage || 'Dosage'}</th>
                        <th>{ui.logStatus || 'Status'}</th>
                        <th>{ui.takenAt || 'Taken Time'}</th>
                        <th>{ui.formPurpose || 'Notes'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyData?.logs?.map((log) => (
                        <tr key={log.id} className={`meds-log-row--${log.status}`}>
                          <td>
                            <strong>
                              {new Date(log.scheduledTime).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </strong>{' '}
                            <span className="meds-time-sub">
                              {new Date(log.scheduledTime).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </td>
                          <td>
                            <strong>{log.medicineName}</strong>
                          </td>
                          <td>{log.dosage}</td>
                          <td>
                            <span className={`med-status-pill med-status-pill--${log.status}`}>
                              {log.status === 'taken' && `✓ ${ui.filterTaken || 'Taken'}`}
                              {log.status === 'missed' && `⚠️ ${ui.filterMissed || 'Missed'}`}
                              {log.status === 'skipped' && `✕ ${ui.filterSkipped || 'Skipped'}`}
                              {log.status === 'snoozed' && `⏰ ${ui.filterSnoozed || 'Snoozed'}`}
                            </span>
                          </td>
                          <td>
                            {log.takenTime
                              ? new Date(log.takenTime).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '—'}
                          </td>
                          <td className="meds-notes-cell">{log.notes || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* =======================================================
              TAB 4: CAREGIVER SHARING & PERMISSIONS
              ======================================================= */}
          {activeTab === 'caregiver' && user?.role === 'elderly' && (
            <section className="meds-tab-panel" aria-labelledby="caregiver-heading">
              <div className="meds-caregiver-header">
                <h2 id="caregiver-heading" className="meds-section-title">
                  {ui.caregiverTitle || 'Caregiver Medication Access & Alerts'}
                </h2>
                <p className="meds-section-desc">
                  {ui.caregiverDesc ||
                    'Only caregivers you explicitly approve can view your medication schedule or receive missed dose alerts.'}
                </p>
              </div>

              {caregiverPerms.length === 0 ? (
                <div className="meds-empty-box">
                  <p>
                    No approved caregivers linked yet. Connect a caregiver in Caregiver Connections to manage permissions.
                  </p>
                </div>
              ) : (
                <div className="meds-caregiver-list">
                  {caregiverPerms.map((cp) => (
                    <article key={cp.linkId} className="meds-caregiver-card">
                      <div className="meds-caregiver-info">
                        <div className="meds-caregiver-avatar">🩺</div>
                        <div>
                          <h3 className="meds-caregiver-name">{cp.caregiverName}</h3>
                          <p className="meds-caregiver-email">{cp.caregiverEmail}</p>
                        </div>
                      </div>

                      <div className="meds-caregiver-toggles">
                        <label className="meds-toggle-row">
                          <input
                            type="checkbox"
                            checked={cp.accessGranted}
                            onChange={() =>
                              handleToggleCaregiverPerm(
                                cp.caregiverId,
                                'accessGranted',
                                cp.accessGranted
                              )
                            }
                          />
                          <span className="meds-toggle-label">
                            {ui.caregiverScheduleAccess ||
                              'Allow caregiver to view & help manage medications'}
                          </span>
                        </label>

                        <label className="meds-toggle-row">
                          <input
                            type="checkbox"
                            checked={cp.missedAlertsEnabled}
                            onChange={() =>
                              handleToggleCaregiverPerm(
                                cp.caregiverId,
                                'missedAlertsEnabled',
                                cp.missedAlertsEnabled
                              )
                            }
                          />
                          <span className="meds-toggle-label">
                            {ui.caregiverMissedAlerts ||
                              'Send missed medication alerts to caregiver'}
                          </span>
                        </label>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}
        </main>
      )}

      {/* =======================================================
          ADD / EDIT MEDICATION MODAL
          ======================================================= */}
      {isModalOpen && (
        <div
          className="med-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-form-title"
        >
          <div className="med-modal-container med-modal-container--large">
            <header className="med-modal-header">
              <div className="med-modal-icon-badge">💊</div>
              <div>
                <h2 id="modal-form-title" className="med-modal-title">
                  {editingId ? ui.editMedicine || 'Edit Medicine' : ui.addMedicine || 'Add New Medicine'}
                </h2>
              </div>
            </header>

            <form onSubmit={handleSaveMedicine} className="med-form">
              <div className="med-form-scrollable">
                {formError && <p className="med-form-error">{formError}</p>}

                {/* Name & Dosage */}
                <div className="med-form-row">
                  <div className="med-form-group">
                    <label htmlFor={formNameId} className="med-form-label">
                      {ui.formName || 'Medicine Name'} *
                    </label>
                    <input
                      id={formNameId}
                      type="text"
                      className="med-input"
                      placeholder={ui.formNamePlaceholder || 'e.g. Telmisartan, Metformin'}
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="med-form-group">
                    <label htmlFor={formDosageId} className="med-form-label">
                      {ui.formDosage || 'Dosage'} *
                    </label>
                    <input
                      id={formDosageId}
                      type="text"
                      className="med-input"
                      placeholder={ui.formDosagePlaceholder || 'e.g. 500 mg, 1 tablet'}
                      value={form.dosage}
                      onChange={(e) => setForm({ ...form, dosage: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Type & Food Timing */}
                <div className="med-form-row">
                  <div className="med-form-group">
                    <label htmlFor={formTypeId} className="med-form-label">
                      {ui.formType || 'Medicine Type'}
                    </label>
                    <select
                      id={formTypeId}
                      className="med-select"
                      value={form.medicineType}
                      onChange={(e) => setForm({ ...form, medicineType: e.target.value })}
                    >
                      <option value="Tablet">Tablet 💊</option>
                      <option value="Capsule">Capsule 💊</option>
                      <option value="Syrup">Syrup 🧴</option>
                      <option value="Injection">Injection 💉</option>
                      <option value="Drops">Drops 💧</option>
                      <option value="Other">Other 🩹</option>
                    </select>
                  </div>

                  <div className="med-form-group">
                    <label htmlFor={formFoodTimingId} className="med-form-label">
                      {ui.formFoodTiming || 'Food Timing'}
                    </label>
                    <select
                      id={formFoodTimingId}
                      className="med-select"
                      value={form.foodTiming}
                      onChange={(e) => setForm({ ...form, foodTiming: e.target.value })}
                    >
                      <option value="After Food">After Food 🍲</option>
                      <option value="Before Food">Before Food 🍽️</option>
                      <option value="With Food">With Food 🥗</option>
                      <option value="No Preference">No Preference 🕒</option>
                    </select>
                  </div>
                </div>

                {/* Frequency & Dates */}
                <div className="med-form-row">
                  <div className="med-form-group">
                    <label htmlFor={formFrequencyId} className="med-form-label">
                      {ui.formFrequency || 'Frequency'}
                    </label>
                    <select
                      id={formFrequencyId}
                      className="med-select"
                      value={form.frequency}
                      onChange={(e) => {
                        const freq = e.target.value
                        let defaultTimes = ['09:00']
                        if (freq === 'Twice Daily') defaultTimes = ['09:00', '20:30']
                        if (freq === 'Three Times Daily') defaultTimes = ['08:30', '13:30', '20:30']
                        setForm({ ...form, frequency: freq, reminderTimes: defaultTimes })
                      }}
                    >
                      <option value="Once Daily">Once Daily</option>
                      <option value="Twice Daily">Twice Daily</option>
                      <option value="Three Times Daily">Three Times Daily</option>
                      <option value="Every X Hours">Every X Hours</option>
                      <option value="Specific Days of Week">Specific Days of Week</option>
                      <option value="Custom Times">Custom Times</option>
                    </select>
                  </div>

                  <div className="med-form-group">
                    <label htmlFor={formStartDateId} className="med-form-label">
                      {ui.formStartDate || 'Start Date'}
                    </label>
                    <input
                      id={formStartDateId}
                      type="date"
                      className="med-input"
                      value={form.startDate}
                      onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    />
                  </div>

                  <div className="med-form-group">
                    <label htmlFor={formEndDateId} className="med-form-label">
                      {ui.formEndDate || 'End Date (Optional)'}
                    </label>
                    <input
                      id={formEndDateId}
                      type="date"
                      className="med-input"
                      value={form.endDate}
                      onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    />
                  </div>
                </div>

                {/* Reminder Times list */}
                <div className="med-form-times-section">
                  <div className="med-times-header">
                    <label className="med-form-label">
                      {ui.formReminderTimes || 'Reminder Time(s)'}
                    </label>
                    <button
                      type="button"
                      className="med-add-time-btn"
                      onClick={handleAddTime}
                    >
                      {ui.addTimeBtn || '+ Add Time'}
                    </button>
                  </div>

                  <div className="med-times-inputs-grid">
                    {form.reminderTimes.map((timeVal, idx) => (
                      <div key={idx} className="med-time-input-row">
                        <input
                          type="time"
                          className="med-input med-input--time"
                          value={timeVal}
                          onChange={(e) => handleTimeChange(idx, e.target.value)}
                          required
                        />
                        {form.reminderTimes.length > 1 && (
                          <button
                            type="button"
                            className="med-time-remove-btn"
                            onClick={() => handleRemoveTime(idx)}
                            aria-label={`Remove time ${timeVal}`}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Purpose / Notes */}
                <div className="med-form-group">
                  <label htmlFor={formPurposeId} className="med-form-label">
                    {ui.formPurpose || 'Purpose / Notes'}
                  </label>
                  <textarea
                    id={formPurposeId}
                    className="med-textarea"
                    rows={2}
                    placeholder={ui.formPurposePlaceholder || 'e.g. Blood pressure regulation, post-breakfast with water'}
                    value={form.purpose}
                    onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                  />
                </div>

                {/* Status active/completed */}
                <div className="med-form-checkbox-row">
                  <label className="med-checkbox-label">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    />
                    <span>{ui.activeStatus || 'Active Prescription (generate daily reminders)'}</span>
                  </label>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="med-form-actions">
                <button
                  type="submit"
                  className="med-btn med-btn--take"
                  disabled={formSubmitting}
                >
                  {formSubmitting
                    ? ui.saving || 'Saving...'
                    : editingId
                    ? ui.updateBtn || 'Update Medicine'
                    : ui.saveBtn || 'Save Medicine'}
                </button>

                <button
                  type="button"
                  className="med-btn med-btn--skip"
                  onClick={() => setIsModalOpen(false)}
                >
                  {ui.cancelBtn || 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
