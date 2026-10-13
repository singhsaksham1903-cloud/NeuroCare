import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

import './MemoryVault.css'
import VoiceReadAloud from '../../Components/VoiceReadAloud'
import {
  apiDelete,
  apiGet,
  apiPost,
  apiPut,
} from '../../utils/api'

// Image compression constants
const MAX_IMAGE_FILE_SIZE = 5 * 1024 * 1024
const MAX_IMAGE_DIMENSION = 1200
const IMAGE_QUALITY = 0.82

function compressImage(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('Invalid image file'))
      return
    }
    if (file.size > MAX_IMAGE_FILE_SIZE) {
      reject(new Error('Image must be under 5MB'))
      return
    }
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Failed to read image'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Failed to decode image'))
      img.onload = () => {
        const longest = Math.max(img.naturalWidth, img.naturalHeight)
        const scale = Math.min(1, MAX_IMAGE_DIMENSION / longest)
        const w = Math.max(1, Math.round(img.naturalWidth * scale))
        const h = Math.max(1, Math.round(img.naturalHeight * scale))
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('Canvas error'))
        ctx.drawImage(img, 0, 0, w, h)
        let dataUrl
        try {
          dataUrl = canvas.toDataURL('image/webp', IMAGE_QUALITY)
        } catch {
          dataUrl = ''
        }
        if (!dataUrl || dataUrl === 'data:image/webp,') {
          dataUrl = canvas.toDataURL('image/jpeg', IMAGE_QUALITY)
        }
        resolve(dataUrl)
      }
      img.src = String(reader.result || '')
    }
    reader.readAsDataURL(file)
  })
}

