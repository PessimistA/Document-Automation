from dokuman.utils.logger import logger # Logger modülünü aktar

class InlineEditor: # Satır içi düzenleyici
    def __init__(self, llm, hardware_profile): # Sınıf başlatıcı
        self.llm = llm # LLM motorunu ata
        self.hw = hardware_profile # Donanım profilini ata

    def edit_snippet(self, full_document, target_text, instruction): # Parça düzenleme fonksiyonu
        system_msg = """
You are a surgical academic editor.
Your ONLY task is to rewrite a specific snippet of text based on the user's instructions.

STRICT RULES:
1. Output ONLY the rewritten snippet. Nothing else.
2. DO NOT output the rest of the document.
3. DO NOT output any thinking processes, explanations, or meta-commentary.
4. Match the tone and professional Turkish language of the original document.
5. CRITICAL LIMIT: DO NOT add new Markdown headings (like # or ###) unless they already exist in the TARGET SNIPPET. Output a regular paragraph if the original is a regular paragraph.
""" # Sistem komutunu tanımla

        user_msg = f"""
CONTEXT (For your understanding, do not output this):
{full_document}

---
TARGET SNIPPET TO REWRITE:
{target_text}

---
USER INSTRUCTION:
{instruction}

Rewrite the TARGET SNIPPET according to the USER INSTRUCTION. Return ONLY the newly written text. DO NOT add new headings.
""" # Kullanıcı komutunu tanımla

        logger.info("Inline AI düzenleme başlatıldı...") # Başlangıç logu yaz

        new_snippet = self.llm.generate_docs(  # AI üretimini başlat
            system_msg, # Sistem mesajını gönder
            user_msg, # Kullanıcı mesajını gönder
            self.hw.get("max_tokens", 2048) # Token sınırını belirle
        )

        if not new_snippet or new_snippet.strip() == "":  # Boş yanıt kontrolü
            logger.error("AI düzenlemesi başarısız, orijinal metin korunuyor.")  # Hata logu yaz
            return full_document  # Orijinal metni dön

        updated_document = full_document.replace(target_text, new_snippet.strip())  # Yeni metni entegre et

        logger.info("Inline düzenleme başarıyla tamamlandı.")  # Başarı logu yaz
        return updated_document  # Güncel belgeyi dön