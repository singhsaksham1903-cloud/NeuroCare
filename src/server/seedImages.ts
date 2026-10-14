// Seed photo illustrations for elderly memories
export const SEED_PHOTO_SHILLONG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="100%" height="100%">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="%2387ceeb"/>
      <stop offset="50%" stop-color="%23b8e2f2"/>
      <stop offset="100%" stop-color="%23e0f4fc"/>
    </linearGradient>
    <linearGradient id="hills1" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="%235a9e78"/>
      <stop offset="100%" stop-color="%233d7b57"/>
    </linearGradient>
    <linearGradient id="hills2" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="%23438e65"/>
      <stop offset="100%" stop-color="%232b6343"/>
    </linearGradient>
    <linearGradient id="hills3" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="%232e734b"/>
      <stop offset="100%" stop-color="%231a472c"/>
    </linearGradient>
  </defs>
  <rect width="800" height="500" fill="url(%23sky)"/>
  <!-- Distant Blue Mountains -->
  <path d="M0 240 Q160 160 320 230 T640 190 Q720 220 800 240 L800 500 L0 500 Z" fill="%237ca5b8" opacity="0.5"/>
  <path d="M0 280 Q200 210 400 270 T800 260 L800 500 L0 500 Z" fill="url(%23hills1)"/>
  <!-- Middle Tea Terraces -->
  <path d="M0 340 Q250 290 500 340 T800 320 L800 500 L0 500 Z" fill="url(%23hills2)"/>
  <!-- Tea garden contours -->
  <path d="M-20 370 Q180 340 380 370 T780 350" stroke="%232e734b" stroke-width="4" fill="none" opacity="0.6"/>
  <path d="M-10 400 Q200 370 420 400 T820 380" stroke="%232e734b" stroke-width="5" fill="none" opacity="0.6"/>
  <path d="M0 430 Q220 400 460 430 T800 410" stroke="%232e734b" stroke-width="6" fill="none" opacity="0.6"/>
  <!-- Foreground rolling hill -->
  <path d="M0 420 Q300 380 600 430 Q700 440 800 420 L800 500 L0 500 Z" fill="url(%23hills3)"/>
  <!-- Pine trees -->
  <polygon points="120,310 105,350 135,350" fill="%231d472c"/>
  <polygon points="120,330 100,370 140,370" fill="%231d472c"/>
  <polygon points="150,290 138,330 162,330" fill="%23225233"/>
  <polygon points="150,310 132,350 168,350" fill="%23225233"/>
  <!-- Fluffy clouds -->
  <circle cx="180" cy="110" r="35" fill="%23ffffff" opacity="0.85"/>
  <circle cx="220" cy="100" r="45" fill="%23ffffff" opacity="0.85"/>
  <circle cx="260" cy="110" r="35" fill="%23ffffff" opacity="0.85"/>
  <circle cx="580" cy="90" r="30" fill="%23ffffff" opacity="0.75"/>
  <circle cx="620" cy="80" r="40" fill="%23ffffff" opacity="0.75"/>
  <circle cx="660" cy="90" r="30" fill="%23ffffff" opacity="0.75"/>
  <!-- Badge text -->
  <rect x="30" y="440" width="220" height="34" rx="8" fill="%23ffffff" opacity="0.9"/>
  <text x="45" y="463" font-family="sans-serif" font-size="14" font-weight="bold" fill="%231d472c">🌲 Shillong Hills, 1985</text>
