from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import SessionLocal
from models import (
    CaregiverLink,
    GameSession,
    Memory,
    Reminder,
    User,
)
from schemas import (
    CaregiverLinkCreate,
    CaregiverLinkDecision,
    CaregiverLinkResponse,
)
from security import get_current_user


router = APIRouter(
    prefix="/caregiver-links",
    tags=["Caregiver Links"],
)


# ============================================================
# Database Dependency
# ============================================================

def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# ============================================================
# Helper — Build Readable Link Response
# ============================================================

def build_link_response(
    link,
    db,
):
    caregiver = (
        db.query(User)
        .filter(User.id == link.caregiver_id)
        .first()
    )

    elderly = (
        db.query(User)
        .filter(User.id == link.elderly_id)
        .first()
    )

    if not caregiver or not elderly:
        raise HTTPException(
            status_code=404,
            detail="A user connected to this caregiver link was not found.",
        )

    return {
        "id": link.id,
        "caregiver_id": caregiver.id,
        "caregiver_name": caregiver.full_name,
        "caregiver_email": caregiver.email,
        "elderly_id": elderly.id,
        "elderly_name": elderly.full_name,
        "elderly_email": elderly.email,
        "status": link.status,
        "created_at": link.created_at,
    }


# ============================================================
# Create Caregiver → Elderly Link Request
# ============================================================

@router.post(
    "",
    response_model=CaregiverLinkResponse,
    status_code=201,
)
def create_link_request(
    link_data: CaregiverLinkCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Only caregivers can send link requests.
    if current_user.role != "caregiver":
        raise HTTPException(
            status_code=403,
            detail="Only caregiver accounts can send link requests.",
        )

    # Find elderly user by email.
    elderly_user = (
        db.query(User)
        .filter(
            User.email == link_data.elderly_email
        )
        .first()
    )

    if not elderly_user:
        raise HTTPException(
            status_code=404,
            detail="No elderly user was found with that email address.",
        )

    # Make sure the target account is actually elderly.
    if elderly_user.role != "elderly":
        raise HTTPException(
            status_code=400,
            detail="The selected account is not an elderly user account.",
        )

    # Prevent self-linking.
    if elderly_user.id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="A user cannot link to their own account.",
        )

    # Check whether this exact relationship already exists.
    existing_link = (
        db.query(CaregiverLink)
        .filter(
            CaregiverLink.caregiver_id == current_user.id,
            CaregiverLink.elderly_id == elderly_user.id,
        )
        .first()
    )

    if existing_link:

        if existing_link.status == "pending":
            raise HTTPException(
                status_code=409,
                detail="A link request is already pending.",
            )

        if existing_link.status == "approved":
            raise HTTPException(
                status_code=409,
                detail="This caregiver is already linked to this elderly user.",
            )

        # Re-use a previously rejected relationship.
        existing_link.status = "pending"

        db.commit()
        db.refresh(existing_link)

        return build_link_response(
            existing_link,
            db,
        )

    # Create a new pending request.
    new_link = CaregiverLink(
        caregiver_id=current_user.id,
        elderly_id=elderly_user.id,
        status="pending",
    )

    db.add(new_link)
    db.commit()
    db.refresh(new_link)

    return build_link_response(
        new_link,
        db,
    )


# ============================================================
# Get Current User's Caregiver Links
# ============================================================

