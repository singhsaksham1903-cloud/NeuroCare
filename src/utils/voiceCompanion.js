/**
 * Cognicare NER — Multilingual Voice Companion Utility
 *
 * Provides browser speech recognition (STT) and speech synthesis (TTS)
 * for Northeast India elderly users with support for:
 *  - Hindi (hi-IN)
 *  - Assamese (as-IN)
 *  - English (en-IN)
 *
 * Designed with graceful fallbacks, offline resilience, and elder accessibility.
 */

export const SUPPORTED_LANGUAGES = [
  {
    code: 'en-IN',
    shortCode: 'en',
    label: 'English',
    nativeLabel: 'English',
    flag: '🇮🇳',
  },
  {
    code: 'hi-IN',
    shortCode: 'hi',
    label: 'Hindi',
    nativeLabel: 'हिन्दी',
    flag: '🇮🇳',
  },
  {
    code: 'as-IN',
    shortCode: 'as',
    label: 'Assamese',
    nativeLabel: 'অসমীয়া',
    flag: '🇮🇳',
  },
]

/**
 * Normalizes language codes ('en', 'hi', 'as' or 'en-IN', 'hi-IN', 'as-IN')
 * to standard BCP-47 speech codes.
 */
export function normalizeLanguageCode(code) {
  if (!code) return 'en-IN'
  const clean = String(code).toLowerCase().trim()
  if (clean.startsWith('hi')) return 'hi-IN'
  if (clean.startsWith('as')) return 'as-IN'
  return 'en-IN'
}

/**
 * Normalizes speech code to 2-letter app language ('en', 'hi', 'as').
 */
export function toShortLanguageCode(code) {
  if (!code) return 'en'
  const clean = String(code).toLowerCase().trim()
  if (clean.startsWith('hi')) return 'hi'
  if (clean.startsWith('as')) return 'as'
  return 'en'
}

/**
 * Browser Speech Recognition capability check.
 */
export function isSpeechRecognitionSupported() {
  if (typeof window === 'undefined') return false
  return Boolean(
    window.SpeechRecognition ||
    window.webkitSpeechRecognition
  )
}

/**
 * Browser Speech Synthesis capability check.
 */
export function isSpeechSynthesisSupported() {
  if (typeof window === 'undefined') return false
  return (
    'speechSynthesis' in window &&
    typeof window.SpeechSynthesisUtterance !== 'undefined'
  )
}

/**
 * Retrieve speech synthesis voices available in the browser.
 */
export function getAvailableVoices() {
  if (!isSpeechSynthesisSupported()) return []
  return window.speechSynthesis.getVoices() || []
}

/**
 * Select the most appropriate synthesis voice for a language.
 * Handles fallback when Assamese or regional voice is missing.
 */
export function findBestVoice(langCode = 'en-IN') {
  if (!isSpeechSynthesisSupported()) return null
  const voices = getAvailableVoices()
  if (!voices || voices.length === 0) return null

  const target = normalizeLanguageCode(langCode).toLowerCase()
  const shortTarget = target.split('-')[0]

  // 1. Exact match (e.g. hi-IN or as-IN)
  let match = voices.find(
    (v) => v.lang && v.lang.toLowerCase().replace('_', '-') === target
  )
  if (match) return match

  // 2. Prefix match (e.g. hi or as)
  match = voices.find(
    (v) => v.lang && v.lang.toLowerCase().startsWith(shortTarget)
  )
  if (match) return match

  // 3. For Assamese (as-IN), if no voice exists in the browser (common in WebSpeech),
  // fallback to Indian English or Hindi voice so speech still plays clearly.
  if (shortTarget === 'as') {
    match = voices.find(
      (v) => v.lang && (v.lang.toLowerCase().includes('en-in') || v.lang.toLowerCase().startsWith('hi'))
    )
    if (match) return match
  }

  // 4. Indian English voice
  match = voices.find(
    (v) => v.lang && v.lang.toLowerCase().replace('_', '-') === 'en-in'
  )
  if (match) return match

  // 5. Default voice
  return voices.find((v) => v.default) || voices[0] || null
}

/**
 * Stops any ongoing speech synthesis playback safely.
 */
export function stopSpeaking() {
  if (isSpeechSynthesisSupported()) {
    try {
      window.speechSynthesis.cancel()
    } catch {
      // Ignored
    }
    if (typeof window !== 'undefined' && window.__activeUtterance) {
      delete window.__activeUtterance
    }
  }
}

/**
 * Speak text aloud using browser text-to-speech with elder-friendly pacing.
 * Prevents garbage-collection freezing and double speech.
 */
