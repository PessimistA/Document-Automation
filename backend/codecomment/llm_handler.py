import json  # Veri dönüştürme aracı
import httpx  # Asenkron ağ aracı
import logging  # Sistem kayıt aracı
import os  # Ortam değişkeni aracı

logger = logging.getLogger(__name__)  # Kayıtçıyı başlat

# Docker veya lokal adres için ortam değişkeni kontrolü
BASE_URL = f'{os.getenv("LLM_URL", "http://localhost:1234/v1")}/chat/completions'  # Dinamik endpoint

async def ask_llm(system_prompt: str, user_prompt: str, max_tokens: int) -> str:  # AI sorgu fonksiyonu
    try:  # Hata denetimi başlat
        logger.info("LM Studio'ya istek gönderiliyor...")  # İstek başlangıç kaydı

        payload = {  # Veri paketi
            "model": "local-model",  # Kullanılacak model
            "messages": [  # Mesaj içeriği
                {"role": "system", "content": system_prompt},  # Sistem komutu
                {"role": "user", "content": user_prompt}  # Kullanıcı komutu
            ],
            "temperature": 0.0,  # Rastgeleliği kapat
            "max_tokens": max_tokens  # Üretim sınırı
        }

        json_data = json.dumps(payload)  # JSON'a dönüştür
        headers = {"Content-Type": "application/json"}  # Başlık bilgisi

        async with httpx.AsyncClient(timeout=None) as client:  # Sınırsız zamanlı bağlantı
            response = await client.post(BASE_URL, content=json_data, headers=headers)  # İsteği gönder
            response.raise_for_status()  # Hata kontrolü yap

            result = response.json()  # Yanıtı çöz
            logger.info("LM Studio yanıtı başarıyla alındı.")  # Başarı kaydı oluştur
            return result["choices"][0]["message"]["content"].strip()  # Temiz metni dön

    except Exception as e:
        logger.error(f"LLM İletişim Hatası: {str(e)}")  # Hatayı sisteme yaz
        raise Exception("Yapay zeka sunucusuna ulaşılamadı veya işlem zaman aşımına uğradı.")  # İşlemi durdur