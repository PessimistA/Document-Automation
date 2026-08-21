import os # İşletim sistemi işlemleri
import shutil # Dosya kopyalama işlemleri
import re # Metin arama aracı
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File as FastAPIFile # Web API ayarları
from sqlalchemy.orm import Session # Veritabanı aracı

from database import get_db # Veritabanına bağlan
from auth import verify_token # Kullanıcı girişini onayla
from bağlantılar.core import log_activity, DOCS_DIR, CodeRequest, DocRequest, InlineEditRequest # Ayarlar ve veri tipleri

from codecomment.hardware_optimizer import optimize_for_hardware # Bilgisayar limitini bul
from codecomment.chunker import split_code_universally # Uzun kodu böl
from codecomment.llm_handler import ask_llm # Yapay zekaya sor
from codecomment.prompts import SYSTEM_COMMENTER, SYSTEM_SUMMARIZER, build_user_prompt # Yapay zeka komutları

from dokuman.utils.logger import logger
from dokuman.utils.hardware import calculate_hardware_profile # Bilgisayar gücünü ölç
from dokuman.core.processor import DocumentProcessor # Belge motoru
from dokuman.core.inline_editor import InlineEditor

router = APIRouter() # API yönlendiriciyi kur
HW_CONFIG = optimize_for_hardware() # Donanım ayarlarını yükle
hw_profile = calculate_hardware_profile() # Donanım gücünü ölç
doc_processor = DocumentProcessor(hw_profile) # Belge motorunu başlat

