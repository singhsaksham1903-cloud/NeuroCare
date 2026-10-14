import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import './Memories.css'
import VoiceReadAloud from '../Components/VoiceReadAloud'
import VoiceMemoryRecorderModal from '../Components/VoiceCompanion/VoiceMemoryRecorderModal'
import {
  createSpeechRecognizer,
  isSpeechRecognitionSupported,
  normalizeLanguageCode,
} from '../utils/voiceCompanion'

import {
  apiDelete,
  apiGet,
  apiPost,
  apiPut,
} from '../utils/api'

const EMPTY_FORM = {
  title: '',
  description: '',
  category: 'Family',
  memoryDate: '',
  time: '',
  location: '',
  mood: 'Joyful',
  imageData: '',
  images: [],
  audioData: '',
  isFavorite: false,
}

const IMAGE_TEXT = {
  en: {
    label: 'Photos (up to 4 photos)',
    choose: 'Upload photo(s)',
    change: 'Change photo',
    add: 'Add more photos',
    remove: 'Remove',
    hint: 'JPG, PNG or WebP. Auto-compressed for easy viewing.',
    invalid: 'Please choose valid image files.',
    tooLarge: 'Please choose images smaller than 5 MB.',
    failed: 'Could not process the image.',
    saving: 'Saving image...',
  },
  hi: {
    label: 'तस्वीरें (4 तस्वीरों तक)',
    choose: 'तस्वीरें चुनें',
    change: 'तस्वीर बदलें',
    add: 'और तस्वीर जोड़ें',
    remove: 'हटाएँ',
    hint: 'JPG, PNG या WebP। स्वतः संकुचित।',
    invalid: 'कृपया एक मान्य तस्वीर चुनें।',
    tooLarge: 'कृपया 5 MB से छोटी तस्वीर चुनें।',
    failed: 'तस्वीर तैयार नहीं हो सकी।',
    saving: 'तस्वीर सहेजी जा रही है...',
  },
  as: {
    label: 'ছবিসমূহ (৪খনলৈকে)',
    choose: 'ছবি বাছনি কৰক',
    change: 'ছবি সলনি কৰক',
    add: 'আৰু ছবি যোগ কৰক',
    remove: 'আঁতৰাওক',
    hint: 'JPG, PNG বা WebP।',
    invalid: 'অনুগ্ৰহ কৰি সঠিক ছবি বাছনি কৰক।',
    tooLarge: 'অনুগ্ৰহ কৰি 5 MB-তকৈ সৰু ছবি বাছনি কৰক।',
    failed: 'ছবিখন প্ৰস্তুত কৰিব পৰা নগ’ল।',
    saving: 'ছবি সংৰক্ষণ কৰা হৈছে...',
  },
}

const MAX_IMAGE_FILE_SIZE = 5 * 1024 * 1024
const MAX_IMAGE_DIMENSION = 1200
const IMAGE_QUALITY = 0.82
const MAX_IMAGE_DATA_LENGTH = 1200000

function getImageText(language) {
  const key = String(language || 'en').slice(0, 2)
  return IMAGE_TEXT[key] || IMAGE_TEXT.en
}

function prepareMemoryImage(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('invalid'))
      return
    }

    if (file.size > MAX_IMAGE_FILE_SIZE) {
      reject(new Error('tooLarge'))
      return
    }

    const reader = new FileReader()
    reader.onerror = () => reject(new Error('failed'))
    reader.onload = () => {
      const image = new Image()
      image.onload = () => {
        const longestSide = Math.max(image.naturalWidth, image.naturalHeight)
        const scale = Math.min(1, MAX_IMAGE_DIMENSION / longestSide)
        const width = Math.max(1, Math.round(image.naturalWidth * scale))
        const height = Math.max(1, Math.round(image.naturalHeight * scale))

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const context = canvas.getContext('2d')
        if (!context) {
          reject(new Error('failed'))
          return
        }

        context.drawImage(image, 0, 0, width, height)
        let dataUrl
        try {
          dataUrl = canvas.toDataURL('image/webp', IMAGE_QUALITY)
        } catch {
          dataUrl = ''
        }

        if (!dataUrl || dataUrl === 'data:image/webp,') {
          try {
            dataUrl = canvas.toDataURL('image/jpeg', IMAGE_QUALITY)
          } catch {
            dataUrl = ''
          }
        }

        if (!dataUrl || dataUrl.length > MAX_IMAGE_DATA_LENGTH) {
          reject(new Error('tooLarge'))
          return
        }

        resolve(dataUrl)
      }
      image.onerror = () => reject(new Error('failed'))
      image.src = String(reader.result || '')
    }
    reader.readAsDataURL(file)
  })
}

function MemoryIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="10" y="12" width="44" height="40" rx="9" stroke="currentColor" strokeWidth="3" />
      <rect x="17" y="20" width="30" height="22" rx="5" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="27" cy="27" r="4" stroke="currentColor" strokeWidth="2.5" />
      <path d="M20 38L29 32L35 36L39 33L44 39" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function Memories({
  text,
  language = 'en-IN',
  readAloudLabel = 'Read Aloud',
  stopReadingLabel = 'Stop Reading',
  initialTab = 'all',
  onBack,
}) {
  const [currentTab, setCurrentTab] = useState(initialTab || 'all')
  const [memories, setMemories] = useState([])
  const [timelineGroups, setTimelineGroups] = useState({
    today: [],
    this_week: [],
    this_month: [],
    this_year: [],
    older: [],
  })
  const [timelineData, setTimelineData] = useState({
    groups: { today: [], this_week: [], this_month: [], this_year: [], older: [] },
    by_year: {},
    all_photos: [],
  })
  const [timelineViewMode, setTimelineViewMode] = useState('photos') // 'photos' | 'eras'
  const [selectedYearFilter, setSelectedYearFilter] = useState('All')
  const [slideshowIndex, setSlideshowIndex] = useState(null)
  const [prevInitialTab, setPrevInitialTab] = useState(initialTab)

  if (initialTab !== prevInitialTab) {
    setPrevInitialTab(initialTab)
    setCurrentTab(initialTab)
  }

  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchEntities, setSearchEntities] = useState(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isVoiceSearching, setIsVoiceSearching] = useState(false)

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedMood, setSelectedMood] = useState('All')
  const [onlyFavorites, setOnlyFavorites] = useState(false)
  const [onlyWithAudio, setOnlyWithAudio] = useState(false)
  const [onlyWithPhotos, setOnlyWithPhotos] = useState(false)

  // Details Modal
  const [activeMemory, setActiveMemory] = useState(null)
  const [activeRelated, setActiveRelated] = useState([])
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  // Speech Narration State
  const [speakingMemoryId, setSpeakingMemoryId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  // Voice Modals & MediaRecorder
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false)
  const [isRecordingAudioNote, setIsRecordingAudioNote] = useState(false)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])

  // Caregiver Permissions
  const [permissions, setPermissions] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [savingPermission, setSavingPermission] = useState(false)

  const imageText = getImageText(language)

  // ==========================================
  // Load All Memories
  // ==========================================
  const loadMemories = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const data = await apiGet('/memories')
      setMemories(data.memories || [])
    } catch (err) {
      setError(err.message || text.loadError)
    } finally {
      setLoading(false)
    }
  }, [text.loadError])

  // Load Timeline
  const loadTimeline = useCallback(async () => {
    try {
      const data = await apiGet('/memories-timeline')
      if (data) {
        if (data.groups) setTimelineGroups(data.groups)
        setTimelineData({
          groups: data.groups || {},
          by_year: data.by_year || {},
          all_photos: data.all_photos || [],
        })
      }
    } catch (err) {
      console.warn('Could not load timeline', err)
    }
  }, [])

  // Load Permissions
  const loadPermissions = useCallback(async () => {
    try {
      const data = await apiGet('/memories-permissions')
      setPermissions(data.permissions || [])
      const logsData = await apiGet('/memories-audit-logs')
      setAuditLogs(logsData.logs || [])
    } catch (err) {
      console.warn('Could not load permissions', err)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadMemories()
      void loadTimeline()
      void loadPermissions()
    }, 0)

    return () => {
      window.clearTimeout(timer)
    }
  }, [loadMemories, loadTimeline, loadPermissions])

  // Cancel any speaking speech on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  // ==========================================
  // Speech Narration
  // ==========================================
  const narrateMemory = (memory) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return

    if (speakingMemoryId === memory.id) {
      window.speechSynthesis.cancel()
      setSpeakingMemoryId(null)
      return
    }

    window.speechSynthesis.cancel()

    const textToRead = `${memory.title}. ${memory.location ? `In ${memory.location}.` : ''} ${memory.description}. ${memory.aiSummary ? `Story reflection: ${memory.aiSummary}` : ''}`
    const utterance = new SpeechSynthesisUtterance(textToRead)
    utterance.lang = normalizeLanguageCode(language)
    utterance.rate = 0.90 // Calm elder-friendly cadence
    utterance.pitch = 1.0

    utterance.onend = () => setSpeakingMemoryId(null)
    utterance.onerror = () => setSpeakingMemoryId(null)

    setSpeakingMemoryId(memory.id)
    window.speechSynthesis.speak(utterance)
  }

  // ==========================================
  // Form Field Handlers
  // ==========================================
  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleMultipleImages = async (e) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (files.length === 0) return

    try {
      setError('')
      const processed = await Promise.all(files.slice(0, 4).map(prepareMemoryImage))
      setForm((prev) => ({
        ...prev,
        images: [...prev.images, ...processed].slice(0, 4),
        imageData: prev.imageData || processed[0] || '',
      }))
    } catch {
      setError(imageText.failed)
    }
  }

  const handleRemoveImageItem = (index) => {
    setForm((prev) => {
      const nextImages = prev.images.filter((_, i) => i !== index)
      return {
        ...prev,
        images: nextImages,
        imageData: nextImages[0] || '',
      }
    })
  }

  // Live audio note recorder
  const startAudioNoteRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const reader = new FileReader()
        reader.onloadend = () => {
          setForm((prev) => ({
            ...prev,
            audioData: String(reader.result),
          }))
        }
        reader.readAsDataURL(audioBlob)
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorderRef.current.start()
      setIsRecordingAudioNote(true)
    } catch {
      setError('Microphone access was denied or unavailable.')
    }
  }

  const stopAudioNoteRecording = () => {
    if (mediaRecorderRef.current && isRecordingAudioNote) {
      mediaRecorderRef.current.stop()
      setIsRecordingAudioNote(false)
    }
  }

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
  }

  // Submit Form
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.description.trim()) {
      setError(text.validationError || 'Please provide details for your memory.')
      return
    }

    try {
      setSaving(true)
      setError('')
      setMessage('')

      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        memoryDate: form.memoryDate || null,
        time: form.time || null,
        location: form.location.trim() || null,
        mood: form.mood,
        imageData: form.imageData || null,
        images: form.images || [],
        audioData: form.audioData || null,
        isFavorite: form.isFavorite,
      }

      if (editingId !== null) {
        await apiPut(`/memories/${editingId}`, payload)
        setMessage(text.updateSuccess)
      } else {
        await apiPost('/memories', payload)
        setMessage(text.saveSuccess)
      }

      resetForm()
      await loadMemories()
      await loadTimeline()
    } catch (err) {
      setError(err.message || text.saveError)
    } finally {
      setSaving(false)
    }
  }

  // Edit
  const handleEdit = (memory) => {
    setEditingId(memory.id)
    setForm({
      title: memory.title || '',
      description: memory.description || '',
      category: memory.category || 'Family',
      memoryDate: memory.memoryDate || '',
      time: memory.time || '',
      location: memory.location || '',
      mood: memory.mood || 'Joyful',
      imageData: memory.imageData || '',
      images: memory.images || (memory.imageData ? [memory.imageData] : []),
      audioData: memory.audioData || '',
      isFavorite: Boolean(memory.isFavorite),
    })
    setCurrentTab('all')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Delete memory
  const handleDelete = async (memoryId, e) => {
    e?.stopPropagation()
    if (deletingId) return
    try {
      setDeletingId(memoryId)
      setError('')

      // Optimistically remove from view for instant response
      setMemories((prev) => prev.filter((m) => m.id !== memoryId))
      setSearchResults((prev) => prev.filter((r) => r.id !== memoryId && r.memory?.id !== memoryId))
      setTimelineGroups((prev) => {
        if (!prev) return prev
        const clean = (arr) => (arr || []).filter((item) => item.id !== memoryId)
        return {
          today: clean(prev.today),
          this_week: clean(prev.this_week),
          this_month: clean(prev.this_month),
          this_year: clean(prev.this_year),
          older: clean(prev.older),
        }
      })

      if (editingId === memoryId) resetForm()
      if (activeMemory?.id === memoryId) setActiveMemory(null)

      await apiDelete(`/memories/${memoryId}`)
      setMessage(text.deleteSuccess || 'Memory deleted successfully')

      // Refresh list and timeline to keep everything in sync
      await Promise.all([loadMemories(), loadTimeline()])
    } catch (err) {
      setError(err.message || text.deleteError || 'Failed to delete memory.')
      // Restore state on failure
      await loadMemories()
    } finally {
      setDeletingId(null)
    }
  }

  // Toggle Favorite
  const handleToggleFavorite = async (memoryId, e) => {
    e?.stopPropagation()
    try {
      await apiPost(`/memories/${memoryId}/favorite`, {})
      await loadMemories()
      await loadTimeline()
    } catch (err) {
      console.warn('Could not toggle favorite', err)
    }
  }

  // Open Details Modal
  const handleOpenDetails = async (memory) => {
    setActiveMemory(memory)
    setActiveImageIndex(0)
    try {
      const relatedData = await apiGet(`/memories/${memory.id}/related`)
      setActiveRelated(relatedData.related || [])
    } catch {
      setActiveRelated([])
    }
  }

  // ==========================================
  // Semantic Search
  // ==========================================
  const handleSearch = async (queryText) => {
    const q = (queryText !== undefined ? queryText : searchQuery).trim()
    if (!q) {
      setSearchResults([])
      setSearchEntities(null)
      return
    }

    try {
      setIsSearching(true)
      const data = await apiPost('/memories/search', { query: q })
      setSearchResults(data.results || [])
      setSearchEntities(data.extracted_entities || null)
    } catch (err) {
      console.warn('Search failed', err)
    } finally {
      setIsSearching(false)
    }
  }

  // Voice Search Trigger
  const startVoiceSearch = () => {
    if (!isSpeechRecognitionSupported()) {
      alert('Voice search is not supported in this browser. Please type your search.')
      return
    }

    setIsVoiceSearching(true)
    const recognizer = createSpeechRecognizer({
      language: normalizeLanguageCode(language),
      continuous: false,
      interimResults: true,
      onStart: () => setIsVoiceSearching(true),
      onResult: ({ finalTranscript, interimTranscript }) => {
        const textTranscript = (finalTranscript || interimTranscript || '').trim()
        if (textTranscript) {
          setSearchQuery(textTranscript)
        }
        if (finalTranscript) {
          setIsVoiceSearching(false)
          void handleSearch(finalTranscript)
        }
      },
      onError: () => setIsVoiceSearching(false),
      onEnd: () => setIsVoiceSearching(false),
    })

    recognizer.start()
  }

  // Caregiver Permission Toggles
  const handlePermissionChange = async (caregiverId, accessGranted, emergencyMode) => {
    try {
      setSavingPermission(true)
      await apiPost('/memories-permissions', {
        caregiverId,
        accessGranted,
        emergencyModeEnabled: emergencyMode,
      })
      await loadPermissions()
    } catch (err) {
      console.warn('Could not update permission', err)
    } finally {
      setSavingPermission(false)
    }
  }

  // Filtered Memories List for "All" tab
  const filteredMemories = memories.filter((m) => {
    if (selectedCategory !== 'All' && m.category !== selectedCategory) return false
    if (selectedMood !== 'All' && m.mood !== selectedMood) return false
    if (onlyFavorites && !m.isFavorite) return false
    if (onlyWithAudio && !m.audioData) return false
    if (onlyWithPhotos && (!m.images || m.images.length === 0) && !m.imageData) return false
    return true
  })

  // Extract and sort all photos across all memories chronologically
  const allTimelinePhotos = useMemo(() => {
    if (timelineData.all_photos && timelineData.all_photos.length > 0) {
      return timelineData.all_photos
    }
    const list = []
    memories.forEach((m) => {
      const photos = m.images && m.images.length > 0 ? m.images : (m.imageData ? [m.imageData] : [])
      photos.forEach((photoUrl, pIdx) => {
        list.push({
          id: `${m.id}-photo-${pIdx}`,
          memoryId: m.id,
          photoUrl,
          photoIndex: pIdx,
          totalPhotos: photos.length,
          title: m.title,
          description: m.description,
          category: m.category,
          mood: m.mood,
          location: m.location,
          memoryDate: m.memoryDate || m.created_at,
          created_at: m.created_at,
        })
      })
    })
    return list.sort((a, b) => {
      const dateA = a.memoryDate ? new Date(a.memoryDate).getTime() : new Date(a.created_at).getTime()
      const dateB = b.memoryDate ? new Date(b.memoryDate).getTime() : new Date(b.created_at).getTime()
      return dateB - dateA
    })
  }, [timelineData.all_photos, memories])

  const timelineYears = useMemo(() => {
    const set = new Set()
    allTimelinePhotos.forEach((p) => {
      const dateStr = p.memoryDate || p.created_at
      if (dateStr) {
        set.add(new Date(dateStr).getFullYear().toString())
      }
    })
    return Array.from(set).sort((a, b) => Number(b) - Number(a))
  }, [allTimelinePhotos])

  const filteredTimelinePhotos = useMemo(() => {
    if (selectedYearFilter === 'All') return allTimelinePhotos
    return allTimelinePhotos.filter((p) => {
      const dateStr = p.memoryDate || p.created_at
      if (!dateStr) return false
      return new Date(dateStr).getFullYear().toString() === selectedYearFilter
    })
  }, [allTimelinePhotos, selectedYearFilter])

  // Keyboard navigation for photo slideshow
  useEffect(() => {
    if (slideshowIndex === null) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSlideshowIndex(null)
      } else if (e.key === 'ArrowLeft') {
        setSlideshowIndex((idx) => (idx > 0 ? idx - 1 : allTimelinePhotos.length - 1))
      } else if (e.key === 'ArrowRight') {
        setSlideshowIndex((idx) => (idx < allTimelinePhotos.length - 1 ? idx + 1 : 0))
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [slideshowIndex, allTimelinePhotos.length])

  const categoriesList = [
    'General', 'Family', 'Friends', 'Travel', 'Celebration',
    'Childhood', 'Birthday', 'Wedding', 'Festival', 'Medical',
    'Daily Activity', 'Other'
  ]

  const moodsList = [
    'Joyful', 'Peaceful', 'Nostalgic', 'Grateful', 'Loving', 'Energetic', 'Reflective'
  ]

  const suggestedQueries = [
    'Trip to Shillong',
    'Diwali with Mother',
    "Granddaughter Priya's wedding",
    'Memories with Rahul',
    'Memories from 2024',
    'Home garden Tulsi',
  ]

  return (
    <div className="memories-page">
      {/* Header */}
      <header className="memories-header">
        <button type="button" className="memories-back-button" onClick={onBack}>
          <span aria-hidden="true">←</span>
          {text.backToDashboard}
        </button>

        <div className="memories-heading">
          <div className="memories-heading-icon" aria-hidden="true">
            <MemoryIcon />
          </div>
          <div style={{ flex: 1 }}>
            <span className="memories-eyebrow">
              {text.savedMemories} • {memories.length} {text.memoriesPlural}
            </span>
            <h1>{text.vaultTitle || text.memoriesTitle}</h1>
            <p>{text.vaultSubtitle || text.memoriesDescription}</p>
          </div>
          <button
            type="button"
            className="memory-voice-record-btn"
            onClick={() => setIsVoiceModalOpen(true)}
            aria-label="Voice Memory Creator"
          >
            <span aria-hidden="true" style={{ fontSize: '1.25rem' }}>🎙️</span>
            <span>{text.voiceAdd || 'Voice Record'}</span>
          </button>
        </div>

        <VoiceReadAloud
          text={`${text.vaultTitle || text.memoriesTitle}. ${text.vaultSubtitle || text.memoriesDescription}. You have ${memories.length} saved memories in your vault.`}
          language={language}
          label={readAloudLabel}
          stopLabel={stopReadingLabel}
        />

        {/* Navigation Tabs */}
        <nav className="memory-vault-nav" aria-label="Memory Vault sections">
          <button
            type="button"
            className={`memory-nav-tab ${currentTab === 'all' ? 'memory-nav-tab--active' : ''}`}
            onClick={() => setCurrentTab('all')}
          >
            <span aria-hidden="true">🗂️</span>
            {text.tabAll || 'All Memories'} ({memories.length})
          </button>
          <button
            type="button"
            className={`memory-nav-tab ${currentTab === 'timeline' ? 'memory-nav-tab--active' : ''}`}
            onClick={() => {
              setCurrentTab('timeline')
              void loadTimeline()
            }}
          >
            <span aria-hidden="true">⏳</span>
            {text.tabTimeline || 'Photo Timeline'} ({allTimelinePhotos.length})
          </button>
          <button
            type="button"
            className={`memory-nav-tab ${currentTab === 'search' ? 'memory-nav-tab--active' : ''}`}
            onClick={() => setCurrentTab('search')}
          >
            <span aria-hidden="true">🔍</span>
            {text.tabSearch || 'Semantic Search'}
          </button>
          <button
            type="button"
            className={`memory-nav-tab ${currentTab === 'permissions' ? 'memory-nav-tab--active' : ''}`}
            onClick={() => {
              setCurrentTab('permissions')
              void loadPermissions()
            }}
          >
            <span aria-hidden="true">🔒</span>
            {text.tabPermissions || 'Caregiver Privacy'}
          </button>
        </nav>
      </header>

      {/* Messages */}
      {error && <div className="memories-message memories-message--error">{error}</div>}
      {message && <div className="memories-message memories-message--success">{message}</div>}

      <main className="memories-content">
        {/* ========================================================
            TAB 1: ALL MEMORIES & CREATION
            ======================================================== */}
        {currentTab === 'all' && (
          <>
            {/* Form */}
            <section className="memory-form-card">
              <div className="memory-form-heading">
                <div className="memory-form-icon">
                  <MemoryIcon />
                </div>
                <div style={{ flex: 1 }}>
                  <span>{editingId !== null ? text.editMemory : (text.quickAdd || text.addMemory)}</span>
                  <h2>{editingId !== null ? text.editMemory : (text.quickAdd || text.addMemory)}</h2>
                </div>
                <button
                  type="button"
                  className="memory-voice-record-btn"
                  onClick={() => setIsVoiceModalOpen(true)}
                >
                  <span aria-hidden="true">🎙️</span>
                  <span>{text.voiceAdd || 'Voice Story'}</span>
                </button>
              </div>

              <form className="memory-form" onSubmit={handleSubmit}>
                <label>
                  {text.title} <span style={{ fontSize: '0.82rem', color: '#888' }}>(Optional — AI auto-generates title if left blank)</span>
                  <input
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder={text.titlePlaceholder}
                    maxLength={200}
                  />
                </label>

                <label>
                  {text.description}
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder={text.descriptionPlaceholder}
                    rows={4}
                    maxLength={5000}
                    required
                  />
                </label>

                <div className="memory-form-row">
                  <label>
                    {text.category}
                    <select name="category" value={form.category} onChange={handleChange}>
                      {categoriesList.map((cat) => (
                        <option key={cat} value={cat}>
                          {text.categories?.[cat] || cat}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    {text.moodLabel || 'Mood / Feeling'}
                    <select name="mood" value={form.mood} onChange={handleChange}>
                      {moodsList.map((m) => (
                        <option key={m} value={m}>
                          {text.moods?.[m] || m}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="memory-form-row">
                  <label>
                    {text.memoryDate}
                    <input
                      type="date"
                      name="memoryDate"
                      value={form.memoryDate}
                      onChange={handleChange}
                    />
                  </label>

                  <label>
                    {text.locationLabel || 'Location (optional)'}
                    <input
                      type="text"
                      name="location"
                      value={form.location}
                      onChange={handleChange}
                      placeholder="e.g. Shillong, Guwahati, Jaipur..."
                    />
                  </label>
                </div>

                {/* Multiple Photos Upload */}
                <label className="memory-image-field">
                  {imageText.label}
                  <input
                    type="file"
                    name="memoryImages"
                    multiple
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleMultipleImages}
                  />
                </label>

                {form.images && form.images.length > 0 && (
                  <div className="memory-modal-thumb-strip" style={{ marginTop: 8 }}>
                    {form.images.map((img, idx) => (
                      <div key={idx} style={{ position: 'relative' }}>
                        <img src={img} alt={`Thumbnail ${idx + 1}`} className="memory-modal-thumb" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImageItem(idx)}
                          style={{
                            position: 'absolute',
                            top: -6,
                            right: -6,
                            background: '#ef4444',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '50%',
                            width: 22,
                            height: 22,
                            fontSize: '12px',
                            cursor: 'pointer',
                          }}
                          aria-label="Remove photo"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Audio Note Recorder inside Form */}
                <div style={{ marginTop: 12, padding: '14px 18px', background: '#f8fafc', borderRadius: 16, border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.95rem', color: '#1e293b' }}>
                        🎙️ {text.audioNoteLabel || 'Record Voice Clip'}
                      </strong>
                      <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                        Attach your voice telling this story for listening anytime.
                      </span>
                    </div>

                    {!isRecordingAudioNote ? (
                      <button
                        type="button"
                        onClick={startAudioNoteRecording}
                        className="memory-filter-chip-btn"
                        style={{ background: '#f0fdf4', borderColor: '#86efac', color: '#166534' }}
                      >
                        🔴 {text.recordAudioNote || 'Record Voice'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={stopAudioNoteRecording}
                        className="memory-filter-chip-btn"
                        style={{ background: '#fef2f2', borderColor: '#fca5a5', color: '#991b1b', animation: 'pulse-mic 1s infinite' }}
                      >
                        ⏹️ {text.stopRecordingAudio || 'Stop & Attach'}
                      </button>
                    )}
                  </div>

                  {form.audioData && (
                    <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
                      <audio controls src={form.audioData} style={{ height: 36, flex: 1 }} />
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, audioData: '' }))}
                        className="memory-image-remove-button"
                      >
                        {imageText.remove}
                      </button>
                    </div>
                  )}
                </div>

                <div className="memory-form-actions">
                  <button type="submit" className="memory-primary-button" disabled={saving}>
                    {saving ? text.saving : editingId !== null ? text.updateMemory : text.saveMemory}
                  </button>
                  {editingId !== null && (
                    <button type="button" className="memory-secondary-button" onClick={resetForm}>
                      {text.cancelEdit}
                    </button>
                  )}
                </div>
              </form>
            </section>

            {/* Filter Bar */}
            <div className="memory-vault-filter-bar">
              <div className="memory-filter-group">
                <span style={{ fontWeight: 700, color: '#4b5563', fontSize: '0.92rem' }}>Filter:</span>
                <select
                  className="memory-filter-select"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="All">All Categories</option>
                  {categoriesList.map((c) => (
                    <option key={c} value={c}>
                      {text.categories?.[c] || c}
                    </option>
                  ))}
                </select>

                <select
                  className="memory-filter-select"
                  value={selectedMood}
                  onChange={(e) => setSelectedMood(e.target.value)}
                >
                  <option value="All">All Moods</option>
                  {moodsList.map((m) => (
                    <option key={m} value={m}>
                      {text.moods?.[m] || m}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  className={`memory-filter-chip-btn ${onlyFavorites ? 'memory-filter-chip-btn--active' : ''}`}
                  onClick={() => setOnlyFavorites(!onlyFavorites)}
                >
                  ⭐ Favorites
                </button>

                <button
                  type="button"
                  className={`memory-filter-chip-btn ${onlyWithAudio ? 'memory-filter-chip-btn--active' : ''}`}
                  onClick={() => setOnlyWithAudio(!onlyWithAudio)}
                >
                  🎙️ With Voice
                </button>

                <button
                  type="button"
                  className={`memory-filter-chip-btn ${onlyWithPhotos ? 'memory-filter-chip-btn--active' : ''}`}
                  onClick={() => setOnlyWithPhotos(!onlyWithPhotos)}
                >
                  📷 With Photos
                </button>
              </div>

              <span className="memory-count">
                {filteredMemories.length} {filteredMemories.length === 1 ? text.memory : text.memoriesPlural}
              </span>
            </div>

            {/* Cards Grid */}
            <section className="memory-list-section">
              {loading ? (
                <div className="memory-empty">{text.loadingMemories}</div>
              ) : filteredMemories.length === 0 ? (
                <div className="memory-empty">
                  <div className="memory-empty-icon" aria-hidden="true">
                    <MemoryIcon />
                  </div>
                  <h3>{text.noMemories}</h3>
                  <p>{text.savedMemoriesDescription}</p>
                </div>
              ) : (
                <div className="memory-list">
                  {filteredMemories.map((memory) => (
                    <article
                      className="saved-memory-card"
                      key={memory.id}
                      onClick={() => handleOpenDetails(memory)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="saved-memory-card-visual">
                        {memory.imageData || (memory.images && memory.images[0]) ? (
                          <img
                            src={memory.imageData || memory.images[0]}
                            alt={memory.title}
                            className="saved-memory-card-image"
                          />
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#bd6d59' }}>
                            <MemoryIcon />
                          </div>
                        )}
                        {memory.images && memory.images.length > 1 && (
                          <span className="saved-memory-card-image-badge" title={`${memory.images.length} photos`}>
                            +{memory.images.length - 1}
                          </span>
                        )}
                      </div>

                      <div className="saved-memory-card-body">
                        <div className="memory-card-top-badges">
                          <span className="saved-memory-category">{memory.category}</span>
                          {memory.mood && (
                            <span className="memory-mood-pill">
                              {text.moods?.[memory.mood] || memory.mood}
                            </span>
                          )}
                          {memory.audioData && (
                            <span className="memory-audio-pill">🎙️ Voice Note</span>
                          )}
                          <button
                            type="button"
                            className="memory-fav-btn"
                            onClick={(e) => handleToggleFavorite(memory.id, e)}
                            title={memory.isFavorite ? 'Unfavorite' : 'Favorite'}
                            aria-label={memory.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                          >
                            {memory.isFavorite ? '⭐' : '☆'}
                          </button>
                        </div>

                        <h3>{memory.title}</h3>
                        <p>{memory.description}</p>

                        {memory.aiSummary && (
                          <div className="memory-ai-summary-snippet">
                            ✨ {memory.aiSummary}
                          </div>
                        )}

                        <div className="saved-memory-meta">
                          {memory.memoryDate ? (
                            <time dateTime={memory.memoryDate}>
                              📅 {new Date(memory.memoryDate).toLocaleDateString()}
                            </time>
                          ) : (
                            <span>{text.noDate}</span>
                          )}
                          {memory.location && (
                            <span style={{ color: '#047857', fontWeight: 600 }}>
                              📍 {memory.location}
                            </span>
                          )}
                        </div>

                        <div className="saved-memory-card-actions" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className={`memory-card-narrate-btn ${speakingMemoryId === memory.id ? 'memory-card-narrate-btn--active' : ''}`}
                            onClick={() => narrateMemory(memory)}
                          >
                            <span aria-hidden="true">{speakingMemoryId === memory.id ? '⏹️' : '🔊'}</span>
                            <span>{speakingMemoryId === memory.id ? (text.stopNarration || 'Stop') : (text.listenAloud || 'Listen')}</span>
                          </button>

                          <button
                            type="button"
                            className="saved-memory-action-button"
                            onClick={() => handleOpenDetails(memory)}
                          >
                            📖 {text.viewDetails || 'Details'}
                          </button>

                          <button
                            type="button"
                            className="saved-memory-action-button"
                            onClick={() => handleEdit(memory)}
                          >
                            ✏️ {text.edit}
                          </button>

                          <button
                            type="button"
                            className="saved-memory-action-button saved-memory-action-button--danger"
                            onClick={(e) => handleDelete(memory.id, e)}
                            disabled={deletingId === memory.id}
                            title={text.delete || 'Delete memory'}
                            aria-label={text.delete || 'Delete memory'}
                          >
                            {deletingId === memory.id ? '⏳ Deleting...' : `🗑️ ${text.delete}`}
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {/* ========================================================
            TAB 2: PHOTO TIMELINE VIEW
            ======================================================== */}
        {currentTab === 'timeline' && (
          <div className="memory-timeline-container">
            {/* Header & Controls */}
            <div className="timeline-header-container">
              <div className="timeline-title-block">
                <div className="timeline-badge-pill">
                  <span>📸 {allTimelinePhotos.length} {allTimelinePhotos.length === 1 ? 'Photograph' : 'Photographs'}</span>
                  {timelineYears.length > 0 && (
                    <span className="timeline-badge-years">
                      • {timelineYears[timelineYears.length - 1]} — {timelineYears[0]}
                    </span>
                  )}
                </div>
                <h2>⏳ {text.tabTimeline || 'Photo Memory Timeline'}</h2>
                <p>
                  All your treasured photographs gathered together according to their timeline, from your earliest memories to the present day.
                </p>
              </div>

              <div className="timeline-actions-bar">
                <div className="timeline-view-modes">
                  <button
                    type="button"
                    className={`timeline-mode-btn ${timelineViewMode === 'photos' ? 'timeline-mode-btn--active' : ''}`}
                    onClick={() => setTimelineViewMode('photos')}
                  >
                    <span>🖼️ All Photos Stream</span>
                  </button>
                  <button
                    type="button"
                    className={`timeline-mode-btn ${timelineViewMode === 'eras' ? 'timeline-mode-btn--active' : ''}`}
                    onClick={() => setTimelineViewMode('eras')}
                  >
                    <span>📅 Grouped by Eras</span>
                  </button>
                </div>

                {allTimelinePhotos.length > 0 && (
                  <button
                    type="button"
                    className="timeline-slideshow-start-btn"
                    onClick={() => setSlideshowIndex(0)}
                    title="Open Fullscreen Slideshow"
                    aria-label="Open Fullscreen Slideshow"
                  >
                    <span>🎬 Start Fullscreen Slideshow</span>
                  </button>
                )}
              </div>
            </div>

            {/* Year Filters */}
            {timelineYears.length > 1 && timelineViewMode === 'photos' && (
              <div className="timeline-year-filter-row">
                <span className="timeline-filter-label">Timeline Year:</span>
                <button
                  type="button"
                  className={`timeline-year-chip ${selectedYearFilter === 'All' ? 'timeline-year-chip--active' : ''}`}
                  onClick={() => setSelectedYearFilter('All')}
                >
                  All ({allTimelinePhotos.length})
                </button>
                {timelineYears.map((year) => {
                  const count = allTimelinePhotos.filter(
                    (p) => new Date(p.memoryDate || p.created_at).getFullYear().toString() === year
                  ).length
                  return (
                    <button
                      key={year}
                      type="button"
                      className={`timeline-year-chip ${selectedYearFilter === year ? 'timeline-year-chip--active' : ''}`}
                      onClick={() => setSelectedYearFilter(year)}
                    >
                      {year} ({count})
                    </button>
                  )
                })}
              </div>
            )}

            {/* Empty State */}
            {allTimelinePhotos.length === 0 ? (
              <div className="memory-empty">
                <div className="memory-empty-icon">
                  <MemoryIcon />
                </div>
                <h3>No Photos Added Yet</h3>
                <p>When you take or upload photos with your memories, they will all appear here arranged chronologically along your timeline.</p>
                <button
                  type="button"
                  className="memory-submit-btn"
                  style={{ marginTop: 14, minHeight: 44, padding: '8px 20px', width: 'auto' }}
                  onClick={() => setCurrentTab('all')}
                >
                  ➕ Add a Memory with Photos
                </button>
              </div>
            ) : timelineViewMode === 'photos' ? (
              /* VIEW MODE 1: ALL PHOTOS STREAM (Chronological Grid) */
              <div className="timeline-photos-stream-grid">
                {filteredTimelinePhotos.map((item, idx) => {
                  const memoryObj = memories.find((m) => m.id === item.memoryId) || {
                    id: item.memoryId,
                    title: item.title,
                    description: item.description,
                    imageData: item.photoUrl,
                    images: [item.photoUrl],
                    memoryDate: item.memoryDate,
                    location: item.location,
                    category: item.category,
                    mood: item.mood,
                  }
                  return (
                    <article
                      key={item.id}
                      className="timeline-photo-card"
                      onClick={() => setSlideshowIndex(idx)}
                      title="Click to view fullscreen in slideshow"
                    >
                      <div className="timeline-photo-wrapper">
                        <img
                          src={item.photoUrl}
                          alt={item.title}
                          className="timeline-photo-img"
                          loading="lazy"
                        />
                        <div className="timeline-photo-overlay">
                          <span className="timeline-photo-date-pill">
                            📅 {item.memoryDate ? new Date(item.memoryDate).toLocaleDateString() : 'Memory'}
                          </span>
                          {item.totalPhotos > 1 && (
                            <span className="timeline-photo-count-pill">
                              Photo {item.photoIndex + 1}/{item.totalPhotos}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="timeline-photo-info">
                        <div className="timeline-photo-tags">
                          <span className="saved-memory-category">{item.category}</span>
                          {item.mood && (
                            <span className="memory-mood-pill">
                              {text.moods?.[item.mood] || item.mood}
                            </span>
                          )}
                        </div>

                        <h3 className="timeline-photo-title">{item.title}</h3>
                        <p className="timeline-photo-desc">{item.description}</p>

                        <div className="timeline-photo-footer">
                          {item.location ? (
                            <span className="timeline-photo-location">
                              📍 {item.location}
                            </span>
                          ) : <span />}
                          <button
                            type="button"
                            className="memory-card-narrate-btn"
                            onClick={(e) => {
                              e.stopPropagation()
                              narrateMemory(memoryObj)
                            }}
                          >
                            <span>{speakingMemoryId === memoryObj.id ? '⏹️' : '🔊'} Listen</span>
                          </button>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            ) : (
              /* VIEW MODE 2: GROUPED BY ERAS */
              <div className="memory-timeline-groups-container">
                {[
                  { key: 'today', label: text.timelineToday || 'Today', icon: '☀️' },
                  { key: 'this_week', label: text.timelineWeek || 'This Week', icon: '🗓️' },
                  { key: 'this_month', label: text.timelineMonth || 'This Month', icon: '🌿' },
                  { key: 'this_year', label: text.timelineYear || 'This Year', icon: '🌸' },
                  { key: 'older', label: text.timelineOlder || 'Older Cherished Memories', icon: '🕰️' },
                ].map(({ key, label, icon }) => {
                  const items = timelineGroups[key] || []
                  if (items.length === 0) return null

                  return (
                    <section key={key} className="memory-timeline-group">
                      <div className="memory-timeline-group-header">
                        <span style={{ fontSize: '1.4rem' }}>{icon}</span>
                        <h3 className="memory-timeline-group-title">
                          {label} ({items.length})
                        </h3>
                        <div className="memory-timeline-group-line" />
                      </div>

                      <div className="memory-timeline-grid">
                        {items.map((memory) => (
                          <article
                            key={memory.id}
                            className="saved-memory-card"
                            onClick={() => handleOpenDetails(memory)}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="saved-memory-card-visual" style={{ height: 180 }}>
                              {memory.imageData || (memory.images && memory.images[0]) ? (
                                <img
                                  src={memory.imageData || memory.images[0]}
                                  alt={memory.title}
                                  className="saved-memory-card-image"
                                />
                              ) : (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#bd6d59' }}>
                                  <MemoryIcon />
                                </div>
                              )}
                            </div>

                            <div className="saved-memory-card-body">
                              <div className="memory-card-top-badges">
                                <span className="saved-memory-category">{memory.category}</span>
                                {memory.mood && (
                                  <span className="memory-mood-pill">
                                    {text.moods?.[memory.mood] || memory.mood}
                                  </span>
                                )}
                                <button
                                  type="button"
                                  className="memory-fav-btn"
                                  onClick={(e) => handleToggleFavorite(memory.id, e)}
                                >
                                  {memory.isFavorite ? '⭐' : '☆'}
                                </button>
                              </div>

                              <h3>{memory.title}</h3>
                              <p style={{ fontSize: '0.92rem' }}>
                                {memory.description.slice(0, 110)}
                                {memory.description.length > 110 ? '...' : ''}
                              </p>

                              <div className="saved-memory-meta">
                                {memory.memoryDate ? (
                                  <time>📅 {new Date(memory.memoryDate).toLocaleDateString()}</time>
                                ) : null}
                                {memory.location && <span>📍 {memory.location}</span>}
                              </div>

                              <div className="saved-memory-card-actions" onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  className="memory-card-narrate-btn"
                                  onClick={() => narrateMemory(memory)}
                                >
                                  <span>{speakingMemoryId === memory.id ? '⏹️ Stop' : '🔊 Listen'}</span>
                                </button>
                                <button
                                  type="button"
                                  className="saved-memory-action-button"
                                  onClick={() => handleOpenDetails(memory)}
                                >
                                  📖 Details
                                </button>
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    </section>
                  )
                })}
              </div>
            )}

            {/* FULLSCREEN PHOTO SLIDESHOW MODAL */}
            {slideshowIndex !== null && allTimelinePhotos[slideshowIndex] && (
              <div
                className="timeline-slideshow-modal"
                onClick={() => setSlideshowIndex(null)}
              >
                <div
                  className="timeline-slideshow-content"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="timeline-slideshow-header">
                    <div className="timeline-slideshow-indicator">
                      <span>📸 Photo {slideshowIndex + 1} of {allTimelinePhotos.length}</span>
                      <span className="timeline-slideshow-header-date">
                        📅 {new Date(allTimelinePhotos[slideshowIndex].memoryDate).toLocaleDateString()}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="timeline-slideshow-close"
                      onClick={() => setSlideshowIndex(null)}
                      title="Close Slideshow (Esc)"
                      aria-label="Close Slideshow"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="timeline-slideshow-stage">
                    <button
                      type="button"
                      className="timeline-slideshow-nav-btn timeline-slideshow-nav-btn--prev"
                      onClick={() => setSlideshowIndex((idx) => (idx > 0 ? idx - 1 : allTimelinePhotos.length - 1))}
                      title="Previous Photo (Left Arrow)"
                      aria-label="Previous Photo"
                    >
                      ◀
                    </button>

                    <div className="timeline-slideshow-img-container">
                      <img
                        src={allTimelinePhotos[slideshowIndex].photoUrl}
                        alt={allTimelinePhotos[slideshowIndex].title}
                        className="timeline-slideshow-img"
                      />
                    </div>

                    <button
                      type="button"
                      className="timeline-slideshow-nav-btn timeline-slideshow-nav-btn--next"
                      onClick={() => setSlideshowIndex((idx) => (idx < allTimelinePhotos.length - 1 ? idx + 1 : 0))}
                      title="Next Photo (Right Arrow)"
                      aria-label="Next Photo"
                    >
                      ▶
                    </button>
                  </div>

                  <div className="timeline-slideshow-caption">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                      <div>
                        <h3 style={{ margin: '0 0 4px', fontSize: '1.35rem', color: '#111827' }}>
                          {allTimelinePhotos[slideshowIndex].title}
                        </h3>
                        {allTimelinePhotos[slideshowIndex].location && (
                          <span style={{ fontSize: '0.9rem', color: '#047857', fontWeight: 600 }}>
                            📍 {allTimelinePhotos[slideshowIndex].location}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        className="memory-card-narrate-btn"
                        style={{ padding: '8px 18px', minHeight: 44, fontSize: '0.95rem' }}
                        onClick={() => {
                          const currentItem = allTimelinePhotos[slideshowIndex]
                          const mem = memories.find((m) => m.id === currentItem.memoryId) || {
                            id: currentItem.memoryId,
                            title: currentItem.title,
                            description: currentItem.description,
                          }
                          narrateMemory(mem)
                        }}
                      >
                        <span>{speakingMemoryId === allTimelinePhotos[slideshowIndex].memoryId ? '⏹️ Stop Narration' : '🔊 Listen to Story'}</span>
                      </button>
                    </div>
                    <p style={{ marginTop: 10, color: '#374151', fontSize: '1rem', lineHeight: 1.6 }}>
                      {allTimelinePhotos[slideshowIndex].description}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 3: NATURAL LANGUAGE & SEMANTIC SEARCH
            ======================================================== */}
        {currentTab === 'search' && (
          <div className="memory-search-container">
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <h2>🔍 {text.tabSearch || 'Natural Language & Semantic Search'}</h2>
              <p style={{ color: '#6b7280' }}>
                Ask in plain everyday language or speak with your voice. The AI understands concepts, people, and places.
              </p>
            </div>

            <div className="memory-search-box">
              <span aria-hidden="true" style={{ fontSize: '1.4rem' }}>🔎</span>
              <input
                type="text"
                className="memory-search-input"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  if (!e.target.value.trim()) {
                    setSearchResults([])
                    setSearchEntities(null)
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void handleSearch()
                }}
                placeholder={text.searchPlaceholder || 'Search naturally: "Trip to Shillong", "My daughter\'s wedding"...'}
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('')
                    setSearchResults([])
                    setSearchEntities(null)
                  }}
                  style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', padding: '0 8px' }}
                >
                  ✕
                </button>
              )}

              <button
                type="button"
                className={`memory-search-mic-btn ${isVoiceSearching ? 'memory-search-mic-btn--listening' : ''}`}
                onClick={startVoiceSearch}
                title="Voice Search: Speak your query"
                aria-label="Voice Search"
              >
                🎙️
              </button>

              <button
                type="button"
                className="memory-primary-button"
                style={{ minHeight: 46, padding: '10px 20px' }}
                onClick={() => void handleSearch()}
                disabled={isSearching}
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </div>

            {/* Suggested Queries */}
            <div className="memory-suggested-queries">
              <span className="memory-suggested-label">Try asking:</span>
              {suggestedQueries.map((sQuery) => (
                <button
                  key={sQuery}
                  type="button"
                  className="memory-query-pill"
                  onClick={() => {
                    setSearchQuery(sQuery)
                    void handleSearch(sQuery)
                  }}
                >
                  💬 {sQuery}
                </button>
              ))}
            </div>

            {/* Extracted Entities */}
            {searchEntities && (
              <div style={{ marginTop: 18, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#4b5563' }}>AI Detected:</span>
                {searchEntities.people?.map((p) => (
                  <span key={p} className="memory-entity-chip memory-entity-chip--person">
                    👥 {p}
                  </span>
                ))}
                {searchEntities.locations?.map((l) => (
                  <span key={l} className="memory-entity-chip memory-entity-chip--location">
                    📍 {l}
                  </span>
                ))}
                {searchEntities.events?.map((e) => (
                  <span key={e} className="memory-entity-chip memory-entity-chip--event">
                    🎈 {e}
                  </span>
                ))}
                {searchEntities.year && (
                  <span className="memory-entity-chip" style={{ background: '#fef3c7', color: '#92400e' }}>
                    📅 {searchEntities.year}
                  </span>
                )}
              </div>
            )}

            {/* Search Results */}
            <div style={{ marginTop: 28 }}>
              {isSearching ? (
                <div className="memory-empty">Calculating semantic vector similarity...</div>
              ) : searchResults.length > 0 ? (
                <div className="memory-list">
                  {searchResults.map((match) => (
                    <article
                      key={match.id}
                      className="saved-memory-card"
                      onClick={() => handleOpenDetails(match)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="saved-memory-card-visual">
                        {match.imageData || (match.images && match.images[0]) ? (
                          <img
                            src={match.imageData || match.images[0]}
                            alt={match.title}
                            className="saved-memory-card-image"
                          />
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#bd6d59' }}>
                            <MemoryIcon />
                          </div>
                        )}
                      </div>

                      <div className="saved-memory-card-body">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span className="memory-search-match-badge">
                            ✨ {Math.round((match.semanticScore || 1) * 100)}% Semantic Match
                          </span>
                          <span className="saved-memory-category">{match.category}</span>
                        </div>

                        {match.relevanceReason && (
                          <div className="memory-relevance-reason">
                            Why it matched: {match.relevanceReason}
                          </div>
                        )}

                        <h3 style={{ marginTop: 8 }}>{match.title}</h3>
                        <p>{match.description}</p>

                        <div className="saved-memory-meta">
                          {match.memoryDate && <span>📅 {new Date(match.memoryDate).toLocaleDateString()}</span>}
                          {match.location && <span>📍 {match.location}</span>}
                        </div>

                        <div className="saved-memory-card-actions" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className="memory-card-narrate-btn"
                            onClick={() => narrateMemory(match)}
                          >
                            <span>{speakingMemoryId === match.id ? '⏹️ Stop' : '🔊 Listen'}</span>
                          </button>
                          <button
                            type="button"
                            className="saved-memory-action-button"
                            onClick={() => handleOpenDetails(match)}
                          >
                            📖 Read Story
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : searchQuery ? (
                <div className="memory-empty">
                  <h3>No matching memories found</h3>
                  <p>Try searching for a person name (Priya, Rahul), a place (Shillong, Jaipur), or an event (wedding, Diwali).</p>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 4: CAREGIVER SHARING & PRIVACY
            ======================================================== */}
        {currentTab === 'permissions' && (
          <div className="memory-permissions-container">
            <div className="memory-privacy-hero">
              <span style={{ fontSize: '2.5rem' }}>🛡️</span>
              <div>
                <h2 style={{ fontSize: '1.35rem', color: '#065f46', marginBottom: 4 }}>
                  {text.caregiverAccessTitle || 'Caregiver Access & Privacy Control'}
                </h2>
                <p style={{ color: '#047857', fontSize: '0.98rem', lineHeight: 1.5 }}>
                  {text.caregiverAccessDesc || 'Your memories and personal stories are private by default. Caregivers can only view them when you grant permission below.'}
                </p>
              </div>
            </div>

            <section className="memory-permission-toggle-card">
              <h3 style={{ fontSize: '1.2rem', color: '#1f2937' }}>Linked Caregiver Sharing</h3>

              {permissions.length === 0 ? (
                <p style={{ color: '#6b7280' }}>
                  No approved caregiver connection found. Once you approve a caregiver connection, you can manage access here.
                </p>
              ) : (
                permissions.map((p) => (
                  <div key={p.linkId} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                      <div>
                        <strong style={{ fontSize: '1.1rem', color: '#111827' }}>{p.caregiverName}</strong>
                        <span style={{ display: 'block', fontSize: '0.85rem', color: '#6b7280' }}>{p.caregiverEmail}</span>
                      </div>
                      <span style={{ padding: '4px 10px', borderRadius: 8, background: '#ecfdf5', color: '#059669', fontSize: '0.85rem', fontWeight: 700 }}>
                        Approved Connection
                      </span>
                    </div>

                    <div className="memory-permission-row">
                      <div>
                        <strong>{text.grantAccessLabel || 'Allow caregiver to view your Memory Vault'}</strong>
                        <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                          Caregiver can see your stories, photos, and voice notes.
                        </p>
                      </div>
                      <label className="memory-switch">
                        <input
                          type="checkbox"
                          checked={p.accessGranted}
                          disabled={savingPermission}
                          onChange={(e) => handlePermissionChange(p.caregiverId, e.target.checked, p.emergencyModeEnabled)}
                        />
                        <span className="memory-switch-slider" />
                      </label>
                    </div>

                    <div className="memory-permission-row">
                      <div>
                        <strong>{text.emergencyModeLabel || 'Emergency Mode Access'}</strong>
                        <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                          Allows emergency medical or care team access if immediate assistance is needed.
                        </p>
                      </div>
                      <label className="memory-switch">
                        <input
                          type="checkbox"
                          checked={p.emergencyModeEnabled}
                          disabled={savingPermission}
                          onChange={(e) => handlePermissionChange(p.caregiverId, p.accessGranted, e.target.checked)}
                        />
                        <span className="memory-switch-slider" />
                      </label>
                    </div>
                  </div>
                ))
              )}
            </section>

            {/* Audit Logs */}
            <section className="memory-permission-toggle-card">
              <h3 style={{ fontSize: '1.2rem', color: '#1f2937' }}>
                📋 {text.auditLogTitle || 'Access Audit Logs'}
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                Every view of your memory vault by a caregiver is strictly logged for your transparency.
              </p>

              {auditLogs.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: '#9ca3af' }}>
                  {text.auditLogEmpty || 'No caregiver views recorded yet.'}
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="memory-audit-log-table">
                    <thead>
                      <tr>
                        <th>Date & Time</th>
                        <th>Caregiver</th>
                        <th>Action</th>
                        <th>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((log) => (
                        <tr key={log.id}>
                          <td>{new Date(log.timestamp).toLocaleString()}</td>
                          <td><strong>{log.caregiver_name}</strong></td>
                          <td>
                            <span style={{ padding: '3px 8px', borderRadius: 6, background: '#f3f4f6', fontSize: '0.82rem', fontWeight: 700 }}>
                              {log.action}
                            </span>
                          </td>
                          <td style={{ color: '#4b5563' }}>{log.details}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      {/* ========================================================
          MEMORY DETAILS MODAL
          ======================================================== */}
      {activeMemory && (
        <div className="memory-modal-overlay" onClick={() => setActiveMemory(null)}>
          <div className="memory-modal-container" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="memory-modal-close-btn"
              onClick={() => setActiveMemory(null)}
              aria-label="Close memory details"
            >
              ✕
            </button>

            {/* Gallery */}
            {activeMemory.images && activeMemory.images.length > 0 ? (
              <div className="memory-modal-gallery">
                <img
                  src={activeMemory.images[activeImageIndex] || activeMemory.images[0]}
                  alt={activeMemory.title}
                  className="memory-modal-main-image"
                />
                {activeMemory.images.length > 1 && (
                  <div className="memory-modal-thumb-strip">
                    {activeMemory.images.map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt={`Photo ${i + 1}`}
                        className={`memory-modal-thumb ${activeImageIndex === i ? 'memory-modal-thumb--active' : ''}`}
                        onClick={() => setActiveImageIndex(i)}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            {/* Header info */}
            <div>
              <div className="memory-card-top-badges">
                <span className="saved-memory-category">{activeMemory.category}</span>
                {activeMemory.mood && (
                  <span className="memory-mood-pill">
                    {text.moods?.[activeMemory.mood] || activeMemory.mood}
                  </span>
                )}
                {activeMemory.memoryDate && (
                  <span style={{ fontSize: '0.9rem', color: '#4b5563' }}>
                    📅 {new Date(activeMemory.memoryDate).toLocaleDateString()}
                  </span>
                )}
                {activeMemory.location && (
                  <span style={{ fontSize: '0.9rem', color: '#047857', fontWeight: 700 }}>
                    📍 {activeMemory.location}
                  </span>
                )}
              </div>

              <h2 style={{ fontSize: '1.6rem', color: '#111827', margin: '8px 0 14px' }}>
                {activeMemory.title}
              </h2>

              <p style={{ fontSize: '1.1rem', lineHeight: 1.7, color: '#374151' }}>
                {activeMemory.description}
              </p>
            </div>

            {/* Audio Note Player if present */}
            {activeMemory.audioData && (
              <div className="memory-modal-audio-player">
                <span style={{ fontSize: '2rem' }}>🎙️</span>
                <div style={{ flex: 1 }}>
                  <strong style={{ display: 'block', color: '#1e3a8a', fontSize: '0.95rem' }}>
                    Original Voice Recording
                  </strong>
                  <audio controls src={activeMemory.audioData} style={{ width: '100%', marginTop: 6 }} />
                </div>
              </div>
            )}

            {/* Speech Narration Button */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                type="button"
                className={`memory-card-narrate-btn ${speakingMemoryId === activeMemory.id ? 'memory-card-narrate-btn--active' : ''}`}
                style={{ minHeight: 48, padding: '10px 22px', fontSize: '1rem' }}
                onClick={() => narrateMemory(activeMemory)}
              >
                <span>{speakingMemoryId === activeMemory.id ? '⏹️ Stop Narration' : '🔊 Listen Aloud'}</span>
              </button>
            </div>

            {/* AI Summary Card */}
            {activeMemory.aiSummary && (
              <div className="memory-modal-ai-summary-card">
                <span className="memory-modal-ai-title">
                  ✨ {text.aiSummaryLabel || 'AI Story Reflection'}
                </span>
                <p style={{ fontSize: '0.95rem', color: '#701a75', lineHeight: 1.55 }}>
                  {activeMemory.aiSummary}
                </p>
              </div>
            )}

            {/* Entity Chips */}
            <div className="memory-entity-chips">
              {activeMemory.people?.map((person) => (
                <span key={person} className="memory-entity-chip memory-entity-chip--person">
                  👥 {person}
                </span>
              ))}
              {activeMemory.locations?.map((loc) => (
                <span key={loc} className="memory-entity-chip memory-entity-chip--location">
                  📍 {loc}
                </span>
              ))}
              {activeMemory.events?.map((evt) => (
                <span key={evt} className="memory-entity-chip memory-entity-chip--event">
                  🎈 {evt}
                </span>
              ))}
              {activeMemory.tags?.map((t) => (
                <span key={t} className="memory-entity-chip" style={{ background: '#f3f4f6', color: '#4b5563' }}>
                  #{t}
                </span>
              ))}
            </div>

            {/* Related Memories */}
            {activeRelated && activeRelated.length > 0 && (
              <div className="memory-related-section">
                <h4 style={{ fontSize: '1.15rem', color: '#1f2937', margin: 0 }}>
                  💡 {text.relatedMemories || 'You May Also Remember'}
                </h4>
                <div className="memory-related-grid">
                  {activeRelated.map((rel) => (
                    <div
                      key={rel.id}
                      className="memory-related-card"
                      onClick={() => handleOpenDetails(rel)}
                    >
                      <strong style={{ color: '#111827', fontSize: '0.95rem' }}>{rel.title}</strong>
                      <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>
                        {rel.category} • {rel.reason}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Voice Memory Recorder Modal */}
      <VoiceMemoryRecorderModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        language={language}
        onMemorySaved={async () => {
          setIsVoiceModalOpen(false)
          setMessage(text.saveSuccess)
          await loadMemories()
          await loadTimeline()
        }}
      />
    </div>
  )
}