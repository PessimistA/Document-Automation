import psutil  # Sistem kaynak aracı
import subprocess  # Sistem komut aracı
def get_free_gpu_vram_gb():  # VRAM hesaplama fonksiyonu
    try:
        result = subprocess.check_output(  # GPU komutu gönder
            ['nvidia-smi', '--query-gpu=memory.free', '--format=csv,nounits,noheader'],  # Sadece boş VRAM
            encoding='utf-8'  # Metin formatına çevir
        )
        free_vram_mb = float(result.strip().split('\n')[0])  # İlk sayıyı ayıkla
        return free_vram_mb / 1024.0  # GB'a çevirip dön
    except Exception:  # GPU yoksa
        return 0.0  # Sıfır VRAM

def calculate_hardware_profile():  # Donanım puanı hesapla
    try:
        free_ram_gb = psutil.virtual_memory().available / (1024 ** 3)  # Boş RAM GB türünden
        cpu_cores = psutil.cpu_count(logical=False) or 2  # Fiziksel CPU çekirdekleri sayısı
        free_gpu_gb = get_free_gpu_vram_gb()  # Boş GPU VRAM GB ile

        hardware_score = (free_gpu_gb * 5) + (free_ram_gb * 2) + (cpu_cores * 1.5)  # donanım puanı

        if hardware_score >= 75:  # Ultra seviye kontrolü
            return {  # Ultra ayarlar
                "score": "ULTRA",  # Ultra seviye
                "model_size": "large",  # Büyük model
                "chunk_size": 1500,  # Geniş metin parçası
                "max_tokens": 3000,  # Yüksek token sınırı
                "window_size": 4  # Geniş window size
            }

        elif hardware_score >= 35:  # Yüksek seviye kontrolü
            return {  # Yüksek ayarlar
                "score": "HIGH",  # Yüksek seviye
                "model_size": "medium",  # Orta model
                "chunk_size": 1000,  # Dengeli metin parçası
                "max_tokens": 2000,  # Dengeli token sınırı
                "window_size": 3  # Normal window size
            }

        elif hardware_score >= 14:  # Orta seviye kontrolü
            return {  # Orta ayarlar
                "score": "MEDIUM",  # Orta seviye
                "model_size": "small",  # Küçük model
                "chunk_size": 700,  # Küçük metin parçası
                "max_tokens": 1200,  # Küçük token sınırı
                "window_size": 2  # Küçük window size
            }

        else:  # Düşük seviye kontrolü
            return {  # Düşük ayarlar
                "score": "LOW",  # Düşük seviye
                "model_size": "small",  # Küçük model
                "chunk_size": 400,  # Çok Küçük parça
                "max_tokens": 800,  # Minimum token sınırı
                "window_size": 1  # Tekli geçmiş
            }

    except Exception:  # Genel hata yakalama
        return {  # Güvenli ayarlar
            "score": "FAILSAFE",  # Hata kurtarma seviyesi
            "model_size": "small",  # Küçük model
            "chunk_size": 400,  # Çok küçük parça
            "max_tokens": 800,  # Minimum token sınırı
            "window_size": 1  # Tekli geçmiş
        }