</svg>`;

export const SEED_PHOTO_JAIPUR = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="100%" height="100%">
  <defs>
    <radialGradient id="nightSky" cx="50%" cy="30%" r="70%">
      <stop offset="0%" stop-color="%23231942"/>
      <stop offset="60%" stop-color="%23140e2b"/>
      <stop offset="100%" stop-color="%230b0817"/>
    </radialGradient>
    <radialGradient id="diyaGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="%23ffdf70"/>
      <stop offset="40%" stop-color="%23ff9a3c"/>
      <stop offset="100%" stop-color="%23ff9a3c00"/>
    </radialGradient>
  </defs>
  <rect width="800" height="500" fill="url(%23nightSky)"/>
  <!-- Stars -->
  <circle cx="100" cy="80" r="2" fill="%23ffffff" opacity="0.8"/>
  <circle cx="190" cy="40" r="1.5" fill="%23ffffff" opacity="0.7"/>
  <circle cx="340" cy="70" r="2.5" fill="%23ffffff" opacity="0.9"/>
  <circle cx="520" cy="50" r="2" fill="%23ffffff" opacity="0.8"/>
  <circle cx="680" cy="90" r="1.5" fill="%23ffffff" opacity="0.7"/>
  <circle cx="740" cy="40" r="2" fill="%23ffffff" opacity="0.9"/>
  <!-- Golden Moon -->
  <path d="M 640 60 A 35 35 0 0 0 665 110 A 42 42 0 1 1 640 60 Z" fill="%23ffe49e"/>
  <!-- Palace Arches Silhouette -->
  <path d="M 0 320 L 0 500 L 800 500 L 800 320 L 740 320 Q 700 240 660 320 L 600 320 Q 560 220 520 320 L 460 320 Q 400 180 340 320 L 280 320 Q 240 220 200 320 L 140 320 Q 100 240 60 320 Z" fill="%23422038" opacity="0.95"/>
  <!-- Courtyard floor -->
  <rect x="0" y="380" width="800" height="120" fill="%232b1323"/>
  <!-- Row of Glowing Diyas -->
  <!-- Diya 1 -->
  <circle cx="120" cy="425" r="50" fill="url(%23diyaGlow)"/>
  <ellipse cx="120" cy="435" rx="30" ry="12" fill="%23b85d19"/>
  <path d="M 120 425 Q 128 410 120 395 Q 112 410 120 425 Z" fill="%23ffeaa7"/>
  <!-- Diya 2 -->
  <circle cx="260" cy="425" r="50" fill="url(%23diyaGlow)"/>
  <ellipse cx="260" cy="435" rx="30" ry="12" fill="%23b85d19"/>
  <path d="M 260 425 Q 268 410 260 395 Q 252 410 260 425 Z" fill="%23ffeaa7"/>
  <!-- Diya 3 (Center large) -->
  <circle cx="400" cy="420" r="70" fill="url(%23diyaGlow)"/>
  <ellipse cx="400" cy="435" rx="42" ry="16" fill="%23c4621c"/>
  <path d="M 400 420 Q 412 400 400 380 Q 388 400 400 420 Z" fill="%23fff2c6"/>
  <!-- Diya 4 -->
  <circle cx="540" cy="425" r="50" fill="url(%23diyaGlow)"/>
  <ellipse cx="540" cy="435" rx="30" ry="12" fill="%23b85d19"/>
  <path d="M 540 425 Q 548 410 540 395 Q 532 410 540 425 Z" fill="%23ffeaa7"/>
  <!-- Diya 5 -->
  <circle cx="680" cy="425" r="50" fill="url(%23diyaGlow)"/>
  <ellipse cx="680" cy="435" rx="30" ry="12" fill="%23b85d19"/>
  <path d="M 680 425 Q 688 410 680 395 Q 672 410 680 425 Z" fill="%23ffeaa7"/>
  <!-- Marigold Garlands -->
  <path d="M 0 330 Q 200 370 400 330 Q 600 370 800 330" stroke="%23ff9f1c" stroke-width="8" stroke-dasharray="14 6" fill="none"/>
  <!-- Badge text -->
  <rect x="30" y="440" width="230" height="34" rx="8" fill="%231a0915" opacity="0.9"/>
  <text x="45" y="463" font-family="sans-serif" font-size="14" font-weight="bold" fill="%23ffc83b">🪔 Diwali Courtyard, 1992</text>
</svg>`;

