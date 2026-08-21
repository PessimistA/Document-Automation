class PlanEngine:
    def __init__(self, llm):
        self.llm = llm
    #planlama burada yapılır
    def generate_plan(self, main_topic, full_text, language="Turkish"):
        system_msg = f"""
You are an expert academic documentation planner.

TASK:
Design a clear and logical markdown outline for a Turkish academic documentation section.

STRICT STRUCTURE RULES:
1. Use ONLY the following heading hierarchy:
### Main Subsection
#### Sub Subsection
2. Produce between 3 and 5 H3 headings (###).
3. Each H3 may contain 1 to 3 H4 headings (####).
4. H3 headings must represent major conceptual blocks.
5. H4 headings must represent specific aspects, mechanisms, or examples.

CONTENT RULES:
- Headings must be conceptually distinct.
- Avoid repeating the same idea.
- Avoid generic headings like "General Information".
- All headings MUST be in professional {language}.
- CRITICAL TRANSLATION: If the Main Topic or Reference Notes are provided in any other language, you MUST translate their meanings and generate the headings ENTIRELY in {language}. Do NOT use the original language in your output.

IMPORTANT:
- Do NOT write any explanations, paragraphs, or bullet points.
- Do NOT output "Thinking Process" or any meta-commentary.
- OUTPUT ONLY THE MARKDOWN HEADINGS.

[START OF OUTLINE]
###
"""

        user_msg = f"Main Topic: {main_topic}\n\nContent:\n{full_text}\n\nGenerate ONLY the markdown outline starting with ### :"

        # Sadece başlık üreteceği için token sınırı düşük
        return self.llm.generate_docs(system_msg, user_msg, 500)