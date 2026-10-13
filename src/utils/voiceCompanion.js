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
 * Stops any ongoing speech synthesis playback.
 */
export function stopSpeaking() {
  if (isSpeechSynthesisSupported()) {
    try {
      window.speechSynthesis.cancel()
    } catch {
      // Ignored
    }
  }
}

/**
 * Speak text aloud using browser text-to-speech with elder-friendly pacing.
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

  // Stop any active utterance first to prevent overlap
  stopSpeaking()

  const normLang = normalizeLanguageCode(language)
  const utterance = new SpeechSynthesisUtterance(text.trim())
  utterance.lang = normLang
  utterance.rate = rate
  utterance.pitch = pitch
  utterance.volume = volume

  const bestVoice = findBestVoice(normLang)
  if (bestVoice) {
    utterance.voice = bestVoice
  }

  utterance.onstart = () => {
    onStart?.()
  }

  utterance.onend = () => {
    onEnd?.()
  }

  utterance.onerror = (event) => {
    // Interrupted or canceled by user is expected when stopping
    if (event.error === 'canceled' || event.error === 'interrupted') {
      onEnd?.()
      return
    }
    onError?.(event)
  }

  try {
    window.speechSynthesis.speak(utterance)
  } catch (err) {
    onError?.(err)
  }

  return () => {
    stopSpeaking()
  }
}

/**
 * Explicit navigation command mapping for Hindi, Assamese, and English.
 * Returns { targetPage, gameId, matchedText, confirmationText } or null.
 */