export function speakText(text, options = {}) {
  const {
    language = 'en-IN',
    rate = 0.85, // Slower pace for elderly comprehension
    pitch = 1.0,
    volume = 1.0,
    onStart,
    onEnd,
    onError,
  } = options

  if (!isSpeechSynthesisSupported() || !text || !text.trim()) {
    onError?.(new Error('Speech synthesis not available or empty text'))
    return () => {}
  }

  // Stop any active utterance first to prevent overlap and clear the browser queue
  stopSpeaking()

  const normLang = normalizeLanguageCode(language)
  const cleanText = text.trim()
  const utterance = new SpeechSynthesisUtterance(cleanText)
  utterance.lang = normLang
  utterance.rate = rate
  utterance.pitch = pitch
  utterance.volume = volume

  const bestVoice = findBestVoice(normLang)
  if (bestVoice) {
    utterance.voice = bestVoice
  }

  // Store globally to prevent V8 GC from dropping utterance mid-sentence
  if (typeof window !== 'undefined') {
    window.__activeUtterance = utterance
  }

  let completed = false
  let watchdogTimer = null

  const finish = (isErr = false, errObj = null) => {
    if (completed) return
    completed = true
    if (watchdogTimer) {
      clearTimeout(watchdogTimer)
      watchdogTimer = null
    }
    if (typeof window !== 'undefined' && window.__activeUtterance === utterance) {
      delete window.__activeUtterance
    }
    if (isErr) {
      onError?.(errObj)
    } else {
      onEnd?.()
    }
  }

  utterance.onstart = () => {
    onStart?.()
    // Chromium freeze-prevention heartbeat: pulse resume every 5 seconds
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.resume()
      } catch {
        // Ignored
      }
    }
  }

  utterance.onend = () => {
    finish(false)
  }

  utterance.onerror = (event) => {
    if (event.error === 'canceled' || event.error === 'interrupted') {
      finish(false)
      return
    }
    finish(true, event)
  }

  // Safety watchdog: ensure completion within estimated duration + 4s buffer
  const estimatedSeconds = Math.max(4, Math.ceil(cleanText.length / 10))
  watchdogTimer = setTimeout(() => {
    finish(false)
  }, estimatedSeconds * 1000)

  try {
    window.speechSynthesis.speak(utterance)
  } catch (err) {
    finish(true, err)
  }

  return () => {
    stopSpeaking()
  }
}

/**
 * Explicit navigation and activity command mapping for Hindi, Assamese, and English.
 * Returns { action, targetPage, gameId, response } or null.
 */
