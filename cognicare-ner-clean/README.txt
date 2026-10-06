Cognicare NER — Phase 7 Offline-First Completion

This patch adds:
- local cache for Memories and Reminders
- offline create/update/delete handling for Memories and Reminders
- local Performance fallback while offline
- retry-safe game-session synchronization
- retry-safe Memory/Reminder synchronization
- backend idempotency keys to prevent duplicate replayed writes
- PostgreSQL migration for idempotency columns/indexes

Apply to the current project, not to a fresh copy. Do NOT copy backend/.env or any .venv files from an older project zip.

Files to copy from this patch into the current project:
src/utils/api.js
src/utils/offlineData.js
src/utils/performanceStorage.js
backend/models.py
backend/schemas.py
backend/routes/game_sessions.py
backend/routes/memories.py
backend/routes/reminders.py
backend/migrate_phase7.py

Then follow APP_CHANGE.txt, TRANSLATION_CHANGE.txt and PHASE7_TEST_PLAN.txt.
