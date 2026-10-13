from collections import defaultdict
from math import sqrt

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
# Supported cognitive games
# ============================================================

GAME_NAMES = [
    "Memory Match",
    "Sequence Memory",
    "Object Recall",
]


# ============================================================
# Difficulty configuration
# ============================================================

DIFFICULTY_ORDER = {
    "Easy": 0,
    "Medium": 1,
    "Hard": 2,
}


GAME_DIFFICULTIES = {
    "Memory Match": [
        "Standard",
    ],

    "Sequence Memory": [
        "Easy",
        "Medium",
        "Hard",
    ],

    "Object Recall": [
        "Easy",
        "Medium",
        "Hard",
    ],
}


# ============================================================
# Utility helpers
# ============================================================

def clamp(
    value: float,
    minimum: float,
    maximum: float,
) -> float:
    return max(
        minimum,
        min(
            value,
            maximum,
        ),
    )


def average(
    values,
):
    if not values:
        return None

    return sum(values) / len(values)


# ============================================================
# Performance status
# ============================================================

def determine_performance_status(
    summary: dict,
) -> str:

    sessions = summary["sessions"]
    trend = summary["trend"]
    recent_accuracy = (
        summary["recent_accuracy"]
    )

    if sessions == 0:
        return "New"

    if sessions < 3:
        return "Not enough data"

    if (
        trend >= 7
        and recent_accuracy >= 70
    ):
        return "Improving"

    if trend <= -7:
        return "Declining"

    return "Stable"


# ============================================================
# Calculate game summary
# ============================================================

def calculate_game_summary(
    sessions,
):
    if not sessions:
        return None

    # Sessions arrive newest -> oldest.
    recent_sessions = sessions[:3]

    older_sessions = sessions[3:6]

    # --------------------------------------------------------
    # Accuracy
    # --------------------------------------------------------

    recent_accuracy_values = [
        float(session.accuracy)
        for session in recent_sessions
    ]

    overall_accuracy_values = [
        float(session.accuracy)
        for session in sessions
    ]

    recent_accuracy = (
        average(
            recent_accuracy_values,
        )
        or 0
    )

    overall_accuracy = (
        average(
            overall_accuracy_values,
        )
        or 0
    )

    # --------------------------------------------------------
    # Mistakes
    # --------------------------------------------------------

    mistake_values = [
        int(session.mistakes)
        for session in recent_sessions
    ]

    average_mistakes = (
        average(
            mistake_values,
        )
        or 0
    )

    # --------------------------------------------------------
    # Trend
    #
    # Recent 3 sessions are compared with the
    # previous 3 sessions where enough data exists.
    # --------------------------------------------------------

    if older_sessions:

        older_accuracy_values = [
            float(session.accuracy)
            for session in older_sessions
        ]

        older_accuracy = (
            average(
                older_accuracy_values,
            )
            or recent_accuracy
        )

        trend = (
            recent_accuracy -
            older_accuracy
        )

    else:
        trend = 0.0

    # --------------------------------------------------------
    # Time trend
    #
    # Time is compared only within the same game.
    # We don't compare raw time between different games.
    # --------------------------------------------------------

    recent_times = [
        float(session.time)
        for session in recent_sessions
        if session.time is not None
        and float(session.time) > 0
    ]

    older_times = [
        float(session.time)
        for session in older_sessions
        if session.time is not None
        and float(session.time) > 0
    ]

    recent_time = (
        average(
            recent_times,
        )
        if recent_times
        else None
    )

    older_time = (
        average(
            older_times,
        )
        if older_times
        else None
    )

    if (
        recent_time is not None
        and older_time is not None
        and older_time > 0
    ):
        time_change_percent = (
            (
                recent_time -
                older_time
            )
            /
            older_time
        ) * 100
    else:
        time_change_percent = 0.0

    # --------------------------------------------------------
    # Accuracy consistency
    #
    # Standard deviation gives us an idea of how
    # variable recent performance has been.
    # --------------------------------------------------------

    if len(recent_accuracy_values) >= 2:

        mean_accuracy = (
            recent_accuracy
        )

        variance = sum(
            (
                value -
                mean_accuracy
            ) ** 2
            for value in recent_accuracy_values
        ) / len(
            recent_accuracy_values
        )

        consistency_std = sqrt(
            variance
        )

    else:
        consistency_std = 0.0

    # --------------------------------------------------------
    # Latest difficulty
    # --------------------------------------------------------

    latest = sessions[0]

    last_difficulty = (
        latest.difficulty
    )

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

        "recent_time": (
            round(
                recent_time,
                1,
            )
            if recent_time is not None
            else None
        ),

        "time_change_percent": round(
            time_change_percent,
            1,
        ),

        "consistency_std": round(
            consistency_std,
            1,
        ),

        "last_difficulty":
            last_difficulty,
    }


