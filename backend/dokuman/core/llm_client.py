import json  # Veri dönüştürme aracı
import requests  # Veri transfer aracı
import os  # Sistem araçlarını ekle
from dokuman.utils.logger import logger  # Kayıt sistemi aracı
from dokuman.core.model_config import ModelConfig  # Model ayar aracı

class LMStudioClient:  # Yapay zeka kontrolcüsü
    def __init__(self, model_name="local-model", size_category="small", base_url=None):  # Dinamik adres başlat
        # Docker veya lokal adresi seç
        self.base_url = base_url or os.getenv("LLM_URL", "http://localhost:1234/v1") # Adresi sistemden al
        self.config = ModelConfig(model_name, size_category)  # Ayarları yükle

    def generate_docs(self, system_msg, user_msg, max_tokens):  # Üretim fonksiyonu
        try:
            safe_tokens = min(max_tokens, self.config.max_context)  # Güvenli sınır ayarla

            payload = {
                "model": self.config.model_name,  # Model ismini ver
                "messages": [  # Mesaj içeriği
                    {"role": "system", "content": system_msg},  # Sistem mesajı
                    {"role": "user", "content": user_msg}  # Kullanıcı mesajı
                ],
                "max_tokens": safe_tokens,  # Token sınırı
                "temperature": self.config.temperature,  # Yaratıcılık ayarı
                "top_p": 0.9  # Seçenek filtresi
            }

            json_data = json.dumps(payload, ensure_ascii=False).encode('utf-8')  # Karakter koruması
            headers = {"Content-Type": "application/json; charset=utf-8"}  # Başlık bilgisi
            endpoint = f"{self.base_url}/chat/completions"  # Hedef uç nokta

            response = requests.post(endpoint, data=json_data, headers=headers, timeout=None)  # İstek gönder
            response.raise_for_status()

            result = response.json()  # Yanıtı çöz
            return result["choices"][0]["message"]["content"]  # Metni döndür

        except Exception as e:
            logger.error(f"LLM API Hatası: {e}")  # Hatayı kaydet
            raise Exception("Yapay zeka sunucusuna ulaşılamadı.") # Kullanıcıyı bilgilendir