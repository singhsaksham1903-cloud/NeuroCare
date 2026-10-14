import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import './CaregiverDashboard.css'
import VoiceReadAloud from '../Components/VoiceReadAloud'

import { apiGet, apiPost, apiPut, apiDelete } from '../utils/api'


// ============================================
// Caregiver Icons
// ============================================

function CaregiverIcon({ type }) {
  const common = {
    viewBox: '0 0 48 48',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    'aria-hidden': 'true',
  }

  if (type === 'sessions') {
    return (
      <svg {...common}>
        <rect
          x="8"
          y="10"
          width="32"
          height="28"
          rx="8"
          stroke="currentColor"
          strokeWidth="2.5"
        />

        <path
          d="M16 18H32"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        <path
          d="M16 25H28"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        <path
          d="M16 32H24"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    )
  }

  if (type === 'games') {
    return (
      <svg {...common}>
        <rect
          x="7"
          y="14"
          width="34"
          height="22"
          rx="8"
          stroke="currentColor"
          strokeWidth="2.5"
        />

        <path
          d="M15 25H21"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        <path
          d="M18 22V28"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        <circle
          cx="31"
          cy="23"
          r="2"
          fill="currentColor"
        />

        <circle
          cx="35"
          cy="28"
          r="2"
          fill="currentColor"
        />
      </svg>
    )
  }

  if (type === 'accuracy') {
    return (
      <svg {...common}>
        <path
          d="M10 33L19 25L26 29L38 16"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d="M31 16H38V23"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d="M8 39H40"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    )
  }

  if (type === 'mistakes') {
    return (
      <svg {...common}>
        <circle
          cx="24"
          cy="24"
          r="15"
          stroke="currentColor"
          strokeWidth="2.5"
        />

        <path
          d="M24 16V27"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />

        <circle
          cx="24"
          cy="33"
          r="1.8"
          fill="currentColor"
        />
      </svg>
    )
  }

  if (type === 'time') {
    return (
      <svg {...common}>
        <circle
          cx="24"
          cy="25"
          r="14"
          stroke="currentColor"
          strokeWidth="2.5"
        />

        <path
          d="M24 18V25L29 29"
          stroke="currentColor"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d="M19 9H29"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    )
  }

  if (type === 'memory') {
    return (
      <svg {...common}>
        <rect
          x="9"
          y="8"
          width="30"
          height="32"
          rx="6"
          stroke="currentColor"
          strokeWidth="2.5"
        />

        <circle
          cx="19"
          cy="20"
          r="5"
          stroke="currentColor"
          strokeWidth="2.5"
        />

        <path
          d="M13 34C15 28 19 26 24 26C29 26 33 28 35 34"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    )
  }

  if (type === 'reminder') {
    return (
      <svg {...common}>
        <path
          d="M15 19C15 14 19 10 24 10C29 10 33 14 33 19V27L36 31H12L15 27V19Z"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        <path
          d="M21 36C22 37.5 26 37.5 27 36"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    )
  }

  return (
    <svg {...common}>
      <circle
        cx="24"
        cy="16"
        r="6"
        stroke="currentColor"
        strokeWidth="2.5"
      />

      <path
        d="M12 36C13.5 28.5 18 25 24 25C30 25 34.5 28.5 36 36"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  )
}


// ============================================
// Caregiver Stat Card
// ============================================

function CaregiverStatCard({
  icon,
  value,
  label,
}) {
  return (
    <article className="caregiver-stat-card">

      <div
        className={`caregiver-stat-icon caregiver-stat-icon--${icon}`}
        aria-hidden="true"
      >
        <CaregiverIcon type={icon} />
      </div>

      <div className="caregiver-stat-content">

        <strong>
          {value}
        </strong>

        <span>
          {label}
        </span>

      </div>

    </article>
  )
}


// ============================================
// Caregiver Dashboard
// ============================================