# Burası koda yorum ekleme
@router.post("/process-code")
async def process_code_endpoint(request: CodeRequest, db: Session = Depends(get_db),
                                current_user_id: int = Depends(verify_token)):
    try:
        chunks = split_code_universally(request.code, HW_CONFIG["chunk_lines"]) # Kodu küçük parçalara ayır
        final_commented_code = [] # Yorumları toplanacağı liste
        running_context = "Dosyanın başlangıcı." # Başlangıç bilgisini ayarla

        for i, chunk in enumerate(chunks): # Parçaları tek tek gez

            user_prompt = build_user_prompt(running_context, chunk) # Yapay zeka sorusunu hazırla
            commented_chunk = await ask_llm(SYSTEM_COMMENTER, user_prompt, HW_CONFIG["max_tokens"]) # Koda yorum yazdır
            final_commented_code.append(commented_chunk) # Yorumlanan kısmı listeye ekle
            running_context = await ask_llm(SYSTEM_SUMMARIZER, chunk, HW_CONFIG["max_tokens"] // 4) # Bir sonraki adım için durumu özetle

        # Yapılan işi veritabanına yaz
        log_activity(db, user_id=current_user_id, action_type="ai_code_processed",
                     details="Yapay zeka tarafından koda yorum eklendi.")
        return {"commented_code": "\n\n".join(final_commented_code)} # Tüm kodu birleştirip geri ver
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Burası belge üretme
@router.post("/api/generate")
def generate_document(req: DocRequest, db: Session = Depends(get_db),
                      current_user_id: int = Depends(verify_token)):
    try:
        result = doc_processor.process_section(req.main_topic, req.section_name, req.text, req.detail_level,
                                               req.language) # Metni işleyip belge üret
        log_activity(db, user_id=current_user_id, action_type="doc_generated",
                     details=f"Yeni AI Dokümanı üretildi: {req.main_topic}") # Üretimi veritabanına yaz
        return {"status": "success", "data": result, "meta": {"model_size": hw_profile["model_size"]}} # Başarılı cevabı dön
    except Exception as e:
        raise HTTPException(status_code=500, detail="Belge üretimi sırasında hata oluştu.")

import re

# Burası satır içi düzenleme
@router.post("/api/edit-inline")
async def edit_inline(req: InlineEditRequest, db: Session = Depends(get_db),
                      current_user_id: int = Depends(verify_token)):
    try:
        words = req.target_text.split() # Seçilen metni kelime kelime ayır
        if not words: # Eğer seçim boşsa
            return {"status": "success", "data": {"updated_document": req.full_document}}

        escaped_words = [re.escape(w) for w in words] # Kelimelerdeki özel işaretleri zararsız yap

        pattern = r'[\s\*\_\#\`\[\]\(\)\.\,\"\']*?'.join(escaped_words) # Aralardaki format işaretlerini yok sayacak şekilde desen

        match = re.search(pattern, req.full_document, flags=re.IGNORECASE) # Tüm belgede hedef kısmı ara

        if not match: # Bulamazsan hata ver
            raise HTTPException(status_code=400,
                                detail="Seçilen metin belgede bulunamadı (Büyük ihtimalle çok uzun bir bölüm seçtiniz).")

        exact_markdown_text = match.group(0) # Bulunan metni tam haliyle al

        # Yapay zeka sadece metni düzelt
        system_prompt = f"Sen bir API'sin. Görevin verilen metni talimata göre YENİDEN YAZMAKTIR. SADECE YENİ METNİ ÇIKTI VER. Açıklama, giriş veya çıkış cümlesi kullanma. Asıl Markdown formatını koru. Hedef Dil: {req.language}"
        user_prompt = f"Talimat: {req.instruction}\n\nDeğiştirilecek Metin:\n{exact_markdown_text}" # Değişecek kısmı ver

        rewritten_text = await ask_llm(system_prompt, user_prompt, HW_CONFIG["max_tokens"] // 2) # Yapay zekadan yeni metin al

        clean_rewritten = rewritten_text.strip().strip('"').strip("'") # Gelen cevabı temizle
        if clean_rewritten.startswith("```"): # Eğer kod bloğu içindeyse içindekini çıkar
            lines = clean_rewritten.split("\n")
            if len(lines) >= 2:
                clean_rewritten = "\n".join(lines[1:-1]).strip()

        updated_doc = req.full_document.replace(exact_markdown_text, clean_rewritten, 1) # Eski metnin yerine yenisini koy

        log_activity(db, user_id=current_user_id, action_type="doc_edited",
                     details="Dokümanda satır içi AI düzenlemesi yapıldı.") # Değişikliği veritabanına yaz

        return {"status": "success", "data": {"updated_document": updated_doc}} # Güncellenmiş belgeyi ver

    except HTTPException:
        raise
    except Exception as e:
        print(f"Satır İçi Düzenleme Hatası: {e}")
        raise HTTPException(status_code=500, detail="Düzenleme sırasında sunucu hatası oluştu.")


# Burası belge kaydetme
@router.post("/api/save-doc")
def save_document(file: UploadFile = FastAPIFile(...), db: Session = Depends(get_db),
                  current_user_id: int = Depends(verify_token)):
    try:
        # İsim temizliği
        safe_filename = "".join(
            [c for c in file.filename if c.isalpha() or c.isdigit() or c in (' ', '.', '_', '-')]).rstrip()

        # Uzantı kontrolü (PDF yerine DOC olarak güncellendi)
        if not safe_filename.lower().endswith(".doc") and not safe_filename.lower().endswith(".docx"):
            safe_filename = f"{safe_filename}.doc"

        user_docs_dir = os.path.join(DOCS_DIR, f"user_{current_user_id}") # Kullanıcı dizini
        os.makedirs(user_docs_dir, exist_ok=True) # Klasör aç
        filepath = os.path.join(user_docs_dir, safe_filename) # Tam yol

        # Diske yaz
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer) # Dosyayı kopyala

        log_activity(db, user_id=current_user_id, action_type="doc_saved",
                     details=f"Word Dokümanı sunucuya kaydedildi: {safe_filename}") # Kaydı logla

        return {"status": "success", "message": "Belge başarıyla kaydedildi.", "path": filepath} # Yanıtı ver
    except Exception as e:
        raise HTTPException(status_code=500, detail="Dosya sunucuya kaydedilemedi.")


# Burası sistemin sağlık durumunu kontrol etme
@router.get("/api/health")
def health_check():
    return {"status": "ok", "model_size": hw_profile["model_size"]} # Sistem çalışıyor mu diye cevap verme