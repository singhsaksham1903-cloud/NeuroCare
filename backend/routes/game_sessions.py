from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import SessionLocal
from models import GameSession, User
from schemas import GameSessionCreate
from security import get_current_user


router = APIRouter(
    prefix="/game-sessions",
    tags=["Game Sessions"],
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


def serialize_game_session(item):
    return {
        "id": item.id,
        "game": item.game,
        "difficulty": item.difficulty,
        "accuracy": item.accuracy,
        "mistakes": item.mistakes,
        "time": item.time,
        "completed": item.completed,
        "matches": item.matches,
        "sequenceLength": item.sequence_length,
        "targetCount": item.target_count,
        "correct": item.correct,
        "wrong": item.wrong,
        "clientSessionId": item.client_session_id,
        "created_at": item.created_at,
    }


@router.post("", status_code=201)
def create_game_session(
    session: GameSessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Idempotency guard: a retry of the same offline game result
    # returns the already-created row instead of creating a duplicate.
    if session.clientSessionId:
        existing_session = (
            db.query(GameSession)
            .filter(
                GameSession.user_id == current_user.id,
                GameSession.client_session_id
                == session.clientSessionId,
            )
            .first()
        )

        if existing_session is not None:
            return {
                "message": "Game session already saved",
                "session": serialize_game_session(
                    existing_session,
                ),
                "idempotent": True,
            }

    try:
        new_session = GameSession(
            user_id=current_user.id,
            game=session.game,
            difficulty=session.difficulty,
            accuracy=session.accuracy,
            mistakes=session.mistakes,
            time=session.time,
            completed=session.completed,
            matches=session.matches,
            sequence_length=session.sequenceLength,
            target_count=session.targetCount,
            correct=session.correct,
            wrong=session.wrong,
            client_session_id=session.clientSessionId,
        )

        db.add(new_session)
        db.commit()
        db.refresh(new_session)

        return {
            "message": "Game session saved successfully",
            "session": serialize_game_session(new_session),
        }

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Could not save game session.",
        )


@router.get("")
def get_game_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sessions = (
        db.query(GameSession)
        .filter(
            GameSession.user_id == current_user.id,
        )
        .order_by(GameSession.created_at.desc())
        .all()
    )

    return {
        "count": len(sessions),
        "sessions": [
            serialize_game_session(item)
            for item in sessions
        ],
    }
