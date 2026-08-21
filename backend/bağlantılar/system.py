from fastapi import APIRouter
import sys
import os

current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) # Bir üst klasörün yolunu bul
if current_dir not in sys.path: # Eğer bu yol sistemde yoksa
    sys.path.append(current_dir) # Yolu sisteme ekle diğer dosyaların görmesi için

from gpu_controller import get_gpu_data # GPU'yu okuyan fonksiyonu içeri al

router = APIRouter()

@router.get("/api/gpu-status") # GPU durumunu öğrenme endpoint
def get_gpu_status():
    try:
        veri = get_gpu_data() # Ekran kartının verilerini oku
        return veri # Okunan veriyi geri ver
    except Exception as e:
        return {"usage": "error", "temp": "error", "hata_detayi": f"FastAPI İçi Hata: {str(e)}"} # Çökerse hata döndür