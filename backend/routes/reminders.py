from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import SessionLocal
from models import Reminder, User
from schemas import ReminderCreate, ReminderUpdate
from security import get_current_user


router = APIRouter(
    prefix="/reminders",
    tags=["Reminders"],
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


def serialize_reminder(reminder):
    return {
        "id": reminder.id,
        "title": reminder.title,
        "description": reminder.description,
        "category": reminder.category,
        "dueDatetime": reminder.due_datetime,
        "completed": reminder.completed,
        "clientMutationId": reminder.client_mutation_id,
        "created_at": reminder.created_at,
    }


@router.post("", status_code=201)
def create_reminder(
    reminder: ReminderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if reminder.clientMutationId:
        existing_reminder = (
            db.query(Reminder)
            .filter(
                Reminder.user_id == current_user.id,
                Reminder.client_mutation_id
                == reminder.clientMutationId,
            )
            .first()
        )

        if existing_reminder is not None:
            return {
                "message": "Reminder already saved",
                "reminder": serialize_reminder(
                    existing_reminder,
                ),
                "idempotent": True,
            }

    try:
        new_reminder = Reminder(
            user_id=current_user.id,
            title=reminder.title,
            description=reminder.description,
            category=reminder.category,
            due_datetime=reminder.dueDatetime,
            completed=reminder.completed,
            client_mutation_id=reminder.clientMutationId,
        )

        db.add(new_reminder)
        db.commit()
        db.refresh(new_reminder)

        return {
            "message": "Reminder saved successfully",
            "reminder": serialize_reminder(new_reminder),
        }

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Could not save reminder.",
        )


@router.get("")
def get_reminders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    reminders = (
        db.query(Reminder)
        .filter(
            Reminder.user_id == current_user.id,
        )
        .order_by(Reminder.created_at.desc())
        .all()
    )

    return {
        "count": len(reminders),
        "reminders": [
            serialize_reminder(reminder)
            for reminder in reminders
        ],
    }


@router.put("/{reminder_id}")
def update_reminder(
    reminder_id: int,
    reminder: ReminderUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing_reminder = (
        db.query(Reminder)
        .filter(
            Reminder.id == reminder_id,
            Reminder.user_id == current_user.id,
        )
        .first()
    )

    if existing_reminder is None:
        raise HTTPException(
            status_code=404,
            detail="Reminder not found",
        )

    if (
        reminder.clientMutationId
        and existing_reminder.client_mutation_id
        == reminder.clientMutationId
    ):
        return {
            "message": "Reminder update already applied",
            "reminder": serialize_reminder(
                existing_reminder,
            ),
            "idempotent": True,
        }

    if reminder.title is not None:
        existing_reminder.title = reminder.title

    if reminder.description is not None:
        existing_reminder.description = (
            reminder.description
        )

    if reminder.category is not None:
        existing_reminder.category = reminder.category

    if "dueDatetime" in reminder.model_fields_set:
        existing_reminder.due_datetime = (
            reminder.dueDatetime
        )

    if reminder.completed is not None:
        existing_reminder.completed = (
            reminder.completed
        )

    if reminder.clientMutationId:
        existing_reminder.client_mutation_id = (
            reminder.clientMutationId
        )

    try:
        db.commit()
        db.refresh(existing_reminder)

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Could not update reminder.",
        )

    return {
        "message": "Reminder updated successfully",
        "reminder": serialize_reminder(existing_reminder),
    }


@router.delete("/{reminder_id}")
def delete_reminder(
    reminder_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing_reminder = (
        db.query(Reminder)
        .filter(
            Reminder.id == reminder_id,
            Reminder.user_id == current_user.id,
        )
        .first()
    )

    if existing_reminder is None:
        raise HTTPException(
            status_code=404,
            detail="Reminder not found",
        )

    try:
        db.delete(existing_reminder)
        db.commit()

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Could not delete reminder.",
        )

    return {
        "message": "Reminder deleted successfully",
    }
