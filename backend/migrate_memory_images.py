from sqlalchemy import text

from database import engine


with engine.begin() as connection:
    connection.execute(
        text(
            "ALTER TABLE memories ADD COLUMN IF NOT EXISTS image_data TEXT"
        )
    )


print("Memory image column migration completed successfully.")
