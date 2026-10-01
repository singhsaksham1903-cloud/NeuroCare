COGNICARE NER — PHASE 12 UI/UX + SCREENSHOT POLISH
====================================================

This patch is built on the Phase 7 project plus the Phase 8 integration patch and
Phase 10 stability patch used for the current working baseline.

Files included:
- src/phase12.css
- src/App.jsx
- src/pages/CognitiveGames.jsx
- src/data/translations.js

Phase 12 changes:
1. Added a single visual polish layer for the dashboard and major pages.
2. Improved elder-friendly spacing, readability, contrast, button sizing and focus states.
3. Added responsive layouts for tablet/mobile widths.
4. Standardized page cards, forms, game screens, performance and caregiver panels.
5. Improved recommendation card presentation.
6. Improved voice, language and offline status controls visually.
7. Preserved existing feature logic and API behavior.
8. Fixed Cognitive Games Personal Memory Recall card numbering so it cannot show "undefined".
9. Changed functional core game buttons from "Coming Soon" to "Play Now" in English,
   Hindi and Assamese so the UI matches the actual implemented behavior.
10. Added reduced-motion support in the new visual layer.

Apply:
Extract this ZIP directly into the existing project folder:
C:\Users\hp\OneDrive\Desktop\cognicare-ner

Replace existing files when prompted.

Verification performed on the source tree in this workspace:
- ESLint: PASS (0 errors, 0 warnings)
- Frontend Vite build: not verified here because the uploaded node_modules contains
  Windows-native Rolldown binaries while this workspace is Linux.

After applying locally, run:
  cd C:\Users\hp\OneDrive\Desktop\cognicare-ner
  npm run lint
  npm run build
  npm run dev

Then visually check:
Dashboard, Cognitive Games, Memory Vault, Reminders, Performance Dashboard,
Caregiver Dashboard/Links, Personal Memory Recall and NER Cultural Recall.
