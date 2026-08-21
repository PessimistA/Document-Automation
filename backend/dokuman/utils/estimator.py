from dokuman.utils.logger import logger

def calculate_optimal_output(input_text, detail_level="normal"):
    # Girdi ne kadar kısa olursa olsun, detay seviyesine göre sabit bir boyut
    base_tokens = {
        "kisa": 600,  # yaklaşık 1 sayfa
        "normal": 1200,  # yaklaşık 2 sayfa
        "detayli": 2500  # yaklaşık 4 sayfa
    }

    target_tokens = base_tokens.get(detail_level, 1200)
    estimated_pages = round(target_tokens / 600, 1)

    logger.info(f"Tahmin: {detail_level} seviye, ~{estimated_pages} sayfa ({target_tokens} token).")

    # yapay zeka özgürlük komutları genişletmek için
    instructions = {
        "kisa": """
FREEDOM MODE (CONCISE):
- Use the user's notes ONLY as a starting seed.
- Actively use your own training data to explain the concepts.
- Write 2-3 dense paragraphs per heading.
""",
        "normal": """
FREEDOM MODE (BALANCED):
- The user's notes are just keywords. You MUST inject your own historical, technical, and academic knowledge.
- Write 3-4 comprehensive paragraphs per heading.
- Feel free to introduce related sub-concepts if they enrich the topic.
""",
        "detayli": """
FREEDOM MODE (COMPREHENSIVE):
- You have FULL PERMISSION to expand massively beyond the user's notes.
- Actively introduce real-world examples, historical evolution, and deep theoretical mechanics from your vast internal knowledge.
- Write 4-6 extensive paragraphs per heading.
- As long as you stay on the main topic, explore every relevant detail.
"""
    }

    return {
        "target_tokens": target_tokens,
        "estimated_pages": estimated_pages,
        "detail_prompt": instructions.get(detail_level, instructions["normal"])
    }