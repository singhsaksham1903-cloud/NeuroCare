// ============================================================
// Cognicare NER — Multilingual Voice Companion Engine
// Supports Hindi (hi-IN), Assamese (as-IN), and English (en-IN)
// Designed for modular extensibility for other Northeast languages
// ============================================================

export const SUPPORTED_VOICE_LANGUAGES = {
  hi: {
    id: 'hi',
    name: 'हिन्दी',
    label: 'हिन्दी (Hindi)',
    langCode: 'hi-IN',
    speechRecognitionCode: 'hi-IN',
    speechSynthesisCode: 'hi-IN',
    fallbackSpeechCodes: ['hi-IN', 'hi'],
  },
  as: {
    id: 'as',
    name: 'অসমীয়া',
    label: 'অসমীয়া (Assamese)',
    langCode: 'as-IN',
    // Many desktop/mobile browsers do not have a separate 'as-IN' acoustic model
    // so we set as-IN first, with bn-IN / hi-IN as speech-engine fallbacks
    speechRecognitionCode: 'as-IN',
    speechSynthesisCode: 'as-IN',
    fallbackSpeechCodes: ['as-IN', 'as', 'bn-IN', 'bn', 'hi-IN'],
  },
  en: {
    id: 'en',
    name: 'English',
    label: 'English (Indian)',
    langCode: 'en-IN',
    speechRecognitionCode: 'en-IN',
    speechSynthesisCode: 'en-IN',
    fallbackSpeechCodes: ['en-IN', 'en-GB', 'en-US', 'en'],
  },
};

/**
 * Extensible registry to plug in additional Northeast Indian languages
 * (e.g. Bodo, Meitei/Manipuri, Bengali, Khasi, Mizo, etc.)
 */
export function registerVoiceLanguage(key, config) {
  SUPPORTED_VOICE_LANGUAGES[key] = {
    id: key,
    name: config.name || key,
    label: config.label || key,
    langCode: config.langCode || `${key}-IN`,
    speechRecognitionCode: config.speechRecognitionCode || `${key}-IN`,
    speechSynthesisCode: config.speechSynthesisCode || `${key}-IN`,
    fallbackSpeechCodes: config.fallbackSpeechCodes || [`${key}-IN`],
  };
}

// ============================================================
// Voice Companion Spoken Dialogues & Explanations
// Warm, respectful, elder-friendly tone. Never patronizing.
// ============================================================

