from sqlalchemy import text

from database import engine


STATEMENTS = [
    "ALTER TABLE game_sessions ADD COLUMN IF NOT EXISTS client_session_id VARCHAR(120)",
    "CREATE UNIQUE INDEX IF NOT EXISTS uq_game_sessions_user_client_id ON game_sessions (user_id, client_session_id)",
    "ALTER TABLE memories ADD COLUMN IF NOT EXISTS client_mutation_id VARCHAR(120)",
    "CREATE UNIQUE INDEX IF NOT EXISTS uq_memories_user_client_mutation_id ON memories (user_id, client_mutation_id)",
    "ALTER TABLE reminders ADD COLUMN IF NOT EXISTS client_mutation_id VARCHAR(120)",
    "CREATE UNIQUE INDEX IF NOT EXISTS uq_reminders_user_client_mutation_id ON reminders (user_id, client_mutation_id)",
]


with engine.begin() as connection:
    for statement in STATEMENTS:
        connection.execute(text(statement))


print("Phase 7 database migration completed successfully.")