function CaregiverDashboard({
  onBack,
  user,
  text,
  language = 'en-IN',
  readAloudLabel = 'Read Aloud',
  stopReadingLabel = 'Stop Reading',
}) {
  const [sessions, setSessions] = useState([])
  const [memoryCount, setMemoryCount] = useState(0)
  const [reminders, setReminders] = useState([])
  const [elderlyMemories, setElderlyMemories] = useState([])
  const [memoryPermission, setMemoryPermission] = useState({
    access_granted: true,
    emergency_mode_enabled: false,
    can_view: true,
  })

  // Caregiver Medication State
  const [patientMeds, setPatientMeds] = useState([])
  const [patientMedsSummary, setPatientMedsSummary] = useState(null)
  const [medicationAlerts, setMedicationAlerts] = useState([])
  const [medAccessGranted, setMedAccessGranted] = useState(true)
  const [isCaregiverMedModalOpen, setIsCaregiverMedModalOpen] = useState(false)
  const [editingPatientMedId, setEditingPatientMedId] = useState(null)
  const [caregiverMedForm, setCaregiverMedForm] = useState({
    name: '',
    dosage: '',
    medicineType: 'Tablet',
    purpose: '',
    frequency: 'Once Daily',
    startDate: new Date().toISOString().split('T')[0],
    reminderTimes: ['09:00'],
    foodTiming: 'After Food',
  })

  const [linkedElderly, setLinkedElderly] = useState(null)
  const [approvedLinkId, setApprovedLinkId] = useState(null)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [reportPeriod, setReportPeriod] = useState('30d')
  const [progressReport, setProgressReport] = useState(null)
  const [reportLoading, setReportLoading] = useState(false)
  const [reportError, setReportError] = useState('')
  const [reportRevoked, setReportRevoked] = useState(false)
  const [copiedReport, setCopiedReport] = useState(false)

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')


  // ==========================================
  // Load Caregiver Data
  // ==========================================

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      if (user?.role !== 'caregiver') {
        setSessions([])
        setMemoryCount(0)
        setReminders([])
        setElderlyMemories([])
        setLinkedElderly(null)
        setApprovedLinkId(null)

        setError(
          text.caregiverOnlyError,
        )

        return
      }

      const linksData =
        await apiGet(
          '/caregiver-links',
        )

      const links =
        Array.isArray(linksData)
          ? linksData
          : []

      const approvedLink =
        links.find(
          (link) =>
            link.status ===
            'approved',
        )

      if (!approvedLink) {
        setSessions([])
        setMemoryCount(0)
        setReminders([])
        setElderlyMemories([])
        setLinkedElderly(null)
        setApprovedLinkId(null)

        return
      }

      setApprovedLinkId(approvedLink.id)

      const linkedData =
        await apiGet(
          `/caregiver-links/${approvedLink.id}/data`,
        )

      setLinkedElderly(
        linkedData.elderly_user ||
        null,
      )

      setSessions(
        linkedData.sessions ||
        [],
      )

      setMemoryCount(
        linkedData.memory_count ??
        0,
      )

      setReminders(
        linkedData.reminders ||
        [],
      )

      setElderlyMemories(
        linkedData.memories ||
        [],
      )

      if (linkedData.memory_permission) {
        setMemoryPermission(linkedData.memory_permission)
      }

      // Fetch linked elderly medications
      try {
        const medsRes = await apiGet(`/caregiver-links/${approvedLink.id}/medications`)
        setPatientMeds(medsRes.medications || [])
        setPatientMedsSummary(medsRes.today_summary || null)
        setMedAccessGranted(true)
      } catch (medErr) {
        if (medErr?.status === 403) {
          setMedAccessGranted(false)
          setPatientMeds([])
          setPatientMedsSummary(null)
        }
      }

      // Fetch missed medication alerts
      try {
        const alertsRes = await apiGet(`/caregiver-links/${approvedLink.id}/medication-alerts`)
        if (alertsRes.alerts_enabled) {
          setMedicationAlerts(alertsRes.alerts || [])
        } else {
          setMedicationAlerts([])
        }
      } catch {
        setMedicationAlerts([])
      }
    } catch (err) {
      setError(
        err.message ||
        text.loadError,
      )
    } finally {
      setLoading(false)
    }
  }, [
    text.caregiverOnlyError,
    text.loadError,
    user,
  ])

  // Caregiver Save Medication Handler
  const handleCaregiverSaveMed = async (e) => {
    e.preventDefault()
    if (!approvedLinkId || !caregiverMedForm.name.trim() || !caregiverMedForm.dosage.trim()) return

    try {
      if (editingPatientMedId) {
        await apiPut(`/caregiver-links/${approvedLinkId}/medications/${editingPatientMedId}`, caregiverMedForm)
      } else {
        await apiPost(`/caregiver-links/${approvedLinkId}/medications`, caregiverMedForm)
      }
      setIsCaregiverMedModalOpen(false)
      setEditingPatientMedId(null)
      // Refresh medication data
      const medsRes = await apiGet(`/caregiver-links/${approvedLinkId}/medications`)
      setPatientMeds(medsRes.medications || [])
      setPatientMedsSummary(medsRes.today_summary || null)
    } catch (err) {
      console.error('Caregiver save med failed:', err)
      alert('Could not save medication: ' + (err.message || 'Error'))
    }
  }

  const handleOpenAddCaregiverMed = () => {
    setCaregiverMedForm({
      name: '',
      dosage: '',
      medicineType: 'Tablet',
      purpose: '',
      frequency: 'Once Daily',
      startDate: new Date().toISOString().split('T')[0],
      reminderTimes: ['09:00'],
      foodTiming: 'After Food',
    })
    setEditingPatientMedId(null)
    setIsCaregiverMedModalOpen(true)
  }

  const handleOpenEditCaregiverMed = (med) => {
    setCaregiverMedForm({
      name: med.name,
      dosage: med.dosage,
      medicineType: med.medicineType || 'Tablet',
      purpose: med.purpose || '',
      frequency: med.frequency || 'Once Daily',
      startDate: med.startDate || new Date().toISOString().split('T')[0],
      reminderTimes: med.reminderTimes && med.reminderTimes.length > 0 ? med.reminderTimes : ['09:00'],
      foodTiming: med.foodTiming || 'After Food',
    })
    setEditingPatientMedId(med.id)
    setIsCaregiverMedModalOpen(true)
  }

  const handleCaregiverDeleteMed = async (medId, medName) => {
    if (!window.confirm(`Are you sure you want to remove "${medName}" from the patient's schedule?`)) return
    try {
      await apiDelete(`/medications/${medId}`)
      if (approvedLinkId) {
        const medsRes = await apiGet(`/caregiver-links/${approvedLinkId}/medications`)
        setPatientMeds(medsRes.medications || [])
        setPatientMedsSummary(medsRes.today_summary || null)
      }
    } catch (err) {
      console.error('Caregiver delete med failed:', err)
    }
  }


  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData()
    }, 0)

    return () => {
      window.clearTimeout(timer)
    }
  }, [loadData])

  // ==========================================
  // Cognitive Progress Report Helpers
  // ==========================================

  const fetchProgressReport = async (period = '30d') => {
    if (!approvedLinkId) return
    try {
      setReportLoading(true)
      setReportError('')
      setReportRevoked(false)
      const data = await apiGet(`/caregiver-links/${approvedLinkId}/progress-report?period=${period}`)
      setProgressReport(data)
    } catch (err) {
      if (err.message && (err.message.includes('not been granted') || err.message.includes('403') || err.message.includes('revoked'))) {
        setReportRevoked(true)
      } else {
        setReportError(err.message || 'Could not load cognitive progress report.')
      }
    } finally {
      setReportLoading(false)
    }
  }

  const openReportModal = (period = '30d') => {
    setReportPeriod(period)
    setIsReportModalOpen(true)
    void fetchProgressReport(period)
  }

  const handleCopyReport = () => {
    if (!progressReport) return
    const textToCopy = `NeuroCare Cognitive Progress Report for Caregivers
Patient: ${progressReport.elderly_user?.full_name || linkedElderly?.full_name || 'Patient'}
Period: ${reportPeriod}
Generated: ${new Date().toLocaleDateString()}

Summary:
${progressReport.plain_language_summary}

Clinical Insights:
${progressReport.ai_analysis?.summary || 'N/A'}

Observed Strengths:
${(progressReport.ai_analysis?.strengths || []).map((s) => `• ${s}`).join('\n')}

Practice Focus:
${(progressReport.ai_analysis?.areas_to_practice || []).map((a) => `• ${a}`).join('\n')}

Recommended Next Activity:
${progressReport.recommendation?.game} (${progressReport.recommendation?.difficulty} level) - ${progressReport.recommendation?.reason}

Disclaimer:
${progressReport.disclaimer}`

    if (navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        setCopiedReport(true)
        setTimeout(() => setCopiedReport(false), 2500)
      })
    }
  }


  // ==========================================
  // Format Time
  // ==========================================

  const formatTime = (
    seconds,
  ) => {
    const totalSeconds =
      Number(
        seconds || 0,
      )

    const minutes =
      Math.floor(
        totalSeconds / 60,
      )

    const remainingSeconds =
      totalSeconds % 60

    return `${String(
      minutes,
    ).padStart(
      2,
      '0',
    )}:${String(
      remainingSeconds,
    ).padStart(
      2,
      '0',
    )}`
  }


  // ==========================================
  // Format Date
  // ==========================================

  const formatDate = (
    value,
  ) => {
    if (!value) {
      return text.unknown
    }

    const date =
      new Date(value)

    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      return text.unknown
    }

    return date.toLocaleString()
  }


  // ==========================================
  // Format Reminder Date
  // ==========================================

  const formatReminderDate = (
    value,
  ) => {
    if (!value) {
      return text.noDueDate
    }

    const date =
      new Date(value)

    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      return value
    }

    return date.toLocaleString()
  }


  // ==========================================
  // Summary Statistics
  // ==========================================

  const averageAccuracy =
    sessions.length === 0
      ? 0
      : Math.round(
        sessions.reduce(
          (
            total,
            session,
          ) =>
            total +
            Number(
              session.accuracy ||
              0,
            ),
          0,
        ) /
        sessions.length,
      )

  const averageMistakes =
    sessions.length === 0
      ? '—'
      : (
        sessions.reduce(
          (
            total,
            session,
          ) =>
            total +
            Number(
              session.mistakes ||
              0,
            ),
          0,
        ) /
        sessions.length
      ).toFixed(1)

  const averageCompletionTime =
    sessions.length === 0
      ? 0
      : Math.round(
        sessions.reduce(
          (
            total,
            session,
          ) =>
            total +
            Number(
              session.time ||
              0,
            ),
          0,
        ) /
        sessions.length,
      )

  const personalBestAccuracy =
    sessions.length === 0
      ? 0
      : Math.max(
        ...sessions.map(
          (session) =>
            Number(
              session.accuracy ||
              0,
            ),
        ),
      )

  const gameTypes =
    new Set(
      sessions.map(
        (session) =>
          session.game,
      ),
    ).size

  const recentSessions =
    sessions.slice(0, 8)

  const activeReminderCount =
    reminders.filter(
      (reminder) =>
        !reminder.completed,
    ).length

  const upcomingReminders =
    reminders
      .filter(
        (reminder) =>
          !reminder.completed &&
          reminder.dueDatetime,
      )
      .sort(
        (a, b) =>
          new Date(
            a.dueDatetime,
          ).getTime() -
          new Date(
            b.dueDatetime,
          ).getTime(),
      )
      .slice(0, 5)


  // ==========================================
  // Game Helpers
  // ==========================================

  const getGameSessions = (
    gameName,
  ) =>
    sessions.filter(
      (session) =>
        session.game ===
        gameName,
    )

  const getGameAverage = (
    gameName,
  ) => {
    const gameSessions =
      getGameSessions(
        gameName,
      )

    if (
      gameSessions.length ===
      0
    ) {
      return '—'
    }

    const average =
      gameSessions.reduce(
        (
          total,
          session,
        ) =>
          total +
          Number(
            session.accuracy ||
            0,
          ),
        0,
      ) /
      gameSessions.length

    return `${Math.round(
      average,
    )}%`
  }

  const getRecentGameAccuracy = (
    gameName,
  ) => {
    const gameSessions =
      getGameSessions(
        gameName,
      )

    if (
      gameSessions.length ===
      0
    ) {
      return null
    }

    const recent =
      gameSessions.slice(0, 3)

    return (
      recent.reduce(
        (
          total,
          session,
        ) =>
          total +
          Number(
            session.accuracy ||
            0,
          ),
        0,
      ) /
      recent.length
    )
  }

  const getGameTrend = (
    gameName,
  ) => {
    const gameSessions =
      getGameSessions(
        gameName,
      )

    if (
      gameSessions.length < 2
    ) {
      return text.notEnoughData
    }

    const recent =
      gameSessions[0]

    const previous =
      gameSessions[1]

    const difference =
      Number(
        recent.accuracy ||
        0,
      ) -
      Number(
        previous.accuracy ||
        0,
      )

    if (difference > 5) {
      return text.improving
    }

    if (difference < -5) {
      return text.declining
    }

    return text.stable
  }


  const gameNames = [
    'Memory Match',
    'Sequence Memory',
    'Object Recall',
  ]


  const getGameDisplayName = (
    gameName,
  ) => {
    const gameLabels = {
      'Memory Match':
        text.games.memoryMatch,

      'Sequence Memory':
        text.games.sequenceMemory,

      'Object Recall':
        text.games.objectRecall,
    }

    return (
      gameLabels[gameName] ||
      gameName
    )
  }


  // ==========================================
  // Render
  // ==========================================

  return (
    <div className="caregiver-page">

      {/* Header */}

      <header className="caregiver-header">

        <button
          type="button"
          className="caregiver-back-button"
          onClick={onBack}
        >
          <span aria-hidden="true">
            ←
          </span>

          {text.backToDashboard}
        </button>


        <div className="caregiver-heading">

          <div
            className="caregiver-heading-icon"
            aria-hidden="true"
          >
            <CaregiverIcon
              type="user"
            />
          </div>


          <div>

            <span className="caregiver-eyebrow">
              {text.connectedUser}
            </span>

            <h1>
              {text.caregiverDashboardTitle}
            </h1>

            <p>
              {text.caregiverDashboardDescription}
            </p>

          </div>

        </div>


        <VoiceReadAloud
          text={
            `${text.caregiverDashboardTitle}. ` +
            `${text.caregiverDashboardDescription}`
          }
          language={language}
          label={readAloudLabel}
          stopLabel={stopReadingLabel}
        />


        {linkedElderly && (
          <div className="caregiver-linked-user">

            <span>
              {text.currentlyViewing}
            </span>

            <strong>
              {linkedElderly.full_name}
            </strong>

          </div>
        )}

      </header>


      {/* Loading */}

      {loading && (
        <div className="caregiver-message">
          {text.loadingCaregiverData}
        </div>
      )}


      {/* Error */}

      {!loading &&
        error && (
          <div className="caregiver-message caregiver-message--error">
            {error}
          </div>
        )}


      {/* No approved connection */}

      {!loading &&
        !error &&
        !linkedElderly && (
          <section className="caregiver-empty">

            <div
              className="caregiver-empty-icon"
              aria-hidden="true"
            >
              <CaregiverIcon
                type="user"
              />
            </div>

            <h2>
              {text.noApprovedConnection}
            </h2>

            <p>
              {text.noApprovedConnectionDescription}
            </p>

          </section>
        )}


      {/* Linked elderly data */}

      {!loading &&
        !error &&
        linkedElderly && (
          <>

            {/* Overview */}

            <section className="caregiver-overview">

              <div className="caregiver-overview-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>

                <div>
                  <span>
                    {text.connectedUser}
                  </span>

                  <h2>
                    {linkedElderly.full_name}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => openReportModal('30d')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '11px 20px',
                    borderRadius: '14px',
                    background: '#7357c7',
                    color: '#ffffff',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.94rem',
                    boxShadow: '0 4px 14px rgba(115, 87, 199, 0.28)',
                    transition: 'transform 0.15s ease, background 0.15s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#5f46ae'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#7357c7'; e.currentTarget.style.transform = 'translateY(0)' }}
                  aria-label="View Cognitive Progress Report"
                >
                  📄 <span>View Cognitive Progress Report</span>
                </button>

              </div>


              <div className="caregiver-stats-grid">

                <CaregiverStatCard
                  icon="sessions"
                  value={
                    sessions.length
                  }
                  label={
                    text.totalSessions
                  }
                />

                <CaregiverStatCard
                  icon="games"
                  value={gameTypes}
                  label={
                    text.gamesPlayed
                  }
                />

                <CaregiverStatCard
                  icon="accuracy"
                  value={`${averageAccuracy}%`}
                  label={
                    text.averageAccuracy
                  }
                />

                <CaregiverStatCard
                  icon="memory"
                  value={memoryCount}
                  label={
                    text.savedMemories
                  }
                />

                <CaregiverStatCard
                  icon="reminder"
                  value={
                    activeReminderCount
                  }
                  label={
                    text.activeReminders
                  }
                />

                <CaregiverStatCard
                  icon="mistakes"
                  value={
                    averageMistakes
                  }
                  label={
                    text.averageMistakes
                  }
                />

                <CaregiverStatCard
                  icon="time"
                  value={
                    formatTime(
                      averageCompletionTime,
                    )
                  }
                  label={
                    text.averageCompletionTime
                  }
                />

                <CaregiverStatCard
                  icon="accuracy"
                  value={`${personalBestAccuracy}%`}
                  label={
                    text.personalBestAccuracy
                  }
                />

              </div>

            </section>


            {/* Connected User */}

            <section className="caregiver-intro-panel">

              <div className="caregiver-intro-icon">
                <CaregiverIcon
                  type="user"
                />
              </div>

              <div>

                <span className="caregiver-section-label">
                  {text.connectedUser}
                </span>

                <h2>
                  {linkedElderly.full_name}
                </h2>

                <p>
                  {text.connectedUserDescription}
                </p>

              </div>

            </section>


            {/* Game Performance */}

            <section className="caregiver-panel">

              <div className="caregiver-section-heading">

                <div>

                  <span className="caregiver-section-label">
                    {text.gamesPlayed}
                  </span>

                  <h2>
                    {text.gamePerformance}
                  </h2>

                </div>

              </div>


              <div className="caregiver-game-grid">

                {gameNames.map(
                  (gameName) => {

                    const count =
                      getGameSessions(
                        gameName,
                      ).length

                    const recentAccuracy =
                      getRecentGameAccuracy(
                        gameName,
                      )

                    return (
                      <article
                        className="caregiver-game-card"
                        key={gameName}
                      >

                        <span className="caregiver-card-badge">
                          {count}{' '}

                          {count ===
                            1
                            ? text.session
                            : text.sessions}
                        </span>


                        <h3>
                          {getGameDisplayName(
                            gameName,
                          )}
                        </h3>


                        <strong className="caregiver-game-average">
                          {getGameAverage(
                            gameName,
                          )}
                        </strong>


                        <span className="caregiver-game-average-label">
                          {text.averageAccuracy}
                        </span>


                        <div className="caregiver-game-meta">

                          <span>
                            {text.trend}:{' '}

                            <strong>
                              {getGameTrend(
                                gameName,
                              )}
                            </strong>
                          </span>


                          <span>
                            {text.recent}:{' '}

                            <strong>
                              {
                                recentAccuracy ===
                                  null
                                  ? '—'
                                  : `${Math.round(
                                    recentAccuracy,
                                  )}%`
                              }
                            </strong>
                          </span>

                        </div>

                      </article>
                    )
                  },
                )}

              </div>

            </section>


            {/* Upcoming Reminders */}

            <section className="caregiver-panel">

              <div className="caregiver-section-heading">

                <div>

                  <span className="caregiver-section-label">
                    {text.planning}
                  </span>

                  <h2>
                    {text.upcomingReminders}
                  </h2>

                  <p>
                    {text.upcomingRemindersDescription}
                  </p>

                </div>

              </div>


              {upcomingReminders.length ===
                0 ? (

                <div className="caregiver-empty caregiver-empty--small">

                  <div className="caregiver-empty-icon caregiver-empty-icon--small">
                    <CaregiverIcon
                      type="reminder"
                    />
                  </div>

                  <p>
                    {text.noUpcomingReminders}
                  </p>

                </div>

              ) : (

                <div className="caregiver-reminder-list">

                  {upcomingReminders.map(
                    (reminder) => (
                      <article
                        className="caregiver-reminder-item"
                        key={reminder.id}
                      >

                        <div className="caregiver-reminder-icon">
                          <CaregiverIcon
                            type="reminder"
                          />
                        </div>


                        <div className="caregiver-reminder-main">

                          <h3>
                            {reminder.title}
                          </h3>

                          <p>
                            {reminder.description}
                          </p>

                        </div>


                        <div className="caregiver-reminder-meta">

                          <span>
                            {reminder.category}
                          </span>

                          <time>
                            {formatReminderDate(
                              reminder.dueDatetime,
                            )}
                          </time>

                        </div>

                      </article>
                    ),
                  )}

                </div>
              )}

            </section>


            {/* ============================================================
                Caregiver Medication Schedule & Missed Medication Alerts
                ============================================================ */}
            <section className="caregiver-panel">
              <div className="caregiver-section-heading">
                <div>
                  <span className="caregiver-section-label">
                    💊 Prescriptions & Adherence
                  </span>
                  <h2>
                    {linkedElderly.full_name}&apos;s Medication Schedule
                  </h2>
                  <p>
                    Manage medications, review scheduled reminder times, and monitor daily dose adherence.
                  </p>
                </div>

                {medAccessGranted && (
                  <button
                    type="button"
                    className="caregiver-link-button"
                    onClick={handleOpenAddCaregiverMed}
                    style={{ background: '#0d9488', color: '#ffffff', border: 'none', padding: '10px 18px', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    + Add Medicine for Patient
                  </button>
                )}
              </div>

              {/* Missed Medication Alerts Banner */}
              {medicationAlerts.length > 0 && (
                <aside
                  role="alert"
                  style={{
                    background: '#fff1f2',
                    border: '2px solid #fecdd3',
                    borderRadius: '16px',
                    padding: '16px 20px',
                    marginBottom: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#be123c', fontWeight: 800, fontSize: '1rem' }}>
                    <span style={{ fontSize: '1.3rem' }}>⚠️</span>
                    <span>Missed Medication Alert ({medicationAlerts.length})</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {medicationAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #fda4af',
                          borderRadius: '10px',
                          padding: '10px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span style={{ color: '#9f1239', fontWeight: 600, fontSize: '0.95rem' }}>
                          {alert.message}
                        </span>
                        <span style={{ background: '#ffe4e6', color: '#be123c', fontSize: '0.82rem', fontWeight: 700, padding: '3px 8px', borderRadius: '6px' }}>
                          ⏰ {alert.time}
                        </span>
                      </div>
                    ))}
                  </div>
                </aside>
              )}

              {/* Medication Permission Denied State */}
              {!medAccessGranted ? (
                <div
                  className="caregiver-empty caregiver-empty--small"
                  style={{ background: '#f8fafc', borderColor: '#cbd5e1' }}
                >
                  <span style={{ fontSize: '2.4rem' }}>🔒</span>
                  <h3 style={{ color: '#334155', marginTop: 8 }}>Medication Schedule Restricted</h3>
                  <p style={{ color: '#64748b', maxWidth: 520, margin: '6px auto 0', lineHeight: 1.5 }}>
                    {linkedElderly.full_name} has not authorized caregiver access to their medication records. The patient can grant permission at any time from their Medication Reminders privacy settings.
                  </p>
                </div>
              ) : (
                <>
                  {/* Today's Adherence Snapshot */}
                  {patientMedsSummary && (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '14px',
                        marginBottom: '20px',
                      }}
                    >
                      <div style={{ background: '#f0fdfa', border: '1px solid #ccfbf1', borderRadius: '14px', padding: '14px' }}>
                        <span style={{ fontSize: '0.85rem', color: '#0f766e', fontWeight: 700 }}>Today&apos;s Adherence</span>
                        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#115e59', marginTop: '4px' }}>
                          {patientMedsSummary.adherence_percentage}%
                        </div>
                      </div>

                      <div style={{ background: '#f0fdfa', border: '1px solid #ccfbf1', borderRadius: '14px', padding: '14px' }}>
                        <span style={{ fontSize: '0.85rem', color: '#0f766e', fontWeight: 700 }}>Doses Taken Today</span>
                        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#115e59', marginTop: '4px' }}>
                          {patientMedsSummary.taken_doses} / {patientMedsSummary.total_doses}
                        </div>
                      </div>

                      <div style={{ background: '#f0fdfa', border: '1px solid #ccfbf1', borderRadius: '14px', padding: '14px' }}>
                        <span style={{ fontSize: '0.85rem', color: '#0f766e', fontWeight: 700 }}>Pending Doses</span>
                        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: patientMedsSummary.pending_doses > 0 ? '#b45309' : '#059669', marginTop: '4px' }}>
                          {patientMedsSummary.pending_doses}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Medicines List */}
                  {patientMeds.length === 0 ? (
                    <div className="caregiver-empty caregiver-empty--small">
                      <p>No medications have been recorded for this patient yet.</p>
                      <button
                        type="button"
                        onClick={handleOpenAddCaregiverMed}
                        style={{ marginTop: '12px', background: '#0d9488', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}
                      >
                        + Add First Medicine
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                      {patientMeds.map((med) => (
                        <article
                          key={med.id}
                          style={{
                            background: '#ffffff',
                            border: '1.5px solid #e2e8f0',
                            borderRadius: '16px',
                            padding: '18px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                            <div>
                              <h3 style={{ margin: '0 0 4px', fontSize: '1.2rem', color: '#0f172a' }}>{med.name}</h3>
                              <span style={{ background: '#e0f2fe', color: '#0369a1', fontWeight: 700, fontSize: '0.9rem', padding: '3px 8px', borderRadius: '6px' }}>
                                {med.dosage}
                              </span>
                            </div>
                            <span style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.85rem', fontWeight: 600, padding: '3px 8px', borderRadius: '6px' }}>
                              {med.medicineType}
                            </span>
                          </div>

                          {med.purpose && (
                            <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569' }}>
                              <em>{med.purpose}</em>
                            </p>
                          )}

                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '0.85rem' }}>
                            <span style={{ background: '#fef3c7', color: '#92400e', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>
                              ⏰ {(med.reminderTimes || []).join(', ')}
                            </span>
                            <span style={{ background: '#ecfdf5', color: '#065f46', padding: '3px 8px', borderRadius: '6px', fontWeight: 600 }}>
                              🍽️ {med.foodTiming}
                            </span>
                            <span style={{ background: '#f8fafc', color: '#64748b', padding: '3px 8px', borderRadius: '6px' }}>
                              📅 {med.frequency}
                            </span>
                          </div>

                          <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                            <button
                              type="button"
                              onClick={() => handleOpenEditCaregiverMed(med)}
                              style={{ flex: 1, padding: '7px 12px', background: '#f0fdfa', border: '1px solid #99f6e4', color: '#0f766e', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                            >
                              ✏️ Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCaregiverDeleteMed(med.id, med.name)}
                              style={{ padding: '7px 12px', background: '#fff1f2', border: '1px solid #fecdd3', color: '#be123c', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                            >
                              🗑️ Remove
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </>
              )}
            </section>


            {/* Memory Vault Section */}
            <section className="caregiver-panel">
              <div className="caregiver-section-heading">
                <div>
                  <span className="caregiver-section-label">
                    AI Personal Memory Vault
                  </span>
                  <h2>
                    {linkedElderly.full_name}&apos;s Memories
                  </h2>
                </div>
                {memoryPermission.emergency_mode_enabled && (
                  <span style={{ padding: '6px 12px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontWeight: 800, fontSize: '0.85rem' }}>
                    🚨 Emergency Mode Active
                  </span>
                )}
              </div>

              {!memoryPermission.can_view ? (
                <div className="caregiver-empty caregiver-empty--small" style={{ background: '#fef7f5', borderColor: '#fed7aa' }}>
                  <span style={{ fontSize: '2rem' }}>🔒</span>
                  <h3 style={{ color: '#9a3412', marginTop: 8 }}>Memory Vault is Private</h3>
                  <p style={{ color: '#7c2d12', maxWidth: 480, margin: '6px auto 0' }}>
                    {linkedElderly.full_name} has not granted sharing access for their memories. They can grant permission anytime from their Memory Vault privacy settings.
                  </p>
                </div>
              ) : elderlyMemories.length === 0 ? (
                <div className="caregiver-empty caregiver-empty--small">
                  <p>No memories have been recorded yet.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginTop: '16px' }}>
                  {elderlyMemories.map((mem) => (
                    <article key={mem.id} style={{ background: '#ffffff', borderRadius: 16, border: '1px solid #e5e7eb', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: '#f3e8ff', color: '#6b21a8' }}>
                          {mem.category}
                        </span>
                        {mem.mood && (
                          <span style={{ fontSize: '0.8rem', color: '#b45309' }}>
                            {mem.mood}
                          </span>
                        )}
                      </div>
                      <h4 style={{ fontSize: '1.05rem', margin: '4px 0', color: '#111827' }}>{mem.title}</h4>
                      <p style={{ fontSize: '0.88rem', color: '#4b5563', lineHeight: 1.5, margin: 0 }}>
                        {mem.description.slice(0, 120)}
                        {mem.description.length > 120 ? '...' : ''}
                      </p>
                      {mem.aiSummary && (
                        <div style={{ fontSize: '0.82rem', color: '#9f1239', background: '#fff1f2', padding: '6px 10px', borderRadius: 8 }}>
                          ✨ {mem.aiSummary}
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#6b7280', marginTop: 'auto', paddingTop: '8px' }}>
                        <span>{mem.memoryDate ? new Date(mem.memoryDate).toLocaleDateString() : 'No date'}</span>
                        {mem.location && <span>📍 {mem.location}</span>}
                        {mem.audioData && <span>🎙️ Voice Note</span>}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>


            {/* Recent Activity */}

            <section className="caregiver-panel">

              <div className="caregiver-section-heading">

                <div>

                  <span className="caregiver-section-label">
                    {text.recentActivity}
                  </span>

                  <h2>
                    {text.recentActivity}
                  </h2>

                </div>

              </div>


              {recentSessions.length ===
                0 ? (

                <div className="caregiver-empty caregiver-empty--small">

                  <div className="caregiver-empty-icon caregiver-empty-icon--small">
                    <CaregiverIcon
                      type="sessions"
                    />
                  </div>

                  <p>
                    {text.noSessionsRecorded}
                  </p>

                </div>

              ) : (

                <div className="caregiver-table-wrapper">

                  <table className="caregiver-table">

                    <thead>
                      <tr>
                        <th>
                          {text.game}
                        </th>

                        <th>
                          {text.difficulty}
                        </th>

                        <th>
                          {text.accuracy}
                        </th>

                        <th>
                          {text.mistakes}
                        </th>

                        <th>
                          {text.time}
                        </th>

                        <th>
                          {text.date}
                        </th>
                      </tr>
                    </thead>


                    <tbody>

                      {recentSessions.map(
                        (session) => (
                          <tr
                            key={
                              session.id
                            }
                          >

                            <td>
                              {
                                getGameDisplayName(
                                  session.game,
                                )
                              }
                            </td>

                            <td>
                              {
                                session.difficulty
                              }
                            </td>

                            <td>
                              {
                                session.accuracy
                              }%
                            </td>

                            <td>
                              {
                                session.mistakes
                              }
                            </td>

                            <td>
                              {formatTime(
                                session.time,
                              )}
                            </td>

                            <td>
                              {formatDate(
                                session.created_at,
                              )}
                            </td>

                          </tr>
                        ),
                      )}

                    </tbody>

                  </table>

                </div>
              )}

            </section>

          </>
        )}

      {/* ----------------------------------------
          Caregiver Cognitive Progress Report Modal
          ---------------------------------------- */}
      {isReportModalOpen && (
        <div
          className="perf-modal-backdrop"
          onClick={() => setIsReportModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="perf-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '780px', width: '92%' }}
          >
            <div className="perf-modal-header">
              <div>
                <span className="perf-modal-tag">Approved Caregiver View</span>
                <h2 className="perf-modal-title">Cognitive Progress Report</h2>
                <p className="perf-modal-subtitle">
                  Patient: {linkedElderly?.full_name || 'Linked Patient'} · Period: {reportPeriod === '7d' ? '7 Days' : reportPeriod === '30d' ? '30 Days' : reportPeriod === '90d' ? '90 Days' : 'All History'}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'inline-flex', background: '#f3f4f6', borderRadius: '10px', padding: '3px' }}>
                  {['7d', '30d', '90d', 'all'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        setReportPeriod(p)
                        void fetchProgressReport(p)
                      }}
                      style={{
                        border: 'none',
                        background: reportPeriod === p ? '#ffffff' : 'transparent',
                        fontWeight: reportPeriod === p ? 700 : 500,
                        padding: '4px 10px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        boxShadow: reportPeriod === p ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                      }}
                    >
                      {p === 'all' ? 'All' : p}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  className="perf-modal-close"
                  onClick={() => setIsReportModalOpen(false)}
                  aria-label="Close modal"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="perf-modal-body">
              {reportLoading && (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <div className="perf-spinner" style={{ margin: '0 auto 16px' }} />
                  <p style={{ color: '#4b5563' }}>Loading approved cognitive progress report...</p>
                </div>
              )}

              {!reportLoading && reportRevoked && (
                <div style={{ background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '14px', padding: '24px', textAlign: 'center' }}>
                  <span style={{ fontSize: '2.4rem' }}>🔒</span>
                  <h3 style={{ color: '#991b1b', marginTop: '10px' }}>Report Access Revoked by Patient</h3>
                  <p style={{ color: '#7f1d1d', maxWidth: '500px', margin: '8px auto 0', lineHeight: 1.5 }}>
                    {linkedElderly?.full_name || 'The patient'} has currently paused progress report sharing with your caregiver account. Consent and privacy settings are controlled directly by the patient from their My Performance dashboard.
                  </p>
                </div>
              )}

              {!reportLoading && reportError && !reportRevoked && (
                <div style={{ background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '14px', padding: '20px', color: '#991b1b' }}>
                  <p>{reportError}</p>
                  <button
                    type="button"
                    className="perf-btn perf-btn--outline"
                    onClick={() => fetchProgressReport(reportPeriod)}
                    style={{ marginTop: '10px' }}
                  >
                    Retry
                  </button>
                </div>
              )}

              {!reportLoading && !reportRevoked && !reportError && progressReport && (
                <>
                  {/* Summary Callout */}
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '16px', marginBottom: '18px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Plain-Language Summary
                    </span>
                    <p style={{ margin: '6px 0 0', color: '#1e293b', fontSize: '0.98rem', lineHeight: 1.5 }}>
                      {progressReport.plain_language_summary}
                    </p>
                  </div>

                  {/* Core Metrics Bar */}
                  <div className="perf-modal-metrics">
                    <div className="perf-m-box">
                      <span>Completed</span>
                      <strong>{progressReport.overview.totalCompleted}</strong>
                    </div>
                    <div className="perf-m-box">
                      <span>Avg Accuracy</span>
                      <strong>{progressReport.overview.avgAccuracy}%</strong>
                    </div>
                    <div className="perf-m-box">
                      <span>Mistakes / Round</span>
                      <strong>{progressReport.overview.avgMistakes}</strong>
                    </div>
                    <div className="perf-m-box">
                      <span>Baseline Trend</span>
                      <strong className={`perf-status-txt--${progressReport.baselineComparison.overallStatus}`}>
                        {progressReport.baselineComparison.isReliable
                          ? progressReport.baselineComparison.overallStatus === 'improving'
                            ? '+ Improving'
                            : progressReport.baselineComparison.overallStatus === 'declining'
                            ? 'Variation Noted'
                            : 'Steady'
                          : 'Establishing'}
                      </strong>
                    </div>
                  </div>

                  {/* Clinical AI Insights */}
                  <div className="perf-modal-section">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <h3 className="perf-modal-sect-title" style={{ margin: 0 }}>✨ AI Performance Analysis</h3>
                      <span style={{ fontSize: '0.78rem', background: '#f3e8ff', color: '#6b21a8', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>
                        {progressReport.ai_analysis?.is_ai_powered ? '🤖 Gemini 3.8 Flash' : '🛡️ Assistive Clinical Engine'}
                      </span>
                    </div>

                    <p className="perf-modal-summary-text">
                      {progressReport.ai_analysis?.summary}
                    </p>

                    {progressReport.ai_analysis?.strengths && progressReport.ai_analysis.strengths.length > 0 && (
                      <div className="perf-modal-subbox">
                        <strong>Observed Strengths:</strong>
                        <ul>
                          {progressReport.ai_analysis.strengths.map((str, idx) => (
                            <li key={idx}>{str}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {progressReport.ai_analysis?.areas_to_practice && progressReport.ai_analysis.areas_to_practice.length > 0 && (
                      <div className="perf-modal-subbox">
                        <strong>Suggested Practice Focus:</strong>
                        <ul>
                          {progressReport.ai_analysis.areas_to_practice.map((area, idx) => (
                            <li key={idx}>{area}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Recommended Activity */}
                  <div className="perf-modal-section">
                    <h3 className="perf-modal-sect-title">🎯 Algorithmic Game Recommendation</h3>
                    <div className="perf-modal-rec-box">
                      <div>
                        <strong>{progressReport.recommendation?.game}</strong> ({progressReport.recommendation?.difficulty} Level)
                        <p>{progressReport.recommendation?.reason}</p>
                      </div>
                    </div>
                  </div>

                  {/* Disclaimer */}
                  <div className="perf-modal-disclaimer">
                    <small>🛡️ {progressReport.disclaimer}</small>
                  </div>
                </>
              )}
            </div>

            <div className="perf-modal-footer">
              <button
                type="button"
                className="perf-btn perf-btn--outline"
                onClick={handleCopyReport}
                disabled={!progressReport || reportRevoked}
              >
                {copiedReport ? '✓ Copied to Clipboard' : '📋 Copy Report Text'}
              </button>
              <button
                type="button"
                className="perf-btn perf-btn--primary"
                onClick={() => window.print()}
                disabled={!progressReport || reportRevoked}
              >
                🖨️ Print / Save PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------
          Caregiver Add/Edit Medication Modal
          ---------------------------------------- */}
      {isCaregiverMedModalOpen && (
        <div
          className="perf-modal-backdrop"
          onClick={() => setIsCaregiverMedModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="perf-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '600px', width: '92%' }}
          >
            <div className="perf-modal-header">
              <div>
                <span className="perf-modal-tag">Caregiver Authorization Active</span>
                <h2 className="perf-modal-title">
                  {editingPatientMedId ? 'Edit Medicine for Patient' : 'Add Medicine for Patient'}
                </h2>
                <p className="perf-modal-subtitle">
                  Patient: {linkedElderly?.full_name || 'Patient'}
                </p>
              </div>

              <button
                type="button"
                className="perf-modal-close"
                onClick={() => setIsCaregiverMedModalOpen(false)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCaregiverSaveMed} className="perf-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: '6px', color: '#1e293b' }}>
                  Medicine Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Metformin, Amlodipine"
                  value={caregiverMedForm.name}
                  onChange={(e) => setCaregiverMedForm((prev) => ({ ...prev, name: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '1rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: '6px', color: '#1e293b' }}>
                    Dosage *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 500 mg, 10 ml"
                    value={caregiverMedForm.dosage}
                    onChange={(e) => setCaregiverMedForm((prev) => ({ ...prev, dosage: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '1rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: '6px', color: '#1e293b' }}>
                    Type
                  </label>
                  <select
                    value={caregiverMedForm.medicineType}
                    onChange={(e) => setCaregiverMedForm((prev) => ({ ...prev, medicineType: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '1rem', background: '#fff', boxSizing: 'border-box' }}
                  >
                    <option value="Tablet">Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Syrup">Syrup</option>
                    <option value="Injection">Injection</option>
                    <option value="Drops">Drops</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: '6px', color: '#1e293b' }}>
                  Purpose / Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Blood sugar control, take with warm water"
                  value={caregiverMedForm.purpose}
                  onChange={(e) => setCaregiverMedForm((prev) => ({ ...prev, purpose: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '1rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: '6px', color: '#1e293b' }}>
                    Frequency
                  </label>
                  <select
                    value={caregiverMedForm.frequency}
                    onChange={(e) => setCaregiverMedForm((prev) => ({ ...prev, frequency: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '1rem', background: '#fff', boxSizing: 'border-box' }}
                  >
                    <option value="Once Daily">Once Daily</option>
                    <option value="Twice Daily">Twice Daily</option>
                    <option value="Three Times Daily">Three Times Daily</option>
                    <option value="Every X Hours">Every X Hours</option>
                    <option value="Specific Days of Week">Specific Days of Week</option>
                    <option value="Custom Times">Custom Times</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: '6px', color: '#1e293b' }}>
                    Food Timing
                  </label>
                  <select
                    value={caregiverMedForm.foodTiming}
                    onChange={(e) => setCaregiverMedForm((prev) => ({ ...prev, foodTiming: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '1rem', background: '#fff', boxSizing: 'border-box' }}
                  >
                    <option value="After Food">After Food</option>
                    <option value="Before Food">Before Food</option>
                    <option value="With Food">With Food</option>
                    <option value="No Preference">No Preference</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: '6px', color: '#1e293b' }}>
                  Reminder Time(s)
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(caregiverMedForm.reminderTimes || ['09:00']).map((time, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="time"
                        required
                        value={time}
                        onChange={(e) => {
                          const val = e.target.value
                          setCaregiverMedForm((prev) => {
                            const updated = [...(prev.reminderTimes || ['09:00'])]
                            updated[idx] = val
                            return { ...prev, reminderTimes: updated }
                          })
                        }}
                        style={{ padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '1rem' }}
                      />
                      {(caregiverMedForm.reminderTimes || []).length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setCaregiverMedForm((prev) => ({
                              ...prev,
                              reminderTimes: prev.reminderTimes.filter((_, i) => i !== idx),
                            }))
                          }}
                          style={{ padding: '6px 10px', background: '#fff1f2', border: '1px solid #fecdd3', color: '#be123c', borderRadius: '8px', cursor: 'pointer' }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setCaregiverMedForm((prev) => ({
                        ...prev,
                        reminderTimes: [...(prev.reminderTimes || ['09:00']), '14:00'],
                      }))
                    }}
                    style={{ alignSelf: 'flex-start', padding: '6px 12px', background: '#f0fdfa', border: '1px solid #99f6e4', color: '#0f766e', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    + Add Another Reminder Time
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #e2e8f0' }}>
                <button
                  type="button"
                  className="perf-btn perf-btn--outline"
                  onClick={() => setIsCaregiverMedModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="perf-btn perf-btn--primary"
                  style={{ background: '#0d9488', borderColor: '#0d9488' }}
                >
                  {editingPatientMedId ? 'Update Medication' : 'Save Medication'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}


export default CaregiverDashboard