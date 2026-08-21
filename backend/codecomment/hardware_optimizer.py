import psutil  # Sistem kaynak aracı
import logging  # Kayıt tutma aracı
import subprocess  # Sistem komut aracı

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')  # Kayıt ayarı
logger = logging.getLogger(__name__)  # Kayıtçıyı başlat


def get_free_gpu_vram_gb():  # VRAM hesaplama fonksiyonu
    try:
        result = subprocess.check_output(  # GPU komutu gönder
            ['nvidia-smi', '--query-gpu=memory.free', '--format=csv,nounits,noheader'],  # Boş VRAM komutu
            encoding='utf-8'  # Metin formatı
        )
        free_vram_mb = float(result.strip().split('\n')[0])  # MB değerini ayıkla
        return free_vram_mb / 1024.0  # GB'a çevirip dön
    except (subprocess.CalledProcessError, FileNotFoundError, ValueError):  # Hata/GPU yoksa
        return 0.0  # Sıfır VRAM dön


def optimize_for_hardware():  # Donanım optimizasyon
    try:
        free_ram_gb = psutil.virtual_memory().available / (1024 ** 3)  # Boş RAM GB ile
        cpu_cores = psutil.cpu_count(logical=False) or 2  # Fiziksel CPU çekirdekleri
        free_gpu_gb = get_free_gpu_vram_gb()  # Boş VRAM GB

        logger.info(  # Donanım bilgilerini kaydet
            f"Donanım Durumu: {free_ram_gb:.2f} GB Boş RAM, {cpu_cores} Çekirdek, {free_gpu_gb:.2f} GB Boş VRAM")

        hardware_score = (free_gpu_gb * 5) + (free_ram_gb * 2) + (cpu_cores * 1.5)  # donanım puanı

        logger.info(f"Hesaplanan Donanım Puanı: {hardware_score:.2f}")  # Hesaplanan puanı kaydet

        if hardware_score >= 80:  # Yüksek seviye
            logger.info("Performans Sınıfı: YÜKSEK. Maksimum kapasite kullanılacak.")  # Yüksek performans kaydı
            return {"max_tokens": 2048, "chunk_lines": 50}  # Maksimum sınırları

        elif hardware_score >= 35:  # Orta seviye
            logger.info("Performans Sınıfı: ORTA. Dengeli ayarlar kullanılacak.")  # Orta performans kaydı
            return {"max_tokens": 1024, "chunk_lines": 30}  # Dengeli sınırları

        else:  # Düşük seviye kontrolü
            logger.warning(  # Düşük performans
                "Performans Sınıfı: DÜŞÜK. OutOfMemory (OOM) hatasını önlemek için kısıtlı ayarlar kullanılacak.")
            return {"max_tokens": 512, "chunk_lines": 15}  # Minimum sınırları

    except Exception as e:
        logger.error(f"Donanım analizi sırasında beklenmeyen hata: {str(e)}")  # Hata detayını kaydet
        return {"max_tokens": 1024, "chunk_lines": 30}  # Güvenli ayarları