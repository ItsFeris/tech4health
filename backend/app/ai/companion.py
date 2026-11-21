"""The AI companion's replies. Dhia only (B tunes the wording in prompts/companion.md)."""

from typing import Optional

from app.models import PatientContext, RiskResult

from . import llm
from .anonymize import anonymize
from .prompts import load

FALLBACK = {
    "darija": ["Merci li 7kitli. Kifech t7es tawa?", "Fhemtek. T7eb tehkili akthar 3la chnowa sar?"],
    "ar": ["شكراً لأنك شاركتني. كيف تشعر الآن؟", "فهمتك. هل تريد أن تحكي لي أكثر؟"],
    "fr": ["Merci de me l'avoir dit. Comment tu te sens là, maintenant ?", "Je comprends. Tu veux m'en dire un peu plus ?"],
    "en": ["Thank you for telling me. How are you feeling right now?", "I hear you. Do you want to tell me a bit more?"],
}


def _system(ctx: PatientContext) -> str:
    hw = "; ".join(h.title for h in ctx.open_homework) or "none this week"
    return load("companion.md").replace("{nickname}", "the user").replace("{language}", ctx.language).replace("{homework}", hw)


def _history(ctx: PatientContext) -> list[dict]:
    names = [ctx.nickname, ctx.emergency_name or ""]
    return [{"role": "user" if m.sender == "user" else "assistant", "content": anonymize(m.content, names)} for m in ctx.recent_messages[-12:]]


async def reply(ctx: PatientContext, user_text: str, risk: RiskResult) -> str:
    msgs = [{"role": "system", "content": _system(ctx)}, *_history(ctx)]
    if not msgs[-1:] or msgs[-1]["content"] != anonymize(user_text, [ctx.nickname]):
        msgs.append({"role": "user", "content": anonymize(user_text, [ctx.nickname])})
    if risk.level == "orange":
        msgs.append({"role": "system", "content": "The user seems very distressed. Be extra gentle and mention that their specialist will see them sooner."})
    text = await llm.chat_completion(msgs)
    return text.strip() if text else FALLBACK.get(ctx.language, FALLBACK["en"])[len(user_text) % 2]


async def checkin_reply(ctx: PatientContext, mood: int, note: Optional[str]) -> str:
    prompt = f"The user just did their daily mood check-in: {mood}/5." + (f' Their note: "{anonymize(note, [ctx.nickname])}".' if note else "")
    prompt += " Answer in 1 or 2 short sentences: acknowledge it, and ask one gentle question or suggest one small step."
    text = await llm.chat_completion([{"role": "system", "content": _system(ctx)}, {"role": "user", "content": prompt}], max_tokens=150)
    if text:
        return text.strip()
    good = {"darija": "Yesser behi! Chnowa li 3amal nharek mezyen?", "ar": "رائع! ما الذي جعل يومك جيداً؟", "fr": "Super ! Qu'est-ce qui a rendu ta journée bonne ?", "en": "That's great! What made today a good day?"}
    low = {"darija": "Merci 3la sra7tek. T7eb tehki chwaya 3la chnowa sar?", "ar": "شكراً على صراحتك. هل تريد أن تحكي ماذا حدث؟", "fr": "Merci pour ta franchise. Tu veux raconter ce qui s'est passé ?", "en": "Thanks for being honest. Do you want to talk about what happened?"}
    return (good if mood >= 4 else low).get(ctx.language, good["en"] if mood >= 4 else low["en"])