# ============================================================
# Calculate personalization priority
# ============================================================

def calculate_priority_score(
    summary: dict,
) -> float:

    sessions = summary["sessions"]

    # --------------------------------------------------------
    # 1. Accuracy need
    #
    # Lower recent accuracy = higher need for practice.
    # --------------------------------------------------------

    accuracy_need = clamp(
        (
            100 -
            summary["recent_accuracy"]
        ) / 100,
        0,
        1,
    )

    # --------------------------------------------------------
    # 2. Trend need
    #
    # Negative performance trend gets more weight.
    # --------------------------------------------------------

    trend_need = clamp(
        (
            -summary["trend"]
        ) / 20,
        0,
        1,
    )

    # --------------------------------------------------------
    # 3. Mistake need
    # --------------------------------------------------------

    mistake_need = clamp(
        summary["average_mistakes"]
        / 4,
        0,
        1,
    )

    # --------------------------------------------------------
    # 4. Time slowdown need
    #
    # A large increase in completion time is treated
    # as a secondary signal only.
    # --------------------------------------------------------

    time_need = clamp(
        summary[
            "time_change_percent"
        ] / 50,
        0,
        1,
    )

    # --------------------------------------------------------
    # 5. Experience-gap bonus
    #
    # Games with very little history receive a small
    # exploration bonus so recommendations don't become
    # permanently focused on only one game.
    # --------------------------------------------------------

    experience_gap = clamp(
        (
            5 -
            sessions
        ) / 5,
        0,
        1,
    )

    # --------------------------------------------------------
    # Weighted priority score
    # --------------------------------------------------------

    score = (
        accuracy_need * 0.45
        +
        trend_need * 0.25
        +
        mistake_need * 0.15
        +
        time_need * 0.05
        +
        experience_gap * 0.10
    )

    return round(
        score * 100,
        2,
    )


# ============================================================
# Difficulty recommendation
# ============================================================

def choose_difficulty(
    game: str,
    summary: dict,
) -> str:

    levels = (
        GAME_DIFFICULTIES[
            game
        ]
    )

    # Fixed difficulty game.
    if len(levels) == 1:
        return levels[0]

    recent_accuracy = (
        summary["recent_accuracy"]
    )

    trend = summary["trend"]

    average_mistakes = (
        summary["average_mistakes"]
    )

    last_difficulty = (
        summary["last_difficulty"]
    )

    # --------------------------------------------------------
    # New user
    # --------------------------------------------------------

    if (
        summary["sessions"] == 0
    ):
        return "Easy"

    # --------------------------------------------------------
    # Get previous valid difficulty
    # --------------------------------------------------------

    if (
        last_difficulty
        not in levels
    ):
        current_level = "Easy"
    else:
        current_level = (
            last_difficulty
        )

    current_index = (
        DIFFICULTY_ORDER.get(
            current_level,
            0,
        )
    )

    # --------------------------------------------------------
    # Strong recent performance
    # --------------------------------------------------------

    strong_performance = (
        recent_accuracy >= 85
        and
        trend >= -5
        and
        average_mistakes <= 1
    )

    # --------------------------------------------------------
    # Clear performance difficulty
    # --------------------------------------------------------

    needs_support = (
        recent_accuracy < 60
        or
        trend <= -10
        or
        (
            summary[
                "time_change_percent"
            ] >= 25
            and
            recent_accuracy < 80
        )
    )

    if needs_support:

        return levels[
            max(
                0,
                current_index - 1,
            )
        ]

    if strong_performance:

        return levels[
            min(
                len(levels) - 1,
                current_index + 1,
            )
        ]

    return current_level


# ============================================================
# Recommendation explanation
# ============================================================

def build_reason(
    game: str,
    difficulty: str,
    summary: dict,
) -> str:

    status = (
        determine_performance_status(
            summary,
        )
    )

    accuracy = (
        summary["recent_accuracy"]
    )

    trend = (
        summary["trend"]
    )

    mistakes = (
        summary["average_mistakes"]
    )

    if status == "New":

        return (
            f"{game} has not been played yet. "
            "Starting with this activity will help "
            "Cognicare build a performance history."
        )

    if status == "Not enough data":

        return (
            f"Your recent {game} accuracy is "
            f"{accuracy}%. More sessions will help "
            "Cognicare personalize future activities."
        )

    if status == "Improving":

        return (
            f"Your recent {game} accuracy is "
            f"{accuracy}% and your performance trend "
            f"is improving. The recommended level is "
            f"{difficulty}."
        )

    if status == "Declining":

        return (
            f"Your recent {game} accuracy is "
            f"{accuracy}% with a recent trend of "
            f"{trend:+.1f} percentage points. "
            f"The recommended level is "
            f"{difficulty} to provide a more comfortable challenge."
        )

    return (
        f"Your recent {game} accuracy is "
        f"{accuracy}% with about "
        f"{mistakes} mistakes per session. "
        f"The recommended level is "
        f"{difficulty}."
    )