export default function MemoryVault({
  text,
  language = 'en-IN',
  readAloudLabel = 'Read Aloud',
  stopReadingLabel = 'Stop Reading',
  onBack,
  user,
  initialTab = 'vault',
}) {
  const [activeTab, setActiveTab] = useState(initialTab || 'vault')
  const [memories, setMemories] = useState([])
  const [timelineData, setTimelineData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [isVoiceSearching, setIsVoiceSearching] = useState(false)

  // Create / Edit state
  const [editingId, setEditingId] = useState(null)
  const [formTitle, setFormTitle] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formCategory, setFormCategory] = useState('Family')
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split('T')[0])
  const [formTime, setFormTime] = useState('10:00 AM')
  const [formLocation, setFormLocation] = useState('')
  const [formMood, setFormMood] = useState('Joyful')
  const [formImages, setFormImages] = useState([])
  const [formAudioData, setFormAudioData] = useState(null)
  const [formIsFavorite, setFormIsFavorite] = useState(false)
  const [isAiOrganizing, setIsAiOrganizing] = useState(false)
  const [aiPreviewData, setAiPreviewData] = useState(null)

  // Audio Recording state
  const [isRecordingAudio, setIsRecordingAudio] = useState(false)
  const [audioRecordingDuration, setAudioRecordingDuration] = useState(0)
  const [speechTranscript, setSpeechTranscript] = useState('')
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const recordingTimerRef = useRef(null)
  const speechRecognitionRef = useRef(null)

  // Selected memory modal / Detail view
  const [selectedMemory, setSelectedMemory] = useState(null)
  const [relatedMemories, setRelatedMemories] = useState([])

  // Caregiver Permissions & Audit
  const [permissions, setPermissions] = useState([])
  const [auditLogs, setAuditLogs] = useState([])

  // Text to speech narration state
  const [isNarrating, setIsNarrating] = useState(false)

  // Safely get translation helper
  const t = text || {}
  const categoriesList = [
    'All',
    'Family',
    'Travel',
    'Wedding',
    'Festival',
    'Birthday',
    'Childhood',
    'Daily Activity',
    'Medical',
    'Friends',
    'Other',
  ]
  const moodsList = ['Joyful', 'Peaceful', 'Nostalgic', 'Grateful', 'Excited', 'Reflective']

  // ============================================================
  // Load Memory Vault Data
  // ============================================================
  const loadVaultData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const data = await apiGet('/memories/vault')
      const items = Array.isArray(data?.memories) ? data.memories : []
      setMemories(items)

      // Also fetch timeline
      const tData = await apiGet('/memories/vault/timeline')
      if (tData?.timeline) {
        setTimelineData(tData.timeline)
      }

      // If user is elderly, load permissions & audit logs
      if (user?.role === 'elderly' || !user?.role) {
        try {
          const permData = await apiGet('/memories/vault/permissions')
          if (Array.isArray(permData?.permissions)) setPermissions(permData.permissions)
          const auditData = await apiGet('/memories/vault/audit-logs')
          if (Array.isArray(auditData?.logs)) setAuditLogs(auditData.logs)
        } catch {
          // Non-blocking
        }
      }
    } catch (err) {
      setError(err?.message || t.loadError || 'Could not load memory vault.')
    } finally {
      setLoading(false)
    }
  }, [t.loadError, user])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadVaultData()
    }, 0)

    return () => {
      window.clearTimeout(timer)
    }
  }, [loadVaultData])

  // ============================================================
  // Natural Language & Semantic Search
  // ============================================================
  const handleExecuteSearch = async (queryText) => {
    const q = queryText !== undefined ? queryText : searchQuery
    if (!q || !q.trim()) {
      setSearchResults(null)
      return
    }
    try {
      setLoading(true)
      setError('')
      const resp = await apiPost('/memories/vault/search', { query: q })
      setSearchResults(resp?.results || [])
      setSearchQuery(q)
    } catch (err) {
      setError(err?.message || 'Search failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Voice Search Trigger
  const handleStartVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type your search query.')
      return
    }

    try {
      const recognition = new SpeechRecognition()
      const langCode = String(language).startsWith('hi')
        ? 'hi-IN'
        : String(language).startsWith('as')
        ? 'as-IN'
        : 'en-IN'
      recognition.lang = langCode
      recognition.continuous = false
      recognition.interimResults = false

      recognition.onstart = () => {
        setIsVoiceSearching(true)
        setError('')
      }
      recognition.onresult = (evt) => {
        const transcript = evt.results?.[0]?.[0]?.transcript?.trim()
        if (transcript) {
          setSearchQuery(transcript)
          void handleExecuteSearch(transcript)
        }
      }
      recognition.onerror = () => {
        setIsVoiceSearching(false)
      }
      recognition.onend = () => {
        setIsVoiceSearching(false)
      }
      recognition.start()
    } catch {
      setIsVoiceSearching(false)
    }
  }

  // ============================================================
  // Audio Recording (MediaRecorder + Web Speech API)
  // ============================================================
  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioChunksRef.current = []
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data)
        }
      }

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const reader = new FileReader()
        reader.onloadend = () => {
          setFormAudioData(reader.result)
        }
        reader.readAsDataURL(audioBlob)
        stream.getTracks().forEach((track) => track.stop())
      }

      recorder.start()
      setIsRecordingAudio(true)
      setAudioRecordingDuration(0)

      recordingTimerRef.current = setInterval(() => {
        setAudioRecordingDuration((prev) => prev + 1)
      }, 1000)

      // Simultaneous Speech-to-Text Transcription
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition()
          const langCode = String(language).startsWith('hi')
            ? 'hi-IN'
            : String(language).startsWith('as')
            ? 'as-IN'
            : 'en-IN'
          recognition.lang = langCode
          recognition.continuous = true
          recognition.interimResults = true

          recognition.onresult = (evt) => {
            let fullTranscript = ''
            for (let i = 0; i < evt.results.length; i++) {
              fullTranscript += evt.results[i][0].transcript + ' '
            }
            const clean = fullTranscript.trim()
            setSpeechTranscript(clean)
            if (!formDescription || formDescription.length < clean.length) {
              setFormDescription(clean)
            }
          }
          recognition.start()
          speechRecognitionRef.current = recognition
        } catch {
          // Non-blocking fallback
        }
      }
    } catch {
      alert('Could not access microphone. Please ensure microphone permissions are granted.')
    }
  }

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && isRecordingAudio) {
      mediaRecorderRef.current.stop()
    }
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop()
      } catch {
        // ignore
      }
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current)
    }
    setIsRecordingAudio(false)
  }

  // ============================================================
  // Image Upload Handling
  // ============================================================
  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    for (const file of files) {
      try {
        const compressed = await compressImage(file)
        setFormImages((prev) => [...prev, compressed])
      } catch (err) {
        alert(err.message || 'Could not process image')
      }
    }
  }

  const removeImageAt = (index) => {
    setFormImages((prev) => prev.filter((_, i) => i !== index))
  }

  // ============================================================
  // Live AI Auto-Organization Preview
  // ============================================================
  const triggerAiAutoOrganize = async () => {
    if (!formDescription && !formTitle) {
      alert('Please speak or type a memory story first to run AI organization.')
      return
    }
    try {
      setIsAiOrganizing(true)
      const res = await apiPost('/memories/vault/ai-analyze', {
        text: formDescription,
        title: formTitle,
        category: formCategory,
        location: formLocation,
        mood: formMood,
      })
      if (res) {
        setAiPreviewData(res)
        if (!formTitle && res.title) setFormTitle(res.title)
        if (res.category) setFormCategory(res.category)
        if (res.location && !formLocation) setFormLocation(res.location)
        if (res.mood) setFormMood(res.mood)
      }
    } catch (err) {
      console.warn('AI analysis preview failed', err)
    } finally {
      setIsAiOrganizing(false)
    }
  }

  // ============================================================
  // Save or Update Memory
  // ============================================================
  const handleSaveMemory = async (e) => {
    e.preventDefault()
    if (!formDescription.trim() && !formTitle.trim() && !formAudioData && formImages.length === 0) {
      setError(t.validationError || 'Please enter a story, record voice, or upload a photo.')
      return
    }

    try {
      setLoading(true)
      setError('')
      const payload = {
        title: formTitle.trim(),
        description: formDescription.trim(),
        category: formCategory,
        memoryDate: formDate,
        memoryTime: formTime,
        location: formLocation.trim() || null,
        mood: formMood,
        images: formImages,
        imageData: formImages[0] || null,
        audioData: formAudioData,
        isFavorite: formIsFavorite,
      }

      if (editingId) {
        await apiPut(`/memories/vault/${editingId}`, payload)
        setSuccessMessage(t.updateSuccess || 'Memory updated successfully.')
      } else {
        await apiPost('/memories/vault', payload)
        setSuccessMessage(t.saveSuccess || 'Memory saved and organized with AI successfully.')
      }

      // Reset form
      resetForm()
      setActiveTab('vault')
      await loadVaultData()
    } catch (err) {
      setError(err?.message || t.saveError || 'Could not save memory.')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setEditingId(null)
    setFormTitle('')
    setFormDescription('')
    setFormCategory('Family')
    setFormDate(new Date().toISOString().split('T')[0])
    setFormTime('10:00 AM')
    setFormLocation('')
    setFormMood('Joyful')
    setFormImages([])
    setFormAudioData(null)
    setFormIsFavorite(false)
    setSpeechTranscript('')
    setAiPreviewData(null)
  }

  const startEditMemory = (mem) => {
    setEditingId(mem.id)
    setFormTitle(mem.title || '')
    setFormDescription(mem.description || '')
    setFormCategory(mem.category || 'Family')
    setFormDate(mem.memory_date || new Date().toISOString().split('T')[0])
    setFormTime(mem.memory_time || '10:00 AM')
    setFormLocation(mem.location || '')
    setFormMood(mem.mood || 'Joyful')
    setFormImages(mem.images || (mem.image_data ? [mem.image_data] : []))
    setFormAudioData(mem.audio_data || null)
    setFormIsFavorite(Boolean(mem.is_favorite))
    setActiveTab('add')
  }

  const handleDeleteMemory = async (id) => {
    const memoryId = id !== undefined && id !== null ? id : selectedMemory?.id
    if (memoryId === undefined || memoryId === null) return

    try {
      setLoading(true)
      setError('')

      // Close memory modal immediately
      setSelectedMemory(null)

      // Immediately purge from all active React states
      setMemories((prev) => prev.filter((m) => String(m.id) !== String(memoryId)))
      setTimelineData((prev) => {
        if (!prev) return prev
        return {
          today: (prev.today || []).filter((m) => String(m.id) !== String(memoryId)),
          this_week: (prev.this_week || []).filter((m) => String(m.id) !== String(memoryId)),
          this_month: (prev.this_month || []).filter((m) => String(m.id) !== String(memoryId)),
          this_year: (prev.this_year || []).filter((m) => String(m.id) !== String(memoryId)),
          older: (prev.older || []).filter((m) => String(m.id) !== String(memoryId)),
        }
      })
      setSearchResults((prev) => (prev ? prev.filter((m) => String(m.id) !== String(memoryId)) : null))

      // Delete via API
      let deleted = false
      try {
        await apiDelete(`/memories/vault/${memoryId}`)
        deleted = true
      } catch (vaultErr) {
        console.warn('apiDelete /memories/vault/:id error, trying fallback', vaultErr)
      }

      if (!deleted) {
        try {
          await apiDelete(`/memories/${memoryId}`)
          deleted = true
        } catch (legacyErr) {
          console.warn('apiDelete /memories/:id error', legacyErr)
        }
      }

      setSuccessMessage(t.deleteSuccess || 'Memory deleted permanently.')
      await loadVaultData()
    } catch (err) {
      console.error('Delete error', err)
      setError(err?.message || t.deleteError || 'Could not delete memory.')
      await loadVaultData()
    } finally {
      setLoading(false)
    }
  }

  const handleToggleFavorite = async (id, e) => {
    e?.stopPropagation()
    try {
      const res = await apiPost(`/memories/vault/${id}/favorite`, {})
      setMemories((prev) =>
        prev.map((m) => (m.id === id ? { ...m, is_favorite: res.is_favorite } : m))
      )
      if (selectedMemory?.id === id) {
        setSelectedMemory((prev) => ({ ...prev, is_favorite: res.is_favorite }))
      }
    } catch (err) {
      console.warn('Failed to toggle favorite', err)
    }
  }

  // ============================================================
  // Memory Details & Related Memories
  // ============================================================
  const openMemoryDetail = async (mem) => {
    setSelectedMemory(mem)
    try {
      const data = await apiGet(`/memories/vault/${mem.id}`)
      if (data?.related_memories) {
        setRelatedMemories(data.related_memories)
      }
    } catch {
      setRelatedMemories([])
    }
  }

  // ============================================================
  // Audio Narration (TTS)
  // ============================================================
  const narrateMemory = (mem, e) => {
    e?.stopPropagation()
    if (!window.speechSynthesis) {
      alert('Speech synthesis is not supported on this device.')
      return
    }

    if (isNarrating) {
      window.speechSynthesis.cancel()
      setIsNarrating(false)
      return
    }

    window.speechSynthesis.cancel()
    const narrativeText = `${mem.title}. ${mem.memory_date ? 'Date: ' + mem.memory_date + '. ' : ''}${
      mem.location ? 'Location: ' + mem.location + '. ' : ''
    }${mem.mood ? 'Mood: ' + mem.mood + '. ' : ''}${mem.description}. ${
      mem.summary ? 'Reflection: ' + mem.summary : ''
    }`

    const utterance = new SpeechSynthesisUtterance(narrativeText)
    const langCode = String(language).startsWith('hi')
      ? 'hi-IN'
      : String(language).startsWith('as')
      ? 'as-IN'
      : 'en-IN'
    utterance.lang = langCode
    utterance.rate = 0.9 // gentle, relaxed pace for elder clarity
    utterance.pitch = 1.0

    utterance.onstart = () => setIsNarrating(true)
    utterance.onend = () => setIsNarrating(false)
    utterance.onerror = () => setIsNarrating(false)

    window.speechSynthesis.speak(utterance)
  }

  // ============================================================
  // Caregiver Permissions Management
  // ============================================================
  const handleUpdateCaregiverPermission = async (caregiverId, updates) => {
    try {
      await apiPut(`/memories/vault/permissions/${caregiverId}`, updates)
      setPermissions((prev) =>
        prev.map((p) => (p.caregiver_id === caregiverId ? { ...p, ...updates } : p))
      )
      // Refresh audit logs
      const auditData = await apiGet('/memories/vault/audit-logs')
      if (Array.isArray(auditData?.logs)) setAuditLogs(auditData.logs)
      setSuccessMessage('Caregiver permissions updated and audit trail recorded.')
    } catch (err) {
      setError(err?.message || 'Could not update permissions.')
    }
  }

  // ============================================================
  // Filtered Memories computation
  // ============================================================
  const displayMemories = (searchResults !== null ? searchResults : memories).filter((m) => {
    if (favoritesOnly && !m.is_favorite) return false
    if (selectedCategory !== 'All' && m.category !== selectedCategory) return false
    return true
  })

  return (
    <div className="memory-vault-container">
      {/* ----------------------------------------------------
          Header & Title Bar
          ---------------------------------------------------- */}
      <header className="vault-header">
        <div className="vault-top-row">
          <div className="vault-title-wrap">
            <div className="vault-icon-badge" aria-hidden="true">
              <svg viewBox="0 0 48 48" fill="none" width="36" height="36">
                <rect x="6" y="8" width="36" height="32" rx="8" stroke="currentColor" strokeWidth="3" />
                <path d="M14 18H34M14 26H28M14 34H22" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                <circle cx="34" cy="28" r="4" fill="currentColor" />
              </svg>
            </div>
            <div>
              <h1 className="vault-title">{t.vaultTitle || 'AI-Assisted Personal Memory Vault'}</h1>
              <p className="vault-subtitle">
                {t.vaultSubtitle ||
                  'Your safe haven for cherished life stories, family moments, voice memories, and photos.'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <VoiceReadAloud
              text={`${t.vaultTitle || 'Memory Vault'}. ${t.vaultSubtitle || ''}`}
              language={language}
              label={readAloudLabel}
              stopLabel={stopReadingLabel}
            />
            {onBack && (
              <button type="button" className="vault-back-btn" onClick={onBack}>
                ← {t.backToDashboard || 'Back to Dashboard'}
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="vault-nav-tabs" aria-label="Memory Vault Views">
          <button
            type="button"
            className={`vault-tab-btn ${activeTab === 'vault' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('vault')
              setSearchResults(null)
            }}
          >
            🏛️ {t.tabs?.vault || 'Memory Vault'} ({memories.length})
          </button>
          <button
            type="button"
            className={`vault-tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
            onClick={() => setActiveTab('timeline')}
          >
            📅 {t.tabs?.timeline || 'Photo Timeline'}
          </button>
          <button
            type="button"
            className={`vault-tab-btn ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => setActiveTab('search')}
          >
            🔍 {t.tabs?.search || 'Voice & Semantic Search'}
          </button>
          <button
            type="button"
            className={`vault-tab-btn ${activeTab === 'add' ? 'active' : ''}`}
            onClick={() => {
              resetForm()
              setActiveTab('add')
            }}
          >
            ➕ {t.tabs?.add || 'Create Memory'}
          </button>
          {user?.role === 'elderly' && (
            <button
              type="button"
              className={`vault-tab-btn ${activeTab === 'privacy' ? 'active' : ''}`}
              onClick={() => setActiveTab('privacy')}
            >
              🛡️ {t.tabs?.privacy || 'Caregiver Privacy & Access'}
            </button>
          )}
        </nav>
      </header>

      {/* Messages */}
      {error && (
        <div style={{ padding: '16px 20px', borderRadius: '14px', background: '#fee2e2', color: '#991b1b', fontWeight: '600' }}>
          ⚠️ {error}
        </div>
      )}
      {successMessage && (
        <div style={{ padding: '16px 20px', borderRadius: '14px', background: '#dcfce7', color: '#166534', fontWeight: '600' }}>
          ✅ {successMessage}
        </div>
      )}

      {/* ====================================================
          TAB 1: VAULT CARDS GALLERY
          ==================================================== */}
      {activeTab === 'vault' && (
        <>
          {/* Quick Filters */}
          <div className="vault-filter-bar">
            <div className="vault-category-chips">
              {categoriesList.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  className={`vault-filter-chip ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {t.categories?.[cat] || cat}
                </button>
              ))}
            </div>

            <button
              type="button"
              className={`vault-fav-toggle ${favoritesOnly ? 'active' : ''}`}
              onClick={() => setFavoritesOnly(!favoritesOnly)}
            >
              ⭐ {favoritesOnly ? t.favoritesOnly || 'Favorites' : t.allMemories || 'All'}
            </button>
          </div>

          {/* Cards Grid */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', fontSize: '18px', color: '#64748b' }}>
              ⏳ {t.loadingMemories || 'Loading your memories...'}
            </div>
          ) : displayMemories.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: '#ffffff', borderRadius: '22px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🌸</div>
              <h2 style={{ fontSize: '22px', color: '#1f2937' }}>{t.noMemories || 'No memories found.'}</h2>
              <p style={{ color: '#64748b', marginBottom: '20px' }}>
                Tap below to record or write your first cherished memory.
              </p>
              <button
                type="button"
                className="vault-action-btn vault-action-btn--primary"
                style={{ maxWidth: '240px', margin: '0 auto' }}
                onClick={() => {
                  resetForm()
                  setActiveTab('add')
                }}
              >
                ➕ {t.tabs?.add || 'Create Memory'}
              </button>
            </div>
          ) : (
            <div className="vault-grid">
              {displayMemories.map((mem) => {
                const cover = mem.images?.[0] || mem.image_data || null
                return (
                  <article key={mem.id} className="vault-card" onClick={() => openMemoryDetail(mem)}>
                    <div className="vault-card-media">
                      {cover ? (
                        <img src={cover} alt={mem.title} className="vault-card-img" />
                      ) : (
                        <div className="vault-card-placeholder">
                          <svg viewBox="0 0 48 48" fill="none" width="48" height="48">
                            <rect x="8" y="10" width="32" height="28" rx="6" stroke="currentColor" strokeWidth="2.5" />
                            <circle cx="20" cy="22" r="4" stroke="currentColor" strokeWidth="2.5" />
                            <path d="M12 34L22 24L30 31L36 26" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                          </svg>
                          <span style={{ fontSize: '13px', fontWeight: '600' }}>{mem.category}</span>
                        </div>
                      )}

                      {mem.similarityScore !== undefined && (
                        <span className="vault-card-score-badge">
                          ✨ {Math.round(mem.similarityScore * 100)}% {t.similarityMatch || 'Match'}
                        </span>
                      )}

                      <button
                        type="button"
                        className={`vault-card-fav-btn ${mem.is_favorite ? 'is-fav' : ''}`}
                        title={mem.is_favorite ? 'Favorite' : 'Add to Favorites'}
                        onClick={(e) => handleToggleFavorite(mem.id, e)}
                        aria-label="Toggle Favorite"
                      >
                        ★
                      </button>
                    </div>

                    <div className="vault-card-body">
                      <div className="vault-card-meta-row">
                        <span className={`vault-badge vault-badge--${mem.category || 'General'}`}>
                          {t.categories?.[mem.category] || mem.category}
                        </span>
                        {mem.mood && (
                          <span className="vault-mood-badge">
                            {mem.mood === 'Joyful'
                              ? '😊 '
                              : mem.mood === 'Peaceful'
                              ? '🕊️ '
                              : mem.mood === 'Nostalgic'
                              ? '📻 '
                              : mem.mood === 'Grateful'
                              ? '🙏 '
                              : mem.mood === 'Excited'
                              ? '🎉 '
                              : '💭 '}
                            {t.moods?.[mem.mood] || mem.mood}
                          </span>
                        )}
                      </div>

                      <h2 className="vault-card-title">{mem.title}</h2>

                      <div className="vault-card-date-loc">
                        <span>🗓️ {mem.memory_date || t.noDate || 'No date'}</span>
                        {mem.location && <span className="vault-card-loc">📍 {mem.location}</span>}
                      </div>

                      <p className="vault-card-desc">{mem.description}</p>

                      {mem.summary && (
                        <div className="vault-card-ai-summary">
                          💡 {mem.summary}
                        </div>
                      )}

                      {mem.tags && mem.tags.length > 0 && (
                        <div className="vault-card-tags">
                          {mem.tags.slice(0, 4).map((tag, idx) => (
                            <span key={idx} className="vault-tag-chip">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="vault-card-actions">
                        <button
                          type="button"
                          className="vault-action-btn vault-action-btn--primary"
                          onClick={(e) => {
                            e.stopPropagation()
                            openMemoryDetail(mem)
                          }}
                        >
                          📖 {t.viewDetails || 'View Story'}
                        </button>
                        <button
                          type="button"
                          className="vault-action-btn vault-action-btn--listen"
                          onClick={(e) => narrateMemory(mem, e)}
                          title="Listen to Memory narration"
                        >
                          🔊 {isNarrating ? t.stopListen || 'Stop' : t.listenMemory || 'Listen'}
                        </button>
                        <button
                          type="button"
                          className="vault-action-btn"
                          style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', padding: '0 12px' }}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteMemory(mem.id)
                          }}
                          title="Delete memory"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ====================================================
          TAB 2: PHOTO TIMELINE VIEW
          ==================================================== */}
      {activeTab === 'timeline' && (
        <div className="vault-timeline-container">
          {!timelineData ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
              ⏳ Loading timeline...
            </div>
          ) : (
            <>
              {[
                { key: 'today', label: t.timelineToday || 'Today', items: timelineData.today },
                { key: 'this_week', label: t.timelineThisWeek || 'This Week', items: timelineData.this_week },
                { key: 'this_month', label: t.timelineThisMonth || 'This Month', items: timelineData.this_month },
                { key: 'this_year', label: t.timelineThisYear || 'This Year', items: timelineData.this_year },
                { key: 'older', label: t.timelineOlder || 'Older Cherished Moments', items: timelineData.older },
              ].map(
                (grp) =>
                  grp.items &&
                  grp.items.length > 0 && (
                    <section key={grp.key} className="vault-timeline-group">
                      <div className="vault-timeline-header">
                        <span className="vault-timeline-dot" aria-hidden="true" />
                        <h2 className="vault-timeline-heading">{grp.label}</h2>
                        <span className="vault-timeline-count">
                          ({grp.items.length} {grp.items.length === 1 ? t.memory || 'memory' : t.memoriesPlural || 'memories'})
                        </span>
                      </div>

                      <div className="vault-grid">
                        {grp.items.map((mem) => (
                          <article key={mem.id} className="vault-card" onClick={() => openMemoryDetail(mem)}>
                            <div className="vault-card-media">
                              {mem.images?.[0] || mem.image_data ? (
                                <img
                                  src={mem.images?.[0] || mem.image_data}
                                  alt={mem.title}
                                  className="vault-card-img"
                                />
                              ) : (
                                <div className="vault-card-placeholder">
                                  <span>{mem.category}</span>
                                </div>
                              )}
                              <button
                                type="button"
                                className={`vault-card-fav-btn ${mem.is_favorite ? 'is-fav' : ''}`}
                                onClick={(e) => handleToggleFavorite(mem.id, e)}
                              >
                                ★
                              </button>
                            </div>
                            <div className="vault-card-body">
                              <span className={`vault-badge vault-badge--${mem.category}`}>
                                {t.categories?.[mem.category] || mem.category}
                              </span>
                              <h3 className="vault-card-title">{mem.title}</h3>
                              <div className="vault-card-date-loc">
                                <span>🗓️ {mem.memory_date}</span>
                                {mem.location && <span>📍 {mem.location}</span>}
                              </div>
                              <p className="vault-card-desc">{mem.description}</p>
                              {mem.summary && (
                                <div className="vault-card-ai-summary">💡 {mem.summary}</div>
                              )}
                            </div>
                          </article>
                        ))}
                      </div>
                    </section>
                  )
              )}
            </>
          )}
        </div>
      )}

      {/* ====================================================
          TAB 3: NATURAL LANGUAGE & VOICE SEARCH
          ==================================================== */}
      {activeTab === 'search' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="vault-search-box">
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#1f2937', margin: 0 }}>
              🔍 {t.tabs?.search || 'Natural Language & Voice Search'}
            </h2>
            <p style={{ color: '#64748b', margin: 0, fontSize: '16px' }}>
              Ask naturally in your own words. The AI finds memories by meaning, events, people, and dates.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleExecuteSearch()
              }}
              className="vault-search-input-wrap"
            >
              <span className="vault-search-icon" aria-hidden="true">
                🔎
              </span>
              <input
                type="text"
                className="vault-search-input"
                placeholder={
                  t.searchPlaceholder ||
                  'Ask in your own words, e.g. "Trip to Shillong", "My daughter\'s wedding", "Last Diwali"...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="button"
                className={`vault-voice-search-btn ${isVoiceSearching ? 'listening' : ''}`}
                onClick={handleStartVoiceSearch}
                title="Tap to speak your query"
              >
                🎤 {isVoiceSearching ? t.voiceListening || 'Listening...' : t.voiceSearch || 'Speak Search'}
              </button>
              <button
                type="submit"
                className="vault-action-btn vault-action-btn--primary"
                style={{ minHeight: '54px', padding: '0 24px', borderRadius: '16px' }}
              >
                Search
              </button>
            </form>

            <div className="vault-sample-queries">
              <span className="vault-sample-label">{t.sampleSearches || 'Try asking:'}</span>
              {(
                t.sampleQueries || [
                  'Show memories from last Diwali',
                  "My daughter's wedding",
                  'Trip to Shillong',
                  'When did I visit Guwahati?',
                  'Show memories with Rahul',
                  'Show memories from 2024',
                ]
              ).map((query, idx) => (
                <button
                  type="button"
                  key={idx}
                  className="vault-sample-pill"
                  onClick={() => {
                    setSearchQuery(query)
                    handleExecuteSearch(query)
                  }}
                >
                  "{query}"
                </button>
              ))}
            </div>
          </div>

          {/* Search Results Display */}
          {searchResults !== null && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937', margin: 0 }}>
                  Found {searchResults.length} matching {searchResults.length === 1 ? 'memory' : 'memories'}
                </h3>
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: '#7357c7', fontWeight: '600', cursor: 'pointer' }}
                  onClick={() => {
                    setSearchResults(null)
                    setSearchQuery('')
                  }}
                >
                  Clear Search
                </button>
              </div>

              {searchResults.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', background: '#ffffff', borderRadius: '18px' }}>
                  <p style={{ fontSize: '18px', color: '#64748b' }}>
                    No matching memories found for "{searchQuery}". Try a different topic or person's name.
                  </p>
                </div>
              ) : (
                <div className="vault-grid">
                  {searchResults.map((mem) => (
                    <article key={mem.id} className="vault-card" onClick={() => openMemoryDetail(mem)}>
                      <div className="vault-card-media">
                        {mem.images?.[0] || mem.image_data ? (
                          <img src={mem.images?.[0] || mem.image_data} alt={mem.title} className="vault-card-img" />
                        ) : (
                          <div className="vault-card-placeholder">
                            <span>{mem.category}</span>
                          </div>
                        )}
                        <span className="vault-card-score-badge">
                          ✨ {Math.round(mem.similarityScore * 100)}% Match
                        </span>
                      </div>
                      <div className="vault-card-body">
                        <span className={`vault-badge vault-badge--${mem.category}`}>{mem.category}</span>
                        <h3 className="vault-card-title">{mem.title}</h3>
                        <div className="vault-card-date-loc">
                          <span>🗓️ {mem.memory_date}</span>
                          {mem.location && <span>📍 {mem.location}</span>}
                        </div>
                        {mem.matchReason && (
                          <div style={{ fontSize: '13px', fontWeight: '600', color: '#059669', background: '#ecfdf5', padding: '4px 8px', borderRadius: '6px' }}>
                            🎯 {mem.matchReason}
                          </div>
                        )}
                        <p className="vault-card-desc">{mem.description}</p>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ====================================================
          TAB 4: CREATE / EDIT MEMORY
          ==================================================== */}
      {activeTab === 'add' && (
        <form className="vault-form-card" onSubmit={handleSaveMemory}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <h2 className="vault-form-section-title" style={{ fontSize: '24px', margin: 0 }}>
              {editingId ? t.editMemory || 'Edit Memory' : t.addMemory || 'Create a Cherished Memory'}
            </h2>
            <button
              type="button"
              className="vault-ai-organize-btn"
              onClick={triggerAiAutoOrganize}
              disabled={isAiOrganizing}
            >
              ✨ {isAiOrganizing ? t.aiOrganizing || 'AI Organizing...' : t.aiAutoOrganize || 'AI Auto-Organize'}
            </button>
          </div>

          {/* Voice Memory Creation Block */}
          <div className="vault-voice-creation-box">
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#6b21a8' }}>
              🎙️ {t.recordVoice || 'Record Voice Memory'}
            </h3>
            <p style={{ margin: 0, fontSize: '15px', color: '#581c87' }}>
              Speak in English, Hindi, or Assamese. The AI records your voice clip and transcribes it into text.
            </p>

            <button
              type="button"
              className={`vault-record-btn ${isRecordingAudio ? 'recording' : ''}`}
              onClick={isRecordingAudio ? stopAudioRecording : startAudioRecording}
            >
              {isRecordingAudio ? `⏹️ ${t.stopRecord || 'Finish Recording'} (${audioRecordingDuration}s)` : `🎤 ${t.recordVoice || 'Start Speaking'}`}
            </button>

            {/* Transcription Preview */}
            {(speechTranscript || isRecordingAudio) && (
              <div className="vault-transcript-preview">
                <span className="vault-transcript-header">
                  {t.speechToText || 'Speech Transcription Preview'}:
                </span>
                <span>{speechTranscript || t.transcribing || 'Listening to your voice...'}</span>
              </div>
            )}

            {/* Recorded Audio Playback */}
            {formAudioData && (
              <div className="vault-audio-player-wrap">
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#166534' }}>
                  🎵 {t.audioRecorded || 'Voice clip ready'}:
                </span>
                <audio controls src={formAudioData} style={{ height: '36px' }} />
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: '#dc2626', fontWeight: '600', cursor: 'pointer' }}
                  onClick={() => setFormAudioData(null)}
                >
                  ✕ {t.removeAudio || 'Remove'}
                </button>
              </div>
            )}
          </div>

          {/* Form Fields Grid */}
          <div className="vault-form-grid">
            <div className="vault-form-group">
              <label className="vault-form-label">{t.title || 'Title'}</label>
              <input
                type="text"
                className="vault-form-input"
                placeholder={t.titlePlaceholder || 'e.g. Trip to Shillong or leave empty for AI auto-title'}
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
              />
            </div>

            <div className="vault-form-group">
              <label className="vault-form-label">{t.category || 'Category'}</label>
              <select
                className="vault-form-select"
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
              >
                {categoriesList.filter((c) => c !== 'All').map((cat) => (
                  <option key={cat} value={cat}>
                    {t.categories?.[cat] || cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="vault-form-group">
              <label className="vault-form-label">{t.memoryDate || 'Date'}</label>
              <input
                type="date"
                className="vault-form-input"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
              />
            </div>

            <div className="vault-form-group">
              <label className="vault-form-label">{t.detectedLocation || 'Location (Optional)'}</label>
              <input
                type="text"
                className="vault-form-input"
                placeholder="e.g. Shillong, Guwahati, Veranda"
                value={formLocation}
                onChange={(e) => setFormLocation(e.target.value)}
              />
            </div>

            <div className="vault-form-group">
              <label className="vault-form-label">{t.mood || 'Mood & Atmosphere'}</label>
              <select
                className="vault-form-select"
                value={formMood}
                onChange={(e) => setFormMood(e.target.value)}
              >
                {moodsList.map((m) => (
                  <option key={m} value={m}>
                    {t.moods?.[m] || m}
                  </option>
                ))}
              </select>
            </div>

            <div className="vault-form-group" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px', marginTop: '28px' }}>
              <input
                type="checkbox"
                id="fav-check"
                checked={formIsFavorite}
                onChange={(e) => setFormIsFavorite(e.target.checked)}
                style={{ width: '22px', height: '22px' }}
              />
              <label htmlFor="fav-check" style={{ fontSize: '16px', fontWeight: '700', cursor: 'pointer' }}>
                ⭐ {t.favorite || 'Mark as Favorite'}
              </label>
            </div>
          </div>

          {/* Description Textarea */}
          <div className="vault-form-group">
            <label className="vault-form-label">{t.description || 'Full Story & Details'}</label>
            <textarea
              className="vault-form-textarea"
              placeholder={t.descriptionPlaceholder || 'Share the story, what happened, who was there, and how you felt...'}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
            />
          </div>

          {/* AI Metadata Preview Box */}
          {aiPreviewData && (
            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '14px', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontWeight: '700', color: '#166534', fontSize: '15px' }}>
                ✨ {t.aiSummary || 'AI Organization Preview'}:
              </div>
              <div style={{ fontSize: '14px', color: '#14532d' }}>
                <strong>Detected People:</strong> {aiPreviewData.people?.join(', ') || 'Family'}
              </div>
              <div style={{ fontSize: '14px', color: '#14532d' }}>
                <strong>AI Tags:</strong> {aiPreviewData.tags?.join(', ')}
              </div>
              <div style={{ fontSize: '14px', color: '#14532d' }}>
                <strong>Reflection:</strong> <em>"{aiPreviewData.summary}"</em>
              </div>
            </div>
          )}

          {/* Photo Upload Area */}
          <div className="vault-photo-upload-area">
            <label className="vault-form-label">📸 {t.photos || 'Photos (Upload one or more)'}</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoUpload}
              style={{ fontSize: '16px' }}
            />
            {formImages.length > 0 && (
              <div className="vault-photo-thumbnails">
                {formImages.map((img, idx) => (
                  <div key={idx} className="vault-thumbnail-wrap">
                    <img src={img} alt={`Upload ${idx}`} className="vault-thumbnail-img" />
                    <button
                      type="button"
                      className="vault-thumbnail-remove"
                      onClick={() => removeImageAt(idx)}
                      title="Remove image"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '14px', marginTop: '12px' }}>
            <button
              type="submit"
              className="vault-action-btn vault-action-btn--primary"
              style={{ minHeight: '52px', fontSize: '17px' }}
            >
              💾 {editingId ? t.updateMemory || 'Update Memory' : t.saveMemory || 'Save to Vault'}
            </button>
            <button
              type="button"
              className="vault-action-btn"
              style={{ background: '#f1f5f9', border: '1px solid #cbd5e1' }}
              onClick={() => {
                resetForm()
                setActiveTab('vault')
              }}
            >
              {t.cancelEdit || 'Cancel'}
            </button>
          </div>
        </form>
      )}

      {/* ====================================================
          TAB 5: CAREGIVER PERMISSIONS & PRIVACY
          ==================================================== */}
      {activeTab === 'privacy' && (
        <div className="vault-privacy-panel">
          <div className="vault-permission-card">
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#1f2937', margin: 0 }}>
              🛡️ {t.caregiverPermissions || 'Caregiver Access & Permissions'}
            </h2>
            <p style={{ color: '#64748b', margin: 0, fontSize: '16px' }}>
              {t.permissionExplanation ||
                'Caregivers can ONLY view your memory vault when you explicitly grant permission. You can revoke access at any time.'}
            </p>

            {permissions.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', background: '#f8fafc', borderRadius: '14px', color: '#64748b' }}>
                No caregivers currently connected. Connect a caregiver in Caregiver Connections to manage permissions.
              </div>
            ) : (
              permissions.map((perm) => (
                <div key={perm.caregiver_id} style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <div>
                      <strong style={{ fontSize: '18px', color: '#1f2937' }}>{perm.caregiver_name}</strong>
                      <div style={{ fontSize: '14px', color: '#64748b' }}>{perm.caregiver_email}</div>
                    </div>
                    <span style={{ fontSize: '13px', padding: '4px 10px', borderRadius: '20px', background: perm.can_view ? '#dcfce7' : '#fee2e2', color: perm.can_view ? '#166534' : '#991b1b', fontWeight: '700' }}>
                      {perm.can_view ? 'Access Granted' : 'Access Restricted'}
                    </span>
                  </div>

                  <div className="vault-permission-row">
                    <span>👁️ {t.allowViewing || 'Allow Caregiver to view Memory Vault'}</span>
                    <label className="vault-toggle-switch">
                      <input
                        type="checkbox"
                        checked={perm.can_view}
                        onChange={(e) =>
                          handleUpdateCaregiverPermission(perm.caregiver_id, { can_view: e.target.checked })
                        }
                      />
                      <span className="vault-slider" />
                    </label>
                  </div>

                  <div className="vault-permission-row">
                    <span>🔊 {t.allowListening || 'Allow Caregiver to listen to audio narrations'}</span>
                    <label className="vault-toggle-switch">
                      <input
                        type="checkbox"
                        checked={perm.can_listen}
                        onChange={(e) =>
                          handleUpdateCaregiverPermission(perm.caregiver_id, { can_listen: e.target.checked })
                        }
                      />
                      <span className="vault-slider" />
                    </label>
                  </div>

                  <div className="vault-permission-row">
                    <span>🚨 {t.allowEmergency || 'Emergency Access Mode (for health emergencies)'}</span>
                    <label className="vault-toggle-switch">
                      <input
                        type="checkbox"
                        checked={perm.emergency_mode_allowed}
                        onChange={(e) =>
                          handleUpdateCaregiverPermission(perm.caregiver_id, { emergency_mode_allowed: e.target.checked })
                        }
                      />
                      <span className="vault-slider" />
                    </label>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Audit Logs Table */}
          <div className="vault-permission-card">
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937', margin: 0 }}>
              📜 {t.auditTrail || 'Privacy & Security Audit Trail'}
            </h3>
            <p style={{ color: '#64748b', margin: 0, fontSize: '15px' }}>
              Every time someone accesses your memories, the date, time, and reason are logged here.
            </p>

            <div className="vault-audit-table-wrap">
              <table className="vault-audit-table">
                <thead>
                  <tr>
                    <th>{t.auditTime || 'Timestamp'}</th>
                    <th>{t.auditUser || 'Accessor'}</th>
                    <th>{t.auditAction || 'Action'}</th>
                    <th>{t.auditReason || 'Reason / Details'}</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                        {t.noAuditLogs || 'No access logs recorded yet.'}
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id}>
                        <td>{new Date(log.timestamp).toLocaleString()}</td>
                        <td>
                          <strong>{log.accessor_name}</strong> ({log.accessor_role})
                        </td>
                        <td>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '13px',
                              fontWeight: '600',
                              background: log.emergency ? '#fee2e2' : '#f1f5f9',
                              color: log.emergency ? '#dc2626' : '#334155',
                            }}
                          >
                            {log.action.replace('_', ' ')}
                            {log.emergency ? ' (EMERGENCY)' : ''}
                          </span>
                        </td>
                        <td>{log.reason || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================
          MEMORY DETAIL MODAL
          ==================================================== */}
      {selectedMemory && (
        <div className="vault-modal-overlay" onClick={() => setSelectedMemory(null)}>
          <div className="vault-modal-content" onClick={(e) => e.stopPropagation()}>
            <header className="vault-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className={`vault-badge vault-badge--${selectedMemory.category}`}>
                  {t.categories?.[selectedMemory.category] || selectedMemory.category}
                </span>
                {selectedMemory.mood && (
                  <span className="vault-mood-badge">
                    {t.moods?.[selectedMemory.mood] || selectedMemory.mood}
                  </span>
                )}
                {selectedMemory.is_favorite && <span style={{ color: '#f59e0b', fontSize: '18px' }}>★</span>}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="vault-action-btn vault-action-btn--listen"
                  onClick={(e) => narrateMemory(selectedMemory, e)}
                >
                  🔊 {isNarrating ? t.stopListen || 'Stop Narration' : t.listenMemory || 'Listen'}
                </button>
                <button
                  type="button"
                  className="vault-modal-close-btn"
                  onClick={() => setSelectedMemory(null)}
                  title="Close story"
                >
                  ✕
                </button>
              </div>
            </header>

            <div className="vault-modal-body">
              <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#1f2937', margin: 0 }}>
                {selectedMemory.title}
              </h2>

              <div style={{ display: 'flex', gap: '16px', color: '#64748b', fontSize: '15px', flexWrap: 'wrap' }}>
                <span>🗓️ {selectedMemory.memory_date || 'No date'}</span>
                {selectedMemory.memory_time && <span>⏰ {selectedMemory.memory_time}</span>}
                {selectedMemory.location && <span>📍 {selectedMemory.location}</span>}
              </div>

              {/* Photos Gallery */}
              {((selectedMemory.images && selectedMemory.images.length > 0) || selectedMemory.image_data) && (
                <div className="vault-modal-gallery">
                  {(selectedMemory.images?.length > 0
                    ? selectedMemory.images
                    : [selectedMemory.image_data]
                  ).map((img, idx) => (
                    <img key={idx} src={img} alt={`Memory ${idx}`} className="vault-modal-gallery-img" />
                  ))}
                </div>
              )}

              {/* Audio Playback */}
              {selectedMemory.audio_data && (
                <div style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <span style={{ fontSize: '16px', fontWeight: '700', color: '#7e22ce' }}>
                    🎙️ Voice Recording:
                  </span>
                  <audio controls src={selectedMemory.audio_data} style={{ flex: 1 }} />
                </div>
              )}

              {/* Full Story Narrative */}
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>
                  The Story
                </h3>
                <p className="vault-modal-story-text">{selectedMemory.description}</p>
              </div>

              {/* AI Reflection & Metadata */}
              {selectedMemory.summary && (
                <div className="vault-modal-ai-box">
                  <span className="vault-modal-ai-label">✨ {t.aiSummary || 'AI Memory Reflection'}</span>
                  <p className="vault-modal-ai-content">{selectedMemory.summary}</p>
                </div>
              )}

              {/* People & Tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {selectedMemory.people && selectedMemory.people.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#4b5563' }}>People:</span>
                    {selectedMemory.people.map((p, idx) => (
                      <span key={idx} style={{ padding: '3px 10px', borderRadius: '12px', background: '#dbeafe', color: '#1d4ed8', fontSize: '13px', fontWeight: '600' }}>
                        👤 {p}
                      </span>
                    ))}
                  </div>
                )}
                {selectedMemory.tags && selectedMemory.tags.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#4b5563' }}>Tags:</span>
                    {selectedMemory.tags.map((tg, idx) => (
                      <span key={idx} className="vault-tag-chip">
                        #{tg}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Related Memories ("You May Also Remember") */}
              {relatedMemories.length > 0 && (
                <div className="vault-related-section">
                  <h3 style={{ fontSize: '19px', fontWeight: '800', color: '#1f2937', margin: 0 }}>
                    💡 {t.relatedMemories || 'You May Also Remember'}
                  </h3>
                  <div className="vault-related-grid">
                    {relatedMemories.map((rel) => (
                      <div
                        key={rel.id}
                        className="vault-related-card"
                        onClick={() => {
                          const fullItem = memories.find((m) => m.id === rel.id)
                          if (fullItem) openMemoryDetail(fullItem)
                        }}
                      >
                        <span className={`vault-badge vault-badge--${rel.category}`} style={{ width: 'fit-content' }}>
                          {rel.category}
                        </span>
                        <h4 className="vault-related-title">{rel.title}</h4>
                        <span style={{ fontSize: '13px', color: '#64748b' }}>
                          🗓️ {rel.memory_date || 'Past'} {rel.location ? `• 📍 ${rel.location}` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Edit / Delete actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                <button
                  type="button"
                  className="vault-action-btn"
                  style={{ background: '#f1f5f9', border: '1px solid #cbd5e1' }}
                  onClick={() => {
                    const toEdit = selectedMemory
                    setSelectedMemory(null)
                    startEditMemory(toEdit)
                  }}
                >
                  ✏️ {t.edit || 'Edit'}
                </button>
                <button
                  type="button"
                  className="vault-action-btn vault-action-btn--delete"
                  style={{
                    background: '#dc2626',
                    color: '#ffffff',
                    border: '2px solid #b91c1c',
                    borderRadius: '14px',
                    padding: '12px 24px',
                    fontSize: '16px',
                    fontWeight: '700',
                    minHeight: '48px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)',
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => handleDeleteMemory(selectedMemory?.id)}
                  title="Permanently delete this memory"
                  aria-label={t.delete || 'Delete memory permanently'}
                >
                  <span aria-hidden="true" style={{ fontSize: '18px' }}>🗑️</span>
                  <span>{t.delete || 'Delete Memory'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