@router.get(
    "",
    response_model=list[CaregiverLinkResponse],
)
def get_my_links(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Caregiver sees outgoing requests.
    if current_user.role == "caregiver":

        links = (
            db.query(CaregiverLink)
            .filter(
                CaregiverLink.caregiver_id
                == current_user.id
            )
            .order_by(
                CaregiverLink.created_at.desc()
            )
            .all()
        )

    # Elderly user sees incoming requests.
    elif current_user.role == "elderly":

        links = (
            db.query(CaregiverLink)
            .filter(
                CaregiverLink.elderly_id
                == current_user.id
            )
            .order_by(
                CaregiverLink.created_at.desc()
            )
            .all()
        )

    else:
        raise HTTPException(
            status_code=403,
            detail="Unsupported user role.",
        )

    return [
        build_link_response(
            link,
            db,
        )
        for link in links
    ]


# ============================================================
# Approve / Reject a Link Request
# ============================================================

@router.put(
    "/{link_id}",
    response_model=CaregiverLinkResponse,
)
def decide_link_request(
    link_id: int,
    decision: CaregiverLinkDecision,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Only elderly users can approve or reject
    # requests sent to their account.
    if current_user.role != "elderly":
        raise HTTPException(
            status_code=403,
            detail="Only elderly users can approve or reject link requests.",
        )

    link = (
        db.query(CaregiverLink)
        .filter(
            CaregiverLink.id == link_id,
            CaregiverLink.elderly_id == current_user.id,
        )
        .first()
    )

    if not link:
        raise HTTPException(
            status_code=404,
            detail="Caregiver link request not found.",
        )

    if link.status != "pending":
        raise HTTPException(
            status_code=400,
            detail="This link request has already been decided.",
        )

    link.status = decision.status

    db.commit()
    db.refresh(link)

    return build_link_response(
        link,
        db,
    )


# ============================================================
# Get Approved Linked Elderly User Data
# ============================================================

@router.get(
    "/{link_id}/data",
)
def get_linked_elderly_data(
    link_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Only caregivers can access linked elderly data.
    if current_user.role != "caregiver":
        raise HTTPException(
            status_code=403,
            detail="Only caregiver accounts can access linked elderly data.",
        )

    # The link must belong to the currently logged-in caregiver
    # and must already be approved.
    link = (
        db.query(CaregiverLink)
        .filter(
            CaregiverLink.id == link_id,
            CaregiverLink.caregiver_id == current_user.id,
            CaregiverLink.status == "approved",
        )
        .first()
    )

    if not link:
        raise HTTPException(
            status_code=404,
            detail="Approved caregiver link not found.",
        )

    # Find the linked elderly account.
    elderly_user = (
        db.query(User)
        .filter(
            User.id == link.elderly_id,
            User.role == "elderly",
            User.is_active.is_(True),
        )
        .first()
    )

    if not elderly_user:
        raise HTTPException(
            status_code=404,
            detail="Linked elderly user was not found.",
        )

    # --------------------------------------------------------
    # Game Sessions
    # --------------------------------------------------------

    sessions = (
        db.query(GameSession)
        .filter(
            GameSession.user_id == elderly_user.id
        )
        .order_by(
            GameSession.created_at.desc()
        )
        .limit(30)
        .all()
    )

    session_data = [
    {
        "id": session.id,
        "game": session.game,
        "difficulty": session.difficulty,
        "accuracy": session.accuracy,
        "mistakes": session.mistakes,
        "time": session.time,
        "created_at": (
            session.created_at.isoformat()
            if session.created_at
            else None
        ),
    }
    for session in sessions
]

    # --------------------------------------------------------
    # Memories
    # --------------------------------------------------------

    memory_count = (
    db.query(Memory)
    .filter(
        Memory.user_id == elderly_user.id
    )
    .count()
)

    # --------------------------------------------------------
    # Reminders
    # --------------------------------------------------------

    reminders = (
        db.query(Reminder)
        .filter(
            Reminder.user_id == elderly_user.id
        )
        .order_by(
            Reminder.created_at.desc()
        )
        .all()
    )

    reminder_data = [
        {
            "id": reminder.id,
            "title": reminder.title,
            "description": reminder.description,
            "category": reminder.category,
            "dueDatetime": (
                reminder.due_datetime.isoformat()
                if reminder.due_datetime
                else None
            ),
            "completed": reminder.completed,

        }
        for reminder in reminders
    ]

    # --------------------------------------------------------
    # Final Response
    # --------------------------------------------------------

    return {
        "link": {
            "id": link.id,
            "status": link.status,
        },
        "elderly_user": {
            "id": elderly_user.id,
            "full_name": elderly_user.full_name,
        },
        "sessions": session_data,
        "memory_count": memory_count,
        "reminders": reminder_data,
    }


# ============================================================
# Delete / Unlink Relationship
# ============================================================

@router.delete(
    "/{link_id}",
)
def delete_link(
    link_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    link = (
        db.query(CaregiverLink)
        .filter(
            CaregiverLink.id == link_id,
        )
        .first()
    )

    if not link:
        raise HTTPException(
            status_code=404,
            detail="Caregiver link not found.",
        )

    # Only the caregiver or elderly user involved
    # in this relationship can remove it.
    if (
        link.caregiver_id != current_user.id
        and link.elderly_id != current_user.id
    ):
        raise HTTPException(
            status_code=403,
            detail="You are not allowed to remove this link.",
        )

    db.delete(link)
    db.commit()

    return {
        "message": "Caregiver link removed successfully.",
    }