export const SEED_PHOTO_TULSI = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="100%" height="100%">
  <defs>
    <linearGradient id="morningLight" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="%23fff9e6"/>
      <stop offset="50%" stop-color="%23fcf1d4"/>
      <stop offset="100%" stop-color="%23e3e9d7"/>
    </linearGradient>
  </defs>
  <rect width="800" height="500" fill="url(%23morningLight)"/>
  <!-- Morning Sunbeams -->
  <polygon points="0,0 280,0 420,500 120,500" fill="%23ffffff" opacity="0.35"/>
  <polygon points="200,0 520,0 680,500 340,500" fill="%23ffffff" opacity="0.25"/>
  <!-- Verandah wooden railing -->
  <rect x="0" y="340" width="800" height="24" fill="%239c6644"/>
  <line x1="80" y1="364" x2="80" y2="500" stroke="%23b07d58" stroke-width="16"/>
  <line x1="200" y1="364" x2="200" y2="500" stroke="%23b07d58" stroke-width="16"/>
  <line x1="600" y1="364" x2="600" y2="500" stroke="%23b07d58" stroke-width="16"/>
  <line x1="720" y1="364" x2="720" y2="500" stroke="%23b07d58" stroke-width="16"/>
  <!-- Terracotta Tulsi Kyondo Planter -->
  <polygon points="340,490 460,490 445,350 355,350" fill="%23c85a32"/>
  <rect x="345" y="338" width="110" height="16" rx="4" fill="%23b24c26"/>
  <polygon points="330,338 470,338 450,320 350,320" fill="%23d6683f"/>
  <!-- Auspicious Om symbol on planter -->
  <circle cx="400" cy="410" r="18" fill="%23ffffff" opacity="0.75"/>
  <text x="393" y="416" font-size="16" fill="%23b24c26" font-weight="bold">ॐ</text>
  <!-- Tulsi Leaves Cluster -->
  <circle cx="400" cy="270" r="50" fill="%232d6a4f"/>
  <circle cx="360" cy="285" r="42" fill="%2340916c"/>
  <circle cx="440" cy="280" r="45" fill="%2352b788"/>
  <circle cx="400" cy="230" r="42" fill="%2352b788"/>
  <circle cx="370" cy="215" r="32" fill="%2374c69d"/>
  <circle cx="430" cy="220" r="35" fill="%2374c69d"/>
  <circle cx="400" cy="180" r="25" fill="%2395d5b2"/>
  <!-- Jasmine Blossoms -->
  <circle cx="340" cy="240" r="8" fill="%23ffffff"/>
  <circle cx="460" cy="250" r="9" fill="%23ffffff"/>
  <circle cx="390" cy="190" r="7" fill="%23ffffff"/>
  <circle cx="420" cy="160" r="8" fill="%23ffffff"/>
  <!-- Verandah tile floor -->
  <rect x="0" y="470" width="800" height="30" fill="%237f4f24"/>
  <!-- Badge text -->
  <rect x="30" y="440" width="220" height="34" rx="8" fill="%23ffffff" opacity="0.92"/>
  <text x="45" y="463" font-family="sans-serif" font-size="14" font-weight="bold" fill="%232d6a4f">🌿 Verandah Garden, 2005</text>
</svg>`;

export const SEED_PHOTO_WEDDING = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="100%" height="100%">
  <defs>
    <linearGradient id="weddingWarmth" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="%23fff1e6"/>
      <stop offset="60%" stop-color="%23fde2e4"/>
      <stop offset="100%" stop-color="%23fad2e1"/>
    </linearGradient>
  </defs>
  <rect width="800" height="500" fill="url(%23weddingWarmth)"/>
  <!-- Mandap Golden Pillars -->
  <rect x="120" y="80" width="36" height="420" rx="6" fill="%23e09f3e"/>
  <rect x="644" y="80" width="36" height="420" rx="6" fill="%23e09f3e"/>
  <!-- Marigold flower toran & canopies -->
  <path d="M 120 120 Q 400 200 680 120" stroke="%23ff9f1c" stroke-width="18" stroke-dasharray="24 10" fill="none"/>
  <path d="M 120 160 Q 400 240 680 160" stroke="%23d90429" stroke-width="12" stroke-dasharray="20 10" fill="none"/>
  <!-- Assamese Brass Xorai (Traditional Royal Offering Vessel) -->
  <ellipse cx="400" cy="460" rx="65" ry="18" fill="%23b8860b"/>
  <polygon points="380,450 420,450 410,380 390,380" fill="%23daa520"/>
  <ellipse cx="400" cy="380" rx="50" ry="16" fill="%23ffd700"/>
  <path d="M 400 370 Q 412 340 400 310 Q 388 340 400 370 Z" fill="%23d4af37"/>
  <!-- Golden Mekhela Sador motifs -->
  <polygon points="260,260 290,300 230,300" fill="%23d4af37" opacity="0.75"/>
  <polygon points="540,260 570,300 510,300" fill="%23d4af37" opacity="0.75"/>
  <circle cx="400" cy="270" r="45" fill="%23b23a48" opacity="0.15"/>
  <!-- Auspicious Brass Diyas on both sides -->
  <circle cx="138" cy="280" r="24" fill="%23ffdf70" opacity="0.6"/>
  <ellipse cx="138" cy="285" rx="14" ry="6" fill="%23b8860b"/>
  <circle cx="662" cy="280" r="24" fill="%23ffdf70" opacity="0.6"/>
  <ellipse cx="662" cy="285" rx="14" ry="6" fill="%23b8860b"/>
  <!-- Badge text -->
  <rect x="30" y="440" width="240" height="34" rx="8" fill="%23ffffff" opacity="0.94"/>
  <text x="45" y="463" font-family="sans-serif" font-size="14" font-weight="bold" fill="%23800f2f">🌸 Priya's Wedding, 2024</text>
</svg>`;

