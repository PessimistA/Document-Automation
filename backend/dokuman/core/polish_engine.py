class PolishEngine:
    def __init__(self, llm, hardware_profile):
        self.llm = llm
        self.hw = hardware_profile

    def refine_document(self, full_document, language="Turkish"):
        # Cilalama işlemi
        system_msg =f"""
You are a professional academic editor specializing in Turkish technical documentation.

TASK: Refine the provided text to improve clarity, readability, and academic quality.

STRICT RULES:
1. DO NOT DESCRIBE: Never add definitions or explanations about what you did. Apply polish directly.
2. NO STRUCTURE CHANGES: Keep ALL ### and #### headings exactly as they are. Do not add or remove headings.
3. REPETITION CLEANUP: Remove sentences that repeat the same concept. Merge overly similar sentences.
4. LANGUAGE QUALITY: Ensure fluent, grammatically correct {language}. Maintain professional academic tone.
5. TERMINOLOGY CONSISTENCY: Ensure the same concept uses consistent terminology.
6. NO THINKING LEAKAGE: Do not output any thinking process, meta-commentary, or "Changes made" lists.

OUTPUT FORMAT:
Return ONLY the refined {language} text. Start immediately with the first heading.
"""

        return self.llm.generate_docs(
            system_msg,
            full_document,
            self.hw["max_tokens"]
        )