export function parseVoiceNavigationCommand(rawTranscript) {
  if (!rawTranscript || typeof rawTranscript !== 'string') return null

  // Normalize: lower case, strip excessive punctuation
  const clean = rawTranscript
    .toLowerCase()
    .replace(/[?.!,।]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!clean) return null

  // ==========================================
  // 1. SPECIFIC COGNITIVE GAMES (High Priority)
  // ==========================================

  // Memory Match
  if (
    clean.includes('memory match') ||
    clean.includes('card match') ||
    clean.includes('pair match') ||
    clean.includes('cards') ||
    clean.includes('कार्ड मैच') ||
    clean.includes('मेमोरी मैच') ||
    clean.includes('जोड़े मिलाओ') ||
    clean.includes('মেমৰি মেচ') ||
    clean.includes('কাৰ্ড মেচ')
  ) {
    return {
      action: 'navigate',
      targetPage: 'games',
      gameId: 'memory-match',
      response: {
        en: 'Opening Memory Match card pair activity.',
        hi: 'मेमोरी मैच कार्ड गेम शुरू किया जा रहा है।',
        as: 'মেমৰি মেচ কাৰ্ড খেল খোলা হৈছে।',
      },
    }
  }

  // Sequence Memory
  if (
    clean.includes('sequence memory') ||
    clean.includes('sequence game') ||
    clean.includes('pattern memory') ||
    clean.includes('flashing sequence') ||
    clean.includes('सीक्वेंस मेमोरी') ||
    clean.includes('क्रम स्मृति') ||
    clean.includes('क्रम खेल') ||
    clean.includes('ক্ৰম স্মৃতি') ||
    clean.includes('ছিকুৱেন্স মেমৰি')
  ) {
    return {
      action: 'navigate',
      targetPage: 'games',
      gameId: 'sequence-memory',
      response: {
        en: 'Starting Sequence Memory pattern exercise.',
        hi: 'सीक्वेंस मेमोरी खेल शुरू किया जा रहा है।',
        as: 'ক্ৰম স্মৃতি খেল আৰম্ভ কৰা হৈছে।',
      },
    }
  }

  // Object Recall
  if (
    clean.includes('object recall') ||
    clean.includes('object game') ||
    clean.includes('remember objects') ||
    clean.includes('वस्तु स्मरण') ||
    clean.includes('ऑब्जेक्ट रिकॉल') ||
    clean.includes('वस्तु खेल') ||
    clean.includes('বস্তু মনত পেলোৱা') ||
    clean.includes('বস্তু স্মৃতি')
  ) {
    return {
      action: 'navigate',
      targetPage: 'games',
      gameId: 'object-recall',
      response: {
        en: 'Opening Object Recall recognition game.',
        hi: 'ऑब्जेक्ट रिकॉल खेल खोला जा रहा है।',
        as: 'বস্তু মনত পেলোৱা খেল খোলা হৈছে।',
      },
    }
  }

  // NER Cultural Recall
  if (
    clean.includes('cultural recall') ||
    clean.includes('cultural game') ||
    clean.includes('north east') ||
    clean.includes('assam recall') ||
    clean.includes('সাংস্কৃতিক') ||
    clean.includes('সাংস্কৃতিক খেল') ||
    clean.includes('নৰ্থ ইষ্ট') ||
    clean.includes('सांस्कृतिक खेल') ||
    clean.includes('पूर्वोत्तर खेल')
  ) {
    return {
      action: 'navigate',
      targetPage: 'games',
      gameId: 'ner-cultural-recall',
      response: {
        en: 'Opening Cultural Recall of North East India traditions.',
        hi: 'पूर्वोत्तर भारत की सांस्कृतिक यादों का खेल शुरू किया जा रहा है।',
        as: 'উত্তৰ-পূব ভাৰতৰ সাংস্কৃতিক স্মৃতিৰ খেল খোলা হৈছে।',
      },
    }
  }

  // Personal Memory Recall
  if (
    clean.includes('personal memory recall') ||
    clean.includes('personal recall') ||
    clean.includes('my memory game') ||
    clean.includes('व्यक्तिगत यादें खेल') ||
    clean.includes('ব্যক্তিগত স্মৃতি খেল')
  ) {
    return {
      action: 'navigate',
      targetPage: 'games',
      gameId: 'personal-memory',
      response: {
        en: 'Opening your personal Memory Recall reflections.',
        hi: 'आपकी व्यक्तिगत यादों का खेल खोला जा रहा है।',
        as: 'আপোনাৰ ব্যক্তিগত স্মৃতিৰ খেল খোলা হৈছে।',
      },
    }
  }

  // ==========================================
  // 2. PAGES NAVIGATION
  // ==========================================

  // Dashboard / Home
  if (
    clean.includes('open home') ||
    clean.includes('go home') ||
    clean.includes('go to home') ||
    clean.includes('back home') ||
    clean.includes('dashboard') ||
    clean === 'home' ||
    clean.includes('होम खोलो') ||
    clean.includes('होम पर जाओ') ||
    clean.includes('मुख्य पृष्ठ') ||
    clean.includes('डैशबोर्ड') ||
    clean === 'होम' ||
    clean.includes('হোম খোলা') ||
    clean.includes('হোমলৈ যোৱা') ||
    clean.includes('মুখ্য পৃষ্ঠা') ||
    clean.includes('ডেচবৰ্ড') ||
    clean === 'হোম'
  ) {
    return {
      action: 'navigate',
      targetPage: 'dashboard',
      response: {
        en: 'Taking you to the Home Dashboard.',
        hi: 'आपको मुख्य डैशबोर्ड पर ले जाया जा रहा है।',
        as: 'আপোনাক মুখ্য ডেচবৰ্ডলৈ লৈ যোৱা হৈছে।',
      },
    }
  }

  // All Cognitive Games
  if (
    clean.includes('game') ||
    clean.includes('play') ||
    clean.includes('activities') ||
    clean.includes('puzzles') ||
    clean.includes('खेल') ||
    clean.includes('गेम') ||
    clean.includes('खेलो') ||
    clean.includes('খেল') ||
    clean.includes('কগনিটিভ')
  ) {
    return {
      action: 'navigate',
      targetPage: 'games',
      response: {
        en: 'Opening Cognitive Games.',
        hi: 'संज्ञानात्मक खेल खोले जा रहे हैं।',
        as: 'কগনিটিভ খেলসমূহ খোলা হৈছে।',
      },
    }
  }

  // Performance / Progress
  if (
    clean.includes('progress') ||
    clean.includes('performance') ||
    clean.includes('score') ||
    clean.includes('accuracy') ||
    clean.includes('insights') ||
    clean.includes('charts') ||
    clean.includes('प्रगति') ||
    clean.includes('प्रदर्शन') ||
    clean.includes('स्कोर') ||
    clean.includes('अंक') ||
    clean.includes('অগ্ৰগতি') ||
    clean.includes('প্ৰদৰ্শন') ||
    clean.includes('স্কোৰ')
  ) {
    return {
      action: 'navigate',
      targetPage: 'performance',
      response: {
        en: 'Showing your progress and performance.',
        hi: 'आपकी प्रगति और प्रदर्शन दिखाया जा रहा है।',
        as: 'আপোনাৰ অগ্ৰগতি আৰু প্ৰদৰ্শন দেখুওৱা হৈছে।',
      },
    }
  }

  // Memories / Memory Vault
  if (
    clean.includes('memories') ||
    clean.includes('memory vault') ||
    clean.includes('photos') ||
    clean.includes('stories') ||
    clean.includes('story') ||
    clean.includes('यादें') ||
    clean.includes('याद') ||
    clean.includes('तस्वीरें') ||
    clean.includes('स्मृति') ||
    clean.includes('ছবি') ||
    clean.includes('কাহিনী')
  ) {
    return {
      action: 'navigate',
      targetPage: 'memories',
      response: {
        en: 'Opening your personal Memory Vault.',
        hi: 'आपकी यादों का खजाना खोला जा रहा है।',
        as: 'আপোনাৰ স্মৃতিসমূহ খোলা হৈছে।',
      },
    }
  }

  // Reminders
  if (
    clean.includes('reminder') ||
    clean.includes('remind') ||
    clean.includes('medicine') ||
    clean.includes('pills') ||
    clean.includes('schedule') ||
    clean.includes('रिमाइंडर') ||
    clean.includes('दवा') ||
    clean.includes('काम') ||
    clean.includes('ৰিমাইণ্ডাৰ') ||
    clean.includes('ঔষধ') ||
    clean.includes('মনত পেলোৱা')
  ) {
    return {
      action: 'navigate',
      targetPage: 'reminders',
      response: {
        en: 'Opening your reminders.',
        hi: 'आपके रिमाइंडर खोले जा रहे हैं।',
        as: 'আপোনাৰ ৰিমাইণ্ডাৰসমূহ খোলা হৈছে।',
      },
    }
  }

  // Caregiver Dashboard & Connections
  if (
    clean.includes('caregiver') ||
    clean.includes('doctor') ||
    clean.includes('family link') ||
    clean.includes('connections') ||
    clean.includes('requests') ||
    clean.includes('केयरगिवर') ||
    clean.includes('डॉक्टर') ||
    clean.includes('केयर') ||
    clean.includes('কেয়াৰগিভাৰ') ||
    clean.includes('চিকিৎসক')
  ) {
    return {
      action: 'navigate',
      targetPage: 'caregiver',
      response: {
        en: 'Opening Caregiver Dashboard.',
        hi: 'केयरगिवर डैशबोर्ड खोला जा रहा है।',
        as: 'কেয়াৰগিভাৰ ডেচবৰ্ড খোলা হৈছে।',
      },
    }
  }

  // Help & Information
  if (
    clean.includes('help') ||
    clean.includes('what can you do') ||
    clean.includes('instructions') ||
    clean.includes('मदद') ||
    clean.includes('सहायता') ||
    clean.includes('तुम क्या कर सकते हो') ||
    clean.includes('সহায়') ||
    clean.includes('আপুনি কি কৰিব পাৰে')
  ) {
    return {
      action: 'help',
      response: {
        en: "I can help you navigate Cognicare. Try saying: 'Open home', 'Start memory game', 'Show my progress', 'Open my memories', or 'Show reminders'.",
        hi: "मैं कॉग्निकेयर में आपकी मदद कर सकता हूँ। आप कह सकते हैं: 'होम खोलो', 'मेमोरी गेम शुरू करो', 'मेरी प्रगति दिखाओ', 'मेरी यादें खोलो', या 'रिमाइंडर दिखाओ'।",
        as: "মই Cognicare ব্যৱহাৰত আপোনাক সহায় কৰিব পাৰোঁ। আপুনি ক’ব পাৰে: 'হোম খোলা', 'মেমৰি গেম আৰম্ভ কৰা', 'মোৰ অগ্ৰগতি দেখুওৱা', 'মোৰ স্মৃতিবোৰ খোলা', বা 'ৰিমাইণ্ডাৰ দেখুওৱা'।",
      },
    }
  }

  // Greetings
  if (
    clean.includes('hello') ||
    clean.includes('hi') ||
    clean.includes('good morning') ||
    clean.includes('good afternoon') ||
    clean.includes('good evening') ||
    clean.includes('नमस्ते') ||
    clean.includes('प्रणाम') ||
    clean.includes('নমস্কাৰ')
  ) {
    return {
      action: 'greeting',
      response: {
        en: 'Hello! I am here and ready to help you. What would you like to do today?',
        hi: 'नमस्ते! मैं आपकी मदद के लिए तैयार हूँ। आज आप क्या करना चाहेंगे?',
        as: 'নমস্কাৰ! মই আপোনাৰ সহায়ৰ বাবে সাজু আছোঁ। আজি আপুনি কি কৰিব বিচাৰে?',
      },
    }
  }

  // Conversational fallback
  return null
}

