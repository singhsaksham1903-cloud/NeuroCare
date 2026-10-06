from collections import defaultdict

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import SessionLocal
from models import GameSession, User
from security import get_current_user


router = APIRouter(
    prefix="/recommendation",
    tags=["Recommendation"],
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
# Configuration
# ============================================================

GAME_NAMES = [
    "Memory Match",
    "Sequence Memory",
    "Object Recall",
]

DIFFICULTY_ORDER = {
    "Easy": 0,
    "Medium": 1,
    "Hard": 2,
}


# ============================================================
# Difficulty Selection
# ============================================================

def choose_difficulty(
    game: str,
    recent_accuracy: float,
    trend: float,
    last_difficulty: str | None,
) -> str:

    # Memory Match currently has only one difficulty.
    if game == "Memory Match":
        return "Standard"

    # User is struggling.
    if recent_accuracy < 60 or trend < -15:
        return "Easy"

    # Strong recent performance.
    if recent_accuracy >= 85 and trend >= -5:

        current_index = DIFFICULTY_ORDER.get(
            last_difficulty or "Easy",
            0,
        )

        next_index = min(
            current_index + 1,
            len(DIFFICULTY_ORDER) - 1,
        )

        return list(DIFFICULTY_ORDER.keys())[
            next_index
        ]

    # Keep current difficulty.
    if last_difficulty in DIFFICULTY_ORDER:
        return last_difficulty

    return "Easy"


# ============================================================
# Calculate Summary for One Game
# ============================================================

def calculate_game_summary(sessions):

    if not sessions:
        return None

    # Sessions are ordered newest -> oldest.
    recent_sessions = sessions[:3]

    recent_accuracy = sum(
        float(session.accuracy)
        for session in recent_sessions
    ) / len(recent_sessions)

    overall_accuracy = sum(
        float(session.accuracy)
        for session in sessions
    ) / len(sessions)

    average_mistakes = sum(
        int(session.mistakes)
        for session in recent_sessions
    ) / len(recent_sessions)

    # Compare recent performance with older performance.
    if len(sessions) >= 4:

        older_sessions = sessions[3:]

        older_accuracy = sum(
            float(session.accuracy)
            for session in older_sessions
        ) / len(older_sessions)

        trend = recent_accuracy - older_accuracy

    else:
        trend = 0.0

    latest = sessions[0]

    return {
        "sessions": len(sessions),
        "recent_accuracy": round(
            recent_accuracy,
            1,
        ),
        "overall_accuracy": round(
            overall_accuracy,
            1,
        ),
        "average_mistakes": round(
            average_mistakes,
            1,
        ),
        "trend": round(
            trend,
            1,
        ),
        "last_difficulty": latest.difficulty,
    }


# ============================================================
# Calculate Need Score
# Higher score = stronger reason to recommend
# ============================================================

def calculate_need_score(summary):

    # Lower accuracy means more practice is needed.
    accuracy_need = max(
        0,
        100 - summary["recent_accuracy"],
    )

    # More mistakes increase the need score.
    mistake_need = min(
        summary["average_mistakes"] * 5,
        30,
    )

    # A declining trend increases the need score.
    decline_need = max(
        0,
        -summary["trend"],
    )

    return (
        accuracy_need * 0.60
        + mistake_need * 0.25
        + decline_need * 0.15
    )


# ============================================================
# Determine Performance Status
# ============================================================

def determine_performance_status(summary):

    if summary["trend"] > 10:
        return "improving"

    if summary["trend"] < -10:
        return "declining"

    return "stable"


# ============================================================
# Build Human-Friendly Explanation
# ============================================================

def build_reason(
    game: str,
    difficulty: str,
    summary: dict,
    performance_status: str,
) -> str:

    if performance_status == "improving":

        return (
            f"Your recent {game} accuracy is "
            f"{summary['recent_accuracy']}% and your "
            "performance is improving. "
            f"Try it at {difficulty} difficulty."
        )

    if performance_status == "declining":

        return (
            f"Your recent {game} accuracy is "
            f"{summary['recent_accuracy']}% and your recent "
            "performance has declined. "
            f"Try it at {difficulty} difficulty."
        )

    return (
        f"Your recent {game} accuracy is "
        f"{summary['recent_accuracy']}% with about "
        f"{summary['average_mistakes']} mistakes per session. "
        f"Try it at {difficulty} difficulty."
    )


# ============================================================
# Recommendation Endpoint
# ============================================================

@router.get("")
def get_recommendation(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    # Only analyze the currently authenticated user's sessions.
    sessions = (
        db.query(GameSession)
        .filter(
            GameSession.user_id == current_user.id
        )
        .order_by(
            GameSession.created_at.desc()
        )
        .limit(30)
        .all()
    )

    # --------------------------------------------------------
    # No sessions yet
    # --------------------------------------------------------

    if not sessions:

        return {
            "recommendation": {
                "game": "Memory Match",
                "difficulty": "Standard",
                "reason": (
                    "Start with a Memory Match session "
                    "to begin building your performance history."
                ),
                "performance_status": "new",
            },
            "based_on_sessions": 0,
            "engine": "rule-based-v2",
        }

    # --------------------------------------------------------
    # Group sessions by game
    # --------------------------------------------------------

    grouped = defaultdict(list)

    for session in sessions:
        grouped[session.game].append(session)

    # --------------------------------------------------------
    # Recommend an unplayed game first
    # --------------------------------------------------------

    unplayed_games = [
        game
        for game in GAME_NAMES
        if not grouped[game]
    ]

    if unplayed_games:

        recommended_game = unplayed_games[0]

        recommended_difficulty = (
            "Standard"
            if recommended_game == "Memory Match"
            else "Easy"
        )

        return {
            "recommendation": {
                "game": recommended_game,
                "difficulty": recommended_difficulty,
                "reason": (
                    f"You have not played "
                    f"{recommended_game} yet. "
                    "Try it to build more performance history."
                ),
                "performance_status": "new",
            },
            "based_on_sessions": len(sessions),
            "engine": "rule-based-v2",
        }

    # --------------------------------------------------------
    # Calculate summaries
    # --------------------------------------------------------

    summaries = {}

    for game in GAME_NAMES:

        summary = calculate_game_summary(
            grouped[game]
        )

        if summary is not None:

            summary["need_score"] = round(
                calculate_need_score(summary),
                2,
            )

            summaries[game] = summary

    # --------------------------------------------------------
    # Select game with highest need score
    # --------------------------------------------------------

    recommended_game = max(
        summaries,
        key=lambda game: summaries[game]["need_score"],
    )

    selected = summaries[recommended_game]

    # --------------------------------------------------------
    # Select difficulty
    # --------------------------------------------------------

    recommended_difficulty = choose_difficulty(
        recommended_game,
        selected["recent_accuracy"],
        selected["trend"],
        selected["last_difficulty"],
    )

    # --------------------------------------------------------
    # Determine performance status
    # --------------------------------------------------------

    performance_status = determine_performance_status(
        selected
    )

    # --------------------------------------------------------
    # Build explanation
    # --------------------------------------------------------

    reason = build_reason(
        recommended_game,
        recommended_difficulty,
        selected,
        performance_status,
    )

    # --------------------------------------------------------
    # Final response
    # --------------------------------------------------------

    return {
        "recommendation": {
            "game": recommended_game,
            "difficulty": recommended_difficulty,
            "reason": reason,
            "performance_status": performance_status,
        },
        "based_on_sessions": len(sessions),
        "engine": "rule-based-v2",
        "game_summaries": summaries,
    }