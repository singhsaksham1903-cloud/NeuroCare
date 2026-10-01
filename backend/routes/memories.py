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


def serialize_memory(memory):
    return {
        "id": memory.id,
        "title": memory.title,
        "description": memory.description,
        "category": memory.category,
        "memoryDate": memory.memory_date,
        "clientMutationId": memory.client_mutation_id,
        "created_at": memory.created_at,
    }


@router.post("", status_code=201)
def create_memory(
    memory: MemoryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if memory.clientMutationId:
        existing_memory = (
            db.query(Memory)
            .filter(
                Memory.user_id == current_user.id,
                Memory.client_mutation_id
                == memory.clientMutationId,
            )
            .first()
        )

        if existing_memory is not None:
            return {
                "message": "Memory already saved",
                "memory": serialize_memory(
                    existing_memory,
                ),
                "idempotent": True,
            }

    try:
        new_memory = Memory(
            user_id=current_user.id,
            title=memory.title,
            description=memory.description,
            category=memory.category,
            memory_date=memory.memoryDate,
            client_mutation_id=memory.clientMutationId,
        )

        db.add(new_memory)
        db.commit()
        db.refresh(new_memory)

        return {
            "message": "Memory saved successfully",
            "memory": serialize_memory(new_memory),
        }

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Could not save memory.",
        )


@router.get("")
def get_memories(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    memories = (
        db.query(Memory)
        .filter(
            Memory.user_id == current_user.id,
        )
        .order_by(Memory.created_at.desc())
        .all()
    )

    return {
        "count": len(memories),
        "memories": [
            serialize_memory(memory)
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

    # A retry of the same client mutation id has already been applied.
    if (
        memory.clientMutationId
        and existing_memory.client_mutation_id
        == memory.clientMutationId
    ):
        return {
            "message": "Memory update already applied",
            "memory": serialize_memory(existing_memory),
            "idempotent": True,
        }

    if memory.title is not None:
        existing_memory.title = memory.title

    if memory.description is not None:
        existing_memory.description = memory.description

    if memory.category is not None:
        existing_memory.category = memory.category

    if "memoryDate" in memory.model_fields_set:
        existing_memory.memory_date = memory.memoryDate

    if memory.clientMutationId:
        existing_memory.client_mutation_id = (
            memory.clientMutationId
        )

    try:
        db.commit()
        db.refresh(existing_memory)

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Could not update memory.",
        )

    return {
        "message": "Memory updated successfully",
        "memory": serialize_memory(existing_memory),
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

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Could not delete memory.",
        )

    return {
        "message": "Memory deleted successfully",
    }
