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


@router.post("", status_code=201)
def create_game_session(
    session: GameSessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
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
        )

        db.add(new_session)
        db.commit()
        db.refresh(new_session)

        return {
            "message": "Game session saved successfully",
            "session": {
                "id": new_session.id,
                "game": new_session.game,
                "difficulty": new_session.difficulty,
                "accuracy": new_session.accuracy,
                "mistakes": new_session.mistakes,
                "time": new_session.time,
                "completed": new_session.completed,
                "matches": new_session.matches,
                "sequenceLength": new_session.sequence_length,
                "targetCount": new_session.target_count,
                "correct": new_session.correct,
                "wrong": new_session.wrong,
                "created_at": new_session.created_at,
            },
        }

    except Exception as error:
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
            GameSession.user_id == current_user.id
        )
        .order_by(GameSession.created_at.desc())
        .all()
    )

    return {
        "count": len(sessions),
        "sessions": [
            {
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
                "created_at": item.created_at,
            }
            for item in sessions
        ],
    }