export const COMPANION_RESPONSES = {
  hi: {
    greeting: 'नमस्ते! मैं आपका कॉग्निकेयर आवाज़ साथी हूँ। आप मुझसे खेल शुरू करने, यादें देखने, या किसी भी पृष्ठ पर जाने के लिए कह सकते हैं।',
    listening: 'मैं ध्यान से सुन रहा हूँ, कृपया बोलिए...',
    processing: 'आपकी बात समझ रहा हूँ...',
    navDashboard: 'मुख्य होम डैशबोर्ड खोल रहा हूँ।',
    navGames: 'दिमागी खेल पृष्ठ खोल रहा हूँ। आइए मिलकर खेलें।',
    navPerformance: 'आपका प्रगति और प्रदर्शन पृष्ठ दिखा रहा हूँ।',
    navMemories: 'आपकी सहेजी गई यादें खोल रहा हूँ।',
    navReminders: 'आपके आज के सभी रिमाइंडर दिखा रहा हूँ।',
    navCaregiver: 'देखभालकर्ता डैशबोर्ड खोल रहा हूँ।',
    navCaregiverLinks: 'देखभालकर्ता कनेक्शन पृष्ठ खोल रहा हूँ।',
    navRecordMemory: 'नई याद रिकॉर्ड करने की प्रक्रिया शुरू कर रहे हैं।',
    unrecognized: 'माफ़ कीजिए, मुझे यह समझ नहीं आया। आप बोल सकते हैं: "होम खोलो", "मेमोरी गेम शुरू करो", "मेरी यादें खोलो", "मेरी प्रगति दिखाओ", या "रिमाइंडर दिखाओ"।',
    repeatPrompt: 'मैं अपनी बात दोहरा रहा हूँ: ',
    stoppedListening: 'आवाज़ सुनना रोक दिया गया है। जब भी ज़रूरत हो, फिर से माइक दबाएँ।',
    speechUnsupported: 'इस ब्राउज़र में स्पीच रिकग्निशन उपलब्ध नहीं है। आप नीचे दिए गए बटनों या टेक्स्ट बॉक्स का उपयोग कर सकते हैं।',
    permissionDenied: 'माइक्रोफ़ोन की अनुमति नहीं मिली। कृपया ब्राउज़र सेटिंग्स में माइक्रोफ़ोन की अनुमति दें।',
    noSpeechDetected: 'कोई आवाज़ सुनाई नहीं दी। कृपया माइक बटन दबाकर दोबारा बोलें।',
    gameInstructionsHeader: 'खेल के निर्देश:',
    games: {
      'memory-match': 'मेमोरी मैच में आपको दो-दो कार्ड पलटकर एक जैसे चित्रों की जोड़ियाँ बनानी हैं। चित्रों को याद रखिए और सही जोड़ियाँ ढूँढिए।',
      'sequence-memory': 'सीक्वेंस मेमोरी में दिखाए गए रंगों या संख्याओं के क्रम को ध्यान से देखिए, फिर उसी क्रम में बटन दबाइए।',
      'object-recall': 'ऑब्जेक्ट रिकॉल में दिखाई गई वस्तुओं को ध्यान से देखिए। थोड़ी देर बाद याद कीजिए कि आपने क्या देखा था।',
      'ner-cultural-recall': 'सांस्कृतिक स्मृति में उत्तर-पूर्व भारत के परिचित स्थानों, त्योहारों और धरोहरों से जुड़े सवालों के जवाब दीजिए।',
      'personal-memory': 'व्यक्तिगत स्मृति में आपके द्वारा सहेजी गई पुरानी यादों और तस्वीरों पर आधारित सवाल हैं।',
    },
    generalHelp: 'आप बोलकर पूरे ऐप में कहीं भी जा सकते हैं, खेल के नियम सुन सकते हैं, और अपनी यादें रिकॉर्ड कर सकते हैं।',
  },

  as: {
    greeting: 'নমস্কাৰ! মই আপোনাৰ কগ্নিকেয়াৰ কণ্ঠ সংগী। আপুনি মোক খেল আৰম্ভ কৰিবলৈ, স্মৃতি চাবলৈ বা যিকোনো পৃষ্ঠালৈ যাবলৈ ক’ব পাৰে।',
    listening: 'মই মনোযোগেৰে শুনি আছোঁ, অনুগ্ৰহ কৰি কওক...',
    processing: 'আপোনাৰ কথা বুজিবলৈ চেষ্টা কৰি আছোঁ...',
    navDashboard: 'মুখ্য হোম ডেশ্বব’ৰ্ড খুলি আছোঁ।',
    navGames: 'জ্ঞানীয় খেলৰ পৃষ্ঠা খুলি আছোঁ। আহক আমি খেলোঁ।',
    navPerformance: 'আপোনাৰ প্ৰদৰ্শন আৰু অগ্ৰগতিৰ পৃষ্ঠা দেখুৱাইছোঁ।',
    navMemories: 'আপোনাৰ সংৰক্ষিত স্মৃতিসমূহ খুলি আছোঁ।',
    navReminders: 'আপোনাৰ আজিৰ সকলো সোঁৱৰণি দেখুৱাইছোঁ।',
    navCaregiver: 'যত্ন লওঁতাৰ ডেশ্বব’ৰ্ড খুলি আছোঁ।',
    navCaregiverLinks: 'যত্ন লওঁতাৰ সংযোগ পৃষ্ঠা খুলি আছোঁ।',
    navRecordMemory: 'নতুন স্মৃতি ৰেকৰ্ড কৰা আৰম্ভ কৰিছোঁ।',
    unrecognized: 'ক্ষমা কৰিব, মই বুজিব নোৱাৰিলোঁ। আপুনি ক’ব পাৰে: "হোম খোলা", "মেমৰি গেম আৰম্ভ কৰা", "মোৰ স্মৃতিবোৰ খোলা", "মোৰ অগ্ৰগতি দেখুওৱা", বা "ৰিমাইণ্ডাৰ দেখুওৱা"।',
    repeatPrompt: 'মই পুনৰাবৃত্তি কৰিছোঁ: ',
    stoppedListening: 'কণ্ঠ শুনা বন্ধ কৰা হৈছে। প্ৰয়োজন হ’লে পুনৰ মাইক বুটাম টিপক।',
    speechUnsupported: 'এই ব্ৰাউজাৰত স্পীচ ৰিকগনিচন সমৰ্থিত নহয়। আপুনি তলৰ বুটাম বা টেক্সট বক্স ব্যৱহাৰ কৰিব পাৰে।',
    permissionDenied: 'মাইক্ৰ’ফ’নৰ অনুমতি পোৱা নগ’ল। অনুগ্ৰহ কৰি ব্ৰাউজাৰ ছেটিংছত অনুমতি প্ৰদান কৰক।',
    noSpeechDetected: 'কোনো কণ্ঠস্বৰ শুনা নগ’ল। অনুগ্ৰহ কৰি মাইক বুটাম টিপি আকৌ কওক।',
    gameInstructionsHeader: 'খেলৰ নিয়মসমূহ:',
    games: {
      'memory-match': 'মেম’ৰী মেচত আপুনি দুখন দুখন কাৰ্ড উলটাই একে ছবিৰ যোৰ বিচাৰি উলিয়াব লাগিব। ছবিবোৰ মনত ৰাখক আৰু সঠিক যোৰ মিলাওক।',
      'sequence-memory': 'ছিকুৱেন্স মেম’ৰীত প্ৰথমে দেখুওৱা ৰং বা সংখ্যাৰ ক্ৰমটো মন দি চাওক, তাৰ পিছত একে ক্ৰমত বুটাম টিপক।',
      'object-recall': 'অবজেক্ট ৰিকলত দেখুওৱা বস্তুবোৰ মনোযোগেৰে চাওক। কিছু সময়ৰ পিছত মনত পেলাওক যে আপুনি কি দেখিছিল।',
      'ner-cultural-recall': 'সাংস্কৃতিক স্মৃতিত উত্তৰ-পূৰ্বাঞ্চলৰ চিনাকি ঠাই, উৎসৱ আৰু ঐতিহ্যৰ লগত জড়িত প্ৰশ্নৰ উত্তৰ দিয়ক।',
      'personal-memory': 'ব্যক্তিগত স্মৃতিত আপোনাৰ নিজৰ সংৰক্ষিত স্মৃতি আৰু আলোকচিত্ৰৰ ওপৰত আধাৰিত প্ৰশ্ন কৰা হ’ব।',
    },
    generalHelp: 'আপুনি কণ্ঠেৰে কগ্নিকেয়াৰৰ সকলো পৃষ্ঠালৈ যাব পাৰে, খেলৰ নিয়ম শুনিব পাৰে আৰু স্মৃতি ৰেকৰ্ড কৰিব পাৰে।',
  },

  en: {
    greeting: "Hello! I am your Cognicare voice companion. You can ask me to navigate, start cognitive games, view memories, or show your reminders.",
    listening: "I am listening carefully, please speak...",
    processing: "Processing your request...",
    navDashboard: 'Opening the home dashboard.',
    navGames: "Opening cognitive games. Let's exercise your mind with gentle puzzles.",
    navPerformance: 'Showing your performance and cognitive progress.',
    navMemories: 'Opening your personal memories page.',
    navReminders: 'Showing your reminders and daily schedule.',
    navCaregiver: 'Opening the caregiver dashboard.',
    navCaregiverLinks: 'Opening caregiver connections.',
    navRecordMemory: 'Opening voice memory recording.',
    unrecognized: "I didn't quite catch that. You can say: 'Open home', 'Start the memory game', 'Show my progress', 'Open my memories', or 'Show reminders'.",
    repeatPrompt: 'Repeating: ',
    stoppedListening: 'Voice listening stopped. Tap the microphone whenever you are ready.',
    speechUnsupported: 'Voice recognition is not supported in this browser. You can use the touch buttons or text input below.',
    permissionDenied: 'Microphone permission was not granted. Please allow microphone access in your browser settings.',
    noSpeechDetected: 'No speech was detected. Please tap the microphone and speak clearly.',
    gameInstructionsHeader: 'Game Instructions:',
    games: {
      'memory-match': 'In Memory Match, flip two cards at a time to find matching pairs. Remember the picture locations and match them peacefully.',
      'sequence-memory': 'In Sequence Memory, watch the highlighted sequence of colors or numbers carefully, then repeat the exact order.',
      'object-recall': 'In Object Recall, look closely at the items shown. When they disappear, recall and select which items were present.',
      'ner-cultural-recall': 'In Cultural Recall, answer questions celebrating Northeast India festivals, heritage sites, and cherished traditions.',
      'personal-memory': 'In Personal Memory Recall, answer gentle questions about your own photos and saved memories.',
    },
    generalHelp: 'You can navigate freely using your voice, listen to game rules, and record your personal memories.',
  },
};