export function parseVoiceNavigationCommand(rawTranscript) {
  if (!rawTranscript || typeof rawTranscript !== 'string') return null

  // Normalize: lower case, strip excessive punctuation
  const clean = rawTranscript
    .toLowerCase()
    .replace(/[?.!,।]/g, ' ')
    .trim()

  if (!clean) return null

  // Target routes allowlist in Cognicare NER:
  // - 'dashboard'
  // - 'games'
  // - 'performance'
  // - 'memories'
  // - 'reminders'
  // - 'caregiver'
  // - 'caregiver-links'

  // ==========================================
  // 1. HINDI COMMANDS
  // ==========================================
  // Examples: होम खोलो, मुख्य पृष्ठ, मेमोरी गेम शुरू करो, मेरी प्रगति दिखाओ, मेरी यादें खोलो, रिमाइंडर दिखाओ
  if (
    clean.includes('होम खोलो') ||
    clean.includes('होम पर जाओ') ||
    clean.includes('मुख्य पृष्ठ') ||
    clean.includes('डैशबोर्ड खोलो') ||
    clean.includes('डैशबोर्ड पर जाओ') ||
    clean === 'होम'
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

  if (
    clean.includes('मेमोरी गेम शुरू करो') ||
    clean.includes('मेमोरी गेम खोलो') ||
    clean.includes('खेल खोलो') ||
    clean.includes('गेम खोलो') ||
    clean.includes('गेम शुरू करो') ||
    clean.includes('संज्ञानात्मक खेल')
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

  if (
    clean.includes('मेरी प्रगति दिखाओ') ||
    clean.includes('प्रगति दिखाओ') ||
    clean.includes('मेरा प्रदर्शन दिखाओ') ||
    clean.includes('प्रदर्शन खोलो')
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

  if (
    clean.includes('मेरी यादें खोलो') ||
    clean.includes('मेरी यादें दिखाओ') ||
    clean.includes('यादें खोलो') ||
    clean.includes('यादें दिखाओ') ||
    clean.includes('याद खोलो')
  ) {
    return {
      action: 'navigate',
      targetPage: 'memories',
      response: {
        en: 'Opening your personal memories.',
        hi: 'आपकी यादें खोली जा रही हैं।',
        as: 'আপোনাৰ স্মৃতিসমূহ খোলা হৈছে।',
      },
    }
  }

  if (
    clean.includes('रिमाइंडर दिखाओ') ||
    clean.includes('रिमाइंडर खोलो') ||
    clean.includes('मेरे रिमाइंडर') ||
    clean.includes('दवा रिमाइंडर')
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

  // ==========================================
  // 2. ASSAMESE COMMANDS
  // ==========================================
  // Examples: হোম খোলা, মেমৰি গেম আৰম্ভ কৰা, মোৰ অগ্ৰগতি দেখুওৱা, মোৰ স্মৃতিবোৰ খোলা, ৰিমাইণ্ডাৰ দেখুওৱা
  if (
    clean.includes('হোম খোলা') ||
    clean.includes('হোমলৈ যোৱা') ||
    clean.includes('মুখ্য পৃষ্ঠা') ||
    clean.includes('ডেচবৰ্ড খোলা') ||
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

  if (
    clean.includes('মেমৰি গেম আৰম্ভ কৰা') ||
    clean.includes('মেমৰি গেম খোলা') ||
    clean.includes('খেল আৰম্ভ কৰা') ||
    clean.includes('খেলবোৰ খোলা') ||
    clean.includes('কগনিটিভ খেল')
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

  if (
    clean.includes('মোৰ অগ্ৰগতি দেখুওৱা') ||
    clean.includes('অগ্ৰগতি দেখুওৱা') ||
    clean.includes('প্ৰদৰ্শন দেখুওৱা') ||
    clean.includes('মোৰ প্ৰদৰ্শন')
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

  if (
    clean.includes('মোৰ স্মৃতিবোৰ খোলা') ||
    clean.includes('স্মৃতিবোৰ খোলা') ||
    clean.includes('স্মৃতি দেখুওৱা') ||
    clean.includes('মোৰ স্মৃতি')
  ) {
    return {
      action: 'navigate',
      targetPage: 'memories',
      response: {
        en: 'Opening your personal memories.',
        hi: 'आपकी यादें खोली जा रही हैं।',
        as: 'আপোনাৰ স্মৃতিসমূহ খোলা হৈছে।',
      },
    }
  }

  if (
    clean.includes('ৰিমাইণ্ডাৰ দেখুওৱা') ||
    clean.includes('ৰিমাইণ্ডাৰ খোলা') ||
    clean.includes('মোৰ ৰিমাইণ্ডাৰ') ||
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

  // ==========================================
  // 3. ENGLISH COMMANDS
  // ==========================================
  // Examples: Open home, Start the memory game, Show my progress, Open my memories, Show reminders
  if (
    clean.includes('open home') ||
    clean.includes('go to home') ||
    clean.includes('open dashboard') ||
    clean.includes('back to home') ||
    clean === 'home' ||
    clean === 'dashboard'
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

  if (
    clean.includes('start the memory game') ||
    clean.includes('start memory game') ||
    clean.includes('open games') ||
    clean.includes('open game') ||
    clean.includes('play game') ||
    clean.includes('play games') ||
    clean.includes('cognitive games')
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

  if (
    clean.includes('show my progress') ||
    clean.includes('show progress') ||
    clean.includes('view performance') ||
    clean.includes('open performance') ||
    clean.includes('my progress') ||
    clean.includes('my performance')
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

  if (
    clean.includes('open my memories') ||
    clean.includes('open memories') ||
    clean.includes('show memories') ||
    clean.includes('view memories') ||
    clean.includes('my memories')
  ) {
    return {
      action: 'navigate',
      targetPage: 'memories',
      response: {
        en: 'Opening your personal memories.',
        hi: 'आपकी यादें खोली जा रही हैं।',
        as: 'আপোনাৰ স্মৃতিসমূহ খোলা হৈছে।',
      },
    }
  }

  if (
    clean.includes('show reminders') ||
    clean.includes('open reminders') ||
    clean.includes('view reminders') ||
    clean.includes('my reminders') ||
    clean === 'reminders'
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

  if (
    clean.includes('caregiver dashboard') ||
    clean.includes('open caregiver')
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

  // ==========================================
  // 4. HELP COMMANDS
  // ==========================================
  if (
    clean.includes('help') ||
    clean.includes('मदद') ||
    clean.includes('সহায়') ||
    clean.includes('what can you do') ||
    clean.includes('तुम क्या कर सकते हो')
  ) {
    return {
      action: 'help',
      response: {
        en: "I can help you navigate Cognicare. Try saying: 'Open home', 'Start the memory game', 'Show my progress', 'Open my memories', or 'Show reminders'.",
        hi: "मैं Cognicare में आपकी मदद कर सकता हूँ। आप कह सकते हैं: 'होम खोलो', 'मेमोरी गेम शुरू करो', 'मेरी प्रगति दिखाओ', 'मेरी यादें खोलो', या 'रिमाइंडर दिखाओ'।",
        as: "মই Cognicare ব্যৱহাৰত আপোনাক সহায় কৰিব পাৰোঁ। আপুনি ক’ব পাৰে: 'হোম খোলা', 'মেমৰি গেম আৰম্ভ কৰা', 'মোৰ অগ্ৰগতি দেখুওৱা', 'মোৰ স্মৃতিবোৰ খোলা', বা 'ৰিমাইণ্ডাৰ দেখুওৱা'।",
      },
    }
  }

  // Unrecognized command
  return {
    action: 'unknown',
    transcript: clean,
    response: {
      en: `I didn't recognize that command. Try saying 'Open home', 'Start the memory game', 'Show my progress', 'Open my memories', or 'Show reminders'.`,
      hi: `मुझे यह निर्देश समझ नहीं आया। आप कह सकते हैं: 'होम खोलो', 'मेमोरी गेम शुरू करो', 'मेरी प्रगति दिखाओ', 'मेरी यादें खोलो', या 'रिमाइंडर दिखाओ'।`,
      as: `মই এই নিৰ্দেশটো বুজি নাপালোঁ। আপুনি ক’ব পাৰে: 'হোম খোলা', 'মেমৰি গেম আৰম্ভ কৰা', 'মোৰ অগ্ৰগতি দেখুওৱা', 'মোৰ স্মৃতিবোৰ খোলা', বা 'ৰিমাইণ্ডাৰ দেখুওৱা'।`,
    },
  }
}

/**
 * Creates a configured SpeechRecognition instance wrapped with safe lifecycle management.
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

  let isRunning = false

  recognition.onstart = () => {
    isRunning = true
    onStart?.()
  }

  recognition.onresult = (event) => {
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

    onResult?.({
      finalTranscript: finalTranscript.trim(),
      interimTranscript: interimTranscript.trim(),
      rawEvent: event,
    })
  }

  recognition.onerror = (event) => {
    isRunning = false
    if (event.error === 'aborted') {
      return
    }
    onError?.(event)
  }

  recognition.onend = () => {
    isRunning = false
    onEnd?.()
  }

  return {
    start: () => {
      if (isRunning) return
      try {
        recognition.start()
      } catch (err) {
        if (err?.name !== 'InvalidStateError') {
          onError?.(err)
        }
      }
    },
    stop: () => {
      if (!isRunning) return
      try {
        recognition.stop()
      } catch {
        // Ignored
      }
    },
    abort: () => {
      try {
        recognition.abort()
      } catch {
        // Ignored
      }
      isRunning = false
    },
    isRunning: () => isRunning,
    setLanguage: (newLang) => {
      recognition.lang = normalizeLanguageCode(newLang)
    },
  }
}
