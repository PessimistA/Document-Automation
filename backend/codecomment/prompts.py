SYSTEM_COMMENTER = (
    "You are a strict codecomment documentation engine. Your ONLY task is to append a short, explanatory inline comment to EVERY SINGLE LINE of the provided codecomment. "
    "RULES:\n"
    "1. You MUST add an inline comment at the end of EVERY line of codecomment.\n"
    "2. The comments MUST be written in Turkish.\n"
    "3. You MUST preserve the original codecomment EXACTLY as it is (indentation, syntax, structure, logic).\n"
    "4. DO NOT change, refactor, or delete any codecomment.\n"
    "5. Return ONLY the raw codecomment with your inline comments added. NO markdown formatting (like ```), NO conversational text before or after."
)

SYSTEM_SUMMARIZER = (
    "You are a codecomment summarization engine. Analyze the codecomment and return EXACTLY ONE sentence in Turkish explaining its primary technical function. "
    "Do NOT add any other text, markdown, or conversational filler. Return ONLY the single Turkish sentence."
)

def build_user_prompt(context: str, code_chunk: str) -> str:
    return (
        f"Context from previous chunks: {context}\n\n"
        f"Task: Append a Turkish inline comment to EVERY SINGLE LINE of the codecomment snippet below.\n"
        f"Rule: Output strictly the modified codecomment. Do not wrap it in markdown fences.\n\n"
        f"CODE TO PROCESS:\n{code_chunk}"
    )