// ============================================================
// Safe Normalized Command Matching Engine
// Allowlist mapping for Hindi, Assamese, and English
// ============================================================

export function normalizeSpeechText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?'"।]/g, '')
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Maps spoken speech to one of the safe navigation intents
 */
export function parseVoiceCommand(rawTranscript, language = 'en') {
  const text = normalizeSpeechText(rawTranscript);
  if (!text) return null;

  // 1. Dashboard / Home
  // Hindi: "होम खोलो", "होम", "डैशबोर्ड", "घर"
  // Assamese: "হোম খোলা", "হোম", "ডেশ্বব’ৰ্ড"
  // English: "open home", "go to home", "dashboard", "home"
  if (
    text.includes('होम खोलो') ||
    text.includes('होम') ||
    text.includes('डैशबोर्ड') ||
    text.includes('হোম খোলা') ||
    text.includes('হোম') ||
    text.includes('ডেশ্বব’ৰ্ড') ||
    text.includes('open home') ||
    text.includes('go home') ||
    text.includes('dashboard') ||
    text.includes('home')
  ) {
    return {
      intent: 'NAVIGATE',
      page: 'dashboard',
      responseKey: 'navDashboard',
    };
  }

  // 2. Specific Game Direct Jump: Memory Match
  if (
    text.includes('मेमोरी मैच') ||
    text.includes('मेमरी गेम शुरू करो') ||
    text.includes('मेमोरी गेम शुरू करो') ||
    text.includes('মেমৰি গেম আৰম্ভ কৰা') ||
    text.includes('মেম’ৰী মেচ') ||
    text.includes('start the memory game') ||
    text.includes('memory match') ||
    text.includes('card game')
  ) {
    return {
      intent: 'NAVIGATE_GAME',
      page: 'games',
      game: 'memory-match',
      responseKey: 'navGames',
    };
  }

  // Sequence Memory
  if (
    text.includes('सीक्वेंस मेमोरी') ||
    text.includes('सीक्वेंस गेम') ||
    text.includes('ছিকুৱেন্স মেম’ৰী') ||
    text.includes('sequence memory')
  ) {
    return {
      intent: 'NAVIGATE_GAME',
      page: 'games',
      game: 'sequence-memory',
      responseKey: 'navGames',
    };
  }

  // Object Recall
  if (
    text.includes('ऑब्जेक्ट रिकॉल') ||
    text.includes('वस्तु याद') ||
    text.includes('অবজেক্ট ৰিকল') ||
    text.includes('object recall')
  ) {
    return {
      intent: 'NAVIGATE_GAME',
      page: 'games',
      game: 'object-recall',
      responseKey: 'navGames',
    };
  }

  // Cultural Recall
  if (
    text.includes('सांस्कृतिक स्मृति') ||
    text.includes('সাংস্কৃতিক স্মৃতি') ||
    text.includes('cultural recall') ||
    text.includes('ner cultural')
  ) {
    return {
      intent: 'NAVIGATE_GAME',
      page: 'games',
      game: 'ner-cultural-recall',
      responseKey: 'navGames',
    };
  }

  // Cognitive Games General
  // Hindi: "खेल खोलो", "गेम्स", "दिमागी खेल"
  // Assamese: "খেল আৰম্ভ কৰা", "খেল খোলা", "জ্ঞানীয় খেল"
  // English: "open games", "play games", "cognitive games", "start games"
  if (
    text.includes('खेल') ||
    text.includes('गेम') ||
    text.includes('गेम्स') ||
    text.includes('খেল') ||
    text.includes('গেম') ||
    text.includes('games') ||
    text.includes('play')
  ) {
    return {
      intent: 'NAVIGATE',
      page: 'games',
      responseKey: 'navGames',
    };
  }

  // 3. Performance Dashboard / Progress
  // Hindi: "मेरी प्रगति दिखाओ", "प्रगति", "प्रदर्शन", "मेरा स्कोर"
  // Assamese: "মোৰ অগ্ৰগতি দেখুওৱা", "অগ্ৰগতি", "প্ৰদৰ্শন"
  // English: "show my progress", "show progress", "performance", "my score"
  if (
    text.includes('मेरी प्रगति दिखाओ') ||
    text.includes('प्रगति') ||
    text.includes('प्रदर्शन') ||
    text.includes('मोৰ অগ্ৰগতি দেখুওৱা') ||
    text.includes('অগ্ৰগতি') ||
    text.includes('প্ৰদৰ্শন') ||
    text.includes('show my progress') ||
    text.includes('show progress') ||
    text.includes('performance') ||
    text.includes('progress')
  ) {
    return {
      intent: 'NAVIGATE',
      page: 'performance',
      responseKey: 'navPerformance',
    };
  }

  // 4. Voice Memory Recording trigger
  if (
    text.includes('याद रिकॉर्ड करो') ||
    text.includes('नई याद') ||
    text.includes('स्मृति ৰেকৰ্ড কৰা') ||
    text.includes('নতুন স্মৃতি') ||
    text.includes('record a memory') ||
    text.includes('record memory')
  ) {
    return {
      intent: 'RECORD_MEMORY',
      page: 'memories',
      responseKey: 'navRecordMemory',
    };
  }

  // 5. Memories Page
  // Hindi: "मेरी यादें खोलो", "यादें", "मेरी यादें"
  // Assamese: "মোৰ স্মৃতিবোৰ খোলা", "স্মৃতি", "মোৰ স্মৃতি"
  // English: "open my memories", "show memories", "memories"
  if (
    text.includes('मेरी यादें खोलो') ||
    text.includes('मेरी यादें') ||
    text.includes('यादें') ||
    text.includes('मोৰ স্মৃতিবোৰ খোলা') ||
    text.includes('মোৰ স্মৃতি') ||
    text.includes('স্মৃতি') ||
    text.includes('open my memories') ||
    text.includes('open memories') ||
    text.includes('memories')
  ) {
    return {
      intent: 'NAVIGATE',
      page: 'memories',
      responseKey: 'navMemories',
    };
  }

  // 6. Reminders
  // Hindi: "रिमाइंडर दिखाओ", "रिमाइंडर", "दवाइयाँ"
  // Assamese: "ৰিমাইণ্ডাৰ দেখুওৱা", "ৰিমাইণ্ডাৰ", "সোঁৱৰাই দিয়া"
  // English: "show reminders", "reminders", "my reminders"
  if (
    text.includes('रिमाइंडर दिखाओ') ||
    text.includes('रिमाइंडर') ||
    text.includes('দवा') ||
    text.includes('ৰিমাইণ্ডাৰ দেখুওৱা') ||
    text.includes('ৰিমাইণ্ডাৰ') ||
    text.includes('সোঁৱৰাই দিয়া') ||
    text.includes('show reminders') ||
    text.includes('reminders')
  ) {
    return {
      intent: 'NAVIGATE',
      page: 'reminders',
      responseKey: 'navReminders',
    };
  }

  // 7. Caregiver
  if (
    text.includes('देखभालकर्ता') ||
    text.includes('केयरगिवर') ||
    text.includes('যত্ন লওঁতা') ||
    text.includes('caregiver')
  ) {
    return {
      intent: 'NAVIGATE',
      page: 'caregiver',
      responseKey: 'navCaregiver',
    };
  }

  // 8. Help / Instructions request
  if (
    text.includes('मदद') ||
    text.includes('सहायता') ||
    text.includes('नियम बताओ') ||
    text.includes('সহায়') ||
    text.includes('নিয়ম কোৱা') ||
    text.includes('help') ||
    text.includes('instructions') ||
    text.includes('how to play')
  ) {
    return {
      intent: 'HELP',
      responseKey: 'generalHelp',
    };
  }

  // Unknown / unsupported command
  return {
    intent: 'UNKNOWN',
    responseKey: 'unrecognized',
  };
}

