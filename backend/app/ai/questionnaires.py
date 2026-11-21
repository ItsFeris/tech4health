"""PHQ-9 / GAD-7 scoring with the standard published cut-offs. Dhia only."""

from app.errors import ApiError

LENGTH = {"phq9": 9, "gad7": 7}


def severity_for(kind: str, score: int) -> str:
    if score <= 4:
        return "minimal"
    if score <= 9:
        return "mild"
    if score <= 14:
        return "moderate"
    if kind == "gad7":
        return "severe"
    return "moderately_severe" if score <= 19 else "severe"


def score(kind: str, answers: list[int]) -> tuple[int, str]:
    if len(answers) != LENGTH[kind] or any(a not in (0, 1, 2, 3) for a in answers):
        raise ApiError(422, "validation", f"{kind} needs {LENGTH[kind]} answers, each 0 to 3")
    total = sum(answers)
    return total, severity_for(kind, total)
