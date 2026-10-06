from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import SessionLocal
from models import Memory, User
from schemas import MemoryCreate, MemoryUpdate
from security import get_current_user


router = APIRouter(
    prefix="/memories",
    tags=["Memories"],
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


@router.post("", status_code=201)
def create_memory(
    memory: MemoryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        new_memory = Memory(
            user_id=current_user.id,
            title=memory.title,
            description=memory.description,
            category=memory.category,
            memory_date=memory.memoryDate,
        )

        db.add(new_memory)
        db.commit()
        db.refresh(new_memory)

        return {
            "message": "Memory saved successfully",
            "memory": {
                "id": new_memory.id,
                "title": new_memory.title,
                "description": new_memory.description,
                "category": new_memory.category,
                "memoryDate": new_memory.memory_date,
                "created_at": new_memory.created_at,
            },
        }

    except Exception as error:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Could not save memory: {error}",
        )


@router.get("")
def get_memories(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    memories = (
        db.query(Memory)
        .filter(
            Memory.user_id == current_user.id
        )
        .order_by(Memory.created_at.desc())
        .all()
    )

    return {
        "count": len(memories),
        "memories": [
            {
                "id": memory.id,
                "title": memory.title,
                "description": memory.description,
                "category": memory.category,
                "memoryDate": memory.memory_date,
                "created_at": memory.created_at,
            }
            for memory in memories
        ],
    }


@router.put("/{memory_id}")
def update_memory(
    memory_id: int,
    memory: MemoryUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing_memory = (
        db.query(Memory)
        .filter(
            Memory.id == memory_id,
            Memory.user_id == current_user.id,
        )
        .first()
    )

    if existing_memory is None:
        raise HTTPException(
            status_code=404,
            detail="Memory not found",
        )

    if memory.title is not None:
        existing_memory.title = memory.title

    if memory.description is not None:
        existing_memory.description = (
            memory.description
        )

    if memory.category is not None:
        existing_memory.category = memory.category

    if memory.memoryDate is not None:
        existing_memory.memory_date = (
            memory.memoryDate
        )

    try:
        db.commit()
        db.refresh(existing_memory)

    except Exception as error:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Could not save memory.",
        )

    return {
        "message": "Memory updated successfully",
        "memory": {
            "id": existing_memory.id,
            "title": existing_memory.title,
            "description": existing_memory.description,
            "category": existing_memory.category,
            "memoryDate": existing_memory.memory_date,
            "created_at": existing_memory.created_at,
        },
    }


@router.delete("/{memory_id}")
def delete_memory(
    memory_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing_memory = (
        db.query(Memory)
        .filter(
            Memory.id == memory_id,
            Memory.user_id == current_user.id,
        )
        .first()
    )

    if existing_memory is None:
        raise HTTPException(
            status_code=404,
            detail="Memory not found",
        )

    try:
        db.delete(existing_memory)
        db.commit()

    except Exception as error:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Could not delete memory.",
        )

    return {
        "message": "Memory deleted successfully",
    }