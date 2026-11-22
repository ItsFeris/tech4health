"""The AI companion's replies. Dhia only (B tunes the wording in prompts/companion.md)."""

from typing import TYPE_CHECKING, Optional

from app.models import PatientContext, RiskResult

if TYPE_CHECKING:
    from app.ai.tools import ToolRun

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


TOOL_FALLBACK = {
    "breathing": {"darija": "Ta3ala netneffsou m3a b3adhna. Tba3 el dayra.", "ar": "تعال نتنفس معاً. اتبع الدائرة.", "fr": "On respire ensemble. Suis le cercle.", "en": "Let's breathe together. Follow the circle."},
    "grounding": {"darija": "Ta3ala nraj3ou lel lahdha hedhi, 5-4-3-2-1.", "ar": "لنعد إلى اللحظة الحالية: ٥-٤-٣-٢-١.", "fr": "Revenons ici et maintenant : 5-4-3-2-1.", "en": "Let's come back to the here and now: 5-4-3-2-1."},
}


async def reply(ctx: PatientContext, user_text: str, risk: RiskResult, tools: Optional["ToolRun"] = None) -> str:
    """Nour's answer. With `tools`, the model may call tools (exercises, mood log...) and the cards land in tools.actions."""
    from app.ai import tools as T

    msgs = [{"role": "system", "content": _system(ctx)}, *_history(ctx)]
    if not msgs[-1:] or msgs[-1]["content"] != anonymize(user_text, [ctx.nickname]):
        msgs.append({"role": "user", "content": anonymize(user_text, [ctx.nickname])})
    if risk.level == "orange":
        msgs.append({"role": "system", "content": "The user seems very distressed. Be extra gentle and mention that their specialist will see them sooner."})

    if tools is None:
        text = await llm.chat_completion(msgs)
    else:
        text = await llm.chat_with_tools(msgs, T.SPECS, lambda name, args: T.execute(name, args, tools))
        if text is None and not tools.actions:  # AI off or failed: obvious requests still open the right card
            await T.run_intents(user_text, tools)
    if text:
        return text.strip()
    if tools and tools.actions and tools.actions[0].type in TOOL_FALLBACK:
        return TOOL_FALLBACK[tools.actions[0].type].get(ctx.language, TOOL_FALLBACK[tools.actions[0].type]["en"])
    return FALLBACK.get(ctx.language, FALLBACK["en"])[len(user_text) % 2]


async def checkin_reply(ctx: PatientContext, mood: int, note: Optional[str]) -> str:
    prompt = f"The user just did their daily mood check-in: {mood}/5." + (f' Their note: "{anonymize(note, [ctx.nickname])}".' if note else "")
    prompt += " Answer in 1 or 2 short sentences: acknowledge it, and ask one gentle question or suggest one small step."
    text = await llm.chat_completion([{"role": "system", "content": _system(ctx)}, {"role": "user", "content": prompt}], max_tokens=150)
    if text:
        return text.strip()
    good = {"darija": "Yesser behi! Chnowa li 3amal nharek mezyen?", "ar": "رائع! ما الذي جعل يومك جيداً؟", "fr": "Super ! Qu'est-ce qui a rendu ta journée bonne ?", "en": "That's great! What made today a good day?"}
    low = {"darija": "Merci 3la sra7tek. T7eb tehki chwaya 3la chnowa sar?", "ar": "شكراً على صراحتك. هل تريد أن تحكي ماذا حدث؟", "fr": "Merci pour ta franchise. Tu veux raconter ce qui s'est passé ?", "en": "Thanks for being honest. Do you want to talk about what happened?"}
    return (good if mood >= 4 else low).get(ctx.language, good["en"] if mood >= 4 else low["en"])