// ============================================================
// Speech Synthesis (Text to Speech)
// Robust selection of voices for Indian languages with fallback
// ============================================================

export function speakMessage({
  text,
  language = 'en',
  onStart,
  onEnd,
  onError,
}) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onError?.('Speech synthesis unsupported');
    return null;
  }

  window.speechSynthesis.cancel();

  const langConfig = SUPPORTED_VOICE_LANGUAGES[language] || SUPPORTED_VOICE_LANGUAGES.en;
  const utterance = new SpeechSynthesisUtterance(text);

  // Elder-friendly pacing: slightly slower for clarity and relaxation
  utterance.rate = 0.86;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;
  utterance.lang = langConfig.speechSynthesisCode;

  // Look for the best voice matching language
  const availableVoices = window.speechSynthesis.getVoices() || [];
  if (availableVoices.length > 0) {
    const directMatch = availableVoices.find((v) =>
      langConfig.fallbackSpeechCodes.some((code) =>
        v.lang.toLowerCase().startsWith(code.toLowerCase().slice(0, 2)),
      ),
    );

    if (directMatch) {
      utterance.voice = directMatch;
    } else {
      // Look for Indian English or regional voice
      const indianVoice = availableVoices.find(
        (v) =>
          v.lang.toLowerCase().includes('in') ||
          v.name.toLowerCase().includes('india') ||
          v.name.toLowerCase().includes('hindi') ||
          v.name.toLowerCase().includes('bengali'),
      );
      if (indianVoice) {
        utterance.voice = indianVoice;
      }
    }
  }

  utterance.onstart = () => onStart?.();
  utterance.onend = () => onEnd?.();
  utterance.onerror = (e) => {
    // If canceled manually, do not treat as fatal error
    if (e.error === 'canceled' || e.error === 'interrupted') {
      onEnd?.();
      return;
    }
    onError?.(e.error || 'Speech synthesis error');
  };

  window.speechSynthesis.speak(utterance);
  return utterance;
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