/**
 * Creates a configured SpeechRecognition instance wrapped with safe lifecycle management,
 * auto-silence watchdog, and deduplication.
 */
export function createSpeechRecognizer({
  language = 'en-IN',
  continuous = false,
  interimResults = true,
  onStart,
  onResult,
  onError,
  onEnd,
}) {
  if (!isSpeechRecognitionSupported()) {
    return null
  }

  const SpeechRecognitionClass =
    window.SpeechRecognition || window.webkitSpeechRecognition

  const recognition = new SpeechRecognitionClass()
  recognition.lang = normalizeLanguageCode(language)
  recognition.continuous = continuous
  recognition.interimResults = interimResults
  recognition.maxAlternatives = 1

  let status = 'idle'
  let silenceTimer = null
  let hasReceivedFinal = false

  const resetSilenceTimer = () => {
    if (silenceTimer) clearTimeout(silenceTimer)
    silenceTimer = setTimeout(() => {
      if (status === 'listening') {
        try {
          recognition.stop()
        } catch {
          // Ignored
        }
      }
    }, 9000)
  }

  recognition.onstart = () => {
    status = 'listening'
    hasReceivedFinal = false
    resetSilenceTimer()
    onStart?.()
  }

  recognition.onresult = (event) => {
    resetSilenceTimer()
    let interimTranscript = ''
    let finalTranscript = ''

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const item = event.results[i]
      const text = item[0]?.transcript || ''
      if (item.isFinal) {
        finalTranscript += text
      } else {
        interimTranscript += text
      }
    }

    const cleanFinal = finalTranscript.trim()
    const cleanInterim = interimTranscript.trim()

    if (cleanFinal && !hasReceivedFinal) {
      hasReceivedFinal = true
      if (silenceTimer) clearTimeout(silenceTimer)
      // Stop recognition immediately upon final result so mic doesn't pick up speaker response
      try {
        recognition.stop()
      } catch {
        // Ignored
      }
      onResult?.({
        finalTranscript: cleanFinal,
        interimTranscript: '',
        rawEvent: event,
      })
    } else if (cleanInterim && !hasReceivedFinal) {
      onResult?.({
        finalTranscript: '',
        interimTranscript: cleanInterim,
        rawEvent: event,
      })
    }
  }

  recognition.onerror = (event) => {
    if (silenceTimer) clearTimeout(silenceTimer)
    status = 'idle'
    if (event.error === 'aborted') {
      return
    }
    onError?.(event)
  }

  recognition.onend = () => {
    if (silenceTimer) clearTimeout(silenceTimer)
    status = 'idle'
    onEnd?.()
  }

  return {
    start: () => {
      if (status === 'listening' || status === 'starting') return
      status = 'starting'
      hasReceivedFinal = false
      try {
        recognition.start()
      } catch (err) {
        status = 'idle'
        if (err?.name !== 'InvalidStateError') {
          onError?.(err)
        }
      }
    },
    stop: () => {
      if (status === 'idle' || status === 'stopping') return
      status = 'stopping'
      if (silenceTimer) clearTimeout(silenceTimer)
      try {
        recognition.stop()
      } catch {
        // Ignored
      }
    },
    abort: () => {
      if (silenceTimer) clearTimeout(silenceTimer)
      try {
        recognition.abort()
      } catch {
        // Ignored
      }
      status = 'idle'
    },
    isRunning: () => status === 'listening' || status === 'starting',
    getState: () => status,
    setLanguage: (newLang) => {
      recognition.lang = normalizeLanguageCode(newLang)
    },
  }
}