export const SEED_PHOTO_BIRTHDAY = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="100%" height="100%">
  <defs>
    <linearGradient id="birthdaySky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="%23dbeafe"/>
      <stop offset="50%" stop-color="%23ede9fe"/>
      <stop offset="100%" stop-color="%23fae8ff"/>
    </linearGradient>
  </defs>
  <rect width="800" height="500" fill="url(%23birthdaySky)"/>
  <!-- Colorful Party Bunting -->
  <polygon points="40,20 80,80 120,20" fill="%23ef4444"/>
  <polygon points="120,20 160,80 200,20" fill="%233b82f6"/>
  <polygon points="200,20 240,80 280,20" fill="%2310b981"/>
  <polygon points="280,20 320,80 360,20" fill="%23f59e0b"/>
  <polygon points="360,20 400,80 440,20" fill="%238b5cf6"/>
  <polygon points="440,20 480,80 520,20" fill="%23ec4899"/>
  <polygon points="520,20 560,80 600,20" fill="%2306b6d4"/>
  <polygon points="600,20 640,80 680,20" fill="%23f97316"/>
  <polygon points="680,20 720,80 760,20" fill="%2384cc16"/>
  <line x1="20" y1="20" x2="780" y2="20" stroke="%2394a3b8" stroke-width="2"/>
  <!-- Floating Balloons -->
  <circle cx="160" cy="180" r="42" fill="%23ef4444" opacity="0.9"/>
  <path d="M 160 222 Q 170 270 160 310" stroke="%2394a3b8" stroke-width="1.5" fill="none"/>
  <circle cx="230" cy="150" r="38" fill="%233b82f6" opacity="0.9"/>
  <path d="M 230 188 Q 220 250 230 310" stroke="%2394a3b8" stroke-width="1.5" fill="none"/>
  <circle cx="640" cy="160" r="44" fill="%2310b981" opacity="0.9"/>
  <path d="M 640 204 Q 630 260 640 310" stroke="%2394a3b8" stroke-width="1.5" fill="none"/>
  <circle cx="580" cy="190" r="36" fill="%23f59e0b" opacity="0.9"/>
  <path d="M 580 226 Q 590 270 580 310" stroke="%2394a3b8" stroke-width="1.5" fill="none"/>
  <!-- Birthday Table -->
  <rect x="250" y="440" width="300" height="60" rx="8" fill="%23f1f5f9"/>
  <!-- Two Tier Chocolate Birthday Cake -->
  <rect x="330" y="380" width="140" height="60" rx="8" fill="%235c3d2e"/>
  <rect x="350" y="325" width="100" height="55" rx="8" fill="%237b4b35"/>
  <!-- White Cream Frosting Waves -->
  <path d="M 330 380 Q 345 392 360 380 T 390 380 T 420 380 T 450 380 T 470 380" fill="%23fffbeb" stroke="%23fffbeb" stroke-width="8"/>
  <path d="M 350 325 Q 365 337 380 325 T 410 325 T 430 325 T 450 325" fill="%23fffbeb" stroke="%23fffbeb" stroke-width="7"/>
  <!-- 5 Glowing Candles -->
  <rect x="360" y="285" width="6" height="40" fill="%23ef4444"/>
  <circle cx="363" cy="275" r="7" fill="%23fde047"/>
  <rect x="380" y="285" width="6" height="40" fill="%233b82f6"/>
  <circle cx="383" cy="275" r="7" fill="%23fde047"/>
  <rect x="400" y="280" width="6" height="45" fill="%2310b981"/>
  <circle cx="403" cy="270" r="8" fill="%23fde047"/>
  <rect x="420" y="285" width="6" height="40" fill="%23f59e0b"/>
  <circle cx="423" cy="275" r="7" fill="%23fde047"/>
  <rect x="440" y="285" width="6" height="40" fill="%238b5cf6"/>
  <circle cx="443" cy="275" r="7" fill="%23fde047"/>
  <!-- Badge text -->
  <rect x="30" y="440" width="230" height="34" rx="8" fill="%23ffffff" opacity="0.94"/>
  <text x="45" y="463" font-family="sans-serif" font-size="14" font-weight="bold" fill="%236d28d9">🎂 Rahul's 5th Birthday, 2023</text>
</svg>`;