# ============================================================
# Recommendation confidence
# ============================================================

def calculate_confidence(
    summary: dict,
) -> str:

    sessions = (
        summary["sessions"]
    )

    if sessions == 0:
        return "low"

    if sessions < 3:
        return "low"

    if sessions < 6:
        return "moderate"

    return "high"


# ============================================================
# Recommendation endpoint
# ============================================================

@router.get("")
def get_recommendation(
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(
        get_db
    ),
):

    # --------------------------------------------------------
    # Read only completed sessions belonging to
    # the currently logged-in user.
    #
    # Personal Memory Recall is intentionally excluded
    # from the three core-game recommendation pool.
    # --------------------------------------------------------

    sessions = (
        db.query(
            GameSession
        )
        .filter(
            GameSession.user_id ==
            current_user.id,

            GameSession.completed ==
            True,

            GameSession.game.in_(
                GAME_NAMES
            ),
        )
        .order_by(
            GameSession.created_at.desc()
        )
        .limit(60)
        .all()
    )

    # --------------------------------------------------------
    # Group sessions by game
    # --------------------------------------------------------

    grouped = defaultdict(list)

    for session in sessions:
        grouped[
            session.game
        ].append(
            session
        )

    # --------------------------------------------------------
    # Calculate all game summaries.
    #
    # Even an unplayed game is included.
    # --------------------------------------------------------

    summaries = {}

    for game in GAME_NAMES:

        summary = (
            calculate_game_summary(
                grouped[game]
            )
        )

        if summary is None:

            summary = {
                "sessions": 0,
                "recent_accuracy": 0,
                "overall_accuracy": 0,
                "average_mistakes": 0,
                "trend": 0,
                "recent_time": None,
                "time_change_percent": 0,
                "consistency_std": 0,
                "last_difficulty": None,
            }

        summary[
            "performance_status"
        ] = determine_performance_status(
            summary
        )

        summary[
            "priority_score"
        ] = calculate_priority_score(
            summary
        )

        summary[
            "confidence"
        ] = calculate_confidence(
            summary
        )

        summaries[
            game
        ] = summary

    # --------------------------------------------------------
    # No game history
    # --------------------------------------------------------

    if not sessions:

        recommended_game = (
            "Memory Match"
        )

        recommended_difficulty = (
            "Standard"
        )

        return {
            "recommendation": {
                "game":
                    recommended_game,

                "difficulty":
                    recommended_difficulty,

                "reason": (
                    "Start with Memory Match "
                    "to begin building your personalized "
                    "performance history."
                ),

                "performance_status":
                    "New",
            },

            "based_on_sessions":
                0,

            "engine":
                "rule-based-v3",

            "personalization":
                "performance-based",

            "confidence":
                "low",

            "game_summaries":
                summaries,
        }

    # --------------------------------------------------------
    # Select highest-priority activity
    # --------------------------------------------------------

    recommended_game = max(
        GAME_NAMES,
        key=lambda game:
            summaries[
                game
            ][
                "priority_score"
            ],
    )

    selected = (
        summaries[
            recommended_game
        ]
    )

    # --------------------------------------------------------
    # Select difficulty
    # --------------------------------------------------------

    recommended_difficulty = (
        choose_difficulty(
            recommended_game,
            selected,
        )
    )

    # --------------------------------------------------------
    # Build reason
    # --------------------------------------------------------

    reason = build_reason(
        recommended_game,
        recommended_difficulty,
        selected,
    )

    # --------------------------------------------------------
    # Final recommendation
    # --------------------------------------------------------

    return {
        "recommendation": {
            "game":
                recommended_game,

            "difficulty":
                recommended_difficulty,

            "reason":
                reason,

            "performance_status":
                selected[
                    "performance_status"
                ],
        },

        "based_on_sessions":
            len(sessions),

        "engine":
            "rule-based-v3",

        "personalization":
            "performance-based",

        "confidence":
            selected[
                "confidence"
            ],

        "game_summaries":
            summaries,
    }